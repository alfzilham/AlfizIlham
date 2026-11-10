'use client';

import { Button } from '@/components/ui/button';

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="glass mx-auto mt-10 flex max-w-lg flex-col items-center gap-4 rounded-[24px] p-8 text-center">
      <h1 className="font-display text-2xl font-bold">Something went wrong</h1>
      <p className="text-sm text-muted">
        The page could not load. Check the database connection and try again.
        {error.digest ? ` Reference: ${error.digest}` : ''}
      </p>
      <Button variant="primary" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
