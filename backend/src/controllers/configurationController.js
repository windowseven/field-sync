import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import pool from '../config/database.js';
import logger from '../utils/logger.js';
import { broadcast, emitToUser, getConnectedClientsSnapshot } from '../sockets/wsServer.js';
import { logAudit } from './auditLogController.js';
import {
  getAppSettings,
  getPlatformControls,
  getUserPreferences,
  maskApiKey,
  setAppSetting,
  updateUserPreferences,
} from '../utils/platformConfigStore.js';
import { getSecurityPolicies } from '../utils/securityPolicyStore.js';

const AUDIENCE_ROLE_FILTERS = {
  all: null,
  supervisors: ['supervisor'],
  workers: ['field_agent'],
  admins: ['admin'],
  team_leaders: ['team_leader'],
};

const AUDIENCE_LABELS = {
  all: 'All Users',
  supervisors: 'All Supervisors',
  workers: 'All Field Workers',
  admins: 'All Admins',
  team_leaders: 'All Team Leaders',
};

const BROADCAST_NOTIFICATION_TYPES = {
  announcement: 'system',
  maintenance: 'alert',
  alert: 'alert',
};

const EMERGENCY_CONTROL_LABELS = {
  trackingDisabled: 'Live tracking',
  registrationBlocked: 'Registrations',
  maintenanceMode: 'Maintenance mode',
  platformLocked: 'Platform lock',
};

function buildLastName(name = '', firstName = '') {
  if (!name) return '';
  if (firstName && name.toLowerCase().startsWith(firstName.toLowerCase())) {
    return name.slice(firstName.length).trim();
  }
  return name.split(' ').slice(1).join(' ');
}

function createPasswordValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function validatePasswordWithPolicy(password) {
  const passwordPolicy = getSecurityPolicies().password;

  if (typeof password !== 'string' || password.length < passwordPolicy.minLength) {
    throw createPasswordValidationError(
      `Password must be at least ${passwordPolicy.minLength} characters`
    );
  }

  if (!/[a-z]/.test(password)) {
    throw createPasswordValidationError('Password must contain lowercase letters');
  }

  if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
    throw createPasswordValidationError('Password must contain uppercase letters');
  }

  if (passwordPolicy.requireNumbers && !/[0-9]/.test(password)) {
    throw createPasswordValidationError('Password must contain numbers');
  }

  if (passwordPolicy.requireSymbols && !/[^A-Za-z0-9]/.test(password)) {
    throw createPasswordValidationError('Password must contain symbols');
  }
}

function mapSessionRows(rows = []) {
  return rows.map((row, index) => ({
    id: row.id ?? `${row.timestamp}-${index}`,
    label: index === 0 ? 'Current session' : 'Recent login',
    detail: row.ip_address ? `IP ${row.ip_address}` : 'IP unavailable',
    current: index === 0,
    timestamp: new Date(row.timestamp).toISOString(),
  }));
}

function mapNotificationRow(row) {
  return {
    id: row.id,
    user_id: row.user_id,
    type: row.type,
    title: row.title,
    body: row.message,
    is_read: row.status === 'read',
    action_url: row.link,
    created_at: new Date(row.created_at).toISOString(),
  };
}

async function getRecipientsByAudience(audience) {
  const roles = AUDIENCE_ROLE_FILTERS[audience];

  if (!roles) {
    const [rows] = await pool.query('SELECT id, name, email, role FROM users ORDER BY name ASC');
    return rows;
  }

  const placeholders = roles.map(() => '?').join(', ');
  const [rows] = await pool.query(
    `SELECT id, name, email, role FROM users WHERE role IN (${placeholders}) ORDER BY name ASC`,
    roles
  );
  return rows;
}

async function insertNotification({
  userId,
  type,
  title,
  message,
  link = null,
  senderId = null,
  senderName = null,
  projectId = null,
}) {
  const id = crypto.randomUUID();

  await pool.query(
    `INSERT INTO notifications (
      id, user_id, type, title, message, status, link, sender_id, sender_name, project_id
    ) VALUES (?, ?, ?, ?, ?, 'unread', ?, ?, ?, ?)`,
    [id, userId, type, title, message, link, senderId, senderName, projectId]
  );

  const payload = mapNotificationRow({
    id,
    user_id: userId,
    type,
    title,
    message,
    status: 'unread',
    link,
    created_at: new Date().toISOString(),
  });

  emitToUser(userId, 'notification:new', payload);
  return payload;
}

async function insertEmergencyAction({ controlKey, action, enabled, reason, createdBy }) {
  const id = crypto.randomUUID();

  await pool.query(
    `INSERT INTO emergency_actions (id, control_key, action, enabled, reason, created_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, controlKey, action, enabled, reason || null, createdBy]
  );
}

export const getMySettings = async (req, res) => {
  try {
    const [userRows] = await pool.query(
      `SELECT
        id,
        name,
        first_name,
        email,
        role,
        avatar,
        phone,
        status,
        notifications_enabled,
        location_sharing_enabled
      FROM users
      WHERE id = ?
      LIMIT 1`,
      [req.user.id]
    );

    const user = userRows?.[0];
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const preferences = await getUserPreferences(req.user.id);
    const appSettings = await getAppSettings();
    const [sessionRows] = await pool.query(
      `SELECT id, ip_address, timestamp
       FROM audit_logs
       WHERE user_id = ? AND action = 'user.login'
       ORDER BY timestamp DESC, id DESC
       LIMIT 5`,
      [req.user.id]
    );

    res.json({
      status: 'success',
      data: {
        profile: {
          id: user.id,
          firstName: user.first_name ?? '',
          lastName: buildLastName(user.name, user.first_name),
          email: user.email,
          phone: user.phone ?? '',
          bio: preferences.bio,
          role: user.role,
          avatar: user.avatar ?? '',
        },
        notifications: {
          notificationsEnabled: Boolean(user.notifications_enabled),
          email: preferences.notificationEmail,
          push: preferences.notificationPush,
          sms: preferences.notificationSms,
          teamUpdates: preferences.notificationTeamUpdates,
          formSubmissions: preferences.notificationFormSubmissions,
          systemAlerts: preferences.notificationSystemAlerts,
        },
        appearance: {
          theme: preferences.preferredTheme,
          language: preferences.preferredLanguage,
          timezone: preferences.preferredTimezone,
        },
        security: {
          twoFactorEnabled: preferences.twoFactorEnabled,
          passwordPolicy: getSecurityPolicies().password,
          sessions: mapSessionRows(sessionRows),
        },
        system: {
          autoSyncEnabled: Boolean(appSettings.autoSyncEnabled),
          offlineModeEnabled: Boolean(appSettings.offlineModeEnabled),
          locationUpdateIntervalSeconds: Number(appSettings.locationUpdateIntervalSeconds) || 30,
          gpsAccuracy: appSettings.gpsAccuracy ?? 'high',
          apiKeyMasked: maskApiKey(appSettings.apiKey),
          apiKeyLastRotatedAt: appSettings.apiKeyLastRotatedAt,
          locationSharingEnabled: Boolean(user.location_sharing_enabled),
          canManageSystem: req.user.role === 'admin',
        },
      },
    });
  } catch (error) {
    logger.error(`Configuration settings snapshot error: ${error.message}`);
    res.status(500).json({ status: 'error', message: 'Failed to load settings' });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, first_name, email, phone, avatar FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );
    const existing = rows?.[0];

    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const firstName = String(req.body.firstName ?? existing.first_name ?? '').trim();
    const lastName = String(req.body.lastName ?? buildLastName(existing.name, existing.first_name)).trim();
    const name = [firstName, lastName].filter(Boolean).join(' ').trim() || existing.name;
    const phone = req.body.phone != null ? String(req.body.phone).trim() : existing.phone;
    const avatar = req.body.avatar != null ? String(req.body.avatar).trim() : existing.avatar;
    const bio = req.body.bio != null ? String(req.body.bio) : undefined;

    await pool.query(
      'UPDATE users SET name = ?, first_name = ?, phone = ?, avatar = ? WHERE id = ?',
      [name, firstName || null, phone || null, avatar || null, req.user.id]
    );

    if (bio !== undefined) {
      await updateUserPreferences(req.user.id, { bio });
    }

    await logAudit(req.user.id, 'settings.profile_update', {
      target_type: 'user',
      target_id: req.user.id,
      target_name: existing.email,
    });

    res.json({
      status: 'success',
      data: {
        profile: {
          firstName,
          lastName,
          email: existing.email,
          phone: phone || '',
          bio: bio ?? (await getUserPreferences(req.user.id)).bio,
          avatar: avatar || '',
        },
      },
    });
  } catch (error) {
    logger.error(`Update profile error: ${error.message}`);
    res.status(500).json({ status: 'error', message: 'Failed to update profile' });
  }
};

export const updateMyPreferences = async (req, res) => {
  try {
    const currentPreferences = await getUserPreferences(req.user.id);
    const preferencePatch = {
      preferredTheme: req.body.theme ?? currentPreferences.preferredTheme,
      preferredLanguage: req.body.language ?? currentPreferences.preferredLanguage,
      preferredTimezone: req.body.timezone ?? currentPreferences.preferredTimezone,
      notificationEmail:
        req.body.email != null ? Boolean(req.body.email) : currentPreferences.notificationEmail,
      notificationPush:
        req.body.push != null ? Boolean(req.body.push) : currentPreferences.notificationPush,
      notificationSms:
        req.body.sms != null ? Boolean(req.body.sms) : currentPreferences.notificationSms,
      notificationTeamUpdates:
        req.body.teamUpdates != null
          ? Boolean(req.body.teamUpdates)
          : currentPreferences.notificationTeamUpdates,
      notificationFormSubmissions:
        req.body.formSubmissions != null
          ? Boolean(req.body.formSubmissions)
          : currentPreferences.notificationFormSubmissions,
      notificationSystemAlerts:
        req.body.systemAlerts != null
          ? Boolean(req.body.systemAlerts)
          : currentPreferences.notificationSystemAlerts,
      twoFactorEnabled:
        req.body.twoFactorEnabled != null
          ? Boolean(req.body.twoFactorEnabled)
          : currentPreferences.twoFactorEnabled,
    };

    const notificationsEnabled =
      req.body.notificationsEnabled != null ? Boolean(req.body.notificationsEnabled) : undefined;
    const locationSharingEnabled =
      req.body.locationSharingEnabled != null ? Boolean(req.body.locationSharingEnabled) : undefined;

    await updateUserPreferences(req.user.id, preferencePatch);

    if (notificationsEnabled !== undefined || locationSharingEnabled !== undefined) {
      const updates = [];
      const values = [];

      if (notificationsEnabled !== undefined) {
        updates.push('notifications_enabled = ?');
        values.push(notificationsEnabled);
      }

      if (locationSharingEnabled !== undefined) {
        updates.push('location_sharing_enabled = ?');
        values.push(locationSharingEnabled);
      }

      values.push(req.user.id);

      await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    await logAudit(req.user.id, 'settings.preferences_update', {
      target_type: 'user',
      target_id: req.user.id,
      target_name: req.user.email,
    });

    res.json({
      status: 'success',
      data: {
        notifications: {
          notificationsEnabled,
          email: preferencePatch.notificationEmail,
          push: preferencePatch.notificationPush,
          sms: preferencePatch.notificationSms,
          teamUpdates: preferencePatch.notificationTeamUpdates,
          formSubmissions: preferencePatch.notificationFormSubmissions,
          systemAlerts: preferencePatch.notificationSystemAlerts,
        },
        appearance: {
          theme: preferencePatch.preferredTheme,
          language: preferencePatch.preferredLanguage,
          timezone: preferencePatch.preferredTimezone,
        },
        security: {
          twoFactorEnabled: preferencePatch.twoFactorEnabled,
        },
      },
    });
  } catch (error) {
    logger.error(`Update preferences error: ${error.message}`);
    res.status(500).json({ status: 'error', message: 'Failed to update preferences' });
  }
};

export const updateSystemSettings = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Only admins can update system settings' });
    }

    const updates = {
      autoSyncEnabled:
        req.body.autoSyncEnabled != null ? Boolean(req.body.autoSyncEnabled) : undefined,
      offlineModeEnabled:
        req.body.offlineModeEnabled != null ? Boolean(req.body.offlineModeEnabled) : undefined,
      locationUpdateIntervalSeconds:
        req.body.locationUpdateIntervalSeconds != null
          ? Number(req.body.locationUpdateIntervalSeconds)
          : undefined,
      gpsAccuracy: req.body.gpsAccuracy != null ? String(req.body.gpsAccuracy) : undefined,
    };

    if (
      updates.locationUpdateIntervalSeconds != null &&
      (!Number.isFinite(updates.locationUpdateIntervalSeconds) || updates.locationUpdateIntervalSeconds < 10)
    ) {
      return res.status(400).json({ status: 'error', message: 'Location update interval must be at least 10 seconds' });
    }

    if (
      updates.gpsAccuracy != null &&
      !['high', 'medium', 'low'].includes(updates.gpsAccuracy)
    ) {
      return res.status(400).json({ status: 'error', message: 'Invalid GPS accuracy value' });
    }

    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined) continue;
      await setAppSetting(key, value, req.user.id);
    }

    const appSettings = await getAppSettings({ forceRefresh: true });

    await logAudit(req.user.id, 'settings.system_update', {
      target_type: 'system',
      target_id: 'app-settings',
      detail: JSON.stringify(updates),
    });

    res.json({
      status: 'success',
      data: {
        system: {
          autoSyncEnabled: Boolean(appSettings.autoSyncEnabled),
          offlineModeEnabled: Boolean(appSettings.offlineModeEnabled),
          locationUpdateIntervalSeconds: Number(appSettings.locationUpdateIntervalSeconds) || 30,
          gpsAccuracy: appSettings.gpsAccuracy,
          apiKeyMasked: maskApiKey(appSettings.apiKey),
          apiKeyLastRotatedAt: appSettings.apiKeyLastRotatedAt,
        },
      },
    });
  } catch (error) {
    logger.error(`Update system settings error: ${error.message}`);
    res.status(500).json({ status: 'error', message: 'Failed to update system settings' });
  }
};

export const regenerateSystemApiKey = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Only admins can regenerate the API key' });
    }

    const nextApiKey = crypto.randomBytes(24).toString('hex');
    const rotatedAt = new Date().toISOString();

    await setAppSetting('apiKey', nextApiKey, req.user.id);
    await setAppSetting('apiKeyLastRotatedAt', rotatedAt, req.user.id);

    await logAudit(req.user.id, 'settings.api_key_regenerate', {
      target_type: 'system',
      target_id: 'api-key',
    });

    res.json({
      status: 'success',
      data: {
        apiKey: nextApiKey,
        apiKeyMasked: maskApiKey(nextApiKey),
        apiKeyLastRotatedAt: rotatedAt,
      },
    });
  } catch (error) {
    logger.error(`Regenerate API key error: ${error.message}`);
    res.status(500).json({ status: 'error', message: 'Failed to regenerate API key' });
  }
};

export const changeMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ status: 'error', message: 'Current password and new password are required' });
    }

    validatePasswordWithPolicy(newPassword);

    const [rows] = await pool.query(
      'SELECT id, email, password_hash FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );
    const user = rows?.[0];

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const matches = await bcrypt.compare(currentPassword, user.password_hash);
    if (!matches) {
      return res.status(400).json({ status: 'error', message: 'Current password is incorrect' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, req.user.id]);

    await logAudit(req.user.id, 'settings.password_change', {
      target_type: 'user',
      target_id: req.user.id,
      target_name: user.email,
    });

    res.json({ status: 'success', message: 'Password updated successfully' });
  } catch (error) {
    logger.error(`Change password error: ${error.message}`);
    res.status(error.statusCode || 500).json({
      status: 'error',
      message: error.statusCode ? error.message : 'Failed to update password',
    });
  }
};

export const exportMyData = async (req, res) => {
  try {
    const [userRows] = await pool.query(
      'SELECT id, name, first_name, email, role, phone, avatar, status, created_at FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );

    if (!userRows?.[0]) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    const preferences = await getUserPreferences(req.user.id);
    const [notificationRows] = await pool.query(
      `SELECT id, type, title, message, status, link, sender_name, created_at, read_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 100`,
      [req.user.id]
    );
    const [auditRows] = await pool.query(
      `SELECT id, action, target_type, target_id, target_name, detail, ip_address, timestamp
       FROM audit_logs
       WHERE user_id = ?
       ORDER BY timestamp DESC
       LIMIT 100`,
      [req.user.id]
    );

    await logAudit(req.user.id, 'settings.data_export', {
      target_type: 'user',
      target_id: req.user.id,
      target_name: req.user.email,
    });

    res.json({
      status: 'success',
      data: {
        exportedAt: new Date().toISOString(),
        profile: userRows[0],
        preferences,
        notifications: notificationRows,
        auditLogs: auditRows,
      },
    });
  } catch (error) {
    logger.error(`Export data error: ${error.message}`);
    res.status(500).json({ status: 'error', message: 'Failed to export account data' });
  }
};

export const deleteMyAccount = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, email, role FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );
    const user = rows?.[0];

    if (!user) {
      return res.status(404).json({ status: 'error', message: 'User not found' });
    }

    if (user.role === 'admin') {
      const [adminRows] = await pool.query(
        'SELECT COUNT(*) AS total FROM users WHERE role = ? AND id != ?',
        ['admin', req.user.id]
      );

      if ((Number(adminRows?.[0]?.total) || 0) === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'You cannot delete the last remaining admin account',
        });
      }
    }

    await logAudit(req.user.id, 'settings.account_delete', {
      target_type: 'user',
      target_id: req.user.id,
      target_name: user.email,
    });

    await pool.query('DELETE FROM users WHERE id = ?', [req.user.id]);

    res.json({ status: 'success', message: 'Account deleted successfully' });
  } catch (error) {
    logger.error(`Delete account error: ${error.message}`);
    res.status(500).json({ status: 'error', message: 'Failed to delete account' });
  }
};

export const getBroadcastSnapshot = async (req, res) => {
  try {
    const [audienceRows] = await pool.query(
      `SELECT
        COUNT(*) AS totalUsers,
        SUM(CASE WHEN role = 'supervisor' THEN 1 ELSE 0 END) AS supervisors,
        SUM(CASE WHEN role = 'field_agent' THEN 1 ELSE 0 END) AS workers
       FROM users`
    );

    const [historyRows] = await pool.query(
      `SELECT
        b.id,
        b.title,
        b.message,
        b.type,
        b.audience,
        b.sent_at,
        u.name AS sender_name,
        COUNT(d.user_id) AS delivered_count,
        SUM(CASE WHEN d.status = 'read' THEN 1 ELSE 0 END) AS read_count
       FROM broadcasts b
       LEFT JOIN users u ON u.id = b.sent_by
       LEFT JOIN broadcast_deliveries d ON d.broadcast_id = b.id
       GROUP BY b.id, b.title, b.message, b.type, b.audience, b.sent_at, u.name
       ORDER BY b.sent_at DESC
       LIMIT 20`
    );

    res.json({
      status: 'success',
      data: {
        audienceCounts: {
          all: Number(audienceRows?.[0]?.totalUsers) || 0,
          supervisors: Number(audienceRows?.[0]?.supervisors) || 0,
          workers: Number(audienceRows?.[0]?.workers) || 0,
        },
        broadcasts: historyRows.map((row) => ({
          id: row.id,
          title: row.title,
          message: row.message,
          type: row.type,
          audience: row.audience,
          audienceLabel: AUDIENCE_LABELS[row.audience] ?? row.audience,
          sentAt: new Date(row.sent_at).toISOString(),
          senderName: row.sender_name ?? 'System',
          deliveredCount: Number(row.delivered_count) || 0,
          readCount: Number(row.read_count) || 0,
        })),
      },
    });
  } catch (error) {
    logger.error(`Broadcast snapshot error: ${error.message}`);
    res.status(500).json({ status: 'error', message: 'Failed to load broadcasts' });
  }
};

export const createBroadcast = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Only admins can send broadcasts' });
    }

    const title = String(req.body.title ?? '').trim();
    const message = String(req.body.message ?? '').trim();
    const audience = String(req.body.audience ?? 'all');
    const type = String(req.body.type ?? 'announcement');

    if (!title || !message) {
      return res.status(400).json({ status: 'error', message: 'Title and message are required' });
    }

    if (!Object.prototype.hasOwnProperty.call(AUDIENCE_ROLE_FILTERS, audience)) {
      return res.status(400).json({ status: 'error', message: 'Invalid audience' });
    }

    if (!Object.prototype.hasOwnProperty.call(BROADCAST_NOTIFICATION_TYPES, type)) {
      return res.status(400).json({ status: 'error', message: 'Invalid broadcast type' });
    }

    const [senderRows] = await pool.query(
      'SELECT id, name, email FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );
    const sender = senderRows?.[0];

    const recipients = await getRecipientsByAudience(audience);
    const broadcastId = crypto.randomUUID();

    await pool.query(
      'INSERT INTO broadcasts (id, title, message, type, audience, sent_by) VALUES (?, ?, ?, ?, ?, ?)',
      [broadcastId, title, message, type, audience, req.user.id]
    );

    if (recipients.length > 0) {
      const deliveryValues = recipients.map(r => [broadcastId, r.id, 'unread']);
      const deliveryPlaceholders = recipients.map(() => '(?, ?, ?)').join(', ');
      await pool.query(
        `INSERT INTO broadcast_deliveries (broadcast_id, user_id, status) VALUES ${deliveryPlaceholders}`,
        deliveryValues.flat()
      );

      const notifType = BROADCAST_NOTIFICATION_TYPES[type];
      const senderName = sender?.name ?? sender?.email ?? 'System';
      const notifValues = recipients.map(r => [
        crypto.randomUUID(), r.id, notifType, title, message, 'unread', '/dashboard/alerts',
        sender?.id ?? null, senderName, null
      ]);
      const notifPlaceholders = recipients.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
      await pool.query(
        `INSERT INTO notifications (id, user_id, type, title, message, status, link, sender_id, sender_name, project_id) VALUES ${notifPlaceholders}`,
        notifValues.flat()
      );

      for (const recipient of recipients) {
        emitToUser(recipient.id, 'notification:new', {
          id: notifValues[recipients.indexOf(recipient)][0],
          user_id: recipient.id,
          type: notifType,
          title,
          body: message,
          is_read: 0,
          action_url: '/dashboard/alerts',
          created_at: new Date().toISOString(),
        });
      }
    }

    await logAudit(req.user.id, 'broadcast.send', {
      target_type: 'broadcast',
      target_id: broadcastId,
      target_name: title,
      audience,
      recipient_count: recipients.length,
      category: 'system',
    });

    const payload = {
      id: broadcastId,
      title,
      message,
      type,
      audience,
      audienceLabel: AUDIENCE_LABELS[audience] ?? audience,
      sentAt: new Date().toISOString(),
      senderName: sender?.name ?? sender?.email ?? 'System',
      deliveredCount: recipients.length,
      readCount: 0,
    };

    broadcast('broadcast:new', payload);

    res.status(201).json({
      status: 'success',
      data: {
        broadcast: payload,
      },
    });
  } catch (error) {
    logger.error(`Create broadcast error: ${error.message}`);
    res.status(500).json({ status: 'error', message: 'Failed to send broadcast' });
  }
};

export const getEmergencySnapshot = async (req, res) => {
  try {
    const controls = await getPlatformControls();
    const connected = getConnectedClientsSnapshot();
    const [userRows] = await pool.query(
      `SELECT
        COUNT(*) AS totalUsers,
        SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) AS activeUsers
       FROM users`
    );
    const [projectRows] = await pool.query(
      `SELECT
        COUNT(*) AS totalProjects,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS activeProjects
       FROM projects`
    );
    const [actionRows] = await pool.query(
      `SELECT
        ea.id,
        ea.control_key,
        ea.action,
        ea.enabled,
        ea.reason,
        ea.created_at,
        u.name,
        u.email
       FROM emergency_actions ea
       LEFT JOIN users u ON u.id = ea.created_by
       ORDER BY ea.created_at DESC
       LIMIT 12`
    );

    res.json({
      status: 'success',
      data: {
        controls,
        systemStatus: {
          uptimeSeconds: Math.floor(process.uptime()),
          activeUsers: Number(userRows?.[0]?.activeUsers) || 0,
          activeSessions: connected.total,
          activeProjects: Number(projectRows?.[0]?.activeProjects) || 0,
          totalUsers: Number(userRows?.[0]?.totalUsers) || 0,
          totalProjects: Number(projectRows?.[0]?.totalProjects) || 0,
        },
        recentActions: actionRows.map((row) => ({
          id: row.id,
          controlKey: row.control_key,
          action: row.action,
          enabled: Boolean(row.enabled),
          reason: row.reason ?? '',
          actor: row.name ?? row.email ?? 'System',
          createdAt: new Date(row.created_at).toISOString(),
        })),
      },
    });
  } catch (error) {
    logger.error(`Emergency snapshot error: ${error.message}`);
    res.status(500).json({ status: 'error', message: 'Failed to load emergency controls' });
  }
};

export const updateEmergencyControl = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Only admins can use emergency controls' });
    }

    const controlKey = String(req.body.controlKey ?? '');
    const enabled = Boolean(req.body.enabled);
    const reason = String(req.body.reason ?? '').trim();

    if (!Object.prototype.hasOwnProperty.call(EMERGENCY_CONTROL_LABELS, controlKey)) {
      return res.status(400).json({ status: 'error', message: 'Invalid emergency control' });
    }

    await setAppSetting(controlKey, enabled, req.user.id);
    await insertEmergencyAction({
      controlKey,
      action: enabled ? 'enabled' : 'disabled',
      enabled,
      reason,
      createdBy: req.user.id,
    });

    await logAudit(req.user.id, 'emergency.control_update', {
      target_type: 'system',
      target_id: controlKey,
      target_name: EMERGENCY_CONTROL_LABELS[controlKey],
      enabled,
      reason,
      category: 'system',
    });

    const notificationTitle = `${EMERGENCY_CONTROL_LABELS[controlKey]} ${enabled ? 'enabled' : 'disabled'}`;
    const notificationMessage = reason || `${EMERGENCY_CONTROL_LABELS[controlKey]} was ${enabled ? 'enabled' : 'disabled'} by admin.`;

    const [recipients] = await pool.query('SELECT id FROM users');
    for (const recipient of recipients) {
      await insertNotification({
        userId: recipient.id,
        type: 'alert',
        title: notificationTitle,
        message: notificationMessage,
        link: '/dashboard/emergency',
        senderId: req.user.id,
        senderName: req.user.email,
      });
    }

    const payload = {
      controlKey,
      enabled,
      reason,
      actor: req.user.email,
      createdAt: new Date().toISOString(),
    };

    broadcast('platform:control', payload);

    res.json({
      status: 'success',
      data: {
        controls: await getPlatformControls({ forceRefresh: true }),
      },
    });
  } catch (error) {
    logger.error(`Emergency control update error: ${error.message}`);
    res.status(500).json({ status: 'error', message: 'Failed to update emergency control' });
  }
};

export const requestEmergencyShutdown = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'Only admins can request an emergency shutdown' });
    }

    const reason = String(req.body.reason ?? '').trim();
    if (!reason) {
      return res.status(400).json({ status: 'error', message: 'Shutdown reason is required' });
    }

    const shutdownRequest = {
      active: true,
      reason,
      requestedAt: new Date().toISOString(),
      requestedBy: req.user.email,
    };

    await setAppSetting('shutdownRequest', shutdownRequest, req.user.id);
    await insertEmergencyAction({
      controlKey: 'shutdownRequest',
      action: 'requested',
      enabled: true,
      reason,
      createdBy: req.user.id,
    });

    await logAudit(req.user.id, 'emergency.shutdown_request', {
      target_type: 'system',
      target_id: 'shutdown-request',
      target_name: 'Emergency shutdown request',
      reason,
      category: 'system',
    });

    broadcast('platform:shutdown_request', shutdownRequest);

    broadcast('platform:shutdown_imminent', {
      reason,
      requestedBy: req.user.email,
      shutdownIn: '10 seconds',
    });

    res.json({
      status: 'success',
      data: {
        shutdownRequest,
      },
      message: 'Emergency shutdown initiated. Server will terminate in 10 seconds.',
    });

    logger.error(`EMERGENCY SHUTDOWN: ${reason} (by ${req.user.email}). Server shutting down in 10s...`);

    setTimeout(() => {
      process.exit(1);
    }, 10000);
  } catch (error) {
    logger.error(`Emergency shutdown request error: ${error.message}`);
    res.status(500).json({ status: 'error', message: 'Failed to request shutdown' });
  }
};
