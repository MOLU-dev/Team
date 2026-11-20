import { ApiClient } from './client';
import { ApiResponse, Notification, NotificationsResponse } from './types';

export class NotificationsApi extends ApiClient {
  async getNotifications(limit: number = 20, offset: number = 0) {
    return this.request<NotificationsResponse>(
      `/notifications?limit=${limit}&offset=${offset}`
    );
  }

  async markAsRead(id: string) {
    return this.request<ApiResponse>(`/notifications/${id}/read`, {
      method: 'POST'
    });
  }

  async markAllAsRead() {
    return this.request<ApiResponse>('/notifications/read-all', {
      method: 'POST'
    });
  }
}
