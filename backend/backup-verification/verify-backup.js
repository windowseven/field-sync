import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Database configuration from environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'field_sync',
};

async function getConnection(database = null) {
  const config = { ...dbConfig };
  if (database) {
    config.database = database;
  } else {
    // If no database specified, we'll use the default from config, but we want to avoid selecting a DB initially
    delete config.database;
  }
  return mysql.createConnection(config);
}

async def executeQuery(connection, query, params = []) {
  try {
    const [results] = await connection.execute(query, params);
    return results;
  } catch (error) {
    console.error(`Error executing query: ${query}`);
    console.error(error);
    throw error;
  }
}

async function listTables(connection) {
  const query = 'SHOW TABLES';
  const tables = await executeQuery(connection, query);
  // The result is an array of objects with keys like 'Tables_in_database_name'
  const tableNameKey = Object.keys(tables[0])[0];
  return tables.map(row => row[tableNameKey]);
}

async function getCreateTable(connection, tableName) {
  const query = `SHOW CREATE TABLE \`${tableName}\``;
  const result = await executeQuery(connection, query);
  return result[0]['Create Table'];
}

async function getTableRowCount(connection, tableName) {
  const query = `SELECT COUNT(*) as count FROM \`${tableName}\``;
  const result = await executeQuery(connection, query);
  return result[0].count;
}

async function cloneDatabase() {
  let srcConnection;
  let destConnection;
  const tempDbName = `field_sync_backup_verification_${Date.now()}`;

  try {
    // Connect to source database (without selecting a DB initially to create temp DB)
    srcConnection = await getConnection();
    destConnection = await getConnection();

    // Create temporary database
    await executeQuery(destConnection, `CREATE DATABASE IF NOT EXISTS \`${tempDbName}\``);
    console.log(`Created temporary database: ${tempDbName}`);

    // Select the temporary database for destination
    await executeQuery(destConnection, `USE \`${tempDbName}\``);

    // Get list of tables from source
    await executeQuery(srcConnection, `USE \`${dbConfig.database}\``);
    const tables = await listTables(srcConnection);
    console.log(`Found ${tables.length} tables to clone`);

    // Clone each table
    for (const tableName of tables) {
      console.log(`Cloning table: ${tableName}`);

      // Get CREATE TABLE statement from source
      const createTableSql = await getCreateTable(srcConnection, tableName);
      // Execute on destination
      await executeQuery(destConnection, createTableSql);

      // Copy data in batches to avoid memory issues
      const batchSize = 1000;
      let offset = 0;
      let hasMoreData = true;

      while (hasMoreData) {
        const selectQuery = `SELECT * FROM \`${tableName}\` LIMIT ${batchSize} OFFSET ${offset}`;
        const rows = await executeQuery(srcConnection, selectQuery);

        if (rows.length === 0) {
          hasMoreData = false;
          break;
        }

        // Prepare INSERT statement
        const columns = Object.keys(rows[0]).map(key => `\`${key}\``).join(', ');
        const placeholders = Object.keys(rows[0]).map(() => '?').join(', ');
        const insertQuery = `INSERT INTO \`${tableName}\` (${columns}) VALUES (${placeholders})`;

        // Insert each row
        for (const row of rows) {
          const values = Object.values(row);
          await executeQuery(destConnection, insertQuery, values);
        }

        offset += batchSize;
        console.log(`  Copied ${offset} rows for table ${tableName}`);
      }
    }

    // Verification: Compare row counts for each table
    console.log('\nVerifying row counts...');
    let mismatchFound = false;
    for (const tableName of tables) {
      const srcCount = await getTableRowCount(srcConnection, tableName);
      // Switch destination to temp db for count
      await executeQuery(destConnection, `USE \`${tempDbName}\``);
      const destCount = await getTableRowCount(destConnection, tableName);

      if (srcCount !== destCount) {
        console.error(`❌ Mismatch in table ${tableName}: source=${srcCount}, destination=${destCount}`);
        mismatchFound = true;
      } else {
        console.log(`✅ Table ${tableName}: ${srcCount} rows`);
      }
    }

    if (!mismatchFound) {
      console.log('\n🎉 All tables cloned successfully with matching row counts!');
    } else {
      console.log('\n⚠️  Verification completed with mismatches found.');
    }

    return !mismatchFound;
  } catch (error) {
    console.error('❌ Backup verification failed:', error);
    return false;
  } finally {
    // Clean up: close connections and drop temporary database
    try {
      if (srcConnection) {
        await srcConnection.end();
      }
      if (destConnection) {
        // Drop the temporary database
        await executeQuery(destConnection, `DROP DATABASE IF EXISTS \`${tempDbName}\``);
        console.log(`Dropped temporary database: ${tempDbName}`);
        await destConnection.end();
      }
    } catch (cleanupError) {
      console.error('Error during cleanup:', cleanupError);
    }
  }
}

// Run the verification if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cloneDatabase()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Unexpected error:', err);
      process.exit(1);
    });
}

export { cloneDatabase };