'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Transcription } from '@/lib/types';
import RecordButton from './RecordButton';
import TranscriptionFeed from './TranscriptionFeed';
import Toast from './Toast';

type RecordingMode = { type: 'new' } | { type: 'continue'; id: number };

export default function MainShell() {
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [mode, setMode] = useState<RecordingMode>({ type: 'new' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const showToast = useCallback((msg: string) => setToast(msg), []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/transcriptions');
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          showToast(body.error ?? 'Failed to load');
          return;
        }
        const body = (await res.json()) as { transcriptions: Transcription[] };
        setTranscriptions(body.transcriptions);
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Network error');
      } finally {
        setLoaded(true);
      }
    })();
  }, [showToast]);

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied!');
    } catch {
      showToast('Copy failed');
    }
  }

  async function handleRecorded(blob: Blob, mimeType: string) {
    setIsProcessing(true);
    const form = new FormData();
    form.append('audio', blob, 'recording');
    form.append('mimeType', mimeType);

    const isContinue = mode.type === 'continue';
    const url = isContinue
      ? `/api/transcriptions/${mode.id}`
      : '/api/transcribe';
    const method = isContinue ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, { method, body: form });
      const body = (await res.json().catch(() => ({}))) as
        | Transcription
        | { error?: string };
      if (!res.ok) {
        const msg = (body as { error?: string }).error ?? 'Transcription failed';
        showToast(msg);
        return;
      }
      const entry = body as Transcription;
      setTranscriptions((prev) => {
        const existing = prev.find((t) => t.id === entry.id);
        if (existing) {
          // move updated entry to top
          const others = prev.filter((t) => t.id !== entry.id);
          return [entry, ...others];
        }
        return [entry, ...prev];
      });
      setMode({ type: 'new' });
      try {
        await navigator.clipboard.writeText(entry.text);
        showToast('Copied!');
      } catch {
        showToast('Saved');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this transcription?')) return;
    try {
      const res = await fetch(`/api/transcriptions/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        showToast(body.error ?? 'Delete failed');
        return;
      }
      setTranscriptions((prev) => prev.filter((t) => t.id !== id));
      if (mode.type === 'continue' && mode.id === id) {
        setMode({ type: 'new' });
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Network error');
    }
  }

  const continuingEntry =
    mode.type === 'continue'
      ? transcriptions.find((t) => t.id === mode.id)
      : undefined;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <header className="sticky top-0 z-10 bg-white/90 dark:bg-black/80 backdrop-blur border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
        <h1 className="text-base font-semibold">VoiceText</h1>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {transcriptions.length} {transcriptions.length === 1 ? 'entry' : 'entries'}
        </span>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-40">
        {loaded ? (
          <TranscriptionFeed
            transcriptions={transcriptions}
            continuingId={mode.type === 'continue' ? mode.id : null}
            onCopy={copyText}
            onContinue={(id) => setMode({ type: 'continue', id })}
            onCancelContinue={() => setMode({ type: 'new' })}
            onDelete={handleDelete}
          />
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
            Loading…
          </p>
        )}
      </main>

      <footer className="fixed inset-x-0 bottom-0 bg-white/95 dark:bg-black/90 backdrop-blur border-t border-zinc-200 dark:border-zinc-800 pt-3 pb-6 px-4 flex flex-col items-center gap-2">
        {mode.type === 'continue' && continuingEntry && (
          <button
            type="button"
            onClick={() => setMode({ type: 'new' })}
            className="text-xs px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300"
          >
            Continuing entry #{continuingEntry.id} — tap to cancel
          </button>
        )}
        <RecordButton
          onRecorded={handleRecorded}
          isProcessing={isProcessing}
        />
      </footer>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
