// Node.js runner to execute the Supabase SQL migration on the remote database securely
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Safe connection defaults - loaded from environment variables to prevent credentials leak
const dbHost = process.env.DB_HOST || "aws-0-eu-north-1.pooler.supabase.com";
const dbPort = parseInt(process.env.DB_PORT || "6543", 10);
const dbUser = process.env.DB_USER || "postgres.flmhdvwsdvbtnjeekoxo";
const dbPassword = process.env.DB_PASSWORD || process.env.SUPABASE_DB_PASSWORD;
const dbName = process.env.DB_NAME || "postgres";

async function executeMigration() {
  console.log('🚀 Starting Supabase Database Migration securely via IPv4 pooler...');
  const sqlPath = path.join(__dirname, 'supabase_migration.sql');

  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ Migration SQL file not found at ${sqlPath}`);
    process.exit(1);
  }

  const migrationSql = fs.readFileSync(sqlPath, 'utf8');

  if (!dbPassword) {
    console.error('❌ Error: DB_PASSWORD or SUPABASE_DB_PASSWORD environment variable is not defined.');
    console.log('Please run as: DB_PASSWORD=your_password node run_migration.js');
    process.exit(1);
  }

  const client = new Client({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('🔌 Connected to Supabase PostgreSQL Database (via IPv4 Pooler).');

    // Execute the complete migration script
    await client.query(migrationSql);
    console.log('✅ DDL Schema migration applied successfully.');

    // Quick verification query
    const res = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('📊 Existing Public Tables:');
    res.rows.forEach(row => {
      console.log(` - ${row.table_name}`);
    });

  } catch (err) {
    console.error('❌ Migration failed with error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed.');
  }
}

executeMigration();
