import pool from '../config/database.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from './auditLogController.js';
import { emitToUser } from '../sockets/wsServer.js';

export const getZonesByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const [rows] = await pool.query(
      'SELECT * FROM zones WHERE project_id = ? ORDER BY name ASC',
      [projectId]
    );
    res.json({ status: 'success', results: rows.length, data: { zones: rows } });
  } catch (error) {
    logger.error('Get zones error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const createZone = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description, boundaries } = req.body;

    if (!name) {
      return res.status(400).json({ status: 'error', message: 'Zone name is required' });
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
  } catch (error) {
    logger.error('Create zone error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const updateZone = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, boundaries } = req.body;

    const [existingRows] = await pool.query('SELECT * FROM zones WHERE id = ?', [id]);
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ status: 'error', message: 'Zone not found' });

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
  } catch (error) {
    logger.error('Update zone error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const deleteZone = async (req, res) => {
  try {
    const { id } = req.params;
    const [existingRows] = await pool.query('SELECT * FROM zones WHERE id = ?', [id]);
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ status: 'error', message: 'Zone not found' });

    const [result] = await pool.query('DELETE FROM zones WHERE id = ?', [id]);
    if (result?.affectedRows === 0) return res.status(404).json({ status: 'error', message: 'Zone not found' });

    await logAudit(req.user.id, 'zone.delete', {
      zone_id: id,
      project_id: existing.project_id,
      name: existing.name,
    });

    res.json({ status: 'success' });
  } catch (error) {
    logger.error('Delete zone error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const setZoneAssignmentMode = async (req, res) => {
  try {
    const { id } = req.params;
    const { mode } = req.body;

    if (!['individual', 'group'].includes(mode)) {
      return res.status(400).json({ status: 'error', message: 'mode must be individual or group' });
    }

    const [existingRows] = await pool.query('SELECT * FROM zones WHERE id = ?', [id]);
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ status: 'error', message: 'Zone not found' });

    await pool.query('UPDATE zones SET assignment_mode = ? WHERE id = ?', [mode, id]);

    await logAudit(req.user.id, 'zone.mode_update', {
      zone_id: id,
      project_id: existing.project_id,
      mode,
    });

    res.json({ status: 'success', data: { zone_id: id, mode } });
  } catch (error) {
    logger.error('Set zone assignment mode error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const assignSubZone = async (req, res) => {
  try {
    const { zone_id, user_id, boundaries } = req.body;

    if (!zone_id || !user_id) {
      return res.status(400).json({ status: 'error', message: 'zone_id and user_id are required' });
    }

    const [zoneRows] = await pool.query('SELECT * FROM zones WHERE id = ?', [zone_id]);
    const zone = zoneRows[0];
    if (!zone) return res.status(404).json({ status: 'error', message: 'Zone not found' });

    const [userRows] = await pool.query('SELECT id, name FROM users WHERE id = ?', [user_id]);
    const user = userRows[0];
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

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
  } catch (error) {
    logger.error('Assign sub-zone error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const getSubZoneAssignments = async (req, res) => {
  try {
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
  } catch (error) {
    logger.error('Get sub-zone assignments error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};

export const removeSubZoneAssignment = async (req, res) => {
  try {
    const { id } = req.params;

    const [existingRows] = await pool.query('SELECT * FROM sub_zone_assignments WHERE id = ?', [id]);
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ status: 'error', message: 'Assignment not found' });

    await pool.query('DELETE FROM sub_zone_assignments WHERE id = ?', [id]);

    await logAudit(req.user.id, 'zone.sub_zone_remove', {
      assignment_id: id,
      zone_id: existing.zone_id,
      user_id: existing.user_id,
    });

    res.json({ status: 'success', message: 'Assignment removed' });
  } catch (error) {
    logger.error('Remove sub-zone assignment error:', error);
    res.status(500).json({ status: 'error', message: 'Internal Server Error' });
  }
};
