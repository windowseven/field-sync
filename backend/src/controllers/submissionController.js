import pool from '../config/database.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from './auditLogController.js';

export const getSubmissionsByProject = async (req, res) => {
  try {
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
  } catch (error) {
    logger.error('Get submissions error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const createSubmission = async (req, res) => {
  try {
    const id = uuidv4();
    const { form_id, project_id, zone_id, data, location } = req.body;
    const user_id = req.user.id;

    if (!form_id || !project_id || !data) {
      return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }

    await pool.query(
      'INSERT INTO submissions (id, form_id, user_id, project_id, zone_id, data, location, status, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?, "pending", NOW())',
      [id, form_id, user_id, project_id, zone_id || null, JSON.stringify(data), JSON.stringify(location || null)]
    );

    await logAudit(user_id, 'submission.create', { submission_id: id, project_id });

    const [rows] = await pool.query('SELECT * FROM submissions WHERE id = ?', [id]);
    res.status(201).json({ status: 'success', data: { submission: rows[0] } });
  } catch (error) {
    logger.error('Create submission error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const getSubmissionById = async (req, res) => {
  try {
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
      return res.status(404).json({ status: 'error', message: 'Submission not found' });
    }

    res.json({ status: 'success', data: { submission } });
  } catch (error) {
    logger.error('Get submission by ID error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const updateSubmissionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ status: 'error', message: 'Invalid status' });
    }

    const [result] = await pool.query('UPDATE submissions SET status = ? WHERE id = ?', [status, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Submission not found' });
    }

    await logAudit(req.user.id, 'submission.status', { submission_id: id, status });

    res.json({ status: 'success', message: `Submission status updated to ${status}` });
  } catch (error) {
    logger.error('Update submission status error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};
