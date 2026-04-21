'use client';

import { useEffect, useRef, useState } from 'react';

const MAX_SECONDS = 10 * 60;

type Status = 'idle' | 'recording' | 'processing';

interface Props {
  onRecorded: (blob: Blob, mimeType: string) => void | Promise<void>;
  onCancel?: () => void;
  isProcessing: boolean;
  disabled?: boolean;
}

function pickMimeType(): string {
  if (
    typeof MediaRecorder !== 'undefined' &&
    MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
  ) {
    return 'audio/webm;codecs=opus';
  }
  return 'audio/mp4';
}

function fmt(seconds: number): string {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

export default function RecordButton({
  onRecorded,
  onCancel,
  isProcessing,
  disabled,
}: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const [remaining, setRemaining] = useState(MAX_SECONDS);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeRef = useRef<string>('');
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (isProcessing) setStatus('processing');
    else if (status === 'processing') setStatus('idle');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProcessing]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function cleanupStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      mimeRef.current = mimeType;
      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        if (cancelledRef.current) {
          cancelledRef.current = false;
          chunksRef.current = [];
          cleanupStream();
          setRemaining(MAX_SECONDS);
          setStatus('idle');
          onCancel?.();
          return;
        }
        const blob = new Blob(chunksRef.current, { type: mimeRef.current });
        cleanupStream();
        setRemaining(MAX_SECONDS);
        setStatus('processing');
        try {
          await onRecorded(blob, mimeRef.current);
        } finally {
          // parent will flip isProcessing; effect above will reset to idle
        }
      };
      recorder.start();
      setStatus('recording');
      setRemaining(MAX_SECONDS);
      const startedAt = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        const left = MAX_SECONDS - elapsed;
        setRemaining(left);
        if (left <= 0) stop();
      }, 250);
    } catch (err) {
      cleanupStream();
      setStatus('idle');
      setError(
        err instanceof Error ? err.message : 'Microphone access failed',
      );
    }
  }

  function stop() {
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') {
      rec.stop();
    }
  }

  function cancel() {
    if (status !== 'recording') return;
    cancelledRef.current = true;
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') {
      rec.stop();
    }
  }

  useEffect(() => {
    if (status !== 'recording') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const recording = status === 'recording';
  const processing = status === 'processing';

  function onClick() {
    if (disabled) return;
    if (recording) stop();
    else if (!processing) start();
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {recording && (
        <p className="text-sm tabular-nums text-zinc-600 dark:text-zinc-400">
          {fmt(remaining)}
        </p>
      )}
      {processing && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Transcribing…</p>
      )}
      <div className="flex items-center gap-6">
        {recording && (
          <button
            type="button"
            onClick={cancel}
            aria-label="Cancel recording"
            className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 transition-transform active:scale-95 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800"
          >
            <svg
              viewBox="0 0 24 24"
              width="22"
              height="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 6 L18 18 M6 18 L18 6" />
            </svg>
          </button>
        )}
        <button
          type="button"
          onClick={onClick}
          disabled={disabled || processing}
          aria-label={recording ? 'Stop recording' : 'Start recording'}
          className={[
            'w-20 h-20 rounded-full flex items-center justify-center transition-transform active:scale-95',
            'shadow-lg',
            recording
              ? 'bg-red-600 animate-pulse'
              : processing
                ? 'bg-zinc-400'
                : 'bg-zinc-900 dark:bg-zinc-100',
            disabled ? 'opacity-50' : '',
          ].join(' ')}
        >
          <svg
            viewBox="0 0 24 24"
            width="32"
            height="32"
            fill="none"
            stroke={recording || processing ? 'white' : 'currentColor'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={recording || processing ? '' : 'text-white dark:text-zinc-900'}
          >
            {recording ? (
              <rect x="7" y="7" width="10" height="10" rx="1.5" fill="white" stroke="white" />
            ) : (
              <>
                <rect x="9" y="3" width="6" height="12" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0" />
                <line x1="12" y1="18" x2="12" y2="22" />
              </>
            )}
          </svg>
        </button>
      </div>
    </div>
  );
}
