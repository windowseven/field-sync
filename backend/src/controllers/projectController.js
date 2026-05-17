import pool from '../config/database.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from './auditLogController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

export const getAllProjects = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`
    SELECT 
      p.*,
      (SELECT COUNT(*) FROM teams t WHERE t.project_id = p.id) as teamCount,
      (SELECT COUNT(*) FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE t.project_id = p.id) as memberCount,
      (SELECT COUNT(*) FROM zones z WHERE z.project_id = p.id) as zoneCount
    FROM projects p 
    ORDER BY p.created_at DESC
  `);
  
  res.json({
    status: 'success',
    results: rows.length,
    data: { projects: rows }
  });
});


export const getProjectById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query(`
    SELECT 
      p.*,
      (SELECT COUNT(*) FROM teams t WHERE t.project_id = p.id) as teamCount,
      (SELECT COUNT(*) FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE t.project_id = p.id) as memberCount,
      (SELECT COUNT(*) FROM zones z WHERE z.project_id = p.id) as zoneCount
    FROM projects p 
    WHERE p.id = ?`, 
    [id]
  );
  const project = rows[0];

  if (!project) {
    throw new AppError('Project not found', 404);
  }

  res.json({ status: 'success', data: { project } });
});

export const createProject = asyncHandler(async (req, res) => {
  const { name, description, status, location, target_submissions, start_date, deadline } = req.body;
  const id = uuidv4();

  await pool.query(
    'INSERT INTO projects (id, name, description, status, location, target_submissions, start_date, deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, name, description, status || 'draft', location, target_submissions || 0, start_date, deadline]
  );

  await logAudit(req.user.id, 'project.create', {
    project_id: id,
    name,
    status: status || 'draft',
    location,
  });

  const [rows] = await pool.query('SELECT * FROM projects WHERE id = ?', [id]);
  res.status(201).json({
    status: 'success',
    data: { project: rows[0] }
  });
});

export const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [existingRows] = await pool.query('SELECT * FROM projects WHERE id = ?', [id]);
  const existing = existingRows[0];
  if (!existing) throw new AppError('Project not found', 404);

  const updates = {
    name: req.body.name ?? existing.name,
    description: req.body.description ?? existing.description,
    location: req.body.location ?? existing.location,
    start_date: req.body.start_date ?? existing.start_date,
    deadline: req.body.deadline ?? existing.deadline,
    target_submissions: req.body.target_submissions ?? existing.target_submissions,
  };

  await pool.query(
    `UPDATE projects SET
      name = ?,
      description = ?,
      location = ?,
      start_date = ?,
      deadline = ?,
      target_submissions = ?
    WHERE id = ?`,
    [
      updates.name,
      updates.description,
      updates.location,
      updates.start_date,
      updates.deadline,
      updates.target_submissions,
      id,
    ]
  );

  await logAudit(req.user.id, 'project.update', { project_id: id, updates });

  const [rows] = await pool.query('SELECT * FROM projects WHERE id = ?', [id]);
  res.json({ status: 'success', data: { project: rows[0] } });
});

export const updateProjectStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ status: 'error', message: 'status is required' });

  const [result] = await pool.query('UPDATE projects SET status = ? WHERE id = ?', [status, id]);
  if (result?.affectedRows === 0) throw new AppError('Project not found', 404);

  await logAudit(req.user.id, 'project.status', { project_id: id, status });

  const [rows] = await pool.query('SELECT * FROM projects WHERE id = ?', [id]);
  res.json({ status: 'success', data: { project: rows[0] } });
});

export const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [result] = await pool.query('DELETE FROM projects WHERE id = ?', [id]);
  if (result?.affectedRows === 0) throw new AppError('Project not found', 404);

  await logAudit(req.user.id, 'project.delete', { project_id: id });

  res.json({ status: 'success' });
});

export const getProjectUsers = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query(
    `SELECT 
      u.id, 
      u.name, 
      u.email, 
      u.phone,
      u.role, 
      u.status, 
      u.last_seen,
      t.name as team_name,
      (SELECT COUNT(*) FROM submissions s WHERE s.user_id = u.id AND s.project_id = ?) as submissions_count
     FROM users u
     JOIN team_members tm ON u.id = tm.user_id
     JOIN teams t ON tm.team_id = t.id
     WHERE t.project_id = ?
     ORDER BY u.name ASC`,
    [id, id]
  );
  
  res.json({ status: 'success', data: { users: rows } });
});
