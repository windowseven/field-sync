const mysql = require('mysql2/promise');

// Load env vars from .env if available
try { require('dotenv').config({ path: require('path').resolve(__dirname, '.env') }); } catch {}

async function main() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'fieldsync'
    });
    await connection.query('CREATE DATABASE IF NOT EXISTS fieldsync');
    console.log('✅ Database fieldsync ensured');
    await connection.end();
  } catch (error) {
    console.error('❌ Failed to ensure database:', error.message);
    process.exit(1);
  }
}

main();
