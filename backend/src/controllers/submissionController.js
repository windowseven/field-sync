import pool from '../config/database.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from './auditLogController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

export const getSubmissionsByProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const limit = Math.min(Number(req.query.limit ?? 200), 500);

    const [rows] = await pool.query(
      `SELECT
        s.*,
        u.name as user_name,
        u.email as user_email,
        f.title as form_title
      FROM submissions s
      JOIN users u ON u.id = s.user_id
      JOIN forms f ON f.id = s.form_id
      WHERE s.project_id = ?
      ORDER BY s.submitted_at DESC
      LIMIT ?`,
      [projectId, limit]
    );

    res.json({ status: 'success', results: rows.length, data: { submissions: rows } });
});

export const createSubmission = asyncHandler(async (req, res) => {
    const id = uuidv4();
    const { form_id, project_id, zone_id, data, location } = req.body;
    const user_id = req.user.id;

    if (!form_id || !project_id || !data) {
      throw new AppError('Missing required fields', 400);
    }

    await pool.query(
      'INSERT INTO submissions (id, form_id, user_id, project_id, zone_id, data, location, status, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, "pending", NOW())',
      [id, form_id, user_id, project_id, zone_id || null, JSON.stringify(data), JSON.stringify(location || null)]
    );

    await logAudit(user_id, 'submission.create', { submission_id: id, project_id });

    const [rows] = await pool.query('SELECT * FROM submissions WHERE id = ?', [id]);
    res.status(201).json({ status: 'success', data: { submission: rows[0] } });
});

export const getSubmissionById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT s.*, u.name as user_name, f.title as form_title 
       FROM submissions s 
       JOIN users u ON u.id = s.user_id 
       JOIN forms f ON f.id = s.form_id 
       WHERE s.id = ?`,
      [id]
    );
    const submission = rows[0];

    if (!submission) {
      throw new AppError('Submission not found', 404);
    }

    res.json({ status: 'success', data: { submission } });
});

export const updateSubmissionStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      throw new AppError('Invalid status', 400);
    }

    const [result] = await pool.query('UPDATE submissions SET status = ? WHERE id = ?', [status, id]);
    
    if (result.affectedRows === 0) {
      throw new AppError('Submission not found', 404);
    }

    await logAudit(req.user.id, 'submission.status', { submission_id: id, status });

    res.json({ status: 'success', message: `Submission status updated to ${status}` });
});
