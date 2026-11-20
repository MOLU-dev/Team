import { ApiClient } from './client';
import { ApiResponse, Balance, Transaction, AddressResponse, TradeResponse, TradeQuoteResponse, SavedAddress, RecipientItem } from './types';

export class WalletApi extends ApiClient {
  async getBalances(currency?: string, chain?: string) {
    const params = new URLSearchParams();
    if (currency) params.append('currency', currency);
    if (chain) params.append('chain', chain);
    
    const query = params.toString();
    return this.request<ApiResponse & { balances: Balance[] }>(
      `/wallet/balances${query ? `?${query}` : ''}`
    );
  }

  async getAllBalances() {
    return this.request<ApiResponse & { balances: Balance[] }>('/wallet/all-balances');
  }

  async getAssetBalance(currency: string, chain?: string) {
    const query = chain ? `&chain=${chain}` : '';
    return this.request<ApiResponse & { balance: { currency: string; chain: string; balance: string; fiat_value: string; price: string } }>(
      `/wallet/asset-balance?currency=${currency}${query}`
    );
  }

  async listTokens() {
    return this.request<ApiResponse & { tokens: any[] }>('/wallet/tokens');
  }

  async getHistory(limit: number = 50, offset: number = 0, currency?: string, chain?: string | null) {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    });
    if (currency) params.append('currency', currency);
    if (chain) params.append('chain', chain);
    
    return this.request<ApiResponse & { transactions: Transaction[] }>(
      `/wallet/history?${params.toString()}`
    );
  }

  async getTransaction(id: string) {
    return this.request<ApiResponse & { transaction: Transaction }>(
      `/wallet/transaction/${id}`
    );
  }

  async getAddress(chain: string, currency: string) {
    return this.request<ApiResponse & AddressResponse>(`/wallet/address?chain=${chain}&currency=${currency}`);
  }

  async requestAddress(chain: string, currency: string) {
    return this.request<ApiResponse & AddressResponse>('/wallet/address', {
      method: 'POST',
      body: JSON.stringify({ chain, currency }),
    });
  }

  async getOnChainBalance(currency: string, chain: string) {
    return this.request<ApiResponse & { balance: string }>(
      `/wallet/on-chain-balance?currency=${currency}&chain=${chain}`
    );
  }

  async checkAddress(address: string, chain: string) {
    const params = new URLSearchParams({ address, chain });
    return this.request<ApiResponse & { is_internal: boolean; is_self: boolean; address: string; chain: string }>(
      `/wallet/check-address?${params.toString()}`
    );
  }

  async sendPreview(
    from_address: string,
    to_address: string,
    amount: string,
    currency: string,
    chain: string,
    instant_send?: boolean,
    memo?: string,
    transfer_method?: 'internal' | 'blockchain',
    destination_tag?: number
  ) {
    return this.request<ApiResponse & { 
      preview_id: string;
      amount?: string;
      currency?: string;
      estimated_gas: string;
      total: string;
      fee_currency?: string;
      fee_payer_asset?: string;
      fee_token_equivalent?: string;
      fee_native_equivalent?: string;
      preview_type?: string;
      is_internal_recipient?: boolean;
      masked_email?: string;
      memo?: string;
      destination_tag?: number;
    }>('/wallet/send', {
      method: 'POST',
      body: JSON.stringify({
        from_address,
        to_address,
        amount,
        currency,
        chain,
        ...(instant_send && { instant_send }),
        ...(memo && { memo }),
        ...(transfer_method && { transfer_method }),
        ...(destination_tag !== undefined && { destination_tag }),
      }),
    });
  }

  async approveSend(preview_id: string, otp: string) {
    return this.request<ApiResponse & { tx_hash: string }>('/wallet/approve', {
      method: 'POST',
      body: JSON.stringify({ preview_id, otp }),
      signal: AbortSignal.timeout(45_000),
    });
  }

  async internalSend(params: {
    from_address: string;
    to_recipient: string;
    amount: string;
    currency: string;
    chain?: string;
    password?: string;
    pin?: string;
  }) {
    return this.request<ApiResponse & { tx_hash: string }>('/wallet/internal-send', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // Payment requests
  async createPaymentRequest(
    amount: string,
    currency: string,
    chain: string,
    description?: string,
    expires_in_minutes?: number
  ) {
    return this.request<ApiResponse & { payment_request_id: string }>('/ecommerce/payment-request', {
      method: 'POST',
      body: JSON.stringify({ amount, currency, chain, description, expires_in_minutes }),
    });
  }

  async listPaymentRequests(status?: string) {
    const query = status ? `?status=${status}` : '';
    return this.request<ApiResponse & { payment_requests: any[] }>(
      `/ecommerce/payment-requests${query}`
    );
  }

  async tradeQuote(params: {
    from_asset: string;
    to_asset: string;
    amount: string;
    trade_type?: 'INTERNAL' | 'USER';
  }) {
    return this.request<ApiResponse & { data?: TradeQuoteResponse } & TradeQuoteResponse>('/swap/quote', {
      method: 'POST',
      body: JSON.stringify({
        from_asset: params.from_asset.toUpperCase(),
        to_asset: params.to_asset.toUpperCase(),
        from_amount: params.amount,
      }),
    });
  }

  async executeTrade(params: {
    quote_id: string;
    pin: string;
    password?: string;
  }) {
    const idKey = `swap-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    return this.request<ApiResponse & { data?: TradeResponse } & TradeResponse>('/swap/execute', {
      method: 'POST',
      headers: {
        'Idempotency-Key': idKey,
      },
      body: JSON.stringify({
        quote_id: params.quote_id,
        pin: params.pin,
        password: params.password || params.pin,
      }),
    });
  }

  async listSwaps() {
    return this.request<ApiResponse & { swaps: any[]; data: any[] }>('/swap/history');
  }

  async getAppConfig() {
    return this.request<ApiResponse & { env: string; is_testnet: boolean }>('/wallet/config');
  }
  async getUserLimits() {
    return this.request<ApiResponse & { tier: number; global_usd: number; crypto_limits: Record<string, number> }>('/wallet/limits');
  }

  // --- Saved Addresses & Address Book ---

  async getSavedAddresses(params?: { network?: string; query?: string; favorite?: boolean }) {
    const search = new URLSearchParams();
    if (params?.network) search.set('network', params.network);
    if (params?.query) search.set('query', params.query);
    if (params?.favorite !== undefined) search.set('favorite', String(params.favorite));
    const qs = search.toString();
    return this.request<ApiResponse & { saved_addresses: SavedAddress[]; count: number }>(
      `/saved-addresses${qs ? `?${qs}` : ''}`
    );
  }

  async getSavedAddress(id: string) {
    return this.request<ApiResponse & { saved_address: SavedAddress }>(`/saved-addresses/${id}`);
  }

  async createSavedAddress(data: {
    label: string;
    network: string;
    address: string;
    asset?: string;
    note?: string;
    is_favorite?: boolean;
  }) {
    return this.request<ApiResponse & { saved_address: SavedAddress }>('/saved-addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSavedAddress(
    id: string,
    data: { label?: string; note?: string; asset?: string; is_favorite?: boolean }
  ) {
    return this.request<ApiResponse & { saved_address: SavedAddress }>(`/saved-addresses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteSavedAddress(id: string) {
    return this.request<ApiResponse & { message: string }>(`/saved-addresses/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleSavedAddressFavorite(id: string, is_favorite: boolean) {
    return this.request<ApiResponse & { saved_address: SavedAddress }>(`/saved-addresses/${id}/favorite`, {
      method: is_favorite ? 'PUT' : 'DELETE',
      body: JSON.stringify({ favorite: is_favorite }),
    });
  }

  async checkSavedAddress(address: string, network: string) {
    const params = new URLSearchParams({ address, network });
    return this.request<ApiResponse & { is_saved: boolean; saved_address?: SavedAddress }>(
      `/saved-addresses/check?${params.toString()}`
    );
  }

  async getRecentRecipients() {
    return this.request<ApiResponse & { recipients: RecipientItem[]; count: number }>('/recipients/recent');
  }

  async getRecipients(params?: {
    view?: 'recent' | 'favorites' | 'saved' | 'all';
    network?: string;
    query?: string;
  }) {
    const search = new URLSearchParams();
    if (params?.view) search.set('view', params.view);
    if (params?.network) search.set('network', params.network);
    if (params?.query) search.set('query', params.query);
    const qs = search.toString();
    return this.request<ApiResponse & { recipients: RecipientItem[]; view: string; count: number }>(
      `/recipients${qs ? `?${qs}` : ''}`
    );
  }
}
