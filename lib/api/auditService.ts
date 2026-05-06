import { http } from './httpClient';

export interface ApiAuditLog {
  id: number | string;
  user_id: string | null;
  user_name?: string | null;
  action: string;
  detail: string | null;
  timestamp: string;
  target_type?: string | null;
  target_id?: string | null;
  target_name?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  user_email?: string;
  user_role?: string;
}

export interface FrontendAuditLog {
  id: string;
  action: string;
  details: string;
  user: string;
  role: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
  category: 'user_management' | 'data_collection' | 'project_config' | 'security';
  ip: string;
  metadata: Record<string, unknown>;
}

interface AuditApiEnvelope {
  data?: {
    auditLogs?: ApiAuditLog[];
    data?: {
      auditLogs?: ApiAuditLog[];
    };
  };
}

export const auditService = {
  async getAll(limit: number = 200): Promise<ApiAuditLog[]> {
    const response = await http.get<AuditApiEnvelope>(`/audit-logs?limit=${limit}`);
    return response?.data?.auditLogs ?? response?.data?.data?.auditLogs ?? [];
  },

  parseMetadata(log: ApiAuditLog): Record<string, unknown> {
    try {
      const parsed = log.detail ? JSON.parse(log.detail) : {};
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return {};
    } catch {
      return log.detail ? { detail: log.detail } : {};
    }
  },

  formatDetail(log: ApiAuditLog): string {
    const metadata = this.parseMetadata(log);
    const target =
      log.target_name ||
      this.readString(metadata, 'target_name') ||
      this.readString(metadata, 'email') ||
      this.readString(metadata, 'name') ||
      this.readString(metadata, 'project_id') ||
      this.readString(metadata, 'team_id') ||
      this.readString(metadata, 'task_id') ||
      this.readString(metadata, 'form_id') ||
      this.readString(metadata, 'submission_id') ||
      this.readString(metadata, 'target_user_id');

    if (target) {
      return `${log.action} -> ${target}`;
    }

    return log.detail || 'No details available';
  },

  readString(metadata: Record<string, unknown>, key: string): string | null {
    const value = metadata[key];
    return typeof value === 'string' ? value : null;
  },

  transformForFrontend(log: ApiAuditLog): FrontendAuditLog {
    const metadata = this.parseMetadata(log);

    return {
      id: log.id.toString(),
      action: log.action.replace(/\./g, ' ').toUpperCase(),
      details: this.formatDetail(log),
      user: log.user_email || log.user_name || 'System',
      role: log.user_role || 'Automated',
      timestamp: log.timestamp,
      severity: this.inferSeverity(log.action),
      category: this.inferCategory(log.action),
      ip: log.ip_address || this.readString(metadata, 'ip') || this.readString(metadata, 'ip_address') || '—',
      metadata,
    };
  },

  inferSeverity(action: string): 'low' | 'medium' | 'high' {
    if (action.includes('delete') || action.includes('reject') || action.includes('status')) return 'high';
    if (action.includes('update') || action.includes('create')) return 'medium';
    return 'low';
  },

  inferCategory(action: string): FrontendAuditLog['category'] {
    if (action.includes('user') || action.includes('member')) return 'user_management';
    if (action.includes('submission')) return 'data_collection';
    if (action.includes('project') || action.includes('team') || action.includes('zone')) return 'project_config';
    return 'security';
  }
};
