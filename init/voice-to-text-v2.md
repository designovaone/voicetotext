# Voice-to-Text for German-Accented English

**Date:** 2026-03-04 | **Updated:** 2026-03-05
**Status:** Active - using Ottex AI

---

## Current Setup (iPhone + Mac)

| Setting | Value |
|---------|-------|
| **App** | Ottex AI (free, BYOK) |
| **Voice Model** | Gemini 3 Flash |
| **Transform Model** | Claude Haiku 4.5 (via OpenRouter) |
| **Cost** | ~$1-3/month |
| **Platforms** | Mac Mini M4 + iPhone (TestFlight beta) |

### Findings (2026-03-05)

- **English transcription:** works well with German accent
- **German transcription (voice to German text):** 100% correct, but noticeably slower
- **No live streaming:** Ottex uses record-then-transcribe; text appears after you stop speaking
- **Workflow tip:** use short dictation bursts, review, then continue
- **GPT-OSS-120B:** tested as transform model but has poor German support ([user reports](https://huggingface.co/openai/gpt-oss-120b/discussions/19)); switched to Haiku
- **Revisit German speed** in future updates

---

## Problem

Apple's built-in dictation (iPhone + Mac) performs poorly with German-accented English. Wispr Flow ($15/mo, $144/yr) works well but is expensive. Need an affordable solution that handles accented speech reliably on both Mac Mini M4 and iPhone.

## Key Insight

Cloud-based transcription consistently outperforms local models for non-native accents. However, research shows German-accented English specifically performs well with Whisper models -- even outperforming British English in academic benchmarks (JASA Express Letters, 2024).

---

## Recommended Solution: Ottex AI

**Best fit for: affordable, cloud-quality accuracy, Mac + iPhone, no commitment**

### What It Is

System-wide voice dictation app using BYOK (Bring Your Own Key) model. You connect your own OpenRouter API key and pay only for actual usage.

### Cost

| Item | Cost |
|------|------|
| Ottex app | Free |
| OpenRouter API key | Free to create |
| Usage (~30-60 min/day) | ~$1-3/month |
| **Total** | **~$1-3/month** |

### How to Set Up

**Mac:**
1. Download from ottex.ai
2. Create API key at openrouter.ai/keys, add $5 credit
3. Paste key into Ottex settings (stored in macOS Keychain, never leaves device)
4. Press **Option+D** to start dictating -- works wherever your cursor is

**iPhone:**
- Currently in beta via TestFlight
- Uses same OpenRouter key

### Voice Commands

| Command | Action |
|---------|--------|
| "scratch that" | Delete last dictated text |
| "actually" | Rephrase what you just said |
| "new paragraph" | Insert paragraph break |
| "open quote" / "close quote" | Insert quotes |
| "em dash" | Insert em dash |
| "ellipsis" | Insert ellipsis |
| "Ottex start [instruction] Ottex end" | Inline AI action (e.g. "fix grammar", "translate to Spanish") |

### Key Features

- **Context-aware formatting** -- detects which app you're in (code style in Cursor, casual in Slack, professional in Mail)
- **Filler word removal** -- strips "um", "uh", "like" automatically
- **AI shortcuts** -- select text, trigger shortcut to fix grammar, translate, improve writing
- **Choose your AI backend** -- Gemini, Whisper, OpenRouter
- **Privacy** -- API keys stored in macOS Keychain, requests go directly to provider
- **Custom shortcuts** -- define text expansions (e.g. "work signature" expands to full signature)

---

## Backup Option: OpenWhispr (Free, Local, Mac Only)

**Best fit for: zero cost, full privacy, offline use**

### What It Is

Open-source voice dictation running Whisper models 100% locally on your Mac. No cloud, no API costs.

### Installation (~15-20 min)

```bash
brew install node
xcode-select --install
git clone https://github.com/OpenWhispr/openwhispr.git
cd openwhispr
npm install
npm run download:whisper-cpp
npm run pack
# Move dist/mac-arm64/OpenWhispr.app to Applications
```

### Caveats

- Unsigned app -- must allow in System Settings > Privacy & Security on first launch
- No automatic updates (manual git pull + rebuild)
- No iPhone version
- Accent accuracy slightly lower than cloud models

### Learning Features

- **Custom Dictionary** -- add specific words, names, technical terms as context hints
- **Auto-Learn** -- detects your corrections and updates dictionary automatically

### Memory Requirements on Mac Mini M4

| Model | Parameters | Memory | Notes |
|-------|-----------|--------|-------|
| medium | 769M | ~5 GB | Fast, decent accuracy |
| **large-v3-turbo** | 809M | **~6 GB** | **Best balance -- near large-v3 accuracy, 8x faster** |
| large-v3 | 1550M | ~10 GB | Best accuracy, heavier |

The M4 Mac Mini with 16 GB handles all models comfortably. **large-v3-turbo is the recommended model.**

---

## Other Options Evaluated

| Tool | Price | Platform | Accent Quality | Notes |
|------|-------|----------|---------------|-------|
| **Wispr Flow** | $15/mo | Mac, Win, iOS, Android | Excellent | Too expensive, but free tier of 2,000 words/week exists |
| **Superwhisper** | $249 lifetime | Mac + iOS | Good | Rejected -- large upfront cost |
| **VoiceInk** | $25-39 one-time | Mac only | Moderate | Open source, simpler than Superwhisper |
| **Voibe** | $4.90/mo or $99 lifetime | Mac | Good | Fully offline, HIPAA-compliant |
| **Aqua Voice** | $8/mo | Cross-platform | Good | Very fast (<50ms launch) |
| **Apple Dictation** | Free | Mac + iOS | Poor for accents | Built-in but unreliable for German accent |

---

## Future Outlook

Apple Intelligence is rapidly improving. Within 1-2 years, hardware-accelerated on-device speech recognition on Apple Silicon will likely handle accented English natively, making third-party tools unnecessary. This is why avoiding large upfront payments (Superwhisper $249, VoiceInk $39) is the right strategy -- Ottex's pay-per-use model has zero lock-in.

---

## Sources

- Ottex AI: ottex.ai
- Ottex on OpenRouter: openrouter.ai/works-with-openrouter/ottex
- OpenWhispr GitHub: github.com/OpenWhispr/openwhispr
- Whisper accent performance study (JASA): pubs.aip.org/asa/jel/article/4/2/025206
- GPT-OSS-120B German issues: huggingface.co/openai/gpt-oss-120b/discussions/19
