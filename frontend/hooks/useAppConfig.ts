'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface AppConfig {
  env: string;
  is_testnet: boolean;
}

let cachedConfig: AppConfig | null = null;

export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig | null>(cachedConfig);
  const [isLoading, setIsLoading] = useState(!cachedConfig);

  useEffect(() => {
    if (cachedConfig) return;

    async function fetchConfig() {
      try {
        const response = await api.getAppConfig();
        if (response.success) {
          const newConfig = { env: response.env, is_testnet: response.is_testnet };
          cachedConfig = newConfig;
          setConfig(newConfig);
        }
      } catch (err) {
        console.error('Failed to fetch app config', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchConfig();
  }, []);

  return { config, isLoading };
}
