# Claude Code instructions for this repository

This repository is driven by `PROMPT.md`. It is the single source of truth for what to build, in what order, and to what standard.

On every start:
1. Read `PROMPT.md` in full.
2. Read `docs/STATUS.md`. If it says "Not started", begin Phase 1 as the prompt instructs. Otherwise follow the Resume protocol in `PROMPT.md`.
3. Do not ask the owner questions except for the three **DEVINE:** items in `PROMPT.md`, and only if their defaults are unusable.

Standing rules (restated from PROMPT.md so they are never missed):
- Keep `docs/STATUS.md` current at the end of every milestone and before any long task.
- Record every non-trivial decision in `docs/DECISIONS.md`, newest first.
- Never commit card images or any Bandai art. Art loads at runtime.
- The app must build and run at every commit on `main`.
- Rules logic lives only in `engine/`. The UI asks the engine what is legal.
