'use client';

import type { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import { SWRConfig } from 'swr';
import { MotionConfig } from 'framer-motion';
import { fetcher } from '@/hooks/useFetch';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <SWRConfig value={{ fetcher, dedupingInterval: 4000, errorRetryCount: 2 }}>
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </SWRConfig>
      <Toaster
        position="top-right"
        gutter={10}
        toastOptions={{
          duration: 3500,
          style: {
            background: 'rgba(26, 26, 46, 0.92)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(16px)',
            borderRadius: '14px',
            fontSize: '14px',
            padding: '12px 16px',
          },
          success: { iconTheme: { primary: '#00ff88', secondary: '#0a0a0a' } },
          error: { iconTheme: { primary: '#ff4444', secondary: '#0a0a0a' } },
        }}
      />
    </SessionProvider>
  );
}
