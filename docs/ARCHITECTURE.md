# Architecture

**As of:** 2026-10-28 (Phase 2 draft, before reviews)
**Inputs:** `PROMPT.md`, `docs/research/rules-digest.md` (CR v1.2.1), `docs/research/strategy-concepts.md`, `docs/research/meta-landscape.md`. ADRs in `docs/adr/` record the reasoning behind each choice here.

## 1. Packages and boundaries

Four npm workspaces. Arrows point downward only. ESLint (`no-restricted-imports`, `no-restricted-globals`) enforces them; a boundary violation fails CI.

```
app/     React UI, routing, tutorial, coach, review, meta explorer, deck builder, drills
  │  imports @optcg/ai (client + worker entry), @optcg/engine, @optcg/cards (public APIs only)
ai/      opponent tiers, playbooks, analysis; runs in a Web Worker
  │  imports @optcg/engine, @optcg/cards
engine/  rules, state, legal moves, effect interpreter, projection, replay
  │  imports @optcg/cards (types, card lookup, effect scripts)
cards/   card JSON (generated), effect scripts (data), DSL types, format/legality data
```

| Package | Owns | Must not know about |
| --- | --- | --- |
| `cards` | Card schema, generated JSON per set, effect scripts keyed by card ID, the DSL's TypeScript types, format data (blocks, ban list, banned pairs) | Engine behaviour, the browser, React |
| `engine` | Game state, rules, legal-action generator, effect interpreter, projection, replay, state hash, invariants | AI, UI, DOM, time, `Math.random` |
| `ai` | Rookie/Pirate/Warlord/Emperor, heuristic, playbooks, determinization, analysis (review flags, lethal search), explanation templates | UI, DOM (worker globals only in `worker.ts`) |
| `app` | Everything visible; session management; persistence; service worker; content rendering | Rules. It never decides legality; it renders `legalActions` |

Scripts that run in Node (`cards:update`, `meta:update`) live in `cards/scripts/` and `scripts/` and may use the network; nothing in `src/` of any package fetches at build time.

## 2. Engine

### 2.1 Public API

```ts
createGame(setup: GameSetup): { state: GameState; events: GameEvent[] }
reduce(state: GameState, action: Action): { state: GameState; events: GameEvent[] }   // throws IllegalAction
legalActions(view: PlayerView): Action[]          // empty unless view.player is the deciding player
project(state: GameState, player: PlayerId): PlayerView
replay(record: GameRecord): { state: GameState; events: GameEvent[] }
hashState(state: GameState): string               // stable across versions for golden replays
checkInvariants(state: GameState): InvariantError[]   // run after every reduce in dev and tests
derive(state: GameState): Derived                 // current power, cost, keywords, counters, per card
```

`GameRecord = { engineVersion, cardsVersion, seed, setup, actions: Action[] }`. That is the whole game: rewind, replay, review, bug reports, and "restore this moment" are all `replay(record with actions.slice(0, n))`.

### 2.2 State

`GameState` is a plain, JSON-serializable value. No classes, no closures, no Maps. That makes it hashable, postMessage-able to the worker, and storable.

- **Card instances.** Every physical card gets an instance ID (`p1:17`). Zones hold arrays of instance IDs; a single `cards` table maps instance ID → `{ cardId, owner, state: 'active' | 'rested', faceUp, givenDon: instanceId[], playedTurn }`. The new-object rule (CR 3-1-6) is implemented by assigning a **fresh instance ID** whenever a card leaves the Character or Stage area, so stale effect references, Once Per Turn marks and modifiers fall away naturally.
- **Zones per player:** `deck`, `hand`, `life`, `leader`, `characters` (max 5), `stage` (max 1), `trash`, `donDeck`, `costArea`, plus a shared `resolving` slot for a Trigger card that is in no area (CR 10-1-5-3).
- **Turn:** `turnNumber`, `activePlayer`, `firstPlayer`, `phase` (`setup | refresh | draw | don | main | end`), `battle` (null or `{ attacker, target, step, blockerUsed, ... }`).
- **Modifiers:** a list of `{ id, source, target, kind, amount, duration }` where `duration` is one of `battle`, `untilEndOfTurn`, `duringThisTurn`, `untilStartOfNextTurn(player)`, `permanent-while-source`. Expiry runs at the exact CR sub-steps (digest items 67, 72, 97).
- **Effect bookkeeping:** `oncePerTurnUsed`, `pendingTriggers` (queued auto effects per player, CR 8-6), `resolution` (see 2.4).
- **RNG:** `rng: RngState` (mulberry32, already in `engine/src/rng.ts`). Shuffles and random choices draw from it; nothing else is random.
- **Result:** `null | { winner: PlayerId } | { draw: 'bothLost' | 'loop' }` (digest correction 10).

Immutability is enforced at the API: `reduce` never mutates its input. Internally it copies on write only the parts it touches (zone arrays, the card records that change), so a reduce is cheap enough for search (target: 20 µs median for a non-effect action, measured in M2).

### 2.3 Decisions, not callbacks

At every moment exactly one player owes the engine a **decision**, or the game is over. `state.decision` describes it: who decides, what kind, and the options. Kinds:

| Decision | Examples |
| --- | --- |
| `chooseFirst` | RPS winner chooses first or second |
| `mulligan` | keep or redraw (first player decides first) |
| `main` | play card, give DON!!, activate ability, declare attack, end turn |
| `block` | pick a Blocker or decline |
| `counter` | play a Character Counter or an Event [Counter], or finish |
| `trigger` | activate a revealed [Trigger] or add the card to hand |
| `optional` | "you may" effects and optional costs |
| `choose` | targets or cards (with min, max, and the legal candidates) |
| `order` | order simultaneous effects or cards entering one area |

`legalActions` enumerates concrete `Action`s for the current decision (for `choose` with large combinations it enumerates one pick at a time: `pick(card)` then `done`, so the branching factor stays small for search). The UI renders exactly these actions; there is no other way to act. That is Principle 2 by construction.

### 2.4 Effect interpreter

Effect scripts (Track E defines the vocabulary) are data attached to card IDs in `cards/`. The engine runs them with an explicit, serializable **resolution stack**: each frame holds the effect reference, the instruction pointer, chosen targets, and local variables. When an instruction needs a player choice, the interpreter sets `state.decision` and returns; the next `reduce` with the chosen action resumes the frame. Because frames are data, a game paused mid-effect still serializes, hashes and replays.

Ordering follows CR 8-6 (digest items 127–130): auto effects queue per player; the turn player orders and resolves theirs, then the non-turn player; new turn-player effects queue behind already-pending opponent effects; effects triggered during damage processing wait until damage finishes, except [Trigger], which pauses it.

Unscripted cards play for their stats. Their text shows with an "effect not automated" badge, and the coverage number counts them.

### 2.5 Derived values

Current power, cost, keywords and "can attack / can block / can be K.O.'d" are never stored; `derive(state)` computes them from base stats, modifiers, permanent effects of cards on the field (applied turn player first, then non-turn player, repeating to a fixed point per CR 8-1-3-3-5), and given DON!! (+1000 each, owner's turn only, CR 6-5-5-2). Derive is memoized per state object, so the UI and AI pay for it once per state.

### 2.6 Rule processing and invariants

After every atomic action: check defeat conditions (Leader damaged at 0 Life, deck at 0 cards; CR 9-2), resolve the turn player's checks before the non-turn player's (open question R5), and record simultaneous loss as `bothLost`.

`checkInvariants` (dev builds and every test): 61 cards per player across zones plus `resolving`; no instance in two zones; ≤5 Characters, ≤1 Stage; given DON!! only on Leader/Characters; DON!! total = 10 per player; Life count equals Life zone length; exactly one decision owner unless the game is over.

### 2.7 Projection

`project(state, p)` returns a `PlayerView` in which the opponent's hand, both decks, and face-down Life are replaced by counts and opaque placeholders. Cards revealed by effects (search reveals, Trigger reveals, "look at") stay visible to whoever the CR says may see them (digest items 46–51); the view carries a `known` map of instance → card ID for those. The view also carries the decision with only the options that player may see. The AI and the UI only ever receive views. Hotseat mode asks for two views.

### 2.8 Events

`reduce` returns typed events (`CardMoved`, `DonPlaced`, `DonGiven`, `PowerModified`, `AttackDeclared`, `BlockerActivated`, `CounterPlayed`, `DamageDealt`, `TriggerRevealed`, `KO`, `EffectActivated`, `PhaseChanged`, `GameEnded`, ...). Events drive animation, the game log, the screen-reader live region, and review. Events are projected too: a `CardMoved` from deck to the opponent's hand reaches you without its card ID.

## 3. Cards

- `cards/data/manifest.json`, `cards/data/sets/<SET>.json` (generated; never hand-edited; corrections go in `cards/overrides/`), loaded per set on demand by the app and eagerly in Node tests.
- `cards/scripts/` holds `update.ts` (`npm run cards:update`): fetch, normalize to the schema in `cards/src/schema.ts`, write, print the diff report, and fail when a scripted card's text changed.
- `cards/effects/<SET>/<CARD-ID>.ts` holds one effect script per card, a typed data object. A coverage index lists which IDs are scripted.
- `cards/format/standard.json` (hand-kept, cited) holds blocks per product, block exceptions, the banned list and banned pairs, with effective dates and source URLs.
- **Source (ADR 0007):** optcgapi.com bulk endpoints, normalized by `cards:update` (sign repair recorded as `textFixes[]`, vocabulary type splitting, junk cleanup, trigger split). `cards/overrides/<CARD-ID>.json` holds hand-verified corrections; every scripted card must be `verified`. The pipeline never fetches the official site (its terms forbid reproduction).
- **Schema additions in M1:** `block`, `verified`, `textFixes`, printing-level `artworkId`s (`OP17-005_p1`).

The four-copy limit groups by card number, not artwork (digest correction 13). Alternate arts are `artworks[]` on one card.

## 4. AI

- Runs in a dedicated Web Worker (`ai/src/worker.ts`). The app talks to it with a typed message protocol: `chooseAction({ view, tier, playbookId, budgetMs })`, `analyze({ record, budgetMs })`, `lethal({ view })`, `cancel(id)`.
- Every decision returns `{ action, reason, alternatives[] }`. `reason` is generated from templates keyed to concepts in `strategy-concepts.md`, so the coach and review can link to the curriculum.
- **Rookie:** random legal action, but always blocks or counters when the attack is lethal.
- **Pirate:** one-ply: apply each legal action (resolving forced follow-ups), score with the heuristic plus playbook bias, pick the best.
- **Warlord / Emperor:** information-set Monte Carlo tree search with determinization (sample the opponent's hand, deck order and Life from the unseen pool consistent with the view), playbook as move-ordering prior, heuristic leaf evaluation after a short rollout cut-off, iterative deepening by budget. ADR 0008 records the reasoning and the fallback (expectimax over the current turn only) if MCTS cannot meet the strength target in 1.5 s.
- **Lethal search** is exact, not heuristic: enumerate the attacker's attack sequences (with DON!! allocation) against the defender's best block/counter responses given known and possible hand contents, and prove a forced win or its absence. Used by the lethal detector, review, and lethal puzzles.
- **Playbooks** (`ai/playbooks/<leader-id>.json`): dig targets, face-vs-board bias by game stage, counter aggressiveness, mulligan keep rules, win conditions. The Meta Explorer guide is written from the same file.

## 5. App

- **Session store:** holds the `GameRecord` and a checkpoint cache (a full state every 20 actions), so rewind to any action is one replay from the nearest checkpoint. The store derives `PlayerView`s through the engine API; React components read views, never state.
- **Turn loop:** when the deciding player is the AI, the store posts the view to the worker and applies the returned action after the animation queue drains. The speed setting controls the queue.
- **Board** renders from the view plus `derive`; legal actions decorate cards (playable, attackable, attachable). Click is primary, drag is an accelerator, and every action has a keyboard path (Phase 4 specifies them).
- **Routing:** path routes under `/optcg-sim/`, with `404.html` = `index.html` on GitHub Pages (already deployed that way).
- **Persistence (local only):** IndexedDB for game records, reviews, drill results and progress; `localStorage` for settings. Export and import as one JSON file. No accounts, servers or analytics.
- **Images:** one module (`app/src/art/`) with one base URL per source, fallback chain primary → secondary → text card, lazy loading at slot size, and a hand-written service worker that caches card images with the Cache API (cache-first, honouring source terms).
- **Content:** `docs/content/**/*.md` with front matter, compiled at build time by a small Vite plugin into JSON modules; a build check rejects content without `sources` and `asOf`, or that mentions an unknown card ID.
- **Bundle budget:** initial JS under 300 KB gzipped; the card JSON, deck builder, review and meta explorer are lazy chunks.

## 6. Data flow for one AI turn

```
store.record ──replay/checkpoint──▶ state ──project(state, ai)──▶ view
view ──postMessage──▶ worker: chooseAction(view, tier, playbook, budget)
worker ──▶ { action, reason, alternatives }
store: reduce(state, action) ──▶ { state', events } ; record.actions.push(action)
events ──▶ animation queue ──▶ board re-renders from project(state', human)
reason ──▶ coach panel ("why did it do that"), stored for review
```

## 7. Testing (summary; detail in PLAN.md)

- Engine: one test per digest rule number, one per ruling in `rulings.md`, one per scripted card, property tests (10,000 random legal games, invariants after every action), golden replays with fixed hashes.
- AI: strength thresholds over seeded games, time budgets, `legalActions`-only, non-empty reasons.
- App: Playwright flows and screenshots at 1280×720 and 1920×1080, keyboard-only game, axe accessibility checks.
