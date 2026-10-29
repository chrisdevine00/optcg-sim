# ai

Opponent tiers (Rookie, Pirate; Warlord and Emperor arrive in M5b), archetype playbooks, and the `Explanation` builder. Runs in a Web Worker (`src/worker.ts`, protocol in `src/protocol.ts`); `AiSession` (`src/session.ts`) is the same player in process, for tests and the strength runner.

**What it may know.** Only its own view: a `PlayerView` for Rookie, a `SearchView` for Pirate (the view plus a skeleton of the game with every card hidden from the AI stripped, `engine/src/determinize.ts`, ADR 0005). Public card data: its own deck, the archetype prior for its opponent's Leader (`docs/research/meta-lists.json`), and cards it has seen. It only picks from the view's own action list.

**Where full-state engine calls are allowed: `src/search/` only** (ESLint enforces it, and a test scans the other files).

- **Rookie (M3):** a uniformly random legal action from `view.actions` (never a concession), except that it always blocks, or counters with its largest Counters, while an attack would win the game.
- **Pirate (M5a):** a greedy per-turn planner over determinized states (`src/search/pirate.ts`).
  - `sample.ts` guesses every hidden card: its own deck order and Life from its own list, the opponent's hand, deck and Life from the archetype prior (one sourced list chosen by recency), minus every card it has seen.
  - `sim.ts` holds the quick policies (spread DON!! and attack the Leader weakest-first; defend lethal always and never play a Counter that does not change the result; pay costs with the least useful card) and rollouts to the next turn's Main Phase.
  - `heuristic.ts` scores a position: life, hand, counters, board, DON!!, lethal threat and deck, each weight named with the strategy concept it comes from (`docs/research/strategy-concepts.md`).
  - The planner scores every candidate move (plays, activations, attacks alone or after 1, 2, 3 or all DON!!, ending the turn) in each sampled state, adds the playbook's bias, plays the best, and plans again once an attack or a reveal makes the samples disagree. Defensive and effect decisions are scored the same way; a Counter decision compares "take it" with whole defences only.
  - Budgets: rollouts in tests and CI (`BUDGETS.pirate.iterations`), milliseconds in the app (`BUDGETS.pirate.ms`).
- **Playbooks** (`playbooks/<leader-id>.json`, ARCHITECTURE §4.6): weight multipliers, card values, face-versus-board by stage, mulligan rules, move biases and the game-plan assertions, written from the archetype guides' "Game plan by turn" and "Playbook seeds".
- **Explanations** (`src/explain.ts`): every decision returns an `Explanation` built from public facts only (flows D9). The AI "why" examples in `docs/design/explanations.md` (E12, E13, E16) are snapshot tests that read the expected objects from that file.

**Tests:** `ai/test/` — Rookie, Pirate (deterministic, blind to hidden cards, within budget, defends lethal, never wastes a Counter), game-plan assertions in planted positions, explanation snapshots and copy rules, and strength (`STRENGTH_GAMES`, default 20 per push; `npm run test:strength` runs the nightly 200 games plus 40 Pirate-vs-Pirate games for the game-plan tallies).

Depends on the public APIs of `engine` and `cards`.
