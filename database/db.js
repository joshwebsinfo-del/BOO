const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, 'wifi_messenger.db');
const schemaPath = path.join(__dirname, 'schema.sql');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
function initDatabase() {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);

    // Seed default settings if empty
    const checkSetting = db.prepare('SELECT COUNT(*) as count FROM settings').get();
    if (checkSetting.count === 0) {
        const defaultSettings = [
            ['theme', 'default'],
            ['color_mode', 'dark'],
            ['discovery_enabled', '1'],
            ['notifications_sound', '1'],
            ['notifications_vibrate', '1'],
            ['developer_label', 'Developed by JoshWebs']
        ];
        const insertSetting = db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
        defaultSettings.forEach(([k, v]) => insertSetting.run(k, v));
    }

    // Ensure self profile and device_id exist
    let selfUser = db.prepare('SELECT * FROM users WHERE is_self = 1').get();
    if (!selfUser) {
        const selfUserId = 'usr_' + uuidv4().substring(0, 8);
        db.prepare(`
            INSERT INTO users (id, username, display_name, avatar_url, status, about, is_self)
            VALUES (?, ?, ?, ?, ?, ?, 1)
        `).run(selfUserId, 'josh_user', 'Josh Webs', '', '🟢 Available on LAN', 'Building offline-first LAN communication tools.');
        selfUser = db.prepare('SELECT * FROM users WHERE id = ?').get(selfUserId);
    }

    let selfDevice = db.prepare('SELECT * FROM devices WHERE user_id = ?').get(selfUser.id);
    if (!selfDevice) {
        const deviceId = 'dev_' + uuidv4().replace(/-/g, '').substring(0, 12);
        db.prepare(`
            INSERT INTO devices (device_id, user_id, device_name, is_trusted)
            VALUES (?, ?, ?, 1)
        `).run(deviceId, selfUser.id, 'Josh Laptop');
    }
}

initDatabase();

module.exports = db;
