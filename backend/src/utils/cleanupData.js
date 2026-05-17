import pool from '../config/database.js';
import logger from './logger.js';

const BATCH_SIZE = 500;

const RETENTION = {
  user_location_history: { days: 90, column: 'recorded_at' },
  audit_logs: { days: 365, column: 'timestamp' },
  broadcast_deliveries: { days: 180, column: 'delivered_at' },
};

async function deleteBatch(table, column, cutoff) {
  const [rows] = await pool.query(
    `DELETE FROM ?? WHERE ?? < ? LIMIT ?`,
    [table, column, cutoff, BATCH_SIZE]
  );
  return rows.affectedRows;
}

export async function cleanupOldData({ tables, retentionOverrides = {} } = {}) {
  const config = {};
  for (const [table, defaults] of Object.entries(RETENTION)) {
    if (!tables || tables.includes(table)) {
      const days = retentionOverrides[table]?.days ?? defaults.days;
      const column = retentionOverrides[table]?.column ?? defaults.column;
      config[table] = { days, column };
    }
  }

  const results = {};

  for (const [table, { days, column }] of Object.entries(config)) {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    let total = 0;

    try {
      let affected;
      do {
        affected = await deleteBatch(table, column, cutoff);
        total += affected;
      } while (affected === BATCH_SIZE);
      logger.info(`Cleanup: removed ${total} rows from ${table} older than ${days} days`);
    } catch (err) {
      logger.error(`Cleanup failed for ${table}: ${err.message}`);
    }

    results[table] = total;
  }

  return results;
}
