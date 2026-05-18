import pool from '../config/database.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from './auditLogController.js';
import { emitToUser, broadcast } from '../sockets/wsServer.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

export const createFieldIssue = asyncHandler(async (req, res) => {
    const { type, title, description, severity, affected_zone_id } = req.body;

    if (!type || !title) {
      throw new AppError('type and title are required', 400);
    }

    const [teamRows] = await pool.query('SELECT id, project_id FROM teams WHERE leader_id = ? OR id IN (SELECT team_id FROM team_members WHERE user_id = ?)', [req.user.id, req.user.id]);
    const team = teamRows[0];

    if (!team) {
      throw new AppError('No team assigned', 404);
    }

    const id = uuidv4();
    await pool.query(
      `INSERT INTO field_issues (id, team_id, reported_by, type, title, description, severity, affected_zone_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [id, team.id, req.user.id, type, title, description ?? null, severity ?? 'medium', affected_zone_id ?? null]
    );

    const [senderRows] = await pool.query('SELECT name, email FROM users WHERE id = ?', [req.user.id]);
    const sender = senderRows[0];

    const [memberRows] = await pool.query('SELECT user_id FROM team_members WHERE team_id = ?', [team.id]);
    const [leaderRow] = await pool.query('SELECT leader_id FROM teams WHERE id = ?', [team.id]);
    const leaderId = leaderRow[0]?.leader_id;
    const allUserIds = [...new Set([...memberRows.map(m => m.user_id), leaderId].filter(Boolean))];

    for (const userId of allUserIds) {
      emitToUser(userId, 'field:issue', {
        id,
        type,
        title,
        description: description ?? '',
        severity: severity ?? 'medium',
        reported_by: sender?.name || sender?.email || 'Unknown',
        team_id: team.id,
        created_at: new Date().toISOString(),
      });
    }

    await logAudit(req.user.id, 'field.issue_create', {
      target_type: 'field_issue',
      target_id: id,
      type,
      severity: severity ?? 'medium',
    });

    const [rows] = await pool.query(
      `SELECT fi.*, u.name as reported_by_name FROM field_issues fi JOIN users u ON u.id = fi.reported_by WHERE fi.id = ?`,
      [id]
    );

    res.status(201).json({ status: 'success', data: { issue: rows[0] } });
});

export const getTeamFieldIssues = asyncHandler(async (req, res) => {
    const [teamRows] = await pool.query('SELECT id FROM teams WHERE leader_id = ? OR id IN (SELECT team_id FROM team_members WHERE user_id = ?)', [req.user.id, req.user.id]);
    const team = teamRows[0];

    if (!team) {
      throw new AppError('No team assigned', 404);
    }

    const statusFilter = req.query.status || 'all';
    const query = statusFilter === 'all'
      ? 'SELECT fi.*, u.name as reported_by_name, u.email as reported_by_email, z.name as zone_name FROM field_issues fi JOIN users u ON u.id = fi.reported_by LEFT JOIN zones z ON z.id = fi.affected_zone_id WHERE fi.team_id = ? ORDER BY fi.created_at DESC LIMIT 100'
      : 'SELECT fi.*, u.name as reported_by_name, u.email as reported_by_email, z.name as zone_name FROM field_issues fi JOIN users u ON u.id = fi.reported_by LEFT JOIN zones z ON z.id = fi.affected_zone_id WHERE fi.team_id = ? AND fi.status = ? ORDER BY fi.created_at DESC LIMIT 100';

    const [rows] = statusFilter === 'all' ? await pool.query(query, [team.id]) : await pool.query(query, [team.id, statusFilter]);

    res.json({ status: 'success', data: { issues: rows } });
});

export const respondToFieldIssue = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { action, note, redirect_zone_id } = req.body;

    if (!['redirect', 'pause', 'resume', 'resolve'].includes(action)) {
      throw new AppError('action must be redirect, pause, resume, or resolve', 400);
    }

    const [issueRows] = await pool.query('SELECT * FROM field_issues WHERE id = ?', [id]);
    const issue = issueRows[0];

    if (!issue) {
      throw new AppError('Field issue not found', 404);
    }

    const statusMap = {
      redirect: 'redirected',
      pause: 'paused',
      resume: 'resumed',
      resolve: 'resolved',
    };

    await pool.query(
      `UPDATE field_issues SET status = ?, response_note = ?, resolved_at = NOW(), resolved_by = ?, redirect_zone_id = ? WHERE id = ?`,
      [statusMap[action], note ?? null, req.user.id, redirect_zone_id ?? null, id]
    );

    const [responderRows] = await pool.query('SELECT name, email FROM users WHERE id = ?', [req.user.id]);
    const responder = responderRows[0];

    emitToUser(issue.reported_by, 'field:issue_response', {
      issue_id: id,
      action,
      note: note ?? '',
      responded_by: responder?.name || responder?.email || 'System',
      redirect_zone_id: redirect_zone_id ?? null,
      responded_at: new Date().toISOString(),
    });

    await logAudit(req.user.id, 'field.issue_respond', {
      issue_id: id,
      action,
      note: note ?? null,
    });

    const [updatedRows] = await pool.query(
      `SELECT fi.*, u.name as reported_by_name, u.name as resolved_by_name FROM field_issues fi
       JOIN users u ON u.id = fi.reported_by
       LEFT JOIN users ur ON ur.id = fi.resolved_by
       WHERE fi.id = ?`,
      [id]
    );

    res.json({ status: 'success', data: { issue: updatedRows[0] } });
});

export const getActiveIssues = asyncHandler(async (req, res) => {
    const [teamRows] = await pool.query('SELECT id FROM teams WHERE leader_id = ? OR id IN (SELECT team_id FROM team_members WHERE user_id = ?)', [req.user.id, req.user.id]);
    const team = teamRows[0];

    if (!team) {
      throw new AppError('No team assigned', 404);
    }

    const [rows] = await pool.query(
      `SELECT fi.*, u.name as reported_by_name
       FROM field_issues fi
       JOIN users u ON u.id = fi.reported_by
       WHERE fi.team_id = ? AND fi.status IN ('active', 'paused', 'redirected')
       ORDER BY fi.created_at DESC`,
      [team.id]
    );

    res.json({ status: 'success', data: { activeIssues: rows } });
});
