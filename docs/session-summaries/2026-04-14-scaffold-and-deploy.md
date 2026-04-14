# 2026-04-14 — Scaffold, API, UI, first deploy

## Goal
Review the implementation plan, verify risky assumptions, then build VoiceText end-to-end (scaffold → API → UI → Vercel preview).

## Done
- **Plan review** via `critic` agent surfaced three blockers: unverified OpenRouter `input_audio` support, wrong Haiku slug, ffmpeg-wasm risk on Vercel.
- **Pre-coding spike** (three curls against OpenRouter):
  - Gemini 2.5 Flash transcribes WAV/MP4/M4A/AAC directly via `input_audio` — no conversion needed.
  - Correct Haiku slug is `anthropic/claude-haiku-4.5` (no date suffix).
  - Haiku cleanup works, ~3.9s latency, ~$0.0002/call.
- **Plan updated** with findings: dropped `lib/audio.ts`, noted Vercel Pro plan required for 10-min recordings (Hobby's 10s timeout is too short).
- **Phase 1 scaffold** (engineer agent): Next.js 16 + Tailwind 4, `schema.sql` applied to Neon, `lib/{db,auth,openrouter,types}.ts`. HMAC-signed cookie auth with constant-time compare.
- **Phase 2 API** (engineer agent): `health`, `unlock`, `transcribe`, `transcriptions` list/delete-all, `transcriptions/[id]` patch/delete. `runtime='nodejs'` + `maxDuration=60` on audio routes.
- **End-to-end curl test:** unlock → transcribe WAV → list → PATCH append (M4A) → delete — all green.
- **Phase 3 UI** (engineer agent): `UnlockScreen`, `RecordButton` (MediaRecorder, 10-min countdown, mic/stop glyphs), `TranscriptionFeed`, `TranscriptionCard` (copy/continue/delete), `Toast`, `MainShell` client boundary, PWA manifest + icon.
- **Vercel deploy:** linked to existing `voicetotext` project, discovered framework preset was "Other" causing silent 404s, added `vercel.json` with `"framework": "nextjs"`. Preview live, user confirmed working on iPhone.
- **README** rewritten with personal motivation, architecture diagram, API table, cost note.
- **Pushed to `main`:** `f466150` (scaffold + routes + UI) and `bc8d115` (README intro).

## Decisions
- **Spike before code.** Three curls saved us from building around `ffmpeg-wasm` and a wrong model slug. Worth the 10 minutes every time.
- **No server-side audio conversion.** Safari MP4/AAC forwards to Gemini as-is. Eliminates ffmpeg-wasm and its cold-start/memory risk on Vercel.
- **Single `MainShell` client component** wrapping the main view, with `app/page.tsx` staying a server component for the auth check. Keeps the server/client boundary clean.
- **`confirm()` on delete.** Single-tap delete felt too easy to misfire on mobile. Kept as the guard; flag if we want it removed later.
- **Vercel preview over local HTTPS for iPhone testing.** mkcert fallback failed (needs sudo), tunnel tools not installed. Deploying to Vercel preview is the right answer anyway — HTTPS out of the box, closer to production.
- **Deployment protection off for previews** (user toggled) — acceptable because the passphrase gate is the real guard, and `UNLOCK_PHRASE` is the only thing between a visitor and cost exposure.

## Blockers / Open issues
- **Chrome webm/opus not verified** on Gemini via OpenRouter. Local environment had no opus encoder. Test in-browser on Mac Chrome next session.
- **No rate limiting / cost cap in app.** Public URL + single passphrase = theoretical cost blast if passphrase leaks. Mitigate via OpenRouter dashboard monthly cap; consider a crude per-IP rate limit in `/api/transcribe` later.
- **No raw-transcription logging.** If German-accent quality regresses, we can't compare Gemini raw vs Haiku-cleaned output. Critic flagged adding a nullable `raw_text` column.
- **German-accent quality not A/B tested vs Ottex.** Need reference clips saved + compared.
- **iPhone PWA Home Screen install** not yet confirmed. User confirmed in-browser works; Home Screen install is Phase 4 territory.
- **`confirm()` delete UX** may feel heavy — revisit after real usage.

## Next steps
1. iPhone PWA Home Screen install test (manifest already in place).
2. German-accent quality spot-check on 3-5 real dictations vs Ottex Mac.
3. Verify Chrome webm support with a real recording on Mac Chrome.
4. Decide on rate limit + cost cap strategy.
5. Consider adding `raw_text` column for observability.
6. Production deploy: `vercel --prod`.
7. Domain decision (`voicetext.coffeit.com`?).
