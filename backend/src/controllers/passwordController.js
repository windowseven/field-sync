import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import logger from '../utils/logger.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { logAudit } from './auditLogController.js';
import { resetPasswordSchema } from '../utils/authHelpers.js';

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = resetPasswordSchema.parse(req.body);

  const [rows] = await pool.query(
    'SELECT email FROM users WHERE password_reset_token = ? AND password_reset_expires > NOW()',
    [token]
  );

  if (rows.length === 0) throw new AppError('Invalid or expired token', 400);

  const passwordHash = await bcrypt.hash(password, 12);

  await pool.query(
    'UPDATE users SET password_hash = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE password_reset_token = ?',
    [passwordHash, token]
  );

  await logAudit(null, 'user.password_reset', { email: rows[0].email });
  logger.info(`Password reset for ${rows[0].email}`);
  res.json({ status: 'success', message: 'Password reset successful' });
});
