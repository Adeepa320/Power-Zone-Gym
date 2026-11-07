'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="glass max-w-md rounded-3xl p-10 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/15 text-danger">
          <AlertTriangle className="h-7 w-7" />
        </span>
        <h2 className="mt-5 text-xl font-bold">Something went wrong</h2>
        <p className="mt-2 text-sm text-muted">An unexpected error occurred. Please try again.</p>
        <Button className="mt-6" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}
