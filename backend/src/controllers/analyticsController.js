import pool from '../config/database.js';
import logger from '../utils/logger.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';

const ADMIN_RANGE_CONFIG = {
  day: { periods: 24, intervalSql: 'INTERVAL 24 HOUR', bucketKind: 'hour' },
  week: { periods: 7, intervalSql: 'INTERVAL 7 DAY', bucketKind: 'day' },
  month: { periods: 30, intervalSql: 'INTERVAL 30 DAY', bucketKind: 'day' },
  year: { periods: 12, intervalSql: 'INTERVAL 12 MONTH', bucketKind: 'month' },
};

function normalizeRange(range) {
  return Object.hasOwn(ADMIN_RANGE_CONFIG, range) ? range : 'week';
}

function getBucketExpression(column, bucketKind) {
  if (bucketKind === 'hour') return `DATE_FORMAT(${column}, '%Y-%m-%dT%H')`;
  if (bucketKind === 'month') return `DATE_FORMAT(${column}, '%Y-%m')`;
  return `DATE_FORMAT(${column}, '%Y-%m-%d')`;
}

function buildSeries(range, now = new Date()) {
  const { periods, bucketKind } = ADMIN_RANGE_CONFIG[range];
  const current = new Date(now);

  if (bucketKind === 'hour') {
    current.setMinutes(0, 0, 0);
  } else if (bucketKind === 'month') {
    current.setDate(1);
    current.setHours(0, 0, 0, 0);
  } else {
    current.setHours(0, 0, 0, 0);
  }

  const series = [];

  for (let i = periods - 1; i >= 0; i -= 1) {
    const bucketDate = new Date(current);

    if (bucketKind === 'hour') {
      bucketDate.setHours(current.getHours() - i);
    } else if (bucketKind === 'month') {
      bucketDate.setMonth(current.getMonth() - i);
    } else {
      bucketDate.setDate(current.getDate() - i);
    }

    let key;
    let label;

    if (bucketKind === 'hour') {
      key = bucketDate.toISOString().slice(0, 13);
      label = bucketDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (bucketKind === 'month') {
      key = `${bucketDate.getFullYear()}-${String(bucketDate.getMonth() + 1).padStart(2, '0')}`;
      label = bucketDate.toLocaleDateString([], { month: 'short' });
    } else {
      key = bucketDate.toISOString().slice(0, 10);
      label = bucketDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }

    series.push({
      key,
      label,
      active: 0,
      completed: 0,
      pending: 0,
    });
  }

  return series;
}

function mergeSeriesCounts(series, rows, fieldName) {
  const bucketMap = new Map(series.map((item) => [item.key, item]));
  for (const row of rows) {
    const bucket = bucketMap.get(row.bucket);
    if (bucket) {
      bucket[fieldName] = Number(row.count) || 0;
    }
  }
}

export const getAdminAnalytics = asyncHandler(async (req, res) => {
    const range = normalizeRange(req.query.range);
    const { intervalSql, bucketKind } = ADMIN_RANGE_CONFIG[range];

    const auditBucketExpr = getBucketExpression('timestamp', bucketKind);
    const submissionBucketExpr = getBucketExpression('submitted_at', bucketKind);

    const [activeUserRows] = await pool.query(`
      SELECT
        ${auditBucketExpr} as bucket,
        COUNT(DISTINCT user_id) as count
      FROM audit_logs
      WHERE
        timestamp >= DATE_SUB(NOW(), ${intervalSql})
        AND user_id IS NOT NULL
      GROUP BY bucket
      ORDER BY bucket ASC
    `);

    const [submissionRows] = await pool.query(`
      SELECT
        ${submissionBucketExpr} as bucket,
        status,
        COUNT(*) as count
      FROM submissions
      WHERE submitted_at >= DATE_SUB(NOW(), ${intervalSql})
      GROUP BY bucket, status
      ORDER BY bucket ASC
    `);

    const [taskSummaryRows] = await pool.query(`
      SELECT
        COUNT(*) as totalTasks,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completedTasks
      FROM tasks
    `);

    const [activeUsersRows] = await pool.query(`
      SELECT COUNT(*) as activeUsers
      FROM users
      WHERE status = 'online'
    `);

    const [coverageRows] = await pool.query(`
      SELECT AVG(
        CASE
          WHEN target_submissions > 0 THEN LEAST((total_submissions / target_submissions) * 100, 100)
          ELSE 0
        END
      ) as coverageRate
      FROM projects
    `);

    const [responseRows] = await pool.query(`
      SELECT AVG(TIMESTAMPDIFF(MINUTE, created_at, completed_at)) as avgResponseMinutes
      FROM tasks
      WHERE completed_at IS NOT NULL
    `);

    const [projectPerformanceRows] = await pool.query(`
      SELECT
        name,
        progress as completion,
        CASE
          WHEN target_submissions > 0 THEN ROUND(LEAST((total_submissions / target_submissions) * 100, 100))
          ELSE 0
        END as coverage
      FROM projects
      ORDER BY created_at DESC
      LIMIT 6
    `);

    const [taskDistributionRows] = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM tasks
      GROUP BY status
    `);

    const [teamPerformanceRows] = await pool.query(`
      SELECT
        t.name as team,
        COUNT(DISTINCT tm.user_id) as members,
        COUNT(DISTINCT CASE WHEN u.status = 'online' THEN tm.user_id END) as activeMembers,
        COUNT(DISTINCT ta.id) as totalTasks,
        COUNT(DISTINCT CASE WHEN ta.status = 'completed' THEN ta.id END) as completedTasks
      FROM teams t
      LEFT JOIN team_members tm ON tm.team_id = t.id
      LEFT JOIN users u ON u.id = tm.user_id
      LEFT JOIN tasks ta ON ta.assigned_to = tm.user_id AND ta.project_id = t.project_id
      GROUP BY t.id, t.name
      ORDER BY activeMembers DESC, members DESC, t.created_at DESC
      LIMIT 8
    `);

    const activitySeries = buildSeries(range);
    mergeSeriesCounts(activitySeries, activeUserRows, 'active');

    const completedRows = submissionRows.filter((row) => row.status === 'approved');
    const pendingRows = submissionRows.filter((row) => row.status === 'pending');
    mergeSeriesCounts(activitySeries, completedRows, 'completed');
    mergeSeriesCounts(activitySeries, pendingRows, 'pending');

    const taskSummary = taskSummaryRows[0] ?? {};
    const totalTasks = Number(taskSummary.totalTasks) || 0;
    const completedTasks = Number(taskSummary.completedTasks) || 0;
    const taskCompletionRate =
      totalTasks > 0 ? Number(((completedTasks / totalTasks) * 100).toFixed(1)) : 0;

    const activeUsers = Number(activeUsersRows[0]?.activeUsers) || 0;
    const coverageRate = Number((Number(coverageRows[0]?.coverageRate) || 0).toFixed(1));
    const avgResponseMinutes = Math.round(Number(responseRows[0]?.avgResponseMinutes) || 0);

    const taskDistribution = taskDistributionRows.map((row) => ({
      name: String(row.status),
      value: Number(row.count) || 0,
    }));

    const teamPerformance = teamPerformanceRows.map((row) => {
      const teamTotalTasks = Number(row.totalTasks) || 0;
      const teamCompletedTasks = Number(row.completedTasks) || 0;
      return {
        team: row.team,
        avg: teamTotalTasks > 0 ? Math.round((teamCompletedTasks / teamTotalTasks) * 100) : 0,
        active: Number(row.activeMembers) || 0,
        members: Number(row.members) || 0,
      };
    });

    res.json({
      status: 'success',
      data: {
        range,
        overview: {
          taskCompletionRate,
          completedTasks,
          totalTasks,
          activeUsers,
          coverageRate,
          avgResponseMinutes,
        },
        activitySeries: activitySeries.map(({ key, label, ...rest }) => ({
          date: label,
          ...rest,
        })),
        projectPerformance: projectPerformanceRows.map((row) => ({
          zone: row.name,
          completion: Number(row.completion) || 0,
          coverage: Number(row.coverage) || 0,
        })),
        taskDistribution,
        teamPerformance,
      }
    });
};

export const getProjectAnalytics = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const [projects] = await pool.query('SELECT * FROM projects WHERE id = ?', [projectId]);
    const project = projects[0];
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    const [submissions] = await pool.query(`
      SELECT 
        DATE(submitted_at) as date,
        COUNT(*) as count,
        status
      FROM submissions 
      WHERE project_id = ?
      GROUP BY DATE(submitted_at), status
      ORDER BY date DESC
      LIMIT 100
    `, [projectId]);

    const [zonesPerformance] = await pool.query(`
      SELECT 
        z.name,
        COUNT(s.id) as submissions,
        AVG(CASE WHEN s.status = 'approved' THEN 1 ELSE 0 END) as approval_rate
      FROM zones z 
      LEFT JOIN submissions s ON s.zone_id = z.id
      WHERE z.project_id = ?
      GROUP BY z.id
      ORDER BY submissions DESC
    `, [projectId]);

    const [teamMetrics] = await pool.query(`
      SELECT 
        t.name,
        COUNT(tm.user_id) as team_size,
        COUNT(s.id) as team_submissions
      FROM teams t 
      LEFT JOIN team_members tm ON tm.team_id = t.id
      LEFT JOIN submissions s ON s.user_id = tm.user_id AND s.project_id = ?
      WHERE t.project_id = ?
      GROUP BY t.id
    `, [projectId, projectId]);

    res.json({
      status: 'success',
      data: {
        project,
        submissionsByDate: submissions,
        zonesPerformance,
        teamMetrics
      }
    });
};

export const getTeamLeaderStats = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const [teams] = await pool.query(`
      SELECT t.* FROM teams t 
      JOIN team_members tm ON tm.team_id = t.id 
      WHERE tm.user_id = ?
      LIMIT 1
    `, [userId]);
    const team = teams[0];

    if (!team) {
      throw new AppError('No team found', 404);
    }

    const [members] = await pool.query(`
      SELECT u.name, u.status, ul.lat, ul.lng, COUNT(s.id) as submissions 
      FROM team_members tm 
      JOIN users u ON u.id = tm.user_id 
      LEFT JOIN user_locations ul ON ul.user_id = u.id
      LEFT JOIN submissions s ON s.user_id = u.id AND s.project_id = ?
      WHERE tm.team_id = ?
      GROUP BY u.id
    `, [team.project_id, team.id]);

    const [tasksSummary] = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM tasks 
      WHERE project_id = ? AND assigned_by = ?
      GROUP BY status
    `, [team.project_id, userId]);

    const [formsSummary] = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM forms 
      WHERE project_id = ?
      GROUP BY status
    `, [team.project_id]);

    res.json({
      status: 'success',
      data: {
        team,
        teamMembers: members,
        tasksSummary,
        formsSummary
      }
    });
};

