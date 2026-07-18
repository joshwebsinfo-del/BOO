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
    
    // Demo data for mock pool - updated to use the user's specific Admin email and password
    const demoUsers = [
        { id: 1, username: 'joshwebsinfo@gmail.com', password: 'joshua#$#$', role: 'Admin', name: 'Joshua Webs Administrator' },
        { id: 2, username: 'teacher', password: 'teacher123', role: 'Teacher', name: 'Demo Teacher' },
        { id: 3, username: 'student', password: 'student123', role: 'Student', name: 'Demo Student' }
    ];

    const mockDbStore = {
        video_tutorials: [
            { id: 1, title: 'Database Systems Crash Course', module_name: 'Module 1: Relational Algebra', topic_name: '1.2 Schema Design & Normalization Rules', video_url: 'https://www.youtube.com/watch?v=KwekwePolyCS301' }
        ],
        planner_tasks: [],
        notifications: [],
        users: demoUsers
    };
    
    pool = {
        query: async (sql, params) => {
            const normalizedSql = sql.toLowerCase();

            // Check for INSERT INTO
            if (normalizedSql.includes('insert into')) {
                const tableNameMatch = sql.match(/insert into\s+(\w+)/i);
                if (tableNameMatch) {
                    const tableName = tableNameMatch[1];
                    if (!mockDbStore[tableName]) {
                        mockDbStore[tableName] = [];
                    }
                    // Extract values or use params
                    const newObj = { id: mockDbStore[tableName].length + 1 };
                    if (params && params.length > 0) {
                        // Match keys to values
                        const keysMatch = sql.match(/\(([^)]+)\)\s+values/i);
                        if (keysMatch) {
                            const keys = keysMatch[1].split(',').map(k => k.trim());
                            keys.forEach((k, idx) => {
                                newObj[k] = params[idx];
                            });
                        }
                    }
                    mockDbStore[tableName].push(newObj);
                    return { rows: [newObj], rowCount: 1 };
                }
            }

            // Check for SELECT
            if (normalizedSql.includes('select')) {
                const tableNameMatch = sql.match(/from\s+(\w+)/i);
                if (tableNameMatch) {
                    const tableName = tableNameMatch[1];
                    const rows = mockDbStore[tableName] || [];

                    if (tableName === 'users' && normalizedSql.includes('where username = $1')) {
                        const user = rows.find(u => u.username === params[0]);
                        return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
                    }
                    return { rows, rowCount: rows.length };
                }
            }

            // Check for DELETE
            if (normalizedSql.includes('delete from')) {
                const tableNameMatch = sql.match(/delete from\s+(\w+)/i);
                if (tableNameMatch) {
                    const tableName = tableNameMatch[1];
                    if (mockDbStore[tableName]) {
                        if (normalizedSql.includes('where id = $1') && params && params[0]) {
                            mockDbStore[tableName] = mockDbStore[tableName].filter(item => item.id != params[0]);
                        } else {
                            mockDbStore[tableName] = [];
                        }
                    }
                    return { rows: [], rowCount: 0 };
                }
            }

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
            CREATE TABLE IF NOT EXISTS video_tutorials (
                id SERIAL PRIMARY KEY,
                title TEXT,
                module_name TEXT,
                topic_name TEXT,
                video_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS planner_tasks (
                id SERIAL PRIMARY KEY,
                user_id TEXT,
                task_text TEXT,
                priority TEXT,
                completed INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Create default admin account with email joshwebsinfo@gmail.com and password joshua#$#$
        const adminRes = await client.query('SELECT id FROM users WHERE username = $1', ['joshwebsinfo@gmail.com']);
        if (adminRes.rowCount === 0) {
            await client.query('INSERT INTO users (username, password, role, name) VALUES ($1, $2, $3, $4)', ['joshwebsinfo@gmail.com', 'joshua#$#$', 'Admin', 'Joshua Webs Administrator']);
            console.log('Default admin created: username=joshwebsinfo@gmail.com, password=joshua#$#$');
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

        const tutorialsRes = await client.query('SELECT COUNT(*) as count FROM video_tutorials');
        if (parseInt(tutorialsRes.rows[0].count) === 0) {
            await client.query(`
                INSERT INTO video_tutorials (title, module_name, topic_name, video_url)
                VALUES ('Database Systems Crash Course', 'Module 1: Relational Algebra', '1.2 Schema Design & Normalization Rules', 'https://www.youtube.com/watch?v=KwekwePolyCS301')
            `);
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
    'video_tutorials', 'planner_tasks'
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

// Save chat messages dynamically to DB or cache
app.post('/api/save_chat', async (req, res) => {
    try {
        const { user_id, question, answer, subject, model } = req.body;
        // Check if DB exists or pool has real DB query
        if (typeof pool.connect === 'function') {
            await pool.query(`
                INSERT INTO notifications (title, message, date, type)
                VALUES ($1, $2, $3, $4)
            `, ['New Chat Query Saved', `User asked: "${question.substring(0, 40)}..."`, new Date().toLocaleDateString(), 'Info']);
        }
        res.json({ success: true, message: 'Chat interaction recorded successfully' });
    } catch (err) {
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

// --- Node.js Express AI Backend Fallback Integration ---

// In-memory rate limiting state
const rateLimitWindowMs = 60 * 1000; // 1 minute
const rateLimitMaxRequests = 30;
const ipRequests = new Map();

function customRateLimiter(req, res, next) {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();
    const userRequests = ipRequests.get(ip) || [];

    // Filter requests in the current window
    const activeRequests = userRequests.filter(timestamp => now - timestamp < rateLimitWindowMs);

    if (activeRequests.length >= rateLimitMaxRequests) {
        console.warn(`[Rate Limit Blocked]: IP ${ip} exceeded max request limit of ${rateLimitMaxRequests}/min`);
        return res.status(429).json({
            error: 'Too many requests. Please try again after a minute.',
            success: false
        });
    }

    activeRequests.push(now);
    ipRequests.set(ip, activeRequests);
    next();
}

// Timeout helper with AbortController
async function fetchWithTimeout(url, options, timeoutMs = 10000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(timeout);
        return response;
    } catch (err) {
        clearTimeout(timeout);
        throw err;
    }
}

// Highly reliable fetch call helper with automatic retry logic
async function fetchWithRetry(url, options, timeoutMs = 10000, maxRetries = 2) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`[AI Backend]: Attempting API call (Attempt ${attempt}/${maxRetries}) to ${url.substring(0, 60)}...`);
            const response = await fetchWithTimeout(url, options, timeoutMs);
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`HTTP Error ${response.status}: ${text}`);
            }
            return response;
        } catch (err) {
            console.warn(`[AI Backend warning]: Attempt ${attempt} failed: ${err.message}`);
            lastError = err;
            if (attempt < maxRetries) {
                // Wait briefly before retrying (exponential backoff helper)
                await new Promise(resolve => setTimeout(resolve, attempt * 500));
            }
        }
    }
    throw lastError;
}

// 1. Google Gemini API integration (with user-provided API key injected)
async function tryGemini(prompt, subject, context) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not defined on backend.');

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const systemPrompt = `You are EduMentor, a highly skilled academic tutor at Kwekwe Poly.
Subject: ${subject || 'General Education'}
Context details: ${context || 'None'}
Answer the following query clearly with step-by-step breakdowns, code formatting if applicable, and terminology:`;

    const body = {
        contents: [
            {
                parts: [
                    { text: `${systemPrompt}\n\nStudent Query: "${prompt}"` }
                ]
            }
        ]
    };

    const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    }, 12000, 2);

    const json = await response.json();
    if (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts[0]) {
        return json.candidates[0].content.parts[0].text;
    }
    throw new Error('Unexpected Google Gemini payload format.');
}

// 2. Groq API integration (with user-provided API key injected)
async function tryGroq(prompt, subject, context) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('GROQ_API_KEY is not defined on backend.');

    const url = 'https://api.groq.com/openai/v1/chat/completions';
    const systemPrompt = `You are EduMentor, a highly skilled academic tutor at Kwekwe Poly.
Subject: ${subject || 'General Education'}
Context details: ${context || 'None'}
Answer the student query step-by-step. Use code formatting and terminology where appropriate.`;

    const body = {
        model: 'llama-3.3-70b-versatile',
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
        ]
    };

    const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(body)
    }, 12000, 2);

    const json = await response.json();
    if (json.choices && json.choices[0] && json.choices[0].message) {
        return json.choices[0].message.content;
    }
    throw new Error('Unexpected Groq payload format.');
}

// 3. OpenRouter API integration (with user-provided API key injected)
async function tryOpenRouter(prompt, subject, context) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OPENROUTER_API_KEY is not defined on backend.');

    const url = 'https://openrouter.ai/api/v1/chat/completions';
    const systemPrompt = `You are EduMentor, a highly skilled academic tutor at Kwekwe Poly.
Subject: ${subject || 'General Education'}
Context: ${context || 'None'}`;

    // Cascade models within OpenRouter (DeepSeek R1 -> Llama 3.1 8b free fallback)
    const models = ['deepseek/deepseek-r1', 'meta-llama/llama-3.1-8b-instruct:free'];
    let lastError;

    for (const model of models) {
        try {
            console.log(`[OpenRouter]: Trying OpenRouter model ${model}...`);
            const body = {
                model: model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ]
            };

            const response = await fetchWithRetry(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': 'https://edumentor.smis.production',
                    'X-Title': 'EduMentor AI'
                },
                body: JSON.stringify(body)
            }, 12000, 1); // 1 retry per OpenRouter candidate model

            const json = await response.json();
            if (json.choices && json.choices[0] && json.choices[0].message) {
                return {
                    text: json.choices[0].message.content,
                    modelUsed: model
                };
            }
            throw new Error('Unexpected OpenRouter response payload layout.');
        } catch (err) {
            console.warn(`[OpenRouter Model Failed] ${model}: ${err.message}`);
            lastError = err;
        }
    }
    throw lastError;
}

// POST AI Chat Handler Route
app.post('/api/ai/chat', customRateLimiter, async (req, res) => {
    const { message, subject, context } = req.body;

    // Request Validation
    if (!message || typeof message !== 'string' || !message.trim()) {
        console.warn('[AI Backend Validation Error]: Request missing message parameter.');
        return res.status(400).json({
            error: 'Missing required string parameter "message".',
            success: false
        });
    }

    console.log(`[AI Backend Request]: New query on Subject: "${subject || 'General'}"`);

    // AI Providers Fallback System Chain
    try {
        // Step 1: Try primary provider (Google Gemini 2.0 Flash)
        try {
            console.log('[AI Backend Cascade]: Attempting Gemini 2.0 Flash...');
            const answer = await tryGemini(message, subject, context);
            console.log('[AI Backend Cascade Success]: Gemini 2.0 Flash responded successfully.');
            return res.json({
                answer,
                model: 'gemini-2.0-flash',
                success: true
            });
        } catch (geminiError) {
            console.error(`[AI Backend Gemini Error]: ${geminiError.message}`);
            console.log('[AI Backend Cascade]: Falling back to Groq Llama 3.3...');

            // Step 2: Fall back to Backup 1 (Groq llama-3.3-70b-versatile)
            try {
                const answer = await tryGroq(message, subject, context);
                console.log('[AI Backend Cascade Success]: Groq Llama 3.3 responded successfully.');
                return res.json({
                    answer,
                    model: 'llama-3.3-70b-versatile',
                    success: true
                });
            } catch (groqError) {
                console.error(`[AI Backend Groq Error]: ${groqError.message}`);
                console.log('[AI Backend Cascade]: Falling back to OpenRouter (DeepSeek R1/Llama)...');

                // Step 3: Fall back to Backup 2 (OpenRouter deepseek/deepseek-r1 -> llama fallback)
                try {
                    const result = await tryOpenRouter(message, subject, context);
                    console.log(`[AI Backend Cascade Success]: OpenRouter (${result.modelUsed}) responded successfully.`);
                    return res.json({
                        answer: result.text,
                        model: result.modelUsed,
                        success: true
                    });
                } catch (openRouterError) {
                    console.error(`[AI Backend OpenRouter Error]: ${openRouterError.message}`);
                    throw new Error(`All primary and backup AI providers are currently unavailable. Errors: Gemini=[${geminiError.message}], Groq=[${groqError.message}], OpenRouter=[${openRouterError.message}]`);
                }
            }
        }
    } catch (finalErr) {
        console.error(`[AI Backend Terminal Error]: ${finalErr.message}`);
        res.status(503).json({
            error: finalErr.message,
            success: false
        });
    }
});

app.listen(port, "0.0.0.0", () => {
    console.log(`Kwekwe Poly SMIS server running on port ${port}`);
});
