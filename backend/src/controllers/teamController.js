import pool from '../config/database.js';
import logger from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';
import { logAudit } from './auditLogController.js';
import { emitToUser } from '../sockets/wsServer.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

export const getTeamStats = asyncHandler(async (req, res) => {
  const [teamRows] = await pool.query('SELECT id, name, project_id, session_started_at FROM teams WHERE leader_id = ?', [req.user.id]);
  const team = teamRows[0];

  if (!team) {
    throw new AppError('No team assigned', 404);
  }

  const [statsRows] = await pool.query(
    `SELECT
      COUNT(DISTINCT tm.user_id) AS totalMembers,
      COUNT(DISTINCT CASE WHEN u.status = 'online' THEN tm.user_id END) AS activeMembers,
      COUNT(DISTINCT CASE WHEN t.status = 'pending' THEN t.id END) AS pendingTasks,
      COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) AS completedTasks,
      COUNT(DISTINCT CASE WHEN DATE(s.submitted_at) = CURDATE() THEN s.id END) AS todaySubmissions
    FROM teams t_leader
    LEFT JOIN team_members tm ON tm.team_id = t_leader.id
    LEFT JOIN users u ON u.id = tm.user_id
    LEFT JOIN tasks t ON t.assigned_to = tm.user_id
    LEFT JOIN submissions s ON s.user_id = tm.user_id AND DATE(s.submitted_at) = CURDATE()
    WHERE t_leader.id = ?`,
    [team.id]
  );

  const stats = statsRows[0];
  res.json({
    status: 'success',
    data: {
      totalMembers: parseInt(stats.totalMembers, 10) || 0,
      activeMembers: parseInt(stats.activeMembers, 10) || 0,
      pendingTasks: parseInt(stats.pendingTasks, 10) || 0,
      completedTasks: parseInt(stats.completedTasks, 10) || 0,
      todaySubmissions: parseInt(stats.todaySubmissions, 10) || 0,
      teamName: team.name,
      projectId: team.project_id,
      session: {
        active: !!team.session_started_at,
        startedAt: team.session_started_at,
      },
    },
  });
});

export const checkZoneBreaches = asyncHandler(async (req, res) => {
  const [teamRows] = await pool.query('SELECT id, project_id FROM teams WHERE leader_id = ?', [req.user.id]);
  const team = teamRows[0];

  if (!team) {
    throw new AppError('No team assigned', 404);
  }

  const [memberLocations] = await pool.query(
    `SELECT u.id, u.name, u.status, ul.lat, ul.lng
     FROM team_members tm
     JOIN users u ON u.id = tm.user_id
     LEFT JOIN user_locations ul ON ul.user_id = u.id
     WHERE tm.team_id = ? AND ul.lat IS NOT NULL AND ul.lng IS NOT NULL`,
    [team.id]
  );

  const [zones] = await pool.query('SELECT id, name, boundaries FROM zones WHERE project_id = ?', [team.project_id]);

  const breaches = [];
  const inside = [];

  for (const member of memberLocations) {
    let memberInside = false;
    let matchedZone = null;

    for (const zone of zones) {
      if (!zone.boundaries) continue;
      try {
        const boundaries = typeof zone.boundaries === 'string' ? JSON.parse(zone.boundaries) : zone.boundaries;
        if (isPointInPolygon(parseFloat(member.lat), parseFloat(member.lng), boundaries)) {
          memberInside = true;
          matchedZone = zone;
          break;
        }
      } catch (e) {
        logger.error(`Failed to parse boundaries for zone ${zone.id}:`, e);
      }
    }

    if (memberInside && matchedZone) {
      inside.push({ member_id: member.id, member_name: member.name, zone_id: matchedZone.id, zone_name: matchedZone.name });
    } else {
      breaches.push({ member_id: member.id, member_name: member.name, lat: parseFloat(member.lat), lng: parseFloat(member.lng), status: member.status });
    }
  }

  res.json({
    status: 'success',
    data: {
      breaches,
      inside,
      totalMembers: memberLocations.length,
      inZoneCount: inside.length,
      outOfZoneCount: breaches.length,
    },
  });
});

function isPointInPolygon(lat, lng, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [yi, xi] = polygon[i];
    const [yj, xj] = polygon[j];
    const intersect = yi > lng !== yj > lng && lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export const sendTeamAnnouncement = asyncHandler(async (req, res) => {
  const { title, message } = req.body;

  if (!title || !message) {
    return res.status(400).json({ status: 'error', message: 'title and message are required' });
  }

  const [teamRows] = await pool.query('SELECT id, name FROM teams WHERE leader_id = ?', [req.user.id]);
  const team = teamRows[0];

  if (!team) {
    throw new AppError('No team assigned', 404);
  }

  const [memberRows] = await pool.query(
    'SELECT user_id FROM team_members WHERE team_id = ?',
    [team.id]
  );

  const announcementId = uuidv4();
  const senderName = req.user.name || req.user.email || 'Team Leader';

  const notifValues = memberRows.map(m => [
    uuidv4(), m.user_id, 'announcement', title, message, 'unread', '/teamleader/notifications',
    req.user.id, senderName, null
  ]);

  if (notifValues.length > 0) {
    const placeholders = memberRows.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
    await pool.query(
      `INSERT INTO notifications (id, user_id, type, title, message, status, link, sender_id, sender_name, project_id) VALUES ${placeholders}`,
      notifValues.flat()
    );

    for (const member of memberRows) {
      emitToUser(member.user_id, 'notification:new', {
        id: notifValues[memberRows.indexOf(member)][0],
        user_id: member.user_id,
        type: 'announcement',
        title,
        body: message,
        is_read: 0,
        action_url: '/teamleader/notifications',
        created_at: new Date().toISOString(),
      });
    }
  }

  await logAudit(req.user.id, 'team.announcement', {
    target_type: 'team',
    target_id: team.id,
    target_name: team.name,
    announcement: title,
    recipient_count: memberRows.length,
  });

  res.json({
    status: 'success',
    message: `Announcement sent to ${memberRows.length} team members`,
    data: {
      id: announcementId,
      teamId: team.id,
      teamName: team.name,
      title,
      message,
      sentAt: new Date().toISOString(),
      recipientCount: memberRows.length,
    },
  });
});

export const getTeamMembers = asyncHandler(async (req, res) => {
  const [teamRows] = await pool.query('SELECT id FROM teams WHERE leader_id = ?', [req.user.id]);
  const team = teamRows[0];
  
  if (!team) return res.json({ status: 'success', data: { members: [] } });

  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.status, u.avatar, u.last_seen 
     FROM users u 
     JOIN team_members tm ON u.id = tm.user_id 
     WHERE tm.team_id = ?`,
    [team.id]
  );

  res.json({ status: 'success', data: { members: rows } });
});

export const getMyTeamMembers = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [teamRows] = await pool.query(
    `SELECT t.id, t.name, t.project_id, t.leader_id
     FROM team_members tm
     JOIN teams t ON t.id = tm.team_id
     WHERE tm.user_id = ?
     LIMIT 1`,
    [userId]
  );

  const team = teamRows[0];
  if (!team) {
    return res.json({ status: 'success', data: { team: null, members: [] } });
  }

  const memberMap = new Map();

  const [members] = await pool.query(
    `SELECT
      u.id,
      u.name,
      u.first_name,
      u.email,
      u.role,
      u.status,
      u.avatar,
      u.last_seen,
      ul.lat,
      ul.lng,
      ul.accuracy,
      ul.updated_at as location_updated_at
    FROM team_members tm
    JOIN users u ON u.id = tm.user_id
    LEFT JOIN user_locations ul ON ul.user_id = u.id
    WHERE tm.team_id = ?`,
    [team.id]
  );

  for (const m of members) memberMap.set(m.id, { ...m, is_team_leader: false, team_id: team.id });

  if (team.leader_id) {
    const [leaderRows] = await pool.query(
      `SELECT
        u.id,
        u.name,
        u.first_name,
        u.email,
        u.role,
        u.status,
        u.avatar,
        u.last_seen,
        ul.lat,
        ul.lng,
        ul.accuracy,
        ul.updated_at as location_updated_at
      FROM users u
      LEFT JOIN user_locations ul ON ul.user_id = u.id
      WHERE u.id = ?
      LIMIT 1`,
      [team.leader_id]
    );

    const leader = leaderRows[0];
    if (leader) {
      memberMap.set(leader.id, { ...leader, is_team_leader: true, team_id: team.id });
    }
  }

  const allMembers = Array.from(memberMap.values()).sort((a, b) => {
    if (a.is_team_leader && !b.is_team_leader) return -1;
    if (!a.is_team_leader && b.is_team_leader) return 1;
    return String(a.name).localeCompare(String(b.name));
  });

  res.json({
    status: 'success',
    data: {
      team: { id: team.id, name: team.name, project_id: team.project_id, leader_id: team.leader_id },
      members: allMembers,
    },
  });
});

export const createTeam = asyncHandler(async (req, res) => {
  const { project_id, name, leader_id } = req.body;
  const id = uuidv4();

  if (!project_id || !name) {
    return res.status(400).json({ status: 'error', message: 'project_id and name are required' });
  }

  await pool.query(
    'INSERT INTO teams (id, project_id, name, leader_id) VALUES (?, ?, ?, ?)',
    [id, project_id, name, leader_id || null]
  );

  await logAudit(req.user.id, 'team.create', { team_id: id, project_id });

  const [rows] = await pool.query('SELECT * FROM teams WHERE id = ?', [id]);
  res.status(201).json({ status: 'success', data: { team: rows[0] } });
});

export const addMember = asyncHandler(async (req, res) => {
  const { teamId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ status: 'error', message: 'userId is required' });
  }

  await pool.query('INSERT IGNORE INTO team_members (team_id, user_id) VALUES (?, ?)', [teamId, userId]);
  
  await logAudit(req.user.id, 'team.member_add', { team_id: teamId, user_id: userId });

  res.json({ status: 'success', message: 'Member added to team' });
});

export const removeMember = asyncHandler(async (req, res) => {
  const { teamId, userId } = req.params;

  await pool.query('DELETE FROM team_members WHERE team_id = ? AND user_id = ?', [teamId, userId]);
  
  await logAudit(req.user.id, 'team.member_remove', { team_id: teamId, user_id: userId });

  res.json({ status: 'success', message: 'Member removed from team' });
});

export const getTeamsByProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const [rows] = await pool.query(
    `SELECT t.*, u.name as leader_name, 
      (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = t.id) as member_count 
     FROM teams t 
     LEFT JOIN users u ON t.leader_id = u.id 
     WHERE t.project_id = ?`,
    [projectId]
  );
  res.json({ status: 'success', data: { teams: rows } });
});

export const manageTeamSession = asyncHandler(async (req, res) => {
  const { action } = req.body;

  const [teamRows] = await pool.query('SELECT id, name, session_started_at FROM teams WHERE leader_id = ?', [req.user.id]);
  const team = teamRows[0];

  if (!team) {
    throw new AppError('No team assigned', 404);
  }

  if (action === 'start') {
    await pool.query('UPDATE teams SET session_started_at = NOW() WHERE id = ?', [team.id]);
    res.json({
      status: 'success',
      message: 'Team session started',
      data: {
        action: 'started',
        teamName: team.name,
        startedAt: new Date().toISOString(),
      },
    });
  } else if (action === 'end') {
    let elapsedSeconds = 0;
    if (team.session_started_at) {
      elapsedSeconds = Math.floor((Date.now() - new Date(team.session_started_at).getTime()) / 1000);
    }

    await pool.query('UPDATE teams SET session_started_at = NULL WHERE id = ?', [team.id]);
    res.json({
      status: 'success',
      message: 'Team session ended',
      data: {
        action: 'ended',
        durationSeconds: elapsedSeconds,
      },
    });
  } else if (action === 'status') {
    res.json({
      status: 'success',
      data: {
        active: !!team.session_started_at,
        startedAt: team.session_started_at,
      },
    });
  } else {
    throw new AppError('Invalid action. Use start, end, or status', 400);
  }
});
