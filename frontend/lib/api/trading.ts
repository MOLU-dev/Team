import { ApiClient, API_BASE_URL } from './client';

// ── Types ──────────────────────────────────────────────────────────────

export interface TradingAccount {
  id: string;
  user_id: string;
  base_currency: string;
  is_demo: boolean;
  leverage: number;
  status: string;
  created_at: string;
}

export interface TradingBalance {
  currency: string;
  available: string;
  locked: string;
}

export interface TradingAccountDetail extends TradingAccount {
  balances: TradingBalance[];
  equity: string;
  margin_used: string;
  margin_level: string;
  unrealised_pnl: string;
}

export interface TradingPosition {
  id: string;
  trading_account_id: string;
  symbol: string;
  side: string;
  open_qty: string;
  entry_price: string;
  leverage: number;
  isolated: boolean;
  isolated_margin: string;
  realised_pnl: string;
  unrealised_pnl?: string;
  current_price?: string;
}

export interface TradingOrder {
  id: string;
  trading_account_id: string;
  user_id: string;
  symbol: string;
  side: string;
  order_type: string;
  price: string;
  quantity: string;
  filled_qty: string;
  status: string;
  created_at: string;
}

export interface CreateAccountRequest {
  base_currency: string;
  is_demo: boolean;
  leverage: number;
}

export interface FundAccountRequest {
  trading_account_id: string;
  source_currency: string;
  source_chain: string;
  amount: string;
}

export interface FundPreviewRequest {
  trading_account_id: string;
  source_currency: string;
  source_chain: string;
  amount: string;
}

export interface WithdrawAccountRequest {
  trading_account_id: string;
  target_currency: string;
  target_chain: string;
  amount: string;
}

export interface WithdrawPreviewRequest {
  trading_account_id: string;
  target_currency: string;
  target_chain: string;
  amount: string;
}

export interface FundPreviewResponse {
  rate: string;
  fee_amount: string;
  fee_percent: number;
  target_amount: string;
  is_demo: boolean;
}

export interface WithdrawPreviewResponse {
  rate: string;
  fee_amount: string;
  fee_percent: number;
  target_amount: string;
}

export interface FundResult {
  success: boolean;
  source_balance?: any;
  trading_balance?: any;
  rate?: string;
  fee_amount?: string;
  target_amount?: string;
  is_demo?: boolean;
}

export interface WithdrawResult {
  success: boolean;
  source_balance?: any;
  target_balance?: any;
  rate?: string;
  fee_amount?: string;
  target_amount?: string;
}

export interface SetLeverageRequest {
  trading_account_id: string;
  leverage: number;
}

export interface PlaceOrderRequest {
  trading_account_id: string;
  symbol: string;
  side: 'buy' | 'sell';
  order_type: 'market' | 'limit';
  price?: string;
  quantity: string;
  // Conditional order triggers (optional)
  trigger_type?: string;
  trigger_price?: string;
  trigger_direction?: string;
  trigger_time?: string;
}

export interface ConditionalOrderRequest {
  trading_account_id: string;
  symbol: string;
  side: 'buy' | 'sell';
  order_type: 'market' | 'limit';
  price?: string;
  quantity: string;
  /** "price" or "time" */
  trigger_type: 'price' | 'time';
  /** Target price that fires the order (required when trigger_type is "price") */
  trigger_price?: string;
  /** "above" or "below" — direction the market must cross (required when trigger_type is "price") */
  trigger_direction?: 'above' | 'below';
  /** ISO-8601 timestamp at which to activate the order (required when trigger_type is "time") */
  trigger_time?: string;
}

// ── Trading API ────────────────────────────────────────────────────────
//
// REST requests go through the wallet API proxy (same origin, same auth).
// This avoids CORS issues and lets the wallet API handle JWT→X-User-ID translation.
//
// WebSocket connects DIRECTLY to the trading service — proxying a
// long-lived bidirectional connection would double memory and add
// latency to every tick. Use NEXT_PUBLIC_TRADING_WS_URL for this.

export class TradingApi extends ApiClient {
  constructor(baseURL: string = API_BASE_URL) {
    super(baseURL);
  }

  // ── Accounts ──

  async listAccounts(): Promise<{ accounts: TradingAccount[] }> {
    return this.request('/trading/accounts');
  }

  async getAccount(id: string): Promise<{ account: TradingAccountDetail }> {
    return this.request(`/trading/accounts/${id}`);
  }

  async createAccount(params: CreateAccountRequest): Promise<{ account: TradingAccount }> {
    return this.request('/trading/accounts', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async setLeverage(params: SetLeverageRequest): Promise<{ success: boolean }> {
    return this.request(`/trading/accounts/${params.trading_account_id}/leverage`, {
      method: 'PUT',
      body: JSON.stringify({ leverage: params.leverage }),
    });
  }

  // ── Funding ──

  async previewFundAccount(params: FundPreviewRequest): Promise<FundPreviewResponse> {
    return this.request('/trading/accounts/fund/preview', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async fundAccount(params: FundAccountRequest): Promise<FundResult> {
    return this.request('/trading/accounts/fund', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // ── Withdrawals ──

  async previewWithdrawAccount(params: WithdrawPreviewRequest): Promise<WithdrawPreviewResponse> {
    return this.request('/trading/accounts/withdraw/preview', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async withdrawFromAccount(params: WithdrawAccountRequest): Promise<WithdrawResult> {
    return this.request('/trading/accounts/withdraw', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // ── Orders ──

  async placeOrder(params: PlaceOrderRequest): Promise<TradingOrder> {
    return this.request('/trading/order', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Place a conditional (stop/trigger) order.
   * The order stays in "pending" status until the trigger condition is met,
   * then the matching engine activates and routes it.
   *
   * trigger_type:      "price" | "time"
   * trigger_direction: "above" | "below"  (for price triggers)
   * trigger_price:     target price that fires the order
   * trigger_time:      ISO-8601 timestamp (for time triggers)
   */
  async placeConditionalOrder(params: ConditionalOrderRequest): Promise<TradingOrder> {
    return this.request('/trading/order', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async cancelOrder(orderId: string): Promise<{ status: string }> {
    return this.request(`/trading/order/${orderId}`, {
      method: 'DELETE',
    });
  }

  async listOrders(accountId: string): Promise<TradingOrder[]> {
    return this.request(`/trading/orders?account_id=${accountId}`);
  }

  async listInstruments(): Promise<any[]> {
    return this.request('/trading/instruments');
  }

  // ── Positions ──

  async listPositions(accountId: string): Promise<TradingPosition[]> {
    return this.request(`/trading/positions?account_id=${accountId}`);
  }

  async closePosition(positionId: string): Promise<TradingOrder> {
    return this.request(`/trading/positions/close/${positionId}`, {
      method: 'POST',
    });
  }

  async closeAllPositions(tradingAccountId: string): Promise<void> {
    return this.request('/trading/positions/close-all', {
      method: 'POST',
      body: JSON.stringify({ trading_account_id: tradingAccountId }),
    });
  }
}

export const tradingApi = new TradingApi();

// ── Trading WebSocket ──────────────────────────────────────────────────
//
// Connects DIRECTLY to the trading service (not proxied).
// This gives sub-millisecond message delivery for tickers, fills, and
// order book snapshots without doubling connection overhead.

export interface TradingWSMessage {
  channel?: string;
  action?: string;
  ref?: string;
  error?: string;
  data: any;
}

export type TradingWSHandler = (msg: TradingWSMessage) => void;

const TRADING_WS_URL = process.env.NEXT_PUBLIC_TRADING_WS_URL || 'ws://localhost:8080/ws';

class TradingWebSocket {
  private ws: WebSocket | null = null;
  private handlers: Set<TradingWSHandler> = new Set();
  private reconnectInterval = 3000;
  private subscriptions: Set<string> = new Set();
  private isConnected = false;
  private userId: string | null = null;

  setUserId(userId: string) {
    this.userId = userId;
    if (this.userId) {
      this.subscriptions.add(`user:${this.userId}`);
    }
  }

  connect() {
    if (typeof window === 'undefined') return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    // Append user ID to URL if available to help backend identify the client
    let url = TRADING_WS_URL;
    if (this.userId) {
      url += (url.includes('?') ? '&' : '?') + `userId=${this.userId}`;
    }

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('[TradingWS] connected');
      this.isConnected = true;
      // Re-subscribe to all channels after reconnect
      if (this.subscriptions.size > 0) {
        this.sendCommand('subscribe', Array.from(this.subscriptions));
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: TradingWSMessage = JSON.parse(event.data);
        this.handlers.forEach((h) => h(msg));
      } catch (e) {
        console.error('[TradingWS] parse error', e);
      }
    };

    this.ws.onclose = () => {
      console.log('[TradingWS] disconnected, reconnecting...');
      this.isConnected = false;
      setTimeout(() => this.connect(), this.reconnectInterval);
    };

    this.ws.onerror = (err) => {
      console.error('[TradingWS] error', err);
      this.ws?.close();
    };
  }

  subscribe(channels: string[]) {
    channels.forEach((ch) => this.subscriptions.add(ch));
    if (this.isConnected) {
      this.sendCommand('subscribe', channels);
    }
  }

  unsubscribe(channels: string[]) {
    channels.forEach((ch) => this.subscriptions.delete(ch));
    if (this.isConnected) {
      this.sendCommand('unsubscribe', channels);
    }
  }

  onMessage(handler: TradingWSHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  private sendCommand(action: string, data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      if (Array.isArray(data)) {
        this.ws.send(JSON.stringify({ action, channels: data }));
      } else {
        this.ws.send(JSON.stringify({ action, ...data }));
      }
    }
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
    this.isConnected = false;
  }
  /**
   * Place an order via WebSocket. 
   * Falls back to REST if WS is not connected.
   */
  async placeOrder(req: PlaceOrderRequest): Promise<TradingOrder> {
    if (this.isConnected) {
      return new Promise((resolve, reject) => {
        this.sendCommand('place_order', req);
        
        // Wait for response via onMessage
        const cleanup = this.onMessage((msg) => {
          if (msg.action === 'response' && msg.ref === 'place_order') {
            cleanup();
            if (msg.error) reject(new Error(msg.error));
            else resolve(msg.data);
          }
        });

        // Timeout after 5s
        setTimeout(() => {
          cleanup();
          reject(new Error('WebSocket order placement timeout'));
        }, 5000);
      });
    }
    
    // Fallback to REST
    return tradingApi.placeOrder(req);
  }
}

export const tradingWS = new TradingWebSocket();
