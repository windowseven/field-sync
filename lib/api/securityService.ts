import { http } from './httpClient';

export interface SecuritySnapshot {
  generatedAt: string;
  overview: {
    metrics: {
      activeThreats: number;
      blocked24h: number;
      activeSessions: number;
      suspiciousIps: number;
    };
    modules: Array<{
      title: string;
      desc: string;
      href: string;
      status: 'healthy' | 'warning' | 'critical';
      count: string;
    }>;
    threatSeries: Array<{
      time: string;
      threats: number;
      blocked: number;
    }>;
    recentThreats: ThreatItem[];
    websocketClients: number;
  };
  threats: {
    overviewSeries: Array<{
      time: string;
      threats: number;
      blocked: number;
    }>;
    activeThreats: ThreatItem[];
    resolvedThreats: ThreatItem[];
    blockedIps: Array<{
      ip: string;
      count: number;
      lastSeen: number | null;
    }>;
    blocked24h: number;
  };
  sessions: {
    items: SecuritySession[];
    metrics: {
      total: number;
      active: number;
      idle: number;
      suspicious: number;
    };
  };
  policies: {
    password: {
      minLength: number;
      requireUppercase: boolean;
      requireNumbers: boolean;
      requireSymbols: boolean;
      maxAgeDays: number;
      historyCount: number;
    };
    session: {
      accessTokenExpiryHours: number;
      refreshTokenExpiryDays: number;
      maxDevices: number;
      forceLogoutOnSuspicion: boolean;
      requireReauthOnSensitive: boolean;
    };
    rateLimits: {
      loginAttempts: number;
      otpAttempts: number;
      lockoutDurationMinutes: number;
      globalApiLimit: number;
      globalWindowMinutes: number;
    };
    other: {
      emailVerificationRequired: boolean;
      twoFactorEnabled: boolean;
      geoRestrictionEnabled: boolean;
      allowedCountries: string[];
    };
    enforcedControls: string[];
  };
}

export interface ThreatItem {
  id: string;
  type: string;
  ip: string;
  country: string;
  target: string;
  attempts: number;
  severity: 'critical' | 'warning' | 'info';
  status: 'active' | 'blocked' | 'resolved';
  firstSeen: string;
  lastSeen: string;
  source: string;
}

export interface SecuritySession {
  id: string;
  userId: string;
  user: string;
  email: string;
  role: string;
  device: string;
  os: string;
  ip: string;
  country: string;
  startedAt: string | null;
  lastActivityAt: string | null;
  status: 'online' | 'idle' | 'offline' | 'suspicious';
}

interface SecurityResponse {
  data: SecuritySnapshot;
}

export const securityService = {
  async getAdminSecuritySnapshot(): Promise<SecuritySnapshot> {
    const response = await http.get<SecurityResponse>('/security/admin');
    return response.data;
  },
};
