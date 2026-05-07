import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import pool from '../config/database.js';
import logger from '../utils/logger.js';
import { sendOtpEmail } from '../services/emailService.js';
import { logAudit } from './auditLogController.js';
import { getSecurityPolicies } from '../utils/securityPolicyStore.js';
import { getPlatformControls } from '../utils/platformConfigStore.js';

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
  // Cryptographically secure OTP
  return crypto.randomInt(100000, 999999).toString();
}

function signAccessToken(user) {
  const { session } = getSecurityPolicies();
  return jwt.sign(
    { userId: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: `${Math.max(1, Math.round(session.accessTokenExpiryHours))}h` }
  );
}

function signRefreshToken(user) {
  const { session } = getSecurityPolicies();
  return jwt.sign(
    { userId: user.id, type: 'refresh' },
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

// ─── Login ──────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password',
      });
    }

    const token = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    await logAudit(user.id, 'user.login', {
      ip: req.ip,
      user_agent: req.get('User-Agent'),
    });

    logger.info(`User logged in: ${user.email}, role: ${user.role}`);

    res.json({
      status: 'success',
      data: {
        token,
        refreshToken,
        expiresIn: 24 * 60 * 60,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
      },
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ status: 'error', message: error.errors[0].message });
    }
    logger.error('Login error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// ─── Get Profile ────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, avatar, first_name, phone, status FROM users WHERE id = ?',
      [req.user.id]
    );
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    res.json({ status: 'success', data: { user } });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

// ─── Refresh Token ──────────────────────────────────────────
export const refresh = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ status: 'error', message: 'Refresh token is required' });
  }

  try {
    // Verify with the REFRESH secret (not the access secret)
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ status: 'error', message: 'Invalid token type' });
    }

    const [rows] = await pool.query('SELECT id, name, email, role FROM users WHERE id = ?', [decoded.userId]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ status: 'error', message: 'User no longer exists' });
    }

    const token = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);

    res.json({
      status: 'success',
      data: {
        token,
        refreshToken: newRefreshToken,
        expiresIn: 24 * 60 * 60,
      },
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(401).json({ status: 'error', message: 'Invalid or expired refresh token' });
  }
};

// ─── Register ───────────────────────────────────────────────
export const register = async (req, res) => {
  try {
    const controls = await getPlatformControls();
    if (controls.registrationBlocked) {
      return res.status(403).json({ status: 'error', message: 'New user registrations are currently blocked by an administrator.' });
    }

    const validated = registerSchema.parse(req.body);
    const { inviteCode, inviteToken } = validated;

    let inviteData = null;
    let inviteType = null;

    if (inviteCode || inviteToken) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        if (inviteCode) {
          const [rows] = await connection.query(
            `SELECT * FROM invite_links WHERE code = ? FOR UPDATE`,
            [inviteCode]
          );
          if (rows.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ status: 'error', message: 'Invalid invitation code' });
          }
          const invite = rows[0];
          if (invite.status !== 'active') {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ status: 'error', message: `Invitation is ${invite.status}` });
          }
          if (new Date(invite.expires_at) < new Date()) {
            await connection.query('UPDATE invite_links SET status = "expired" WHERE id = ?', [invite.id]);
            await connection.rollback();
            connection.release();
            return res.status(400).json({ status: 'error', message: 'Invitation has expired' });
          }
          if (invite.uses + 1 > invite.max_uses) {
            await connection.query('UPDATE invite_links SET status = "maxed" WHERE id = ?', [invite.id]);
            await connection.rollback();
            connection.release();
            return res.status(400).json({ status: 'error', message: 'Invitation has reached its usage limit' });
          }
          inviteData = invite;
          inviteType = 'link';
        } else if (inviteToken) {
          const [rows] = await connection.query(
            `SELECT * FROM email_invites WHERE token = ?`,
            [inviteToken]
          );
          if (rows.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ status: 'error', message: 'Invalid invitation token' });
          }
          const invite = rows[0];
          if (invite.status !== 'pending') {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ status: 'error', message: `Invitation is ${invite.status}` });
          }
          if (new Date(invite.expires_at) < new Date()) {
            await connection.query('UPDATE email_invites SET status = "expired" WHERE id = ?', [invite.id]);
            await connection.rollback();
            connection.release();
            return res.status(400).json({ status: 'error', message: 'Invitation has expired' });
          }
          if (invite.email.toLowerCase() !== validated.email.toLowerCase()) {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ status: 'error', message: 'Email does not match the invitation' });
          }
          inviteData = invite;
          inviteType = 'email';
        }

        const [existing] = await connection.query('SELECT id FROM users WHERE email = ?', [validated.email]);
        if (existing.length > 0) {
          await connection.rollback();
          connection.release();
          return res.status(409).json({ status: 'error', message: 'Email already registered' });
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
        connection.release();

        await generateAndSendOtp(validated.email, validated.first_name || validated.name);
        await logAudit(null, 'user.register', { user_id: id, email: validated.email, role, invite: inviteType });

        logger.info(`New user registered: ${validated.email}${inviteType ? ` (via ${inviteType} invite)` : ''}`);
        res.status(201).json({
          status: 'success',
          message: 'Account created. Check your email for the verification code.',
          data: { id, email: validated.email, role, team },
        });
      } catch (err) {
        await connection.rollback();
        connection.release();
        throw err;
      }
    } else {
      const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [validated.email]);
      if (existing.length > 0) {
        return res.status(409).json({ status: 'error', message: 'Email already registered' });
      }

      const id = crypto.randomUUID();
      const passwordHash = await bcrypt.hash(validated.password, 12);
      const role = validated.role ?? 'field_agent';

      await pool.query(
        'INSERT INTO users (id, name, first_name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?, "offline")',
        [id, validated.name, validated.first_name, validated.email, passwordHash, role]
      );

      await generateAndSendOtp(validated.email, validated.first_name || validated.name);
      await logAudit(null, 'user.register', { user_id: id, email: validated.email, role });

      logger.info(`New user registered: ${validated.email}`);
      res.status(201).json({
        status: 'success',
        message: 'Account created. Check your email for the verification code.',
        data: { id, email: validated.email, role },
      });
    }
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ status: 'error', message: error.errors[0].message });
    }
    logger.error('Register error:', error);
    res.status(500).json({ status: 'error', message: 'Registration failed' });
  }
};

// ─── Forgot Password ────────────────────────────────────────
export const forgotPassword = async (req, res) => {
  try {
    const { email } = otpSchema.parse(req.body);

    const [rows] = await pool.query('SELECT name FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      // Don't reveal if email exists (security)
      return res.json({ status: 'success', message: 'If the email exists, an OTP has been sent.' });
    }

    await generateAndSendOtp(email, rows[0].name);

    res.json({ status: 'success', message: 'If the email exists, an OTP has been sent.' });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ status: 'error', message: error.errors[0].message });
    }
    logger.error('Forgot password error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to process request' });
  }
};

// ─── Verify OTP ─────────────────────────────────────────────
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp, context = 'registration' } = verifyOtpSchema.parse(req.body);

    const [rows] = await pool.query(
      'SELECT verification_expires FROM users WHERE email = ? AND verification_code = ?',
      [email, otp]
    );

    if (rows.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Invalid or expired OTP' });
    }

    if (new Date(rows[0].verification_expires) < new Date()) {
      return res.status(400).json({ status: 'error', message: 'OTP expired' });
    }

    if (context === 'registration') {
      await pool.query(
        'UPDATE users SET verification_code = NULL, verification_expires = NULL WHERE email = ?',
        [email]
      );

      await logAudit(null, 'user.verify_email', { email });
      return res.json({ status: 'success', message: 'Account verified successfully' });
    }

    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      'UPDATE users SET password_reset_token = ?, password_reset_expires = ?, verification_code = NULL, verification_expires = NULL WHERE email = ?',
      [token, expires, email]
    );

    res.json({ status: 'success', message: 'OTP verified', data: { resetToken: token } });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ status: 'error', message: error.errors[0].message });
    }
    logger.error('Verify OTP error:', error);
    res.status(500).json({ status: 'error', message: 'Verification failed' });
  }
};

// ─── Reset Password ─────────────────────────────────────────
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = resetPasswordSchema.parse(req.body);

    const [rows] = await pool.query(
      'SELECT email FROM users WHERE password_reset_token = ? AND password_reset_expires > NOW()',
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Invalid or expired token' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await pool.query(
      'UPDATE users SET password_hash = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE password_reset_token = ?',
      [passwordHash, token]
    );

    await logAudit(null, 'user.password_reset', { email: rows[0].email });

    logger.info(`Password reset for ${rows[0].email}`);
    res.json({ status: 'success', message: 'Password reset successful' });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ status: 'error', message: error.errors[0].message });
    }
    logger.error('Reset password error:', error);
    res.status(500).json({ status: 'error', message: 'Reset failed' });
  }
};

// ─── Resend OTP ─────────────────────────────────────────────
export const resendOtp = async (req, res) => {
  try {
    const { email } = otpSchema.parse(req.body);

    const [rows] = await pool.query('SELECT name FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.json({ status: 'success', message: 'If the email exists, an OTP has been sent.' });
    }

    await generateAndSendOtp(email, rows[0].name);

    res.json({ status: 'success', message: 'OTP resent. Check your email (and spam folder).' });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ status: 'error', message: error.errors[0].message });
    }
    logger.error('Resend OTP error:', error);
    res.status(500).json({ status: 'error', message: 'Resend failed' });
  }
};
