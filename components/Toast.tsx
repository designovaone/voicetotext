'use client';

import { useEffect } from 'react';

interface Props {
  message: string | null;
  onDismiss: () => void;
  durationMs?: number;
}

export default function Toast({ message, onDismiss, durationMs = 1500 }: Props) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(t);
  }, [message, durationMs, onDismiss]);

  if (!message) return null;

  return (
    <div className="fixed inset-x-0 bottom-32 flex justify-center pointer-events-none z-50">
      <div className="pointer-events-auto px-4 py-2 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm shadow-lg">
        {message}
      </div>
    </div>
  );
}
