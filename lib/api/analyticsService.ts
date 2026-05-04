import { http } from './httpClient';

export type AdminAnalyticsRange = 'day' | 'week' | 'month' | 'year';

export interface AdminAnalytics {
  range: AdminAnalyticsRange;
  overview: {
    taskCompletionRate: number;
    completedTasks: number;
    totalTasks: number;
    activeUsers: number;
    coverageRate: number;
    avgResponseMinutes: number;
  };
  activitySeries: Array<{
    date: string;
    active: number;
    completed: number;
    pending: number;
  }>;
  projectPerformance: Array<{
    zone: string;
    completion: number;
    coverage: number;
  }>;
  taskDistribution: Array<{
    name: string;
    value: number;
  }>;
  teamPerformance: Array<{
    team: string;
    avg: number;
    active: number;
    members: number;
  }>;
}

export interface ProjectAnalytics {
  project: {
    id: string;
    name: string;
    target_submissions: number;
  };
  submissionsByDate: Array<{
    date: string;
    count: number;
    status: string;
  }>;
  teamMetrics: Array<{
    team: string;
    completion: number;
    team_size: number;
  }>;
  zonesPerformance: Array<{
    name: string;
    submissions: number;
  }>;
  overview: {
    totalSubmissions: number;
    approvedSubmissions: number;
    approvalRate: number;
    activeAgents: number;
  };
}

interface ProjectAnalyticsResponse {
  data: ProjectAnalytics;
}

interface AdminAnalyticsResponse {
  data: AdminAnalytics;
}

export const analyticsService = {
  async getAdminAnalytics(range: AdminAnalyticsRange): Promise<AdminAnalytics> {
    const response = await http.get<AdminAnalyticsResponse>(`/analytics/admin?range=${range}`);
    return response.data;
  },

  async getProjectAnalytics(projectId: string, range: string = 'week'): Promise<ProjectAnalytics> {
    const response = await http.get<ProjectAnalyticsResponse>(`/analytics/project/${projectId}?range=${range}`);
    return response.data;
  },

  transformSubmissionData(data: Array<{ date: string; count: number; status: string }>) {
    if (!Array.isArray(data)) return [];
    const aggregated = data.reduce((acc: Record<string, { total: number; approved: number }>, item) => {
      if (!acc[item.date]) {
        acc[item.date] = { total: 0, approved: 0 };
      }
      acc[item.date].total += item.count;
      if (item.status === 'approved') {
        acc[item.date].approved += item.count;
      }
      return acc;
    }, {});

    return Object.entries(aggregated).map(([date, vals]) => ({
      name: date,
      total: vals.total,
      approved: vals.approved
    })).sort((a, b) => a.name.localeCompare(b.name));
  },

  transformTeamData(data: Array<{ team: string; completion: number; team_size: number }>) {
    if (!Array.isArray(data)) return [];
    return data.map(item => ({
      name: item.team,
      submissions: item.completion,
      coverage: item.team_size > 0 ? Math.round((item.completion / item.team_size) * 100) : 0,
      size: item.team_size
    }));
  },
};
