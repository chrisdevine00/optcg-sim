# engine

Owns the rules: game state, zones, phases, DON!!, battle, effect resolution, the legal-move generator, projection to player views, and the replay log.

Pure TypeScript. Deterministic given a seed: no DOM, no React, no `Date`, no `Math.random`, no globals. The RNG lives in state.

Must not know about: `ai/`, `app/`, the browser. Reads `cards/` for card data and effect-script data.
