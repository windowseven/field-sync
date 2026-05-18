import pool from '../config/database.js';
import logger from '../utils/logger.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { logAudit } from './auditLogController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { paginate } from '../services/paginationService.js';

export const getAllUsers = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req.query.page, req.query.limit, 200);
  const roleFilter = req.query.role || null;
  const search = req.query.search || null;

  let whereClauses = [];
  let queryParams = [];

  if (roleFilter) {
    whereClauses.push('role = ?');
    queryParams.push(roleFilter);
  }
  if (search) {
    whereClauses.push('(name LIKE ? OR email LIKE ?)');
    queryParams.push(`%${search}%`, `%${search}%`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const [countRows] = await pool.query(
    `SELECT COUNT(*) as total FROM users ${whereSql}`,
    queryParams
  );
  const total = countRows[0].total;

  const [rows] = await pool.query(
    `SELECT id, name, first_name, email, role, status, last_seen, avatar, phone
     FROM users ${whereSql}
     ORDER BY name ASC
     LIMIT ? OFFSET ?`,
    [...queryParams, limit, offset]
  );

  res.json({
    status: 'success',
    data: {
      users: rows,
      pagination: {
        page,
        limit,
        total: parseInt(total, 10),
        totalPages: Math.ceil(total / limit),
      },
    },
  });
});

// ─── Get User By ID ─────────────────────────────────────────
export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query(
    'SELECT id, name, first_name, email, role, status, last_seen, avatar, phone FROM users WHERE id = ?',
    [id]
  );
  const user = rows[0];

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({ status: 'success', data: { user } });
});

// ─── Create User (Admin only) ───────────────────────────────
export const createUser = asyncHandler(async (req, res) => {
  const { name, first_name, email, password, role, phone } = req.body;

  if (!name || !email || !password || !role) {
    throw new AppError('name, email, password, and role are required', 400);
  }

  const validRoles = ['admin', 'supervisor', 'team_leader', 'field_agent'];
  if (!validRoles.includes(role)) {
    throw new AppError(`Invalid role. Must be one of: ${validRoles.join(', ')}`, 400);
  }

  // Check if email already exists
  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    throw new AppError('Email already registered', 409);
  }

  const id = crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 12);

  await pool.query(
    'INSERT INTO users (id, name, first_name, email, password_hash, role, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, name, first_name || null, email, passwordHash, role, phone || null, 'offline']
  );

  await logAudit(req.user.id, 'user.create', { target_user_id: id, email, role });

  const [rows] = await pool.query(
    'SELECT id, name, first_name, email, role, status, avatar, phone FROM users WHERE id = ?',
    [id]
  );

  logger.info(`User created by admin: ${email} (${role})`);
  res.status(201).json({ status: 'success', data: { user: rows[0] } });
});

// ─── Update User (Admin only) ───────────────────────────────
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [existingRows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  const existing = existingRows[0];
  if (!existing) {
    throw new AppError('User not found', 404);
  }

  const updates = {
    name: req.body.name ?? existing.name,
    first_name: req.body.first_name ?? existing.first_name,
    email: req.body.email ?? existing.email,
    role: req.body.role ?? existing.role,
    phone: req.body.phone ?? existing.phone,
    status: req.body.status ?? existing.status,
  };

  // Prevent changing admin roles or assigning admin role
  if (existing.role === 'admin' || updates.role === 'admin') {
    throw new AppError('Admin roles cannot be modified or assigned', 403);
  }

  // Validate role if changed
  const validRoles = ['supervisor', 'team_leader', 'field_agent'];
  if (updates.role !== existing.role && !validRoles.includes(updates.role)) {
    throw new AppError(`Invalid role. Must be one of: ${validRoles.join(', ')}`, 400);
  }

  // Check email uniqueness if changed
  if (updates.email !== existing.email) {
    const [emailCheck] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [updates.email, id]);
    if (emailCheck.length > 0) {
      throw new AppError('Email already in use', 409);
    }
  }

  // Handle password change
  let passwordClause = '';
  const queryParams = [updates.name, updates.first_name, updates.email, updates.role, updates.phone, updates.status];

  if (req.body.password) {
    const passwordHash = await bcrypt.hash(req.body.password, 12);
    passwordClause = ', password_hash = ?';
    queryParams.push(passwordHash);
  }

  queryParams.push(id);

  await pool.query(
    `UPDATE users SET name = ?, first_name = ?, email = ?, role = ?, phone = ?, status = ?${passwordClause} WHERE id = ?`,
    queryParams
  );

  await logAudit(req.user.id, 'user.update', { target_user_id: id, changes: Object.keys(req.body) });

  const [rows] = await pool.query(
    'SELECT id, name, first_name, email, role, status, avatar, phone FROM users WHERE id = ?',
    [id]
  );

  res.json({ status: 'success', data: { user: rows[0] } });
});

// ─── Delete User (Admin only) ───────────────────────────────
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Prevent self-deletion
  if (id === req.user.id) {
    throw new AppError('Cannot delete your own account', 400);
  }

  const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);

  if (result?.affectedRows === 0) {
    throw new AppError('User not found', 404);
  }

  await logAudit(req.user.id, 'user.delete', { target_user_id: id });

  logger.info(`User deleted by admin: ${id}`);
  res.json({ status: 'success', message: 'User deleted' });
});

// ─── Get Dashboard Stats (for field agents) ─────────────────
export const getDashboardStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [taskCount] = await pool.query('SELECT COUNT(*) as total FROM tasks WHERE assigned_to = ?', [userId]);
  const [completedTasks] = await pool.query(
    'SELECT COUNT(*) as total FROM tasks WHERE assigned_to = ? AND status = "completed"',
    [userId]
  );
  const [formCount] = await pool.query('SELECT COUNT(*) as total FROM submissions WHERE user_id = ?', [userId]);

  const [latestTasks] = await pool.query(
    'SELECT * FROM tasks WHERE assigned_to = ? AND status != "completed" ORDER BY created_at DESC LIMIT 3',
    [userId]
  );

  const [userSession] = await pool.query(
    'SELECT status, session_started_at FROM users WHERE id = ?',
    [userId]
  );

  const sessionInfo = userSession[0] ? {
    status: userSession[0].status,
    startedAt: userSession[0].session_started_at,
  } : null;

  const [zoneRows] = await pool.query(
    `SELECT DISTINCT z.id, z.name
     FROM tasks t
     JOIN zones z ON t.zone_id = z.id
     WHERE t.assigned_to = ? AND t.status IN ('pending', 'in-progress')`,
    [userId]
  );

  const [nearbyCount] = await pool.query(
    `SELECT COUNT(*) as total
     FROM team_members tm
     JOIN users u ON tm.user_id = u.id
     WHERE tm.team_id IN (SELECT team_id FROM team_members WHERE user_id = ?)
     AND u.id != ?
     AND u.status = 'online'`,
    [userId, userId]
  );

  res.json({
    status: 'success',
    data: {
      taskStats: {
        total: taskCount[0].total,
        completed: completedTasks[0].total,
      },
      formStats: {
        submitted: formCount[0].total,
      },
      latestTasks,
      session: sessionInfo,
      assignedZones: zoneRows,
      nearbyTeammates: nearbyCount[0].total,
    },
  });
});

// ─── Update Session ─────────────────────────────────────────
// ─── Get Session Status ─────────────────────────────────────
export const getSession = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT status, session_started_at FROM users WHERE id = ?',
    [req.user.id]
  );
  const sessionData = rows[0] ? {
    status: rows[0].status,
    startedAt: rows[0].session_started_at,
  } : { status: 'offline', startedAt: null };

  res.json({
    status: 'success',
    data: { session: sessionData },
  });
});

export const updateSession = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const validStatuses = ['online', 'offline', 'idle'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      status: 'error',
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
    });
  }

  const action = status === 'online' ? 'start' : status === 'idle' ? 'pause' : 'stop';

  if (action === 'start') {
    await pool.query('UPDATE users SET status = ?, session_started_at = NOW(), last_seen = NOW() WHERE id = ?', [status, req.user.id]);
    res.json({
      status: 'success',
      message: 'Session started',
      data: {
        action: 'started',
        startedAt: new Date().toISOString(),
      },
    });
  } else if (action === 'pause') {
    await pool.query('UPDATE users SET status = ?, last_seen = NOW() WHERE id = ?', [status, req.user.id]);
    res.json({
      status: 'success',
      message: 'Session paused',
      data: { action: 'paused' },
    });
  } else {
    const [rows] = await pool.query('SELECT session_started_at FROM users WHERE id = ?', [req.user.id]);
    const sessionStartedAt = rows[0]?.session_started_at;

    await pool.query('UPDATE users SET status = ?, session_started_at = NULL, last_seen = NOW() WHERE id = ?', [status, req.user.id]);

    let elapsedSeconds = 0;
    if (sessionStartedAt) {
      elapsedSeconds = Math.floor((Date.now() - new Date(sessionStartedAt).getTime()) / 1000);
    }

    res.json({
      status: 'success',
      message: 'Session ended',
      data: {
        action: 'ended',
        durationSeconds: elapsedSeconds,
      },
    });
  }
});
