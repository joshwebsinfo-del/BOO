const { Pool } = require('pg');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL;

let pool;
if (databaseUrl) {
    pool = new Pool({
        connectionString: databaseUrl,
        ssl: {
            rejectUnauthorized: false
        }
    });
} else {
    // Elegant fallback simulation pool for developer safety
    pool = {
        query: async (text, params) => {
            console.log(`[Mock DB Pool Query]: ${text}`);
            return { rows: [], rowCount: 0 };
        },
        on: () => {}
    };
}

module.exports = { pool };
