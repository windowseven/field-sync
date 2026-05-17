import { ensureTestDatabase, createTestPool, runMigrations } from '../helpers/e2eDb.js';

export default async function () {
  await ensureTestDatabase();
  const pool = createTestPool();
  try {
    await runMigrations(pool);
  } finally {
    await pool.end();
  }
}
