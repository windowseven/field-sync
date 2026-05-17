import pool from '../config/database.js';
import { AppError } from '../utils/AppError.js';

export async function validateAndLockInviteLink(code, connection) {
  const [rows] = await connection.query(
    'SELECT * FROM invite_links WHERE code = ? FOR UPDATE', [code]
  );
  if (rows.length === 0) return null;
  const invite = rows[0];
  if (invite.status !== 'active') return { valid: false, reason: `Invitation is ${invite.status}` };
  if (new Date(invite.expires_at) < new Date()) {
    await connection.query('UPDATE invite_links SET status = "expired" WHERE id = ?', [invite.id]);
    return { valid: false, reason: 'Invitation has expired' };
  }
  if (invite.uses + 1 > invite.max_uses) {
    await connection.query('UPDATE invite_links SET status = "maxed" WHERE id = ?', [invite.id]);
    return { valid: false, reason: 'Invitation has reached its usage limit' };
  }
  return { valid: true, invite, type: 'link' };
}

export async function validateAndLockEmailInvite(token, email, connection) {
  const [rows] = await connection.query(
    'SELECT * FROM email_invites WHERE token = ? FOR UPDATE', [token]
  );
  if (rows.length === 0) return null;
  const invite = rows[0];
  if (invite.status !== 'pending') return { valid: false, reason: `Invitation is ${invite.status}` };
  if (new Date(invite.expires_at) < new Date()) {
    await connection.query('UPDATE email_invites SET status = "expired" WHERE id = ?', [invite.id]);
    return { valid: false, reason: 'Invitation has expired' };
  }
  if (invite.email.toLowerCase() !== email.toLowerCase()) {
    return { valid: false, reason: 'Email does not match the invitation' };
  }
  return { valid: true, invite, type: 'email' };
}

export async function consumeInvite(inviteData, connection) {
  if (inviteData.type === 'link') {
    await connection.query(
      'UPDATE invite_links SET uses = uses + 1 WHERE id = ?', [inviteData.invite.id]
    );
  } else {
    await connection.query(
      'UPDATE email_invites SET status = "accepted" WHERE id = ?', [inviteData.invite.id]
    );
  }
}

export async function validateInviteWithResponse(code) {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const result = await validateAndLockInviteLink(code, connection);
    if (!result) {
      await connection.rollback();
      throw new AppError('Invalid invitation code', 404);
    }
    if (!result.valid) {
      await connection.commit();
      throw new AppError(result.reason, 400);
    }

    await connection.commit();
    return {
      code: result.invite.code,
      role: result.invite.role,
      team: result.invite.team,
      expiresAt: result.invite.expires_at,
      createdBy: result.invite.created_by_name,
      remainingUses: result.invite.max_uses - result.invite.uses,
    };
  } finally {
    if (connection) connection.release();
  }
}
