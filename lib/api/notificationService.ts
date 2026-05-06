import { http } from './httpClient';

export interface ApiNotification {
  id: string;
  user_id: string;
  type: 'task' | 'form' | 'message' | 'alert' | 'system' | 'announcement';
  title: string;
  message: string;
  body?: string;
  sender_name?: string;
  status?: 'unread' | 'read';
  is_read?: boolean;
  action_url?: string;
  created_at: string;
}

export const notificationService = {
  async getAll(): Promise<ApiNotification[]> {
    const response = await http.get<any>('/notifications');
    const notifications = response?.data?.notifications ?? response?.data?.data?.notifications ?? [];
    return notifications.map((n: any) => ({
      ...n,
      is_read: n.status === 'read',
      body: n.message || n.body,
    }));
  },

  async markAsRead(id: string): Promise<void> {
    await http.put(`/notifications/${id}`, { status: 'read' });
  },

  async markAllAsRead(): Promise<void> {
    await http.put('/notifications/read-all', {});
  },

  async getUnreadCount(): Promise<number> {
    const response = await http.get<any>('/notifications/unread-count');
    return response?.data?.unreadCount ?? 0;
  },

  transformForFrontend(notification: ApiNotification) {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.message || notification.body,
      isRead: notification.is_read ?? notification.status === 'read',
      actionUrl: notification.action_url,
      createdAt: notification.created_at,
    };
  },
};
