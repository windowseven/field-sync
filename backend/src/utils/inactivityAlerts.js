import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import { emitToUser } from '../sockets/wsServer.js';

function getUserRole(userId) {
  if (userId.startsWith('admin-')) return 'admin';
  if (userId.startsWith('sup-')) return 'supervisor';
  if (userId.startsWith('tl-')) return 'team_leader';
  return 'field_agent';
}

function getNotificationLink(userId) {
  const role = getUserRole(userId);
  if (role === 'admin') return '/admin/notifications';
  if (role === 'supervisor') return '/supervisor/notifications';
  if (role === 'team_leader') return '/teamleader/notifications';
  return '/user/notifications';
}

export const checkInactivityAlerts = async (inactivityMinutes = 15) => {
  const cutoffTime = new Date(Date.now() - inactivityMinutes * 60 * 1000);

  const [inactiveUsers] = await pool.query(
    `SELECT u.id, u.name, u.role, u.status, ul.updated_at as last_location_update
     FROM users u
     LEFT JOIN user_locations ul ON u.id = ul.user_id
     WHERE u.role = 'field_agent'
     AND u.status = 'online'
     AND (ul.updated_at IS NULL OR ul.updated_at < ?)`,
    [cutoffTime]
  );

  if (inactiveUsers.length === 0) return [];

  const alerts = [];

  for (const user of inactiveUsers) {
    const [teamRows] = await pool.query(
      `SELECT DISTINCT tm.user_id, u.role as member_role
       FROM team_members tm
       JOIN users u ON tm.user_id = u.id
       JOIN team_members tm2 ON tm.team_id = tm2.team_id
       WHERE tm2.user_id = ?`,
      [user.id]
    );

    const alertRecipients = new Set();
    for (const row of teamRows) {
      if (row.member_role === 'team_leader' || row.member_role === 'supervisor') {
        alertRecipients.add(row.user_id);
      }
    }

    const [supervisorRows] = await pool.query(
      `SELECT u.id
       FROM users u
       WHERE u.role IN ('supervisor', 'team_leader')`,
    );

    for (const sup of supervisorRows) {
      alertRecipients.add(sup.id);
    }

    const alertId = uuidv4();
    const alertData = {
      id: alertId,
      type: 'inactivity',
      user_id: user.id,
      user_name: user.name,
      last_seen: user.last_location_update,
      ts: new Date().toISOString(),
    };

    for (const recipientId of alertRecipients) {
      const notifId = uuidv4();
      const link = getNotificationLink(recipientId);
      const minutesAgo = user.last_location_update
        ? Math.floor((Date.now() - new Date(user.last_location_update).getTime()) / 60000)
        : 'unknown';

      await pool.query(
        'INSERT INTO notifications (id, user_id, type, title, message, status, link) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          notifId,
          recipientId,
          'inactivity_alert',
          'Agent inactive',
          `${user.name} has been inactive for ${minutesAgo} minutes.`,
          'unread',
          link,
        ]
      );

      emitToUser(recipientId, 'notification:new', {
        id: notifId,
        user_id: recipientId,
        type: 'inactivity_alert',
        title: 'Agent inactive',
        body: `${user.name} has been inactive for ${minutesAgo} minutes.`,
        is_read: false,
        action_url: link,
        created_at: new Date().toISOString(),
      });
    }

    alerts.push(alertData);
  }

  return alerts;
};
