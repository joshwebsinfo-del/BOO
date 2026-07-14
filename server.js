const loadDotenv = process.env.NODE_ENV !== 'production' && process.env.LOAD_DOTENV !== 'false';
if (loadDotenv) {
    require('dotenv').config();
}
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve frontend files

const databaseUrl = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production';
const isLocalDatabase = databaseUrl && /localhost|127\.0\.0\.1|::1/.test(databaseUrl);

let dbType = 'mock'; // 'postgres' | 'sqlite' | 'mock'
let pgPool = null;
let sqliteDb = null;

// Mock database storage in memory as absolute fallback
const mockDb = {
    bookings: [],
    rooms: [],
    messages: [],
    notifications: [],
    users: [],
    settings: []
};

if (databaseUrl && !isLocalDatabase) {
    try {
        const { Pool } = require('pg');
        pgPool = new Pool({
            connectionString: databaseUrl,
            ssl: {
                rejectUnauthorized: false
            }
        });
        dbType = 'postgres';
        console.log('🔌 Connected with PostgreSQL pool from DATABASE_URL');

        pgPool.on('error', (err) => {
            console.error('❌ PostgreSQL Pool Error:', err.message);
        });
    } catch (err) {
        console.error('❌ Failed to initialize PG connection:', err.message);
    }
}

if (dbType === 'mock') {
    try {
        const Database = require('better-sqlite3');
        sqliteDb = new Database(path.join(__dirname, 'lodge.db'));
        dbType = 'sqlite';
        console.log('📦 Connected with local SQLite database (lodge.db)');
    } catch (err) {
        console.warn('⚠️ SQLite failed to load. Falling back to in-memory mock database.', err.message);
        dbType = 'mock';
    }
}

// Database helper
async function dbQuery(sql, params = []) {
    if (dbType === 'postgres') {
        const res = await pgPool.query(sql, params);
        return { rows: res.rows, rowCount: res.rowCount };
    } else if (dbType === 'sqlite') {
        // Convert PostgreSQL $1, $2, $3 style parameters to SQLite ?
        let sqliteSql = sql.replace(/\$\d+/g, '?');

        try {
            if (sqliteSql.trim().toUpperCase().startsWith('SELECT')) {
                const stmt = sqliteDb.prepare(sqliteSql);
                const rows = stmt.all(params);
                return { rows, rowCount: rows.length };
            } else {
                const stmt = sqliteDb.prepare(sqliteSql);
                if (sqliteSql.toUpperCase().includes('RETURNING')) {
                    const rows = stmt.all(params);
                    return { rows, rowCount: rows.length };
                } else {
                    const info = stmt.run(params);
                    // Mock RETURNING behavior by querying or returning id
                    const lastId = info.lastInsertRowid;
                    return { rows: [{ id: lastId }], rowCount: info.changes };
                }
            }
        } catch (err) {
            console.error('SQLite error:', err.message, 'SQL:', sqliteSql, 'Params:', params);
            throw err;
        }
    } else {
        // In-memory mock DB operations (very simple generic simulator)
        return simulateMockQuery(sql, params);
    }
}

function simulateMockQuery(sql, params) {
    const query = sql.trim().toUpperCase();
    
    // Parse table name
    let tableName = 'bookings';
    for (const name of ['bookings', 'rooms', 'messages', 'notifications', 'users', 'settings']) {
        if (query.includes(name.toUpperCase())) {
            tableName = name;
            break;
        }
    }
    
    const table = mockDb[tableName];

    if (query.startsWith('SELECT')) {
        // Check for specific row select
        if (query.includes('WHERE USERNAME =') || query.includes('WHERE USERNAME=')) {
            const username = params[0];
            const rows = table.filter(r => r.username === username);
            return { rows, rowCount: rows.length };
        }
        if (query.includes('WHERE ID =') || query.includes('WHERE ID=')) {
            const id = params[0];
            const rows = table.filter(r => r.id == id);
            return { rows, rowCount: rows.length };
        }
        if (query.includes('WHERE KEY =') || query.includes('WHERE KEY=')) {
            const key = params[0];
            const rows = table.filter(r => r.key === key);
            return { rows, rowCount: rows.length };
        }
        return { rows: [...table], rowCount: table.length };
    } else if (query.startsWith('INSERT')) {
        const item = { id: table.length + 1 };
        // Very basic mock parsing of keys and values from sql (for seeding)
        // In actual usage, req.body is processed by POST route which appends to mockDb directly
        table.push(item);
        return { rows: [item], rowCount: 1 };
    } else if (query.startsWith('UPDATE')) {
        return { rows: [], rowCount: 1 };
    } else if (query.startsWith('DELETE')) {
        return { rows: [], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
}

// Auto-create and seed tables on startup
async function initDb() {
    console.log(`🔨 Initializing database schema on [${dbType}]`);

    if (dbType === 'postgres') {
        const client = await pgPool.connect();
        try {
            await client.query('BEGIN');
            await client.query(`
                CREATE TABLE IF NOT EXISTS bookings (
                    id SERIAL PRIMARY KEY,
                    "bookingId" TEXT UNIQUE,
                    "guestName" TEXT,
                    "guestEmail" TEXT,
                    "guestPhone" TEXT,
                    "roomType" TEXT,
                    "checkIn" TEXT,
                    "checkOut" TEXT,
                    "guests" INTEGER,
                    "totalPrice" DECIMAL(10,2),
                    "status" TEXT DEFAULT 'Pending',
                    "specialRequests" TEXT,
                    "createdAt" TEXT
                );
                CREATE TABLE IF NOT EXISTS rooms (
                    id SERIAL PRIMARY KEY,
                    "type" TEXT UNIQUE,
                    "name" TEXT,
                    "price" DECIMAL(10,2),
                    "capacity" INTEGER,
                    "totalRooms" INTEGER,
                    "description" TEXT,
                    "amenities" TEXT
                );
                CREATE TABLE IF NOT EXISTS messages (
                    id SERIAL PRIMARY KEY,
                    "name" TEXT,
                    "email" TEXT,
                    "phone" TEXT,
                    "subject" TEXT,
                    "message" TEXT,
                    "date" TEXT,
                    "status" TEXT DEFAULT 'Unread'
                );
                CREATE TABLE IF NOT EXISTS notifications (
                    id SERIAL PRIMARY KEY,
                    "title" TEXT,
                    "message" TEXT,
                    "date" TEXT,
                    "type" TEXT,
                    "read" INTEGER DEFAULT 0
                );
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    "username" TEXT UNIQUE,
                    "password" TEXT,
                    "role" TEXT,
                    "name" TEXT
                );
                CREATE TABLE IF NOT EXISTS settings (
                    id SERIAL PRIMARY KEY,
                    "key" TEXT UNIQUE,
                    "value" TEXT
                );
            `);

            // Seed default admin account
            const adminRes = await client.query('SELECT id FROM users WHERE username = $1', ['admin']);
            if (adminRes.rowCount === 0) {
                await client.query('INSERT INTO users (username, password, role, name) VALUES ($1, $2, $3, $4)', ['admin', 'admin123', 'Admin', 'Kurichong Admin']);
                console.log('Default admin seeded.');
            }

            // Seed rooms
            const roomRes = await client.query('SELECT COUNT(*) as count FROM rooms');
            if (parseInt(roomRes.rows[0].count) === 0) {
                await client.query(`
                    INSERT INTO rooms ("type", "name", "price", "capacity", "totalRooms", "description", "amenities") VALUES
                    ('standard', 'Standard Room', 2500.00, 2, 5, 'A cozy retreat featuring comfortable interiors, locally inspired artwork, and all essential modern conveniences for solo travelers or couples.', 'Attached Bathroom, Hot Water Shower, Free High-Speed Wi-Fi, Writing Desk, Daily Housekeeping'),
                    ('deluxe', 'Deluxe Room', 3500.00, 3, 5, 'Spacious, elegant room with handcrafted wooden accents and a private balcony overlooking the breathtaking Kurichhu River and the pristine Yelchen valley.', 'Private Balcony, Scenic River View, King-Size Bed, Smart LED TV, Coffee/Tea Maker, High-Speed Wi-Fi'),
                    ('executive', 'Executive Suite', 5500.00, 4, 2, 'Our premier accommodation boasting luxurious traditional Bhutanese woodwork, a grand separate living area, a private viewing deck, and deluxe custom services.', 'Separate Living Lounge, Private Viewing Deck, Premium King Bed, Traditional Wood Stove Setup, In-Suite Hot Stone Tub access, Espresso Bar')
                `);
                console.log('Room categories seeded.');
            }

            // Seed default settings
            const settingsRes = await client.query('SELECT COUNT(*) as count FROM settings');
            if (parseInt(settingsRes.rows[0].count) === 0) {
                await client.query(`
                    INSERT INTO settings ("key", "value") VALUES
                    ('lodge_name', 'Kurichong Eco Lodge'),
                    ('lodge_location', 'Yelchen, Mongar, Bhutan'),
                    ('lodge_phone', '+975 17730113 / +975 77730113'),
                    ('lodge_email', 'kurichongecolodge@gmail.com')
                `);
                console.log('Lodge settings seeded.');
            }

            // Seed some mock bookings
            const bookingsRes = await client.query('SELECT COUNT(*) as count FROM bookings');
            if (parseInt(bookingsRes.rows[0].count) === 0) {
                const today = new Date();
                const d1 = new Date(today); d1.setDate(today.getDate() + 2);
                const d2 = new Date(today); d2.setDate(today.getDate() + 5);
                const d3 = new Date(today); d3.setDate(today.getDate() - 4);
                const d4 = new Date(today); d4.setDate(today.getDate() - 1);

                await client.query(`
                    INSERT INTO bookings ("bookingId", "guestName", "guestEmail", "guestPhone", "roomType", "checkIn", "checkOut", "guests", "totalPrice", "status", "specialRequests", "createdAt") VALUES
                    ('KEL-2026-0041', 'Tashi Dorji', 'tashi@gmail.com', '+975 17112233', 'deluxe', '${d1.toISOString().split('T')[0]}', '${d2.toISOString().split('T')[0]}', 2, 10500.00, 'Confirmed', 'Requesting top floor balcony.', '${new Date().toISOString()}'),
                    ('KEL-2026-0028', 'Dr. Alistair Chen', 'achen@quantcompute.com', '+1 (555) 381-0192', 'executive', '${d3.toISOString().split('T')[0]}', '${d4.toISOString().split('T')[0]}', 3, 16500.00, 'Confirmed', 'Arranged for traditional Hot Stone Bath.', '${new Date(today.getTime() - 10*24*60*60*1000).toISOString()}'),
                    ('KEL-2026-0099', 'Dechen Wangmo', 'dechen@outlook.com', '+975 77123456', 'standard', '${new Date(today.getTime() + 8*24*60*60*1000).toISOString().split('T')[0]}', '${new Date(today.getTime() + 10*24*60*60*1000).toISOString().split('T')[0]}', 1, 5000.00, 'Pending', 'Vegetarian meals during stay.', '${new Date().toISOString()}')
                `);
                console.log('Mock bookings seeded.');
            }

            // Seed some mock feedback messages
            const messagesRes = await client.query('SELECT COUNT(*) as count FROM messages');
            if (parseInt(messagesRes.rows[0].count) === 0) {
                await client.query(`
                    INSERT INTO messages ("name", "email", "phone", "subject", "message", "date", "status") VALUES
                    ('Pema Lhaden', 'pema.l@gmail.com', '+975 17543210', 'Hot Stone Bath Inquiry', 'Hello, do we need to book the traditional hot stone bath in advance, or can we request it upon arrival? Thank you!', '${new Date().toISOString()}', 'Unread'),
                    ('Robert Miller', 'rmiller@yahoo.com', '+44 7911 123456', 'Rafting Availability', 'We are planning a visit next month and would love to experience river rafting on the Kurichhu. Are guided rafting sessions available daily?', '${new Date().toISOString()}', 'Unread')
                `);
                console.log('Mock messages seeded.');
            }

            await client.query('COMMIT');
            console.log('✅ PostgreSQL schema and seed data initialized successfully.');
        } catch (err) {
            await client.query('ROLLBACK');
            console.error('❌ Failed to initialize database schema in PostgreSQL:', err.message);
        } finally {
            client.release();
        }
    } else if (dbType === 'sqlite') {
        try {
            // Create tables
            sqliteDb.exec(`
                CREATE TABLE IF NOT EXISTS bookings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    bookingId TEXT UNIQUE,
                    guestName TEXT,
                    guestEmail TEXT,
                    guestPhone TEXT,
                    roomType TEXT,
                    checkIn TEXT,
                    checkOut TEXT,
                    guests INTEGER,
                    totalPrice DECIMAL(10,2),
                    status TEXT DEFAULT 'Pending',
                    specialRequests TEXT,
                    createdAt TEXT
                );
                CREATE TABLE IF NOT EXISTS rooms (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    type TEXT UNIQUE,
                    name TEXT,
                    price DECIMAL(10,2),
                    capacity INTEGER,
                    totalRooms INTEGER,
                    description TEXT,
                    amenities TEXT
                );
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT,
                    email TEXT,
                    phone TEXT,
                    subject TEXT,
                    message TEXT,
                    date TEXT,
                    status TEXT DEFAULT 'Unread'
                );
                CREATE TABLE IF NOT EXISTS notifications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT,
                    message TEXT,
                    date TEXT,
                    type TEXT,
                    read INTEGER DEFAULT 0
                );
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE,
                    password TEXT,
                    role TEXT,
                    name TEXT
                );
                CREATE TABLE IF NOT EXISTS settings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    key TEXT UNIQUE,
                    value TEXT
                );
            `);

            // Seed default admin user
            const adminCheck = sqliteDb.prepare('SELECT id FROM users WHERE username = ?').get('admin');
            if (!adminCheck) {
                sqliteDb.prepare('INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)').run('admin', 'admin123', 'Admin', 'Kurichong Admin');
                console.log('Default SQLite admin seeded.');
            }

            // Seed rooms
            const roomCheck = sqliteDb.prepare('SELECT COUNT(*) as count FROM rooms').get();
            if (roomCheck.count === 0) {
                sqliteDb.exec(`
                    INSERT INTO rooms (type, name, price, capacity, totalRooms, description, amenities) VALUES
                    ('standard', 'Standard Room', 2500.00, 2, 5, 'A cozy retreat featuring comfortable interiors, locally inspired artwork, and all essential modern conveniences for solo travelers or couples.', 'Attached Bathroom, Hot Water Shower, Free High-Speed Wi-Fi, Writing Desk, Daily Housekeeping'),
                    ('deluxe', 'Deluxe Room', 3500.00, 3, 5, 'Spacious, elegant room with handcrafted wooden accents and a private balcony overlooking the breathtaking Kurichhu River and the pristine Yelchen valley.', 'Private Balcony, Scenic River View, King-Size Bed, Smart LED TV, Coffee/Tea Maker, High-Speed Wi-Fi'),
                    ('executive', 'Executive Suite', 5500.00, 4, 2, 'Our premier accommodation boasting luxurious traditional Bhutanese woodwork, a grand separate living area, a private viewing deck, and deluxe custom services.', 'Separate Living Lounge, Private Viewing Deck, Premium King Bed, Traditional Wood Stove Setup, In-Suite Hot Stone Tub access, Espresso Bar')
                `);
                console.log('SQLite Room categories seeded.');
            }

            // Seed settings
            const settingsCheck = sqliteDb.prepare('SELECT COUNT(*) as count FROM settings').get();
            if (settingsCheck.count === 0) {
                sqliteDb.exec(`
                    INSERT INTO settings (key, value) VALUES
                    ('lodge_name', 'Kurichong Eco Lodge'),
                    ('lodge_location', 'Yelchen, Mongar, Bhutan'),
                    ('lodge_phone', '+975 17730113 / +975 77730113'),
                    ('lodge_email', 'kurichongecolodge@gmail.com')
                `);
                console.log('SQLite Lodge settings seeded.');
            }

            // Seed mock bookings
            const bookingsCheck = sqliteDb.prepare('SELECT COUNT(*) as count FROM bookings').get();
            if (bookingsCheck.count === 0) {
                const today = new Date();
                const d1 = new Date(today); d1.setDate(today.getDate() + 2);
                const d2 = new Date(today); d2.setDate(today.getDate() + 5);
                const d3 = new Date(today); d3.setDate(today.getDate() - 4);
                const d4 = new Date(today); d4.setDate(today.getDate() - 1);

                sqliteDb.exec(`
                    INSERT INTO bookings (bookingId, guestName, guestEmail, guestPhone, roomType, checkIn, checkOut, guests, totalPrice, status, specialRequests, createdAt) VALUES
                    ('KEL-2026-0041', 'Tashi Dorji', 'tashi@gmail.com', '+975 17112233', 'deluxe', '${d1.toISOString().split('T')[0]}', '${d2.toISOString().split('T')[0]}', 2, 10500.00, 'Confirmed', 'Requesting top floor balcony.', '${new Date().toISOString()}'),
                    ('KEL-2026-0028', 'Dr. Alistair Chen', 'achen@quantcompute.com', '+1 (555) 381-0192', 'executive', '${d3.toISOString().split('T')[0]}', '${d4.toISOString().split('T')[0]}', 3, 16500.00, 'Confirmed', 'Arranged for traditional Hot Stone Bath.', '${new Date(today.getTime() - 10*24*60*60*1000).toISOString()}'),
                    ('KEL-2026-0099', 'Dechen Wangmo', 'dechen@outlook.com', '+975 77123456', 'standard', '${new Date(today.getTime() + 8*24*60*60*1000).toISOString().split('T')[0]}', '${new Date(today.getTime() + 10*24*60*60*1000).toISOString().split('T')[0]}', 1, 5000.00, 'Pending', 'Vegetarian meals during stay.', '${new Date().toISOString()}')
                `);
                console.log('SQLite Mock bookings seeded.');
            }

            // Seed mock messages
            const messagesCheck = sqliteDb.prepare('SELECT COUNT(*) as count FROM messages').get();
            if (messagesCheck.count === 0) {
                sqliteDb.exec(`
                    INSERT INTO messages (name, email, phone, subject, message, date, status) VALUES
                    ('Pema Lhaden', 'pema.l@gmail.com', '+975 17543210', 'Hot Stone Bath Inquiry', 'Hello, do we need to book the traditional hot stone bath in advance, or can we request it upon arrival? Thank you!', '${new Date().toISOString()}', 'Unread'),
                    ('Robert Miller', 'rmiller@yahoo.com', '+44 7911 123456', 'Rafting Availability', 'We are planning a visit next month and would love to experience river rafting on the Kurichhu. Are guided rafting sessions available daily?', '${new Date().toISOString()}', 'Unread')
                `);
                console.log('SQLite Mock messages seeded.');
            }

            console.log('✅ SQLite schema and seed data initialized successfully.');
        } catch (err) {
            console.error('❌ Failed to initialize SQLite database:', err.message);
        }
    } else {
        // Mock in-memory database seeding
        mockDb.users.push({ id: 1, username: 'admin', password: 'admin123', role: 'Admin', name: 'Kurichong Admin' });
        mockDb.rooms.push(
            { id: 1, type: 'standard', name: 'Standard Room', price: 2500, capacity: 2, totalRooms: 5, description: 'Cozy eco-retreat', amenities: 'Attached Bath, Hot Shower, Wi-Fi' },
            { id: 2, type: 'deluxe', name: 'Deluxe Room', price: 3500, capacity: 3, totalRooms: 5, description: 'River view and balcony', amenities: 'Balcony, View, Wi-Fi' },
            { id: 3, type: 'executive', name: 'Executive Suite', price: 5500, capacity: 4, totalRooms: 2, description: 'Luxury suite', amenities: 'Living Lounge, View, Espresso' }
        );
        mockDb.settings.push(
            { id: 1, key: 'lodge_name', value: 'Kurichong Eco Lodge' },
            { id: 2, key: 'lodge_location', value: 'Yelchen, Mongar, Bhutan' }
        );
        console.log('✅ Mock In-Memory Database initialized and seeded.');
    }
}

// Allowed tables for general API safety
const ALLOWED_TABLES = ['bookings', 'rooms', 'messages', 'notifications', 'users', 'settings'];

function validateTable(table, res) {
    if (!ALLOWED_TABLES.includes(table)) {
        res.status(400).json({ error: `Invalid table: ${table}` });
        return false;
    }
    return true;
}

// REST endpoints: GET all rows with query string filters
app.get('/api/:table', async (req, res) => {
    const { table } = req.params;
    if (!validateTable(table, res)) return;

    const { _sort, _order, _limit, ...filters } = req.query;

    try {
        if (dbType === 'mock') {
            let list = [...mockDb[table]];
            // Simple in-memory filtering
            for (const [key, val] of Object.entries(filters)) {
                list = list.filter(item => item[key] == val);
            }
            if (_sort) {
                list.sort((a, b) => {
                    const valA = a[_sort];
                    const valB = b[_sort];
                    if (valA < valB) return _order === 'desc' ? 1 : -1;
                    if (valA > valB) return _order === 'desc' ? -1 : 1;
                    return 0;
                });
            }
            if (_limit) {
                list = list.slice(0, parseInt(_limit));
            }
            return res.json(list);
        }

        let sql = `SELECT * FROM ${table}`;
        const values = [];
        const conditions = [];

        let i = 1;
        for (const [key, value] of Object.entries(filters)) {
            conditions.push(`"${key}" = $${i++}`);
            values.push(value);
        }
        
        if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
        if (_sort) sql += ` ORDER BY "${_sort}" ${(_order || 'ASC').toUpperCase()}`;
        if (_limit) sql += ` LIMIT ${parseInt(_limit)}`;

        const result = await dbQuery(sql, values);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

// REST endpoints: GET single row by id
app.get('/api/:table/:id', async (req, res) => {
    const { table, id } = req.params;
    if (!validateTable(table, res)) return;
    try {
        if (dbType === 'mock') {
            const item = mockDb[table].find(r => r.id == id);
            if (!item) return res.status(404).json({ error: 'Not found' });
            return res.json(item);
        }

        const result = await dbQuery(`SELECT * FROM ${table} WHERE id = $1`, [id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// REST endpoints: POST single or bulk insert
app.post('/api/:table', async (req, res) => {
    const { table } = req.params;
    if (!validateTable(table, res)) return;

    try {
        const data = req.body;

        if (dbType === 'mock') {
            if (Array.isArray(data)) {
                const results = [];
                for (const item of data) {
                    const newItem = { id: mockDb[table].length + 1, ...item };
                    mockDb[table].push(newItem);
                    results.push(newItem);
                }
                return res.status(201).json(results);
            } else {
                const newItem = { id: mockDb[table].length + 1, ...data };
                mockDb[table].push(newItem);
                return res.status(201).json(newItem);
            }
        }

        if (Array.isArray(data)) {
            const insertedRows = [];
            for (const item of data) {
                const keys = Object.keys(item);
                const values = Object.values(item);
                const quotedKeys = keys.map(k => `"${k}"`).join(', ');
                const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
                const sql = `INSERT INTO ${table} (${quotedKeys}) VALUES (${placeholders}) RETURNING *`;
                const result = await dbQuery(sql, values);
                insertedRows.push(result.rows[0]);
            }
            res.status(201).json(insertedRows);
        } else {
            const keys = Object.keys(data);
            const values = Object.values(data);
            const quotedKeys = keys.map(k => `"${k}"`).join(', ');
            const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
            const sql = `INSERT INTO ${table} (${quotedKeys}) VALUES (${placeholders}) RETURNING *`;
            const result = await dbQuery(sql, values);
            res.status(201).json(result.rows[0] || { id: result.rows[0]?.id || 1, ...data });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

// REST endpoints: PUT update single row by id
app.put('/api/:table/:id', async (req, res) => {
    const { table, id } = req.params;
    if (!validateTable(table, res)) return;
    try {
        const data = req.body;

        if (dbType === 'mock') {
            const idx = mockDb[table].findIndex(r => r.id == id);
            if (idx === -1) return res.status(404).json({ error: 'Not found' });
            mockDb[table][idx] = { ...mockDb[table][idx], ...data };
            return res.json(mockDb[table][idx]);
        }

        const keys = Object.keys(data);
        const values = Object.values(data);
        const setClause = keys.map((k, i) => `"${k}" = $${i + 1}`).join(', ');
        
        const sql = `UPDATE ${table} SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`;
        const result = await dbQuery(sql, [...values, id]);
        res.json(result.rows[0] || { id, ...data });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// REST endpoints: DELETE single row by id
app.delete('/api/:table/:id', async (req, res) => {
    const { table, id } = req.params;
    if (!validateTable(table, res)) return;
    try {
        if (dbType === 'mock') {
            const idx = mockDb[table].findIndex(r => r.id == id);
            if (idx === -1) return res.status(404).json({ error: 'Not found' });
            mockDb[table].splice(idx, 1);
            return res.json({ message: 'Deleted' });
        }

        await dbQuery(`DELETE FROM ${table} WHERE id = $1`, [id]);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Auth endpoint: Quick simulated admin session login
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        if (dbType === 'mock') {
            const user = mockDb.users.find(u => u.username === username && u.password === password);
            if (user) {
                return res.json({ success: true, user: { username: user.username, name: user.name, role: user.role } });
            }
            return res.status(401).json({ success: false, error: 'Invalid username or password' });
        }

        const result = await dbQuery('SELECT * FROM users WHERE "username" = $1 AND "password" = $2', [username, password]);
        if (result.rowCount > 0) {
            const user = result.rows[0];
            res.json({ success: true, user: { username: user.username, name: user.name, role: user.role } });
        } else {
            res.status(401).json({ success: false, error: 'Invalid username or password' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Config route for frontend compatibility
app.get('/api/config', (req, res) => {
    res.json({
        database: dbType,
        initialized: true
    });
});

initDb().then(() => {
    app.listen(port, "0.0.0.0", () => {
        console.log(` Kurichong Eco Lodge API server running on port ${port} [${dbType}]`);
    });
});
