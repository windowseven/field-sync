import { http } from './httpClient';

export interface ApiForm {
  id: string;
  project_id?: string;
  title: string;
  description?: string;
  form_schema: string | object;
  status: 'draft' | 'published';
  assigned_by?: string;
  created_at: string;
}

export const formService = {
  async getAll(): Promise<ApiForm[]> {
    const response = await http.get<any>('/forms');
    return response?.data?.forms ?? response?.data?.data?.forms ?? [];
  },

  async getById(id: string): Promise<ApiForm | null> {
    const response = await http.get<any>(`/forms/${id}`);
    return response?.data?.form ?? response?.data?.data?.form ?? null;
  },

  async getByProject(projectId: string): Promise<ApiForm[]> {
    const response = await http.get<any>(`/projects/${projectId}/forms`);
    return response?.data?.forms ?? response?.data?.data?.forms ?? [];
  },

  transformForFrontend(form: any) {
    const schema = typeof form.form_schema === 'string' ? JSON.parse(form.form_schema) : form.form_schema;
    return {
      id: form.id,
      projectId: form.project_id,
      title: form.title,
      description: form.description ?? '',
      version: 'v1.0',
      status: form.status,
      submissions: form.submissions_count || 0,
      target: form.target_count || 100,
      lastActivity: form.updated_at ? new Date(form.updated_at).toLocaleDateString() : 'Just now',
      creator: form.creator_name || 'System',
    };
  },
};