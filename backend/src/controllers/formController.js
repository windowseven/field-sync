import pool from '../config/database.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from './auditLogController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

export const getAllForms = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM forms ORDER BY created_at DESC');
  res.json({
    status: 'success',
    results: rows.length,
    data: { forms: rows }
  });
});

export const getFormById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query('SELECT * FROM forms WHERE id = ?', [id]);
  const form = rows[0];

  if (!form) {
    throw new AppError('Form not found', 404);
  }

  res.json({ status: 'success', data: { form } });
});

export const getFormsByProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const [rows] = await pool.query(
    `SELECT 
      f.*, 
      u.name as creator_name,
      (SELECT COUNT(*) FROM submissions s WHERE s.form_id = f.id) as submissions_count,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = f.project_id) as target_count
     FROM forms f 
     LEFT JOIN users u ON f.assigned_by = u.id
     WHERE f.project_id = ? 
     ORDER BY f.created_at DESC`,
    [projectId]
  );
  res.json({ status: 'success', results: rows.length, data: { forms: rows } });
});

export const createForm = asyncHandler(async (req, res) => {
  const id = uuidv4();
  const { project_id, title, description, form_schema, status } = req.body;

  if (!project_id || !title || !form_schema) {
    throw new AppError('project_id, title and form_schema are required', 400);
  }

  await pool.query(
    'INSERT INTO forms (id, project_id, title, description, form_schema, status, assigned_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, project_id, title, description ?? null, JSON.stringify(form_schema), status ?? 'draft', req.user.id]
  );

  await logAudit(req.user.id, 'form.create', { form_id: id, project_id });

  const [rows] = await pool.query('SELECT * FROM forms WHERE id = ?', [id]);
  res.status(201).json({ status: 'success', data: { form: rows[0] } });
});

export const updateForm = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [existingRows] = await pool.query('SELECT * FROM forms WHERE id = ?', [id]);
  const existing = existingRows[0];
  if (!existing) throw new AppError('Form not found', 404);

  const updates = {
    title: req.body.title ?? existing.title,
    description: req.body.description ?? existing.description,
    form_schema: req.body.form_schema !== undefined ? JSON.stringify(req.body.form_schema) : existing.form_schema,
    status: req.body.status ?? existing.status,
  };

  await pool.query(
    'UPDATE forms SET title = ?, description = ?, form_schema = ?, status = ? WHERE id = ?',
    [updates.title, updates.description, updates.form_schema, updates.status, id]
  );

  await logAudit(req.user.id, 'form.update', { form_id: id, updates });

  const [rows] = await pool.query('SELECT * FROM forms WHERE id = ?', [id]);
  res.json({ status: 'success', data: { form: rows[0] } });
});
