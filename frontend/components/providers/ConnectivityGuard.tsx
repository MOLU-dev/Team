'use client';

import React from 'react';
import { useConnectivity } from './ConnectivityProvider';
import ConnectivityError from '@/components/shared/ConnectivityError';

export function ConnectivityGuard({ children }: { children: React.ReactNode }) {
  const { isOnline, isBackendConnected } = useConnectivity();

  // IMPORTANT: We render children even when the backend is unreachable.
  // ConnectivityError uses `fixed inset-0 z-[9999]` so it visually covers the page,
  // but children remain mounted — preserving multi-step form state (e.g. OTP flow)
  // so the user can continue immediately when connectivity is restored.
  return (
    <>
      {children}
      {!isOnline && <ConnectivityError type="internet" />}
      {isOnline && !isBackendConnected && <ConnectivityError type="backend" />}
    </>
  );
}
