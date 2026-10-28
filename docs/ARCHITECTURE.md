# Architecture

**As of:** 2026-10-28 (revision 2, after the Phase 2 reviews in `docs/plan-review-1.md`)
**Inputs:** `PROMPT.md`, `docs/research/rules-digest.md` (CR v1.2.1), `docs/research/strategy-concepts.md`, `docs/research/meta-landscape.md`, `docs/research/data-sources.md`. ADRs in `docs/adr/` record the reasoning behind each choice here.

## 1. Packages and boundaries

Four npm workspaces. Arrows point downward only. ESLint (`no-restricted-imports`, `no-restricted-globals`) enforces them; a boundary violation fails CI.

```
app/     React UI, routing, tutorial, coach, review, meta explorer, deck builder, drills
  │  imports @optcg/ai (client + worker entry), @optcg/engine, @optcg/cards (public APIs only)
ai/      opponent tiers, playbooks, analysis, explanations; runs in a Web Worker
  │  imports @optcg/engine, @optcg/cards
engine/  rules, state, legal moves, effect interpreter, projection, replay, scenarios
  │  imports @optcg/cards (types, card lookup, effect scripts)
cards/   card JSON (generated), overrides, effect scripts (data), DSL types, format data
```

| Package | Owns | Must not know about |
| --- | --- | --- |
| `cards` | Card schema, generated JSON per set, hand-verified overrides, effect scripts keyed by card ID, the DSL's TypeScript types, `format/standard.json` | Engine behaviour, the browser, React |
| `engine` | Game state, rules, legal actions, illegal-move reasons, previews, effect interpreter, replacement hooks, projection, replay, scenarios, semantic hash, invariants | AI, UI, DOM, time, `Math.random` |
| `ai` | Rookie/Pirate/Warlord/Emperor, heuristic, playbooks, determinization, turn planning, lethal search, analysis, the `Explanation` builder | UI, DOM (worker globals only in `worker.ts`) |
| `app` | Everything visible; session store; persistence; service worker; content rendering | Rules. It never decides legality; it renders `legalActions` and `whyNot` |

Node scripts (`cards:update`, `meta:update`) live in `cards/scripts/` and `scripts/` and may use the network; nothing under any `src/` fetches at build time.

## 2. Engine

### 2.1 Public API

```ts
createGame(setup: GameSetup): Step                       // from seed + decks
createFromScenario(spec: ScenarioSpec): Step             // from a described board position; validated by invariants
reduce(state: GameState, action: Action): Step           // throws IllegalAction
legalActions(state: GameState): Action[]                 // full-state; the projected view embeds the decider's list
project(state: GameState, player: PlayerId): PlayerView  // includes view.decision.actions for that player
whyNot(state: GameState, player: PlayerId, intent: Intent): Reason | null  // "Active Characters can't be attacked" (CR 7-1-1-2)
preview(state: GameState, action: Action): Preview      // projected result: powers, life, K.O.s; used by battle panel, blunder warning
replay(record: GameRecord, upTo?: number): Step
summaryHash(state: GameState): string                    // semantic hash, stable across refactors (2.9)
checkInvariants(state: GameState): InvariantError[]      // dev builds and all tests
derive(state: GameState): Derived                        // live power, cost, keywords, flags per card
type Step = { state: GameState; events: GameEvent[] }
```

`legalActions` takes full state, because legality needs `derive`, which needs state. The deciding player's `PlayerView` carries those actions, re-expressed in that player's handles (2.7). The UI and AI only see views.

### 2.2 State

`GameState` is plain JSON: no classes, closures or Maps. That makes it hashable, transferable to the worker, and storable.

- **Card instances.** Every physical card has an instance ID. IDs are **allocated from the seeded RNG**, not in decklist order, so an ID reveals nothing. Zones hold arrays of IDs. A `cards` table maps ID → `{ cardId, owner, state, faceUp, givenDon[], playedTurn }`.
- **New-object rule (CR 3-1-6).** A card leaving the Character or Stage area gets a fresh ID. Stale modifiers, Once Per Turn marks and targets fall away. The move appends `{ oldId → newId }` to a per-step `renames` list, so effects that must follow the card can still find it: [On K.O.] resolving from the trash (CR 10-2-17-2), and "add the card K.O.'d this way to hand".
- **Last-known information.** When a card leaves the field, the event carries a snapshot of its derived values at that moment: power, cost, types, given DON!! count, and the cause (battle or effect, whose effect). Effects such as "if the K.O.'d Character had 6000 power or more" and "K.O.'d by your opponent's effect" read the snapshot.
- **Zones per player:** `deck`, `hand`, `life`, `leader`, `characters` (≤5), `stage` (≤1), `trash`, `donDeck`, `costArea`, plus a shared `resolving` slot for a Trigger card that is in no area (CR 10-1-5-3).
- **Turn:** `turnNumber`, `activePlayer`, `firstPlayer`, `phase`, `battle` (`null` or `{ attacker, target, step, blockerUsed, ... }`).
- **Modifiers:** `{ id, source, target, kind, amount, duration }`. `duration` is `battle | untilEndOfTurn | duringThisTurn | untilStartOfYourNextTurn(p) | untilEndOfOpponentsNextTurn(p) | whileSourceOnField` (the last two added from Track E, `effect-dsl.md` E-D2). Each expires at its exact CR sub-step (digest items 67, 72, 97).
- **Effect bookkeeping:** `oncePerTurnUsed`, `pendingTriggers` per player (CR 8-6), `resolution` (2.4), `replacementsApplied` (CR 8-1-3-4-3).
- **Setup facts:** each player's deck size, DON!! deck size (OP15-058 Enel has 6, CR 5-1-2-4) and leader. The invariants read these; they hard-code nothing.
- **RNG:** `rng: RngState` (mulberry32, `engine/src/rng.ts`). It drives shuffles, ID allocation and any random choice.
- **Result:** `null | { winner } | { draw: 'bothLost' | 'loop' }`.

`reduce` never mutates its input. Internally it copies on write only what it touches.

### 2.3 Decisions, not callbacks

At every moment exactly one player owes a **decision**, or the game is over.

| Decision | Examples |
| --- | --- |
| `chooseFirst` | RPS winner chooses first or second |
| `mulligan` | keep or redraw (first player decides first) |
| `main` | play card, give DON!!, activate ability, declare attack, end turn |
| `block` | pick a Blocker or decline |
| `counter` | play a Character Counter or Event [Counter], or finish |
| `trigger` | activate a revealed [Trigger] or add the card to hand |
| `optional` | "you may" effects, optional costs, optional replacement effects |
| `choose` | targets or cards: min, max, candidates, constraints |
| `order` | order simultaneous effects, cards entering one area, or permanent effects (2.5) |

- **One pick at a time.** Multi-card choices are a sequence of `pick(handle)` actions and then `done`. That keeps the branching factor small for search and keeps keyboard play simple. Two rules make it sound:
  - **Completability lookahead.** A pick is offered only if the remaining choice can still be completed: exact-N counts, total-cost limits, and cost payability, which is all-or-nothing (CR 8-3-1-3).
  - **Canonical order.** Picks for an unordered set must be made in candidate order, so search never explores A-then-B and B-then-A as different branches. The UI still presents a multi-select with a running count and a single commit (Phase 4). It sends the picks in canonical order.
- **DON!! choices by location class.** DON!! picks are made by class, with counts: cost area active, cost area rested, or given to a specific card. The engine assigns concrete instances deterministically (E-D4).
- **Costs.** An ability is offered only if all its costs are payable together, and every cost pick is exact (E-D6).
- **Move grouping.** Every action carries an `intentId`, so a player-level move groups the engine actions it took. "Give 3 DON!! to Zoro" is three actions, and "play Kaido, choose 2 targets" is three more. Rewind, the game log and the review timeline step by move, not by action.
- **Auto-skip.** When a decision has exactly one legal action that changes nothing, the session store may apply it automatically: an empty Blocker or Counter window, or a forced pick. The default is to auto-skip; the setting is "always ask". The engine still records the action, so replay stays exact.

### 2.4 Effect interpreter and replacement hooks

Effect scripts (vocabulary from Track E) are data in `cards/effects/`. The engine runs them with an explicit, serializable **resolution stack** of frames (effect reference, instruction pointer, chosen targets, locals). A choice suspends the frame; the next `reduce` resumes it.

**Replacement effects (CR 8-1-3-4)** use hooks. Every atomic operation goes through one choke point in `engine/src/ops/`: K.O., trash from field, Life to hand, Life to trash, rest, DON!! return, draw, and damage. Every way a card leaves the field goes through `leaveField(card, dest, cause)`, where `cause` is battle, effect, rule or cost, plus the controller. That covers K.O., return to hand, place in deck, trash from field, and place into Life. Cards that care about "removed from the field by your opponent's effect" match on the cause (E-D3). Zone transfers in scripts use one `move` verb over a whitelist of (from, to) pairs, each bound to a typed op and event (E-D5). Before the operation runs, the engine collects every replacement that applies. Ordering follows CR 8-1-3-4-2: the replacement on the card that created the situation goes first, then the turn player's in the order they choose, then the non-turn player's. A replacement worded with "may" becomes an `optional` decision. That decision can suspend the operation mid-battle or mid-loop ("K.O. up to 2"). Each replacement applies to a given event at most once (`replacementsApplied`, CR 8-1-3-4-3). OP12-061 Rosinante ("take a Life card instead") is the reference case and gets a test in M2.

**Ordering** follows CR 8-6 (digest items 127–130):
- Auto effects queue per player.
- The turn player orders and resolves theirs first, then the non-turn player.
- New turn-player effects queue behind effects the opponent already has pending.
- Effects triggered during damage processing wait until damage processing finishes. [Trigger] is the exception: it pauses damage processing.

**Unscripted cards** play for their stats. Their printed keywords ([Blocker], [Rush] and so on) still work when the verified override lists them (E-D7). Their text carries an "effect not automated" badge, and they lower the coverage number. An unscripted Event cannot be activated; `whyNot` says "effect not automated yet". An unscripted [Trigger] is not offered, so the Life card goes to hand (E-D8). [Once Per Turn] is keyed by instance and ability ID (E-D9). The DSL is specified in `docs/research/effect-dsl.md`; scripts are typed data validated by a schema in CI (E-D1).

### 2.5 Derived values

`derive(state)` computes current power, cost, keywords and the can-attack, can-block and can-be-K.O.'d flags. They are never stored. Inputs:
- base stats;
- modifiers;
- permanent effects of cards on the field;
- given DON!!: +1000 each, on the owner's turn only (CR 6-5-5-2).

**Permanent effects.** CR 8-1-3-3-5 lets the turn player choose the order in which permanent effects apply when they affect one another. The engine applies them in canonical layers:
1. set-base;
2. set-power-to-0;
3. ± modifiers;
4. ability grant and removal;
5. conditions re-checked.

Within a layer, order is the turn player's cards then the non-turn player's, in timestamp order. Iteration repeats to a fixed point with a cap of 8 passes. Hitting the cap logs an anomaly event, and the test suite treats that as a failure. If a real card interaction makes the order matter, it becomes an `order` decision (OPEN-QUESTIONS R14).

**Incremental derive.** `derive` is cached per card. A step invalidates only the cards whose inputs it touched, plus the cards that depend on any permanent effect whose source or condition changed. This exists for search throughput (ADR 0008).

### 2.6 Rule processing, loops and invariants

After every atomic action, the engine checks the defeat conditions: a Leader damaged at 0 Life, or a deck at 0 cards (CR 9-2). The turn player's checks run before the non-turn player's (R5). A simultaneous loss is recorded as `bothLost`.

**Loops (CR 11-1).**
- An optional loop ends when its player declines.
- A mandatory loop that neither player can stop is detected by a repeated `summaryHash` within one turn with no decision in between, and it ends the game as `draw: 'loop'`.
- Random and AI test games also enforce a hard cap of 2,000 actions per game.

`checkInvariants` runs in dev builds and in every test. Every quantity comes from the game's own setup:
- each player's cards across zones plus `resolving` equal deck size + leader + DON!! deck size;
- no instance is in two zones;
- at most 5 Characters and 1 Stage;
- given DON!! sit only on a Leader or Character;
- the DON!! total is conserved;
- the Life count equals the length of the Life zone;
- exactly one player owns the decision unless the game is over.

### 2.7 Projection

`project(state, p)` returns a `PlayerView`. Hidden information stays hidden at the level of **linkage**, not just card IDs:

- **Opaque handles.** The view never shows instance IDs. Every card gets a per-view handle. Cards in a zone hidden from `p` are re-keyed on every shuffle and every move into the zone, so a revealed card that is shuffled away and drawn later cannot be tracked. Visible cards keep stable handles while they stay visible.
- **Hand order.** The opponent's hand is a count plus face-down placeholders in canonical order, so position does not show which card was just searched. A player's own hand keeps the order that player chose.
- **Knowledge per zone.** The view's `known` map records what `p` legitimately knows: a deck top looked at stays known until that deck is shuffled, and a card revealed to hand stays known while it remains in hand. Shuffling clears that zone's knowledge.
- **Redacted resolution stack.** Frame locals that hold hidden cards (for example "look at the top 3") appear in a view only for the player the CR lets see them (CR 11-3-1).
- **Projected events.** A `CardMoved` from deck to the opponent's hand reaches `p` with a fresh handle and no card ID.
- **Leak test.** A property test builds two states that differ only by a permutation of hidden cards and asserts that both project to the same view for the player who cannot see those cards.

Hotseat mode asks for two views. Play-both-sides with open hands is a separate, explicit setting (Phase 4).

### 2.8 Events

`reduce` returns typed events. Examples: `CardMoved` with a last-known-information snapshot when the card leaves the field, `DonPlaced`, `DonGiven`, `PowerModified`, `AttackDeclared`, `BlockerActivated`, `CounterPlayed`, `DamageDealt`, `TriggerRevealed`, `KO`, `ReplacementApplied`, `EffectActivated`, `PhaseChanged`, `GameEnded` and `Anomaly`.

Events drive animation, the game log, the screen-reader live region and the review. Every event carries the `intentId` of the action that caused it.

### 2.9 Records, scenarios, versions, hashes

- **Record.** `GameRecord = { versions: { engine, cards, scripts }, start: { setup } | { scenario }, actions[], snapshots[] }`. `scripts` is a hash of the effect scripts in use. `snapshots` holds a projected-for-both summary at each turn boundary.
- **Actions.** Actions name instance IDs and option kinds, not indexes into a list, so a record stays meaningful when the list of options changes.
- **Version mismatch.** When an old record's versions differ from the current build, the app does not replay it live. It opens the record **read-only from its snapshots**: the timeline and flags are still viewable, and "restore and replay from here" is disabled with an explanation. Golden test records are re-recorded deliberately whenever versions change.
- **Scenarios.** `ScenarioSpec` describes a position: zones by card ID, states, given DON!!, Life, turn and phase, the decision owner, and an RNG seed for the rest. It is validated by `checkInvariants`, and filled-in decks are sampled from an optional decklist. The tutorial, rules "show me", drills, puzzles, card tests and independent rule tests all start from scenarios.
- **Semantic hash.** `summaryHash` hashes a canonical summary: card IDs per zone in order (with hidden zones in instance order), card states, given DON!!, Life, modifiers by kind and amount, turn, phase, decision kind, result and the RNG state. Internal refactors that do not change the game do not change the hash.

## 3. Cards

- **Generated data.** `cards/data/manifest.json` and `cards/data/sets/<SET>.json`, written by `cards:update` from optcgapi.com (ADR 0007). Never hand-edited.
- **Normalization.** Sign repair is recorded in `textFixes[]`. Type splitting uses a vocabulary and **fails the run on any type string with more than one valid split** ("Navy" vs "Neo Navy" vs "Former Navy"). Junk values are cleaned. The trigger text is split out. Printings are reconciled by card number: game fields come from the base printing, and any printing that disagrees is reported.
- **Overrides.** `cards/overrides/<CARD-ID>.json` holds hand-verified corrections and printed `keywords` with a source URL and date. **Every card in any meta list (182 today) gets its stats and types verified in M1**, because scripted searches depend on the types of unscripted cards too. Every scripted card is `verified: true`.
- **Effect scripts.** `cards/effects/<SET>/<CARD-ID>.ts`, one typed data object per card, plus a coverage index.
- **Format data.** `cards/format/standard.json` is hand-kept and cited: blocks per product, block exceptions, banned cards and banned pairs, each with effective dates and source URLs.
- **Schema additions (M1).** `block`, `verified`, `textFixes` and printing-level `artworkId`s (`OP17-005_p1`). The four-copy limit groups by card number (digest correction 13).

## 4. AI

### 4.1 Protocol and budgets

The AI runs in a dedicated Web Worker with a typed protocol:
- `planTurn({ view, tier, playbookId, budget })` → `TurnPlan`
- `decide({ view, plan?, budget })` → `Decision`
- `lethal({ view, mode, capMs })`
- `analyze({ record, budget })`, which streams progress
- `cancel(id)`

**Per-turn budget.** At the start of its Main Phase the AI plans its whole turn once: about 2.5 s for Warlord and 6 s for Emperor. It then follows the plan, and re-searches only when the plan breaks: a Counter, a Trigger or Blocker result, or a new reveal. Forced and single-option decisions cost nothing. Defensive decisions (block, counter, trigger) get a separate small budget of 0.4 s for Warlord. The search tree is reused between decisions within a turn. The worker searches while animations play. The target is an AI turn of 8 s or less at 1× speed, including animation; Phase 4 owns the perceived-time design.

**Budget units.** Tests and CI use **iteration budgets** (simulations), so seeded games give the same result on every machine. Wall-clock budgets apply only in the app. Each tier's per-iteration cost is measured, so the app's wall-clock budget roughly matches the CI iteration budget.

### 4.2 Tiers

- **Rookie:** a random legal action, but it always blocks or counters a lethal attack. Pulled forward to M3 so the board is playable against something early.
- **Pirate:** a greedy turn planner. It applies each candidate move, resolves forced follow-ups, and scores the result with the heuristic plus the playbook bias.
- **Warlord / Emperor:** information-set MCTS over turn plans (ADR 0008):
  - determinization from an archetype prior (4.3);
  - the playbook as a prior on move order;
  - the heuristic as the evaluation at the end of the opponent's next turn;
  - progressive widening over DON!! allocation.
  - Fallback if it is too weak: expectimax over the current turn's lines.

### 4.3 Determinization

The AI never samples from the human's actual decklist.
- **Opponent's unknown cards:** sampled from an archetype prior, built from the three sourced lists for the opponent's leader, weighted by recency. For a leader with no sourced lists, the prior is legal cards of the leader's colors weighted by meta frequency. Cards already seen are removed.
- **AI's own hidden zones:** its deck order and its Life cards are also secret from it (CR 3-2, 3-10), so they are sampled too.
- **Knowledge:** a deck top the AI has looked at stays fixed in every sample until a shuffle.

### 4.4 Lethal search

`lethal` returns one of three results:
- `proven` with a line;
- `refuted` with the defender's best defence;
- `unknown` when the time cap is hit.

The search has two modes:
- **`public`** (live coach, lethal detector, AI). The defender's hand is bounded by public information: hand size, an assumed counter value per card from the archetype prior's counter distribution, and assumed [Counter] Events from that same prior. A proof here is worst-case: it holds against any plausible hand.
- **`actual`** (review only, with full information). It uses the real hand, so it can say "you had lethal against the hand they held".

Hidden Life [Trigger]s are chance nodes, weighted by the prior's Trigger density. A proof that needs a Trigger not to fire is labelled as such. The search uses a transposition table on the summary hash, orders moves with the largest swing first, and stops at the cap.

### 4.5 Explanations

Every decision, hint and review flag carries an `Explanation`:

```ts
{ conceptId: 'lethal-math' | 'don-efficiency' | 'life-as-resource' | ...,  // stable slugs, defined in strategy-concepts.md (Phase 3)
  claim: string,                    // "You had lethal this turn."
  evidence: Evidence[],             // board numbers: "Opponent: 1 Life, 2 cards in hand → at most +4000 counter"
  line: Move[] | null,              // the better line, as player-level moves
  outcome: string,                  // in player units: "wins the game", "keeps 2 more Life", "+1 card"
  certainty: 'any-hand' | 'needed-hidden-info' | 'search-incomplete',
  nextTime: string,                 // rule of thumb: "Count Life + 1 hits, then subtract their max defence"
  lessonId: string,                 // curriculum lesson
  sources: string[] }               // rule or strategy citations
```

Reasons come from the **feature differences** between the chosen line and its alternatives: which terms of the heuristic changed, by how much, and why. They do not come from MCTS visit counts. Phase 4 writes about 20 example explanations for planted positions. The owner reviews that copy, and the examples become snapshot tests. A test only passes if the evidence numbers match the position.

### 4.6 Playbooks

Each archetype has a playbook at `ai/playbooks/<leader-id>.json`. It holds:
- dig targets;
- the face-versus-board bias by game stage;
- how aggressively to counter;
- mulligan keep rules;
- win conditions;
- **game-plan assertions**: measurable expectations such as "Rocks attacks with its leader every turn from turn 3 onward" and "Kaido uses its leader's DON!! −1 on the opponent's attacker when it is legal".

Strength tests check those assertions statistically, so "plays according to the deck's game plan" is tested. The Meta Explorer guide is written from the same file.

## 5. App

- **Session store.** Holds the `GameRecord` plus a checkpoint (full state) every 20 actions. Views come through the engine API, and components read views, never state.
- **Rewind.** Steps back by player-level move (`intentId`), with "back to my last decision". Rewinds are marked in the record, and rewound games are excluded from win-rate statistics.
- **Turn loop.** When the AI is to act, the store asks the worker. AI moves queue for animation at the selected speed, and the worker keeps searching while they play.
- **Coach and the AI share the worker.** Requests carry a priority: the AI's own move first, then a hint the player asked for, then the blunder check, then the background lethal detector. Lower priorities are cancelled when a higher one arrives. The blunder warning has a hard 300 ms cap; if analysis is unfinished, it stays silent rather than delaying the confirm.
- **Board.** Renders from the view plus `derive`. Legal actions decorate cards. An undecorated card explains itself through `whyNot`. The battle panel and DON!! overlay use `preview`. Click is the primary input, drag is an accelerator, and every action has a keyboard path; Phase 4 writes the keyboard spec in `docs/design/accessibility.md`.
- **Routing.** Path routes under `/optcg-sim/`, with `404.html` = `index.html` on GitHub Pages.
- **Persistence (local only).** IndexedDB holds records, reviews, drill results, progress and a per-step tutorial timing log. `localStorage` holds settings. Export and import everything as one JSON file. No accounts, servers or analytics.
- **Images.** One module (`app/src/art/`) with one base URL per source. The fallback chain is primary → secondary → text card, lazy-loaded at slot size. A service worker caches images with a **bounded** Cache API store (LRU, 300 entries). Opaque responses carry quota padding, so the store is capped rather than unbounded. Above the cap, images fall back to the browser's HTTP cache.
- **Content.** Markdown with front matter, compiled at build time (ADR 0010).
- **Bundle budget.** Initial JS under 300 KB gzipped. The card JSON, deck builder, review and meta explorer load as lazy chunks.

## 6. Data flow for one AI turn

```
start of AI main phase:
  store ──project(state, ai)──▶ view ──▶ worker.planTurn(view, tier, playbook, budget)
  worker ──▶ TurnPlan { moves[], explanation }
each AI decision:
  store ──▶ worker.decide(view, plan)        // instant if the plan still holds; re-search if broken
  worker ──▶ { action, explanation, alternatives }
  store: reduce(state, action) ──▶ { state', events } ; record.actions.push(action)
  events ──▶ animation queue ──▶ board re-renders from project(state', human)
  explanation ──▶ coach panel ("why did it do that"), saved for review
```

## 7. Testing (summary; detail in PLAN.md)

- **Engine:**
  - rules tests by CR number, built from scenarios;
  - one test per ruling;
  - one test per scripted card, based on official Q&A where it exists;
  - property tests: random games, invariants, the replay hash, the projection-linkage leak test, and "every listed action reduces; every unlisted action throws";
  - golden records.
- **AI:** strength tests with iteration budgets, fixed deck pairs and swapped seats; game-plan assertions; budget conformance; legal-only; explanation snapshots.
- **App:** Playwright flows and screenshots at 1280×720 and 1920×1080, a keyboard-only game, and axe checks. Manual screen-reader passes at M3, after the learning slice, and at M7.
