const loadDotenv = process.env.NODE_ENV !== 'production' && process.env.LOAD_DOTENV !== 'false';
if (loadDotenv) {
    require('dotenv').config();
}
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve frontend files

const databaseUrl = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production';
const disableDatabase = isProduction || process.env.DISABLE_DATABASE === 'true';
const isLocalDatabase = databaseUrl && /localhost|127\.0\.0\.1|::1/.test(databaseUrl);

let pool;
if (!disableDatabase && databaseUrl && !isLocalDatabase) {
    pool = new Pool({
        connectionString: databaseUrl,
        ssl: {
            rejectUnauthorized: false
        }
    });
    console.log('🔌 Using PostgreSQL pool from DATABASE_URL');
} else {
    if (disableDatabase) {
        console.warn('⚠️ Database has been disabled for this deploy. Using mock PostgreSQL pool.');
    } else if (!databaseUrl) {
        console.warn('⚠️ DATABASE_URL is not defined. Using mock PostgreSQL pool.');
    } else {
        console.warn('⚠️ DATABASE_URL points to localhost or an invalid host. Using mock PostgreSQL pool for deploy safety.');
    }
    
    // Demo data for mock pool
    const demoUsers = [
        { id: 1, username: 'admin', password: 'admin123', role: 'Admin', name: 'System Administrator' },
        { id: 2, username: 'teacher', password: 'teacher123', role: 'Teacher', name: 'Demo Teacher' },
        { id: 3, username: 'student', password: 'student123', role: 'Student', name: 'Demo Student' }
    ];

    const mockTables = {
        link_users: [
            { id: 1, userid: 'admin', name: 'System Administrator', avatar: '⚡', status: 'Available for support', online: 1, lastseen: 'Just now' },
            { id: 2, userid: 'teacher', name: 'Demo Teacher', avatar: '📚', status: 'In class', online: 1, lastseen: '2m ago' },
            { id: 3, userid: 'student', name: 'Demo Student', avatar: '🎓', status: 'Studying Math', online: 0, lastseen: '15m ago' },
            { id: 4, userid: 'alex_m', name: 'Alex Morgan', avatar: '🚀', status: 'Building Link Messenger!', online: 1, lastseen: 'Just now' }
        ],
        link_chats: [
            { id: 1, chatid: 'chat_admin_teacher', type: 'direct', name: 'Demo Teacher', participants: 'admin,teacher', lastmessage: 'Welcome to Link Messenger!', updatedat: new Date().toISOString() },
            { id: 2, chatid: 'chat_announcements', type: 'group', name: '📢 Campus Announcements', participants: 'admin,teacher,student,alex_m', lastmessage: 'Welcome to the new Link Messenger app!', updatedat: new Date().toISOString() }
        ],
        link_messages: [
            { id: 1, chatid: 'chat_admin_teacher', senderid: 'teacher', sendername: 'Demo Teacher', content: 'Hey Admin! Check out this new chat system.', attachment: null, reaction: '👍', timestamp: new Date(Date.now() - 3600000).toISOString() },
            { id: 2, chatid: 'chat_admin_teacher', senderid: 'admin', sendername: 'System Administrator', content: 'Welcome to Link Messenger!', attachment: null, reaction: '🔥', timestamp: new Date(Date.now() - 1800000).toISOString() },
            { id: 3, chatid: 'chat_announcements', senderid: 'admin', sendername: 'System Administrator', content: 'Welcome to the new Link Messenger app!', attachment: null, reaction: '❤️', timestamp: new Date().toISOString() }
        ],
        link_statuses: [
            { id: 1, userid: 'alex_m', username: 'Alex Morgan', useravatar: '🚀', content: 'Excited to launch Link Messenger today! 💬✨', bggradient: 'linear-gradient(135deg, #6366f1, #ec4899)', mediaurl: '', createdat: new Date().toISOString(), expiresat: new Date(Date.now() + 86400000).toISOString(), likes: 5 },
            { id: 2, userid: 'teacher', username: 'Demo Teacher', useravatar: '📚', content: 'Grade 10 Physics assignment posted on the portal.', bggradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)', mediaurl: '', createdat: new Date().toISOString(), expiresat: new Date(Date.now() + 86400000).toISOString(), likes: 3 }
        ],
        link_status_views: []
    };

    pool = {
        query: async (sql, params) => {
            // Return demo user data for login queries
            if (sql.includes('SELECT') && sql.includes('users') && !sql.includes('link_users')) {
                if (sql.includes('WHERE username = $1') && params && params[0]) {
                    const user = demoUsers.find(u => u.username === params[0]);
                    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
                }
                return { rows: demoUsers, rowCount: demoUsers.length };
            }

            // Handle mock table SELECT, INSERT, UPDATE, DELETE queries
            for (const tableName of Object.keys(mockTables)) {
                if (sql.includes(tableName)) {
                    if (sql.startsWith('SELECT')) {
                        let rows = [...mockTables[tableName]];
                        if (sql.includes('WHERE id = $1') && params && params[0]) {
                            rows = rows.filter(r => r.id == params[0]);
                        } else if (params && params.length > 0) {
                            // Basic filter simulation
                            let filterKey = sql.match(/WHERE\s+([a-zA-Z0-9_]+)\s*=/);
                            if (filterKey && filterKey[1]) {
                                const k = filterKey[1].toLowerCase();
                                rows = rows.filter(r => String(r[k] || r[filterKey[1]]) === String(params[0]));
                            }
                        }
                        if (sql.includes('ORDER BY')) {
                            rows.reverse();
                        }
                        if (sql.includes('LIMIT')) {
                            const limitMatch = sql.match(/LIMIT\s+(\d+)/i) || (params && sql.includes('LIMIT $'));
                            let lim = 100;
                            if (limitMatch && limitMatch[1]) lim = parseInt(limitMatch[1]);
                            rows = rows.slice(0, lim);
                        }
                        return { rows, rowCount: rows.length };
                    }

                    if (sql.startsWith('INSERT')) {
                        const newId = mockTables[tableName].length ? Math.max(...mockTables[tableName].map(r => r.id || 0)) + 1 : 1;
                        // Extract column names
                        const colsMatch = sql.match(/\(([^)]+)\)\s+VALUES/i);
                        const newObj = { id: newId };
                        if (colsMatch && params) {
                            const cols = colsMatch[1].split(',').map(c => c.trim().toLowerCase().replace(/"/g, ''));
                            cols.forEach((col, idx) => {
                                if (idx < params.length) newObj[col] = params[idx];
                            });
                        }
                        mockTables[tableName].push(newObj);
                        return { rows: [newObj], rowCount: 1 };
                    }

                    if (sql.startsWith('UPDATE')) {
                        if (sql.includes('WHERE id =')) {
                            const idVal = params[params.length - 1];
                            const idx = mockTables[tableName].findIndex(r => r.id == idVal);
                            if (idx !== -1) {
                                // Apply simple params update
                                return { rows: [mockTables[tableName][idx]], rowCount: 1 };
                            }
                        }
                        return { rows: [], rowCount: 0 };
                    }

                    if (sql.startsWith('DELETE')) {
                        if (params && params[0]) {
                            mockTables[tableName] = mockTables[tableName].filter(r => r.id != params[0]);
                        }
                        return { rows: [], rowCount: 1 };
                    }
                }
            }

            // Return empty rows for all other queries (mock data)
            return { rows: [], rowCount: 0 };
        },
        on: () => {}
    };
}

pool.on('connect', () => {
    console.log('🐘 Connected to PostgreSQL (Render Database)');
});


pool.on('error', (err) => {
    console.error('❌ PostgreSQL Pool Error:', err.message);
});

// Auto-create all tables on startup (PostgreSQL syntax)
async function initDb() {
    if (typeof pool.connect !== 'function') {
        console.warn('⚠️ Mock pool – skipping DB initialization.');
        return;
    }
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS students (
                id SERIAL PRIMARY KEY,
                studentId TEXT UNIQUE,
                name TEXT,
                class TEXT,
                gender TEXT,
                parentContact TEXT
            );
            CREATE TABLE IF NOT EXISTS attendance (
                id SERIAL PRIMARY KEY,
                studentId TEXT,
                date TEXT,
                status TEXT
            );
            CREATE TABLE IF NOT EXISTS fees (
                id SERIAL PRIMARY KEY,
                studentId TEXT,
                amount DECIMAL(10,2),
                date TEXT,
                type TEXT
            );
            CREATE TABLE IF NOT EXISTS marks (
                id SERIAL PRIMARY KEY,
                studentId TEXT,
                subject TEXT,
                score INTEGER,
                term TEXT,
                year INTEGER
            );
            CREATE TABLE IF NOT EXISTS staff (
                id SERIAL PRIMARY KEY,
                staffId TEXT UNIQUE,
                name TEXT,
                role TEXT,
                contact TEXT
            );
            CREATE TABLE IF NOT EXISTS subjects (
                id SERIAL PRIMARY KEY,
                name TEXT,
                class TEXT,
                teacherId TEXT
            );
            CREATE TABLE IF NOT EXISTS assets (
                id SERIAL PRIMARY KEY,
                name TEXT,
                quantity INTEGER,
                condition TEXT,
                value DECIMAL(10,2),
                purchaseDate TEXT
            );
            CREATE TABLE IF NOT EXISTS library (
                id SERIAL PRIMARY KEY,
                title TEXT,
                ISBN TEXT,
                author TEXT,
                quantity INTEGER,
                available INTEGER
            );
            CREATE TABLE IF NOT EXISTS bookLoans (
                id SERIAL PRIMARY KEY,
                bookId INTEGER,
                studentId TEXT,
                loanDate TEXT,
                returnDate TEXT,
                status TEXT
            );
            CREATE TABLE IF NOT EXISTS discipline (
                id SERIAL PRIMARY KEY,
                studentId TEXT,
                infraction TEXT,
                date TEXT,
                action TEXT,
                severity TEXT
            );
            CREATE TABLE IF NOT EXISTS health (
                id SERIAL PRIMARY KEY,
                studentId TEXT,
                bloodGroup TEXT,
                allergies TEXT,
                emergencyContact TEXT,
                status TEXT DEFAULT 'FIT',
                lastCheckup TEXT
            );
            CREATE TABLE IF NOT EXISTS payroll (
                id SERIAL PRIMARY KEY,
                staffId TEXT,
                month TEXT,
                year INTEGER,
                salary DECIMAL(10,2),
                bonus DECIMAL(10,2),
                deductions DECIMAL(10,2),
                status TEXT
            );
            CREATE TABLE IF NOT EXISTS expenses (
                id SERIAL PRIMARY KEY,
                name TEXT,
                amount DECIMAL(10,2),
                category TEXT,
                date TEXT
            );
            CREATE TABLE IF NOT EXISTS notices (
                id SERIAL PRIMARY KEY,
                title TEXT,
                content TEXT,
                date TEXT,
                priority TEXT DEFAULT 'Medium'
            );
            CREATE TABLE IF NOT EXISTS hostels (
                id SERIAL PRIMARY KEY,
                name TEXT,
                capacity INTEGER,
                gender TEXT
            );
            CREATE TABLE IF NOT EXISTS hostelAssignments (
                id SERIAL PRIMARY KEY,
                studentId TEXT,
                hostelId INTEGER,
                roomNo TEXT
            );
            CREATE TABLE IF NOT EXISTS transport (
                id SERIAL PRIMARY KEY,
                route TEXT,
                busNo TEXT,
                driver TEXT
            );
            CREATE TABLE IF NOT EXISTS transportAssignments (
                id SERIAL PRIMARY KEY,
                studentId TEXT,
                routeId INTEGER
            );
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                title TEXT,
                message TEXT,
                date TEXT,
                type TEXT,
                read INTEGER DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE,
                password TEXT,
                role TEXT,
                name TEXT
            );
            CREATE TABLE IF NOT EXISTS public_settings (
                id SERIAL PRIMARY KEY,
                key TEXT UNIQUE,
                value TEXT
            );
            CREATE TABLE IF NOT EXISTS public_achievements (
                id SERIAL PRIMARY KEY,
                category TEXT,
                title TEXT,
                content TEXT,
                icon TEXT
            );
            CREATE TABLE IF NOT EXISTS public_curriculum (
                id SERIAL PRIMARY KEY,
                category TEXT,
                icon TEXT,
                description TEXT,
                details TEXT
            );
            CREATE TABLE IF NOT EXISTS public_testimonials (
                id SERIAL PRIMARY KEY,
                name TEXT,
                role TEXT,
                quote TEXT,
                emoji TEXT
            );
            CREATE TABLE IF NOT EXISTS link_users (
                id SERIAL PRIMARY KEY,
                userId TEXT UNIQUE,
                name TEXT,
                avatar TEXT,
                status TEXT DEFAULT 'Hey there! I am using Link.',
                online INTEGER DEFAULT 1,
                lastSeen TEXT
            );
            CREATE TABLE IF NOT EXISTS link_chats (
                id SERIAL PRIMARY KEY,
                chatId TEXT UNIQUE,
                type TEXT DEFAULT 'direct',
                name TEXT,
                participants TEXT,
                lastMessage TEXT,
                updatedAt TEXT
            );
            CREATE TABLE IF NOT EXISTS link_messages (
                id SERIAL PRIMARY KEY,
                chatId TEXT,
                senderId TEXT,
                senderName TEXT,
                content TEXT,
                attachment TEXT,
                reaction TEXT,
                timestamp TEXT
            );
            CREATE TABLE IF NOT EXISTS link_statuses (
                id SERIAL PRIMARY KEY,
                userId TEXT,
                userName TEXT,
                userAvatar TEXT,
                content TEXT,
                bgGradient TEXT,
                mediaUrl TEXT,
                createdAt TEXT,
                expiresAt TEXT,
                likes INTEGER DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS link_status_views (
                id SERIAL PRIMARY KEY,
                statusId INTEGER,
                viewerId TEXT,
                viewedAt TEXT
            );
        `);

        // Create default admin account
        const adminRes = await client.query('SELECT id FROM users WHERE username = $1', ['admin']);
        if (adminRes.rowCount === 0) {
            await client.query('INSERT INTO users (username, password, role, name) VALUES ($1, $2, $3, $4)', ['admin', 'admin123', 'Admin', 'System Administrator']);
            console.log('Default admin created: username=admin, password=admin123');
        }

        // Seed Public Dashboard Data
        const settingsRes = await client.query('SELECT COUNT(*) as count FROM public_settings');
        if (parseInt(settingsRes.rows[0].count) === 0) {
            await client.query('INSERT INTO public_settings (key, value) VALUES ($1, $2)', ['countdown_title', 'Term 2 Admissions Open']);
            await client.query('INSERT INTO public_settings (key, value) VALUES ($1, $2)', ['countdown_date', new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()]);
            await client.query('INSERT INTO public_settings (key, value) VALUES ($1, $2)', ['weather_mock', '☀️ 24°C']);
            await client.query('INSERT INTO public_settings (key, value) VALUES ($1, $2)', ['transport_status', '🚌 All Routes On Time']);
        }

        const achievementRes = await client.query('SELECT COUNT(*) as count FROM public_achievements');
        if (parseInt(achievementRes.rows[0].count) === 0) {
            const achievements = [
                ['Academics', 'Sarah Jenkins', 'National Science Olympiad Winner 2025. Perfect score in Advanced Physics.', '🥇'],
                ['Sports', 'Senior Boys Football', 'Regional Champions for three consecutive years (2023-2025).', '⚽'],
                ['Arts', 'Drama Club', 'Awarded "Best Ensemble" at the National Schools Theatre Festival.', '🎭']
            ];
            for (const a of achievements) {
                await client.query('INSERT INTO public_achievements (category, title, content, icon) VALUES ($1, $2, $3, $4)', a);
            }
        }

        const curriculumRes = await client.query('SELECT COUNT(*) as count FROM public_curriculum');
        if (parseInt(curriculumRes.rows[0].count) === 0) {
            const curriculum = [
                ['STEM', '🧪', 'Science, Technology, Engineering & Math', 'Advanced Physics Lab, Robotics & AI Club, AP Calculus & Statistics, Environmental Science'],
                ['Humanities', '📚', 'Languages, History & Social Sciences', 'World Literature, Modern European History, Psychology & Sociology, Model UN Debate Team'],
                ['Creative Arts', '🎭', 'Fine Arts, Music & Performance', 'Digital Graphic Design, Classical & Jazz Orchestra, Theatre Production, 3D Sculpting Studio']
            ];
            for (const c of curriculum) {
                await client.query('INSERT INTO public_curriculum (category, icon, description, details) VALUES ($1, $2, $3, $4)', c);
            }
        }

        const testimonialRes = await client.query('SELECT COUNT(*) as count FROM public_testimonials');
        if (parseInt(testimonialRes.rows[0].count) === 0) {
            await client.query('INSERT INTO public_testimonials (name, role, quote, emoji) VALUES ($1, $2, $3, $4)', [
                'Dr. Alistair Chen',
                'Class of 2014 • Senior Lead Engineer, Quantum Compute',
                'The foundation I received here didn\'t just teach me how to pass exams; it taught me how to think critically, innovate, and lead with empathy. It was the launchpad for my career in AI research.',
                '🎓'
            ]);
        }

        await client.query('COMMIT');
        console.log('✅ Database initialized and seed data ready');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Database initialization failed:', err.message);
    } finally {
        client.release();
    }
}

initDb();

// Allowed tables for security
const ALLOWED_TABLES = [
    'students', 'attendance', 'fees', 'marks', 'staff', 'subjects', 'assets',
    'library', 'bookLoans', 'discipline', 'health', 'payroll',
    'expenses', 'notices', 'hostels', 'hostelAssignments', 'transport',
    'transportAssignments', 'notifications', 'users',
    'public_settings', 'public_achievements', 'public_curriculum', 'public_testimonials',
    'link_users', 'link_chats', 'link_messages', 'link_statuses', 'link_status_views'
];

function validateTable(table, res) {
    if (!ALLOWED_TABLES.includes(table)) {
        res.status(400).json({ error: `Invalid table: ${table}` });
        return false;
    }
    return true;
}

// GET all rows with optional filter params
app.get('/api/:table', async (req, res) => {
    const { table } = req.params;
    if (!validateTable(table, res)) return;

    const { _sort, _order, _limit, ...filters } = req.query;

    try {
        let sql = `SELECT * FROM ${table}`;
        const values = [];
        const conditions = [];

        let i = 1;
        for (const [key, value] of Object.entries(filters)) {
            conditions.push(`${key} = $${i++}`);
            values.push(value);
        }
        
        if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
        if (_sort) sql += ` ORDER BY ${_sort} ${(_order || 'ASC').toUpperCase()}`;
        if (_limit) sql += ` LIMIT ${parseInt(_limit)}`;

        const result = await pool.query(sql, values);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET single row by id
app.get('/api/:table/:id', async (req, res) => {
    const { table, id } = req.params;
    if (!validateTable(table, res)) return;
    try {
        const result = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST single or bulk insert
app.post('/api/:table', async (req, res) => {
    const { table } = req.params;
    if (!validateTable(table, res)) return;

    try {
        const data = req.body;
        if (Array.isArray(data)) {
            const insertedRows = [];
            for (const item of data) {
                const keys = Object.keys(item);
                const values = Object.values(item);
                const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
                const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
                const result = await pool.query(sql, values);
                insertedRows.push(result.rows[0]);
            }
            res.status(201).json(insertedRows);
        } else {
            const keys = Object.keys(data);
            const values = Object.values(data);
            const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
            const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`;
            const result = await pool.query(sql, values);
            res.status(201).json(result.rows[0]);
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: err.message });
    }
});

// PUT update single row by id
app.put('/api/:table/:id', async (req, res) => {
    const { table, id } = req.params;
    if (!validateTable(table, res)) return;
    try {
        const data = req.body;
        const keys = Object.keys(data);
        const values = Object.values(data);
        const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
        
        const sql = `UPDATE ${table} SET ${setClause} WHERE id = $${keys.length + 1} RETURNING *`;
        const result = await pool.query(sql, [...values, id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE single row by id
app.delete('/api/:table/:id', async (req, res) => {
    const { table, id } = req.params;
    if (!validateTable(table, res)) return;
    try {
        await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
        res.json({ message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Config route for frontend
app.get('/api/config', (req, res) => {
    res.json({
        database: 'PostgreSQL',
        initialized: true
    });
});

app.listen(port, "0.0.0.0", () => {
    console.log(`Egles SMIS server running on port ${port}`);
});
