import { ApiClient } from './client';
import type { MarketPricesResponse } from './types';

export class MarketApi extends ApiClient {
  /**
   * Fetches all live market prices (crypto + fiat) from the price engine.
   * This endpoint is public — no auth token required.
   */
  async getPrices(): Promise<MarketPricesResponse & { prices: any[] }> {
    const res = await this.request<MarketPricesResponse>('/market/prices');
    // Map assets to prices for backward compatibility with components expecting .prices
    return {
      ...res,
      prices: res.assets.map(a => ({
        ...a,
        price: a.price_usd
      }))
    };
  }

  async getMarketPrices(): Promise<MarketPricesResponse> {
    return this.request<MarketPricesResponse>('/market/prices');
  }
}

export const marketApi = new MarketApi();
export const getMarketPrices = () => marketApi.getMarketPrices();
