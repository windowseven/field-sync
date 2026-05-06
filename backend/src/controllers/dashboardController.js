import pool from '../config/database.js';
import logger from '../utils/logger.js';
import { getApiRequestSeries } from '../utils/requestMetrics.js';

function buildEmptyActivitySeries(hours = 24, now = new Date()) {
  const current = new Date(now);
  current.setMinutes(0, 0, 0);

  const series = [];
  for (let i = hours - 1; i >= 0; i -= 1) {
    const bucketDate = new Date(current);
    bucketDate.setHours(current.getHours() - i);
    series.push({
      key: bucketDate.toISOString().slice(0, 13),
      time: bucketDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      users: 0,
      submissions: 0,
      api: 0,
    });
  }

  return series;
}

function mergeHourlyRows(series, rows, fieldName) {
  const bucketMap = new Map(series.map((item) => [item.key, item]));
  for (const row of rows) {
    const bucket = bucketMap.get(row.bucket);
    if (bucket) {
      bucket[fieldName] = Number(row.count) || 0;
    }
  }
}

export const getAdminDashboardStats = async (req, res) => {
  try {
    const [userRows] = await pool.query(`
      SELECT 
        COUNT(*) as totalUsers,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN role = 'supervisor' THEN 1 ELSE 0 END) as supervisors,
        SUM(CASE WHEN role = 'team_leader' THEN 1 ELSE 0 END) as teamLeaders,
        SUM(CASE WHEN role = 'field_agent' THEN 1 ELSE 0 END) as fieldAgents,
        SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as onlineUsers
      FROM users
    `);
    const userStats = userRows[0];

    const [projectRows] = await pool.query(`
      SELECT 
        COUNT(*) as totalProjects,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as activeProjects,
        AVG(progress) as avgProgress
      FROM projects
    `);
    const projectStats = projectRows[0];

    const [submissionRows] = await pool.query('SELECT COUNT(*) as totalSubmissions FROM submissions');
    const totalSubmissions = submissionRows[0]?.totalSubmissions || 0;

    const [auditRows] = await pool.query('SELECT COUNT(*) as recentActivity FROM audit_logs WHERE timestamp > DATE_SUB(NOW(), INTERVAL 24 HOUR)');
    const recentActivityCount = auditRows[0]?.recentActivity || 0;

    const [activeUserRows] = await pool.query(`
      SELECT
        DATE_FORMAT(timestamp, '%Y-%m-%dT%H') as bucket,
        COUNT(DISTINCT user_id) as count
      FROM audit_logs
      WHERE
        timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        AND user_id IS NOT NULL
      GROUP BY bucket
      ORDER BY bucket ASC
    `);

    const [submissionTrendRows] = await pool.query(`
      SELECT
        DATE_FORMAT(submitted_at, '%Y-%m-%dT%H') as bucket,
        COUNT(*) as count
      FROM submissions
      WHERE submitted_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY bucket
      ORDER BY bucket ASC
    `);

    const activitySeries = buildEmptyActivitySeries();
    mergeHourlyRows(activitySeries, activeUserRows, 'users');
    mergeHourlyRows(activitySeries, submissionTrendRows, 'submissions');

    const apiSeries = getApiRequestSeries(24);
    for (const bucket of activitySeries) {
      const apiBucket = apiSeries.find((item) => item.key === bucket.key);
      bucket.api = apiBucket?.api ?? 0;
      delete bucket.key;
    }

    res.json({
      status: 'success',
      data: {
        systemHealth: { uptime: process.uptime(), timestamp: new Date().toISOString() },
        platformStats: {
          totalUsers: parseInt(userStats.totalUsers) || 0,
          admins: parseInt(userStats.admins) || 0,
          supervisors: parseInt(userStats.supervisors) || 0,
          teamLeaders: parseInt(userStats.teamLeaders) || 0,
          fieldAgents: parseInt(userStats.fieldAgents) || 0,
          onlineUsers: parseInt(userStats.onlineUsers) || 0
        },
        projectStats: {
          totalProjects: parseInt(projectStats.totalProjects) || 0,
          activeProjects: parseInt(projectStats.activeProjects) || 0,
          avgProgress: Math.round(projectStats.avgProgress || 0)
        },
        activitySeries,
        submissions: parseInt(totalSubmissions) || 0,
        recentActivity: parseInt(recentActivityCount) || 0
      }
    });
  } catch (error) {
    logger.error('Dashboard stats error:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch stats' });
  }
};

export const getSystemHealth = async (req, res) => {
  try {
    res.json({
      status: 'success',
      data: {
        database: 'Connected',
        poolActive: true,
        uptime: Math.floor(process.uptime() / 60),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('System health error:', error);
    res.status(500).json({ status: 'error', message: 'Health check failed' });
  }
};
