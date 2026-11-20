'use client';

import { toast } from 'sonner';
import { ApiError } from '@/lib/api/client';

export function useNotify() {
  const success = (message: string, description?: string) => {
    toast.success(message, { description });
  };

  const error = (message: string | unknown, description?: string) => {
    let errorMessage = 'Something went wrong';
    let errorDescription = description;

    if (typeof message === 'string') {
      errorMessage = message;
    } else if (message instanceof ApiError) {
      errorMessage = message.message;
      errorDescription = message.data?.error || message.data?.message || errorDescription;
    } else if (message instanceof Error) {
      errorMessage = message.message;
    }

    toast.error(errorMessage, { description: errorDescription });
  };

  const info = (message: string, description?: string) => {
    toast.info(message, { description });
  };

  const warning = (message: string, description?: string) => {
    toast.warning(message, { description });
  };

  return {
    success,
    error,
    info,
    warning,
    toast, // Re-export raw toast for advanced usage
  };
}
