import { http } from './httpClient';

export interface ApiUser {
  id: string;
  name: string;
  first_name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'supervisor' | 'team_leader' | 'field_agent';
  avatar?: string;
  status: 'online' | 'offline' | 'idle';
  location_sharing_enabled?: boolean;
  notifications_enabled?: boolean;
  last_seen?: string;
  created_at?: string;
}

export const userService = {
  async getAll(): Promise<ApiUser[]> {
    const response = await http.get<any>('/users');
    return response?.data?.users ?? response?.data?.data?.users ?? [];
  },

  async getById(id: string): Promise<ApiUser | null> {
    const response = await http.get<any>(`/users/${id}`);
    return response?.data?.user ?? response?.data?.data?.user ?? null;
  },

  async getProfile(): Promise<ApiUser | null> {
    const response = await http.get<any>('/auth/profile');
    return response?.data?.user ?? response?.data?.data?.user ?? null;
  },

  async deleteUser(id: string): Promise<boolean> {
    try {
      await http.delete(`/users/${id}`);
      return true;
    } catch (err) {
      console.error('Failed to delete user:', err);
      return false;
    }
  },

  transformForFrontend(user: ApiUser) {
    return {
      id: user.id,
      name: user.name,
      firstName: user.first_name,
      email: user.email,
      phone: user.phone ?? '',
      role: user.role,
      avatarUrl: user.avatar ?? '/placeholder-user.jpg',
      status: user.status ?? 'offline',
      locationSharingEnabled: user.location_sharing_enabled ?? true,
      notificationsEnabled: user.notifications_enabled ?? true,
      lastSeen: user.last_seen ? new Date(user.last_seen).toISOString() : new Date().toISOString(),
    };
  },
};
