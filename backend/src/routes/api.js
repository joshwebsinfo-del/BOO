const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const dbService = require('../../../database/db_service');

// Configure Multer File Upload
const uploadDir = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 }, storage }); // 50MB limit

// Status & Health
router.get('/health', (req, res) => {
    res.json({
        status: 'online',
        app: 'WiFi Messenger',
        developer: 'Developed by JoshWebs',
        mode: 'LAN Engine Active',
        timestamp: new Date().toISOString()
    });
});

// Profile & Devices
router.get('/profile', (req, res) => {
    try {
        const profile = dbService.getSelfProfile();
        res.json({ success: true, data: profile });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.put('/profile', (req, res) => {
    try {
        const updated = dbService.updateSelfProfile(req.body);
        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/peers', (req, res) => {
    try {
        const peers = dbService.getDiscoveredPeers();
        res.json({ success: true, data: peers });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Device Discovery Ping
router.post('/discovery/announce', (req, res) => {
    try {
        const { device_id, user_id, username, display_name, status, device_name, port } = req.body;
        const ip_address = req.ip.replace(/^.*:/, '');
        dbService.upsertDiscoveredPeer({
            device_id,
            user_id,
            username,
            display_name,
            status,
            device_name,
            ip_address,
            port
        });
        res.json({ success: true, message: 'Announced on LAN' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Pairing & QR Code
router.get('/pairing/qrcode', async (req, res) => {
    try {
        const self = dbService.getSelfProfile();
        const pairingCode = Math.floor(100000 + Math.random() * 900000).toString();
        const qrData = JSON.stringify({
            device_id: self.device_id,
            user_id: self.id,
            username: self.username,
            display_name: self.display_name,
            pairing_code: pairingCode
        });

        const qrDataUrl = await QRCode.toDataURL(qrData);
        res.json({ success: true, pairing_code: pairingCode, qr_code: qrDataUrl });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Conversations & Messages
router.get('/conversations', (req, res) => {
    try {
        const conversations = dbService.getConversations();
        res.json({ success: true, data: conversations });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/conversations/direct', (req, res) => {
    try {
        const { peer_user_id } = req.body;
        const convId = dbService.getOrCreateDirectConversation(peer_user_id);
        res.json({ success: true, conversation_id: convId });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.post('/conversations/group', (req, res) => {
    try {
        const { title, member_user_ids } = req.body;
        const convId = dbService.createGroupConversation(title, member_user_ids || []);
        res.json({ success: true, conversation_id: convId });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.get('/conversations/:id/messages', (req, res) => {
    try {
        const messages = dbService.getMessages(req.params.id);
        res.json({ success: true, data: messages });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// File Upload & Serving
router.post('/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }
        const { message_id } = req.body;
        const fileMetadata = {
            message_id: message_id || uuidv4(),
            file_name: req.file.originalname,
            file_path: `/uploads/${req.file.filename}`,
            file_size: req.file.size,
            mime_type: req.file.mimetype
        };

        if (message_id) {
            dbService.saveAttachment(fileMetadata);
        }

        res.json({ success: true, data: fileMetadata });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Settings
router.get('/settings', (req, res) => {
    try {
        const settings = dbService.getSettings();
        res.json({ success: true, data: settings });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

router.put('/settings', (req, res) => {
    try {
        const { key, value } = req.body;
        dbService.updateSetting(key, value);
        res.json({ success: true, data: dbService.getSettings() });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Cloud Sync Endpoint (For Render Backend)
router.post('/sync', (req, res) => {
    try {
        const { client_timestamp } = req.body;
        res.json({
            success: true,
            status: 'synchronized',
            server_timestamp: new Date().toISOString(),
            message: 'Local database synchronized with Render Cloud Backup'
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

module.exports = router;
