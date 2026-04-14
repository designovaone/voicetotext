# Product Requirements: VoiceText

**Date:** 2026-04-13
**Status:** Draft

---

## Problem

Ottex AI was the ideal voice-to-text tool — it used Gemini 3 Flash for transcription (excellent with German-accented English) and Haiku 4.5 via OpenRouter for smart text transformation, all through a single BYOK API key. Ottex's iPhone version hit its 90-day TestFlight limit and is no longer usable. The Mac version still works.

No existing iPhone app or web service replicates Ottex's workflow:
- No app supports Gemini as a voice transcription model via BYOK on iOS
- No app supports OpenRouter as a unified API key provider on iOS
- The combination of Gemini (voice) + Haiku (transform) is what makes transcription accurate for German-accented English — Gemini's multimodal LLM architecture understands context, not just acoustics

## Solution

A personal web application deployed on Vercel that replicates the Ottex workflow:
1. Record voice in the browser
2. Transcribe via Gemini 3 Flash API (handles German accent)
3. Transform/enhance via Haiku 4.5 on OpenRouter (smart text cleanup)
4. Persist results in a database

Works on any device with a browser — iPhone, iPad, Mac — with no app store dependency.

---

## User

Richard — native German speaker using voice-to-text primarily in English. Accent accuracy is the critical success metric. Daily user of voice dictation for messages, emails, and notes across iPhone and Mac.

---

## Core Workflow

1. Open web app on iPhone (saved to Home Screen) or in any browser
2. Authenticate with passphrase (stays logged in 24h)
3. Tap record, speak naturally in English
4. Audio is sent to server, transcribed by Gemini Flash, transformed by Haiku
5. Result appears as a new entry in a scrolling feed
6. Tap to copy text, paste into any app

---

## Features

### F1: Voice Recording
- Single "Record" button, tap to start, tap to stop
- Visual feedback while recording (color change, animation)
- **10-minute maximum** per recording with countdown timer
- Works on iPhone Safari (MediaRecorder API, requires HTTPS — provided by Vercel)

### F2: Transcription (Gemini 3 Flash)
- Audio sent to server-side API route
- Server calls Gemini Flash API with audio for transcription
- Optimized for German-accented English via Gemini's contextual understanding
- API key stored as Vercel environment variable, never exposed to browser

### F3: Text Transform (Haiku 4.5 via OpenRouter)
- Raw transcription passed to Haiku for cleanup and formatting
- Removes filler words, fixes grammar, improves clarity
- Preserves meaning and intent
- OpenRouter API key stored as Vercel environment variable

### F4: Transcription Feed
- Each completed transcription appears as a card in a scrollable list
- Newest entries at the top
- Each card shows:
  - Transformed text
  - Timestamp
  - Number of segments (if continued)
  - Copy button
  - Continue button
  - Delete button

### F5: Continue Recording
- Tap "Continue" on any existing entry to append more text
- New audio is transcribed and transformed, then appended to that entry
- Segment count increments
- `updated_at` timestamp refreshes
- Enables building up longer text across multiple dictation bursts

### F6: Copy to Clipboard
- Tap "Copy" on any entry to copy its full text
- Visual confirmation (toast or button state change)
- Auto-copy most recent transcription to clipboard on completion

### F7: Delete Entries
- Delete individual entries
- Option to clear all entries

### F8: Authentication
- Simple passphrase protection (same pattern as Charge Recorder)
- httpOnly cookie, 24-hour session
- Protects API keys and personal transcriptions

---

## Non-Features (Explicitly Out of Scope)

- No real-time streaming transcription (record-then-transcribe, like Ottex)
- No system-wide keyboard injection (web app limitation, use copy-paste)
- No file upload transcription
- No multi-language switching within a single recording
- No user accounts or multi-user support
- No export/CSV (can be added later if needed)
- No offline mode (requires API calls to Gemini and OpenRouter)

---

## Platform & Access

| Aspect | Detail |
|---|---|
| Primary device | iPhone (Safari) |
| Secondary device | Mac Mini M4 (any browser) |
| Hosting | Vercel |
| Domain | TBD (e.g., voicetext.coffeit.com) |
| Access | PWA — add to iPhone Home Screen |
| HTTPS | Automatic via Vercel (required for microphone access) |

---

## API Keys Required

| Key | Provider | Purpose | Where stored |
|---|---|---|---|
| OpenRouter API key | openrouter.ai | Both Gemini Flash transcription AND Haiku 4.5 transform | Vercel env var |

**Confirmed:** Single OpenRouter key handles both models. Gemini audio input is supported via
OpenRouter's `input_audio` content type. No separate Gemini API key needed.

---

## Success Criteria

1. German-accented English transcription quality matches or approaches Ottex
2. End-to-end latency under 5 seconds for short dictations (1-2 min), under 20 seconds for max-length (10 min)
3. Works reliably on iPhone Safari (Home Screen PWA)
4. Transcriptions persist across sessions
5. Continue-recording feature works smoothly for building longer text

---

## Tech Stack (Proven)

Same architecture as Charge Recorder II:
- Next.js 16 (App Router) + React 19 + TypeScript
- Neon PostgreSQL
- Tailwind CSS 4
- Vercel deployment

See separate implementation plan for technical details.
