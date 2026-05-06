import { http } from './httpClient';

export interface ApiTask {
  id: string;
  project_id: string;
  zone_id?: string;
  assigned_to?: string;
  form_id?: string;
  title: string;
  description?: string;
  location?: string;
  deadline?: string;
  mode: 'individual' | 'group';
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  assigned_by?: string;
  completed_at?: string;
  created_at: string;
}

export const taskService = {
  async getAll(): Promise<ApiTask[]> {
    const response = await http.get<any>('/tasks');
    return response?.data?.tasks ?? response?.data?.data?.tasks ?? [];
  },

  async getById(id: string): Promise<ApiTask | null> {
    const response = await http.get<any>(`/tasks/${id}`);
    return response?.data?.task ?? response?.data?.data?.task ?? null;
  },

  transformForFrontend(task: ApiTask) {
    return {
      id: task.id,
      projectId: task.project_id,
      zoneId: task.zone_id,
      assignedTo: task.assigned_to,
      formId: task.form_id,
      title: task.title,
      description: task.description ?? '',
      location: task.location ?? '',
      deadline: task.deadline ? new Date(task.deadline).toISOString() : '',
      mode: task.mode,
      status: task.status,
      priority: task.priority,
      assignedBy: task.assigned_by,
      completedAt: task.completed_at,
      createdAt: task.created_at,
    };
  },

  async create(data: {
    project_id: string;
    title: string;
    description?: string;
    assigned_to?: string;
    priority?: string;
    deadline?: string;
    mode?: string;
    status?: string;
  }): Promise<ApiTask> {
    const response = await http.post<any>('/tasks', data);
    return response?.data?.task ?? response?.data?.data?.task;
  },

  async update(id: string, data: {
    status?: string;
    assigned_to?: string;
    priority?: string;
    deadline?: string;
  }): Promise<ApiTask> {
    const response = await http.patch<any>(`/tasks/${id}`, data);
    return response?.data?.task ?? response?.data?.data?.task;
  },
};