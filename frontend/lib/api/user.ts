import { ApiClient } from './client';
import { ApiResponse } from './types';

export class UserApi extends ApiClient {
  async getSettings() {
    return this.request<ApiResponse & { settings: any }>('/user/settings');
  }

  async updateSettings(settings: any) {
    return this.request<ApiResponse & { settings: any }>('/user/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }

  async updateTier(tier: number) {
    return this.request<ApiResponse & { tier: number }>('/user/tier', {
      method: 'POST',
      body: JSON.stringify({ tier }),
    });
  }

  async getNotifications() {
    return this.request<ApiResponse & { notifications: any[] }>('/notifications');
  }

  async markNotificationRead(id: string) {
    return this.request<ApiResponse>(`/notifications/${id}/read`, {
      method: 'POST',
    });
  }

  async markAllNotificationsRead() {
    return this.request<ApiResponse>('/notifications/read-all', {
      method: 'POST',
    });
  }
}
