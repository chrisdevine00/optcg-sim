# M2 review: rules engine (`engine/`)

**Date:** 2026-10-28
**Reviewer:** skeptical senior-engineer review (subagent). The brief was to break the engine.
**Build reviewed:** `main` at `6c852d9`. The working tree was clean, and no repository code was changed.
**Rule:** any severity 3 or 4 finding fails the milestone. Severity scale: 4 = wrong game result or a leak of hidden information; 3 = a rules error that changes play; 2 = should fix; 1 = nit.

M2 review: FAIL (open: M2-01, M2-02, M2-03)

## Method

1. **Read the specs:**
   - ARCHITECTURE §2;
   - ADRs 0003, 0004, 0005 and 0013;
   - the M2 row of PLAN;
   - `rules-digest.md` in full, including its checklist;
   - the battle, damage, duration, deck-out, setup and replacement sections of `rulings.md`.
2. **Read the engine:** all of `engine/src`, about 3,900 lines. I traced every frame of `flow.ts` against digest items 66–110 and the RL entries.
3. **Ran the repository's own checks:**
   - `npx vitest run engine`: 295 passed, 183 todo.
   - The nightly configuration, `ENGINE_GAMES=10000` over the property and golden suites: 10 tests passed in 38.5 s, which matches the "39 s" in STATUS.
   - `npm run bench`.
   - `eslint engine` and `tsc`: both clean.
4. **Wrote probe tests** in `.cache/m2-review/probes/` (gitignored). They follow the fixture pattern: `scenario()`, `TestGame`, and the test-only `withAbilities`/`applyOp` helpers that inject the abilities M4 will script. Run them with `npx vitest run --config .cache/m2-review/vitest.config.ts`.
   - Each finding's probe asserts the **current** behaviour, so a green run reproduces the finding. All 21 probes pass.
   - `hidden-info.test.ts` covers M2-01 to M2-04.
   - `rules-legality.test.ts` covers M2-05 to M2-07 and the confirmations.
   - `hash-scenario.test.ts` covers M2-08 and M2-09.
5. **Measured per-call medians myself**, because the vitest bench reports no p50 and reuses warm states (`.cache/m2-review/median.bench.ts`, run with `npx tsx`).
6. **Code-quality checks:**
   - searched for `any`, `Date`, `Math.random` and `console` in `engine/src`;
   - checked import boundaries;
   - confirmed that the independent suite imports only `@optcg/engine` and the frozen fixtures;
   - mapped every checklist line in the digest to a live test.

### What held up (no finding)

- **Base rules.** I traced these and confirmed them by probe or by the existing suite:
  - the battle steps, with the moved-area checks after the Attack, Block and Counter Steps;
  - at most one Blocker per battle, and the attacked card cannot block for itself;
  - a Leader with [Blocker] can block (RL-19);
  - ties go to the attacker, including at 0 and below;
  - Double Attack: at 1 Life it takes the last card and the game goes on; at 0 Life the attacker wins; the amount is fixed once damage is determined (RL-20);
  - Banish trashes the Life card and offers no [Trigger];
  - DON!! give +1000 on the owner's turn only, and a defender's DON!! add nothing;
  - the Refresh sub-steps run in CR order: 6-2-1 expiry, start-of-turn effects, given DON!! return rested, then everything is set active;
  - the End Phase tiers: 6-6-1-2 "until end of turn", then 6-6-1-3 "during this turn". `untilEndOfOpponentsNextEndPhase` ends at the correct turn whichever turn created it;
  - battle effects expire at End of the Battle;
  - deck-out happens the moment the last card is drawn;
  - simultaneous defeat gives `bothLost`;
  - effect damage at 0 Life defeats the player, but battle damage checks 0 Life only once (RL-22);
  - the 5-Character procedure: pay, then trash (no K.O.), then place (Q1, RL-04);
  - Stage replacement;
  - first turns: no draw on turn 1, 1 DON!!, and no battle on turns 1 and 2, even with [Rush];
  - the mulligan order, and Life placed after redraws with the deck top at the bottom.
- **Purity and determinism.**
  - `reduce` never writes to a deep-frozen input state (40 random games).
  - A JSON round trip of the state before every action changes neither `summaryHash` nor `legalActions` (40 games).
  - Replay reproduces the live hash (the property suite, and 10,000 nightly games).
- **Medians.**
  - `reduce`: p50 3.7 µs with warm states and 4.2 µs cold (p90 8 µs). This matches the "about 4 µs" claim.
  - Nightly: 10,000 games in 38.5 s.
- **Boundaries.**
  - There is no `any`, `Date` or `Math.random` in `engine/src`, and ESLint forbids them.
  - The app and the AI may import only `@optcg/engine`.
- **Coverage.** Every non-effect line of the digest checklist has a live test. The 183 todos are effect rules (CR 8-x, 10-2-x and others) that PLAN defers to M4a/b.

## Findings

| ID | Sev | Area | Problem | Minimal reproduction (scenario + actions) | Rule | Fix | Disposition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| M2-01 | 4 | Hidden info: projection | **The opponent sees that a face-down Life card has a [Trigger].** The engine asks for a `trigger` decision only when the top Life card has a [Trigger]; any other card goes straight to hand. The non-decider's view therefore shows `decision.kind: 'trigger'` and the prompt "Your opponent is deciding on a [Trigger]." That holds even when the defender declines and the card goes to hand "unrevealed". The leak test explicitly excludes this card (`hiddenFrom` skips the pending Life card), so the suite cannot catch it. M4 scripts every meta [Trigger], so every game will leak this, and the AI, which reads views, would see it too. | p1 Leader ST01-001 (turn 3, p1 active, Main); p2 Leader ST04-001 with Life `[X, OP02-084]`, where X is ST04-009 carrying a test [Trigger] ability. Then: `attack(p1 Leader → p2 Leader)`, `block null`, `endCounter`. Result: `project(s,'p1').decision` = `{kind:'trigger', player:'p2', prompt:'…[Trigger].'}`. With X = OP02-084 it is `{kind:'main', player:'p1'}`. p1's views before the attack are byte-identical. Probe: `hidden-info.test.ts` M2-01. | CR 3-10-2, 10-1-5-2 (a declined Trigger goes to hand unrevealed); ADR 0005 | Make damage processing look the same from outside: ask the damaged player a decision for **every** Life card taken (the only option is "add to hand" when no [Trigger] is scripted), and project it to the opponent with a neutral kind and prompt, e.g. "Your opponent is taking damage". Mark this decision as hidden-dependent for auto-skip (M2-02). Extend the leak test so it permutes the pending Life card while scripted [Trigger]s exist. | **Fixed.** The damaged player gets a `trigger` decision for every Life card taken (not Banish); "activate" is offered only for a scripted [Trigger]. The opponent sees "Your opponent is taking damage." Tests: `leaks.test.ts` "views and observed autoSkip are invariant under hidden permutations, including a pending damage card"; `legality.test.ts` "M2-01: a damage decision with no [Trigger]…". |
| M2-02 | 4 | Hidden info: `autoSkip` | **`autoSkip` on the Counter window depends on the defender's hidden hand.** It returns `endCounter` exactly when the hand holds no Character with a Counter value, and `null` otherwise. ARCHITECTURE §2.3 makes auto-skip the default. In hotseat or against another human, whether the game pauses therefore tells the attacker whether the defender holds any Counter card. The existing test `legality.test.ts` asserts this behaviour as intended. | p1 Leader ST01-001; p2 Leader ST04-001, Life `[OP02-084]`, hand `[H]`. Then: `attack(p1 Leader → p2 Leader)`, `block null`. With H = OP02-084 (Counter +1000), `autoSkip` is `null`. With H = ST04-017 (a Stage), it is `{type:'endCounter', player:'p2'}`. `project(s,'p1')` is identical in both. Probe: `hidden-info.test.ts` M2-02. | CR 3-4-2 (hand is secret); ADR 0005; the brief's explicit requirement | `autoSkip` may only skip when the single option follows from public information: an empty Block window (field), forced picks among public candidates, or a Counter window when the defender's hand is **empty** (hand size is public). Otherwise return `null`, or return `{ action, hidden: true }` so the store skips only when no other human can observe it. Add a property test: `autoSkip` must be invariant under a permutation of cards hidden from the non-decider. | **Fixed.** `autoSkip(state, { observedByOtherHuman })`. When observed, the Counter window skips only on an empty hand, and the damage decision never skips. The test that encoded the leak is rewritten (`legality.test.ts` "M2-02: with another human watching…"); the property above also checks it. |
| M2-03 | 4 | Hidden info: event handles | **A projected `CardMoved` into a hidden zone carries the card's hidden-zone handle, which links the card through the opponent's hand.** `moveCard` builds `keys: { [id]: oldKey, [nid]: w.key }`. When no new id is made (`id === nid`, any move that does not leave the field), the second entry overwrites the first, so `projectEvents` maps the visible `instance` field with the **new** key. That handle is exactly the one the card shows when it next becomes visible without a re-key (played from hand, used as a Counter, discarded). The viewer then learns which copy left the hand, and so whether the other copy is still there. This is reachable now through scenarios with a face-up Life card (CR 3-10-2-1). In M4 it will be reachable in normal play through "add from trash to hand" and face-up Life effects. | p1 Leader ST01-001; p2 Leader ST04-001, Life `[{OP02-084, faceUp}]`, hand `[OP02-084]`, deck 5 cards. Then: `attack(p1 Leader → p2 Leader)`, `block null`, `endCounter`, and keep p1's projected `CardMoved` (life→hand) as `e`. Then `endTurn`, and on turn 4 p2 plays the Life copy: p1's handle for p2's new Character **equals** `e.instance`. If p2 plays the other copy instead, the handle differs. Probe: `hidden-info.test.ts` M2-03 (three tests, including the collapsed `keys` entry). | ADR 0005 ("a revealed card … cannot be tracked"); ARCHITECTURE §2.7 (opaque handles; hand order shows nothing) | Key the event's handles by field, not by id: `keys: { instance: oldKey, newInstance: newKey }`, and have `projectEvents` use them. Also consider re-keying when a card leaves a hidden zone. Add a linkage property: no handle in an event projected to viewer V may equal a handle the same card later shows V, if the card passed through a zone hidden from V in between. | **Fixed.** Event keys are per field (`keys: { instance: oldKey, newInstance: newKey }`), and `projectEvents` maps each field with its own key. Test: `leaks.test.ts` "a handle never links a card across a zone hidden from the viewer". |
| M2-04 | 2 | Hidden info / API: `preview` | `preview` returns raw `InstanceId`s (`cards` keys and `ko`). Instance ids are stable through hand, deck and Life (only the new-object rule renames). Any consumer that keeps preview output can link a card across hidden zones (the same class of leak as M2-03), and the UI, which holds only handles, cannot match the results to its view. DECISIONS 2026-10-28 #8 already plans a handle-keyed preview for M3. | Same position as M2-03, with p1 also having OP15-016 in play. `preview(attack p1 Leader → p2 Leader)` lists p2's face-up Life card by its raw id (`{zone:'hand'}`), and that id is unchanged once the card is in p2's hand. Probe: M2-04. | ADR 0005 ("the view never shows instance IDs") | Return results keyed by the actor's handles (`preview(state, viewer, viewAction)`), and drop the id-keyed form from the public API before M3 uses it. | **Fixed (additive).** `previewFromView(state, player, viewAction)` takes and returns handles. The id-keyed `preview` stays, because it is frozen, and lint (M2-12) keeps it out of `ai/` and `app/`. |
| M2-05 | 2 | Rules hooks: effect ordering | There is no pending-trigger queue. `fireFor` pushes auto effects straight onto the stack, so a triggered effect resolves **before** the rest of the activation that caused it. This breaks CR 8.6.3 and RL-03. The same push means a new turn-player effect cannot queue behind the opponent's pending ones (CR 8-6-1, 8-6-1-1), and effects triggered during damage processing do not wait (CR 8-6-2). ARCHITECTURE §2.2 lists `pendingTriggers`, but `State` has none. No real card is scripted in M2, so play is unaffected now, but this blocks M4a. | p1 Character OP15-016 with a test `activateMain` effect: `[ko <p2 OP02-084>, emit 'rest-of-cause']`. p2's OP02-084 has a test `onKO` effect `[emit 'on-ko']`. Then: `activate`. The events show `['on-ko', 'rest-of-cause']`; per CR 8.6.3 the order should be reversed. Probe: `rules-legality.test.ts` M2-05. | CR 8-6-1, 8-6-1-1, 8-6-2, 8-6-2-1, 8.6.3; RL-01–03; ARCHITECTURE §2.2, §2.4 | Add `pendingTriggers` per player to `State`. `fireFor` enqueues; the loop drains the queues when the current activation finishes, and after damage processing except for [Trigger], with the turn player first and new turn-player effects behind the opponent's pending ones. Write RL-01/02/03 now with injected abilities, before M4a scripts depend on the order. | **Fixed.** `State.pending`: one FIFO queue, each batch appended turn player first, drained only when no activation, damage processing, K.O. or play is in progress. Tests: `hooks/effect-order.test.ts` (CR 8.6.3, 8-6-1, 8-6-1-1, 8-6-2). |
| M2-06 | 2 | Legality | Malformed actions are not always rejected with `IllegalAction`. `check` returns `null` for **any** `concede` before validating `player`, and `apply` then calls `other(p)`. A concede from `'p3'`, or with no player, therefore ends the game with **p1 as winner**. Separately, a `pick` with `choice: null` throws `TypeError` from `donKey`, both in `reduce` and in `whyNot`. | Any scenario. `reduce(s, {type:'concede', player:'p3'})` and `reduce(s, {type:'concede'})` both give `result {winner:'p1', reason:'concede'}`. In a Character-limit `choose`, `reduce(s, {type:'pick', choice:null, player:'p1'})` throws `TypeError`. Probe: M2-06. | ADR 0003 (`reduce` throws `IllegalAction`); CR 1-2-3 | Validate `player ∈ {p1, p2}` before the concede shortcut, and validate action shapes (`choice` non-null; `card` and `target` are strings that exist), returning a `Reason`. Add malformed shapes to the property test's candidate generator; today it only builds well-formed actions with real ids. | **Fixed.** `check` validates the player and the action shape first. Tests: `numbers-and-scenarios.test.ts` "malformed actions (M2-06)". |
| M2-07 | 2 | Records: versioning | (a) `replay` ignores `versions.cards`: a record made against other card data replays live and can silently desync. ADR 0004 rejects exactly this. The golden files store `cards: 'golden'`, which pins nothing. (b) Nothing ties a golden re-record to an `ENGINE_VERSION` bump. When a behaviour change breaks a golden hash, `UPDATE_GOLDEN=1` re-records it without a bump. Old user records at `0.2.0` would then replay live under the new behaviour. | `replay({...record, versions:{...versions, cards:'some-other-build'}}, cards())` does not throw. Probe: M2-07. | ADR 0004 | Give `replay` the current cards version (or a versioned lookup) and throw `RecordVersionMismatch` on any mismatch. Store a hash of the golden decks' card data in each golden file. Make the golden test fail when its `versions.engine` differs from `ENGINE_VERSION`, and require a version bump in the re-record path. | **Fixed.** `cardsVersionOf(state)` hashes the game fields of every card in the game. Records store it, `replay` recomputes it and throws `RecordVersionMismatch`. The golden test fails unless the golden's engine version equals `ENGINE_VERSION`, and re-recording refuses a changed hash without a bump. Now 0.3.0. |
| M2-08 | 2 | Determinism: semantic hash | `summaryHash` omits the interpreter stack (the remaining damage points, the play step), the decision's `candidates` and `purpose`, and `battle.attackerWon`. Two positions with different futures can therefore hash equal; anything that dedupes or restores by hash (a transposition table, "restore this moment") would conflate them. Separately, a `whileSource` duration is hashed with `JSON.stringify(duration)`, which puts a raw instance id into the "id-free" summary. | A: OP13-118 with Double Attack attacks p2 Leader (Life `[ST04-009 with test Trigger, OP02-084, OP02-084]`); `block null`, `endCounter`, which reaches the `trigger` decision with 1 point still to come. B: the same, but the attacker has no Double Attack. `summaryHash(A) === summaryHash(B)`, yet after `trigger false` p2 has Life 1 in A and 2 in B. The probe uses `withKeywords` for brevity; in real play RL-20 (Double Attack lost during the first point's [Trigger]) reaches the same pair of positions. The `whileSource` case: `summary()` contains the source instance id. Probe: `hash-scenario.test.ts` M2-08. | ADR 0004; ARCHITECTURE §2.9 | Hash a canonical stack summary (frame kinds and counters, with ids mapped to positions through `at()`), plus the decision's candidates and purpose. Map `duration.source` through `at()`. | **Fixed.** The summary includes the stack, pending effects, the full decision (candidates, purpose), the battle, and modifier durations, with every instance id mapped to a board position. Tests: `records.test.ts` "summaryHash covers pending obligations (M2-08)". |
| M2-09 | 1 | Scenarios | When `donDeck` is given explicitly, a scenario may hold fewer DON!! in total than the Leader's DON!! deck size. `setup.donSize` silently becomes that smaller total. | `createFromScenario({…, p1:{leader:'ST01-001', donDeck:3}})` builds a 3-DON!! game. Probe: M2-09. | CR 5-1-2, 5-1-2-4 | Require the total to equal `donDeckSizeFor(leader)`, unless a scenario field says otherwise on purpose. | **Fixed.** A scenario's DON!! total must equal the Leader's DON!! deck size. |
| M2-10 | 2 | Tests: leak test strength | The projection leak property permutes only the printed `card` among hidden instances, keeping ids, keys and positions. It therefore cannot detect key or handle linkage (M2-03). It also excludes the pending [Trigger] Life card (M2-01), and checks neither `projectEvents` nor `autoSkip` (M2-02). It reports "0 projection leaks" while three severity-4 leaks exist. | Read `engine/test/property/projection.test.ts`: `hiddenFrom` and `permute`. | ADR 0005 ("a property test asserts…") | Add linkage properties for events and handles, an `autoSkip` invariance property, and random games with injected [Trigger] and hidden→visible scripted moves, so the property can reach these paths. | **Fixed.** `property/leaks.test.ts`: games with scripted [Trigger]s and face-up Life. Hidden permutations include the pending damage card; `autoSkip` and projected events are compared; a linkage tracker covers views and events. Each property was checked to fail with its bug re-introduced. |
| M2-11 | 2 | Tests: property seeds | Every property suite uses a fixed fast-check seed (`0x5eed + part`, `0xc0ffee`). The nightly run of "10,000 games" replays the same 10,000 games every night, so it never explores new games. | `engine/test/property/games.ts` `runGames`; `projection.test.ts`. | PLAN §5 (nightly property cadence) | Seed from the date or the CI run id, print the seed, and keep a fixed-seed subset for every push. | **Fixed.** Fixed seeds per push; the nightly run draws a new `PROPERTY_SEED` and logs it (`engine/test/support/seed.ts`). |
| M2-12 | 2 | Boundaries | `queries`, `legalActions`, `whyNot` and `preview` are exported and read full state. Nothing stops `ai/src` or `app/src` from calling `queries.zone(state, opp, 'hand')`, or reading another player's hand from `legalActions` in a Counter window. Lint enforces only import paths. ADR 0005 says hidden information is "enforced by projection, not convention". | Inspect `eslint.config.js`: the ai/app rules restrict paths only. | ADR 0005 | Restrict these names with `no-restricted-imports` `importNames` in `ai/src` and in `app/src`, except in a single session-store module, so that only views reach the AI and the UI. | **Fixed.** ESLint `no-restricted-imports` with `importNames` blocks `queries`, `legalActions`, `whyNot`, `preview`, `autoSkip`, `reduce` and `replay` in `ai/src` and `app/src`, except `app/src/session/**` (the store) and `ai/src/search/**` (determinized states). |
| M2-13 | 1 | Performance claims | The reduce claim holds. The `legalActions` figure (about 1.4 µs) is measured with a warm `derive` memo, because the bench reuses the same states: cold Main Phase p50 is 2.7 µs and warm is 1.5 µs. `project` p50 is 30 µs, about 7× `reduce`, and has no budget, although the AI works from views. | `npx tsx .cache/m2-review/median.bench.ts` | ADR 0008; PLAN §5 | Bench on fresh state copies, report p50, and add a `project` budget before M4a's throughput target. | **Accepted, no change.** The `reduce` claim stands. A `project` budget is to be set with M4a's throughput target. |
| M2-14 | 1 | Code quality | The defeat flags (`deckTouched`, `damagedAtZero`) live in module-level `WeakMap`s keyed by the `Draft`, outside state. A defeat is checked only if `ruleProcessing` runs before that `Draft` is dropped. That holds today only because no `apply` branch both touches a deck and leaves a decision pending. | Read `ops/index.ts` lines 339–380. | CR 9-1-2; ARCHITECTURE §2.2 ("plain JSON") | Return the flags from the ops into the `Draft` (or keep them in state) and assert that they are empty at the end of `reduce`. | **Fixed.** The defeat flags live on the `Draft`, and `reduce` throws if any is left unchecked. |
| M2-15 | 1 | Golden records | The golden test checks only the final hash, the action count, the turn and the result. A change that diverges mid-game but reconverges, or that changes events only, passes. | `engine/test/golden/golden.test.ts` | ADR 0004 | Also store per-turn snapshot hashes and the sequence of event types. | **Fixed.** Goldens also pin every per-turn snapshot hash and a hash of the event-type sequence. |
| M2-16 | 1 | Game end | RL-27 decides on an optional "single elimination" setting (the turn player loses a simultaneous defeat), and its engine test expects it. `GameSetup` has no such option. | — | TRM §5.2; RL-27 | Add the option, or record the deferral in DECISIONS.md and OPEN-QUESTIONS.md. | **Deferred.** Needs a `GameSetup` option, which is a frozen shape. For the coordinator to log in DECISIONS.md and OPEN-QUESTIONS.md. |

**Counts:** severity 4: 3 (M2-01, M2-02, M2-03); severity 3: 0; severity 2: 8; severity 1: 5.

## Notes on severity

- **M2-01 to M2-03 are rated 4 even though no real card triggers them in a seeded game today.** Each one is in M2's own deliverable (projection hardening and the `autoSkip` API). Each is reachable now: M2-02 with real Counter cards, M2-01 and M2-03 through the hooks and scenarios. M3 hotseat and M4 scripts will expose all three.
- **M2-05 is rated 2, not 3, because PLAN moves CR 8-x to M4.** Still, the missing `pendingTriggers` changes `State`, and with it hashes and records. It is cheaper to fix before M4a and before any user records exist.

## Re-review

**Date:** 2026-10-28. **Build:** `main` at `f267c16` (fix commit `1f42e29`, plus the docs commit for M2-16). **Same reviewer.** I changed no repository code.

### Method

1. **Suite, lint and types.**
   - `npx vitest run engine`: 310 passed, 183 todo.
   - `eslint .` and `tsc`: clean.
   - Nightly configuration (`ENGINE_GAMES=10000`, property and golden suites, fresh `PROPERTY_SEED=86954752`): 12 of 12 passed in 35.6 s.
2. **Original probes.** I re-ran them. 13 of them now fail, which is expected: each asserted the old, buggy behaviour, so a failure means the finding no longer reproduces. The 8 confirmation probes still pass:
   - frozen inputs;
   - a JSON round trip of the state;
   - Double Attack at 1 and at 0 Life;
   - DON!! on the opponent's turn;
   - deck-out;
   - the 5-Character procedure and Stage replacement;
   - the self-Blocker check.
3. **New probes.** `.cache/m2-review/probes/recheck.test.ts` (13 tests, all pass) keeps the original intent, adapted to the damage decision now asked for every Life card. `rawids.test.ts` scans projected events for raw ids.
4. **Mutation check.** I copied `HEAD` to a scratch directory with its own `@optcg/engine` link, re-introduced each old bug, and ran the whole engine suite against each one. The harness is `scratchpad/m2mut/mutate.py`. I also ran the M2-03 mutant under 5 different `PROPERTY_SEED` values.
5. **New-leak hunt.** I read the whole fix diff and probed:
   - lint bypasses, with `eslint --stdin`;
   - raw ids in projected events, over 60 leak games;
   - how the queue drains;
   - `autoSkip` paths that the observed guard does not cover.

### The severity-4 findings are closed (independently confirmed)

- **M2-01.** Two positions that differ only in whether p2's face-down top Life card has a scripted [Trigger] now look the same to p1. p1's views after the attack, `block null`, `endCounter` and a declined damage decision are byte-identical in both, and so are the projected events. p1 sees `{kind:'trigger', prompt:'Your opponent is taking damage.'}` in both. Only the owner's action list differs, by the extra "activate".
- **M2-02.** With `observedByOtherHuman: true`, `autoSkip` returns `null` in the Counter window for any non-empty hand, whether it holds a Counter card or a Stage. It skips only an empty hand, whose size is public. The damage decision never skips when observed.
- **M2-03.** The life→hand event now shows p1 the handle it already saw for the face-up Life card, and `newInstance` is hidden. Whichever copy p2 later plays, its field handle differs from that event handle. Across 25 leak games, no projected event carries a live instance id.

### The new tests have teeth

Each old bug, re-introduced in the scratch copy, fails the tests below:

| Re-introduced bug | Tests that fail |
| --- | --- |
| M2-01: damage decision only for scripted [Trigger] | `leaks` permutation property, `legality` M2-01, `records` M2-08, 2 goldens |
| M2-02: `observedByOtherHuman` ignored | `leaks` permutation property (the observed-`autoSkip` check), `legality` M2-01 and M2-02 |
| M2-03: old id-keyed event keys | `leaks` linkage property, under all 5 seeds tried |
| M2-05: drain at any frame | all 4 `effect-order` tests, plus Attack Step order, start-of-game order and End Phase order |
| M2-06: player check removed | `numbers-and-scenarios` "malformed actions (M2-06)" |
| M2-08: stack dropped from the hash | `records` M2-08 and all 3 goldens |

### The severity-2 fixes are verified

- **CR 8-6 queue (M2-05).**
  - [On K.O.] now resolves after the rest of the activation that caused it (CR 8.6.3).
  - An [On K.O.] caused by a [Trigger] waits until the second Double Attack point is dealt (CR 8-6-2).
  - The order changes for the Attack Step, the End Phase and start-of-game in the same commit are CR-correct, now that resolution order is FIFO.
- **Concede and shape validation (M2-06).** A concede from `p3`, or from no player, throws `IllegalAction`. So does `pick null`, for which `whyNot` returns a reason.
- **Replay pins the card data (M2-07).** A record with a different `versions.cards`, or a lookup with one card's power changed, throws `RecordVersionMismatch`. The goldens require their engine version to equal `ENGINE_VERSION`, now `0.3.0`, and they pin the per-turn and event hashes.
- **Hash coverage (M2-08).** A Double Attack position with one point still to deal no longer hashes like a single hit, and the `whileSource` id is mapped to a board position.
- **Nightly seeds (M2-11).** Each nightly run draws a different seed (I saw 86947324, 86947996 and 86954752), while every push uses `24301`.
- **Lint (M2-12).** Named and namespace imports of `queries` and the other full-state functions are errors in `app/src` and `ai/src`, and allowed in `app/src/session/`.
- **`previewFromView` (M2-04).** It is keyed by the viewer's handles, holds no raw ids, and refuses another player's action.
- **Other closed items.**
  - M2-09: a scenario's DON!! total must equal the Leader's DON!! deck size.
  - M2-14: the defeat flags live on the `Draft`.
  - M2-15: goldens pin per-turn and event hashes.
  - M2-16: deferred, and logged in OPEN-QUESTIONS (`f267c16`).
- **Performance after the fixes:**
  - `reduce` p50: 2.9 µs warm, 3.5 µs cold;
  - Main Phase `legalActions`: 1.4 µs warm, 3.0 µs cold;
  - `project`: 26 µs.

### The independent-test edits weaken nothing

There are three `takeDamage(g)` lines: `battle.test.ts`, `durations.test.ts` and RL-08. In each, the old assertion would now run in the middle of damage processing, so the call is needed and nothing is skipped.

The commit also changed the shared `passCounter` and `noDefence` helpers to call `takeDamage`. That is broader than "three one-line additions". `takeDamage` stops at any decision that offers "activate", so tests that expect a scripted [Trigger] still see it. A bug that wrongly offered "activate" would leave the decision pending and fail the `kind: 'main'` checks.

The one claim no longer asserted directly is the comment "No `trigger` decision" in RL-21 (Banish). Its hand and trash assertions would still catch any regression that sent the Life card to hand. Logged as M2-23.

### New findings from the re-review

| ID | Sev | Area | Problem | Reproduction | Fix |
| --- | --- | --- | --- | --- | --- |
| M2-17 | 2 | Projection: raw ids | `projectEvents` leaves a raw instance id in `BattleEnded.target` whenever the target left the field during the battle: 514 occurrences in 60 leak games. `BattleEnded` is emitted after the K.O. renamed the card, so the event has no key for it. The same can happen to a drained `EffectActivated.instance` if its card moves before the queue drains. The id is dead, so it links to nothing: this is not a hidden-information leak. It does break "the view never shows instance ids", and the UI cannot map the value to a handle. | `.cache/m2-review/probes/rawids.test.ts`; output in `.cache/m2-review/rawids.json` | Capture the handles' keys at declaration (`Battle` keeps the keys), or map through `renames`. Add a "no raw id in any projected event" assertion to `leaks.test.ts`. |
| M2-18 | 1 | Legality | `reduce(state, null)` throws `TypeError`, because it reads `action.player` before `check` runs. | `recheck.test.ts` M2-06 | Guard the action's shape in `reduce` and `whyNot` before reading `player`. |
| M2-19 | 2 | Hidden info: `autoSkip` (latent until M4) | The observed guard covers only the damage decision and the Counter window. A forced `pick` or `done` still skips whatever its candidates are. Today the only `choose` is the public Character-limit choice, so nothing leaks. M4 choices among hidden cards would leak, for example "reveal 1 {X} from your hand" with exactly one match, or a search with no match. | Read `game.ts` `autoSkip` | When observed, skip a `pick` or `done` only if every candidate is visible to the other player, or if the count alone forces the answer. Add `choose` decisions over hidden zones to the leak property in M4a. |
| M2-20 | 1 | Boundaries | The lint rule does not catch dynamic `import('@optcg/engine')`. `project(state, opponent)` and the other functions that take a `GameState` remain allowed anywhere in `app/src`. The session store is therefore still a trust boundary held by convention. | `eslint --stdin` with `import('@optcg/engine').then((m) => m.queries)` in `app/src/x.ts`: 0 errors | Ban dynamic imports of the engine outside the store, and keep `GameState` values inside `app/src/session/` (for example with a lint rule on the type import). |
| M2-21 | 1 | Tests: seed logging | Under the default reporter that `test:nightly` uses, vitest 4 hides console output from passing tests. The `PROPERTY_SEED` line therefore appears only with `--reporter=verbose` or when a test fails. A passing nightly run does not record which games it covered. | `ENGINE_GAMES=40 npx vitest run engine/test/property/games-1.test.ts` prints no seed | Write the seed into `test-results/` or a test name, or add the verbose reporter to `test:nightly`. |
| M2-22 | 1 | Hash | `canon` treats any string matching `/^c[a-z0-9]{7}$/` as an instance id. A future ability id or label of that shape would be rewritten to a position or to `'gone'`. | Read `hash.ts` | Map ids only in the fields known to hold them, or prefix instance ids with a character that card and ability ids never use. |
| M2-23 | 1 | Tests | RL-21 no longer asserts directly that Banish asks no damage decision. | `RL-21.test.ts` with `noDefence` | Assert `decision.kind` after `endCounter`, before calling the helper. |

**Open after the re-review:** severity 4: 0; severity 3: 0; severity 2: 2 (M2-17, M2-19, the latter latent until M4); severity 1: 5 (M2-18, M2-20 to M2-23).

M2 review: PASS
