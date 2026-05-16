import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import pool from '../config/database.js';
import logger from '../utils/logger.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { EmailDeliveryError, sendOtpEmail } from '../services/emailService.js';
import { logAudit } from './auditLogController.js';
import { getSecurityPolicies } from '../utils/securityPolicyStore.js';
import { getPlatformControls } from '../utils/platformConfigStore.js';
import { addToBlacklist } from '../utils/tokenBlacklist.js';

// ─── Validation Schemas ─────────────────────────────────────
function getPasswordSchema() {
  const passwordPolicy = getSecurityPolicies().password;
  let schema = z.string()
    .min(passwordPolicy.minLength, `Password must be at least ${passwordPolicy.minLength} characters`)
    .max(128, 'Password is too long')
    .regex(/[a-z]/, 'Must contain lowercase');

  if (passwordPolicy.requireUppercase) {
    schema = schema.regex(/[A-Z]/, 'Must contain uppercase');
  }

  if (passwordPolicy.requireNumbers) {
    schema = schema.regex(/[0-9]/, 'Must contain number');
  }

  if (passwordPolicy.requireSymbols) {
    schema = schema.regex(/[^A-Za-z0-9]/, 'Must contain symbol');
  }

  return schema;
}

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  first_name: z.string().min(1).max(50),
  email: z.string().email(),
  password: getPasswordSchema(),
  role: z.enum(['field_agent', 'supervisor']).optional(),
  inviteCode: z.string().optional(),
  inviteToken: z.string().optional(),
});

const otpSchema = z.object({
  email: z.string().email(),
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  context: z.enum(['registration', 'password_reset']).optional(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: getPasswordSchema(),
});

// ─── Helpers ────────────────────────────────────────────────
function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

function signAccessToken(user) {
  const { session } = getSecurityPolicies();
  return jwt.sign(
    { userId: user.id, role: user.role, email: user.email, jti: crypto.randomUUID(), type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: `${Math.max(1, Math.round(session.accessTokenExpiryHours))}h` }
  );
}

function signRefreshToken(user) {
  const { session } = getSecurityPolicies();
  return jwt.sign(
    { userId: user.id, jti: crypto.randomUUID(), type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: `${Math.max(1, Math.round(session.refreshTokenExpiryDays))}d` }
  );
}

async function generateAndSendOtp(email, userName) {
  const otp = generateOtp();
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await pool.query(
    'UPDATE users SET verification_code = ?, verification_expires = ? WHERE email = ?',
    [otp, expires, email]
  );

  await sendOtpEmail(email, otp, userName);
  return otp;
}

function isPendingEmailVerification(user) {
  return Boolean(user?.verification_code);
}

async function resendPendingRegistrationOtp(user) {
  await generateAndSendOtp(user.email, user.first_name || user.name);
  return {
    status: 'success',
    message: 'Account already exists but is not verified. We sent a fresh verification code to your email.',
    data: {
      id: user.id,
      email: user.email,
      role: user.role,
      pendingVerification: true,
    },
  };
}

// ─── Login ──────────────────────────────────────────────────
export const login = asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  const user = rows[0];

  if (!user) {
    await logAudit(null, 'login.failed', {
      email, ip: req.ip, user_agent: req.get('User-Agent'), reason: 'user_not_found',
    });
    throw new AppError('Invalid email or password', 401);
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    await logAudit(null, 'login.failed', {
      email, user_id: user.id, ip: req.ip, user_agent: req.get('User-Agent'), reason: 'wrong_password',
    });
    throw new AppError('Invalid email or password', 401);
  }

  if (isPendingEmailVerification(user)) {
    return res.status(403).json({
      status: 'error', code: 'EMAIL_NOT_VERIFIED',
      message: 'Please verify your email before signing in.',
    });
  }

  const token = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await logAudit(user.id, 'user.login', { ip: req.ip, user_agent: req.get('User-Agent') });
  logger.info(`User logged in: ${user.email}, role: ${user.role}`);

  res.json({
    status: 'success',
    data: {
      token, refreshToken, expiresIn: 24 * 60 * 60,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
    },
  });
});

// ─── Get Profile ────────────────────────────────────────────
export const getProfile = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, name, email, role, avatar, first_name, phone, status FROM users WHERE id = ?',
    [req.user.id]
  );
  const user = rows[0];

  if (!user) throw new AppError('User not found', 404);

  res.json({ status: 'success', data: { user } });
});

// ─── Refresh Token ──────────────────────────────────────────
export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) throw new AppError('Refresh token is required', 400);

  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

  if (decoded.type !== 'refresh') throw new AppError('Invalid token type', 401);

  if (decoded.jti) {
    const { session } = getSecurityPolicies();
    const ttlMs = session.refreshTokenExpiryDays * 24 * 60 * 60 * 1000;
    addToBlacklist(decoded.jti, ttlMs);
  }

  const [rows] = await pool.query('SELECT id, name, email, role FROM users WHERE id = ?', [decoded.userId]);
  const user = rows[0];

  if (!user) throw new AppError('User no longer exists', 401);

  const token = signAccessToken(user);
  const newRefreshToken = signRefreshToken(user);

  await logAudit(user.id, 'user.token_refresh', { ip: req.ip, user_agent: req.get('User-Agent') });

  res.json({
    status: 'success',
    data: { token, refreshToken: newRefreshToken, expiresIn: 24 * 60 * 60 },
  });
});

// ─── Register ───────────────────────────────────────────────
export const register = asyncHandler(async (req, res) => {
  const controls = await getPlatformControls();
  if (controls.registrationBlocked) {
    throw new AppError('New user registrations are currently blocked by an administrator.', 403);
  }

  const validated = registerSchema.parse(req.body);
  const { inviteCode, inviteToken } = validated;

  let inviteData = null;
  let inviteType = null;

  if (inviteCode || inviteToken) {
    const connection = await pool.getConnection();
    let committed = false;
    let released = false;
    try {
      await connection.beginTransaction();

      if (inviteCode) {
        const [rows] = await connection.query(
          'SELECT * FROM invite_links WHERE code = ? FOR UPDATE', [inviteCode]
        );
        if (rows.length === 0) {
          await connection.rollback(); connection.release();
          throw new AppError('Invalid invitation code', 400);
        }
        const invite = rows[0];
        if (invite.status !== 'active') {
          await connection.rollback(); connection.release();
          throw new AppError(`Invitation is ${invite.status}`, 400);
        }
        if (new Date(invite.expires_at) < new Date()) {
          await connection.query('UPDATE invite_links SET status = "expired" WHERE id = ?', [invite.id]);
          await connection.rollback(); connection.release();
          throw new AppError('Invitation has expired', 400);
        }
        if (invite.uses + 1 > invite.max_uses) {
          await connection.query('UPDATE invite_links SET status = "maxed" WHERE id = ?', [invite.id]);
          await connection.rollback(); connection.release();
          throw new AppError('Invitation has reached its usage limit', 400);
        }
        inviteData = invite;
        inviteType = 'link';
      } else if (inviteToken) {
        const [rows] = await connection.query('SELECT * FROM email_invites WHERE token = ?', [inviteToken]);
        if (rows.length === 0) {
          await connection.rollback(); connection.release();
          throw new AppError('Invalid invitation token', 400);
        }
        const invite = rows[0];
        if (invite.status !== 'pending') {
          await connection.rollback(); connection.release();
          throw new AppError(`Invitation is ${invite.status}`, 400);
        }
        if (new Date(invite.expires_at) < new Date()) {
          await connection.query('UPDATE email_invites SET status = "expired" WHERE id = ?', [invite.id]);
          await connection.rollback(); connection.release();
          throw new AppError('Invitation has expired', 400);
        }
        if (invite.email.toLowerCase() !== validated.email.toLowerCase()) {
          await connection.rollback(); connection.release();
          throw new AppError('Email does not match the invitation', 400);
        }
        inviteData = invite;
        inviteType = 'email';
      }

      const [existing] = await connection.query(
        'SELECT id, name, first_name, email, role, verification_code FROM users WHERE email = ?',
        [validated.email]
      );
      if (existing.length > 0) {
        if (isPendingEmailVerification(existing[0])) {
          await connection.rollback(); connection.release();
          const payload = await resendPendingRegistrationOtp(existing[0]);
          return res.status(200).json(payload);
        }
        await connection.rollback(); connection.release();
        throw new AppError('Email already registered. Please sign in instead.', 409, 'EMAIL_ALREADY_REGISTERED');
      }

      const id = crypto.randomUUID();
      const passwordHash = await bcrypt.hash(validated.password, 12);
      const role = inviteData ? inviteData.role : 'field_agent';
      const team = inviteData ? inviteData.team : null;

      await connection.query(
        'INSERT INTO users (id, name, first_name, email, password_hash, role, status, team) VALUES (?, ?, ?, ?, ?, ?, "offline", ?)',
        [id, validated.name, validated.first_name, validated.email, passwordHash, role, team]
      );

      if (inviteType === 'link') {
        const newUses = inviteData.uses + 1;
        await connection.query('UPDATE invite_links SET uses = ? WHERE id = ?', [newUses, inviteData.id]);
        if (newUses >= inviteData.max_uses) {
          await connection.query('UPDATE invite_links SET status = "maxed" WHERE id = ?', [inviteData.id]);
        }
      } else if (inviteType === 'email') {
        await connection.query('UPDATE email_invites SET status = "accepted" WHERE id = ?', [inviteData.id]);
      }

      await connection.commit();
      committed = true;
      connection.release();
      released = true;

      let emailFailed = false;
      try {
        await generateAndSendOtp(validated.email, validated.first_name || validated.name);
      } catch (emailErr) {
        if (emailErr instanceof EmailDeliveryError) {
          emailFailed = true;
          logger.warn(`OTP email failed for new user ${validated.email} (account created): ${emailErr.message}`);
        } else {
          throw emailErr;
        }
      }

      await logAudit(null, 'user.register', { user_id: id, email: validated.email, role, invite: inviteType });

      logger.info(`New user registered: ${validated.email}${inviteType ? ` (via ${inviteType} invite)` : ''}`);
      res.status(201).json({
        status: 'success',
        message: emailFailed
          ? 'Account created, but we could not send the verification email. Please use Resend Code on the next page.'
          : 'Account created. Check your email for the verification code.',
        emailDeliveryFailed: emailFailed,
        data: { id, email: validated.email, role, team },
      });
    } catch (err) {
      if (!committed) await connection.rollback();
      if (!released) connection.release();
      throw err;
    }
  } else {
    const [existing] = await pool.query(
      'SELECT id, name, first_name, email, role, verification_code FROM users WHERE email = ?',
      [validated.email]
    );
    if (existing.length > 0) {
      if (isPendingEmailVerification(existing[0])) {
        const payload = await resendPendingRegistrationOtp(existing[0]);
        return res.status(200).json(payload);
      }
      throw new AppError('Email already registered. Please sign in instead.', 409, 'EMAIL_ALREADY_REGISTERED');
    }

    const id = crypto.randomUUID();
    const passwordHash = await bcrypt.hash(validated.password, 12);
    const role = validated.role ?? 'field_agent';

    await pool.query(
      'INSERT INTO users (id, name, first_name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?, "offline")',
      [id, validated.name, validated.first_name, validated.email, passwordHash, role]
    );

    let emailFailed = false;
    try {
      await generateAndSendOtp(validated.email, validated.first_name || validated.name);
    } catch (emailErr) {
      if (emailErr instanceof EmailDeliveryError) {
        emailFailed = true;
        logger.warn(`OTP email failed for new user ${validated.email} (account created): ${emailErr.message}`);
      } else {
        throw emailErr;
      }
    }

    await logAudit(null, 'user.register', { user_id: id, email: validated.email, role });

    logger.info(`New user registered: ${validated.email}`);
    res.status(201).json({
      status: 'success',
      message: emailFailed
        ? 'Account created, but we could not send the verification email. Please use Resend Code on the next page.'
        : 'Account created. Check your email for the verification code.',
      emailDeliveryFailed: emailFailed,
      data: { id, email: validated.email, role },
    });
  }
});

// ─── Forgot Password ────────────────────────────────────────
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = otpSchema.parse(req.body);

  const [rows] = await pool.query('SELECT name FROM users WHERE email = ?', [email]);
  if (rows.length > 0) {
    await generateAndSendOtp(email, rows[0].name);
  }

  res.json({ status: 'success', message: 'If the email exists, an OTP has been sent.' });
});

// ─── Verify OTP ─────────────────────────────────────────────
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

// ─── Reset Password ─────────────────────────────────────────
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

// ─── Logout ──────────────────────────────────────────────────
export const logout = asyncHandler(async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.decode(token);
      if (decoded?.jti) {
        const { session } = getSecurityPolicies();
        const ttlMs = session.accessTokenExpiryHours * 60 * 60 * 1000;
        addToBlacklist(decoded.jti, ttlMs);
      }
    } catch {
      // Token decode failed, ignore
    }
  }

  await logAudit(req.user?.id || null, 'user.logout', {
    ip: req.ip, user_agent: req.get('User-Agent'),
  });

  res.json({ status: 'success', message: 'Logged out successfully' });
});

// ─── Resend OTP ─────────────────────────────────────────────
export const resendOtp = asyncHandler(async (req, res) => {
  const { email } = otpSchema.parse(req.body);

  const [rows] = await pool.query('SELECT name FROM users WHERE email = ?', [email]);
  if (rows.length === 0) {
    return res.json({ status: 'success', message: 'If the email exists, an OTP has been sent.' });
  }

  await generateAndSendOtp(email, rows[0].name);
  res.json({ status: 'success', message: 'OTP resent. Check your email (and spam folder).' });
});
