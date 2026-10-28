# Decisions

Newest first. One dated paragraph per decision: context, decision, alternatives rejected.

## 2026-10-28 — Engine spec corrected to Comprehensive Rules v1.2.1

Context: Track A read CR v1.2.1 (8/28/2026) and found places where PROMPT.md's engine specification is imprecise. Decision: the engine follows the CR; details and rule numbers are in `docs/research/rules-digest.md` "Corrections to PROMPT.md assumptions". In brief: neither player attacks on their own first turn (CR 6-5-6-1); deck-out is a defeat when the deck reaches 0, checked in rule processing, not "failing to draw"; with five Characters out the player trashes one before the new one is placed, and that trash is not a K.O.; power may be negative; the per-player card-count invariant includes a transient "resolving" location for Trigger cards; Refresh and End phases follow the CR's ordered sub-steps with separate expiry for "until end of turn" and "during this turn"; Character counters are free from hand and Event counters cost DON!!; Double Attack against 1 Life does not win; simultaneous loss and unbreakable loops produce a draw result; the keyword set includes [Rush: Character], [Unblockable], [On Your Opponent's Attack], [End of Your Opponent's Turn], [Main], [Your Turn], [Opponent's Turn], DON!! −X and Trash; start-of-game leader effects run before hands are drawn and Life is set after the mulligan; the four-copy limit is per card number across alt arts; DON!! power applies only on its owner's turn, though [DON!! xX] still counts on the opponent's turn. Alternative rejected: implementing PROMPT.md's wording literally.

## 2026-10-28 — Toolchain versions and workspace layout

Context: scaffold needs a type checker that ESLint understands. TypeScript 7.0 (native port) is current, but typescript-eslint 8.72 supports only `<6.1`. Decision: TypeScript 6.0.3, Vite 8, Vitest 4.1 (Vitest 5 does not list Node 25 in its engines), Playwright 1.64, ESLint 10 flat config. Packages are npm workspaces consumed as TypeScript source through `exports` (no per-package build), so Vite and Vitest compile everything once. Package boundaries are enforced with `no-restricted-imports`, and the engine additionally bans `Date`, `Math.random`, and DOM globals. Alternatives rejected: TS 7 without type-aware lint; project references with per-package builds (slower, no benefit for a static app).

## 2026-10-28 — Third-party screenshots are not committed

Context: the UX teardown and wireframe reviews need screenshots, and screenshots of other simulators show Bandai card art. Decision: such screenshots live in `docs/research/teardown-shots/` and `docs/design/wireframes/shots/`, both gitignored; documents describe them in text and refer to filenames. Alternative rejected: committing cropped or blurred screenshots (still risky and low value).

## 2026-10-28 — GitHub Pages via the Actions artifact flow, deploy after green CI

Context: PROMPT.md default hosting named a gh-pages branch, but the owner made the repo public and enabled Pages with the "GitHub Actions" source. Decision: `deploy.yml` builds `app/dist`, uploads it with `actions/upload-pages-artifact`, and publishes with `actions/deploy-pages` after CI succeeds on `main`; Vite `base` is `/optcg-sim/`; `404.html` is a copy of `index.html`. URL: https://chrisdevine00.github.io/optcg-sim/. Alternative rejected: pushing to a gh-pages branch (would require changing the owner's Pages setting). The stale `gh-pages` branch from the first run is deleted.

## 2026-10-23 — Defaults accepted from PROMPT.md

Product name `OPTCG Sim` (cosmetic, swappable). Stack: TypeScript strict + Vite + React, Vitest, Playwright. Hosting: GitHub Pages via GitHub Actions. Alternatives (Svelte, Vercel, Netlify) remain open and are one-file changes.
