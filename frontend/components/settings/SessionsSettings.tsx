'use client';

export default function SessionsSettings() {
  const signOutDevice = (device: string) => {
    if (confirm(`Sign out from ${device}?`)) {
      alert(`Signed out from ${device}`);
    }
  };

  const signOutAllSessions = () => {
    if (confirm('Sign out from all other devices?')) {
      alert('Signed out from all other devices');
    }
  };

  return (
    <div className="bg-gradient-to-br from-deep-navy/60 to-slate/40 border border-cyan/20 rounded-2xl p-6">
      <h2 className="text-2xl font-bold text-text-primary mb-2">Active Sessions</h2>
      <p className="text-text-secondary mb-6">Manage devices where you&apos;re currently logged in</p>

      <div className="space-y-4">
        {/* Current Device */}
        <div className="p-4 bg-midnight/80 border border-cyan/20 rounded-xl">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
                <span className="font-semibold text-text-primary">MacBook Pro • Chrome</span>
              </div>
              <p className="text-sm text-text-secondary">San Francisco, CA • Active now</p>
            </div>
            <span className="px-3 py-1 bg-success/10 border border-success/30 text-success text-xs font-bold rounded-full">
              Current Device
            </span>
          </div>
        </div>

        {/* iPhone */}
        <div className="p-4 bg-midnight/80 border border-cyan/20 rounded-xl">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                  <line x1="12" y1="18" x2="12.01" y2="18"></line>
                </svg>
                <span className="font-semibold text-text-primary">iPhone 15 Pro • Safari</span>
              </div>
              <p className="text-sm text-text-secondary">San Francisco, CA • 2 hours ago</p>
            </div>
            <button
              onClick={() => signOutDevice('iPhone 15 Pro')}
              className="px-3 py-1.5 bg-danger/10 border border-danger/30 text-danger text-sm font-semibold rounded-lg hover:bg-danger/20 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Windows PC */}
        <div className="p-4 bg-midnight/80 border border-cyan/20 rounded-xl">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
                <span className="font-semibold text-text-primary">Windows PC • Edge</span>
              </div>
              <p className="text-sm text-text-secondary">New York, NY • 3 days ago</p>
            </div>
            <button
              onClick={() => signOutDevice('Windows PC')}
              className="px-3 py-1.5 bg-danger/10 border border-danger/30 text-danger text-sm font-semibold rounded-lg hover:bg-danger/20 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Sign Out All */}
        <button
          onClick={signOutAllSessions}
          className="w-full mt-6 py-3 bg-danger/10 border border-danger/30 text-danger font-bold rounded-xl hover:bg-danger/20 transition-colors"
        >
          Sign Out All Other Sessions
        </button>
      </div>
    </div>
  );
}
