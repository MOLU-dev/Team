import { ApiClient } from './client';
import { ApiResponse } from './types';

export interface P2PAsset {
  id: string;
  currency: string;
  chain: string;
  name: string;
  is_stable: boolean;
  min_trade_size: number;
  is_active: boolean;
}

export interface P2PPair {
  base: string;
  quote: string;
}

export interface P2PAd {
  id: string;
  owner_id: string;
  side: 'buy' | 'sell';
  base_symbol: string;
  base_chain: string;
  quote_symbol: string;
  quote_chain: string;
  price_per_unit: number;
  min_amount: number;
  max_amount: number;
  total_quantity: number;
  available: number;
  is_active: boolean;
  created_at: string;
}

export interface P2POrder {
  id: string;
  ad_id: string;
  buyer_id: string;
  seller_id: string;
  status: 'locked' | 'paid' | 'released' | 'returned' | 'disputed';
  base_symbol: string;
  base_chain: string;
  base_amount: number;
  quote_symbol: string;
  quote_chain: string;
  quote_amount: number;
  seller_fee: number;
  buyer_fee: number;
  created_at: string;
}

export interface OrderDetails extends P2POrder {
  counterparty: {
    user_id: string;
    verified_name: string;
  };
  payment_methods?: any[];
}

export class P2PApi extends ApiClient {
  async getAssets(): Promise<ApiResponse<P2PAsset[]>> {
    return this.get('/p2p/assets');
  }

  async getPairs(): Promise<ApiResponse<P2PPair[]>> {
    // Backend route is /p2p/assets/pairs
    return this.get('/p2p/assets/pairs');
  }

  async getAds(params?: { base?: string; quote?: string; side?: string }): Promise<ApiResponse<P2PAd[]>> {
    const searchParams = new URLSearchParams();
    if (params?.base) searchParams.append('base', params.base);
    if (params?.quote) searchParams.append('quote', params.quote);
    if (params?.side) searchParams.append('side', params.side);
    return this.get(`/p2p/ads?${searchParams.toString()}`);
  }

  async createAd(data: {
    side: 'buy' | 'sell';
    base_symbol: string;
    base_chain: string;
    quote_symbol: string;
    quote_chain: string;
    price_per_unit: number;
    min_amount: number;
    max_amount: number;
    total_quantity: number;
  }): Promise<ApiResponse<P2PAd>> {
    return this.post('/p2p/ads', data);
  }

  async getAd(id: string): Promise<ApiResponse<P2PAd>> {
    return this.get(`/p2p/ads/${id}`);
  }

  async deactivateAd(id: string): Promise<ApiResponse<{ message: string }>> {
    // Backend uses PATCH /p2p/ads/:id/deactivate, not DELETE
    return this.request(`/p2p/ads/${id}/deactivate`, { method: 'PATCH' });
  }

  async placeOrder(data: {
    ad_id: string;
    base_amount: number;
    note?: string;
  }): Promise<ApiResponse<OrderDetails>> {
    // Backend route is /p2p/trades/limit
    return this.post('/p2p/trades/limit', data);
  }

  async getOrders(): Promise<ApiResponse<P2POrder[]>> {
    // Backend route is /p2p/trades
    return this.get('/p2p/trades');
  }

  async getOrder(id: string): Promise<ApiResponse<OrderDetails>> {
    // Backend route is /p2p/trades/:id
    return this.get(`/p2p/trades/${id}`);
  }

  async markPaid(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.post(`/p2p/trades/${id}/paid`);
  }

  async releaseEscrow(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.post(`/p2p/trades/${id}/release`);
  }

  async cancelOrder(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.post(`/p2p/trades/${id}/cancel`);
  }
}
