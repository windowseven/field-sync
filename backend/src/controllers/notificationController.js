import pool from '../config/database.js';
import logger from '../utils/logger.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { paginate, buildPaginationResponse } from '../services/paginationService.js';

export const getNotifications = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { page, limit, offset } = paginate(req.query.page, req.query.limit, 200);

    const [countRows] = await pool.query(
      'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?',
      [userId]
    );
    const total = countRows[0].total;

    const [rows] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [userId, limit, offset]
    );

    res.json({
      status: 'success',
      data: {
        notifications: rows,
        pagination: {
          page,
          limit,
          total: parseInt(total, 10),
          totalPages: Math.ceil(total / limit),
        },
      },
    });
});

export const markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const [result] = await pool.query(
      'UPDATE notifications SET status = "read", read_at = NOW() WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result?.affectedRows === 0) {
      throw new AppError('Notification not found', 404);
    }
    res.json({ status: 'success' });
});

export const markAllAsRead = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    await pool.query('UPDATE notifications SET status = "read", read_at = NOW() WHERE user_id = ? AND status = "unread"', [userId]);
    res.json({ status: 'success' });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const [rows] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND status = "unread"',
      [userId]
    );
    res.json({
      status: 'success',
      data: { unreadCount: rows[0].count }
    });
});
