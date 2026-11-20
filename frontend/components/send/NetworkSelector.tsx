interface Network {
  id: string;
  name: string;
  badge: string;
  icon: React.ReactNode;
}

interface NetworkSelectorProps {
  networks: Network[];
  selectedNetwork: string;
  onSelect: (network: string) => void;
}

export default function NetworkSelector({ networks, selectedNetwork, onSelect }: NetworkSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      {networks.map((network) => (
        <button
          key={network.id}
          type="button"
          onClick={() => onSelect(network.id)}
          className={`p-4 border-2 rounded-xl flex items-center gap-4 transition-all text-left ${
            selectedNetwork === network.id
              ? 'border-cyan bg-cyan/10 ring-1 ring-cyan/50'
              : 'border-cyan/10 hover:border-cyan/30 hover:bg-white/5'
          }`}
        >
          <div className="w-10 h-10 text-text-secondary flex items-center justify-center bg-card-bg rounded-lg border border-border p-2">
            {network.icon}
          </div>
          <div className="flex-1">
             <div className="font-bold text-text-primary text-sm sm:text-base">{network.name}</div>
             <div className="text-[10px] sm:text-xs text-text-secondary font-medium uppercase tracking-wider">{network.badge} network</div>
          </div>
          {selectedNetwork === network.id && (
            <div className="w-6 h-6 bg-cyan rounded-full flex items-center justify-center text-midnight">
               <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
               </svg>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
