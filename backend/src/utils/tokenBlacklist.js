import pool from '../config/database.js';
import logger from './logger.js';

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

const cleanupTimer = setInterval(async () => {
  try {
    const [result] = await pool.query(
      'DELETE FROM token_blacklist WHERE expires_at <= ?',
      [Date.now()]
    );
    if (result.affectedRows > 0) {
      logger.debug(`Cleaned up ${result.affectedRows} expired blacklisted tokens`);
    }
  } catch (err) {
    logger.warn('Token blacklist cleanup failed:', err.message);
  }
}, CLEANUP_INTERVAL_MS);
cleanupTimer.unref();

export async function addToBlacklist(jti, ttlMs) {
  try {
    await pool.query(
      'INSERT IGNORE INTO token_blacklist (jti, expires_at) VALUES (?, ?)',
      [jti, Date.now() + ttlMs]
    );
  } catch (err) {
    logger.warn('Failed to blacklist token:', err.message);
  }
}

export async function isBlacklisted(jti) {
  if (!jti) return false;
  try {
    const [rows] = await pool.query(
      'SELECT 1 FROM token_blacklist WHERE jti = ? AND expires_at > ? LIMIT 1',
      [jti, Date.now()]
    );
    return rows.length > 0;
  } catch (err) {
    logger.warn('Token blacklist check failed:', err.message);
    return false;
  }
}

export async function getBlacklistSize() {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM token_blacklist');
    return rows[0].count;
  } catch {
    return 0;
  }
}
