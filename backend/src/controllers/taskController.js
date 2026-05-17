import pool from '../config/database.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { emitToUser } from '../sockets/wsServer.js';
import { logAudit } from './auditLogController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { getNotificationLink } from '../utils/roleHelpers.js';
import { paginate } from '../services/paginationService.js';

export const getAllTasks = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paginate(req.query.page, req.query.limit, 200);
  const statusFilter = req.query.status || null;

  let whereSql = 't.assigned_to = ?';
  let queryParams = [req.user.id];

  if (statusFilter) {
    whereSql += ' AND t.status = ?';
    queryParams.push(statusFilter);
  }

  const [countRows] = await pool.query(
    `SELECT COUNT(*) as total FROM tasks t WHERE ${whereSql}`,
    queryParams
  );
  const total = countRows[0].total;

  const [rows] = await pool.query(
    `SELECT t.*, p.location, p.name as project_name, z.name AS zone_name
     FROM tasks t
     JOIN projects p ON t.project_id = p.id
     LEFT JOIN zones z ON t.zone_id = z.id
     WHERE ${whereSql}
     ORDER BY t.created_at DESC
     LIMIT ? OFFSET ?`,
    [...queryParams, limit, offset]
  );

  res.json({
    status: 'success',
    data: {
      tasks: rows,
      pagination: {
        page,
        limit,
        total: parseInt(total, 10),
        totalPages: Math.ceil(total / limit),
      },
    },
  });
});

export const getTaskById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
  const task = rows[0];

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  res.json({ status: 'success', data: { task } });
});

export const getTasksByProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { page, limit, offset } = paginate(req.query.page, req.query.limit, 200);
  const statusFilter = req.query.status || null;

  let whereSql = 'project_id = ?';
  let queryParams = [projectId];

  if (statusFilter) {
    whereSql += ' AND status = ?';
    queryParams.push(statusFilter);
  }

  const [countRows] = await pool.query(
    `SELECT COUNT(*) as total FROM tasks WHERE ${whereSql}`,
    queryParams
  );
  const total = countRows[0].total;

  const [rows] = await pool.query(
    `SELECT * FROM tasks WHERE ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...queryParams, limit, offset]
  );
  res.json({
    status: 'success',
    data: {
      tasks: rows,
      pagination: {
        page,
        limit,
        total: parseInt(total, 10),
        totalPages: Math.ceil(total / limit),
      },
    },
  });
});

export const createTask = asyncHandler(async (req, res) => {
  const id = uuidv4();
  const {
    project_id,
    zone_id,
    assigned_to,
    form_id,
    title,
    description,
    location,
    deadline,
    mode,
    status,
    priority,
  } = req.body;

  if (!project_id || !title) {
    throw new AppError('project_id and title are required', 400);
  }

  await pool.query(
    `INSERT INTO tasks
      (id, project_id, zone_id, assigned_to, form_id, title, description, location, deadline, mode, status, priority, assigned_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      id,
      project_id,
      zone_id ?? null,
      assigned_to ?? null,
      form_id ?? null,
      title,
      description ?? null,
      location ?? null,
      deadline ?? null,
      mode ?? 'individual',
      status ?? 'pending',
      priority ?? 'medium',
      req.user.id,
    ]
  );

  await logAudit(req.user.id, 'task.create', { task_id: id, project_id });

  if (assigned_to) {
    const notifId = uuidv4();
    const link = getNotificationLink(assigned_to, 'task');
    await pool.query(
      'INSERT INTO notifications (id, user_id, type, title, message, status, link) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [notifId, assigned_to, 'task', 'New task assigned', title, 'unread', link]
    );
    emitToUser(assigned_to, 'notification:new', {
      id: notifId,
      user_id: assigned_to,
      type: 'task',
      title: 'New task assigned',
      body: title,
      is_read: 0,
      action_url: link,
      created_at: new Date().toISOString(),
    });

    if (form_id) {
      const [formRows] = await pool.query('SELECT title FROM forms WHERE id = ?', [form_id]);
      const formTitle = formRows[0]?.title || 'a form';

      const formNotifId = uuidv4();
      const formLink = getNotificationLink(assigned_to);
      await pool.query(
        'INSERT INTO notifications (id, user_id, type, title, message, status, link) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [formNotifId, assigned_to, 'form_assignment', 'New form assigned', `Complete the form "${formTitle}" for task: ${title}`, 'unread', formLink]
      );
      emitToUser(assigned_to, 'notification:new', {
        id: formNotifId,
        user_id: assigned_to,
        type: 'form_assignment',
        title: 'New form assigned',
        body: `Complete the form "${formTitle}" for task: ${title}`,
        is_read: 0,
        action_url: formLink,
        created_at: new Date().toISOString(),
      });
    }
  }

  const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
  res.status(201).json({ status: 'success', data: { task: rows[0] } });
});

export const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [existingRows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
  const existing = existingRows[0];
  if (!existing) throw new AppError('Task not found', 404);

  const updates = {
    zone_id: req.body.zone_id ?? existing.zone_id,
    assigned_to: req.body.assigned_to ?? existing.assigned_to,
    form_id: req.body.form_id ?? existing.form_id,
    title: req.body.title ?? existing.title,
    description: req.body.description ?? existing.description,
    location: req.body.location ?? existing.location,
    deadline: req.body.deadline ?? existing.deadline,
    mode: req.body.mode ?? existing.mode,
    status: req.body.status ?? existing.status,
    priority: req.body.priority ?? existing.priority,
  };

  await pool.query(
    `UPDATE tasks SET
      zone_id = ?,
      assigned_to = ?,
      form_id = ?,
      title = ?,
      description = ?,
      location = ?,
      deadline = ?,
      mode = ?,
      status = ?,
      priority = ?,
      completed_at = ?
    WHERE id = ?`,
    [
      updates.zone_id,
      updates.assigned_to,
      updates.form_id,
      updates.title,
      updates.description,
      updates.location,
      updates.deadline,
      updates.mode,
      updates.status,
      updates.priority,
      updates.status === 'completed' ? new Date() : null,
      id,
    ]
  );

  await logAudit(req.user.id, 'task.update', { task_id: id, updates });

  if (existing.assigned_to && existing.assigned_to !== updates.assigned_to) {
    emitToUser(existing.assigned_to, 'task:unassigned', { taskId: id });
  }

  if (updates.assigned_to && existing.assigned_to !== updates.assigned_to) {
    const notifId = uuidv4();
    const link = getNotificationLink(updates.assigned_to, 'task');
    await pool.query(
      'INSERT INTO notifications (id, user_id, type, title, message, status, link) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [notifId, updates.assigned_to, 'task', 'Task assigned', updates.title, 'unread', link]
    );
    emitToUser(updates.assigned_to, 'notification:new', {
      id: notifId,
      user_id: updates.assigned_to,
      type: 'task',
      title: 'Task assigned',
      body: updates.title,
      is_read: 0,
      action_url: link,
      created_at: new Date().toISOString(),
    });
  }

  if (updates.form_id && existing.form_id !== updates.form_id && updates.assigned_to) {
    const [formRows] = await pool.query('SELECT title FROM forms WHERE id = ?', [updates.form_id]);
    const formTitle = formRows[0]?.title || 'a form';
    const formNotifId = uuidv4();
    const formLink = getNotificationLink(updates.assigned_to);
    await pool.query(
      'INSERT INTO notifications (id, user_id, type, title, message, status, link) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [formNotifId, updates.assigned_to, 'form_assignment', 'New form assigned', `Complete the form "${formTitle}" for task: ${updates.title}`, 'unread', formLink]
    );
    emitToUser(updates.assigned_to, 'notification:new', {
      id: formNotifId,
      user_id: updates.assigned_to,
      type: 'form_assignment',
      title: 'New form assigned',
      body: `Complete the form "${formTitle}" for task: ${updates.title}`,
      is_read: 0,
      action_url: formLink,
      created_at: new Date().toISOString(),
    });
  }

  const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
  res.json({ status: 'success', data: { task: rows[0] } });
});

// ─── Update Task Status (for field agents) ─────────────────
export const updateMyTaskStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['pending', 'in-progress', 'completed'];
  if (!validStatuses.includes(status)) {
    throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
  }

  const [existingRows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
  const existing = existingRows[0];
  if (!existing) {
    throw new AppError('Task not found', 404);
  }

  if (existing.assigned_to !== req.user.id) {
    throw new AppError('You can only update your own tasks', 403);
  }

  const completedAt = status === 'completed' ? new Date() : null;

  await pool.query(
    'UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?',
    [status, completedAt, id]
  );

  await logAudit(req.user.id, 'task.status_update', { task_id: id, status });

  if (status === 'completed') {
    const [taskCreatorRows] = await pool.query(
      'SELECT assigned_by FROM tasks WHERE id = ?',
      [id]
    );
    const assignedBy = taskCreatorRows[0]?.assigned_by;

    if (assignedBy) {
      const notifId = uuidv4();
      const link = getNotificationLink(assignedBy);
      await pool.query(
        'INSERT INTO notifications (id, user_id, type, title, message, status, link) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [notifId, assignedBy, 'task_completion', 'Task completed', `${existing.title} has been completed`, 'unread', link]
      );
      emitToUser(assignedBy, 'notification:new', {
        id: notifId,
        user_id: assignedBy,
        type: 'task_completion',
        title: 'Task completed',
        body: `${existing.title} has been completed`,
        is_read: 0,
        action_url: link,
        created_at: new Date().toISOString(),
      });
    }
  }

  const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
  res.json({ status: 'success', data: { task: rows[0] } });
});
