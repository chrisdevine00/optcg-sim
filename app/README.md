# app

React UI: board, tutorial, coach panel, review, meta explorer, deck builder, drills, settings. From M1 it serves the card browser at `/optcg-sim/cards`.

**Owns:** everything visible, routing, the art module, the service worker, persistence and content rendering.

**Must not know about:** rules. Whenever it needs to know whether something is legal, it asks the engine's public API. It never imports engine, ai or cards internals, only package entry points (`@optcg/cards`, `@optcg/cards/browser`, `@optcg/engine`, `@optcg/ai`); ESLint enforces this.

## Card art (`src/art/`)

- `sources.ts` is the only place that knows image URLs: one base URL per source. Fallback order per artwork: optcgapi `card_image` → arjunkai (wired in, disabled until its maintainer approves) → the text card face. Card data stores image paths relative to the source, so a source is swapped or disabled here in one line.
- `CardFace.tsx` draws treatment C from `docs/design/card-face-study.md`: the scan's clean upper band as an art window (no SAMPLE watermark), our own name footer and colour band, stats on opaque plates. With no image it shows the same frame as text, so nothing shifts when art arrives or fails. Images load lazily; the inspector shows the full scan.
- `src/sw.ts` (built to `sw.js`, registered only in production builds) caches images from the known hosts in a bounded LRU Cache API store of 300 entries (`src/art/lru.ts`).

No image is ever bundled or committed. Every page footer carries the unofficial-fan-tool disclaimer.

## Card browser (`src/cards/`)

Search by name, ID or text; filters for set, colour, category, cost, type, keyword in text, Standard legality and verified cards. Card JSON loads per set on demand (a card number in the search loads its set). The grid is virtualized. Keyboard: `/` focuses search, one grid tile is in the tab order, arrows / Home / End / PageUp / PageDown move, Enter opens the inspector, Escape closes it and returns focus.

## Budgets

`npm run build` fails if the initial JavaScript exceeds 300 KB gzipped (`scripts/bundle-budget.ts`); card sets and the browser screen are lazy chunks.
