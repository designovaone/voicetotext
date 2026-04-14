'use client';

import type { Transcription } from '@/lib/types';

interface Props {
  entry: Transcription;
  isContinuing: boolean;
  onCopy: (text: string) => void;
  onContinue: (id: number) => void;
  onCancelContinue: () => void;
  onDelete: (id: number) => void;
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.floor((Date.now() - then) / 1000);
  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const m = Math.floor(diffSec / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function TranscriptionCard({
  entry,
  isContinuing,
  onCopy,
  onContinue,
  onCancelContinue,
  onDelete,
}: Props) {
  return (
    <article
      className={[
        'rounded-2xl p-4 border transition-colors',
        isContinuing
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900',
      ].join(' ')}
    >
      <p className="whitespace-pre-wrap text-[15px] leading-6 text-zinc-900 dark:text-zinc-100">
        {entry.text}
      </p>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
        <span>
          {relativeTime(entry.updated_at)}
          {entry.segments > 1 && ` · ${entry.segments} segments`}
        </span>
      </div>
      <div className="mt-3 flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => onCopy(entry.text)}
          className="min-h-11 px-4 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm font-medium active:bg-zinc-200 dark:active:bg-zinc-700"
        >
          Copy
        </button>
        {isContinuing ? (
          <button
            type="button"
            onClick={onCancelContinue}
            className="min-h-11 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium active:bg-blue-700"
          >
            Cancel continue
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onContinue(entry.id)}
            className="min-h-11 px-4 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-sm font-medium active:bg-zinc-200 dark:active:bg-zinc-700"
          >
            Continue
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(entry.id)}
          className="min-h-11 px-4 rounded-lg text-red-600 dark:text-red-400 text-sm font-medium active:bg-red-50 dark:active:bg-red-950/40"
        >
          Delete
        </button>
      </div>
    </article>
  );
}
