'use client';

import { useAuth } from '@/components/providers/AuthProvider';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-midnight">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-cyan border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // AuthProvider handles the redirect for us
    return null;
  }

  return <>{children}</>;
}
