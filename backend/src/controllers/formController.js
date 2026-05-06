import pool from '../config/database.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from './auditLogController.js';

export const getAllForms = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM forms ORDER BY created_at DESC');
    res.json({
      status: 'success',
      results: rows.length,
      data: { forms: rows }
    });
  } catch (error) {
    logger.error('Get all forms error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const getFormById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM forms WHERE id = ?', [id]);
    const form = rows[0];

    if (!form) {
      return res.status(404).json({ status: 'error', message: 'Form not found' });
    }

    res.json({ status: 'success', data: { form } });
  } catch (error) {
    logger.error('Get form by ID error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const getFormsByProject = async (req, res) => {
  try {
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
  } catch (error) {
    logger.error('Get forms by project error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const createForm = async (req, res) => {
  try {
    const id = uuidv4();
    const { project_id, title, description, form_schema, status } = req.body;

    if (!project_id || !title || !form_schema) {
      return res.status(400).json({ status: 'error', message: 'project_id, title and form_schema are required' });
    }

    await pool.query(
      'INSERT INTO forms (id, project_id, title, description, form_schema, status, assigned_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, project_id, title, description ?? null, JSON.stringify(form_schema), status ?? 'draft', req.user.id]
    );

    await logAudit(req.user.id, 'form.create', { form_id: id, project_id });

    const [rows] = await pool.query('SELECT * FROM forms WHERE id = ?', [id]);
    res.status(201).json({ status: 'success', data: { form: rows[0] } });
  } catch (error) {
    logger.error('Create form error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const updateForm = async (req, res) => {
  try {
    const { id } = req.params;
    const [existingRows] = await pool.query('SELECT * FROM forms WHERE id = ?', [id]);
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ status: 'error', message: 'Form not found' });

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
  } catch (error) {
    logger.error('Update form error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};
