import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import pool from '../config/database.js';
import logger from '../utils/logger.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { EmailDeliveryError } from '../services/emailService.js';
import { logAudit } from './auditLogController.js';
import { getSecurityPolicies } from '../utils/securityPolicyStore.js';
import { getPlatformControls } from '../utils/platformConfigStore.js';
import { addToBlacklist } from '../utils/tokenBlacklist.js';
import {
  getPasswordSchema, loginSchema, signAccessToken, signRefreshToken,
  isPendingEmailVerification, resendPendingRegistrationOtp, generateAndSendOtp,
} from '../utils/authHelpers.js';
import { validateAndLockInviteLink, validateAndLockEmailInvite, consumeInvite } from '../services/inviteService.js';

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  first_name: z.string().min(1).max(50),
  email: z.string().email(),
  password: getPasswordSchema(),
  role: z.enum(['field_agent', 'supervisor']).optional(),
  inviteCode: z.string().optional(),
  inviteToken: z.string().optional(),
});

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

export const getProfile = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, name, email, role, avatar, first_name, phone, status FROM users WHERE id = ?',
    [req.user.id]
  );
  const user = rows[0];

  if (!user) throw new AppError('User not found', 404);

  res.json({ status: 'success', data: { user } });
});

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

export const register = asyncHandler(async (req, res) => {
  const controls = await getPlatformControls();
  if (controls.registrationBlocked) {
    throw new AppError('New user registrations are currently blocked by an administrator.', 403);
  }

  const validated = registerSchema.parse(req.body);
  const { inviteCode, inviteToken } = validated;

  if (inviteCode || inviteToken) {
    return await registerWithInvite(validated, inviteCode, inviteToken, req, res);
  }

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
});

async function registerWithInvite(validated, inviteCode, inviteToken, req, res) {
  const connection = await pool.getConnection();
  let committed = false;
  let released = false;
  let inviteData = null;

  try {
    await connection.beginTransaction();

    if (inviteCode) {
      const result = await validateAndLockInviteLink(inviteCode, connection);
      if (!result) {
        await connection.rollback(); connection.release();
        throw new AppError('Invalid invitation code', 400);
      }
      if (!result.valid) {
        await connection.rollback(); connection.release();
        throw new AppError(result.reason, 400);
      }
      inviteData = result;
    } else if (inviteToken) {
      const result = await validateAndLockEmailInvite(inviteToken, validated.email, connection);
      if (!result) {
        await connection.rollback(); connection.release();
        throw new AppError('Invalid invitation token', 400);
      }
      if (!result.valid) {
        await connection.rollback(); connection.release();
        throw new AppError(result.reason, 400);
      }
      inviteData = result;
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
    const role = inviteData.invite.role;
    const team = inviteData.invite.team || null;

    await connection.query(
      'INSERT INTO users (id, name, first_name, email, password_hash, role, status, team) VALUES (?, ?, ?, ?, ?, ?, "offline", ?)',
      [id, validated.name, validated.first_name, validated.email, passwordHash, role, team]
    );

    await consumeInvite(inviteData, connection);

    // Auto-assign team leader if registered via team_leader invite
    if (role === 'team_leader' && team && inviteData.invite.project_id) {
      const [teamRows] = await connection.query(
        'SELECT id FROM teams WHERE name = ? AND project_id = ? LIMIT 1',
        [team, inviteData.invite.project_id]
      );
      if (teamRows.length > 0) {
        const teamId = teamRows[0].id;
        await connection.query(
          'UPDATE teams SET leader_id = ? WHERE id = ?',
          [id, teamId]
        );
        await connection.query(
          'INSERT IGNORE INTO team_members (team_id, user_id) VALUES (?, ?)',
          [teamId, id]
        );
      }
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

    await logAudit(null, 'user.register', { user_id: id, email: validated.email, role, invite: inviteData.type });

    logger.info(`New user registered: ${validated.email} (via ${inviteData.type} invite)`);
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
}

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
