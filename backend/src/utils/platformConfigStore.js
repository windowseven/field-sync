import crypto from 'crypto';
import pool from '../config/database.js';

export const DEFAULT_USER_PREFERENCES = {
  bio: '',
  preferredTheme: 'system',
  preferredLanguage: 'en',
  preferredTimezone: 'UTC',
  notificationEmail: true,
  notificationPush: true,
  notificationSms: false,
  notificationTeamUpdates: true,
  notificationFormSubmissions: true,
  notificationSystemAlerts: true,
  twoFactorEnabled: false,
};

export const DEFAULT_APP_SETTINGS = {
  autoSyncEnabled: true,
  offlineModeEnabled: true,
  locationUpdateIntervalSeconds: 30,
  gpsAccuracy: 'high',
  trackingDisabled: false,
  registrationBlocked: false,
  maintenanceMode: false,
  platformLocked: false,
  shutdownRequest: {
    active: false,
    reason: '',
    requestedAt: null,
    requestedBy: null,
  },
  apiKey: '',
  apiKeyLastRotatedAt: null,
};

const APP_SETTING_KEYS = {
  autoSyncEnabled: 'auto_sync_enabled',
  offlineModeEnabled: 'offline_mode_enabled',
  locationUpdateIntervalSeconds: 'location_update_interval_seconds',
  gpsAccuracy: 'gps_accuracy',
  trackingDisabled: 'tracking_disabled',
  registrationBlocked: 'registration_blocked',
  maintenanceMode: 'maintenance_mode',
  platformLocked: 'platform_locked',
  shutdownRequest: 'shutdown_request',
  apiKey: 'api_key',
  apiKeyLastRotatedAt: 'api_key_last_rotated_at',
};

const SETTING_KEY_TO_PROPERTY = Object.fromEntries(
  Object.entries(APP_SETTING_KEYS).map(([property, key]) => [key, property])
);

let settingsCache = null;
let settingsCacheExpiresAt = 0;

function parseJsonValue(value, fallback) {
  if (value == null) return fallback;

  if (typeof value === 'object') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function serializeSettingValue(value) {
  return JSON.stringify(value);
}

export async function ensureUserPreferences(userId) {
  await pool.query(
    `INSERT IGNORE INTO user_preferences (
      user_id,
      bio,
      preferred_theme,
      preferred_language,
      preferred_timezone,
      notification_email,
      notification_push,
      notification_sms,
      notification_team_updates,
      notification_form_submissions,
      notification_system_alerts,
      two_factor_enabled
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      DEFAULT_USER_PREFERENCES.bio,
      DEFAULT_USER_PREFERENCES.preferredTheme,
      DEFAULT_USER_PREFERENCES.preferredLanguage,
      DEFAULT_USER_PREFERENCES.preferredTimezone,
      DEFAULT_USER_PREFERENCES.notificationEmail,
      DEFAULT_USER_PREFERENCES.notificationPush,
      DEFAULT_USER_PREFERENCES.notificationSms,
      DEFAULT_USER_PREFERENCES.notificationTeamUpdates,
      DEFAULT_USER_PREFERENCES.notificationFormSubmissions,
      DEFAULT_USER_PREFERENCES.notificationSystemAlerts,
      DEFAULT_USER_PREFERENCES.twoFactorEnabled,
    ]
  );
}

export async function getUserPreferences(userId) {
  await ensureUserPreferences(userId);

  const [rows] = await pool.query(
    `SELECT
      bio,
      preferred_theme,
      preferred_language,
      preferred_timezone,
      notification_email,
      notification_push,
      notification_sms,
      notification_team_updates,
      notification_form_submissions,
      notification_system_alerts,
      two_factor_enabled
    FROM user_preferences
    WHERE user_id = ?
    LIMIT 1`,
    [userId]
  );

  const row = rows?.[0];
  if (!row) {
    return { ...DEFAULT_USER_PREFERENCES };
  }

  return {
    bio: row.bio ?? '',
    preferredTheme: row.preferred_theme ?? DEFAULT_USER_PREFERENCES.preferredTheme,
    preferredLanguage: row.preferred_language ?? DEFAULT_USER_PREFERENCES.preferredLanguage,
    preferredTimezone: row.preferred_timezone ?? DEFAULT_USER_PREFERENCES.preferredTimezone,
    notificationEmail: Boolean(row.notification_email),
    notificationPush: Boolean(row.notification_push),
    notificationSms: Boolean(row.notification_sms),
    notificationTeamUpdates: Boolean(row.notification_team_updates),
    notificationFormSubmissions: Boolean(row.notification_form_submissions),
    notificationSystemAlerts: Boolean(row.notification_system_alerts),
    twoFactorEnabled: Boolean(row.two_factor_enabled),
  };
}

export async function updateUserPreferences(userId, patch) {
  await ensureUserPreferences(userId);
  const current = await getUserPreferences(userId);
  const next = { ...current, ...patch };

  await pool.query(
    `UPDATE user_preferences
     SET
      bio = ?,
      preferred_theme = ?,
      preferred_language = ?,
      preferred_timezone = ?,
      notification_email = ?,
      notification_push = ?,
      notification_sms = ?,
      notification_team_updates = ?,
      notification_form_submissions = ?,
      notification_system_alerts = ?,
      two_factor_enabled = ?
     WHERE user_id = ?`,
    [
      next.bio,
      next.preferredTheme,
      next.preferredLanguage,
      next.preferredTimezone,
      next.notificationEmail,
      next.notificationPush,
      next.notificationSms,
      next.notificationTeamUpdates,
      next.notificationFormSubmissions,
      next.notificationSystemAlerts,
      next.twoFactorEnabled,
      userId,
    ]
  );

  return next;
}

export async function getAppSettings({ forceRefresh = false } = {}) {
  if (!forceRefresh && settingsCache && Date.now() < settingsCacheExpiresAt) {
    return { ...settingsCache };
  }

  const [rows] = await pool.query(
    'SELECT setting_key, setting_value FROM app_settings'
  );

  const next = { ...DEFAULT_APP_SETTINGS };

  for (const row of rows) {
    const property = SETTING_KEY_TO_PROPERTY[row.setting_key];
    if (!property) continue;
    next[property] = parseJsonValue(row.setting_value, DEFAULT_APP_SETTINGS[property]);
  }

  if (!next.apiKey) {
    next.apiKey = crypto.randomBytes(24).toString('hex');
    next.apiKeyLastRotatedAt = new Date().toISOString();
    await pool.query(
      `INSERT INTO app_settings (setting_key, setting_value)
       VALUES (?, ?), (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP`,
      [
        APP_SETTING_KEYS.apiKey,
        serializeSettingValue(next.apiKey),
        APP_SETTING_KEYS.apiKeyLastRotatedAt,
        serializeSettingValue(next.apiKeyLastRotatedAt),
      ]
    );
  }

  settingsCache = next;
  settingsCacheExpiresAt = Date.now() + 5000;

  return { ...next };
}

export async function getPlatformControls({ forceRefresh = false } = {}) {
  const settings = await getAppSettings({ forceRefresh });
  return {
    trackingDisabled: Boolean(settings.trackingDisabled),
    registrationBlocked: Boolean(settings.registrationBlocked),
    maintenanceMode: Boolean(settings.maintenanceMode),
    platformLocked: Boolean(settings.platformLocked),
    shutdownRequest: settings.shutdownRequest ?? DEFAULT_APP_SETTINGS.shutdownRequest,
  };
}

export async function setAppSetting(property, value, updatedBy = null) {
  const settingKey = APP_SETTING_KEYS[property];
  if (!settingKey) {
    throw new Error(`Unknown app setting: ${property}`);
  }

  await pool.query(
    `INSERT INTO app_settings (setting_key, setting_value, updated_by)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       setting_value = VALUES(setting_value),
       updated_by = VALUES(updated_by),
       updated_at = CURRENT_TIMESTAMP`,
    [settingKey, serializeSettingValue(value), updatedBy]
  );

  const current = await getAppSettings({ forceRefresh: true });
  const next = { ...current, [property]: value };
  settingsCache = next;
  settingsCacheExpiresAt = Date.now() + 5000;
  return next;
}

export function maskApiKey(value) {
  if (!value) return 'Not configured';
  if (value.length <= 8) return value;
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}
