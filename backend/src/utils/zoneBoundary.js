import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { emitToUser } from '../sockets/wsServer.js';
import { getUserRole, getNotificationLink } from './roleHelpers.js';

function isPointInPolygon(lat, lng, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export const checkZoneBoundary = async (userId, lat, lng) => {
  const [taskRows] = await pool.query(
    `SELECT DISTINCT z.id, z.name, z.boundaries
     FROM tasks t
     JOIN zones z ON t.zone_id = z.id
     WHERE t.assigned_to = ? AND t.status IN ('pending', 'in-progress') AND z.boundaries IS NOT NULL`,
    [userId]
  );

  if (taskRows.length === 0) return null;

  for (const zone of taskRows) {
    let boundaries;
    try {
      boundaries = typeof zone.boundaries === 'string' ? JSON.parse(zone.boundaries) : zone.boundaries;
    } catch {
      continue;
    }

    if (!boundaries || !boundaries.length) continue;

    for (const polygon of boundaries) {
      if (isPointInPolygon(lat, lng, polygon)) {
        return { inside: true, zone: zone.name };
      }
    }
  }

  const [userRows] = await pool.query('SELECT name FROM users WHERE id = ?', [userId]);
  const userName = userRows[0]?.name || 'A field agent';

  const [teamRows] = await pool.query(
    `SELECT DISTINCT tm.user_id
     FROM team_members tm
     JOIN team_members tm2 ON tm.team_id = tm2.team_id
     WHERE tm2.user_id = ?`,
    [userId]
  );

  const alertRecipients = new Set();
  for (const row of teamRows) {
    const [roleRows] = await pool.query('SELECT role FROM users WHERE id = ?', [row.user_id]);
    if (roleRows[0]?.role === 'team_leader') {
      alertRecipients.add(row.user_id);
    }
  }

  const [supervisorRows] = await pool.query(
    `SELECT DISTINCT u.id
     FROM users u
     JOIN team_members tm ON u.id = tm.user_id
     WHERE tm.team_id IN (SELECT team_id FROM team_members WHERE user_id = ?)
     AND u.role = 'supervisor'`,
    [userId]
  );

  for (const sup of supervisorRows) {
    alertRecipients.add(sup.id);
  }

  const alertId = uuidv4();
  const alertData = {
    id: alertId,
    type: 'zone_boundary',
    user_id: userId,
    user_name: userName,
    lat,
    lng,
    ts: new Date().toISOString(),
  };

  for (const recipientId of alertRecipients) {
    const notifId = uuidv4();
    const link = getNotificationLink(recipientId);
    await pool.query(
      'INSERT INTO notifications (id, user_id, type, title, message, status, link) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        notifId,
        recipientId,
        'zone_alert',
        'Zone boundary breach',
        `${userName} has left their assigned zone.`,
        'unread',
        link,
      ]
    );
    emitToUser(recipientId, 'notification:new', {
      id: notifId,
      user_id: recipientId,
      type: 'zone_alert',
      title: 'Zone boundary breach',
      body: `${userName} has left their assigned zone.`,
      is_read: false,
      action_url: link,
      created_at: new Date().toISOString(),
    });
  }

  return { inside: false, alert: alertData };
};
