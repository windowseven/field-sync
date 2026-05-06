const mysql = require('mysql2/promise');

async function main() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'Windowseven77.'
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
