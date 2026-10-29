# ai

Opponent tiers (Rookie, Pirate, Warlord, Emperor), archetype playbooks, and analysis for Game Review. Runs in a Web Worker (`src/worker.ts`, protocol in `src/protocol.ts`). Exposes `chooseAction(view, …)` now; `planTurn`, `lethal` and `analyze(replay)` arrive with M5 and M6.

- **Rookie (M3):** a uniformly random legal action from `view.actions` (never a concession), except that it always blocks, or counters with its largest Counters, while an attack would win the game. Seeded per decision; never `Math.random`. Returns `{ action, explanation (minimal), alternatives: [] }`.

Depends on the public APIs of `engine` and `cards`. Only ever receives player views, never raw state, and only picks from the view's legal actions. Full-state engine calls are allowed only under `src/search/` (determinized states, M5); ESLint enforces it.
