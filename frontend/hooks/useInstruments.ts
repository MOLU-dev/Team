'use client';

import { useState, useEffect } from 'react';
import { tradingApi } from '@/lib/api/trading';

export function useInstruments() {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [instruments, setInstruments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInstruments = async () => {
      try {
        const data = await tradingApi.listInstruments();
        setInstruments(data);
        setSymbols(data.map((i: any) => i.symbol));
      } catch (err) {
        console.error('Failed to fetch instruments', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInstruments();
  }, []);

  return { symbols, instruments, isLoading };
}
