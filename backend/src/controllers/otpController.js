import crypto from 'crypto';
import pool from '../config/database.js';
import logger from '../utils/logger.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { logAudit } from './auditLogController.js';
import { otpSchema, verifyOtpSchema, generateAndSendOtp } from '../utils/authHelpers.js';

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = otpSchema.parse(req.body);

  const [rows] = await pool.query('SELECT name FROM users WHERE email = ?', [email]);
  if (rows.length > 0) {
    await generateAndSendOtp(email, rows[0].name);
  }

  res.json({ status: 'success', message: 'If the email exists, an OTP has been sent.' });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp, context = 'registration' } = verifyOtpSchema.parse(req.body);

  const [rows] = await pool.query(
    'SELECT verification_expires FROM users WHERE email = ? AND verification_code = ?',
    [email, otp]
  );

  if (rows.length === 0) throw new AppError('Invalid or expired OTP', 400);
  if (new Date(rows[0].verification_expires) < new Date()) throw new AppError('OTP expired', 400);

  if (context === 'registration') {
    await pool.query(
      'UPDATE users SET verification_code = NULL, verification_expires = NULL WHERE email = ?', [email]
    );
    await logAudit(null, 'user.verify_email', { email });
    return res.json({ status: 'success', message: 'Account verified successfully' });
  }

  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await pool.query(
    'UPDATE users SET password_reset_token = ?, password_reset_expires = ?, verification_code = NULL, verification_expires = NULL WHERE email = ?',
    [token, expires, email]
  );

  res.json({ status: 'success', message: 'OTP verified', data: { resetToken: token } });
});

export const resendOtp = asyncHandler(async (req, res) => {
  const { email } = otpSchema.parse(req.body);

  const [rows] = await pool.query('SELECT name FROM users WHERE email = ?', [email]);
  if (rows.length === 0) {
    return res.json({ status: 'success', message: 'If the email exists, an OTP has been sent.' });
  }

  await generateAndSendOtp(email, rows[0].name);
  res.json({ status: 'success', message: 'OTP resent. Check your email (and spam folder).' });
});
