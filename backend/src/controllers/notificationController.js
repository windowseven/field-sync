import pool from '../config/database.js';
import logger from '../utils/logger.js';

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const offset = (page - 1) * limit;

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
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const [result] = await pool.query(
      'UPDATE notifications SET status = "read", read_at = NOW() WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result?.affectedRows === 0) {
      return res.status(404).json({ status: 'error', message: 'Notification not found' });
    }
    res.json({ status: 'success' });
  } catch (error) {
    logger.error('Mark notification read error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await pool.query('UPDATE notifications SET status = "read", read_at = NOW() WHERE user_id = ? AND status = "unread"', [userId]);
    res.json({ status: 'success' });
  } catch (error) {
    logger.error('Mark all notifications read error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND status = "unread"',
      [userId]
    );
    res.json({
      status: 'success',
      data: { unreadCount: rows[0].count }
    });
  } catch (error) {
    logger.error('Get unread count error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};
