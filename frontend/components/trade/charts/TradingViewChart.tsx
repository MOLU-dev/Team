'use client';

import { TV_INTERVAL } from './types';

interface TradingViewChartProps {
  symbol: string;
  timeframe: string;
  className?: string;
}

export default function TradingViewChart({ symbol, timeframe, className }: TradingViewChartProps) {
  const interval = TV_INTERVAL[timeframe] ?? '5';
  const chartSrc = `https://s.tradingview.com/widgetembed/?symbol=BINANCE:${symbol}`
    + `&interval=${interval}&theme=dark&style=1&locale=en`
    + `&toolbar_bg=%230d1117&hide_top_toolbar=0&hide_legend=0&save_image=0&hide_volume=0`;

  return (
    <iframe 
      key={`${symbol}-${timeframe}`} 
      src={chartSrc}
      className={className} 
      title={`${symbol} Chart`} 
      allowTransparency 
    />
  );
}
