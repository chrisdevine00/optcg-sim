# M4a review: effects slice (DSL runtime, Rocks and Kaido)

**Date:** 2026-10-29
**Reviewer:** independent review by a subagent. The brief was to find real problems and not to confirm the builder's report.
**Build reviewed:**
- The commits under review: 799dfcd, b260938, 495e4b8, cf2e304 and 5772604.
- At the coordinator's request, also 6d13ba9 (the B-1 fix) and 354e2a8 (e2e timeouts).
- All checks were re-run on `main` at `f06d180`, in a clean worktree, `.cache/m4a-review/wt`, with `@optcg/*` linked to the worktree's own packages. No repository code was changed.
- Finding statuses were re-checked at `c68c645`, after 64ddfb5 (the M3 re-review 2 veil fixes) landed during this review.

**Rule:** any severity 3 or 4 finding fails the milestone. Severity scale:
- 4 = a wrong game result, or a leak of hidden information;
- 3 = a rules error that changes play, or a defect that blocks a task;
- 2 = should fix;
- 1 = nit.

M4a review: **FAIL** (open: M4a-01 at severity 4, which is M3-39; M4a-03, M4a-04 and M4a-05 at severity 3. M4a-02, severity 4, was fixed by 64ddfb5 during the review and verified.)

The engine is in good shape. The scripts match their card text, the hidden-information work in the engine holds up under a harder leak test than the suite's, and the benchmark clears its target by 5×. The failures are elsewhere:
- **Two hotseat leaks.** Both come from the app's veiled public view meeting the new effect decisions. One is fixed on `main` now; the other is the open M3-39.
- **One engine rules error.** The [On Play] order of the two cards OP17-118 plays is decided by instance id, not by the player.
- **Two app gaps.** [Activate: Main] cannot be used from the UI, and the log records no effect at all.

## Method

1. **Read the specs:**
   - PROMPT.md (Effects, Testing);
   - PLAN's M4a row and exit criteria;
   - ARCHITECTURE §2;
   - ADRs 0003, 0005, 0006, 0008 and 0013;
   - `effect-dsl.md` (§4, E-D1 to E-D11);
   - `rulings.md`, including the M4a Q&A appendix and RL-44/RL-45;
   - the rules digest (items 86, 105, 122);
   - DECISIONS 2026-10-29 (M4a);
   - `benchmarks.md`;
   - M3 re-review 2 (M3-35 and M3-37, which overlap the hotseat findings here).
2. **Read the code:**
   - all of `engine/src/effects/` (compile, eval, run);
   - the M4a changes in `flow.ts`, `actions.ts`, `project.ts`, `queries.ts`, `game.ts`, `derive.ts`, `hash.ts` and `api.ts`;
   - `cards/src/dsl.ts` and `dsl-validate.ts`;
   - all 37 scripts in `cards/effects/`, each against its text in `cards/data` (overrides applied) and its rulings;
   - the app's effect UI: `Decision.tsx`, `Game.tsx`, `controller.ts`, `session.ts` and `text.ts`.
3. **Ran the repository's own checks** at `f06d180`:
   - `npx vitest run`;
   - `tsc` and `eslint .`;
   - the independent card suite: 314 tests, all passing at `f06d180`;
   - `ENGINE_GAMES=2000` on `leaks.test.ts`;
   - the nightly configuration (`ENGINE_GAMES=10000`, property and golden suites);
   - `npm run bench:two-turn`.
   Results are under "Claims verified".
4. **Wrote probe tests** (not committed), using the per-card helpers and `withAbilities`:
   - `engine/test/review/probes*.test.ts`;
   - `engine/test/review/leaks-cards.test.ts`, a stricter copy of the leak property;
   - `engine/test/review/determinize.bench-probe.test.ts`;
   - `app/test/review/hotseat-look.test.ts`.
   Run them with `npx vitest run engine/test/review app/test/review --reporter=verbose`. Each finding's probe prints the current behaviour.
5. **UI pass.** A subagent drove the real app at 1280×720 on the reviewed engine (a Vite alias to the worktree packages), with temporary scenarios added to `scenarios.ts`. The screenshots are in `.cache/m4a-review/*.png`, which is gitignored. I checked the severity-4 and severity-3 screenshots myself (`07a`, `07c`, `06b`) and traced each one to the code.

### What held up (no finding)

- **Script fidelity.** All 37 scripts say what the card says, checked against:
  - the timings ([When Attacking]/[On Your Opponent's Attack] sharing one [Once Per Turn]; Newgate's "attacks or is attacked" as `attack` events);
  - "up to" versus "exactly";
  - costs, in printed order (ST34-004: DON!! −4, then the trash);
  - [Once Per Turn];
  - the durations ("until the end of your opponent's next End Phase" on OP17-054 and OP17-065);
  - the replacements (EB04-030 and EB04-031 are K.O.-only; Nola OP15-069 and Kyo OP17-045 cover removal by the opponent's effect);
  - "If …, A. Then, B" placed inside the guard per CR 4-10-1 (EB04-030, OP17-060, OP08-074, OP07-077).

  The Q&A rows hold:
  - OP17-049: the trash mode with 1 card trashes 1;
  - OP17-118: no Counter with 0 Characters; one card may be played;
  - OP17-050: both cards go to the top or both to the bottom;
  - OP17-075: a random face-down pick;
  - OP08-074: the end-of-turn return also triggers OP17-062 (probe P1: 8 DON!! → 4, then +1 and 1 set active);
  - OP17-063: the negated Character's [On K.O.] and its own replacements are off, but Nola still protects it (probe P3).
- **Runtime.**
  - Programs compile to flat, serializable frames.
  - [Once Per Turn] is spent at the start of resolution, so declining keeps it (RL-45).
  - Conditions are checked at activation and again at resolution.
  - Pending effects form one FIFO queue in batches, turn player first, and drain only at safe points (CR 8-6-2).
  - The `order` decision appears for two of one player's effects from one event (probe P2: Rocks Leader + Newgate).
  - Replacements are offered one at a time in CR 8-1-3-4-2 rank order. Impossible ones are skipped, and so are those on negated sources.
  - [On K.O.] follows the rename from the trash, using last-known information.
  - Battle durations expire at End of Battle.
  - DON!! −X asks by location only when two classes can pay.
  - An Event [Counter] is reveal → pay → trash → resolve, and the Counter Step re-asks afterwards (probe: EB04-040 with DON!! given and in the cost area; Leader 9000).
  - A [Trigger] with a cost pays it (OP17-076); "activate this card's [Main]" pays the [Main]'s cost (digest 105).
  - Negation removes printed keywords but keeps granted ones.
- **Hidden information in the engine.**
  - The opponent's view of any decision is kind, player and generic prompt only. No `source`, `options`, `min`/`max` or candidates reach it.
  - Picks from hidden zones are always asked and flagged `secret`. A secret-cost auto is asked with "use" unavailable (probe: Queen EB04-032 with no {Animal Kingdom Pirates} card; observed `autoSkip` is `null`).
  - `CardsLooked` carries a count only.
  - Reveal handles get fresh keys.
  - `known` is cleared on move and on shuffle (probe: after Streusen only p1 knows `p1.deck.0`).
  - Blind picks use the seeded RNG over id-sorted candidates.
  - I ran a stricter copy of the leak property that keeps every event's `card` field up to (not including) the first reveal; the suite's own `stripCards` removes them. It passed 3,000 games (`leaks-cards.test.ts`).
- **The B-1 fix (6d13ba9).**
  - `costOptional` Events are playable on their printed cost alone, then ask "use", with "use" unavailable when the cost cannot be paid; declining trashes the Event with no effect.
  - An Event's optional cost is always asked, so no hidden-hand signal is added.
  - The validator requires a cost to be present.
  - Matches CR 8-3-1-4.

## Findings

| ID | Sev | Area | Problem | Evidence | Rule | Fix |
| --- | --- | --- | --- | --- | --- | --- |
| M4a-01 | 4 | Hotseat: veiled optional effect | **The veiled "Use" button tells anyone looking whether the hidden hand can pay a hand cost.** The engine deliberately asks an auto with a trash or reveal cost even when it cannot be paid, with "use" unavailable and `secret` set, so the opponent learns nothing (run.ts `askUse`; DECISIONS "Auto with a cost asks first"). While the defender's hand is veiled, `controller.actions()` still passes `optional` actions through (only card-naming fields are filtered). `Decision.tsx` then renders "Use" enabled when the hand can pay and disabled with "can't pay the cost" when it cannot. With Shiki OP17-048 ("trash 1 card with a type including "Rocks Pirates"") on P1's field and P2 attacking, the veiled screen shows which. M3 re-review 3 found the same leak independently, as **M3-39**, still open at `c68c645`; track the fix there. The same root cause has a concrete card at `c68c645`: for OP07-077's take step while veiled, `veiledAnswerable()` is true when the top 5 hold no {Animal Kingdom Pirates} or {Big Mom Pirates} card (the only answer is `done`) and false when they do. The public decision also still carries `max` 0 or 1. Either tells an onlooker whether the deck top held a match. M3 re-review 3 had found "no scripted card that does this yet". Whether a seat can be veiled at that step depends on how long the reveal lasts; I did not drive it in the UI. | `.cache/m4a-review/07a-secret-optional-veiled-cannot-pay.png` vs `07c-secret-optional-veiled-can-pay.png` (same board, same veil); `controller.ts:196-212`; `Decision.tsx:283-299` | ADR 0005; DECISIONS 2026-10-29 (hotseat public view) | While veiled, a decision the seat owes should show no answer controls at all: "Hold R to decide" (this also fixes M3-35). At minimum, drop `optional` actions from `actions()` when the private decision is `secret`. Add a hotseat test that the veiled DOM is identical whether the hidden hand can pay or not. |
| M4a-02 | 4 | Hotseat: veiled deck look | **Fixed after the reviewed build by 64ddfb5 (M3-37's allow-list public view). Verified at `c68c645`: the same probe now shows `looking: []` and no `options`.** The finding as reviewed at `f06d180`: **a veiled order decision names the cards the player is looking at in their deck.** `GameSession.publicView` builds its decision as `{ ...own.decision, prompt: theirs.decision.prompt }`, so it keeps the decider's own `options`, `source`, `min`/`max` and `purpose`, and it keeps `own.looking`. For the "place the rest at the bottom in any order" step of a look, those `options` are the looked-at cards' names. `controller.actions()` does not filter `order` actions (it checks `card`/`target`/`attacker`/`blocker` and string picks, not `first`), and `Decision.tsx`'s order panel renders `view.decision.options` labels. This is reachable in normal hotseat play: the defender holds R to activate OP07-077's [Trigger] ("activate this card's [Main]": look at 5), releases R, and the panel lists the 4 deck cards going to the bottom. The take step also shows `max` 0 or 1, which says whether the top 5 held a match. M3 re-review 2 (M3-37) saw `looking` pass through and judged it "not a leak yet"; the `options` path renders today. | `app/test/review/hotseat-look.test.ts`: `publicView('p1')` during OP07-077 holds `looking: [OP17-074, OP17-075, ST05-007, OP17-073, ST05-007]` and `decision.options` labels `X.Drake, Yamato, Gordon, Basil Hawkins, Gordon`, while `view('p2')` has `looking: []` and no options; `session.ts:263-271`; `controller.ts:196-212`; `Decision.tsx:303-318`. The render path is traced in code, not screenshotted. | ADR 0005; DECISIONS 2026-10-29 ("the intersection of the two projections") | Build the public decision from `theirs.decision` only (kind, player, prompt), set `looking: []`, and filter `order` actions whose `first` is not visible. Make `hidden.test.ts` compare **every** field of `publicView(v)` with `view(other)` (any card id, card name or handle in the public view must be in the other view), and play Rocks and Kaido decks with scripted [Trigger]s, not only `zones`. |
| M4a-03 | 3 | App: [Activate: Main] | **No [Activate: Main] ability can be used from the UI.** The board lights the card with the "ability" glyph (`Game.tsx:269-271`), but the action menu offers only Attack, Give DON!! and Inspect (`Game.tsx:1236-1263`). The selected panel has no Activate item either. `legal.activate` is rendered only in the Counter Step (`Decision.tsx:1047`). Seven scripted abilities are unusable by a human: EB04-031, EB04-032, OP08-074, OP17-044, OP17-054, OP17-061 and OP17-063. The "every card's effect is automated" copy on Setup overstates it (see M4a-09). | `.cache/m4a-review/06a-activate-main-click.png`, `06b-activate-main-menu.png` (Captain John: "⚡" glyph, no Activate) | flows.md F4d ("click your Leader and choose Activate: Main"); PLAN M4a "100% scripted" | Add "⚡ <label> · <cost>" items to the action menu and the selected panel from `legal.activate` (and a key, e.g. E), then an e2e that activates Black Maria and Captain John through the UI. |
| M4a-04 | 3 | Engine: effect order | **OP17-118's two plays, and so their [On Play] order, are decided by instance id, not by the player.** The play choice is an unordered pick in canonical order (instance ids, which are random per game), and the plays are pushed in that order. Each card's [On Play] fires as its own batch, so no `order` decision appears. Whether Kyo's draw resolves before Streusen's look-and-place, Linlin's mode before OP17-042's reveal-3 cost, or Gloriosa's bounce before Stussy's lock changes from game to game, and the player cannot choose. The order matters in real play (Streusen then Kyo draws the card you chose; the other way round draws blind). | `engine/test/review/probes3.test.ts`: in seed 1 the events run `CardPlayed:OP17-045, CardPlayed:OP17-050, EffectActivated:OP17-045, …`; in seeds 2–4 Streusen comes first. No `order` decision in any seed. | Rule Manual "Effect Activation Order"; CR 8-6-1; DECISIONS 2026-10-29 says separate batches in play order, but the play order is not the player's either | Treat cards placed by one `play` action as one event: place them all, then `fire` their [On Play]s as one batch, so the existing `order` decision applies. Alternatively ask the play order explicitly. Record the choice in DECISIONS, and add a per-card test that orders Streusen and Kyo both ways. |
| M4a-05 | 3 | App: log | **The game log records no effect.** `text.ts` `describeMove` handles none of `EffectActivated`, `EventActivated`, `CardRevealed`, `CardsLooked`, `ModeChosen`, `DonReturned`, `ReplacementApplied`, `EffectDeclined` or `SetActive`, nor power, rest, bounce and trash outcomes. Against the AI, its Kaido Leader's −2000, X.Drake's discard, its Linlin mode and its Rocks reveal (public information) leave no line. In hotseat, P2's log after P1's defence with Slow-Slow Beam Sword and Wo Ro reads only "Kaido attacks Player 1's Leader / Attack fails · 7000 vs 10000". The log is the screen reader's polite region, so a screen-reader user hears nothing about any effect. | `.cache/m4a-review/03q-p2-view-after-defence.png`, `01d-after-kaido.png`, `04d-after-cost.png`; `app/src/play/game/text.ts:103-230` | flows.md "Log: one line per player-level move" and the polite-region rule (§G, "Kaido gives 3 DON!! …", End of turn "Usopp sets 2 DON!! active"); principles.md 4 (no hidden state, no surprise) | One sentence per effect resolution, in battle-panel words: "Kaido Leader: return 1 DON!! → Babanuki −2000", "Rocks.D.Xebec reveals Kyo · draws 2", "Linlin: Player 2 chose 'draw 2'", "Nola: return 1 DON!! instead of the K.O.". Use the public log (`meet`) in hotseat. Add a log snapshot test for a scripted turn of each deck. |
| M4a-06 | 2 | Tests: nightly leak property | **The nightly leak property fails on a false positive, on every nightly run I made.** Three 10,000-game runs with freshly drawn seeds all failed "views and observed autoSkip are invariant…" the same way (seeds include `100620542` and `102403076`), so the nightly gate is red regardless of the code. The action is the make-room `pick` of a Character play. The card being played was already revealed (`CardRevealed` at the play's pay step), but it is still in hand, so `hiddenFrom` permutes it. In the permuted state it is a Stage, and the place event goes to `stage` instead of `characters`. Nothing leaks: the viewer already knows the card. Separately, `stripCards` drops every event's `card` field, so the property cannot see a leaked card id in an event. My stricter copy found none in 3,000 games. | `PROPERTY_SEED=100620542 ENGINE_GAMES=10000 npx vitest run engine/test/property/leaks.test.ts` → expected `"to":"characters"`, received `"to":"stage"`; `leaks-cards.test.ts` | PLAN §5 (nightly 10,000 games, invariants clean) | Treat the card of an in-progress `play` frame (and any card revealed by the pending action) as known in `hiddenFrom`. Compare `card` fields up to, not including, the first reveal, as `leaks-cards.test.ts` does. Re-run the failing seed. |
| M4a-07 | 2 | DSL: validator vs runtime (M4b) | **`validateScript` accepts shapes the runtime silently misexecutes**, so an M4b script can pass CI and do the wrong thing:<br>• `move` from `deckTop` always goes to the top of **Life** and asks "add the top card … to your Life?", whatever `to` says (a "trash the top card" script adds a Life card);<br>• `move` from hand or trash to `deck` ignores `position` and puts the card on top (probe: "bottom" goes to the top);<br>• `restrict` with a player target (`'you'`/`'opponent'`) returns without doing anything;<br>• `play.rested` and `draw.upTo` are accepted and ignored. | `engine/test/review/probes2.test.ts` "M4b trap": Life 3→4, trash 0; deck top `OP01-092` after a "bottom" move; `run.ts` `move()` and `action()`; `dsl-validate.ts:609-665` | effect-dsl E-D1 ("a script can never silently do nothing"); `IMPLEMENTED` contract | Make `validateScript` reject each until it is implemented: `move` from `deckTop` only `to: {zone:'life', position:'top'}`; deck destinations from hand or trash need their position honoured; `restrict` needs a selector target; no `rested` or `upTo` yet. Make every runtime fall-through an `Anomaly` that the tests turn into a failure. |
| M4a-08 | 2 | Rules: Event DON!! −X (E-Q12) | **DON!! −X on an Event can be declined, but the engine requires it to play the Event and never asks.** Official Q&A (ST01–04, Blast Breath ST04-016, "[Counter] DON!! −1 (You may return …)"): "Can I activate this card without paying the DON!! −1? Yes. You can activate the card, but nothing will happen." CR 8-3-1-4 makes "can/may" costs optional, and the reminder text of every DON!! −X says "You may return". The B-1 fix covers only the five per-script `costOptional` flags. Affected M4a cards: OP09-077 and OP15-078 [Main]; OP07-076, EB04-040 and OP17-077 [Counter]. The play impact is small: the Event goes to trash for nothing. | `.cache/track-f/qa/qa_st-01-st-04.txt:635` (the PDF text is column-scrambled; the row sits between ST04-015 and ST04-016, and ST04-016 is the only adjacent card with DON!! −1, so it is attributed there); CR 8-3-1-4, 8-3-1-6, 10-2-10-1 (`.cache/track-f/rule_comprehensive.txt:779-788`); card text in `cards/data` | CR 8-3-1-4; QA-ST01–04 ST04-016 | Treat a DON!! −X activation cost on an Event as optional in the engine (as `costOptional`), instead of a per-script flag. Close E-Q12 with this Q&A, and add a test per affected card. See "E-Q12" below. |
| M4a-09 | 2 | App: effect prompts vs flows F6/F8 | Found in the UI pass, each checked against its file:<br>• **Event [Counter]s in defence:** they are separate "Activate [Counter]: <name>" buttons with no cost, effect text or preview. They fire at once instead of being staged, are absent in the Block Step, and their hand cards show only a "[Main]" chip (`Decision.tsx:1047-1063`; `03h`). The defender breakdown still reads "no change" after them (`simCard` returns no card, `Decision.tsx:736-739`; `03k`, `03n`). The footer then offers "Take the hit · Life 3 → 3" when the attack already fails (`03n`).<br>• **Optional prompt (F8d):** the cost is not stated (Kaido's DON!! −1). Focus is on the heading, and Enter does nothing (`Game.tsx:1184-1193`).<br>• **Enter discards a paid effect:** after the cost, the target choice's primary is "Choose none ⏎". Enter with focus on the heading clicks it (`Game.tsx:603-610`) and the paid effect does nothing (rewind is the only recovery).<br>• **DON!! location (F8a.4):** no counts; "A DON!! given to Kaido" is ambiguous when both Leaders are Kaido; no warning that taking the attacker's DON!! lowers its power mid-attack (`Decision.tsx:1311-1318`; `03e`).<br>• **Order (F8b):** a one-click "pick first" inside a numbered list titled "Resolve in this order", with no timing word or cost (`Decision.tsx:303-325`; `04a`). Card ordering for Streusen and OP07-077 reuses that panel, with no reveal tray, and OP07-077 asks three times for the bottom order (F8c.2 defaults it) (`05i-*`).<br>• "Trashing to make room is not a K.O." appears on every card choice (`Decision.tsx:1412-1414`). | screenshots as cited in `.cache/m4a-review/` | flows.md F6.2 lane 3, F6.4, F8a–F8d; board.md §3.5, §3.9 | Fix in the M4a follow-up or carry to M5a with a target. The Enter-discards case and the Counter staging come first. |
| M4a-10 | 2 | Engine: latent ordering and replacement gaps (M4b) | Not reachable with the 37 scripts against each other; reachable once M4b scripts land:<br>• Nola's Q&A: two Characters removed at once are both kept by one DON!! return, but the engine offers the replacement per card (rulings appendix, marked *untested*).<br>• At the End Phase, [End of Your Turn] effects, delayed "at the end of this turn" effects and [End of Your Opponent's Turn] effects go into **separate** batches (`flow.ts` `endTriggers`). The turn player cannot order a delayed effect against their [End of Your Turn] ones.<br>• A delayed effect whose source is on the field and negated by then is dropped (`drainPending`'s negation check applies to delayed entries). A created delayed effect does not depend on its source. | `flow.ts:245-255`, `drainPending`; `rulings.md` appendix | CR 6-6-1-1, 8-6-1, 8-1-3-4; QA-OP15 OP15-069 | Fire the End Phase timings and the delayed effects as one batch per player. Skip the negation check for delayed entries. Handle one removal event over several Characters as one replacement offer before M4b scripts a multi-removal. |
| M4a-11 | 1 | Events | `ModeChosen.label` is the chooser's wording ("Your opponent draws 2 cards.") but goes to both players, so it reads wrongly for the Linlin player. | `OP17-049.ts` labels; `run.ts` `mode` | — | Emit the mode index plus a neutral label ("Linlin's controller draws 2"), or label per viewer in the app. |
| M4a-12 | 1 | Hash | The summary hashes projection keys and batch counters (`pending[].key`, `pending[].batch`, `battle.keys`, `delayed[].key`), so two identical positions reached differently hash differently. That contradicts `hash.ts`'s "id allocation … keeps every golden hash". `known` is not hashed, though it changes what a player can do. | `hash.ts` `summary()`; `flow.ts` `fire` | ADR 0004; ARCHITECTURE §2.9 | Drop keys and batch numbers (use queue order) and add `known` by position. |
| M4a-13 | 1 | Benchmark | The method is sound for what it measures: engine playouts from 485 real Main-Phase starts, `legalActions` once per action, fresh immutable states, in a `worker_threads` worker. I measured a median of 5,106 per second (5,005 / 5,106 / 5,182). It is not yet what MCTS will run: there is no determinization per iteration, no `project` at the root and no evaluation. `createFromScenario` for a full position costs about 75–80 µs, about 40% of one two-turn simulation (about 196 µs). It runs in Node with `tsx` on an M4 Pro, not in a browser worker. The 5× margin covers all of that, so ADR 0008 stands. | `npm run bench:two-turn`; `engine/test/review/determinize.bench-probe.test.ts` (`createFromScenario` 73–80 µs; `reduce`+`project` 52–54 µs) | ADR 0008 | Say "engine playout throughput" in `benchmarks.md` and ADR 0008. In M5a, add the determinization step and the browser-worker figure. |
| M4a-14 | 1 | API docs | The additions are additive and no frozen field changed. The `pick.choice` union widened to `OptionChoice`, and every consumer handles it. The `ProjectedView` additions (`looking`, `known`, `attackLock`, `delayed`) are documented in `project.ts`, not `api.ts`. `Decision.purpose: 'order'` covers both pending-effect order and card order, and its doc does not say so. | `git diff 799dfcd~1 f06d180 -- engine/src/api.ts` | ARCHITECTURE §2.1 | Move the `ProjectedView` docs to `api.ts` and note the two meanings of `order`. |
| M4a-15 | 1 | App nits | • The Setup copy "every card's effect is automated" overclaims while M4a-03 stands. It sits above the form, not by each deck, does not say whose deck in hotseat, and "4 of 51" counts copies and treats vanillas as not automated (`decks.ts:60-72`; `08b`, `08c`).<br>• A hand popover stays open over the board during OP07-077's choice (`05i-op07077-0`).<br>• The trash-cost list uses the target glyph and "· —" power (`03m-woro-0`).<br>• The optional, order and option footers have no Rewind button; only U rewinds. | as cited | board.md §3.9 | Fix in passing. |

**Counts:** severity 4: 2 (M4a-01 open, as M3-39; M4a-02 fixed by 64ddfb5); severity 3: 3 (M4a-03, M4a-04, M4a-05; all still present at `c68c645`); severity 2: 5; severity 1: 5.

## Notes on severity

- **M4a-01 and M4a-02 are hotseat-only, but hotseat is a shipped mode.** DECISIONS (2026-10-29) defines its public view as what both players may see, and M3 was failed four times on exactly this class. Both are new surface from M4a's effect decisions. 64ddfb5 fixed M4a-02's root cause (`publicView` copied the decider's own decision). M4a-01's root cause remains: the veiled screen still shows answers, or whether an answer exists, computed from private legal actions. When it is fixed, the twin test should include OP07-077's take step with and without a match in the top 5.
- **M4a-04 is a 3, not a 2.** It is not hypothetical. OP17-118 is the Rocks deck's top-end payoff, and the cards it plays are exactly those whose [On Play] order matters (Streusen, Kyo, Linlin, OP17-042 Kaido, Gloriosa, Stussy). The engine takes the choice from the player at random.
- **M4a-05 is a 3** because, for a screen-reader user, an AI turn's effects are invisible. Principle 4 and the flows spec both make the log carry them.

## E-Q12: are DON!! −X costs on Events optional?

**Yes, by official evidence, not by inference.**
- **CR 8-3-1-4:** "Activation costs may be specified using "can" or "may". The player can choose not to pay the activation cost; however, this will mean the effect as written after the : colon mark cannot be activated."
- **The card text:** every DON!! −X in `cards/data` carries the reminder "(You may return the specified number of DON!! cards from your field to your DON!! deck.)". Examples are OP07-076, OP09-077 and ST04-016.
- **QA-ST01–04, ST04-016 Blast Breath** ("[Counter] DON!! −1 …"): "Can I activate this card without paying the DON!! −1? — Yes. You can activate the card, but nothing will happen."
- **The caveat:** the cached PDF text is column-scrambled. I attribute the row to ST04-016 because it sits between ST04-015 and ST04-016 and ST04-016 is the only card there with a DON!! −1. A person-scale look at the PDF row would confirm it. I did not fetch the official site.
- **Nothing against it:** QA-GR's OP03-074 row ("can I activate the [Main] without paying its DON!! −2?" — "No") is about a [Trigger] that activates a [Main], so its effect cannot happen without the cost. It does not say the cost is mandatory. The OP15 rows (OP15-073 to -075) only confirm that DON!! −1 can be paid with no target.

So E-Q12 should close as "optional", and M4a-08 is the engine change.

## Claims verified

| Claim | Result |
| --- | --- |
| 37 Rocks and Kaido cards 100% scripted, each with a test | **Holds.** 37 scripts, 37 per-card test files, and the independent suite (314 tests, all passing at `f06d180`). Two exceptions: M4a-03 (the [Activate: Main] scripts work in the engine but not from the UI) and M4a-08. |
| Tests green | **Holds.** At `f06d180`: 950 tests pass (164 todo, 134 files run); `tsc` and `eslint` are clean. (STATUS's 633 predates the merge of the 314 independent tests.) |
| Leak property, more games | **Holds**, apart from M4a-06. `ENGINE_GAMES=2000`: both properties pass. My stricter event-card copy passes at 3,000 games. Nightly configuration at `f06d180`: goldens, the four game properties, the linkage property and the projection properties pass; the invariance property fails on the M4a-06 false positive. |
| M2-17 (no raw id in projected events) | **Fixed.** `BattleEnded` and the drained `EffectActivated` carry keys; `projectEvents` drops any field still holding an id; the linkage property asserts it (passes at 2,000). |
| M2-18 | **Fixed.** `reduce(state, null)` throws `IllegalAction: That is not an action.` |
| M2-19 | **Fixed in the engine.** A forced pick or done is skipped when observed only if every candidate is visible or `publicCount` holds. Probes: OP07-077 with no match (`max` 0) gives observed `autoSkip` `null`; Queen with no {Animal Kingdom Pirates} card gives `null` when observed and declines when not. The app-side gap is M4a-01. |
| M2-20 | **Fixed.** `eslint --stdin` reports both a dynamic `import('@optcg/engine')` and a `GameState` type import in `app/src/play/`. |
| M2-21 | **Fixed.** Nightly runs write `test-results/property-seed.json`. |
| M2-22 | **Fixed.** Ids are `$` plus 7 characters, and `hash.ts` maps by that prefix, including compound keys. |
| M2-23 | **Fixed.** RL-21 asserts the Main-Phase decision after a Banish. |
| API additions additive | **Holds** (M4a-14 for documentation). |
| Benchmark ≥1,000 two-turn simulations per second | **Holds:** median 5,106 per second in my run. On representativeness, see M4a-13. |
| B-1 fixed (6d13ba9) | **Holds** for the five flagged abilities. DON!! −X Events remain (M4a-08). |
| 354e2a8 | Test timeouts only; no behaviour change. |

**Not done:** a real screen-reader pass (same as M3); the 1920×1080 effect screenshots; a screenshot of M4a-02's render (traced in code and through `GameSession`).
