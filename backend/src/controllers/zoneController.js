import pool from '../config/database.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from './auditLogController.js';
import { emitToUser } from '../sockets/wsServer.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

export const getZonesByProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM zones WHERE project_id = ? ORDER BY name ASC',
      [projectId]
    );
    res.json({ status: 'success', results: rows.length, data: { zones: rows } });
});

export const createZone = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { name, description, boundaries } = req.body;

    if (!name) {
      throw new AppError('Zone name is required', 400);
    }

    const id = uuidv4();
    await pool.query(
      'INSERT INTO zones (id, project_id, name, description, boundaries) VALUES (?, ?, ?, ?, ?)',
      [id, projectId, name, description ?? null, boundaries ? JSON.stringify(boundaries) : null]
    );

    await logAudit(req.user.id, 'zone.create', {
      zone_id: id,
      project_id: projectId,
      name,
    });

    const [rows] = await pool.query('SELECT * FROM zones WHERE id = ?', [id]);
    res.status(201).json({ status: 'success', data: { zone: rows[0] } });
});

export const updateZone = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, boundaries } = req.body;

    const [existingRows] = await pool.query('SELECT * FROM zones WHERE id = ?', [id]);
    const existing = existingRows[0];
    if (!existing) throw new AppError('Zone not found', 404);

    await pool.query(
      'UPDATE zones SET name = ?, description = ?, boundaries = ? WHERE id = ?',
      [
        name ?? existing.name,
        description ?? existing.description,
        boundaries !== undefined ? JSON.stringify(boundaries) : existing.boundaries,
        id,
      ]
    );

    await logAudit(req.user.id, 'zone.update', {
      zone_id: id,
      project_id: existing.project_id,
      name: name ?? existing.name,
    });

    const [rows] = await pool.query('SELECT * FROM zones WHERE id = ?', [id]);
    res.json({ status: 'success', data: { zone: rows[0] } });
});

export const deleteZone = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const [existingRows] = await pool.query('SELECT * FROM zones WHERE id = ?', [id]);
    const existing = existingRows[0];
    if (!existing) throw new AppError('Zone not found', 404);

    const [result] = await pool.query('DELETE FROM zones WHERE id = ?', [id]);
    if (result?.affectedRows === 0) throw new AppError('Zone not found', 404);

    await logAudit(req.user.id, 'zone.delete', {
      zone_id: id,
      project_id: existing.project_id,
      name: existing.name,
    });

    res.json({ status: 'success' });
});

export const setZoneAssignmentMode = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { mode } = req.body;

    if (!['individual', 'group'].includes(mode)) {
      throw new AppError('mode must be individual or group', 400);
    }

    const [existingRows] = await pool.query('SELECT * FROM zones WHERE id = ?', [id]);
    const existing = existingRows[0];
    if (!existing) throw new AppError('Zone not found', 404);

    await pool.query('UPDATE zones SET assignment_mode = ? WHERE id = ?', [mode, id]);

    await logAudit(req.user.id, 'zone.mode_update', {
      zone_id: id,
      project_id: existing.project_id,
      mode,
    });

    res.json({ status: 'success', data: { zone_id: id, mode } });
});

export const assignSubZone = asyncHandler(async (req, res) => {
    const { zone_id, user_id, boundaries } = req.body;

    if (!zone_id || !user_id) {
      throw new AppError('zone_id and user_id are required', 400);
    }

    const [zoneRows] = await pool.query('SELECT * FROM zones WHERE id = ?', [zone_id]);
    const zone = zoneRows[0];
    if (!zone) throw new AppError('Zone not found', 404);

    const [userRows] = await pool.query('SELECT id, name FROM users WHERE id = ?', [user_id]);
    const user = userRows[0];
    if (!user) throw new AppError('User not found', 404);

    const id = uuidv4();
    await pool.query(
      'INSERT INTO sub_zone_assignments (id, zone_id, user_id, boundaries) VALUES (?, ?, ?, ?)',
      [id, zone_id, user_id, boundaries ? JSON.stringify(boundaries) : null]
    );

    await logAudit(req.user.id, 'zone.sub_zone_assign', {
      zone_id,
      user_id,
      user_name: user.name,
    });

    emitToUser(user_id, 'zone:assigned', {
      zone_id,
      zone_name: zone.name,
      assigned_by: req.user.name || req.user.email,
      assigned_at: new Date().toISOString(),
    });

    res.status(201).json({
      status: 'success',
      data: {
        id,
        zone_id,
        user_id,
        user_name: user.name,
        boundaries,
      },
    });
});

export const getSubZoneAssignments = asyncHandler(async (req, res) => {
    const { zoneId } = req.params;

    const [rows] = await pool.query(
      `SELECT sza.*, u.name as user_name, u.email as user_email
       FROM sub_zone_assignments sza
       JOIN users u ON u.id = sza.user_id
       WHERE sza.zone_id = ?
       ORDER BY sza.assigned_at ASC`,
      [zoneId]
    );

    const parsed = rows.map(r => ({
      ...r,
      boundaries: typeof r.boundaries === 'string' ? JSON.parse(r.boundaries) : r.boundaries,
    }));

    res.json({ status: 'success', data: { assignments: parsed } });
});

export const removeSubZoneAssignment = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const [existingRows] = await pool.query('SELECT * FROM sub_zone_assignments WHERE id = ?', [id]);
    const existing = existingRows[0];
    if (!existing) throw new AppError('Assignment not found', 404);

    await pool.query('DELETE FROM sub_zone_assignments WHERE id = ?', [id]);

    await logAudit(req.user.id, 'zone.sub_zone_remove', {
      assignment_id: id,
      zone_id: existing.zone_id,
      user_id: existing.user_id,
    });

    res.json({ status: 'success', message: 'Assignment removed' });
});
