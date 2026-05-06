import pool from '../config/database.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';
import { sendInviteEmail } from '../services/emailService.js';

const generateId = () => crypto.randomUUID();

export const getInviteLinks = async (req, res) => {
  try {
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
  } catch (error) {
    logger.error('Get invite links error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const createInviteLink = async (req, res) => {
  try {
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
  } catch (error) {
    logger.error('Create invite link error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const validateInviteCode = async (req, res) => {
  try {
    const { code } = req.params;

    const [rows] = await pool.query(
      `SELECT il.*, u.name as created_by_name 
       FROM invite_links il 
       LEFT JOIN users u ON il.created_by = u.id 
       WHERE il.code = ?`,
      [code]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Invalid invitation code' });
    }

    const invite = rows[0];

    if (invite.status === 'deleted') {
      return res.status(400).json({ status: 'error', message: 'This invitation has been revoked' });
    }

    if (new Date(invite.expires_at) < new Date()) {
      await pool.query('UPDATE invite_links SET status = "expired" WHERE id = ?', [invite.id]);
      return res.status(400).json({ status: 'error', message: 'This invitation has expired' });
    }

    if (invite.status === 'maxed') {
      return res.status(400).json({ status: 'error', message: 'This invitation has reached its usage limit' });
    }

    if (invite.uses >= invite.max_uses) {
      await pool.query('UPDATE invite_links SET status = "maxed" WHERE id = ?', [invite.id]);
      return res.status(400).json({ status: 'error', message: 'This invitation has reached its usage limit' });
    }

    res.json({
      status: 'success',
      data: {
        code: invite.code,
        role: invite.role,
        team: invite.team,
        expiresAt: invite.expires_at,
        createdBy: invite.created_by_name,
        remainingUses: invite.max_uses - invite.uses,
      },
    });
  } catch (error) {
    logger.error('Validate invite code error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const regenerateInviteLink = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query('SELECT * FROM invite_links WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Invite link not found' });
    }

    const newCode = crypto.randomBytes(8).toString('hex').toUpperCase();
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await pool.query(
      'UPDATE invite_links SET code = ?, expires_at = ?, status = "active", uses = 0 WHERE id = ?',
      [newCode, newExpiresAt, id]
    );

    const [rows] = await pool.query('SELECT * FROM invite_links WHERE id = ?', [id]);
    res.json({ status: 'success', data: { link: rows[0] } });
  } catch (error) {
    logger.error('Regenerate invite link error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const deleteInviteLink = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE invite_links SET status = "deleted" WHERE id = ?', [id]);
    res.json({ status: 'success' });
  } catch (error) {
    logger.error('Delete invite link error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const getEmailInvites = async (req, res) => {
  try {
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
  } catch (error) {
    logger.error('Get email invites error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const sendEmailInvite = async (req, res) => {
  try {
    const { email, role, team, team_id, project_id } = req.body;
    const id = generateId();
    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const createdBy = req.user?.id;
    
    await pool.query(
      `INSERT INTO email_invites (id, email, role, project_id, team, token, expires_at, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [id, email, role, project_id || null, team || team_id, token, expiresAt, createdBy]
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const inviteUrl = `${frontendUrl}/join/${token}`;

    try {
      await sendInviteEmail(email, inviteUrl, role, team || team_id);
      await pool.query('UPDATE email_invites SET sent_at = NOW() WHERE id = ?', [id]);
    } catch (emailError) {
      logger.warn(`Email invite send failed for ${email}:`, emailError);
    }
    
    const [rows] = await pool.query('SELECT * FROM email_invites WHERE id = ?', [id]);
    res.json({ status: 'success', data: { invite: rows[0] } });
  } catch (error) {
    logger.error('Send email invite error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const validateEmailInvite = async (req, res) => {
  try {
    const { token } = req.params;

    const [rows] = await pool.query(
      `SELECT ei.*, u.name as created_by_name 
       FROM email_invites ei 
       LEFT JOIN users u ON ei.created_by = u.id 
       WHERE ei.token = ?`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Invalid invitation token' });
    }

    const invite = rows[0];

    if (invite.status === 'cancelled') {
      return res.status(400).json({ status: 'error', message: 'This invitation has been cancelled' });
    }

    if (invite.status === 'accepted') {
      return res.status(400).json({ status: 'error', message: 'This invitation has already been used' });
    }

    if (new Date(invite.expires_at) < new Date()) {
      await pool.query('UPDATE email_invites SET status = "expired" WHERE id = ?', [invite.id]);
      return res.status(400).json({ status: 'error', message: 'This invitation has expired' });
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
  } catch (error) {
    logger.error('Validate email invite error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const resendEmailInvite = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query('SELECT * FROM email_invites WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Invite not found' });
    }

    const invite = rows[0];
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const inviteUrl = `${frontendUrl}/join/${invite.token}`;

    await pool.query(
      'UPDATE email_invites SET token = ?, expires_at = ?, status = "pending", sent_at = NOW() WHERE id = ?',
      [crypto.randomBytes(16).toString('hex'), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), id]
    );

    const [updated] = await pool.query('SELECT * FROM email_invites WHERE id = ?', [id]);
    const newInviteUrl = `${frontendUrl}/join/${updated[0].token}`;

    try {
      await sendInviteEmail(invite.email, newInviteUrl, invite.role, invite.team);
    } catch (emailError) {
      logger.warn(`Resend email invite failed for ${invite.email}:`, emailError);
    }

    res.json({ status: 'success', data: { invite: updated[0] } });
  } catch (error) {
    logger.error('Resend email invite error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const deleteEmailInvite = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE email_invites SET status = "cancelled" WHERE id = ?', [id]);
    res.json({ status: 'success' });
  } catch (error) {
    logger.error('Delete email invite error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};
