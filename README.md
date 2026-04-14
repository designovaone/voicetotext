# VoiceText

As a non-native English speaker with a German accent, I've always struggled with voice-to-text recognition. Recently I tried a Mac/iPhone tool that used Gemini for transcription and Haiku for text cleanup through a BYOK key — it worked remarkably well. Over the 90 days I could use it on my iPhone, I paid pennies for near-perfect voice-to-text conversion.

What I especially liked was routing both models through a single API key via OpenRouter. When that tool's TestFlight window expired and I couldn't find a replacement that combined these models behind one provider, I decided to build my own.

Happy talking.

## How it works

```
Browser (MediaRecorder)
    │  audio/mp4 blob
    ▼
POST /api/transcribe  ──▶  OpenRouter
                            ├─ google/gemini-2.5-flash  (transcribe)
                            └─ anthropic/claude-haiku-4.5  (clean up)
    │
    ▼
Neon Postgres  (transcriptions table)
```

No server-side audio conversion: Gemini accepts `mp4`/`m4a`/`aac` directly through OpenRouter's `input_audio` content type.

## Features

- Record up to 10 minutes per segment, or use **Continue** to append another recording to an existing entry.
- Auto-copy transcribed text to clipboard on completion.
- Single-user passphrase gate, HMAC-signed cookie.
- Installable as a PWA on iPhone Home Screen.

## Stack

- Next.js 16 (App Router) on Vercel
- Neon Postgres via `@neondatabase/serverless`
- OpenRouter (`google/gemini-2.5-flash` + `anthropic/claude-haiku-4.5`)
- Tailwind v4

## Local development

```bash
npm install
npm run dev
```

Requires `.env.local`:

```env
NEON_DATABASE_URL=postgresql://...
UNLOCK_PHRASE=your-passphrase
OPENROUTER_API_KEY=sk-or-v1-...
```

Apply the schema once:

```bash
psql "$NEON_DATABASE_URL" -f schema.sql
```

## iPhone / mobile testing

`getUserMedia` requires HTTPS in Safari (localhost is exempt). For testing over Wi-Fi, deploy to a Vercel preview — `vercel` CLI handles certs automatically.

## API

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/unlock` | `{phrase}` → sets `vt_session` cookie |
| `POST` | `/api/transcribe` | multipart (`audio`, `mimeType`) → new entry |
| `PATCH` | `/api/transcriptions/[id]` | multipart → append segment |
| `GET` | `/api/transcriptions` | list all, newest first |
| `DELETE` | `/api/transcriptions/[id]` | delete one |
| `DELETE` | `/api/transcriptions` | delete all |
| `GET` | `/api/health` | health check |

## Deploy

```bash
vercel            # preview
vercel --prod     # production
```

Env vars are set in the Vercel project dashboard (Development / Preview / Production).

## Cost

Verified via spike: ~$0.0003 per short dictation (transcribe + cleanup). A $5/month OpenRouter cap is ample headroom for personal use.

## License

MIT — see `LICENSE`.
