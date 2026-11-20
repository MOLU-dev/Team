interface AmountInputProps {
  amount: string;
  onAmountChange: (amount: string) => void;
  maxAmount: string;
  usdValue: string;
  label?: string;
}

export default function AmountInput({ amount, onAmountChange, maxAmount, usdValue, label = 'USD Value' }: AmountInputProps) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          placeholder="0.00"
          className="w-full px-4 py-3 bg-midnight/80 border border-cyan/20 rounded-xl text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-cyan transition-all pr-24"
        />
        <button
          type="button"
          onClick={() => onAmountChange(maxAmount)}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gradient-to-br from-cyan to-electric-blue text-midnight text-xs font-bold rounded-lg hover:scale-105 transition-transform"
        >
          MAX
        </button>
      </div>
      
      <div className="p-4 bg-cyan/5 border border-cyan/20 rounded-xl flex justify-between items-center">
        <span className="text-sm text-text-secondary">{label}</span>
        <span className="font-semibold text-cyan">{usdValue}</span>
      </div>
    </div>
  );
}
