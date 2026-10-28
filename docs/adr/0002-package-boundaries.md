# ADR 0002: Four packages with one-way dependencies

**Status:** Accepted, 2026-10-28

## Context
The AI, coach, review and UI all need the same rules. If rules logic leaks into the UI, the AI and the UI disagree about legality and tests stop meaning anything.

## Decision
npm workspaces `cards` → `engine` → `ai` → `app`, consumed as TypeScript source through package `exports`. ESLint enforces the arrows and bans `Date`, `Math.random` and DOM globals in `engine`. `app` imports only package entry points, never `src/` internals. The UI never decides legality; it renders `legalActions`.

## Alternatives rejected
A single package with folder conventions (unenforceable); project references with separate builds (slower, no benefit for a static app); putting effect scripts inside `engine` (couples card data churn to engine releases; scripts are data and belong with the cards).

## Consequences
Any feature that seems to need rules in the UI becomes an engine API addition, which keeps the engine the best-tested package.
