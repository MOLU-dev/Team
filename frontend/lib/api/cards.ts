import { ApiClient } from './client';
import { ListCardsResponse, CreateCardResponse, UserCard, ApiResponse } from './types';

const client = new ApiClient();

export interface CardTransactionItem {
  id: string;
  status: string;
  card_token: string;
  auth_token: string;
  merchant_amount: string;
  merchant_currency: string;
  created_at: string;
  spent_from_asset?: string;
}

export const cardApi = {
  listCards: async (): Promise<ListCardsResponse> => {
    return client.request<ListCardsResponse>('/cards');
  },

  createCard: async (cardType: 'virtual' | 'physical', pin?: string): Promise<CreateCardResponse> => {
    return client.request<CreateCardResponse>('/createcard', {
      method: 'POST',
      body: JSON.stringify({ card_type: cardType, pin }),
    });
  },

  getCard: async (id: string): Promise<{ success: boolean; card: UserCard }> => {
    return client.request<{ success: boolean; card: UserCard }>(`/cards/${id}`);
  },

  getSensitiveDetails: async (id: string): Promise<{ success: boolean; card: UserCard }> => {
    return client.request<{ success: boolean; card: UserCard }>(`/cards/${id}/sensitive`);
  },

  activateCard: async (id: string): Promise<ApiResponse> => {
    return client.request<ApiResponse>(`/cards/${id}/activate`, {
      method: 'POST',
    });
  },

  freezeCard: async (id: string): Promise<ApiResponse> => {
    return client.request<ApiResponse>(`/cards/${id}/freeze`, {
      method: 'POST',
    });
  },

  setPin: async (id: string, pin: string): Promise<ApiResponse> => {
    return client.request<ApiResponse>(`/cards/${id}/pin`, {
      method: 'POST',
      body: JSON.stringify({ pin }),
    });
  },

  setMerchantRestrictions: async (id: string, type: 'ALLOWLIST' | 'BLOCKLIST', merchantIds: string[]): Promise<ApiResponse> => {
    return client.request<ApiResponse>(`/cards/${id}/merchant-restrictions`, {
      method: 'POST',
      body: JSON.stringify({ type, merchant_ids: merchantIds }),
    });
  },

  getSpendPriority: async (id: string): Promise<{ success: boolean; primary_asset: string; priority_order: string[]; algorithm?: string; spend_strategy?: string; daily_limit?: number; monthly_limit?: number; balances?: any[] }> => {
    return client.request(`/cards/${id}/spend-priority`);
  },

  setSpendPriority: async (id: string, primaryAsset: string, priorityOrder?: string[], dailyLimit?: number, monthlyLimit?: number, algorithm?: string): Promise<ApiResponse> => {
    return client.request<ApiResponse>(`/cards/${id}/spend-priority`, {
      method: 'PUT',
      body: JSON.stringify({ primary_asset: primaryAsset, priority_order: priorityOrder, daily_limit: dailyLimit, monthly_limit: monthlyLimit, algorithm: algorithm || 'priority', spend_strategy: algorithm || 'priority' }),
    });
  },

  listTransactions: async (cardId?: string, limit?: number): Promise<{ success: boolean; transactions: CardTransactionItem[] }> => {
    const params = new URLSearchParams();
    if (limit) params.set('limit', String(limit));
    const query = params.toString() ? `?${params.toString()}` : '';
    const url = cardId ? `/cards/${cardId}/transactions${query}` : `/cards/transactions${query}`;
    return client.request<{ success: boolean; transactions: CardTransactionItem[] }>(url);
  }
};
