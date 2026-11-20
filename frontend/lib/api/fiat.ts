import { ApiClient } from './client';
import { ApiResponse } from './types';

export interface DepositRequest {
  amount: string;
  currency: string;
  email?: string;
}

export interface DepositResponse {
  authorization_url?: string;
  reference: string;
  status: string;
  access_code?: string;
  expires_at?: string;
}

export interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  currency: string;
  status: string;
}

export interface WithdrawalRequest {
  amount: string;
  currency: string;
  beneficiary_id?: string;
  bank_account_id?: string; // Backward compatibility
  otp?: string;
  bank_code?: string;
  bank_name?: string;
  account_number?: string;
  pin?: string;
}

export interface WithdrawalQuote {
  amount_minor: number;
  amount: string | number;
  currency: string;
  fee_minor?: number;
  fee?: string | number;
  fee_deduction_mode?: 'added_to_amount' | 'subtracted_from_balance';
  service_fee_minor?: number;
  service_fee?: string | number;
  provider_transfer_fee_minor?: number;
  provider_transfer_fee?: string | number;
  provider_stamp_duty_minor?: number;
  provider_stamp_duty?: string | number;
  user_pays_provider_fee?: boolean;
  user_pays_levy?: boolean;
  total_debit_minor: number;
  total_debit: string | number;
  recipient_receives_minor: number;
  recipient_receives: string | number;
  fee_settings_version: number;
}

export interface Beneficiary {
  id: string;
  bank_name: string;
  bank_code: string;
  account_number_last4: string;
  account_name: string;
  currency: string;
  status: string;
  created_at?: string;
}

export interface AddBeneficiaryParams {
  bank_code: string;
  bank_name: string;
  account_number: string;
  currency?: string;
}

export class FiatApi extends ApiClient {
  async initiateDeposit(params: DepositRequest) {
    return this.request<ApiResponse & DepositResponse>('/fiat/deposit', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async verifyFiatDeposit(reference: string) {
    return this.request<ApiResponse & { status: string; reference: string; amount: any; currency: string }>('/fiat/deposit/verify', {
      method: 'POST',
      body: JSON.stringify({ reference }),
    });
  }

  async cancelFiatDeposit(reference: string, reason?: string) {
    return this.request<ApiResponse & { status: string; message: string }>('/fiat/deposit/cancel', {
      method: 'POST',
      body: JSON.stringify({ reference, reason: reason || 'cancelled by user' }),
    });
  }

  async reconcile() {
    return this.request<ApiResponse>('/fiat/reconcile', {
      method: 'POST',
    });
  }

  async quoteWithdrawal(beneficiaryId: string | undefined, amount: string, currency: string) {
    return this.request<WithdrawalQuote>('/fiat/withdrawal/quote', {
      method: 'POST',
      body: JSON.stringify({
        beneficiary_id: beneficiaryId || undefined,
        amount: amount,
        currency: currency,
      }),
    });
  }

  async initiateWithdrawal(params: WithdrawalRequest) {
    return this.request<ApiResponse & { id: string; status: string; amount: any; currency: string }>('/fiat/withdrawal', {
      method: 'POST',
      body: JSON.stringify({
        amount: params.amount,
        currency: params.currency,
        beneficiary_id: params.beneficiary_id || params.bank_account_id,
        bank_account_id: params.bank_account_id,
        bank_code: params.bank_code,
        bank_name: params.bank_name,
        account_number: params.account_number,
        pin: params.pin,
      }),
    });
  }

  async listBeneficiaries() {
    return this.request<ApiResponse & { beneficiaries: Beneficiary[]; accounts: Beneficiary[] }>('/fiat/beneficiaries');
  }

  async addBeneficiary(params: AddBeneficiaryParams) {
    return this.request<ApiResponse & { id: string; beneficiary: Beneficiary }>('/fiat/beneficiaries', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async removeBeneficiary(id: string) {
    return this.request<ApiResponse & { status: string }>('/fiat/beneficiaries/' + id, {
      method: 'DELETE',
    });
  }

  // Backward compatibility aliases
  async listBankAccounts() {
    return this.request<ApiResponse & { accounts: BankAccount[]; beneficiaries: BankAccount[] }>('/fiat/bank-accounts');
  }

  async addBankAccount(params: Partial<BankAccount> & { bank_code?: string; is_default?: boolean }) {
    return this.request<ApiResponse & { id: string }>('/fiat/bank-accounts', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async deleteBankAccount(id: string) {
    return this.request<ApiResponse>('/fiat/bank-accounts/' + id, {
      method: 'DELETE',
    });
  }

  async resolveBankAccount(accountNumber: string, bankCode: string) {
    return this.request<ApiResponse & { account_name: string; success: boolean }>('/fiat/bank/resolve', {
      method: 'POST',
      body: JSON.stringify({ account_number: accountNumber, bank_code: bankCode }),
    });
  }

  async getTransactionStatus(ref: string) {
    return this.request<ApiResponse & { status: string; amount?: any; currency?: string; processor?: string }>('/fiat/status/' + ref);
  }

  async listBanks(country?: string, currency?: string) {
    const params = new URLSearchParams();
    if (country) params.append('country', country);
    if (currency) params.append('currency', currency);
    return this.request<ApiResponse & { banks: any[]; data: any[] }>('/fiat/banks?' + params.toString());
  }

  async listTransactions(params: { currency?: string; type?: string; status?: string; limit?: number; offset?: number } = {}) {
    const query = new URLSearchParams();
    if (params.currency) query.append('currency', params.currency);
    if (params.type) query.append('type', params.type);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.offset) query.append('offset', params.offset.toString());
    const qs = query.toString();
    return this.request<ApiResponse & { transactions: FiatTransaction[]; data: FiatTransaction[] }>(
      '/fiat/transactions' + (qs ? `?${qs}` : '')
    );
  }
}

export interface FiatTransaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'swap';
  amount: string | number;
  fee: string | number;
  currency: string;
  status: 'pending' | 'awaiting_payment' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'reversed' | 'expired';
  processor: string;
  processor_ref?: string;
  external_id?: string;
  payment_method?: string;
  failure_reason?: string;
  metadata?: Record<string, any>;
  expires_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

