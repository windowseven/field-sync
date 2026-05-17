import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database.js';
import { emitToUser } from '../sockets/wsServer.js';
import { getNotificationLink } from '../utils/roleHelpers.js';

export async function createNotification({ userId, type, title, message, senderId, link, projectId }) {
  const id = uuidv4();
  const notifLink = link || getNotificationLink(userId);

  await pool.query(
    `INSERT INTO notifications (id, user_id, type, title, message, link, sender_id, project_id, created_at, is_read)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), FALSE)`,
    [id, userId, type, title, message, notifLink, senderId || null, projectId || null]
  );

  emitToUser(userId, 'notification:new', {
    id, type, title, message, link: notifLink, createdAt: new Date().toISOString(),
  });

  return id;
}

export async function createBulkNotification({ userIds, type, title, message, senderId, projectId }) {
  const ids = userIds.map(() => uuidv4());
  const values = userIds.map((userId, i) => [
    ids[i], userId, type, title, message,
    getNotificationLink(userId), senderId || null, projectId || null,
  ]);

  await pool.query(
    `INSERT INTO notifications (id, user_id, type, title, message, link, sender_id, project_id, created_at, is_read)
     VALUES ?`,
    [values.map(v => [...v, 'NOW()', false].join(','))]
  );

  values.forEach((v, i) => {
    emitToUser(v[1], 'notification:new', {
      id: ids[i], type, title, message, link: v[5], createdAt: new Date().toISOString(),
    });
  });

  return ids;
}
