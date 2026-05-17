import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database.js';
import { broadcastToRoles, emitToUser } from '../sockets/wsServer.js';
import { checkZoneBoundary } from '../utils/zoneBoundary.js';
import { getUserRole, getNotificationLink } from '../utils/roleHelpers.js';

export const processBatch = async (req, res) => {
  const { submissions, updates, locations, items } = req.body;
  const userId = req.user.id;

  const results = [];

  if (items?.length) {
    for (const item of items) {
      try {
        if (item.type === 'form_submission') {
          await handleSubmission(item.data, userId);
        } else if (item.type === 'task_update') {
          await handleTaskUpdate(item.data);
        } else if (item.type === 'location_update') {
          await handleLocationUpdate(item.data);
        }
        results.push({ id: item.id, status: 'success' });
      } catch (err) {
        results.push({ id: item.id, status: 'failed', message: err.message });
      }
    }
  }

  if (submissions?.length) {
    for (const s of submissions) {
      try {
        await handleSubmission(s, userId);
        results.push({ id: s.id || uuidv4(), status: 'success' });
      } catch (err) {
        results.push({ id: s.id || uuidv4(), status: 'failed', message: err.message });
      }
    }
  }

  if (updates?.length) {
    for (const u of updates) {
      try {
        await handleTaskUpdate(u);
        results.push({ id: u.id || uuidv4(), status: 'success' });
      } catch (err) {
        results.push({ id: u.id || uuidv4(), status: 'failed', message: err.message });
      }
    }
  }

  if (locations?.length) {
    for (const l of locations) {
      try {
        await handleLocationUpdate(l);
        results.push({ id: l.id || uuidv4(), status: 'success' });
      } catch (err) {
        results.push({ id: l.id || uuidv4(), status: 'failed', message: err.message });
      }
    }
  }

  res.json({
    status: 'success',
    data: { results },
    processed: {
      submissions: submissions?.length || 0,
      updates: updates?.length || 0,
      locations: locations?.length || 0,
      items: items?.length || 0,
    },
  });
};

async function handleSubmission(data, userId) {
  const { id, form_id, responses, location } = data;
  await pool.query(
    'INSERT INTO submissions (id, form_id, user_id, project_id, data, location) VALUES (?, ?, ?, ?, ?, ?)',
    [id || uuidv4(), form_id, userId, data.project_id, JSON.stringify(responses), JSON.stringify(location)]
  );

  const notifId = uuidv4();
  const link = getNotificationLink(userId, 'form');
  await pool.query(
    'INSERT INTO notifications (id, user_id, type, title, message, status, link) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [notifId, userId, 'form', 'Form submitted', `Submission received for form ${form_id}.`, 'unread', link]
  );
  emitToUser(userId, 'notification:new', {
    id: notifId,
    user_id: userId,
    type: 'form',
    title: 'Form submitted',
    body: `Submission received for form ${form_id}.`,
    is_read: false,
    action_url: link,
    created_at: new Date().toISOString(),
  });

  broadcastToRoles(['admin', 'supervisor', 'team_leader'], 'submission:new', {
    id,
    form_id,
    user_id: userId,
    project_id: data.project_id,
    ts: Date.now(),
  });
}

async function handleTaskUpdate(data) {
  const { task_id, status } = data;
  
  await pool.query(
    'UPDATE tasks SET status = ?, completed_at = ? WHERE id = ?',
    [status, status === 'completed' ? new Date() : null, task_id]
  );

  const [taskRows] = await pool.query('SELECT title, assigned_to, assigned_by FROM tasks WHERE id = ?', [task_id]);
  const task = taskRows?.[0];
  
  if (task?.assigned_by) {
    const notifId = uuidv4();
    const link = getNotificationLink(task.assigned_by);
    const title = status === 'completed' ? 'Task completed' : 'Task updated';
    const body = status === 'completed'
      ? `Task "${task.title}" has been completed.`
      : `Task "${task.title}" status changed to ${status}.`;
    const type = status === 'completed' ? 'task_completion' : 'task';
    
    await pool.query(
      'INSERT INTO notifications (id, user_id, type, title, message, status, link) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [notifId, task.assigned_by, type, title, body, 'unread', link]
    );
    emitToUser(task.assigned_by, 'notification:new', {
      id: notifId,
      user_id: task.assigned_by,
      type,
      title,
      body,
      is_read: false,
      action_url: link,
      created_at: new Date().toISOString(),
    });
  }

  broadcastToRoles(['admin', 'supervisor', 'team_leader'], 'task:update', {
    task_id,
    status,
    ts: Date.now(),
  });
}

async function handleLocationUpdate(data) {
  const { user_id, lat, lng, project_id } = data;
  await pool.query(
    'INSERT INTO user_locations (id, user_id, project_id, latitude, longitude, accuracy, captured_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [uuidv4(), user_id, project_id, lat, lng, data.accuracy || 10, new Date()]
  );

  await pool.query(
    'INSERT INTO user_location_history (id, user_id, lat, lng, accuracy, recorded_at) VALUES (?, ?, ?, ?, ?, NOW())',
    [uuidv4(), user_id, lat, lng, data.accuracy || 10]
  );

  await checkZoneBoundary(user_id, lat, lng);

  broadcastToRoles(['admin', 'supervisor', 'team_leader'], 'location:update', {
    user_id,
    lat,
    lng,
    ts: Date.now(),
  });
}