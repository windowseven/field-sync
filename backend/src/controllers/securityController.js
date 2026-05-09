import crypto from 'crypto';
import pool from '../config/database.js';
import logger from '../utils/logger.js';
import { getApiMonitorSnapshot } from '../utils/requestMetrics.js';
import { getRateLimitSnapshot } from '../utils/rateLimitMetrics.js';
import { getConnectedClientsSnapshot } from '../sockets/wsServer.js';
import { getSecurityPolicies } from '../utils/securityPolicyStore.js';

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function buildHourlySeries(hours = 24) {
  const current = new Date();
  current.setMinutes(0, 0, 0);

  const series = [];
  for (let i = hours - 1; i >= 0; i -= 1) {
    const bucketDate = new Date(current);
    bucketDate.setHours(current.getHours() - i);
    series.push({
      key: bucketDate.toISOString().slice(0, 13),
      time: bucketDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      threats: 0,
      blocked: 0,
    });
  }

  return series;
}

function mergeCounts(series, rows, field) {
  const seriesMap = new Map(series.map((item) => [item.key, item]));
  for (const row of rows) {
    const bucket = seriesMap.get(row.bucket);
    if (bucket) {
      bucket[field] = Number(row.count || 0);
    }
  }
}

function inferCountryFromIp(ip) {
  if (!ip) return 'Unknown';
  if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.16.')) {
    return 'Local/Internal';
  }
  return 'Unknown';
}

function classifyThreatSeverity({ attempts = 0, status = 0, action = '' }) {
  if (status >= 500 || attempts >= 50 || action.includes('security')) return 'critical';
  if (status === 429 || status === 401 || attempts >= 10) return 'warning';
  return 'info';
}

function mapSeverityToStatus(severity, timestamp) {
  const ageMs = Date.now() - new Date(timestamp).getTime();
  if (severity === 'critical' && ageMs <= 24 * 60 * 60 * 1000) return 'active';
  if (severity === 'warning' && ageMs <= 24 * 60 * 60 * 1000) return 'active';
  if (ageMs <= 2 * 24 * 60 * 60 * 1000) return 'blocked';
  return 'resolved';
}

function parseUserAgent(userAgent = '') {
  const source = userAgent || 'Unknown';
  const lower = source.toLowerCase();

  let os = 'Unknown';
  if (lower.includes('android')) os = 'Android';
  else if (lower.includes('iphone') || lower.includes('ios')) os = 'iOS';
  else if (lower.includes('windows')) os = 'Windows';
  else if (lower.includes('mac os') || lower.includes('macintosh')) os = 'macOS';
  else if (lower.includes('linux')) os = 'Linux';

  let device = 'Unknown Device';
  if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone')) {
    device = os === 'iOS' ? 'iPhone' : 'Mobile Device';
  } else if (lower.includes('macintosh')) {
    device = 'Mac';
  } else if (lower.includes('windows')) {
    device = 'Windows PC';
  } else if (lower.includes('linux')) {
    device = 'Linux Device';
  }

  return { device, os };
}

function formatThreatTarget({ endpoint, targetName, action, ip }) {
  return endpoint || targetName || action || ip || 'Unknown target';
}

function createThreatFromRateLimit(blockEvent) {
  const attempts = 1;
  const type = blockEvent.name === 'auth'
    ? 'Login Rate Limit Triggered'
    : blockEvent.name === 'otp'
      ? 'OTP Abuse Detected'
      : 'API Abuse / Scraping';
  const severity = classifyThreatSeverity({ attempts: 10, status: 429 });

  return {
    id: crypto.randomUUID(),
    type,
    ip: blockEvent.ip,
    country: inferCountryFromIp(blockEvent.ip),
    target: blockEvent.path,
    attempts,
    severity,
    status: mapSeverityToStatus(severity, blockEvent.timestamp),
    firstSeen: new Date(blockEvent.timestamp).toISOString(),
    lastSeen: new Date(blockEvent.timestamp).toISOString(),
    source: 'rate_limit',
  };
}

function createThreatFromApiError(entry) {
  const attempts = 1;
  const severity = classifyThreatSeverity({ attempts, status: entry.status });
  return {
    id: crypto.randomUUID(),
    type: entry.status === 401 ? 'Authentication Failure Burst' : entry.status === 429 ? 'Rate Limit Exceeded' : 'API Error Spike',
    ip: entry.ip,
    country: inferCountryFromIp(entry.ip),
    target: `${entry.method} ${entry.endpoint}`,
    attempts,
    severity,
    status: mapSeverityToStatus(severity, entry.time),
    firstSeen: entry.time,
    lastSeen: entry.time,
    source: 'api',
  };
}

function createThreatFromAudit(entry) {
  const detail = typeof entry.detail === 'string' ? entry.detail : '';
  const severity = classifyThreatSeverity({ attempts: detail.includes('failed') ? 10 : 2, action: entry.action });
  return {
    id: entry.id,
    type: entry.action.replace(/[._]/g, ' '),
    ip: entry.ip_address || 'unknown',
    country: inferCountryFromIp(entry.ip_address),
    target: formatThreatTarget({
      targetName: entry.target_name,
      action: entry.action,
      ip: entry.ip_address,
    }),
    attempts: detail.includes('failed') ? 10 : 1,
    severity,
    status: mapSeverityToStatus(severity, entry.timestamp),
    firstSeen: new Date(entry.timestamp).toISOString(),
    lastSeen: new Date(entry.timestamp).toISOString(),
    source: 'audit',
  };
}

async function getSecurityThreatData() {
  const apiSnapshot = getApiMonitorSnapshot(24);
  const rateLimitSnapshot = getRateLimitSnapshot();

  const [auditRows] = await pool.query(`
    SELECT id, action, detail, ip_address, target_name, timestamp
    FROM audit_logs
    WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      AND (category = 'security' OR category = 'auth' OR action LIKE 'auth.%')
    ORDER BY timestamp DESC
    LIMIT 200
  `);

  const activeThreats = [
    ...rateLimitSnapshot.recentBlocks.map(createThreatFromRateLimit),
    ...apiSnapshot.recentErrors
      .filter((entry) => [401, 403, 429, 500, 503].includes(entry.status))
      .map(createThreatFromApiError),
    ...auditRows.map(createThreatFromAudit),
  ]
    .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime());

  const threatBuckets = buildHourlySeries(24);
  const [auditThreatRows] = await pool.query(`
    SELECT DATE_FORMAT(timestamp, '%Y-%m-%dT%H') AS bucket, COUNT(*) AS count
    FROM audit_logs
    WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      AND (category = 'security' OR category = 'auth' OR action LIKE 'auth.%')
    GROUP BY bucket
    ORDER BY bucket ASC
  `);
  mergeCounts(threatBuckets, auditThreatRows, 'threats');
  mergeCounts(
    threatBuckets,
    (rateLimitSnapshot.blockedByHour || []).map((item) => ({ bucket: item.bucket, count: item.count })),
    'blocked'
  );

  return {
    overviewSeries: threatBuckets.map(({ key, ...rest }) => rest),
    activeThreats: activeThreats.filter((threat) => threat.status === 'active').slice(0, 20),
    resolvedThreats: activeThreats.filter((threat) => threat.status !== 'active').slice(0, 20),
    blockedIps: rateLimitSnapshot.blockedIps,
    blocked24h: rateLimitSnapshot.totalBlocked24h,
  };
}

async function getSecuritySessions(threats) {
  const [rows] = await pool.query(`
    SELECT
      u.id,
      u.name,
      u.email,
      u.role,
      u.status,
      u.last_seen,
      ul.updated_at AS location_updated_at,
      login.ip_address AS login_ip,
      login.user_agent AS login_user_agent,
      login.timestamp AS login_at
    FROM users u
    LEFT JOIN user_locations ul ON ul.user_id = u.id
    LEFT JOIN (
      SELECT id, user_id, ip_address, user_agent, timestamp,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY timestamp DESC, id DESC) AS rn
      FROM audit_logs
      WHERE action = 'user.login'
    ) login ON login.user_id = u.id AND login.rn = 1
    WHERE u.status IN ('online', 'idle')
       OR u.last_seen >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    ORDER BY FIELD(u.status, 'online', 'idle', 'offline'), u.last_seen DESC
    LIMIT 100
  `);

  const suspiciousIps = new Set(threats.activeThreats.map((threat) => threat.ip));

  return rows.map((row) => {
    const deviceInfo = parseUserAgent(row.login_user_agent);
    const baseStatus = row.status || 'offline';
    const sessionStatus = suspiciousIps.has(row.login_ip) ? 'suspicious' : baseStatus;

    return {
      id: row.id,
      userId: row.id,
      user: row.name,
      email: row.email,
      role: row.role,
      device: deviceInfo.device,
      os: deviceInfo.os,
      ip: row.login_ip || 'unknown',
      country: inferCountryFromIp(row.login_ip),
      startedAt: row.login_at ? new Date(row.login_at).toISOString() : null,
      lastActivityAt: row.last_seen ? new Date(row.last_seen).toISOString() : null,
      status: sessionStatus,
    };
  });
}

function getPolicySnapshot() {
  const policies = getSecurityPolicies();
  return {
    password: policies.password,
    session: policies.session,
    rateLimits: policies.rateLimits,
    other: policies.other,
    enforcedControls: [
      'Password minimum length',
      'Uppercase and numeric password rules',
      'Access token expiry',
      'Refresh token expiry',
      'Login rate limiting',
      'OTP rate limiting',
      'Global API rate limiting',
    ],
  };
}

export const getAdminSecuritySnapshot = async (req, res) => {
  try {
    const [threats, websocketSnapshot] = await Promise.all([
      getSecurityThreatData(),
      Promise.resolve(getConnectedClientsSnapshot()),
    ]);
    const sessions = await getSecuritySessions(threats);
    const policies = getPolicySnapshot();

    const activeSessions = sessions.filter((session) => session.status === 'online' || session.status === 'idle').length;
    const suspiciousSessions = sessions.filter((session) => session.status === 'suspicious').length;

    res.json({
      status: 'success',
      data: {
        generatedAt: new Date().toISOString(),
        overview: {
          metrics: {
            activeThreats: threats.activeThreats.length,
            blocked24h: threats.blocked24h,
            activeSessions,
            suspiciousIps: threats.blockedIps.length,
          },
          modules: [
            {
              title: 'Threat Detection',
              desc: 'Active threats, suspicious IPs, brute force',
              href: '/dashboard/security/threats',
              status: threats.activeThreats.length > 0 ? 'warning' : 'healthy',
              count: `${threats.activeThreats.length} active`,
            },
            {
              title: 'Session Manager',
              desc: 'Active sessions, device activity, and suspicious sign-ins',
              href: '/dashboard/security/sessions',
              status: suspiciousSessions > 0 ? 'warning' : 'healthy',
              count: `${sessions.length} sessions`,
            },
            {
              title: 'Access Policies',
              desc: 'Password rules, token expiry, rate limits',
              href: '/dashboard/security/policies',
              status: 'healthy',
              count: `${policies.enforcedControls.length} controls`,
            },
          ],
          threatSeries: threats.overviewSeries,
          recentThreats: threats.activeThreats.slice(0, 5),
          websocketClients: websocketSnapshot.total,
        },
        threats,
        sessions: {
          items: sessions,
          metrics: {
            total: sessions.length,
            active: sessions.filter((session) => session.status === 'online').length,
            idle: sessions.filter((session) => session.status === 'idle').length,
            suspicious: suspiciousSessions,
          },
        },
        policies,
      },
    });
  } catch (error) {
    logger.error(`Security snapshot error: ${error.message}`);
    res.status(500).json({ status: 'error', message: 'Failed to load security metrics' });
  }
};
