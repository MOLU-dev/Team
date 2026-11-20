export type DrawerState = 'hidden' | 'partial' | 'full';
export type OrderType = 'market' | 'buy_limit' | 'sell_limit' | 'buy_stop' | 'sell_stop';

export const ORDER_TYPES: { id: OrderType; label: string }[] = [
  { id: 'market',     label: 'Market Execution' },
  { id: 'buy_limit',  label: 'Buy Limit' },
  { id: 'sell_limit', label: 'Sell Limit' },
  { id: 'buy_stop',   label: 'Buy Stop' },
  { id: 'sell_stop',  label: 'Sell Stop' },
];

export const TIMEFRAMES = ['M1','M5','M15','M30','H1','H4','D1','W1'];

export const TV_INTERVAL: Record<string,string> = {
  M1:'1', M5:'5', M15:'15', M30:'30', H1:'60', H4:'240', D1:'D', W1:'W'
};
