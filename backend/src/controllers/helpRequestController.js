import pool from '../config/database.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from './auditLogController.js';

export const createHelpRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, message } = req.body;

    if (!type || !message) {
      return res.status(400).json({ status: 'error', message: 'type and message are required' });
    }

    const id = uuidv4();
    await pool.query(
      'INSERT INTO help_requests (id, user_id, type, message, status) VALUES (?, ?, ?, ?, ?)',
      [id, userId, type, message, 'pending']
    );

    await logAudit(userId, 'help_request.create', {
      target_type: 'help_request',
      target_id: id,
      type,
      message,
    });

    const [rows] = await pool.query('SELECT * FROM help_requests WHERE id = ?', [id]);
    res.status(201).json({ status: 'success', data: { helpRequest: rows[0] } });
  } catch (error) {
    logger.error('Create help request error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const getMyHelpRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      'SELECT * FROM help_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 100',
      [userId]
    );
    res.json({ status: 'success', data: { helpRequests: rows } });
  } catch (error) {
    logger.error('Get help requests error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const getPendingHelpRequests = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT hr.*, u.name as user_name, u.email as user_email
       FROM help_requests hr
       JOIN users u ON u.id = hr.user_id
       WHERE hr.status = "pending"
       ORDER BY hr.created_at DESC
       LIMIT 200`
    );
    res.json({ status: 'success', data: { helpRequests: rows } });
  } catch (error) {
    logger.error('Get pending help requests error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const respondToHelpRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { response, note } = req.body;

    const validResponses = ['accepted', 'rejected', 'escalated'];
    const statusMap = {
      accepted: 'accepted',
      rejected: 'rejected',
      escalated: 'escalated',
    };

    if (!validResponses.includes(response)) {
      return res.status(400).json({ status: 'error', message: 'response must be accepted, rejected, or escalated' });
    }

    const status = statusMap[response];

    const [result] = await pool.query(
      'UPDATE help_requests SET status = ?, response_from = ?, response_at = NOW(), response_note = ? WHERE id = ?',
      [status, req.user.id, note ?? null, id]
    );

    if (result?.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Help request not found' });
    }

    const [rows] = await pool.query(
      `SELECT hr.*, u.name as user_name, u.email as user_email
       FROM help_requests hr
       JOIN users u ON u.id = hr.user_id
       WHERE hr.id = ?`,
      [id]
    );

    await logAudit(req.user.id, 'help_request.respond', {
      target_type: 'help_request',
      target_id: id,
      status,
      response_note: note ?? null,
    });

    res.json({ status: 'success', data: { helpRequest: rows[0] } });
  } catch (error) {
    logger.error('Respond help request error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};
