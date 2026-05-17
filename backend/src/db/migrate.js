import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function ensureTrackingTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name VARCHAR(255) PRIMARY KEY,
      hash VARCHAR(64) NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getAppliedMigrations(connection) {
  const [rows] = await connection.query('SELECT name, hash FROM _migrations ORDER BY name');
  return new Map(rows.map(r => [r.name, r.hash]));
}

function computeHash(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();
}

export async function runMigrations({ dryRun = false, force = false } = {}) {
  const files = getMigrationFiles();
  if (files.length === 0) {
    logger.info('No migration files found.');
    return [];
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await ensureTrackingTable(connection);
    const applied = await getAppliedMigrations(connection);

    const results = [];

    for (const file of files) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const hash = computeHash(content);
      const existingHash = applied.get(file);

      if (existingHash) {
        if (existingHash !== hash && !force) {
          logger.warn(`⚠️  Migration ${file} hash has changed! Use --force to re-apply.`);
          results.push({ file, status: 'hash_mismatch' });
        } else {
          logger.info(`⏭️  ${file} already applied`);
          results.push({ file, status: 'skipped' });
        }
        continue;
      }

      const statements = content
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      if (dryRun) {
        logger.info(`🔍 [DRY RUN] Would apply ${file} (${statements.length} statements)`);
        results.push({ file, status: 'dry_run' });
        continue;
      }

      try {
        for (const stmt of statements) {
          await connection.query(stmt);
        }
        await connection.query(
          'INSERT INTO _migrations (name, hash) VALUES (?, ?)',
          [file, hash]
        );
        logger.info(`✅ ${file} applied (${statements.length} statements)`);
        results.push({ file, status: 'applied' });
      } catch (err) {
        if (err.message.includes('Duplicate') || err.code === 'ER_DUP_KEYNAME' || err.code === 'ER_DUP_FIELDKEY') {
          logger.info(`⏭️  ${file}: ${err.message} (safe to skip)`);
          await connection.query(
            'INSERT INTO _migrations (name, hash) VALUES (?, ?) ON DUPLICATE KEY UPDATE hash = VALUES(hash)',
            [file, hash]
          );
          results.push({ file, status: 'skipped_duplicate' });
        } else {
          logger.error(`❌ ${file} failed: ${err.message}`);
          results.push({ file, status: 'failed', error: err.message });
          throw err;
        }
      }
    }

    return results;
  } catch (error) {
    logger.error('Migration run failed:', error.message);
    throw error;
  } finally {
    connection?.release?.();
  }
}

const isDirectRun = process.argv[1]?.endsWith('migrate.js');
if (isDirectRun) {
  const dryRun = process.argv.includes('--dry-run');
  const force = process.argv.includes('--force');
  runMigrations({ dryRun, force }).then(() => process.exit(0));
}
