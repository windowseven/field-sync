import { http } from './httpClient';

export interface ApiProject {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'draft' | 'archived';
  progress: number;
  location: string;
  target_submissions: number;
  total_submissions: number;
  start_date: string;
  deadline: string;
  created_at: string;
  teamCount?: number;
  memberCount?: number;
  zoneCount?: number;
}

export const projectService = {
  async getAll(): Promise<ApiProject[]> {
    const response = await http.get<any>('/projects');
    return response?.data?.projects ?? response?.data?.data?.projects ?? [];
  },

  async getById(id: string): Promise<ApiProject | null> {
    const response = await http.get<any>(`/projects/${id}`);
    return response?.data?.project ?? response?.data?.data?.project ?? null;
  },

  async getUsers(projectId: string): Promise<any[]> {
    const response = await http.get<any>(`/projects/${projectId}/users`);
    return response?.data?.users ?? response?.data?.data?.users ?? [];
  },

  async create(data: Partial<ApiProject>): Promise<ApiProject> {
    const response = await http.post<any>('/projects', data);
    return response?.data?.project ?? response?.data?.data?.project;
  },

  async update(id: string, data: Partial<ApiProject>): Promise<ApiProject> {
    const response = await http.patch<any>(`/projects/${id}`, data);
    return response?.data?.project ?? response?.data?.data?.project;
  },

  async updateStatus(id: string, status: ApiProject['status']): Promise<ApiProject> {
    const response = await http.patch<any>(`/projects/${id}/status`, { status });
    return response?.data?.project ?? response?.data?.data?.project;
  },

  async delete(id: string): Promise<void> {
    await http.delete(`/projects/${id}`);
  },

  transformForFrontend(project: ApiProject) {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      progress: project.progress,
      teamCount: project.teamCount ?? 0,
      memberCount: project.memberCount ?? 0,
      zoneCount: project.zoneCount ?? 0,
      formCount: 0,
      startDate: project.start_date ? new Date(project.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
      deadline: project.deadline ? new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
      lastOpened: 'Just now',
      lastActivity: 'Syncing...',
      createdAt: project.created_at ? new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
      location: project.location,
      totalSubmissions: project.total_submissions,
      targetSubmissions: project.target_submissions,
    };
  },
};

export const statusConfig = {
  active: { label: 'Active', className: 'bg-emerald-500/10 text-emerald-500', dot: 'bg-emerald-500 animate-pulse' },
  paused: { label: 'Paused', className: 'bg-amber-500/10 text-amber-500', dot: 'bg-amber-500' },
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' },
  archived: { label: 'Archived', className: 'bg-secondary text-secondary-foreground', dot: 'bg-secondary-foreground' },
};
