const db = require('./db');
const { v4: uuidv4 } = require('uuid');

// User & Device Services
function getSelfProfile() {
    const user = db.prepare('SELECT * FROM users WHERE is_self = 1').get();
    const device = db.prepare('SELECT * FROM devices WHERE user_id = ?').get(user.id);
    return { ...user, device_id: device ? device.device_id : null, device_name: device ? device.device_name : 'Unknown Device' };
}

function updateSelfProfile({ display_name, username, status, about, avatar_url }) {
    db.prepare(`
        UPDATE users
        SET display_name = COALESCE(?, display_name),
            username = COALESCE(?, username),
            status = COALESCE(?, status),
            about = COALESCE(?, about),
            avatar_url = COALESCE(?, avatar_url),
            updated_at = CURRENT_TIMESTAMP
        WHERE is_self = 1
    `).run(display_name, username, status, about, avatar_url);
    return getSelfProfile();
}

function upsertDiscoveredPeer({ device_id, user_id, username, display_name, status, device_name, ip_address, port }) {
    db.transaction(() => {
        let finalUserId = user_id;
        let user = db.prepare('SELECT id FROM users WHERE id = ? OR username = ?').get(user_id, username);
        if (!user) {
            db.prepare(`
                INSERT INTO users (id, username, display_name, status)
                VALUES (?, ?, ?, ?)
            `).run(user_id, username, display_name, status || '🟢 Online');
        } else {
            finalUserId = user.id;
            db.prepare(`
                UPDATE users SET display_name = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
            `).run(display_name, status || '🟢 Online', user.id);
        }

        let device = db.prepare('SELECT device_id FROM devices WHERE device_id = ?').get(device_id);
        if (!device) {
            db.prepare(`
                INSERT INTO devices (device_id, user_id, device_name, ip_address, port, last_seen)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `).run(device_id, finalUserId, device_name, ip_address, port || 5000);
        } else {
            db.prepare(`
                UPDATE devices SET ip_address = ?, port = ?, last_seen = CURRENT_TIMESTAMP WHERE device_id = ?
            `).run(ip_address, port || 5000, device_id);
        }
    })();
}

function getDiscoveredPeers() {
    return db.prepare(`
        SELECT d.device_id, d.device_name, d.ip_address, d.port, d.is_trusted, d.is_blocked, d.last_seen,
               u.id as user_id, u.username, u.display_name, u.avatar_url, u.status, u.about
        FROM devices d
        JOIN users u ON d.user_id = u.id
        WHERE u.is_self = 0 AND d.is_blocked = 0
        ORDER BY d.last_seen DESC
    `).all();
}

// Conversations & Messages
function getOrCreateDirectConversation(peerUserId) {
    const self = getSelfProfile();
    // Verify peerUser exists
    const peerUser = db.prepare('SELECT id FROM users WHERE id = ?').get(peerUserId);
    if (!peerUser) {
        throw new Error(`User with ID ${peerUserId} does not exist`);
    }

    let conv = db.prepare(`
        SELECT c.id FROM conversations c
        JOIN conversation_members cm1 ON c.id = cm1.conversation_id AND cm1.user_id = ?
        JOIN conversation_members cm2 ON c.id = cm2.conversation_id AND cm2.user_id = ?
        WHERE c.type = 'direct'
    `).get(self.id, peerUser.id);

    if (!conv) {
        const convId = 'conv_' + uuidv4().substring(0, 8);
        db.transaction(() => {
            db.prepare(`INSERT INTO conversations (id, type) VALUES (?, 'direct')`).run(convId);
            db.prepare(`INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?)`).run(convId, self.id);
            db.prepare(`INSERT INTO conversation_members (conversation_id, user_id) VALUES (?, ?)`).run(convId, peerUser.id);
        })();
        return convId;
    }
    return conv.id;
}

function createGroupConversation(title, memberUserIds) {
    const self = getSelfProfile();
    const convId = 'grp_' + uuidv4().substring(0, 8);
    db.transaction(() => {
        db.prepare(`INSERT INTO conversations (id, type, title, created_by) VALUES (?, 'group', ?, ?)`).run(convId, title, self.id);
        db.prepare(`INSERT INTO conversation_members (conversation_id, user_id, role) VALUES (?, ?, 'admin')`).run(convId, self.id);
        for (const userId of memberUserIds) {
            if (userId !== self.id) {
                db.prepare(`INSERT INTO conversation_members (conversation_id, user_id, role) VALUES (?, ?, 'member')`).run(convId, userId);
            }
        }
    })();
    return convId;
}

function getConversations() {
    const self = getSelfProfile();
    const convs = db.prepare(`
        SELECT c.id, c.type, c.title, c.avatar_url, c.last_message_at,
               (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
               (SELECT status FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_status,
               (SELECT count(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND status != 'read') as unread_count
        FROM conversations c
        JOIN conversation_members cm ON c.id = cm.conversation_id
        WHERE cm.user_id = ?
        ORDER BY c.last_message_at DESC
    `).all(self.id, self.id);

    return convs.map(conv => {
        if (conv.type === 'direct') {
            const peer = db.prepare(`
                SELECT u.id, u.username, u.display_name, u.avatar_url, u.status, d.device_id, d.ip_address
                FROM conversation_members cm
                JOIN users u ON cm.user_id = u.id
                LEFT JOIN devices d ON d.user_id = u.id
                WHERE cm.conversation_id = ? AND u.id != ?
                LIMIT 1
            `).get(conv.id, self.id);
            return { ...conv, peer };
        }
        const members = db.prepare(`
            SELECT u.id, u.username, u.display_name, u.status, cm.role
            FROM conversation_members cm
            JOIN users u ON cm.user_id = u.id
            WHERE cm.conversation_id = ?
        `).all(conv.id);
        return { ...conv, members };
    });
}

function saveMessage({ id, conversation_id, sender_id, receiver_id, content, message_type = 'text', status = 'pending', parent_id = null }) {
    const msgId = id || uuidv4();

    // Deduplication check
    const existing = db.prepare('SELECT * FROM messages WHERE id = ?').get(msgId);
    if (existing) {
        return existing;
    }

    db.transaction(() => {
        db.prepare(`
            INSERT INTO messages (id, conversation_id, sender_id, receiver_id, content, message_type, status, parent_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(msgId, conversation_id, sender_id, receiver_id, content, message_type, status, parent_id);

        db.prepare(`UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?`).run(conversation_id);
    })();

    return db.prepare('SELECT * FROM messages WHERE id = ?').get(msgId);
}

function updateMessageStatus(messageId, status) {
    db.prepare('UPDATE messages SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, messageId);
    return db.prepare('SELECT * FROM messages WHERE id = ?').get(messageId);
}

function getMessages(conversationId) {
    return db.prepare(`
        SELECT m.*, u.display_name as sender_name, u.username as sender_username,
               (SELECT json_group_array(json_object('id', a.id, 'file_name', a.file_name, 'file_path', a.file_path, 'file_size', a.file_size, 'mime_type', a.mime_type))
                FROM attachments a WHERE a.message_id = m.id) as attachments_json
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.conversation_id = ?
        ORDER BY m.created_at ASC
    `).all(conversationId).map(m => ({
        ...m,
        attachments: m.attachments_json ? JSON.parse(m.attachments_json) : []
    }));
}

function saveAttachment({ message_id, file_name, file_path, file_size, mime_type }) {
    const attachId = uuidv4();
    db.prepare(`
        INSERT INTO attachments (id, message_id, file_name, file_path, file_size, mime_type)
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(attachId, message_id, file_name, file_path, file_size, mime_type);
    return attachId;
}

// Offline Queue Management
function addToOfflineQueue(messageId, targetDeviceId, payload) {
    const queueId = uuidv4();
    db.prepare(`
        INSERT OR REPLACE INTO offline_queue (id, message_id, target_device_id, payload)
        VALUES (?, ?, ?, ?)
    `).run(queueId, messageId, targetDeviceId, JSON.stringify(payload));
}

function getOfflineQueueForDevice(targetDeviceId) {
    return db.prepare('SELECT * FROM offline_queue WHERE target_device_id = ?').all(targetDeviceId);
}

function removeFromOfflineQueue(messageId) {
    db.prepare('DELETE FROM offline_queue WHERE message_id = ?').run(messageId);
}

// Settings & Pairing
function getSettings() {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    return settings;
}

function updateSetting(key, value) {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, String(value));
}

module.exports = {
    getSelfProfile,
    updateSelfProfile,
    upsertDiscoveredPeer,
    getDiscoveredPeers,
    getOrCreateDirectConversation,
    createGroupConversation,
    getConversations,
    saveMessage,
    updateMessageStatus,
    getMessages,
    saveAttachment,
    addToOfflineQueue,
    getOfflineQueueForDevice,
    removeFromOfflineQueue,
    getSettings,
    updateSetting
};
