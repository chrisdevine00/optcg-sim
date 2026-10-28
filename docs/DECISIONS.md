# Decisions

Newest first. One dated paragraph per decision: context, decision, alternatives rejected.

## 2026-10-28 — Toolchain versions and workspace layout

Context: scaffold needs a type checker that ESLint understands. TypeScript 7.0 (native port) is current, but typescript-eslint 8.72 supports only `<6.1`. Decision: TypeScript 6.0.3, Vite 8, Vitest 4.1 (Vitest 5 does not list Node 25 in its engines), Playwright 1.64, ESLint 10 flat config. Packages are npm workspaces consumed as TypeScript source through `exports` (no per-package build), so Vite and Vitest compile everything once. Package boundaries are enforced with `no-restricted-imports`, and the engine additionally bans `Date`, `Math.random`, and DOM globals. Alternatives rejected: TS 7 without type-aware lint; project references with per-package builds (slower, no benefit for a static app).

## 2026-10-28 — Third-party screenshots are not committed

Context: the UX teardown and wireframe reviews need screenshots, and screenshots of other simulators show Bandai card art. Decision: such screenshots live in `docs/research/teardown-shots/` and `docs/design/wireframes/shots/`, both gitignored; documents describe them in text and refer to filenames. Alternative rejected: committing cropped or blurred screenshots (still risky and low value).

## 2026-10-28 — GitHub Pages via a gh-pages branch, deploy after green CI

Context: PROMPT.md default hosting. Decision: `deploy.yml` builds `app/dist` and force-pushes it to `gh-pages` after the CI workflow succeeds on `main`; Vite `base` is `/optcg-sim/` and `404.html` is a copy of `index.html`. Alternative rejected: `actions/deploy-pages` artifact flow (equally fine, but the prompt names a branch).

## 2026-10-23 — Defaults accepted from PROMPT.md

Product name `OPTCG Sim` (cosmetic, swappable). Stack: TypeScript strict + Vite + React, Vitest, Playwright. Hosting: GitHub Pages via GitHub Actions. Alternatives (Svelte, Vercel, Netlify) remain open and are one-file changes.
