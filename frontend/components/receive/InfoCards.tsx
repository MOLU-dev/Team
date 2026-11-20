export default function InfoCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Confirmations */}
      <div className="p-4 bg-deep-navy/40 border border-cyan/10 rounded-xl text-center">
        <svg className="w-7 h-7 text-cyan mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <div className="text-sm font-semibold text-text-primary mb-1">Confirmations</div>
        <div className="text-xs text-text-secondary">12 blocks</div>
      </div>

      {/* Estimated Time */}
      <div className="p-4 bg-deep-navy/40 border border-cyan/10 rounded-xl text-center">
        <svg className="w-7 h-7 text-cyan mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
        <div className="text-sm font-semibold text-text-primary mb-1">Est. Time</div>
        <div className="text-xs text-text-secondary">1-2 minutes</div>
      </div>

      {/* Minimum Amount */}
      <div className="p-4 bg-deep-navy/40 border border-cyan/10 rounded-xl text-center">
        <svg className="w-7 h-7 text-cyan mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
        <div className="text-sm font-semibold text-text-primary mb-1">Min. Amount</div>
        <div className="text-xs text-text-secondary">0.001 ETH</div>
      </div>
    </div>
  );
}
