require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
const port = process.env.PORT || 6070;

app.use(cors());
app.use(express.json());

// Supabase client credentials configured from environment variables or direct bindings
const supabaseUrl = process.env.SUPABASE_URL || 'https://dvyvcqztgmkklswbuqje.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2eXZjcXp0Z21ra2xzd2J1cWplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTgyMTE5OCwiZXhwIjoyMTA1Mzk3MTk4fQ.nSnKuiloDVvALgmVi7bTOwWrL-LNXRBSGBTi2rN_A9I';
const supabase = createClient(supabaseUrl, supabaseKey);

// Local SQLite database engine for instant zero-latency fallback persistence
const dbPath = path.join(__dirname, 'link_database.sqlite');
const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

// Initialize local database tables automatically
sqlite.exec(`
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
        bg_gradient TEXT DEFAULT '#6366f1',
        media_url TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        expires_at TEXT NOT NULL,
        likes INTEGER DEFAULT 0
    );
`);

// Seed SQLite initial users
if (sqlite.prepare('SELECT COUNT(*) as count FROM link_users').get().count === 0) {
    const insertUser = sqlite.prepare('INSERT INTO link_users (user_id, name, avatar, status, online, last_seen) VALUES (?, ?, ?, ?, ?, ?)');
    const seedUsers = [
        ['admin', 'System Administrator', '⚡', 'Available for support', 1, 'Just now'],
        ['teacher', 'Demo Teacher', '📚', 'In class', 1, '2m ago'],
        ['student', 'Demo Student', '🎓', 'Studying Math', 0, '15m ago'],
        ['alex_m', 'Alex Morgan', '🚀', 'Building Link Messenger!', 1, 'Just now'],
        ['sarah_j', 'Sarah Jenkins', '🎨', 'Designing UI', 1, '5m ago']
    ];
    for (const u of seedUsers) insertUser.run(...u);
}

if (sqlite.prepare('SELECT COUNT(*) as count FROM link_chats').get().count === 0) {
    sqlite.prepare('INSERT INTO link_chats (chat_id, type, name, participants, last_message, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(
        'chat_announcements', 'group', '📢 Campus Announcements', 'admin,teacher,student,alex_m,sarah_j', 'Welcome to Link Messenger!', new Date().toISOString()
    );
    sqlite.prepare('INSERT INTO link_messages (chat_id, sender_id, sender_name, content, timestamp) VALUES (?, ?, ?, ?, ?)').run(
        'chat_announcements', 'admin', 'System Administrator', 'Welcome to Link Messenger! 🎉', new Date().toISOString()
    );
}

// Data Normalizers
const normUser = r => ({ id: r.id, userId: r.user_id || r.userId, name: r.name, avatar: r.avatar, status: r.status, online: r.online, lastSeen: r.last_seen || r.lastSeen });
const normChat = r => ({ id: r.id, chatId: r.chat_id || r.chatId, type: r.type, name: r.name, participants: r.participants, lastMessage: r.last_message || r.lastMessage, updatedAt: r.updated_at || r.updatedAt });
const normMsg = r => ({ id: r.id, chatId: r.chat_id || r.chatId, senderId: r.sender_id || r.senderId, senderName: r.sender_name || r.senderName, content: r.content, attachment: r.attachment, reaction: r.reaction, timestamp: r.timestamp });
const normStatus = r => ({ id: r.id, userId: r.user_id || r.userId, userName: r.user_name || r.userName, userAvatar: r.user_avatar || r.userAvatar, content: r.content, bgGradient: r.bg_gradient || r.bgGradient, mediaUrl: r.media_url || r.mediaUrl, createdAt: r.created_at || r.createdAt, expiresAt: r.expires_at || r.expiresAt, likes: r.likes });

// GET Users
app.get('/api/link_users', async (req, res) => {
    try {
        const { data, error } = await supabase.from('link_users').select('*').order('id', { ascending: true });
        if (!error && data) return res.json(data.map(normUser));
    } catch (e) {}

    const rows = sqlite.prepare('SELECT * FROM link_users ORDER BY id ASC').all();
    res.json(rows.map(normUser));
});

// GET Chats
app.get('/api/link_chats', async (req, res) => {
    try {
        const { data, error } = await supabase.from('link_chats').select('*').order('updated_at', { ascending: false });
        if (!error && data) return res.json(data.map(normChat));
    } catch (e) {}

    const rows = sqlite.prepare('SELECT * FROM link_chats ORDER BY updated_at DESC').all();
    res.json(rows.map(normChat));
});

// GET Messages
app.get('/api/link_messages', async (req, res) => {
    const { chatId } = req.query;
    try {
        let query = supabase.from('link_messages').select('*');
        if (chatId) query = query.eq('chat_id', chatId);
        const { data, error } = await query.order('id', { ascending: true });
        if (!error && data) return res.json(data.map(normMsg));
    } catch (e) {}

    let rows;
    if (chatId) {
        rows = sqlite.prepare('SELECT * FROM link_messages WHERE chat_id = ? ORDER BY id ASC').all(chatId);
    } else {
        rows = sqlite.prepare('SELECT * FROM link_messages ORDER BY id ASC').all();
    }
    res.json(rows.map(normMsg));
});

// GET Statuses
app.get('/api/link_statuses', async (req, res) => {
    const now = new Date().toISOString();
    try {
        const { data, error } = await supabase.from('link_statuses').select('*').gt('expires_at', now).order('id', { ascending: false });
        if (!error && data) return res.json(data.map(normStatus));
    } catch (e) {}

    const rows = sqlite.prepare('SELECT * FROM link_statuses WHERE expires_at > ? ORDER BY id DESC').all(now);
    res.json(rows.map(normStatus));
});

// Signup / Account Sync Endpoint
app.post('/api/link_users/signup', async (req, res) => {
    const { userId, name, avatar, status } = req.body;
    if (!userId || !name) {
        return res.status(400).json({ error: 'userId and name are required' });
    }

    const userData = {
        user_id: userId,
        name: name,
        avatar: avatar || '⚡',
        status: status || 'Hey there! I am using Link.',
        online: 1,
        last_seen: 'Just now'
    };

    // Attempt Supabase REST sync first
    try {
        const { data, error } = await supabase.from('link_users').upsert(userData, { onConflict: 'user_id' }).select().single();
        if (!error && data) {
            try {
                const { data: chatData } = await supabase.from('link_chats').select('*').eq('chat_id', 'chat_announcements').single();
                if (chatData) {
                    const members = chatData.participants ? chatData.participants.split(',') : [];
                    if (!members.includes(userId)) {
                        members.push(userId);
                        await supabase.from('link_chats').update({ participants: members.join(',') }).eq('chat_id', 'chat_announcements');
                        await supabase.from('link_messages').insert({ chat_id: 'chat_announcements', sender_id: 'system', sender_name: 'System', content: `${name} joined Link Messenger! 👋` });
                    }
                }
            } catch (err) {}
            return res.status(200).json(normUser(data));
        }
    } catch (e) {}

    // Zero-config SQLite persistence fallback
    const existingUser = sqlite.prepare('SELECT * FROM link_users WHERE user_id = ?').get(userId);
    let user;
    if (existingUser) {
        sqlite.prepare('UPDATE link_users SET name = ?, avatar = ?, status = ?, online = 1, last_seen = ? WHERE user_id = ?').run(
            name, avatar || existingUser.avatar || '⚡', status || existingUser.status || 'Active on Link', 'Just now', userId
        );
        user = sqlite.prepare('SELECT * FROM link_users WHERE user_id = ?').get(userId);
    } else {
        const result = sqlite.prepare(
            'INSERT INTO link_users (user_id, name, avatar, status, online, last_seen) VALUES (?, ?, ?, ?, 1, ?)'
        ).run(userId, name, avatar || '⚡', status || 'Hey there! I am using Link.', 'Just now');
        user = sqlite.prepare('SELECT * FROM link_users WHERE id = ?').get(result.lastInsertRowid);

        const announcementsChat = sqlite.prepare('SELECT * FROM link_chats WHERE chat_id = ?').get('chat_announcements');
        if (announcementsChat) {
            const members = announcementsChat.participants ? announcementsChat.participants.split(',') : [];
            if (!members.includes(userId)) {
                members.push(userId);
                sqlite.prepare('UPDATE link_chats SET participants = ? WHERE chat_id = ?').run(members.join(','), 'chat_announcements');
                sqlite.prepare('INSERT INTO link_messages (chat_id, sender_id, sender_name, content, timestamp) VALUES (?, ?, ?, ?, ?)').run(
                    'chat_announcements', 'system', 'System', `${name} joined Link Messenger! 👋`, new Date().toISOString()
                );
            }
        }
    }
    res.status(200).json(normUser(user));
});

// Start Direct Chat
app.post('/api/link_chats/direct', async (req, res) => {
    const { currentUserId, targetUserId } = req.body;
    if (!currentUserId || !targetUserId) return res.status(400).json({ error: 'currentUserId and targetUserId required' });

    let targetUser = null;
    try {
        const { data } = await supabase.from('link_users').select('*').eq('user_id', targetUserId).single();
        if (data) targetUser = normUser(data);
    } catch (e) {}

    if (!targetUser) {
        const row = sqlite.prepare('SELECT * FROM link_users WHERE user_id = ?').get(targetUserId);
        if (row) targetUser = normUser(row);
    }

    if (!targetUser) return res.status(404).json({ error: 'Target user not found' });

    const chatId = `chat_${currentUserId}_${targetUserId}`;
    const participants = `${currentUserId},${targetUserId}`;
    const updatedAt = new Date().toISOString();

    const chatData = {
        chat_id: chatId,
        type: 'direct',
        name: targetUser.name,
        participants: participants,
        last_message: 'Chat started',
        updated_at: updatedAt
    };

    try {
        const { data, error } = await supabase.from('link_chats').upsert(chatData, { onConflict: 'chat_id' }).select().single();
        if (!error && data) return res.json(normChat(data));
    } catch (e) {}

    const existing = sqlite.prepare("SELECT * FROM link_chats WHERE chat_id = ?").get(chatId);
    if (existing) return res.json(normChat(existing));

    const result = sqlite.prepare('INSERT INTO link_chats (chat_id, type, name, participants, last_message, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(chatId, 'direct', targetUser.name, participants, 'Chat started', updatedAt);
    const newChat = sqlite.prepare('SELECT * FROM link_chats WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(normChat(newChat));
});

// Create Group Chat
app.post('/api/link_chats/group', async (req, res) => {
    const { name, creatorId, participantIds } = req.body;
    if (!name || !creatorId || !participantIds) return res.status(400).json({ error: 'Invalid parameters' });

    const allParticipants = Array.from(new Set([creatorId, ...participantIds])).join(',');
    const chatId = `group_${Date.now()}`;
    const updatedAt = new Date().toISOString();

    const groupData = {
        chat_id: chatId,
        type: 'group',
        name: `👥 ${name}`,
        participants: allParticipants,
        last_message: 'Group created',
        updated_at: updatedAt
    };

    try {
        const { data, error } = await supabase.from('link_chats').insert(groupData).select().single();
        if (!error && data) {
            await supabase.from('link_messages').insert({ chat_id: chatId, sender_id: creatorId, sender_name: 'System', content: `Group "${name}" was created.` });
            return res.status(201).json(normChat(data));
        }
    } catch (e) {}

    const result = sqlite.prepare('INSERT INTO link_chats (chat_id, type, name, participants, last_message, updated_at) VALUES (?, ?, ?, ?, ?, ?)').run(chatId, 'group', `👥 ${name}`, allParticipants, 'Group created', updatedAt);
    sqlite.prepare('INSERT INTO link_messages (chat_id, sender_id, sender_name, content, timestamp) VALUES (?, ?, ?, ?, ?)').run(chatId, creatorId, 'System', `Group "${name}" was created.`, updatedAt);
    const newGroup = sqlite.prepare('SELECT * FROM link_chats WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(normChat(newGroup));
});

// Add Members to Group
app.post('/api/link_chats/:chatId/members', async (req, res) => {
    const { chatId } = req.params;
    const { newParticipantIds } = req.body;

    try {
        const { data: chat } = await supabase.from('link_chats').select('*').eq('chat_id', chatId).single();
        if (chat) {
            const currentMembers = chat.participants ? chat.participants.split(',') : [];
            const updatedMembers = Array.from(new Set([...currentMembers, ...newParticipantIds]));
            const { data: updated } = await supabase.from('link_chats').update({ participants: updatedMembers.join(','), updated_at: new Date().toISOString() }).eq('chat_id', chatId).select().single();
            await supabase.from('link_messages').insert({ chat_id: chatId, sender_id: 'system', sender_name: 'System', content: `${newParticipantIds.join(', ')} added to group.` });
            return res.json(normChat(updated));
        }
    } catch (e) {}

    const chat = sqlite.prepare('SELECT * FROM link_chats WHERE chat_id = ?').get(chatId);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });

    const currentMembers = chat.participants ? chat.participants.split(',') : [];
    const updatedMembers = Array.from(new Set([...currentMembers, ...newParticipantIds]));
    sqlite.prepare('UPDATE link_chats SET participants = ?, updated_at = ? WHERE chat_id = ?').run(updatedMembers.join(','), new Date().toISOString(), chatId);
    sqlite.prepare('INSERT INTO link_messages (chat_id, sender_id, sender_name, content, timestamp) VALUES (?, ?, ?, ?, ?)').run(chatId, 'system', 'System', `${newParticipantIds.join(', ')} added to group.`, new Date().toISOString());

    const updatedChat = sqlite.prepare('SELECT * FROM link_chats WHERE chat_id = ?').get(chatId);
    res.json(normChat(updatedChat));
});

// Send Instant Message
app.post('/api/link_messages', async (req, res) => {
    const { chatId, senderId, senderName, content } = req.body;
    const timestamp = new Date().toISOString();

    const msgData = { chat_id: chatId, sender_id: senderId || 'admin', sender_name: senderName || 'System Administrator', content, timestamp };

    try {
        const { data, error } = await supabase.from('link_messages').insert(msgData).select().single();
        if (!error && data) {
            await supabase.from('link_chats').update({ last_message: `${senderName}: ${content}`, updated_at: timestamp }).eq('chat_id', chatId);
            return res.status(201).json(normMsg(data));
        }
    } catch (e) {}

    const result = sqlite.prepare('INSERT INTO link_messages (chat_id, sender_id, sender_name, content, timestamp) VALUES (?, ?, ?, ?, ?)').run(chatId, senderId || 'admin', senderName || 'System Administrator', content, timestamp);
    sqlite.prepare('UPDATE link_chats SET last_message = ?, updated_at = ? WHERE chat_id = ?').run(`${senderName}: ${content}`, timestamp, chatId);
    const newMsg = sqlite.prepare('SELECT * FROM link_messages WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(normMsg(newMsg));
});

// Share 24-Hour Status Story
app.post('/api/link_statuses', async (req, res) => {
    const { userId, userName, userAvatar, content, bgGradient } = req.body;
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 86400000).toISOString();

    const statusData = { user_id: userId || 'admin', user_name: userName || 'System Administrator', user_avatar: userAvatar || '⚡', content, bg_gradient: bgGradient || '#6366f1', created_at: createdAt, expires_at: expiresAt };

    try {
        const { data, error } = await supabase.from('link_statuses').insert(statusData).select().single();
        if (!error && data) return res.status(201).json(normStatus(data));
    } catch (e) {}

    const result = sqlite.prepare('INSERT INTO link_statuses (user_id, user_name, user_avatar, content, bg_gradient, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(userId || 'admin', userName || 'System Administrator', userAvatar || '⚡', content, bgGradient || '#6366f1', createdAt, expiresAt);
    const newStatus = sqlite.prepare('SELECT * FROM link_statuses WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(normStatus(newStatus));
});

app.listen(port, '0.0.0.0', () => {
    console.log(`⚡ Link Messenger Backend active on port ${port} synced with Supabase & SQLite`);
});
