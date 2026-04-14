'use client';

import type { Transcription } from '@/lib/types';
import TranscriptionCard from './TranscriptionCard';

interface Props {
  transcriptions: Transcription[];
  continuingId: number | null;
  onCopy: (text: string) => void;
  onContinue: (id: number) => void;
  onCancelContinue: () => void;
  onDelete: (id: number) => void;
}

export default function TranscriptionFeed({
  transcriptions,
  continuingId,
  onCopy,
  onContinue,
  onCancelContinue,
  onDelete,
}: Props) {
  if (transcriptions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-500 dark:text-zinc-400 text-sm">
        Tap the mic to record your first transcription.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 pb-4">
      {transcriptions.map((t) => (
        <TranscriptionCard
          key={t.id}
          entry={t}
          isContinuing={continuingId === t.id}
          onCopy={onCopy}
          onContinue={onContinue}
          onCancelContinue={onCancelContinue}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
