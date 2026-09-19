const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 6070;

app.use(cors());
app.use(express.json());

// In-memory data store for standalone Link Messenger
const db = {
    users: [
        { id: 1, userId: 'admin', name: 'System Administrator', avatar: '⚡', status: 'Available for support', online: 1, lastSeen: 'Just now' },
        { id: 2, userId: 'teacher', name: 'Demo Teacher', avatar: '📚', status: 'In class', online: 1, lastSeen: '2m ago' },
        { id: 3, userId: 'student', name: 'Demo Student', avatar: '🎓', status: 'Studying Math', online: 0, lastSeen: '15m ago' },
        { id: 4, userId: 'alex_m', name: 'Alex Morgan', avatar: '🚀', status: 'Building Link Messenger!', online: 1, lastSeen: 'Just now' }
    ],
    chats: [
        { id: 1, chatId: 'chat_admin_teacher', type: 'direct', name: 'Demo Teacher', participants: 'admin,teacher', lastMessage: 'Welcome to Link Messenger!', updatedAt: new Date().toISOString() },
        { id: 2, chatId: 'chat_announcements', type: 'group', name: '📢 Campus Announcements', participants: 'admin,teacher,student,alex_m', lastMessage: 'Welcome to the new Link Messenger app!', updatedAt: new Date().toISOString() }
    ],
    messages: [
        { id: 1, chatId: 'chat_admin_teacher', senderId: 'teacher', senderName: 'Demo Teacher', content: 'Hey Admin! Check out this new chat system.', attachment: null, reaction: '👍', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: 2, chatId: 'chat_admin_teacher', senderId: 'admin', senderName: 'System Administrator', content: 'Welcome to Link Messenger!', attachment: null, reaction: '🔥', timestamp: new Date(Date.now() - 1800000).toISOString() },
        { id: 3, chatId: 'chat_announcements', senderId: 'admin', senderName: 'System Administrator', content: 'Welcome to the new Link Messenger app!', attachment: null, reaction: '❤️', timestamp: new Date().toISOString() }
    ],
    statuses: [
        { id: 1, userId: 'alex_m', userName: 'Alex Morgan', userAvatar: '🚀', content: 'Excited to launch Link Messenger today! 💬✨', bgGradient: 'linear-gradient(135deg, #6366f1, #ec4899)', mediaUrl: '', createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 86400000).toISOString(), likes: 5 },
        { id: 2, userId: 'teacher', userName: 'Demo Teacher', userAvatar: '📚', content: 'Grade 10 Physics assignment posted on the portal.', bgGradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)', mediaUrl: '', createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 86400000).toISOString(), likes: 3 }
    ],
    statusViews: []
};

// GET endpoints
app.get('/api/link_users', (req, res) => res.json(db.users));
app.get('/api/link_chats', (req, res) => res.json(db.chats));

app.get('/api/link_messages', (req, res) => {
    const { chatId } = req.query;
    if (chatId) {
        return res.json(db.messages.filter(m => m.chatId === chatId));
    }
    res.json(db.messages);
});

app.get('/api/link_statuses', (req, res) => {
    const now = new Date();
    const active = db.statuses.filter(s => new Date(s.expiresAt) > now);
    res.json(active);
});

// POST endpoints
app.post('/api/link_messages', (req, res) => {
    const newMsg = {
        id: db.messages.length ? Math.max(...db.messages.map(m => m.id)) + 1 : 1,
        chatId: req.body.chatId,
        senderId: req.body.senderId || 'admin',
        senderName: req.body.senderName || 'System Administrator',
        content: req.body.content,
        attachment: req.body.attachment || null,
        reaction: req.body.reaction || null,
        timestamp: req.body.timestamp || new Date().toISOString()
    };
    db.messages.push(newMsg);

    // Update lastMessage on chat
    const chat = db.chats.find(c => c.chatId === req.body.chatId);
    if (chat) {
        chat.lastMessage = `${newMsg.senderName}: ${newMsg.content}`;
        chat.updatedAt = new Date().toISOString();
    }

    res.status(201).json(newMsg);
});

app.post('/api/link_chats', (req, res) => {
    const newChat = {
        id: db.chats.length ? Math.max(...db.chats.map(c => c.id)) + 1 : 1,
        chatId: req.body.chatId || `chat_${Date.now()}`,
        type: req.body.type || 'direct',
        name: req.body.name,
        participants: req.body.participants || 'admin',
        lastMessage: req.body.lastMessage || 'Chat created',
        updatedAt: new Date().toISOString()
    };
    db.chats.push(newChat);
    res.status(201).json(newChat);
});

app.post('/api/link_statuses', (req, res) => {
    const newStatus = {
        id: db.statuses.length ? Math.max(...db.statuses.map(s => s.id)) + 1 : 1,
        userId: req.body.userId || 'admin',
        userName: req.body.userName || 'System Administrator',
        userAvatar: req.body.userAvatar || '⚡',
        content: req.body.content,
        bgGradient: req.body.bgGradient || 'linear-gradient(135deg, #6366f1, #ec4899)',
        mediaUrl: req.body.mediaUrl || '',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        likes: 0
    };
    db.statuses.push(newStatus);
    res.status(201).json(newStatus);
});

app.listen(port, "0.0.0.0", () => {
    console.log(`⚡ Link Instant Messenger Backend running on port ${port}`);
});
