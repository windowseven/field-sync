import pool from '../config/database.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { broadcastToRoles } from '../sockets/wsServer.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

export const updateLocation = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { lat, lng, accuracy, project_id } = req.body;

    if (lat == null || lng == null) {
      throw new AppError('lat and lng are required', 400);
    }

    const acc = accuracy ?? 15;

    await pool.query(
      `INSERT INTO user_locations (user_id, lat, lng, accuracy, updated_at)
       VALUES (?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE lat = VALUES(lat), lng = VALUES(lng), accuracy = VALUES(accuracy), updated_at = NOW()`,
      [userId, lat, lng, acc]
    );

    await pool.query(
      'INSERT INTO user_location_history (id, user_id, lat, lng, accuracy, recorded_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [uuidv4(), userId, lat, lng, acc]
    );

    broadcastToRoles(['admin', 'supervisor', 'team_leader'], 'location:update', {
      user_id: userId,
      lat,
      lng,
      accuracy: acc,
      project_id,
      ts: Date.now(),
    });

    res.json({ status: 'success', data: { lat, lng, accuracy: acc, updated_at: new Date() } });
});

export const getLatestLocations = asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      `SELECT
        ul.user_id,
        ul.lat,
        ul.lng,
        ul.accuracy,
        ul.updated_at,
        u.name,
        u.email,
        u.role,
        u.status
      FROM user_locations ul
      JOIN users u ON u.id = ul.user_id
      GROUP BY ul.user_id
      ORDER BY MAX(ul.updated_at) DESC
      LIMIT 500`
    );

    res.json({ status: 'success', data: { locations: rows } });
});

export const getProjectLocations = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const [rows] = await pool.query(
      `SELECT DISTINCT
        ul.user_id,
        ul.lat,
        ul.lng,
        ul.accuracy,
        ul.updated_at,
        u.name,
        u.email,
        u.role,
        u.status
      FROM user_locations ul
      JOIN users u ON u.id = ul.user_id
      LEFT JOIN team_members tm ON tm.user_id = u.id
      LEFT JOIN teams t_member ON t_member.id = tm.team_id
      LEFT JOIN teams t_leader ON t_leader.leader_id = u.id AND t_leader.project_id = ?
      WHERE t_member.project_id = ? OR t_leader.id IS NOT NULL
      ORDER BY ul.updated_at DESC
      LIMIT 500`,
      [projectId, projectId]
    );

    res.json({ status: 'success', data: { locations: rows } });
});

export const getMyLocationHistory = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const hours = Math.min(parseInt(req.query.hours || '24', 10), 72);

    const [rows] = await pool.query(
      `SELECT lat, lng, accuracy, recorded_at
       FROM user_location_history
       WHERE user_id = ? AND recorded_at > DATE_SUB(NOW(), INTERVAL ? HOUR)
       ORDER BY recorded_at ASC`,
      [userId, hours]
    );

    res.json({ status: 'success', data: { history: rows, hours } });
});

export const getTeamMovementPaths = asyncHandler(async (req, res) => {
    const [teamRows] = await pool.query('SELECT id, project_id FROM teams WHERE leader_id = ?', [req.user.id]);
    const team = teamRows[0];

    if (!team) {
      throw new AppError('No team assigned', 404);
    }

    const hours = Math.min(parseInt(req.query.hours || '4', 10), 24);

    const [memberIds] = await pool.query(
      'SELECT user_id FROM team_members WHERE team_id = ?',
      [team.id]
    );

    if (memberIds.length === 0) {
      return res.json({ status: 'success', data: { paths: [] } });
    }

    const userIds = memberIds.map(m => m.user_id);
    const placeholders = userIds.map(() => '?').join(',');

    const [rows] = await pool.query(
      `SELECT ulh.user_id, u.name, ulh.lat, ulh.lng, ulh.accuracy, ulh.recorded_at
       FROM user_location_history ulh
       JOIN users u ON u.id = ulh.user_id
       WHERE ulh.user_id IN (${placeholders}) AND ulh.recorded_at > DATE_SUB(NOW(), INTERVAL ? HOUR)
       ORDER BY ulh.user_id, ulh.recorded_at ASC`,
      [...userIds, hours]
    );

    const pathsMap = new Map();
    for (const row of rows) {
      if (!pathsMap.has(row.user_id)) {
        pathsMap.set(row.user_id, { user_id: row.user_id, name: row.name, points: [] });
      }
      pathsMap.get(row.user_id).points.push({
        lat: parseFloat(row.lat),
        lng: parseFloat(row.lng),
        accuracy: row.accuracy,
        recorded_at: row.recorded_at,
      });
    }

    const paths = Array.from(pathsMap.values());

    res.json({ status: 'success', data: { paths, hours } });
});
