import pool from '../config/database.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { emitToUser } from '../sockets/wsServer.js';
import { logAudit } from './auditLogController.js';

export const getTeamMessages = async (req, res) => {
  try {
    const [teamRows] = await pool.query('SELECT id FROM teams WHERE leader_id = ? OR id IN (SELECT team_id FROM team_members WHERE user_id = ?)', [req.user.id, req.user.id]);
    const team = teamRows[0];

    if (!team) {
      return res.status(404).json({ status: 'error', message: 'No team assigned' });
    }

    const [rows] = await pool.query(
      `SELECT tm.*, u.name as sender_name
       FROM team_messages tm
       JOIN users u ON u.id = tm.sender_id
       WHERE tm.team_id = ?
       ORDER BY tm.created_at ASC
       LIMIT 200`,
      [team.id]
    );

    res.json({ status: 'success', data: { messages: rows } });
  } catch (error) {
    logger.error('Get team messages error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const sendTeamMessage = async (req, res) => {
  const { message } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ status: 'error', message: 'message is required' });
  }

  try {
    const [teamRows] = await pool.query('SELECT id FROM teams WHERE leader_id = ? OR id IN (SELECT team_id FROM team_members WHERE user_id = ?)', [req.user.id, req.user.id]);
    const team = teamRows[0];

    if (!team) {
      return res.status(404).json({ status: 'error', message: 'No team assigned' });
    }

    const id = uuidv4();
    await pool.query(
      'INSERT INTO team_messages (id, team_id, sender_id, message) VALUES (?, ?, ?, ?)',
      [id, team.id, req.user.id, message.trim()]
    );

    const [memberRows] = await pool.query('SELECT user_id FROM team_members WHERE team_id = ?', [team.id]);
    const [leaderRow] = await pool.query('SELECT leader_id FROM teams WHERE id = ?', [team.id]);
    const leaderId = leaderRow[0]?.leader_id;

    const allUserIds = [...new Set([...memberRows.map(m => m.user_id), leaderId].filter(Boolean))];

    for (const userId of allUserIds) {
      emitToUser(userId, 'team:message', {
        id,
        sender_id: req.user.id,
        sender_name: req.user.name || req.user.email,
        message: message.trim(),
        team_id: team.id,
        created_at: new Date().toISOString(),
      });
    }

    await logAudit(req.user.id, 'team.message', {
      target_type: 'team',
      target_id: team.id,
    });

    const [newMsg] = await pool.query(
      `SELECT tm.*, u.name as sender_name FROM team_messages tm JOIN users u ON u.id = tm.sender_id WHERE tm.id = ?`,
      [id]
    );

    res.status(201).json({ status: 'success', data: { message: newMsg[0] } });
  } catch (error) {
    logger.error('Send team message error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};
