import { http } from './httpClient';

export interface EmergencyControlState {
  trackingDisabled: boolean;
  registrationBlocked: boolean;
  maintenanceMode: boolean;
  platformLocked: boolean;
  shutdownRequest: {
    active: boolean;
    reason: string;
    requestedAt: string | null;
    requestedBy: string | null;
  };
}

export interface EmergencyAction {
  id: string;
  controlKey: string;
  action: string;
  enabled: boolean;
  reason: string;
  actor: string;
  createdAt: string;
}

export interface SystemStatus {
  uptimeSeconds: number;
  activeUsers: number;
  activeSessions: number;
  activeProjects: number;
  totalUsers: number;
  totalProjects: number;
}

export interface EmergencySnapshot {
  controls: EmergencyControlState;
  systemStatus: SystemStatus;
  recentActions: EmergencyAction[];
}

export const emergencyService = {
  async getSnapshot(): Promise<EmergencySnapshot> {
    const response = await http.get<any>('/emergency/snapshot');
    return response.data;
  },

  async updateControl(controlKey: string, enabled: boolean, reason?: string): Promise<EmergencyControlState> {
    const response = await http.post<any>('/emergency/control', {
      controlKey,
      enabled,
      reason: reason ?? '',
    });
    return response.data.controls;
  },

  async requestShutdown(reason: string): Promise<{ shutdownRequest: EmergencyControlState['shutdownRequest'] }> {
    const response = await http.post<any>('/emergency/shutdown', { reason });
    return response.data;
  },
};
