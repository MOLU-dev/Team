'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import api from '@/lib/api';

interface ConnectivityContextType {
  isOnline: boolean;
  isBackendConnected: boolean;
  isChecking: boolean;
}

const ConnectivityContext = createContext<ConnectivityContextType>({
  isOnline: true,
  isBackendConnected: true,
  isChecking: true,
});

export function ConnectivityProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isBackendConnected, setIsBackendConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(true);
  // Require 2 consecutive failures before flagging the backend as down,
  // so a single slow health check (e.g. during bcrypt OTP processing) doesn't
  // unmount the page and reset form state.
  const failureCount = React.useRef(0);
  const FAILURES_BEFORE_DOWN = 2;

  const checkConnectivity = async () => {
    // Check internet connection
    const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
    setIsOnline(online);

    if (!online) {
      failureCount.current = FAILURES_BEFORE_DOWN;
      setIsBackendConnected(false);
      setIsChecking(false);
      return;
    }

    try {
      // Try to reach the backend health endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'}/health`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (response.ok) {
        failureCount.current = 0;
        setIsBackendConnected(true);
      } else {
        failureCount.current += 1;
        if (failureCount.current >= FAILURES_BEFORE_DOWN) {
          setIsBackendConnected(false);
        }
      }
    } catch (error) {
      failureCount.current += 1;
      if (failureCount.current >= FAILURES_BEFORE_DOWN) {
        setIsBackendConnected(false);
      }
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Initial check
    checkConnectivity();

    // Set up event listeners for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      checkConnectivity();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setIsBackendConnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check for backend (every 30 seconds)
    const interval = setInterval(checkConnectivity, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return (
    <ConnectivityContext.Provider value={{ isOnline, isBackendConnected, isChecking }}>
      {children}
    </ConnectivityContext.Provider>
  );
}

export const useConnectivity = () => useContext(ConnectivityContext);
