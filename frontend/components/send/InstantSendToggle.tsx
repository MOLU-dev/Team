'use client';

interface InstantSendToggleProps {
  instantSend: boolean;
  onToggle: (enabled: boolean) => void;
}

export default function InstantSendToggle({ instantSend, onToggle }: InstantSendToggleProps) {
  return (
    <div className="mb-8 pb-6 border-b border-border">
      <div className="flex items-center justify-between p-4 bg-sky-500/5 border border-sky-500/20 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className={`p-2 rounded-xl ${instantSend ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/40' : 'bg-sky-500/10 text-sky-400'} transition-all duration-300`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-bold text-text-primary">InstantSend</h4>
            <p className="text-xs text-text-secondary">Near-instant transaction finality</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onToggle(!instantSend)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            instantSend ? 'bg-sky-500' : 'bg-white/10'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              instantSend ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
