# Wrap Session

End-of-session routine for the VoiceText project. Execute these steps:

## 1. Update MEMORY.md
Update `/Users/richard/.claude/projects/-Users-richard-08-LifeStyle-tools-voicetext/memory/MEMORY.md` with:
- Current build phase and what was completed this session
- Any key decisions or insights (architectural choices, scope cuts, vendor/API findings)
- Updated status against `plan/PRD-voicetext.md` and `plan/implementation-plan.md`
- Code changes made (files created/modified)
- Keep it concise — update existing entries rather than appending. Link to memory files; don't inline long content into the index.

## 2. Save Session File
Create a session file in `/Users/richard/08_LifeStyle/tools/voicetext/docs/session-summaries/` with naming convention:
- Format: `YYYY-MM-DD-[short-description].md` (topic slug, no session number)
- If multiple sessions occur the same day, use a topical suffix to disambiguate (e.g., `-morning`, `-followup`) — not a numeric counter
- Location is tracked in git (public repo — do not write anything you wouldn't share publicly: no secrets, no unlocked passphrases, no full connection strings)
- Include:
  - **Goal**: what we set out to do
  - **Done**: what was actually completed (files changed, features built, deploys)
  - **Decisions**: any choices made and why (especially ones a future reader would second-guess)
  - **Blockers / Open Issues**: anything unresolved — transcription quality findings, Vercel limits hit, iPhone Safari quirks, etc.
  - **Next Steps**: what to pick up in the next session

## 3. Safety & Git Status Check
- Confirm `.env.local` and any other secret-bearing files are still gitignored: `git ls-files | grep -E '\.env($|\.)' ` should only list `.env.example`.
- Run `git status` and `git diff --stat` so the user can see uncommitted work before closing out.
- Flag any staged file that could contain secrets (connection strings, API keys, passphrases) before the user commits.

## 4. Deployment Snapshot (if relevant)
If anything was pushed to GitHub or deployed to Vercel this session, note:
- Latest commit SHA on `main`
- Vercel deployment URL / status (preview or production)
- Any env vars that were added/changed in Vercel (names only, never values)

## 5. Confirm Completion
Tell the user what was saved and where. List next steps clearly so the next session can pick up without ramp-up time.
