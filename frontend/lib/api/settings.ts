import { ApiClient } from './client';
import { ApiResponse, UserSettings } from './types';

export class SettingsApi extends ApiClient {
  async getSettings() {
    return this.request<ApiResponse & { settings: UserSettings }>('/user/settings');
  }

  async updateSettings(settings: Partial<UserSettings>) {
    return this.request<ApiResponse & { settings: UserSettings }>('/user/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }

  async getPinStatus() {
    return this.request<ApiResponse & { has_pin: boolean; is_locked: boolean; failed_attempts: number }>('/user/pin/status');
  }

  async setupPin(pin: string, password?: string) {
    return this.request<ApiResponse>('/user/pin/setup', {
      method: 'POST',
      body: JSON.stringify({ pin, password }),
    });
  }

  async changePin(oldPin: string, newPin: string, password?: string) {
    return this.request<ApiResponse>('/user/pin/change', {
      method: 'POST',
      body: JSON.stringify({ old_pin: oldPin, new_pin: newPin, password }),
    });
  }
}
