import { http } from './httpClient';

export interface BroadcastMessage {
  id: string;
  title: string;
  message: string;
  type: 'announcement' | 'maintenance' | 'alert';
  audience: 'all' | 'supervisors' | 'workers' | 'admins' | 'team_leaders';
  audienceLabel: string;
  sentAt: string;
  senderName: string;
  deliveredCount: number;
  readCount: number;
}

export interface BroadcastPayload {
  title: string;
  message: string;
  audience: string;
  type: string;
}

export interface BroadcastSnapshot {
  audienceCounts: {
    all: number;
    supervisors: number;
    workers: number;
  };
  broadcasts: BroadcastMessage[];
}

export const broadcastService = {
  async getSnapshot(): Promise<BroadcastSnapshot> {
    const response = await http.get<any>('/broadcasts');
    return response?.data?.data ?? response?.data ?? { audienceCounts: { all: 0, supervisors: 0, workers: 0 }, broadcasts: [] };
  },

  async send(data: BroadcastPayload): Promise<{ broadcast: BroadcastMessage }> {
    const response = await http.post<any>('/broadcasts', data);
    return response?.data?.data ?? response?.data;
  },
};
