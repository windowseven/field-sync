import pool from '../config/database.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';
import { sendInviteEmail } from '../services/emailService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { validateInviteWithResponse } from '../services/inviteService.js';
import { getFrontendUrl } from '../utils/frontendUrl.js';

const generateId = () => crypto.randomUUID();

export const getInviteLinks = asyncHandler(async (req, res) => {
    const { project_id } = req.query;
    let query = `SELECT * FROM invite_links WHERE status = "active" AND expires_at > NOW()`;
    const params = [];

    if (project_id) {
      query += ` AND project_id = ?`;
      params.push(project_id);
    }

    query += ` ORDER BY created_at DESC`;

    const [rows] = await pool.query(query, params);
    res.json({ status: 'success', data: { links: rows } });
});

export const createInviteLink = asyncHandler(async (req, res) => {
    const { role, team, team_id, project_id, maxUses, max_uses, expiresInDays, expires_in_days } = req.body;
    const id = generateId();
    const code = crypto.randomBytes(8).toString('hex').toUpperCase();
    const expiresAt = new Date(Date.now() + (expiresInDays || expires_in_days || 7) * 24 * 60 * 60 * 1000);
    const createdBy = req.user?.id;
    
    await pool.query(
      `INSERT INTO invite_links (id, code, role, project_id, team, max_uses, expires_at, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
      [id, code, role, project_id || null, team || team_id, maxUses || max_uses || 10, expiresAt, createdBy]
    );
    
    const [rows] = await pool.query('SELECT * FROM invite_links WHERE id = ?', [id]);
    res.json({ status: 'success', data: { link: rows[0] } });
});

export const validateInviteCode = asyncHandler(async (req, res) => {
    const { code } = req.params;
    const data = await validateInviteWithResponse(code);
    res.json({ status: 'success', data });
  });

export const regenerateInviteLink = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM invite_links WHERE id = ?', [id]);
    if (existing.length === 0) {
      throw new AppError('Invite link not found', 404);
    }

    const newCode = crypto.randomBytes(8).toString('hex').toUpperCase();
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await pool.query(
      'UPDATE invite_links SET code = ?, expires_at = ?, status = "active", uses = 0 WHERE id = ?',
      [newCode, newExpiresAt, id]
    );

    const [rows] = await pool.query('SELECT * FROM invite_links WHERE id = ?', [id]);
    res.json({ status: 'success', data: { link: rows[0] } });
});

export const deleteInviteLink = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await pool.query('UPDATE invite_links SET status = "deleted" WHERE id = ?', [id]);
    res.json({ status: 'success' });
});

export const getEmailInvites = asyncHandler(async (req, res) => {
    const { project_id } = req.query;
    let query = `SELECT * FROM email_invites WHERE status IN ("pending", "accepted")`;
    const params = [];

    if (project_id) {
      query += ` AND project_id = ?`;
      params.push(project_id);
    }

    query += ` ORDER BY created_at DESC`;

    const [rows] = await pool.query(query, params);
    res.json({ status: 'success', data: { invites: rows } });
});

export const sendEmailInvite = asyncHandler(async (req, res) => {
    const { email, role, team, team_id, project_id } = req.body;
    const id = generateId();
    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const createdBy = req.user?.id;
    
    await pool.query(
      `INSERT INTO email_invites (id, email, role, project_id, team, token, expires_at, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [id, email, role, project_id || null, team || team_id, token, expiresAt, createdBy]
    );

    const inviteUrl = `${getFrontendUrl()}/join/${token}`;

    try {
      await sendInviteEmail(email, inviteUrl, role, team || team_id);
      await pool.query('UPDATE email_invites SET sent_at = NOW() WHERE id = ?', [id]);
    } catch (emailError) {
      logger.warn(`Email invite send failed for ${email}:`, emailError);
    }
    
    const [rows] = await pool.query('SELECT * FROM email_invites WHERE id = ?', [id]);
    res.json({ status: 'success', data: { invite: rows[0] } });
});

export const validateEmailInvite = asyncHandler(async (req, res) => {
    const { token } = req.params;

    const [rows] = await pool.query(
      `SELECT ei.*, u.name as created_by_name 
       FROM email_invites ei 
       LEFT JOIN users u ON ei.created_by = u.id 
       WHERE ei.token = ?`,
      [token]
    );

    if (rows.length === 0) {
      throw new AppError('Invalid invitation token', 404);
    }

    const invite = rows[0];

    if (invite.status === 'cancelled') {
      throw new AppError('This invitation has been cancelled', 400);
    }

    if (invite.status === 'accepted') {
      throw new AppError('This invitation has already been used', 400);
    }

    if (new Date(invite.expires_at) < new Date()) {
      await pool.query('UPDATE email_invites SET status = "expired" WHERE id = ?', [invite.id]);
      throw new AppError('This invitation has expired', 400);
    }

    res.json({
      status: 'success',
      data: {
        email: invite.email,
        role: invite.role,
        team: invite.team,
        expiresAt: invite.expires_at,
        createdBy: invite.created_by_name,
      },
    });
});

export const resendEmailInvite = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const [rows] = await pool.query('SELECT * FROM email_invites WHERE id = ?', [id]);
    if (rows.length === 0) {
      throw new AppError('Invite not found', 404);
    }

    const invite = rows[0];
    const inviteUrl = `${getFrontendUrl()}/join/${invite.token}`;

    await pool.query(
      'UPDATE email_invites SET token = ?, expires_at = ?, status = "pending", sent_at = NOW() WHERE id = ?',
      [crypto.randomBytes(16).toString('hex'), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), id]
    );

    const [updated] = await pool.query('SELECT * FROM email_invites WHERE id = ?', [id]);
    const newInviteUrl = `${getFrontendUrl()}/join/${updated[0].token}`;

    try {
      await sendInviteEmail(invite.email, newInviteUrl, invite.role, invite.team);
    } catch (emailError) {
      logger.warn(`Resend email invite failed for ${invite.email}:`, emailError);
    }

    res.json({ status: 'success', data: { invite: updated[0] } });
});

export const deleteEmailInvite = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await pool.query('UPDATE email_invites SET status = "cancelled" WHERE id = ?', [id]);
    res.json({ status: 'success' });
});
