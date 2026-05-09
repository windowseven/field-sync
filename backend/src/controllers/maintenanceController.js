import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';
import logger from '../utils/logger.js';
import { getApiMonitorSnapshot, getRequestCount } from '../utils/requestMetrics.js';
import { getRateLimitSnapshot } from '../utils/rateLimitMetrics.js';
import { getSyncSnapshot } from '../utils/syncMetrics.js';
import { getConnectedClientsSnapshot } from '../sockets/wsServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../../..');
const BACKEND_ROOT = path.resolve(REPO_ROOT, 'backend');
const FRONTEND_ROOT = path.resolve(REPO_ROOT, 'frontend');
const BACKUP_ROOT = path.resolve(REPO_ROOT, 'backups');

const ANSI_REGEX = /\u001b\[[0-9;]*m/g;

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function formatStatus(level) {
  return level === 'critical' || level === 'warning' ? level : 'healthy';
}

function parseLogTimestamp(rawValue) {
  if (!rawValue) return null;
  const normalized = rawValue.trim().replace(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}):(\d+)$/, '$1T$2.$3');
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function classifyError(message = '') {
  const lower = message.toLowerCase();
  if (lower.includes('database') || lower.includes('query') || lower.includes('mysql')) return 'database';
  if (lower.includes('auth') || lower.includes('token') || lower.includes('login') || lower.includes('credential')) return 'auth';
  if (lower.includes('ws') || lower.includes('websocket')) return 'websocket';
  if (lower.includes('sync')) return 'sync';
  if (lower.includes('validation') || lower.includes('zod')) return 'validation';
  return 'runtime';
}

function parseBooleanFlag(value) {
  if (typeof value !== 'string') return false;
  return ['1', 'true', 'yes', 'on', 'enabled'].includes(value.toLowerCase());
}

async function safeStat(targetPath) {
  try {
    return await fs.stat(targetPath);
  } catch {
    return null;
  }
}

async function pathExists(targetPath) {
  return (await safeStat(targetPath)) !== null;
}

async function collectFiles(targetPath, options = {}) {
  const {
    maxFiles = 200,
    maxDepth = 4,
    depth = 0,
    files = [],
  } = options;

  const stat = await safeStat(targetPath);
  if (!stat) return files;

  if (stat.isFile()) {
    files.push({
      path: targetPath,
      size: stat.size,
      modifiedAt: stat.mtime.toISOString(),
    });
    return files;
  }

  if (!stat.isDirectory() || depth > maxDepth || files.length >= maxFiles) {
    return files;
  }

  const entries = await fs.readdir(targetPath, { withFileTypes: true });
  for (const entry of entries) {
    if (files.length >= maxFiles) break;
    const fullPath = path.join(targetPath, entry.name);
    await collectFiles(fullPath, { maxFiles, maxDepth, depth: depth + 1, files });
  }

  return files;
}

async function getDirectorySummary(label, targetPath) {
  const files = await collectFiles(targetPath);
  return {
    label,
    path: targetPath,
    exists: await pathExists(targetPath),
    fileCount: files.length,
    sizeBytes: files.reduce((sum, file) => sum + file.size, 0),
    largestFiles: files.sort((a, b) => b.size - a.size).slice(0, 5),
  };
}

async function getDatabaseSummary() {
  const [healthRows] = await pool.query('SELECT 1 AS ok');
  const connected = Boolean(healthRows?.[0]?.ok);

  const [threadRows] = await pool.query(`SHOW STATUS LIKE 'Threads_%'`);
  const [uptimeRows] = await pool.query(`SHOW STATUS LIKE 'Uptime'`);
  const [maxConnectionRows] = await pool.query(`SHOW VARIABLES LIKE 'max_connections'`);
  const [tableRows] = await pool.query(`
    SELECT
      t.table_name AS name,
      COALESCE(t.table_rows, 0) AS rowCount,
      COALESCE(t.data_length, 0) + COALESCE(t.index_length, 0) AS totalBytes,
      COALESCE(s.indexes, 0) AS indexes
    FROM information_schema.tables t
    LEFT JOIN (
      SELECT table_name, COUNT(DISTINCT index_name) AS indexes
      FROM information_schema.statistics
      WHERE table_schema = DATABASE()
      GROUP BY table_name
    ) s ON s.table_name = t.table_name
    WHERE t.table_schema = DATABASE()
    ORDER BY totalBytes DESC, rowCount DESC
  `);
  const [hourlySubmissions] = await pool.query(`
    SELECT DATE_FORMAT(submitted_at, '%Y-%m-%dT%H') AS bucket, COUNT(*) AS submissions
    FROM submissions
    WHERE submitted_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    GROUP BY bucket
    ORDER BY bucket ASC
  `);
  const [hourlyAudits] = await pool.query(`
    SELECT DATE_FORMAT(timestamp, '%Y-%m-%dT%H') AS bucket, COUNT(*) AS audits
    FROM audit_logs
    WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
    GROUP BY bucket
    ORDER BY bucket ASC
  `);

  const totalSizeBytes = tableRows.reduce((sum, table) => sum + Number(table.totalBytes || 0), 0);
  const totalRows = tableRows.reduce((sum, table) => sum + Number(table.rowCount || 0), 0);

  const metricsByName = Object.fromEntries([...threadRows, ...uptimeRows].map((row) => [row.Variable_name, Number(row.Value)]));

  const timeline = [];
  const bucketMap = new Map();
  const current = new Date();
  current.setMinutes(0, 0, 0);
  for (let i = 23; i >= 0; i -= 1) {
    const bucketDate = new Date(current);
    bucketDate.setHours(current.getHours() - i);
    const key = bucketDate.toISOString().slice(0, 13);
    const item = {
      time: bucketDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      submissions: 0,
      audits: 0,
    };
    timeline.push(item);
    bucketMap.set(key, item);
  }

  for (const row of hourlySubmissions) {
    const bucket = bucketMap.get(row.bucket);
    if (bucket) bucket.submissions = Number(row.submissions || 0);
  }
  for (const row of hourlyAudits) {
    const bucket = bucketMap.get(row.bucket);
    if (bucket) bucket.audits = Number(row.audits || 0);
  }

  return {
    connected,
    activeConnections: metricsByName.Threads_connected || 0,
    runningConnections: metricsByName.Threads_running || 0,
    maxConnections: Number(maxConnectionRows?.[0]?.Value || 0),
    uptimeSeconds: metricsByName.Uptime || 0,
    totalSizeBytes,
    totalRows,
    tableCount: tableRows.length,
    tables: tableRows.map((table) => ({
      name: table.name,
      rowCount: Number(table.rowCount || 0),
      totalBytes: Number(table.totalBytes || 0),
      indexes: Number(table.indexes || 0),
      status: Number(table.totalBytes || 0) > 500 * 1024 * 1024 ? 'warning' : 'healthy',
    })),
    activity: timeline,
  };
}

async function getAuditAndUsageSummary() {
  const [userRows] = await pool.query(`
    SELECT
      COUNT(*) AS totalUsers,
      SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) AS onlineUsers
    FROM users
  `);
  const [submissionRows] = await pool.query(`
    SELECT
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
      COUNT(*) AS total
    FROM submissions
  `);
  const [activeUserRows] = await pool.query(`
    SELECT COUNT(DISTINCT user_id) AS activeUsers24h
    FROM audit_logs
    WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR) AND user_id IS NOT NULL
  `);
  const [backupAuditRows] = await pool.query(`
    SELECT id, action, detail, timestamp, user_name
    FROM audit_logs
    WHERE action LIKE 'backup.%'
    ORDER BY timestamp DESC
    LIMIT 20
  `);
  const [sandboxUserRows] = await pool.query(`
    SELECT id, name, email, role, status, created_at
    FROM users
    WHERE email LIKE '%test%' OR email LIKE '%sandbox%'
    ORDER BY created_at DESC
    LIMIT 20
  `);

  return {
    users: {
      total: Number(userRows?.[0]?.totalUsers || 0),
      online: Number(userRows?.[0]?.onlineUsers || 0),
      active24h: Number(activeUserRows?.[0]?.activeUsers24h || 0),
    },
    submissions: {
      total: Number(submissionRows?.[0]?.total || 0),
      pending: Number(submissionRows?.[0]?.pending || 0),
      approved: Number(submissionRows?.[0]?.approved || 0),
      rejected: Number(submissionRows?.[0]?.rejected || 0),
    },
    backupAuditRows: backupAuditRows.map((row) => ({
      id: row.id,
      action: row.action,
      detail: row.detail,
      timestamp: row.timestamp,
      userName: row.user_name,
    })),
    sandboxUsers: sandboxUserRows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      status: row.status,
      createdAt: row.created_at,
    })),
  };
}

async function getErrorSummary() {
  const errorLogPath = path.resolve(BACKEND_ROOT, 'logs/error.log');
  const exists = await pathExists(errorLogPath);
  if (!exists) {
    return {
      exists: false,
      total24h: 0,
      critical24h: 0,
      categories: [],
      trend: [],
      recent: [],
    };
  }

  const raw = await fs.readFile(errorLogPath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const categoryCounts = new Map();
  const trendMap = new Map();
  const recent = [];

  for (const rawLine of lines) {
    const line = rawLine.replace(ANSI_REGEX, '');
    const match = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}:\d+)\s+(\w+):\s+(.*)$/);
    if (!match) continue;

    const [, timestampRaw, level, message] = match;
    const timestamp = parseLogTimestamp(timestampRaw);
    if (!timestamp || timestamp.getTime() < cutoff) continue;

    const category = classifyError(message);
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);

    const bucketKey = timestamp.toISOString().slice(0, 13);
    if (!trendMap.has(bucketKey)) {
      trendMap.set(bucketKey, {
        time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        errors: 0,
      });
    }
    trendMap.get(bucketKey).errors += 1;

    recent.push({
      timestamp: timestamp.toISOString(),
      level,
      category,
      message,
    });
  }

  const critical24h = recent.filter((item) => item.message.toLowerCase().includes('failed') || item.message.toLowerCase().includes('duplicate') || item.message.toLowerCase().includes('503')).length;

  return {
    exists: true,
    total24h: recent.length,
    critical24h,
    categories: Array.from(categoryCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    trend: Array.from(trendMap.values()).sort((a, b) => a.time.localeCompare(b.time)),
    recent: recent.slice(-20).reverse(),
  };
}

async function getBackupSummary(backupAuditRows) {
  const exists = await pathExists(BACKUP_ROOT);
  const files = exists ? await collectFiles(BACKUP_ROOT, { maxDepth: 6, maxFiles: 300 }) : [];
  const latestFile = files.sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))[0] || null;

  return {
    directory: BACKUP_ROOT,
    exists,
    totalBackups: files.length,
    totalSizeBytes: files.reduce((sum, file) => sum + file.size, 0),
    latestBackupAt: latestFile?.modifiedAt || backupAuditRows[0]?.timestamp || null,
    recentBackups: files
      .sort((a, b) => b.modifiedAt.localeCompare(a.modifiedAt))
      .slice(0, 12)
      .map((file) => ({
        name: path.basename(file.path),
        path: file.path,
        sizeBytes: file.size,
        modifiedAt: file.modifiedAt,
      })),
    auditTrail: backupAuditRows,
  };
}

async function getStorageSummary(databaseSummary) {
  const directories = await Promise.all([
    getDirectorySummary('Backend Logs', path.resolve(BACKEND_ROOT, 'logs')),
    getDirectorySummary('Frontend Build Cache', path.resolve(FRONTEND_ROOT, '.next')),
    getDirectorySummary('Public Assets', path.resolve(FRONTEND_ROOT, 'public')),
    getDirectorySummary('Backups', BACKUP_ROOT),
  ]);

  const databaseEntry = {
    label: 'MySQL Database',
    path: process.env.DB_NAME || 'fieldsync',
    exists: true,
    fileCount: databaseSummary.tableCount,
    sizeBytes: databaseSummary.totalSizeBytes,
    largestFiles: databaseSummary.tables.slice(0, 5).map((table) => ({
      path: table.name,
      size: table.totalBytes,
      modifiedAt: null,
    })),
  };

  const breakdown = [databaseEntry, ...directories];
  const largestFiles = [
    ...directories.flatMap((directory) => directory.largestFiles),
    ...databaseEntry.largestFiles,
  ]
    .sort((a, b) => b.size - a.size)
    .slice(0, 12);

  return {
    breakdown,
    totalSizeBytes: breakdown.reduce((sum, item) => sum + item.sizeBytes, 0),
    largestFiles,
  };
}

async function getSandboxSummary(sandboxUsers) {
  const backendPackage = JSON.parse(await fs.readFile(path.resolve(BACKEND_ROOT, 'package.json'), 'utf8'));
  const frontendPackage = JSON.parse(await fs.readFile(path.resolve(FRONTEND_ROOT, 'package.json'), 'utf8'));
  const backendTestFiles = await collectFiles(path.resolve(BACKEND_ROOT, 'tests'), { maxDepth: 6, maxFiles: 400 });
  const frontendTestFiles = [];

  return {
    active: process.env.NODE_ENV === 'development',
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseName: process.env.DB_NAME || 'fieldsync',
    backendScripts: backendPackage.scripts || {},
    frontendScripts: frontendPackage.scripts || {},
    backendTestFileCount: backendTestFiles.length,
    frontendTestFileCount: frontendTestFiles.length,
    availableCommands: [
      { name: 'backend:dev', command: backendPackage.scripts?.dev || null, available: Boolean(backendPackage.scripts?.dev) },
      { name: 'backend:test', command: backendPackage.scripts?.test || null, available: Boolean(backendPackage.scripts?.test) },
      { name: 'backend:seed', command: backendPackage.scripts?.seed || null, available: Boolean(backendPackage.scripts?.seed) },
      { name: 'frontend:dev', command: frontendPackage.scripts?.dev || null, available: Boolean(frontendPackage.scripts?.dev) },
      { name: 'frontend:lint', command: frontendPackage.scripts?.lint || null, available: Boolean(frontendPackage.scripts?.lint) },
    ],
    sandboxUsers,
  };
}

function getFeatureSummary() {
  const flags = Object.entries(process.env)
    .filter(([name]) => name.startsWith('FEATURE_') || name.startsWith('NEXT_PUBLIC_FEATURE_'))
    .map(([name, value]) => ({
      name,
      value,
      enabled: parseBooleanFlag(value),
      source: 'env',
    }));

  return {
    total: flags.length,
    enabled: flags.filter((flag) => flag.enabled).length,
    flags,
  };
}

function buildSection(title, href, description, status, metrics) {
  return {
    title,
    href,
    description,
    status: formatStatus(status),
    metrics,
  };
}

function determineStorageStatus(storageSummary) {
  const logsEntry = storageSummary.breakdown.find((entry) => entry.label === 'Backend Logs');
  if ((logsEntry?.sizeBytes || 0) > 100 * 1024 * 1024) return 'warning';
  return 'healthy';
}

export const getMaintenanceSnapshot = async (req, res) => {
  try {
    const [databaseSummary, usageSummary, apiSummary, rateLimitSummary, syncSummary, errorSummary] = await Promise.all([
      getDatabaseSummary(),
      getAuditAndUsageSummary(),
      Promise.resolve(getApiMonitorSnapshot(24)),
      Promise.resolve(getRateLimitSnapshot()),
      Promise.resolve(getSyncSnapshot()),
      getErrorSummary(),
    ]);

    const [backupSummary, storageSummary, sandboxSummary] = await Promise.all([
      getBackupSummary(usageSummary.backupAuditRows),
      getStorageSummary(databaseSummary),
      getSandboxSummary(usageSummary.sandboxUsers),
    ]);

    const featureSummary = getFeatureSummary();
    const websocketSummary = getConnectedClientsSnapshot();
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const usedMemoryPercent = totalMemory > 0 ? round((memoryUsage.rss / totalMemory) * 100, 1) : 0;
    const cpuLoadPercent = os.cpus().length > 0 ? round((os.loadavg()[0] / os.cpus().length) * 100, 1) : 0;
    const serverStatus = !databaseSummary.connected ? 'critical' : usedMemoryPercent > 90 ? 'critical' : usedMemoryPercent > 75 ? 'warning' : 'healthy';
    const databaseStatus = databaseSummary.connected ? 'healthy' : 'critical';
    const backupStatus = backupSummary.totalBackups > 0 || backupSummary.auditTrail.length > 0 ? 'healthy' : 'warning';
    const errorStatus = errorSummary.critical24h > 5 ? 'critical' : errorSummary.total24h > 0 ? 'warning' : 'healthy';
    const rateLimitStatus = rateLimitSummary.totalBlocked24h > 50 ? 'warning' : 'healthy';
    const syncStatus = syncSummary.failedItems24h > 0 || usageSummary.submissions.pending > 0 ? 'warning' : 'healthy';
    const storageStatus = determineStorageStatus(storageSummary);
    const apiStatus = apiSummary.errorRate >= 5 ? 'critical' : apiSummary.errorRate >= 1 ? 'warning' : 'healthy';
    const featureStatus = featureSummary.total > 0 ? 'healthy' : 'warning';
    const sandboxStatus = sandboxSummary.active && sandboxSummary.backendTestFileCount > 0 ? 'healthy' : 'warning';

    const sections = [
      buildSection('Server Status', '/dashboard/maintenance/server', 'Runtime and websocket health', serverStatus, [
        { label: 'Uptime', value: `${Math.floor(process.uptime() / 60)} min` },
        { label: 'Memory', value: `${usedMemoryPercent}%` },
      ]),
      buildSection('Database', '/dashboard/maintenance/database', 'MySQL connectivity and table growth', databaseStatus, [
        { label: 'Connections', value: `${databaseSummary.activeConnections}/${databaseSummary.maxConnections}` },
        { label: 'Size', value: `${round(databaseSummary.totalSizeBytes / (1024 * 1024), 1)} MB` },
      ]),
      buildSection('Backup & Restore', '/dashboard/maintenance/backup', 'Filesystem backups and backup audit trail', backupStatus, [
        { label: 'Backups', value: String(backupSummary.totalBackups) },
        { label: 'Latest', value: backupSummary.latestBackupAt ? new Date(backupSummary.latestBackupAt).toLocaleString() : 'None' },
      ]),
      buildSection('Error Tracking', '/dashboard/maintenance/errors', 'Parsed backend error log entries', errorStatus, [
        { label: 'Errors (24h)', value: String(errorSummary.total24h) },
        { label: 'Critical', value: String(errorSummary.critical24h) },
      ]),
      buildSection('Rate Limiting', '/dashboard/maintenance/rate-limits', 'Active limiter rules and blocked clients', rateLimitStatus, [
        { label: 'Blocked (24h)', value: String(rateLimitSummary.totalBlocked24h) },
        { label: 'Rules', value: String(rateLimitSummary.rules.length) },
      ]),
      buildSection('Sync Monitor', '/dashboard/maintenance/sync', 'Batch sync outcomes and submission backlog', syncStatus, [
        { label: 'Pending', value: String(usageSummary.submissions.pending) },
        { label: 'Failed', value: String(syncSummary.failedItems24h) },
      ]),
      buildSection('Storage', '/dashboard/maintenance/storage', 'Database, logs, assets, and backup storage', storageStatus, [
        { label: 'Total', value: `${round(storageSummary.totalSizeBytes / (1024 * 1024), 1)} MB` },
        { label: 'Segments', value: String(storageSummary.breakdown.length) },
      ]),
      buildSection('API Monitor', '/dashboard/maintenance/api', 'Live request traffic, latency, and errors', apiStatus, [
        { label: 'Requests', value: String(apiSummary.totalRequests) },
        { label: 'Errors', value: `${apiSummary.errorRate}%` },
      ]),
      buildSection('Feature Flags', '/dashboard/maintenance/features', 'Environment-driven feature toggles', featureStatus, [
        { label: 'Configured', value: String(featureSummary.total) },
        { label: 'Enabled', value: String(featureSummary.enabled) },
      ]),
      buildSection('Test Environment', '/dashboard/maintenance/sandbox', 'Development/test environment diagnostics', sandboxStatus, [
        { label: 'Env', value: sandboxSummary.nodeEnv },
        { label: 'Tests', value: String(sandboxSummary.backendTestFileCount + sandboxSummary.frontendTestFileCount) },
      ]),
    ];

    const statusCounts = sections.reduce((accumulator, section) => {
      accumulator[section.status] += 1;
      return accumulator;
    }, { healthy: 0, warning: 0, critical: 0 });

    res.json({
      status: 'success',
      data: {
        generatedAt: new Date().toISOString(),
        overview: {
          sections,
          statusCounts,
          activitySeries: apiSummary.series,
          headline: {
            requests24h: getRequestCount(24),
            activeUsers24h: usageSummary.users.active24h,
            onlineUsers: usageSummary.users.online,
            websocketClients: websocketSummary.total,
          },
        },
        server: {
          status: serverStatus,
          uptimeSeconds: Math.floor(process.uptime()),
          memory: {
            rss: memoryUsage.rss,
            heapUsed: memoryUsage.heapUsed,
            heapTotal: memoryUsage.heapTotal,
            systemUsedPercent: usedMemoryPercent,
          },
          cpuLoadPercent,
          cpuCores: os.cpus().length,
          hostname: os.hostname(),
          nodeVersion: process.version,
          platform: process.platform,
          websocket: websocketSummary,
          requests: apiSummary.series,
          requestTotals: {
            total: apiSummary.totalRequests,
            avgLatencyMs: apiSummary.avgLatencyMs,
            errorRate: apiSummary.errorRate,
          },
        },
        database: databaseSummary,
        backup: backupSummary,
        errors: errorSummary,
        rateLimits: rateLimitSummary,
        sync: {
          ...syncSummary,
          submissions: usageSummary.submissions,
        },
        storage: storageSummary,
        api: apiSummary,
        features: featureSummary,
        sandbox: sandboxSummary,
      },
    });
  } catch (error) {
    logger.error(`Maintenance snapshot error: ${error.message}`);
    res.status(500).json({ status: 'error', message: 'Failed to load maintenance metrics' });
  }
};

function classifyAlertLevel(action = '', detail = {}) {
  if (action === 'auth.login.failed') return 'critical';
  if (action === 'user.register') return 'info';
  if (action === 'project.create' || action === 'project.update') return 'info';
  if (action === 'user.update' || action === 'user.delete') return 'warning';
  if (detail?.status === 429 || detail?.status === 503) return 'critical';
  if (detail?.status === 401 || detail?.status === 403) return 'warning';
  return 'info';
}

function alertIcon(level) {
  const icons = { critical: 'AlertCircle', warning: 'Clock', success: 'CheckCircle2', info: 'Info' };
  return icons[level] || 'Info';
}

const ALERT_ACTIONS = ['auth.login.failed', 'user.register', 'user.update', 'user.delete', 'project.create'];

export const getAlerts = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, action, detail, ip_address, user_id, target_name, timestamp
      FROM audit_logs
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND (${ALERT_ACTIONS.map(() => 'action = ?').join(' OR ')})
      ORDER BY timestamp DESC
      LIMIT 50
    `, ALERT_ACTIONS);

    const rateLimitSnapshot = (await import('../utils/rateLimitMetrics.js')).getRateLimitSnapshot();
    const rateLimitAlerts = (rateLimitSnapshot.recentBlocks || []).slice(0, 10).map((b, i) => ({
      id: `rl-${i}`,
      type: 'critical',
      title: 'Rate Limit Triggered',
      description: `IP ${b.ip || 'unknown'} hit rate limit on ${b.name || 'unknown'} endpoint`,
      timestamp: new Date(b.timestamp || Date.now()),
      icon: alertIcon('critical'),
      read: false,
    }));

    const dbAlerts = rows.map((row) => {
      let detail = {};
      try { detail = typeof row.detail === 'string' ? JSON.parse(row.detail) : (row.detail || {}); } catch {}
      const level = classifyAlertLevel(row.action, detail);
      const titles = {
        'auth.login.failed': 'Failed Login Attempt',
        'user.register': 'New User Registered',
        'user.update': 'User Profile Updated',
        'user.delete': 'User Account Removed',
        'project.create': 'New Project Created',
      };
      return {
        id: `db-${row.id}`,
        type: level,
        title: titles[row.action] || row.action,
        description: row.target_name
          ? `${titles[row.action] || 'Event'} — ${row.target_name}`
          : titles[row.action] || 'System event recorded',
        timestamp: new Date(row.timestamp),
        icon: alertIcon(level),
        read: false,
      };
    });

    const all = [...rateLimitAlerts, ...dbAlerts]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 50);

    res.json({ status: 'success', data: all });
  } catch (error) {
    logger.error(`Get alerts error: ${error.message}`);
    res.status(500).json({ status: 'error', message: 'Failed to load alerts' });
  }
};
