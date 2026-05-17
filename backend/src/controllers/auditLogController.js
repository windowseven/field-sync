import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database.js';
import logger from '../utils/logger.js';
import { broadcastToRoles } from '../sockets/wsServer.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

export const getAuditLogs = asyncHandler(async (req, res) => {
    const limit = Math.min(Number(req.query.limit ?? 200), 500);
    const [rows] = await pool.query(
      `SELECT
        a.*,
        u.email as user_email,
        u.role as user_role
      FROM audit_logs a
      LEFT JOIN users u ON u.id = a.user_id
      ORDER BY a.timestamp DESC
      LIMIT ?`,
      [limit]
    );
    res.json({ status: 'success', data: { auditLogs: rows } });
};

function inferCategory(action = '') {
  if (action.startsWith('auth.') || action.startsWith('user.login')) return 'auth';
  if (action.startsWith('user.')) return 'user';
  if (action.startsWith('team.')) return 'team';
  if (action.startsWith('zone.')) return 'zone';
  if (action.startsWith('form.')) return 'form';
  if (action.startsWith('task.')) return 'task';
  if (action.startsWith('project.')) return 'project';
  if (action.startsWith('submission.')) return 'submission';
  if (action.includes('security') || action.includes('csrf')) return 'security';
  return 'system';
}

function inferTargetType(action = '', metadata = {}) {
  if (metadata.target_type) return metadata.target_type;
  if (action.startsWith('user.')) return 'user';
  if (action.startsWith('team.')) return 'team';
  if (action.startsWith('zone.')) return 'zone';
  if (action.startsWith('form.')) return 'form';
  if (action.startsWith('task.')) return 'task';
  if (action.startsWith('project.')) return 'project';
  if (action.startsWith('submission.')) return 'submission';
  return null;
}

function inferTargetId(metadata = {}) {
  return (
    metadata.target_id ??
    metadata.user_id ??
    metadata.target_user_id ??
    metadata.project_id ??
    metadata.team_id ??
    metadata.zone_id ??
    metadata.form_id ??
    metadata.task_id ??
    metadata.submission_id ??
    null
  );
}

function inferTargetName(metadata = {}) {
  return (
    metadata.target_name ??
    metadata.email ??
    metadata.name ??
    null
  );
}

export async function logAudit(userId, action, metadata = {}) {
  try {
    const safeMetadata =
      metadata && typeof metadata === 'object' && !Array.isArray(metadata)
        ? metadata
        : { value: metadata };

    let actor = null;
    if (userId) {
      const [rows] = await pool.query(
        'SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1',
        [userId]
      );
      actor = rows[0] ?? null;
    }

    const auditId = uuidv4();
    const category = inferCategory(action);
    const targetType = inferTargetType(action, safeMetadata);
    const targetId = inferTargetId(safeMetadata);
    const targetName = inferTargetName(safeMetadata);
    const detail = JSON.stringify(safeMetadata);

    await pool.query(
      `INSERT INTO audit_logs (
        id, user_id, user_name, user_role, action, target_type, target_id, target_name,
        category, detail, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        auditId,
        userId ?? null,
        actor?.name ?? actor?.email ?? safeMetadata.user_name ?? 'System',
        actor?.role ?? safeMetadata.user_role ?? 'system',
        action,
        targetType,
        targetId,
        targetName,
        category,
        detail,
        safeMetadata.ip ?? safeMetadata.ip_address ?? null,
        safeMetadata.user_agent ?? null,
      ]
    );

    const auditEntry = {
      id: auditId,
      user_id: userId ?? null,
      user_name: actor?.name ?? actor?.email ?? safeMetadata.user_name ?? 'System',
      user_email: actor?.email ?? null,
      user_role: actor?.role ?? safeMetadata.user_role ?? 'system',
      action,
      target_type: targetType,
      target_id: targetId,
      target_name: targetName,
      category,
      detail,
      ip_address: safeMetadata.ip ?? safeMetadata.ip_address ?? null,
      user_agent: safeMetadata.user_agent ?? null,
      timestamp: new Date().toISOString(),
    };

    logger.info(
      `[AUDIT] ${action} | actor=${auditEntry.user_email ?? auditEntry.user_name} | target=${targetType ?? 'system'}:${targetId ?? '-'}`
    );

    broadcastToRoles(['admin', 'supervisor'], 'audit_log', auditEntry);
  } catch {
    // ignore
  }
}
