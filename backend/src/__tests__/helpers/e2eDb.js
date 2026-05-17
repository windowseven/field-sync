import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_DB = process.env.E2E_DB_NAME || 'fieldsync_test';

function getDbConfig(database) {
  return {
    host: process.env.E2E_DB_HOST || process.env.DB_HOST || 'localhost',
    user: process.env.E2E_DB_USER || process.env.DB_USER || 'root',
    password: process.env.E2E_DB_PASSWORD || process.env.DB_PASSWORD || '',
    database,
    port: parseInt(process.env.E2E_DB_PORT || process.env.DB_PORT || '3306', 10),
    waitForConnections: true,
    connectionLimit: 5,
  };
}

export function createTestPool(database = TEST_DB) {
  return mysql.createPool(getDbConfig(database));
}

export function createAdminPool() {
  return mysql.createPool({ ...getDbConfig(null), database: undefined, connectionLimit: 2 });
}

export async function ensureTestDatabase() {
  const adminPool = createAdminPool();
  try {
    await adminPool.query(`CREATE DATABASE IF NOT EXISTS \`${TEST_DB}\``);
  } finally {
    await adminPool.end();
  }
}

export async function dropTestDatabase() {
  const adminPool = createAdminPool();
  try {
    await adminPool.query(`DROP DATABASE IF EXISTS \`${TEST_DB}\``);
  } finally {
    await adminPool.end();
  }
}

export async function runMigrations(pool) {
  const migrationsDir = path.resolve(__dirname, '../../db/migrations');
  if (!fs.existsSync(migrationsDir)) return [];

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name VARCHAR(255) PRIMARY KEY,
      hash VARCHAR(64) NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [appliedRows] = await pool.query('SELECT name, hash FROM _migrations ORDER BY name');
  const applied = new Map(appliedRows.map(r => [r.name, r.hash]));

  const results = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    const hash = crypto.createHash('sha256').update(content, 'utf8').digest('hex');
    if (applied.has(file)) continue;

    const statements = content.split(';').map(s => s.trim()).filter(s => s && !s.startsWith('--'));
    for (const stmt of statements) {
      await pool.query(stmt);
    }
    await pool.query('INSERT INTO _migrations (name, hash) VALUES (?, ?)', [file, hash]);
    results.push(file);
  }
  return results;
}

export async function teardownTestDb() {
  const pool = createTestPool();
  try {
    const tables = ['audit_logs', 'broadcast_deliveries', 'user_location_history', 'user_locations',
      'sub_zone_assignments', 'submissions', 'notifications', 'tasks', 'field_issues', 'help_requests',
      'email_invites', 'invite_links', 'team_members', 'teams', 'form_fields', 'forms',
      'zones', 'projects', 'users', '_migrations'];
    for (const table of tables) {
      await pool.query(`DROP TABLE IF EXISTS \`${table}\``);
    }
  } finally {
    await pool.end();
  }
}
