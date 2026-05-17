import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import pool from '../config/database.js';
import { sendOtpEmail } from '../services/emailService.js';
import { getSecurityPolicies } from './securityPolicyStore.js';

export function getPasswordSchema() {
  const passwordPolicy = getSecurityPolicies().password;
  let schema = z.string()
    .min(passwordPolicy.minLength, `Password must be at least ${passwordPolicy.minLength} characters`)
    .max(128, 'Password is too long')
    .regex(/[a-z]/, 'Must contain lowercase');

  if (passwordPolicy.requireUppercase) schema = schema.regex(/[A-Z]/, 'Must contain uppercase');
  if (passwordPolicy.requireNumbers) schema = schema.regex(/[0-9]/, 'Must contain number');
  if (passwordPolicy.requireSymbols) schema = schema.regex(/[^A-Za-z0-9]/, 'Must contain symbol');

  return schema;
}

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const otpSchema = z.object({
  email: z.string().email(),
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  context: z.enum(['registration', 'password_reset']).optional(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: getPasswordSchema(),
});

export function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

export function signAccessToken(user) {
  const { session } = getSecurityPolicies();
  return jwt.sign(
    { userId: user.id, role: user.role, email: user.email, jti: crypto.randomUUID(), type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: `${Math.max(1, Math.round(session.accessTokenExpiryHours))}h` }
  );
}

export function signRefreshToken(user) {
  const { session } = getSecurityPolicies();
  return jwt.sign(
    { userId: user.id, jti: crypto.randomUUID(), type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: `${Math.max(1, Math.round(session.refreshTokenExpiryDays))}d` }
  );
}

export async function generateAndSendOtp(email, userName) {
  const otp = generateOtp();
  const expires = new Date(Date.now() + 10 * 60 * 1000);

  await pool.query(
    'UPDATE users SET verification_code = ?, verification_expires = ? WHERE email = ?',
    [otp, expires, email]
  );

  await sendOtpEmail(email, otp, userName);
  return otp;
}

export function isPendingEmailVerification(user) {
  return Boolean(user?.verification_code);
}

export async function resendPendingRegistrationOtp(user) {
  await generateAndSendOtp(user.email, user.first_name || user.name);
  return {
    status: 'success',
    message: 'Account already exists but is not verified. We sent a fresh verification code to your email.',
    data: { id: user.id, email: user.email, role: user.role, pendingVerification: true },
  };
}
