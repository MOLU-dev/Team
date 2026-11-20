import { CHAINS, getAssetIconWithChain, ASSETS } from '@/lib/chains';
import Link from 'next/link';

interface Chain {
  type: string;
  network: string;
  amount: string;
  usdValue: string;
  symbol: string;
  chainId: string;
}

interface ChainBreakdownProps {
  chains: Chain[];
}

export default function ChainBreakdown({ chains }: ChainBreakdownProps) {
  const getBadgeStyle = (type: string) => {
    // Look up the chain by badge (type is actually the badge lowercased)
    const chain = Object.values(CHAINS).find(
      c => c.badge.toLowerCase() === type.toLowerCase() || c.id === type.toLowerCase()
    );
    if (chain) {
      return { borderColor: `${chain.color}50`, backgroundColor: `${chain.color}15`, color: chain.color };
    }
    return { borderColor: 'rgba(0,255,204,0.5)', backgroundColor: 'rgba(0,255,204,0.1)', color: '#00ffcc' };
  };

  return (
    <div className="space-y-2">
      {chains.map((chain, index) => {
        const style = getBadgeStyle(chain.type);
        const isNative = ASSETS[chain.symbol]?.type === 'native';
        return (
          <div
            key={index}
            className="flex justify-between items-center p-3 sm:p-4 bg-card-bg border border-border rounded-xl sm:rounded-2xl hover:border-cyan/30 hover:bg-surface-hover transition-all group relative overflow-hidden shadow-sm"
          >
            <div className="flex items-center gap-3 sm:gap-4 relative z-10">
              <div className="w-10 h-10 flex items-center justify-center p-2 bg-surface-muted rounded-lg group-hover:scale-110 transition-transform">
                {getAssetIconWithChain(chain.symbol, chain.chainId)}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-text-primary tracking-wide truncate">{chain.network}</h4>
                <div className="flex items-center gap-2 mt-1">
                  {!isNative && (
                    <span
                      className="px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded border inline-block"
                      style={style}
                    >
                      {chain.type.toUpperCase()}
                    </span>
                  )}
                  <Link 
                    href={`/receive?asset=${chain.symbol.toLowerCase()}&chain=${chain.chainId}`}
                    className="text-[9px] font-bold text-cyan hover:text-electric-blue transition-colors opacity-0 group-hover:opacity-100 uppercase tracking-tighter"
                  >
                    Receive on this network →
                  </Link>
                </div>
              </div>
            </div>
            <div className="text-right relative z-10">
              <div className="text-sm font-semibold text-text-primary">{chain.amount}</div>
              <div className="text-xs text-text-secondary">{chain.usdValue}</div>
            </div>
            
            {/* Background interactive element */}
            <Link 
              href={`/receive?asset=${chain.symbol.toLowerCase()}&chain=${chain.chainId}`}
              className="absolute inset-0 z-0"
              aria-label={`Receive ${chain.symbol} on ${chain.network}`}
            />
          </div>
        );
      })}
    </div>
  );
}
