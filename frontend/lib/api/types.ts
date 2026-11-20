// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
}

export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  phone_verified?: boolean;
  country?: string;
  avatar_url?: string;
  role?: string;
  tier: number;
  currency?: string;
  is_frozen: boolean;
  has_pin?: boolean;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface TokenBalance {
  currency: string;
  balance?: string;
  total_balance?: string;
  available_balance: string;
  locked_balance?: string;
  fiat_value?: string;
  price?: string;
  price_change_24h?: string;
}

export interface Balance {
  currency: string;
  balance?: string;
  total_balance?: string;
  available_balance: string;
  locked_balance?: string;
  chain: string;
  fiat_value?: string;
  fiat_currency?: string;
  price?: string;
  price_change_24h?: string;
  tokens?: TokenBalance[];
}

export interface Transaction {
  id: string;
  wallet_id?: string;
  wallet_address?: string;
  from_user_id?: string;
  to_user_id?: string;
  to_address?: string;
  from_address?: string;
  from_display?: string;
  to_display?: string;
  currency: string;
  amount: string;
  type?: string;   // legacy alias used in history list mapping
  tx_type?: string;
  status: string;
  created_at: string;
  updated_at?: string;
  confirmed_at?: string;
  tx_hash?: string;
  chain: string;
  // Gas / fee fields
  gas_fee_charged?: string;
  gas_price?: string;
  gas_limit?: number;
  gas_used?: number;
  platform_fee?: string;
  platform_fee_percentage?: string;
  actual_spent?: string;
  // Block info
  block_number?: number;
  block_hash?: string;
  confirmations?: number;
  required_confirmations?: number;
  nonce?: number;
  // Value (raw chain value in wei / satoshi etc.)
  value?: string;
  // Optional display / enrichment fields
  usdAmount?: string;
  network_fee?: string;
  risk_score?: number;
  compliance_data?: any;
  action_url?: string;
  method_description?: string;
  change_address?: string;
  memo?: string;
  // Card / asset history metadata
  source?: 'card' | 'wallet' | 'swap' | 'trading' | 'deposit' | 'withdrawal';
  direction?: 'incoming' | 'outgoing';
  card_transaction_id?: string;
  merchant?: string;
  spent_from_asset?: string;
}

export interface AddressResponse {
  address: string;
  chain: string;
  destination_tag?: number;
}

export interface UserSettings {
  user_id: string;
  otp_enabled: boolean;
  notify_deposits: boolean;
  notify_withdrawals: boolean;
  preferred_currency: string;
  daily_withdrawal_limit: string;
  updated_at: string;
}

export interface TradeQuoteResponse {
  quote_id: string;
  from_asset?: string;
  to_asset?: string;
  from_amount?: string;
  to_amount: string;
  rate: string;
  mid_rate?: string;
  buy_at?: string;
  sell_at?: string;
  spread?: string;
  spread_bps?: string;
  spread_amount?: string;
  fee_percent?: string;
  min_fee?: string;
  fee_amount: string;
  fee_asset: string;
  expires_at: string;
}

export interface TradeResponse {
  trade_id: string;
  from_asset: string;
  to_asset: string;
  from_amount: string;
  to_amount: string;
  rate: string;
  fee_amount: string;
  fee_asset: string;
  status: string;
  settled_at?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  data?: Record<string, any> | string;
}

export interface NotificationsResponse {
  success: boolean;
  notifications: Notification[];
  unread_count: number;
}

export interface UserCard {
  id: string;
  user_id: string;
  card_id: string;
  status: 'active' | 'frozen' | 'blocked';
  card_brand: string;
  last_four: string;
  pan?: string;
  cvv?: string;
  exp_month: number;
  exp_year: number;
  created_at: string;
}

export interface ListCardsResponse {
  success: boolean;
  cards: UserCard[];
}

export interface CreateCardResponse {
  success: boolean;
  card: UserCard;
}

// --- Market prices ---

export interface MarketAsset {
  symbol: string;
  price_usd: number;
  bid: number;
  ask: number;
  /** "crypto" | "fiat" */
  type: string;
  source: string;
  timestamp: number;
  /** Optional — populated if 24h snapshot tracking is enabled */
  change_24h?: number;
}

export interface MarketPricesResponse {
  assets: MarketAsset[];
  timestamp: string;
}

// --- Saved Addresses & Recipients ---

export interface SavedAddress {
  id: string;
  user_id: string;
  label: string;
  network: string;
  asset?: string;
  address: string;
  note?: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface RecipientItem {
  id: string;
  saved_id?: string;
  type: 'saved' | 'recent';
  label: string;
  network: string;
  asset?: string;
  address: string;
  note?: string;
  is_favorite: boolean;
  is_internal: boolean;
  is_saved: boolean;
  last_used_at?: string;
  last_amount?: string;
  last_currency?: string;
  created_at?: string;
}

