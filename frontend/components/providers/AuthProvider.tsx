'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth, api } from '@/lib/api';
import { User } from '@/lib/api/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (updatedData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// List of routes that don't require authentication
const PUBLIC_ROUTES = ['/', '/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/success', '/auth/username', '/auth/setup-pin'];

const LOG = (...args: any[]) =>
  console.log('%c[Auth]', 'color:#0ff;font-weight:bold', ...args);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const logout = useCallback(() => {
    LOG('logout() called — clearing session and redirecting to /auth/login');
    auth.removeToken();
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    router.push('/auth/login');
  }, [router]);

  const login = useCallback((token: string, userData: User) => {
    LOG('login() called for user:', userData?.email ?? userData?.username);
    auth.setToken(token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    if (userData.has_pin === false) {
      LOG('User has not set PIN before → redirecting to /auth/setup-pin');
      router.push('/auth/setup-pin');
    } else {
      router.push('/dashboard');
    }
  }, [router]);

  const updateUser = useCallback((updatedData: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updatedData };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await api.validateSession();
      if (response.success && response.user) {
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      LOG('initAuth() start — pathname:', pathname);
      try {
        const token = auth.getToken();
        const storedUser = localStorage.getItem('user');

        LOG('token present:', !!token, '| storedUser present:', !!storedUser);

        if (!token) {
          LOG('No token found — skipping validation, marking not authenticated');
          setIsLoading(false);
          return;
        }

        // Restore from local cache first so the UI is immediately usable
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            LOG('Restored user from localStorage cache:', parsed?.email ?? parsed?.username);
            setUser(parsed);
            setIsAuthenticated(true);
          } catch {
            LOG('Failed to parse stored user JSON — ignoring cache');
          }
        }

        LOG('Calling api.validateSession()...');
        try {
          const response = await api.validateSession();
          LOG('validateSession() response:', { success: response.success, hasUser: !!response.user });
          if (response.success && response.user) {
            setIsAuthenticated(true);
            setUser(response.user);
            localStorage.setItem('user', JSON.stringify(response.user));
            LOG('Session valid — user authenticated:', response.user?.email ?? response.user?.username);
          } else {
            LOG('Server rejected session (success=false) — logging out');
            logout();
          }
        } catch (err) {
          // Network error (backend compiling / unreachable) — keep the
          // locally-cached session alive so the user isn't bounced out.
          LOG('validateSession() network error — keeping cached session alive. Error:', err);
        }
      } catch (error) {
        console.error('[Auth] Unexpected error in initAuth:', error);
      } finally {
        LOG('initAuth() done — isLoading → false');
        setIsLoading(false);
      }
    };

    initAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for session expiry events from the API client (401 responses)
  useEffect(() => {
    const handleExpired = () => {
      LOG('Received auth:session-expired event — logging out');
      setUser(null);
      setIsAuthenticated(false);
      router.push('/auth/login');
    };
    window.addEventListener('auth:session-expired', handleExpired);
    return () => window.removeEventListener('auth:session-expired', handleExpired);
  }, [router]);

  // Handle protected route redirection
  useEffect(() => {
    if (!isLoading) {
      const isPublicRoute = PUBLIC_ROUTES.some(route => pathname === route);
      LOG(
        `Route guard — pathname: "${pathname}" | isAuthenticated: ${isAuthenticated} | isPublicRoute: ${isPublicRoute}`
      );

      if (!isAuthenticated && !isPublicRoute) {
        LOG(`Not authenticated on protected route "${pathname}" → redirecting to /auth/login`);
        router.push('/auth/login');
      } else if (isAuthenticated) {
        if (user && user.has_pin === false && pathname !== '/auth/setup-pin') {
          LOG(`User has not configured PIN → redirecting to /auth/setup-pin`);
          router.push('/auth/setup-pin');
        } else if (user && user.has_pin === true && (pathname === '/auth/login' || pathname === '/auth/setup-pin')) {
          LOG(`Authenticated with PIN on "${pathname}" → redirecting to /dashboard`);
          router.push('/dashboard');
        } else if (pathname === '/auth/login') {
          router.push('/dashboard');
        } else {
          LOG(`Route guard — no redirect needed`);
        }
      }
    } else {
      LOG(`Route guard skipped — still loading (pathname: "${pathname}")`);
    }
  }, [isAuthenticated, isLoading, pathname, router, user]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, refreshUser, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
