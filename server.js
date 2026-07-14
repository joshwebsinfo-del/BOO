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
                    const lastId = info.lastInsertRowid;
                    return { rows: [{ id: lastId }], rowCount: info.changes };
                }
            }
        } catch (err) {
            console.error('SQLite error:', err.message, 'SQL:', sqliteSql, 'Params:', params);
            throw err;
        }
    } else {
        return simulateMockQuery(sql, params);
    }
}

function simulateMockQuery(sql, params) {
    const query = sql.trim().toUpperCase();
    
    let tableName = 'bookings';
    for (const name of ['bookings', 'rooms', 'messages', 'notifications', 'users', 'settings']) {
        if (query.includes(name.toUpperCase())) {
            tableName = name;
            break;
        }
    }
    
    const table = mockDb[tableName];

    if (query.startsWith('SELECT')) {
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
    console.log(`🔨 Initializing Mountain View Lodge database schema on [${dbType}]`);

    // In SQLite, clean old tables to perform clean seed matching new schema
    if (dbType === 'sqlite') {
        sqliteDb.exec(`
            DROP TABLE IF EXISTS bookings;
            DROP TABLE IF EXISTS rooms;
            DROP TABLE IF EXISTS messages;
            DROP TABLE IF EXISTS notifications;
            DROP TABLE IF EXISTS users;
            DROP TABLE IF EXISTS settings;
        `);
    } else if (dbType === 'postgres') {
        const client = await pgPool.connect();
        try {
            await client.query('DROP TABLE IF EXISTS bookings CASCADE; DROP TABLE IF EXISTS rooms CASCADE; DROP TABLE IF EXISTS messages CASCADE; DROP TABLE IF EXISTS settings CASCADE;');
        } catch (e) {
            console.warn('Postgres drop warning:', e.message);
        } finally {
            client.release();
        }
    }

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
                await client.query('INSERT INTO users (username, password, role, name) VALUES ($1, $2, $3, $4)', ['admin', 'admin123', 'Admin', 'Mountain View Admin']);
            }

            // Seed rooms
            await client.query(`
                INSERT INTO rooms ("type", "name", "price", "capacity", "totalRooms", "description", "amenities") VALUES
                ('ensuite_std', '2-Hour Ensuite (Standard)', 10.00, 2, 5, 'Perfect private ensuite room for a quick 2-hour freshen-up, changes of clothes, or a brief rest.', 'Attached Bath, Hot Refreshing Shower, Fresh Linen, Fast Wi-Fi, Security'),
                ('ensuite_premium', '2-Hour Ensuite (Premium)', 15.00, 2, 3, 'Premium short stay ensuite with luxury linen, priority mocktail bar delivery, and spacious hot shower.', 'Premium Attached Bath, Hot Shower, Luxury Fresh Linen, Fast Wi-Fi, Secure Parking'),
                ('overnight_std', 'Overnight Stay (Standard)', 20.00, 2, 10, 'A peaceful and affordable standard overnight room. Wake up refreshed after a cozy night on fresh linen.', 'Standard Room, Hot Refreshing Shower, Fresh Linen, Fast Wi-Fi, Secure Parking'),
                ('overnight_premium', 'Overnight Stay (Premium)', 25.00, 3, 5, 'A luxury overnight stay featuring scenic mountain views, spacious interior, and priority gazebo access.', 'Overnight Room, Scenic Mountain View, Hot Shower, Premium Linen, Fast Wi-Fi, Safe Parking, Priority Gazebo')
            `);

            // Seed default settings
            await client.query(`
                INSERT INTO settings ("key", "value") VALUES
                ('lodge_name', 'Mountain View Lodge'),
                ('lodge_location', 'Mountain View'),
                ('lodge_phone', '+1 (555) 831-9023'),
                ('lodge_email', 'bookings@mountainviewlodge.com')
            `);

            // Seed some mock bookings
            const today = new Date();
            const d1 = new Date(today); d1.setDate(today.getDate() + 2);
            const d2 = new Date(today); d2.setDate(today.getDate() + 5);
            const d3 = new Date(today); d3.setDate(today.getDate() - 4);
            const d4 = new Date(today); d4.setDate(today.getDate() - 1);

            await client.query(`
                INSERT INTO bookings ("bookingId", "guestName", "guestEmail", "guestPhone", "roomType", "checkIn", "checkOut", "guests", "totalPrice", "status", "specialRequests", "createdAt") VALUES
                ('MVL-2026-0041', 'Alice Cooper', 'alice@gmail.com', '+1 (555) 123-4567', 'overnight_premium', '${d1.toISOString().split('T')[0]}', '${d2.toISOString().split('T')[0]}', 2, 75.00, 'Confirmed', 'Requesting extra towels and priority Gazebo reservation.', '${new Date().toISOString()}'),
                ('MVL-2026-0028', 'John Doe', 'john@yahoo.com', '+1 (555) 987-6543', 'ensuite_std', '${d3.toISOString().split('T')[0]}', '${d4.toISOString().split('T')[0]}', 1, 10.00, 'Confirmed', 'Arriving by car. Safe parking required.', '${new Date(today.getTime() - 10*24*60*60*1000).toISOString()}'),
                ('MVL-2026-0099', 'Sara Connor', 'sara@outlook.com', '+1 (555) 304-1928', 'overnight_std', '${new Date(today.getTime() + 8*24*60*60*1000).toISOString().split('T')[0]}', '${new Date(today.getTime() + 10*24*60*60*1000).toISOString().split('T')[0]}', 2, 40.00, 'Pending', 'Order Signature Burger Combo on check-in.', '${new Date().toISOString()}')
            `);

            // Seed some mock feedback messages
            await client.query(`
                INSERT INTO messages ("name", "email", "phone", "subject", "message", "date", "status") VALUES
                ('Emily Stone', 'emily@gmail.com', '+1 (555) 321-0987', 'Signature Burger Combo Order', 'Hello, is the Signature Burger and Mocktail combo ($5) available to order directly to the gazebo? We want to book a table this Saturday!', '${new Date().toISOString()}', 'Unread'),
                ('Marcus Aurelius', 'marcus@philosophy.com', '+1 (555) 765-4321', 'Gazebo Booking Inquiry', 'Do we need to pay extra to sit in the Gazebo, or is it free for overnight guests? Thanks!', '${new Date().toISOString()}', 'Unread')
            `);

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
            sqliteDb.prepare('INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)').run('admin', 'admin123', 'Admin', 'Mountain View Admin');

            // Seed rooms
            sqliteDb.exec(`
                INSERT INTO rooms (type, name, price, capacity, totalRooms, description, amenities) VALUES
                ('ensuite_std', '2-Hour Ensuite (Standard)', 10.00, 2, 5, 'Perfect private ensuite room for a quick 2-hour freshen-up, changes of clothes, or a brief rest.', 'Attached Bath, Hot Refreshing Shower, Fresh Linen, Fast Wi-Fi, Security'),
                ('ensuite_premium', '2-Hour Ensuite (Premium)', 15.00, 2, 3, 'Premium short stay ensuite with luxury linen, priority mocktail bar delivery, and spacious hot shower.', 'Premium Attached Bath, Hot Shower, Luxury Fresh Linen, Fast Wi-Fi, Secure Parking'),
                ('overnight_std', 'Overnight Stay (Standard)', 20.00, 2, 10, 'A peaceful and affordable standard overnight room. Wake up refreshed after a cozy night on fresh linen.', 'Standard Room, Hot Refreshing Shower, Fresh Linen, Fast Wi-Fi, Secure Parking'),
                ('overnight_premium', 'Overnight Stay (Premium)', 25.00, 3, 5, 'A luxury overnight stay featuring scenic mountain views, spacious interior, and priority gazebo access.', 'Overnight Room, Scenic Mountain View, Hot Shower, Premium Linen, Fast Wi-Fi, Safe Parking, Priority Gazebo')
            `);

            // Seed settings
            sqliteDb.exec(`
                INSERT INTO settings (key, value) VALUES
                ('lodge_name', 'Mountain View Lodge'),
                ('lodge_location', 'Mountain View'),
                ('lodge_phone', '+1 (555) 831-9023'),
                ('lodge_email', 'bookings@mountainviewlodge.com')
            `);

            // Seed mock bookings
            const today = new Date();
            const d1 = new Date(today); d1.setDate(today.getDate() + 2);
            const d2 = new Date(today); d2.setDate(today.getDate() + 5);
            const d3 = new Date(today); d3.setDate(today.getDate() - 4);
            const d4 = new Date(today); d4.setDate(today.getDate() - 1);

            sqliteDb.exec(`
                INSERT INTO bookings (bookingId, guestName, guestEmail, guestPhone, roomType, checkIn, checkOut, guests, totalPrice, status, specialRequests, createdAt) VALUES
                ('MVL-2026-0041', 'Alice Cooper', 'alice@gmail.com', '+1 (555) 123-4567', 'overnight_premium', '${d1.toISOString().split('T')[0]}', '${d2.toISOString().split('T')[0]}', 2, 75.00, 'Confirmed', 'Requesting extra towels and priority Gazebo reservation.', '${new Date().toISOString()}'),
                ('MVL-2026-0028', 'John Doe', 'john@yahoo.com', '+1 (555) 987-6543', 'ensuite_std', '${d3.toISOString().split('T')[0]}', '${d4.toISOString().split('T')[0]}', 1, 10.00, 'Confirmed', 'Arriving by car. Safe parking required.', '${new Date(today.getTime() - 10*24*60*60*1000).toISOString()}'),
                ('MVL-2026-0099', 'Sara Connor', 'sara@outlook.com', '+1 (555) 304-1928', 'overnight_std', '${new Date(today.getTime() + 8*24*60*60*1000).toISOString().split('T')[0]}', '${new Date(today.getTime() + 10*24*60*60*1000).toISOString().split('T')[0]}', 2, 40.00, 'Pending', 'Order Signature Burger Combo on check-in.', '${new Date().toISOString()}')
            `);

            // Seed mock messages
            sqliteDb.exec(`
                INSERT INTO messages (name, email, phone, subject, message, date, status) VALUES
                ('Emily Stone', 'emily@gmail.com', '+1 (555) 321-0987', 'Signature Burger Combo Order', 'Hello, is the Signature Burger and Mocktail combo ($5) available to order directly to the gazebo? We want to book a table this Saturday!', '${new Date().toISOString()}', 'Unread'),
                ('Marcus Aurelius', 'marcus@philosophy.com', '+1 (555) 765-4321', 'Gazebo Booking Inquiry', 'Do we need to pay extra to sit in the Gazebo, or is it free for overnight guests? Thanks!', '${new Date().toISOString()}', 'Unread')
            `);

            console.log('✅ SQLite schema and seed data initialized successfully.');
        } catch (err) {
            console.error('❌ Failed to initialize SQLite database:', err.message);
        }
    } else {
        // Mock in-memory database seeding
        mockDb.users.push({ id: 1, username: 'admin', password: 'admin123', role: 'Admin', name: 'Mountain View Admin' });
        mockDb.rooms.push(
            { id: 1, type: 'ensuite_std', name: '2-Hour Ensuite (Standard)', price: 10, capacity: 2, totalRooms: 5, description: 'Short stay ensuite', amenities: 'Attached Bath, Hot Shower, Fast Wi-Fi, Security' },
            { id: 2, type: 'ensuite_premium', name: '2-Hour Ensuite (Premium)', price: 15, capacity: 2, totalRooms: 3, description: 'Premium short stay', amenities: 'Premium Bath, Hot Shower, Fast Wi-Fi, Security' },
            { id: 3, type: 'overnight_std', name: 'Overnight Stay (Standard)', price: 20, capacity: 2, totalRooms: 10, description: 'Cozy overnight stay', amenities: 'Standard Room, Hot Shower, Wi-Fi' },
            { id: 4, type: 'overnight_premium', name: 'Overnight Stay (Premium)', price: 25, capacity: 3, totalRooms: 5, description: 'Luxury overnight stay', amenities: 'Overnight Room, View, Hot Shower, Priority Gazebo' }
        );
        mockDb.settings.push(
            { id: 1, key: 'lodge_name', value: 'Mountain View Lodge' },
            { id: 2, key: 'lodge_location', value: 'Mountain View' }
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
        console.log(` Mountain View Lodge API server running on port ${port} [${dbType}]`);
    });
});
