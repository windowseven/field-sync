import { http } from './httpClient';

export interface ApiZone {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  boundaries: string | object | null;
  created_at: string;
}

export const zoneService = {
  async getByProject(projectId: string): Promise<ApiZone[]> {
    const response = await http.get<any>(`/projects/${projectId}/zones`);
    return response?.data?.zones ?? response?.data?.data?.zones ?? [];
  },

  async create(projectId: string, data: Partial<ApiZone>): Promise<ApiZone> {
    const response = await http.post<any>(`/projects/${projectId}/zones`, data);
    return response?.data?.zone ?? response?.data?.data?.zone;
  },

  async update(id: string, data: Partial<ApiZone>): Promise<ApiZone> {
    const response = await http.patch<any>(`/zones/${id}`, data);
    return response?.data?.zone ?? response?.data?.data?.zone;
  },

  async delete(id: string): Promise<void> {
    await http.delete(`/zones/${id}`);
  },

  transformForFrontend(zone: ApiZone) {
    return {
      id: zone.id,
      name: zone.name,
      description: zone.description || 'No description provided',
      color: 'bg-chart-1',
      colorHex: '#22c55e',
      team: 'Unassigned', // Backend doesn't have team-zone mapping yet in schema?
      status: 'pending' as const,
      coverage: 0,
      area: 'N/A',
      members: 0,
      visible: true,
      overlap: false,
    };
  }
};
