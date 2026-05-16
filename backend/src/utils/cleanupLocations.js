import pool from '../config/database.js';
import logger from './logger.js';

const BATCH_SIZE = 500;
const MAX_RETENTION_DAYS = 90;

export async function cleanupOldLocations(maxDays = MAX_RETENTION_DAYS) {
  const cutoff = new Date(Date.now() - maxDays * 24 * 60 * 60 * 1000);
  let deleted = 0;

  try {
    let rows;
    do {
      [rows] = await pool.query(
        'DELETE FROM user_location_history WHERE recorded_at < ? LIMIT ?',
        [cutoff, BATCH_SIZE]
      );
      deleted += rows.affectedRows;
    } while (rows.affectedRows === BATCH_SIZE);

    logger.info(`Cleanup: removed ${deleted} location history records older than ${maxDays} days`);
  } catch (err) {
    logger.error(`Location history cleanup failed: ${err.message}`);
  }

  return deleted;
}
