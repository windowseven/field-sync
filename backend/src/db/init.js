import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';
import logger from '../utils/logger.js';
import { runMigrations } from './migrate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const initializeDatabase = async ({ allowDestructive = false } = {}) => {
  if (allowDestructive) {
    logger.warn('⚠️  DESTRUCTIVE MODE ENABLED — this will drop and recreate all tables!');
    const schemaPath = path.join(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error('schema.sql not found — destructive init requires schema.sql for full reset');
    }

    let schemaSql = fs.readFileSync(schemaPath, 'utf8');
    schemaSql = schemaSql.replace(/--.*$/gm, '');
    schemaSql = schemaSql.replace(/\/\*[\s\S]*?\*\//g, '');

    const queries = schemaSql
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0);

    const tableQueries = queries.filter(q => /^CREATE\s+TABLE\b/i.test(q));
    const remainingQueries = queries.filter(q => !/^CREATE\s+TABLE\b/i.test(q));
    const orderedQueries = [...tableQueries, ...remainingQueries];

    const connection = await pool.getConnection();
    try {
      logger.info('🚀 Running destructive database reset...');
      for (const query of orderedQueries) {
        try {
          await connection.query(query);
        } catch (err) {
          if (!err.message.includes('already exists') && !err.message.includes('Duplicate key name')) {
            logger.warn(`Query warning: ${err.message}`);
          }
        }
      }
      logger.info('✅ Destructive reset complete.');
    } finally {
      connection.release();
    }
    return;
  }

  // Safe mode: run versioned migrations
  logger.info('🚀 Running database migrations...');
  const results = await runMigrations();
  const applied = results.filter(r => r.status === 'applied').length;
  const skipped = results.filter(r => r.status === 'skipped' || r.status === 'skipped_duplicate').length;
  logger.info(`✅ Migrations complete (${applied} applied, ${skipped} skipped)`);
};
