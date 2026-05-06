import { http } from './httpClient';

export interface DashboardStats {
  systemHealth: {
    uptime: number;
    timestamp: string;
  };
  platformStats: {
    totalUsers: number;
    admins: number;
    supervisors: number;
    teamLeaders: number;
    fieldAgents: number;
    onlineUsers: number;
  };
  projectStats: {
    totalProjects: number;
    activeProjects: number;
    avgProgress: number;
  };
  activitySeries: Array<{
    time: string;
    users: number;
    submissions: number;
    api: number;
  }>;
  submissions: number;
  recentActivity: number;
}

interface DashboardStatsResponse {
  data: DashboardStats;
}

interface SystemHealthResponse {
  data: {
    database: string;
    poolActive: boolean;
    uptime: number;
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
      arrayBuffers?: number;
    };
    timestamp: string;
  };
}

export const dashboardService = {
  async getAdminStats(): Promise<DashboardStats> {
    const response = await http.get<DashboardStatsResponse>('/dashboard/stats');
    return response.data;
  },

  async getSystemHealth(): Promise<SystemHealthResponse['data']> {
    const response = await http.get<SystemHealthResponse>('/dashboard/health');
    return response.data;
  }
};
