require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const port = process.env.PORT || 6070;

app.use(cors());
app.use(express.json());

// SQLite database persistence
const dbPath = path.join(__dirname, 'link_database.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// Initialize database tables
db.exec(`
    CREATE TABLE IF NOT EXISTS link_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        avatar TEXT DEFAULT '⚡',
        status TEXT DEFAULT 'Hey there! I am using Link.',
        online INTEGER DEFAULT 1,
        last_seen TEXT DEFAULT 'Just now'
    );

    CREATE TABLE IF NOT EXISTS link_chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id TEXT UNIQUE NOT NULL,
        type TEXT DEFAULT 'direct',
        name TEXT NOT NULL,
        participants TEXT NOT NULL,
        last_message TEXT DEFAULT 'Chat started',
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS link_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        sender_name TEXT NOT NULL,
        content TEXT NOT NULL,
        attachment TEXT,
        reaction TEXT,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS link_statuses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        user_avatar TEXT DEFAULT '⚡',
        content TEXT NOT NULL,
        bg_gradient TEXT DEFAULT 'linear-gradient(135deg, #6366f1, #ec4899)',
        media_url TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        expires_at TEXT NOT NULL,
        likes INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS link_status_views (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        status_id INTEGER NOT NULL,
        viewer_id TEXT NOT NULL,
        viewed_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
`);

// Seed initial users if empty
const userCount = db.prepare('SELECT COUNT(*) as count FROM link_users').get().count;
if (userCount === 0) {
    const insertUser = db.prepare('INSERT INTO link_users (user_id, name, avatar, status, online, last_seen) VALUES (?, ?, ?, ?, ?, ?)');
    const seedUsers = [
        ['admin', 'System Administrator', '⚡', 'Available for support', 1, 'Just now'],
        ['teacher', 'Demo Teacher', '📚', 'In class', 1, '2m ago'],
        ['student', 'Demo Student', '🎓', 'Studying Math', 0, '15m ago'],
        ['alex_m', 'Alex Morgan', '🚀', 'Building Link Messenger!', 1, 'Just now'],
        ['sarah_j', 'Sarah Jenkins', '🎨', 'Designing UI', 1, '5m ago']
    ];
    for (const u of seedUsers) {
        insertUser.run(...u);
    }
}

// Seed initial group chat
const chatCount = db.prepare('SELECT COUNT(*) as count FROM link_chats').get().count;
if (chatCount === 0) {
    db.prepare('INSERT INTO link_chats (chat_id, type, name, participants, last_message, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(
        'chat_announcements', 'group', '📢 Campus Announcements', 'admin,teacher,student,alex_m,sarah_j', 'Welcome to Link Messenger!', new Date().toISOString()
    );
    db.prepare('INSERT INTO link_messages (chat_id, sender_id, sender_name, content, timestamp) VALUES (?, ?, ?, ?, ?)').run(
        'chat_announcements', 'admin', 'System Administrator', 'Welcome to Link Messenger with persisted storage! 🎉', new Date().toISOString()
    );
}

// Normalizers
const normUser = r => ({ id: r.id, userId: r.user_id, name: r.name, avatar: r.avatar, status: r.status, online: r.online, lastSeen: r.last_seen });
const normChat = r => ({ id: r.id, chatId: r.chat_id, type: r.type, name: r.name, participants: r.participants, lastMessage: r.last_message, updatedAt: r.updated_at });
const normMsg = r => ({ id: r.id, chatId: r.chat_id, senderId: r.sender_id, senderName: r.sender_name, content: r.content, attachment: r.attachment, reaction: r.reaction, timestamp: r.timestamp });
const normStatus = r => ({ id: r.id, userId: r.user_id, userName: r.user_name, userAvatar: r.user_avatar, content: r.content, bgGradient: r.bg_gradient, mediaUrl: r.media_url, createdAt: r.created_at, expiresAt: r.expires_at, likes: r.likes });

// GET Endpoints
app.get('/api/link_users', (req, res) => {
    const rows = db.prepare('SELECT * FROM link_users ORDER BY id ASC').all();
    res.json(rows.map(normUser));
});

app.get('/api/link_chats', (req, res) => {
    const rows = db.prepare('SELECT * FROM link_chats ORDER BY updated_at DESC').all();
    res.json(rows.map(normChat));
});

app.get('/api/link_messages', (req, res) => {
    const { chatId } = req.query;
    let rows;
    if (chatId) {
        rows = db.prepare('SELECT * FROM link_messages WHERE chat_id = ? ORDER BY id ASC').all(chatId);
    } else {
        rows = db.prepare('SELECT * FROM link_messages ORDER BY id ASC').all();
    }
    res.json(rows.map(normMsg));
});

app.get('/api/link_statuses', (req, res) => {
    const now = new Date().toISOString();
    const rows = db.prepare('SELECT * FROM link_statuses WHERE expires_at > ? ORDER BY id DESC').all(now);
    res.json(rows.map(normStatus));
});

// User Signup / Account Sync Endpoint
app.post('/api/link_users/signup', (req, res) => {
    const { userId, name, avatar, status } = req.body;
    if (!userId || !name) {
        return res.status(400).json({ error: 'userId and name are required' });
    }

    const existingUser = db.prepare('SELECT * FROM link_users WHERE user_id = ?').get(userId);
    let user;

    if (existingUser) {
        db.prepare('UPDATE link_users SET name = ?, avatar = ?, status = ?, online = 1, last_seen = ? WHERE user_id = ?').run(
            name, avatar || existingUser.avatar || '⚡', status || existingUser.status || 'Active on Link', 'Just now', userId
        );
        user = db.prepare('SELECT * FROM link_users WHERE user_id = ?').get(userId);
    } else {
        const result = db.prepare(
            'INSERT INTO link_users (user_id, name, avatar, status, online, last_seen) VALUES (?, ?, ?, ?, 1, ?)'
        ).run(userId, name, avatar || '⚡', status || 'Hey there! I am using Link.', 'Just now');
        user = db.prepare('SELECT * FROM link_users WHERE id = ?').get(result.lastInsertRowid);
    }

    res.status(200).json(normUser(user));
});

// WhatsApp Direct Chat Endpoint
app.post('/api/link_chats/direct', (req, res) => {
    const { currentUserId, targetUserId } = req.body;
    if (!currentUserId || !targetUserId) {
        return res.status(400).json({ error: 'currentUserId and targetUserId are required' });
    }

    const targetUser = db.prepare('SELECT * FROM link_users WHERE user_id = ?').get(targetUserId);
    if (!targetUser) {
        return res.status(404).json({ error: 'Target user not found' });
    }

    const existingChat = db.prepare(
        "SELECT * FROM link_chats WHERE type = 'direct' AND (participants = ? OR participants = ?)"
    ).get(`${currentUserId},${targetUserId}`, `${targetUserId},${currentUserId}`);

    if (existingChat) {
        return res.json(normChat(existingChat));
    }

    const chatId = `chat_${currentUserId}_${targetUserId}`;
    const name = targetUser.name;
    const participants = `${currentUserId},${targetUserId}`;
    const updatedAt = new Date().toISOString();

    const result = db.prepare(
        'INSERT INTO link_chats (chat_id, type, name, participants, last_message, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(chatId, 'direct', name, participants, 'Chat started', updatedAt);

    const newChat = db.prepare('SELECT * FROM link_chats WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(normChat(newChat));
});

// Group Creation Endpoint
app.post('/api/link_chats/group', (req, res) => {
    const { name, creatorId, participantIds } = req.body;
    if (!name || !creatorId || !participantIds || !Array.isArray(participantIds)) {
        return res.status(400).json({ error: 'Group name, creatorId, and participantIds array are required' });
    }

    const allParticipants = Array.from(new Set([creatorId, ...participantIds])).join(',');
    const chatId = `group_${Date.now()}`;
    const updatedAt = new Date().toISOString();

    const result = db.prepare(
        'INSERT INTO link_chats (chat_id, type, name, participants, last_message, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(chatId, 'group', `👥 ${name}`, allParticipants, 'Group created', updatedAt);

    db.prepare('INSERT INTO link_messages (chat_id, sender_id, sender_name, content, timestamp) VALUES (?, ?, ?, ?, ?)').run(
        chatId, creatorId, 'System', `Group "${name}" was created.`, updatedAt
    );

    const groupChat = db.prepare('SELECT * FROM link_chats WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(normChat(groupChat));
});

// Add Members into Group
app.post('/api/link_chats/:chatId/members', (req, res) => {
    const { chatId } = req.params;
    const { newParticipantIds } = req.body;

    if (!newParticipantIds || !Array.isArray(newParticipantIds) || newParticipantIds.length === 0) {
        return res.status(400).json({ error: 'newParticipantIds array is required' });
    }

    const chat = db.prepare('SELECT * FROM link_chats WHERE chat_id = ?').get(chatId);
    if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
    }

    const currentMembers = chat.participants ? chat.participants.split(',') : [];
    const updatedMembers = Array.from(new Set([...currentMembers, ...newParticipantIds]));
    const updatedParticipantsStr = updatedMembers.join(',');
    const updatedAt = new Date().toISOString();

    db.prepare('UPDATE link_chats SET participants = ?, updated_at = ? WHERE chat_id = ?').run(
        updatedParticipantsStr, updatedAt, chatId
    );

    const placeholders = newParticipantIds.map(() => '?').join(',');
    const addedUsers = db.prepare(`SELECT name FROM link_users WHERE user_id IN (${placeholders})`).all(...newParticipantIds);
    const addedNames = addedUsers.map(u => u.name).join(', ') || newParticipantIds.join(', ');

    db.prepare('INSERT INTO link_messages (chat_id, sender_id, sender_name, content, timestamp) VALUES (?, ?, ?, ?, ?)').run(
        chatId, 'system', 'System', `${addedNames} added to the group.`, updatedAt
    );

    const updatedChat = db.prepare('SELECT * FROM link_chats WHERE chat_id = ?').get(chatId);
    res.json(normChat(updatedChat));
});

// Get Group Members
app.get('/api/link_chats/:chatId/members', (req, res) => {
    const { chatId } = req.params;
    const chat = db.prepare('SELECT * FROM link_chats WHERE chat_id = ?').get(chatId);
    if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
    }

    const memberIds = chat.participants ? chat.participants.split(',') : [];
    const placeholders = memberIds.map(() => '?').join(',');
    const members = memberIds.length > 0 ? db.prepare(`SELECT * FROM link_users WHERE user_id IN (${placeholders})`).all(...memberIds) : [];

    res.json(members.map(normUser));
});

// Send Message
app.post('/api/link_messages', (req, res) => {
    const { chatId, senderId, senderName, content, attachment, reaction } = req.body;
    const timestamp = req.body.timestamp || new Date().toISOString();

    const result = db.prepare(
        'INSERT INTO link_messages (chat_id, sender_id, sender_name, content, attachment, reaction, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(chatId, senderId || 'admin', senderName || 'System Administrator', content, attachment || null, reaction || null, timestamp);

    const lastMsgStr = `${senderName || 'System Administrator'}: ${content}`;
    db.prepare('UPDATE link_chats SET last_message = ?, updated_at = ? WHERE chat_id = ?').run(lastMsgStr, timestamp, chatId);

    const newMsg = db.prepare('SELECT * FROM link_messages WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(normMsg(newMsg));
});

// Post Status
app.post('/api/link_statuses', (req, res) => {
    const { userId, userName, userAvatar, content, bgGradient, mediaUrl } = req.body;
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 86400000).toISOString();

    const result = db.prepare(
        'INSERT INTO link_statuses (user_id, user_name, user_avatar, content, bg_gradient, media_url, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(userId || 'admin', userName || 'System Administrator', userAvatar || '⚡', content, bgGradient || '#6366f1', mediaUrl || '', createdAt, expiresAt);

    const newStatus = db.prepare('SELECT * FROM link_statuses WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(normStatus(newStatus));
});

app.listen(port, '0.0.0.0', () => {
    console.log(`⚡ Link Messenger Backend active on port ${port} with persisted database storage`);
});
