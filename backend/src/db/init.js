import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const initializeDatabase = async ({ allowDestructive = false } = {}) => {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    let schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Remove SQL comments
    schemaSql = schemaSql.replace(/--.*$/gm, '');
    schemaSql = schemaSql.replace(/\/\*[\s\S]*?\*\//g, '');

    if (!allowDestructive) {
      schemaSql = schemaSql.replace(/^SET FOREIGN_KEY_CHECKS = 0;\s*$/gim, '');
      schemaSql = schemaSql.replace(/^SET FOREIGN_KEY_CHECKS = 1;\s*$/gim, '');
      schemaSql = schemaSql.replace(/^DROP TABLE IF EXISTS .*;\s*$/gim, '');
    }

    const queries = schemaSql
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0);

    const connection = await pool.getConnection();
    
    logger.info('🚀 Starting database initialization...');

    for (const query of queries) {
      try {
        await connection.query(query);
      } catch (err) {
        // Ignore "already exists" errors if we missed IF NOT EXISTS somewhere
        if (
          !err.message.includes('already exists') &&
          !err.message.includes('Duplicate key name')
        ) {
          logger.error(`Error executing query: ${query.substring(0, 50)}...`);
          logger.error(err.message);
        }
      }
    }

    logger.info('✅ Database initialized successfully.');
    connection.release();
  } catch (error) {
    logger.error('❌ Database initialization failed:', error.message);
    throw error;
  }
};
