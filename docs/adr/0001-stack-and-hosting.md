# ADR 0001: Stack and hosting

**Status:** Accepted, 2026-10-23 · **Deciders:** owner defaults in PROMPT.md

## Context
PROMPT.md offers defaults for the two DEVINE decisions on stack and hosting. The product must be a static, local-first build with no backend.

## Decision
TypeScript (strict, no `any`) + Vite + React; Vitest for unit and property tests; Playwright for end-to-end and screenshots. Hosting on GitHub Pages through the Actions artifact flow, deployed only after CI is green on `main` (URL https://chrisdevine00.github.io/optcg-sim/). Versions are pinned in DECISIONS.md "Toolchain versions".

## Alternatives rejected
Svelte or vanilla (no advantage for a board-heavy UI the owner will critique, and a smaller ecosystem for accessibility tooling); Vercel or Netlify (fine, but add an account for no gain; the build is a static folder, so switching later is a config change).

## Consequences
Everything that would need a server (accounts, sharing, telemetry) is out of scope by construction. Routing must work under a `/optcg-sim/` base path with a `404.html` fallback.
