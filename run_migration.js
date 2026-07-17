// Node.js runner to execute the Supabase SQL migration on the remote database
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function executeMigration() {
  console.log('🚀 Starting Supabase Database Migration via IPv4 pooler...');
  const sqlPath = path.join(__dirname, 'supabase_migration.sql');

  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ Migration SQL file not found at ${sqlPath}`);
    process.exit(1);
  }

  const migrationSql = fs.readFileSync(sqlPath, 'utf8');

  // Pass connection parameters individually to enforce rejectUnauthorized: false
  const client = new Client({
    host: "aws-0-eu-north-1.pooler.supabase.com",
    port: 6543,
    user: "postgres.flmhdvwsdvbtnjeekoxo",
    password: "joshuamujakari6945",
    database: "postgres",
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
