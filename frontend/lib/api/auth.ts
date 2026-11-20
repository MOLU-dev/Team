import { ApiClient } from './client';
import { ApiResponse, LoginResponse, User } from './types';

export class AuthApi extends ApiClient {
  async requestOTP(email: string) {
    return this.request<ApiResponse & { masked_email?: string }>('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyOTP(email: string, code: string) {
    return this.request<ApiResponse & { verification_token: string }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  }

  async register(username: string, password: string, currency: string, verificationToken: string, referralCode?: string) {
    return this.request<ApiResponse & { user_id: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ 
        username, 
        password, 
        currency, 
        verification_token: verificationToken,
        referral_code: referralCode
      }),
    });
  }

  async login(username_or_email: string, password: string) {
    return this.request<ApiResponse & LoginResponse & { masked_email?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username_or_email, password }),
    });
  }

  async validateSession() {
    return this.request<ApiResponse & { user: User }>('/auth/validate', {
      method: 'GET',
    });
  }

  async checkUsername(username: string) {
    return this.request<ApiResponse & { available: boolean }>(`/auth/check-username?username=${username}`, {
      method: 'GET',
    });
  }

  async forgotPassword(email: string) {
    return this.request<ApiResponse>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(params: any) {
    return this.request<ApiResponse>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}

// Auth helpers (keeping backward compatibility with existing auth export)
export const authHelpers = {
  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  },
  
  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  },
  
  removeToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  },
  
  isAuthenticated: () => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('authToken');
    }
    return false;
  },

  validateSession: async () => {
    // We can't use authApi here because it's a circular dependency potentially
    // but we can import it or just use the singleton api if we use it from CombinedApi
    // For now let's just use a simple fetch since we already have the client logic elsewhere
    // Actually, let's just add it to the API class and use it from there.
    return; // This will be handled in AuthProvider by calling api.validateSession()
  }
};
