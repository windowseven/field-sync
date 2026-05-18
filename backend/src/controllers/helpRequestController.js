import pool from '../config/database.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from './auditLogController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

export const createHelpRequest = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { type, message } = req.body;

    if (!type || !message) {
      throw new AppError('type and message are required', 400);
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
});

export const getMyHelpRequests = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const [rows] = await pool.query(
      'SELECT * FROM help_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 100',
      [userId]
    );
    res.json({ status: 'success', data: { helpRequests: rows } });
});

export const getPendingHelpRequests = asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      `SELECT hr.*, u.name as user_name, u.email as user_email
       FROM help_requests hr
       JOIN users u ON u.id = hr.user_id
       WHERE hr.status = "pending"
       ORDER BY hr.created_at DESC
       LIMIT 200`
    );
    res.json({ status: 'success', data: { helpRequests: rows } });
});

export const respondToHelpRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { response, note } = req.body;

    const validResponses = ['accepted', 'rejected', 'escalated'];
    const statusMap = {
      accepted: 'accepted',
      rejected: 'rejected',
      escalated: 'escalated',
    };

    if (!validResponses.includes(response)) {
      throw new AppError('response must be accepted, rejected, or escalated', 400);
    }

    const status = statusMap[response];

    const [result] = await pool.query(
      'UPDATE help_requests SET status = ?, response_from = ?, response_at = NOW(), response_note = ? WHERE id = ?',
      [status, req.user.id, note ?? null, id]
    );

    if (result?.affectedRows === 0) {
      throw new AppError('Help request not found', 404);
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
});
