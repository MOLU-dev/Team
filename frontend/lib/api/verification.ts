import { ApiClient, API_BASE_URL } from './client';

export interface VerificationStatus {
  email: string;
  email_verified: boolean;
  phone_number: string | null;
  phone_verified: boolean;
  email_status: string;
  phone_status: string;
  kyc_status: string;
  address_status: string;
  tier: number;
}

export interface Tier {
  tier: number;
  name: string;
  benefits: string[];
  max_withdrawal: number;
  max_deposit: number;
  max_crypto_send: number;
}

export interface VerificationResponse {
  success: boolean;
  status: VerificationStatus;
  tiers: Tier[];
}

export interface RequestOTPResponse {
  success: boolean;
  message: string;
  otp_code?: string; // Only in dev mode
  masked_phone?: string;
}

export interface VerifyPhoneResponse {
  success: boolean;
  message: string;
  tier: number;
}

export class VerificationClient extends ApiClient {
  constructor(baseURL: string = API_BASE_URL) {
    super(baseURL);
  }

  /**
   * Get current user verification status and tier
   */
  async getStatus(): Promise<VerificationResponse> {
    return this.get<VerificationResponse>('/verification/status');
  }

  /**
   * Request a phone verification OTP
   */
  async requestPhoneOTP(phone: string): Promise<RequestOTPResponse> {
    return this.post<RequestOTPResponse>('/verification/phone/request-otp', { phone });
  }

  /**
   * Verify phone OTP and upgrade tier
   */
  async verifyPhone(phone: string, code: string): Promise<VerifyPhoneResponse> {
    return this.post<VerifyPhoneResponse>('/verification/phone/verify', { phone, code });
  }

  /**
   * Update phone number (resets verification)
   */
  async updatePhone(phone: string): Promise<{ success: boolean; message: string }> {
    return this.put<{ success: boolean; message: string }>('/verification/phone', { phone });
  }
}

export const verificationApi = new VerificationClient();
