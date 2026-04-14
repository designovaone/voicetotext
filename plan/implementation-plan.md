# Implementation Plan: VoiceText

**Date:** 2026-04-13
**Status:** Draft
**Based on:** PRD-voicetext.md
**Reference architecture:** Charge Recorder II (Next.js 16 + Neon + Vercel)

---

## Architecture

```
Browser (iPhone/Mac)          Vercel (Server)                   OpenRouter
┌──────────────┐       ┌─────────────────────┐      ┌──────────────────────┐
│ MediaRecorder │──────▶│ POST /api/transcribe│─────▶│ Gemini 2.5 Flash     │
│ (audio blob)  │       │   1. convert to WAV │◀─────│ (transcription)      │
│               │       │   2. base64 encode  │─────▶│ Haiku 4.5            │
│               │◀──────│   3. transcribe     │◀─────│ (transform)          │
│ Display result│       │   4. transform      │      └──────────────────────┘
│               │       │   5. save to DB     │
│               │       │ Neon PostgreSQL     │
└──────────────┘       └─────────────────────┘
```

**Single API key:** Both Gemini (transcription) and Haiku (transform) are accessed through
one OpenRouter API key. Keys never leave the server. Browser only sends audio and receives text.

---

## Database Schema

```sql
CREATE TABLE transcriptions (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    segments INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_created_at ON transcriptions(created_at DESC);
```

- `text`: accumulated transformed text (Haiku output)
- `segments`: number of recordings appended to this entry
- `updated_at`: refreshed on each "Continue" append

---

## API Routes

### POST /api/unlock
Passphrase authentication. Sets httpOnly cookie (24h). Same as Charge Recorder.

### POST /api/transcribe
New transcription. Core endpoint.

**Request:** `multipart/form-data` with audio blob
**Flow:**
1. Verify auth
2. Receive audio blob from browser
3. Convert to base64, send to Gemini Flash API for transcription
4. Send raw transcription to OpenRouter (Haiku 4.5) for transform
5. INSERT into `transcriptions` table
6. Return transformed text + id

**Response:**
```json
{
  "id": 1,
  "text": "Hey, can you send me the report by Thursday?",
  "segments": 1,
  "created_at": "2026-04-13T10:32:00Z"
}
```

### PATCH /api/transcriptions/[id]
Continue/append to existing entry.

**Request:** `multipart/form-data` with audio blob
**Flow:**
1. Verify auth
2. Receive audio blob
3. Gemini Flash → Haiku (same as above)
4. UPDATE: append text with newline separator, increment segments, refresh updated_at
5. Return updated entry

**Response:**
```json
{
  "id": 1,
  "text": "Hey, can you send me the report by Thursday?\nAlso remind Sarah about the meeting.",
  "segments": 2,
  "updated_at": "2026-04-13T10:35:00Z"
}
```

### GET /api/transcriptions
List all transcriptions, newest first.

**Response:**
```json
{
  "transcriptions": [
    {
      "id": 2,
      "text": "Draft email to the team...",
      "segments": 1,
      "created_at": "2026-04-13T10:35:00Z",
      "updated_at": "2026-04-13T10:35:00Z"
    }
  ]
}
```

### DELETE /api/transcriptions/[id]
Delete individual entry.

### DELETE /api/transcriptions
Delete all entries.

### GET /api/health
Health check. Returns `{ "status": "ok" }`.

---

## File Structure

```
voicetext/
├── app/
│   ├── layout.tsx              # Root layout + metadata
│   ├── page.tsx                # Main page (auth check → UI)
│   ├── globals.css             # Tailwind styles
│   ├── manifest.json           # PWA manifest (Home Screen icon)
│   └── api/
│       ├── unlock/route.ts         # POST - passphrase auth
│       ├── transcribe/route.ts     # POST - record → Gemini → Haiku → save
│       ├── transcriptions/
│       │   ├── route.ts            # GET (list), DELETE (clear all)
│       │   └── [id]/route.ts       # PATCH (continue), DELETE (single)
│       └── health/route.ts         # GET - health check
├── components/
│   ├── UnlockScreen.tsx        # Passphrase entry
│   ├── RecordButton.tsx        # Mic button + recording state
│   ├── TranscriptionFeed.tsx   # Scrollable list of entries
│   ├── TranscriptionCard.tsx   # Single entry (text, timestamp, actions)
│   └── Toast.tsx               # "Copied!" confirmation
├── lib/
│   ├── db.ts                   # Neon PostgreSQL connection
│   ├── auth.ts                 # Cookie-based auth (same as Charge Recorder)
│   ├── openrouter.ts           # OpenRouter API client (Gemini + Haiku)
│   ├── audio.ts                # Audio format conversion (→ WAV)
│   └── types.ts                # TypeScript interfaces
├── public/
│   └── icon-192.png            # PWA icon
├── next.config.js
├── tsconfig.json
├── package.json
├── schema.sql
└── .env.example
```

---

## Audio Format & Recording Limits

### Browser Recording Formats

| Browser | Default mimeType | Codec | Size per minute |
|---|---|---|---|
| Safari (iPhone/Mac) | `audio/mp4` | AAC | ~1 MB |
| Chrome | `audio/webm` | Opus | ~0.5-1 MB |

### Gemini Supported Audio Formats

Gemini accepts: **WAV, MP3, AAC, OGG, FLAC, AIFF**. Does NOT accept `audio/mp4` or
`audio/webm` containers directly.

**Solution:** Convert to WAV (mono, 16kHz) server-side before sending to Gemini via
OpenRouter. This is the proven pattern used by existing OpenRouter transcription tools.

### Recording Limit: 10 Minutes

| Duration | Safari AAC (upload) | WAV 16kHz (to Gemini) | Gemini tokens | Est. latency |
|---|---|---|---|---|
| 1 min | ~1 MB | ~1.9 MB | 1,920 | ~2-3 sec |
| 2 min | ~2 MB | ~3.8 MB | 3,840 | ~3-5 sec |
| 5 min | ~5 MB | ~9.6 MB | 9,600 | ~5-10 sec |
| **10 min** | **~10 MB** | **~19.2 MB** | **19,200** | **~10-20 sec** |

- Gemini inline audio limit: **20 MB** per request. 10 min WAV at 19.2 MB fits within limit.
- Browser uploads the compressed AAC/Opus (~10 MB for 10 min), server converts to WAV for Gemini.
- Client-side timer enforces 10-minute cap with UI countdown.
- For longer text, use the "Continue" feature across multiple recordings.

### Server-Side Audio Conversion

The `/api/transcribe` route must convert browser audio to WAV before sending to OpenRouter.
Options for Vercel serverless environment:
- `ffmpeg-wasm` (WebAssembly, runs in serverless)
- Extract AAC stream and re-wrap (lighter alternative)
- Or send AAC directly if OpenRouter/Gemini accepts `audio/aac` (test first — may skip conversion)

---

## Key Implementation Details

### Audio Recording (Browser)

```typescript
// MediaRecorder API — works on iPhone Safari (iOS 14.3+)
// Detect best supported format
const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
  ? 'audio/webm;codecs=opus'
  : 'audio/mp4';  // Safari fallback

const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const recorder = new MediaRecorder(stream, { mimeType });
```

- Detect supported mimeType (webm for Chrome, mp4 for Safari)
- Collect chunks, create Blob on stop
- Client-side 10-minute timer with countdown display
- Send as FormData to `/api/transcribe` (include mimeType in form data)

### Transcription via OpenRouter → Gemini Flash (Server)

```typescript
// lib/openrouter.ts
// Single OpenRouter key for both Gemini transcription and Haiku transform

// Step 1: Transcribe with Gemini Flash via OpenRouter
const transcribeResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  headers: {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'google/gemini-2.5-flash',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: 'Transcribe this audio. The speaker has a German accent speaking English.' },
        { type: 'input_audio', input_audio: { data: base64WavAudio, format: 'wav' } }
      ]
    }]
  })
});
```

- Audio converted to WAV (mono, 16kHz) server-side before sending
- Prompt includes accent hint for better accuracy
- Model: `google/gemini-2.5-flash` via OpenRouter

### Transform via OpenRouter → Haiku (Server)

```typescript
// Step 2: Transform with Haiku via same OpenRouter key
const transformResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  headers: {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'anthropic/claude-haiku-4-5-20251001',
    messages: [{
      role: 'user',
      content: `Clean up this transcription. Fix grammar, remove filler words, 
                improve clarity. Keep the original meaning and tone. 
                Return only the cleaned text, nothing else.\n\n${rawText}`
    }]
  })
});
```

### Continue/Append Logic

```sql
UPDATE transcriptions
SET text = text || E'\n' || $1,
    segments = segments + 1,
    updated_at = NOW()
WHERE id = $2
RETURNING *;
```

---

## Environment Variables

```env
# .env.example
NEON_DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
UNLOCK_PHRASE=your-secret-phrase
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-key
```

Single OpenRouter key handles both Gemini Flash (transcription) and Haiku 4.5 (transform).
No separate Gemini API key needed.

---

## Dependencies

```json
{
  "dependencies": {
    "@neondatabase/serverless": "^0.10.0",
    "next": "^16.1.0",
    "react": "^19",
    "react-dom": "^19"
  },
  "devDependencies": {
    "@types/node": "^22",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^5",
    "tailwindcss": "^4.0",
    "postcss": "^8"
  }
}
```

Note: OpenRouter uses standard fetch (OpenAI-compatible REST API), no SDK needed.

---

## Implementation Phases

### Phase 1: Project Setup
- Initialize Next.js 16 project with TypeScript + Tailwind
- Set up Neon database + schema
- Configure environment variables
- Set up lib/db.ts, lib/auth.ts, lib/types.ts

### Phase 2: API Routes
- `/api/unlock` (copy from Charge Recorder, adapt)
- `/api/transcribe` — core: audio → Gemini → Haiku → DB
- `/api/transcriptions` — GET list, DELETE all
- `/api/transcriptions/[id]` — PATCH continue, DELETE single
- `/api/health`
- Implement `lib/gemini.ts` and `lib/openrouter.ts`

### Phase 3: UI Components
- UnlockScreen (adapt from Charge Recorder)
- RecordButton (MediaRecorder + visual state)
- TranscriptionFeed + TranscriptionCard (chat-style feed)
- Toast for clipboard confirmation
- page.tsx wiring everything together

### Phase 4: PWA & Polish
- manifest.json for Home Screen install
- Responsive design (iPhone-first)
- Auto-copy on completion
- Loading/processing states during transcription

### Phase 5: Deploy & Test
- Push to GitHub
- Connect to Vercel
- Set environment variables
- Test on iPhone Safari (critical path)
- Test on Mac browser
- Verify German accent accuracy vs Ottex

---

## Verification Checklist

- [ ] Neon database created with schema
- [ ] All API routes deployed and responding
- [ ] Environment variables set in Vercel
- [ ] Passphrase unlock works
- [ ] Audio recording works on iPhone Safari
- [ ] Audio recording works on Mac browser
- [ ] Gemini transcription returns accurate text for German-accented English
- [ ] Haiku transform cleans up text properly
- [ ] New transcription appears in feed
- [ ] Continue/append to existing entry works
- [ ] Copy to clipboard works on iPhone
- [ ] Delete individual entry works
- [ ] Delete all entries works
- [ ] PWA installable on iPhone Home Screen
- [ ] End-to-end latency acceptable (<5s for short dictations)

---

## Resolved Questions

1. **Single OpenRouter key — YES.** OpenRouter supports Gemini audio input via `input_audio`
   content type. Proven pattern used by multiple tools (openrouter-transcribe skill, etc.).
   Single `OPENROUTER_API_KEY` env var for both Gemini transcription and Haiku transform.

2. **Audio format — Convert to WAV server-side.** Safari produces `audio/mp4` (AAC), Chrome
   produces `audio/webm` (Opus). Gemini accepts WAV, MP3, AAC, OGG, FLAC but not mp4/webm
   containers. Server converts to WAV (mono, 16kHz) before sending to OpenRouter.
   Optimization: test if sending raw AAC stream works to skip conversion.

3. **Recording limit — 10 minutes.** 10 min WAV = ~19.2 MB, fits under Gemini's 20 MB inline
   limit. Browser uploads compressed AAC (~10 MB for 10 min). Client-side timer with countdown.
   "Continue" feature covers any need beyond 10 min.

## Open Questions

4. **Domain:** Confirm naming — `voicetext.coffeit.com` or similar.
5. **Audio conversion library:** Verify best option for Vercel serverless (ffmpeg-wasm vs
   lighter AAC extraction). Test during Phase 2.
