import { AuthApi, authHelpers } from './api/auth';
import { WalletApi } from './api/wallet';
import { SettingsApi } from './api/settings';
import { NotificationsApi } from './api/notifications';
import { FiatApi } from './api/fiat';
import { UserApi } from './api/user';
import { MarketApi } from './api/market';
import { P2PApi } from './api/p2p';
import { API_BASE_URL, ApiError } from './api/client';

// Re-export types for backward compatibility
export * from './api/types';
export * from './api/fiat';

// Re-export error class
export { ApiError };

/**
 * Main API Client that combines all specialized API classes.
 * This maintain backward compatibility with the previous default export.
 */
class CombinedApi extends WalletApi {
  private authApi: AuthApi;
  private settingsApi: SettingsApi;
  private notificationsApi: NotificationsApi;
  private fiatApi: FiatApi;
  private marketApi: MarketApi;
  public user: UserApi;
  public p2p: P2PApi;

  constructor(baseURL: string = API_BASE_URL) {
    super(baseURL);
    this.authApi = new AuthApi(baseURL);
    this.settingsApi = new SettingsApi(baseURL);
    this.notificationsApi = new NotificationsApi(baseURL);
    this.fiatApi = new FiatApi(baseURL);
    this.marketApi = new MarketApi(baseURL);
    this.user = new UserApi(baseURL);
    this.p2p = new P2PApi(baseURL);
  }

  // Delegate Auth methods
  async requestOTP(email: string) {
    return this.authApi.requestOTP(email);
  }

  async verifyOTP(email: string, code: string) {
    return this.authApi.verifyOTP(email, code);
  }

  async register(username: string, password: string, currency: string, verificationToken: string, referralCode?: string) {
    return this.authApi.register(username, password, currency, verificationToken, referralCode);
  }

  async login(username_or_email: string, password: string, totp_code?: string) {
    // Use the backend proxy route to simulate client IP on the backend
    const response = await fetch('/api/backend/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username_or_email, password, totp_code }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(response.status, error.message || 'Login failed');
    }
    
    return response.json();
  }

  async validateSession() {
    return this.authApi.validateSession();
  }

  async checkUsername(username: string) {
    return this.authApi.checkUsername(username);
  }

  async forgotPassword(email: string) {
    return this.authApi.forgotPassword(email);
  }

  async resetPassword(params: any) {
    return this.authApi.resetPassword(params);
  }

  // Settings methods
  async getSettings() {
    return this.settingsApi.getSettings();
  }

  async updateSettings(settings: any) {
    return this.settingsApi.updateSettings(settings);
  }

  async getPinStatus() {
    return this.settingsApi.getPinStatus();
  }

  async setupPin(pin: string, password?: string) {
    return this.settingsApi.setupPin(pin, password);
  }

  async changePin(oldPin: string, newPin: string, password?: string) {
    return this.settingsApi.changePin(oldPin, newPin, password);
  }

  // Notification methods
  async getNotifications(limit?: number, offset?: number) {
    return this.notificationsApi.getNotifications(limit, offset);
  }

  async markNotificationAsRead(id: string) {
    return this.notificationsApi.markAsRead(id);
  }

  async markAllNotificationsAsRead() {
    return this.notificationsApi.markAllAsRead();
  }

  // Fiat methods
  async initiateFiatDeposit(amount: string, currency: string, email?: string) {
    return this.fiatApi.initiateDeposit({ amount, currency, email });
  }

  async verifyFiatDeposit(reference: string) {
    return this.fiatApi.verifyFiatDeposit(reference);
  }

  async cancelFiatDeposit(reference: string, reason?: string) {
    return this.fiatApi.cancelFiatDeposit(reference, reason);
  }

  async reconcileFiat() {
    return this.fiatApi.reconcile();
  }

  async quoteWithdrawal(beneficiaryId: string | undefined, amount: string, currency: string) {
    return this.fiatApi.quoteWithdrawal(beneficiaryId, amount, currency);
  }

  async initiateFiatWithdrawal(amount: string, currency: string, bank_account_id?: string, otp?: string, directBank?: { bank_code: string; bank_name: string; account_number: string }, pin?: string) {
    return this.fiatApi.initiateWithdrawal({
      amount,
      currency,
      beneficiary_id: bank_account_id,
      bank_account_id,
      otp,
      bank_code: directBank?.bank_code,
      bank_name: directBank?.bank_name,
      account_number: directBank?.account_number,
      pin,
    });
  }

  async listBeneficiaries() {
    return this.fiatApi.listBeneficiaries();
  }

  async addBeneficiary(params: any) {
    return this.fiatApi.addBeneficiary(params);
  }

  async removeBeneficiary(id: string) {
    return this.fiatApi.removeBeneficiary(id);
  }

  async listBankAccounts() {
    return this.fiatApi.listBankAccounts();
  }

  async addBankAccount(params: any) {
    return this.fiatApi.addBankAccount(params);
  }

  async deleteBankAccount(id: string) {
    return this.fiatApi.deleteBankAccount(id);
  }

  async resolveBankAccount(accountNumber: string, bankCode: string) {
    return this.fiatApi.resolveBankAccount(accountNumber, bankCode);
  }

  async getFiatTransactionStatus(ref: string) {
    return this.fiatApi.getTransactionStatus(ref);
  }

  async listBanks(country?: string, currency?: string) {
    return this.fiatApi.listBanks(country, currency);
  }

  async listFiatTransactions(params?: { currency?: string; type?: string; status?: string; limit?: number; offset?: number }) {
    return this.fiatApi.listTransactions(params);
  }


  // Market methods
  async getPrices() {
    return this.marketApi.getPrices();
  }

  // getTransaction is inherited from WalletApi — fetches a single tx by ID
  async getTransaction(id: string) {
    return super.getTransaction(id);
  }
}

// Export singleton instance
export const api = new CombinedApi();

// Export auth helpers for backward compatibility
export const auth = authHelpers;

// Default export
export default api;
