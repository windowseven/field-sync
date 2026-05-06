import { http } from './httpClient';

export type MaintenanceStatus = 'healthy' | 'warning' | 'critical';

export interface MaintenanceMetric {
  label: string;
  value: string;
}

export interface MaintenanceSectionSummary {
  title: string;
  href: string;
  description: string;
  status: MaintenanceStatus;
  metrics: MaintenanceMetric[];
}

export interface MaintenanceSnapshot {
  generatedAt: string;
  overview: {
    sections: MaintenanceSectionSummary[];
    statusCounts: {
      healthy: number;
      warning: number;
      critical: number;
    };
    activitySeries: Array<{
      time: string;
      requests: number;
      errors: number;
      latency: number;
    }>;
    headline: {
      requests24h: number;
      activeUsers24h: number;
      onlineUsers: number;
      websocketClients: number;
    };
  };
  server: {
    status: MaintenanceStatus;
    uptimeSeconds: number;
    memory: {
      rss: number;
      heapUsed: number;
      heapTotal: number;
      systemUsedPercent: number;
    };
    cpuLoadPercent: number;
    cpuCores: number;
    hostname: string;
    nodeVersion: string;
    platform: string;
    websocket: {
      total: number;
      byRole: Record<string, number>;
    };
    requests: Array<{
      time: string;
      requests: number;
      errors: number;
      latency: number;
    }>;
    requestTotals: {
      total: number;
      avgLatencyMs: number;
      errorRate: number;
    };
  };
  database: {
    connected: boolean;
    activeConnections: number;
    runningConnections: number;
    maxConnections: number;
    uptimeSeconds: number;
    totalSizeBytes: number;
    totalRows: number;
    tableCount: number;
    tables: Array<{
      name: string;
      rowCount: number;
      totalBytes: number;
      indexes: number;
      status: MaintenanceStatus | 'healthy';
    }>;
    activity: Array<{
      time: string;
      submissions: number;
      audits: number;
    }>;
  };
  backup: {
    directory: string;
    exists: boolean;
    totalBackups: number;
    totalSizeBytes: number;
    latestBackupAt: string | null;
    recentBackups: Array<{
      name: string;
      path: string;
      sizeBytes: number;
      modifiedAt: string;
    }>;
    auditTrail: Array<{
      id: string;
      action: string;
      detail: string;
      timestamp: string;
      userName: string;
    }>;
  };
  errors: {
    exists: boolean;
    total24h: number;
    critical24h: number;
    categories: Array<{
      name: string;
      count: number;
    }>;
    trend: Array<{
      time: string;
      errors: number;
    }>;
    recent: Array<{
      timestamp: string;
      level: string;
      category: string;
      message: string;
    }>;
  };
  rateLimits: {
    rules: Array<{
      name: string;
      path: string;
      windowMs: number;
      max: number;
      description: string;
      blockedRequests24h: number;
    }>;
    totalBlocked24h: number;
    blockedIps: Array<{
      ip: string;
      count: number;
      lastSeen: number | null;
    }>;
    lastBlockedAt: number | null;
  };
  sync: {
    batches: Array<{
      id: string;
      timestamp: number;
      itemCount: number;
      successCount: number;
      failureCount: number;
      status: MaintenanceStatus | 'healthy';
    }>;
    totalBatches24h: number;
    totalItems24h: number;
    failedItems24h: number;
    failedItems: Array<{
      id: string;
      message: string;
      timestamp: number;
    }>;
    lastBatchAt: number | null;
    submissions: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
    };
  };
  storage: {
    breakdown: Array<{
      label: string;
      path: string;
      exists: boolean;
      fileCount: number;
      sizeBytes: number;
      largestFiles: Array<{
        path: string;
        size: number;
        modifiedAt: string | null;
      }>;
    }>;
    totalSizeBytes: number;
    largestFiles: Array<{
      path: string;
      size: number;
      modifiedAt: string | null;
    }>;
  };
  api: {
    series: Array<{
      time: string;
      requests: number;
      errors: number;
      latency: number;
    }>;
    totalRequests: number;
    totalErrors: number;
    errorRate: number;
    avgLatencyMs: number;
    p99LatencyMs: number;
    endpoints: Array<{
      endpoint: string;
      method: string;
      requests: number;
      avgLatency: number;
      p99: number;
      errorRate: number;
      status: MaintenanceStatus;
    }>;
    methodBreakdown: Array<{
      method: string;
      count: number;
    }>;
    recentErrors: Array<{
      time: string;
      method: string;
      endpoint: string;
      status: number;
      message: string;
      ip: string;
      durationMs: number;
    }>;
  };
  features: {
    total: number;
    enabled: number;
    flags: Array<{
      name: string;
      value: string;
      enabled: boolean;
      source: string;
    }>;
  };
  sandbox: {
    active: boolean;
    nodeEnv: string;
    databaseName: string;
    backendScripts: Record<string, string>;
    frontendScripts: Record<string, string>;
    backendTestFileCount: number;
    frontendTestFileCount: number;
    availableCommands: Array<{
      name: string;
      command: string | null;
      available: boolean;
    }>;
    sandboxUsers: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      status: string;
      createdAt: string;
    }>;
  };
}

interface MaintenanceResponse {
  data: MaintenanceSnapshot;
}

export const maintenanceService = {
  async getSnapshot(): Promise<MaintenanceSnapshot> {
    const response = await http.get<MaintenanceResponse>('/maintenance');
    return response.data;
  },
};
