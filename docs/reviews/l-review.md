# L review: Learning slice (tiered lethal detector, `public` and `actual` lethal search, battle panel, missed-lethal review, Practice this)

**Date:** 2026-11-05
**Reviewer:** an independent, adversarial review by a subagent. The brief was to find what is wrong. I re-checked every severity 3 and 4 finding by playing the position out through the engine, not by reading the search's own bookkeeping.

**Build reviewed:**
- Branch `worktree-agent-a6227d2bb1bdb4e89` at `918626f` (the L UI half on top of the L engine half and the A1 fix `c2e4054`).
- A clean worktree with its own `npm ci`, so `@optcg/*` resolves to the worktree's packages. E2E ran on `E2E_PORT=4394`.
- No production code was changed. Mutations (see "Do the tests have teeth?") were applied and restored by a script; `git status` shows only this file.

**Rule (as in M4a and M5a):** any severity 3 or 4 finding fails the milestone.
- 4 = a hidden-information leak, or a false claim taught to the player;
- 3 = a rules error that changes play, or a defect that blocks a task or the milestone's purpose;
- 2 = should fix;
- 1 = nit.

L review: **FAIL** (open: L-01 and L-02 at severity 4; L-03 at severity 3).

What holds up:
- **No hidden-information leak was found.** In 522 differential checks on positions from real Rocks and Kaido games, re-rolling every hidden card of the opponent (hand, deck, Life) left the player's `SearchView` byte-identical and the detector's answer identical. `actual` mode is reachable only from the post-game review, and the app test that walks `app/src` guards it. The coach is off in hotseat.
- **The planted missed-lethal game works end to end.** It is flagged `any-hand` with the line of explanations.md E01. Study restores it, and Practice this opens a puzzle that the line solves.
- **E20 and E01 recompute their figures from the position.** The A1 fix and the carried items M4a-16, M4a-18, M5a-17, M5a-18 and M5a-21 are in, and most have guards.
- **Every hindsight flag I verified from real games was correct:** all 12 flags of the 8-game run at the default cap had lines that won against every defender answer.

What fails:
- **L-01, severity 4.** The "too few attackers" shortcut answers "No lethal" at certainty "Works against any hand" for a position that has lethal (a hand Character that gives itself Rush). The review prefilter drops the same turn, so the missed lethal is never flagged.
- **L-02, severity 4.** The corrected A1 still proves "Lethal, works against any hand" for lines that a real Rocks hand stops, because a hidden card cannot pay a cost that names a type (Shiki's "trash 1 card with a type including Rocks Pirates").
- **L-03, severity 3.** At the app's caps the detector says "Couldn't finish checking" for 86% of the positions that need a search, and for 99.5% of them against Kaido. A longer wait does not help: every sampled unknown was still unknown at 3 s and at 8 s. The flagship worked example, E20, is unknown at 1.5 s and at 3 s.

## Method

1. **Read:**
   - `docs/PLAN.md` §2 and row 13;
   - ARCHITECTURE §4.1, §4.4, §4.5;
   - `learning-ui.md` §2–4;
   - `explanations.md` E01–E03, E18, E20;
   - `accessibility.md` §3.12;
   - `curriculum.md` L15 and L16;
   - every 2026-11-05 DECISIONS entry that starts "L" or "L UI", including "A1 corrected".
2. **Read the code:**
   - `ai/src/search/lethal/` (all nine files);
   - `app/src/play/coach/` and `app/src/play/review/`;
   - the controller's puzzle and coach wiring, `Game.tsx`'s coach keys and `focus.ts`;
   - the carried-items diff in `30f4c13`.
3. **Ran the repository's checks:**
   - `npm run typecheck` and `eslint ai/src app/src`: clean;
   - the L suites (`ai/test/lethal*.test.ts`, `explanations.test.ts`, `app/test/coach.test.ts`, `review.test.ts`, `carried.test.ts`, `ai-guards.test.ts`): 50 passed;
   - `app/e2e/learning.spec.ts` on both projects: 8 of 8 passed at 720p and at 1080p, with axe on every panel.
4. **Probes** (not committed; they live in `.cache/l-review/`, which is gitignored):
   - `a7.test.ts`, `a7b.test.ts`, `a7c.test.ts`: the Rush position of L-01, then played by hand through the engine to a win.
   - `shiki.test.ts`, `shiki2.test.ts`: a sweep of 91 `public` proofs against a Rocks defender with Shiki on the board, each played against **every** defender answer (`util.ts` `refuteLine`: the line is fixed and all the defender's legal answers are explored). Then one case traced move by move.
   - `rate.test.ts`, `rate2.test.ts`: Rookie-versus-Rookie games in all four Rocks and Kaido pairings (4 seeds, 16 games, 1,566 Main-phase decisions of either seat). At each, `lethal` in `public` mode at the app's 1.5 s cap; for one seed, the unknowns again at 3 s, and a sample of 16 again at 8 s. The same run did the **differential** on every third position: it rebuilt the state with the opponent's hand, deck and Life re-rolled from their own list, then compared the view and the answer.
   - `flags.test.ts`: `reviewMissedLethal` over 12 real games at 30,000 nodes, then 8 at the app's default of 150,000. Each flag's line was replayed against every defender answer.
   - `e20.test.ts`: the E20 and E01 positions at the app's caps.
   - `puzzle.test.ts`: the controller's puzzle state after a failed turn, then a later win.
   - `e2e/focus.spec.ts` (own Playwright config `pw.config.ts`): where focus lands after each coach action.
   - `mutate.py`: 16 reverts or breakages of key fixes and guards, each followed by the tests that should catch it.
5. **Screenshots** from `learning.spec.ts` at 1280×720 and 1920×1080 in `.cache/l/`: the coach at tiers 1, 2 and 3, the guided count at questions 3 and 4, the battle panel on attack and defence, the review Overview and Study, the puzzle and the game-over panel. I read the 720p tier 3, review Overview, practice and battle-panel images and the 1080p guided count.

## Findings

| ID | Sev | Area | Problem | Evidence | Rule | Fix |
| --- | --- | --- | --- | --- | --- | --- |
| L-01 | 4 | AI: `attackersPossible`, the "too few attackers" answer | **A position with lethal is answered "No lethal: you need 2 hits and have 1 attacker", at certainty `any-hand`, in both `public` and `actual` mode.**<br>• `attackersPossible` counts a hand Character as a possible attacker only when its text matches `/\[Rush/` (`lethal.ts:192`).<br>• Kaido's own list has `EB04-030` Kaido, whose text is "[On Play] DON!! −2: … this Character **gains Rush** during this turn". There is no bracket, so it is not counted.<br>• The answer returns before any search (`lethal.ts:266`), with certainty `any-hand`, and the copy "No lethal" (`explain.ts:72`, `:416`).<br>• The review's prefilter (`review.ts:91`) uses the same function, so the turn is skipped and the missed lethal is **never flagged**.<br>• DECISIONS A7 says the bound "errs only toward searching" and, in the same paragraph, that an effect that adds an attack "could make a rare lethal show as refuted". Both cannot be true; the second is.<br>• Not rare in the slice: the Kaido list runs this card. Other attackers a hand can add are not counted either (an untap effect, a granted [Rush]). | Position: Kaido Leader, `EB04-030` in hand, 10 active DON!!, a Rocks defender at 1 Life with no hand, no DON!!, no Blockers. `pub` and `act` both give `refuted / any-hand / reason attackers` (`a7.test.ts`). Played through the engine (`a7c.test.ts`): play Kaido (Rush), attack with the Leader (5000 against 5000, a tie, a hit: Life 0, hand 1), attack with Kaido (9000): `{"winner":"p1","reason":"damage at 0 Life"}`. The defender had nothing to answer with, so no answer changes it. | learning-ui §3.1 (Refuted must be true; Unknown is the answer when not sure); ARCHITECTURE §4.4; explanations.md "never presented as no lethal" for a cap | Do not answer "refuted" from this bound unless it is certain: treat every Character in hand, and every hand card whose script or text mentions Rush, "active", "untap" or "attack", as a possible extra attacker (or simply run the search, which already plays cards from hand). Never label the shortcut `any-hand` while it ignores effects. Add a planted test with `EB04-030` in hand. |
| L-02 | 4 | AI: `public` model (A1 still incomplete) | **A line labelled "Lethal, works against any hand" loses to a real Rocks hand, because a hidden defender card cannot pay a cost that names a type.**<br>• The hidden hand is made of placeholder Events with `types: []` (`public.ts:51`).<br>• Rocks's own Shiki (`OP17-048`) has "[When Attacking]/[On Your Opponent's Attack] [Once Per Turn] You may **trash 1 card with a type including "Rocks Pirates"** from your hand: give up to 1 of your opponent's Characters −3000 power". No placeholder qualifies, so the model never lets Shiki fire.<br>• A real hand does: nearly every Rocks card has that type. One hand card is then worth −3000 on the first attacker (more than the +2000 the model grants), and the line fails.<br>• The A1 test list (`lethal.test.ts:716`) checks only [Counter] abilities; abilities on the defender's board that spend the hidden hand are not checked, and the model's `gaps` do not see them.<br>• The result is the false claim A1's correction set out to remove: `certainty: 'any-hand'`, "they can't stop any of them". | A Rocks defender with Shiki on the board, 1 Life, 1 card in hand; the attacker has Sanji (7000, no DON!!) then Luffy with 4 DON!! (9000). `public` says proven, `any-hand`, oblivious. Played against all defender answers with a real hand of one Don Marlon (`OP17-052`, Rocks Pirates): Shiki trashes it, Sanji becomes 4000 against 5000 and is stopped; the Leader then takes the last Life and the line has no third attack (`shiki2.test.ts`, move by move). The same position **without** Shiki is sound. Sweep (`shiki.test.ts`): of 91 oblivious `public` proofs (Sanji and Zoro lines, 0–10 DON!!, 1–2 Life, hands of 1–3), 60 lose to a real hand of Rocks Pirates cards. | learning-ui §3.1 and §4.3 ("This works against every hand they could have had"); explanations.md "Certainty" table; DECISIONS "A1 corrected" ("a proof holds against every hand the prior allows") | Give the hidden placeholders the union of types of the prior's cards (and, for a hand cost that names a category, a card that satisfies both), or report any defender-board ability whose hand cost the placeholder cannot pay in `modelGaps` so the claim drops to `needed-hidden-info`. Add a planted Shiki test and a property test: replay every oblivious `public` proof against the exhaustive defender (`refuteLine`) on random hands from the prior. |
| L-03 | 3 | AI and app: how often the detector answers | **At the app's caps the detector answers "Couldn't finish checking" for 86% of the positions that need a search, and for 99.5% of them against Kaido. Waiting longer does not help.**<br>• 1,566 Main-phase decisions (16 Rookie games, both seats): 1,230 were answered at once by the attackers bound; 336 needed a search. Of those, **289 were unknown** (86%), 27 proven, 20 refuted. **Against a Kaido defender: 202 of 203 unknown.** In turns where a search ran, 72 of 84 had no answer at all. At the first Main decision of a turn: 75 of 83 unknown.<br>• At the press cap (3 s) all 48 unknowns of one seed were still unknown; at the retry cap (8 s) all 16 sampled were still unknown.<br>• The flagship example is affected: E20 (Kaido against Rocks) is unknown at 1.5 s (46,272 nodes) and at 3 s (94,912 nodes) and proven at 4.05 s (128,699 nodes) on this machine. A browser worker that is 2× slower fails at "Check again" too. E01 is proven in 75 ms.<br>• Review, at its default of 150,000 nodes (8 real games, both seats): 32 flags, of which 20 are "Not fully checked" markers (62%) and 12 hindsight; no severe flag.<br>• Cause, from DECISIONS: A1's rest and draw modes multiply the defender's answers. The model also drops the DON!! cost of every Counter Event, though the defender's DON!! is public; a Kaido hand of "+4000 for DON!! −1" cards is therefore always at full strength.<br>• The honesty is intact (nothing says "no lethal"), but the learner's experience against Kaido is a coach that almost never answers. | `rate.test.ts` (`.cache/l-review/rate.json`), `rate2.test.ts` (`rate2.json`), `e20.test.ts`, `flags.test.ts` at `FLAG_NODES=150000`. Measured in Node on an Apple M4-class machine, with a second probe or a Playwright build sharing the CPU for parts of the run, so the true rate is not better than this. Rookie games are not human games; the positions are real, though, and the counts include seats with lethal on board. | learning-ui §3.1 ("Unknown … never presented as no lethal", and a detector the player can use); PLAN row 13 and §2 done criterion ("the tiered lethal detector works"); DECISIONS "A1 corrected" ("against Kaido the search hits its cap … much more often") | Keep each Counter Event's DON!! cost and pay it from the defender's real, public DON!! (it prunes most modes when the defender has little or none). Bound the modes by hand size. Share the transposition table across the three DON!! budget passes. Order the defender's modes so refutations come first. Report the node rate and the unknown rate in `benchmarks.md` and gate on them (for example: E20 proven at the 3 s press cap; fewer than 30% unknown over a fixed sample of Kaido and Rocks positions). Until then, say in the coach that the check is "usually not finished against Kaido" rather than offering it always-on. |
| L-04 | 2 | App and AI: Trigger caveat and the prior stated as fact | • The polite line and the SR text for a proven result read "Lethal: proven, works against any hand." (`explain.ts:66`). The Trigger caveat of learning-ui §3.1 ("unless a Life card's Trigger stops it") is only in the visual panel (`triggerNote`), so a screen-reader player hears the unqualified claim. Kaido's lists run four Trigger cards, one of which draws 2.<br>• The certainty chip's tooltip for `any-hand` is the review's "every hand they could have had" in the live coach too (`ExplanationView.tsx:26-27`).<br>• In review, E01 says "Their deck runs no Trigger cards, so the Life card can't stop you either." (`explain.ts:350-351`). That is the prior's three sourced lists, not their deck. | `explain.ts:55-66`, `Coach.tsx` `Tiers`, `coach.ts` `speakResult`; `tier1` for a Kaido-defender proof returns `triggerNote` but `sr` has none. | learning-ui §3.1 "SR (polite)" and "Triggers"; accessibility.md §3.12 | Append the caveat to `sr` when `triggerNote` is set. Say "In the lists we know, their deck runs no Trigger cards." |
| L-05 | 2 | AI: review flags | **A turn is flagged "missed lethal" whenever lethal was available and the seat did not win, even if the seat played exactly the proven line and lost to a Life Trigger.** `reviewMissedLethal` compares nothing with what the player did (`review.ts:88-120`). With a deck that has Triggers (Kaido) the flag says "You had lethal this turn" (severe, "Holds whatever they held") to a player who attacked as the proof says. The Trigger row of the explanation is the only caveat. I did not reproduce this in a played game (Rookie seldom attacks with the proof; 0 severe flags in 20 real games); it follows from the code. | `review.ts:88-120`; `explain.ts` `triggerRow` (review context only) | learning-ui §4.2 ("a flag … was a mistake you could have seen") | Compare the seat's actions with the line (or with "all attackers at the Leader"); if the seat attacked with at least the line's attackers, drop the flag or label it "Stopped by a Trigger". |
| L-06 | 2 | App: puzzle judging | **A failed puzzle reads "Practice · solved" if the player wins on a later turn, and a second attempt after Rewind is never announced.**<br>• `puzzleState` returns `solved` for any win by the player, before the turn test (`controller.ts:455-460`). Confirmed: after End turn (`failed`), the same puzzle played on to a win reads `solved` (`puzzle.test.ts`).<br>• `puzzleNoted` is set once and never reset (`controller.ts:276-285`). Rewind (`U`) is available in a puzzle, so a retry's "Solved" or "Not this time" produces no polite line and no toast.<br>• The unit test checks only the first failure. | `controller.ts:455-460`, `:276-285`; `.cache/l-review/puzzle.test.ts` output "after end turn: failed … final solved" | learning-ui §4.5 (solved on the turn it was cut from); accessibility.md (results announced) | Judge a win as solved only if `v.turn.number === puzzle.turn`; reset `puzzleNoted` on a rewind; add both to `review.test.ts`. |
| L-07 | 2 | App: focus after coach actions | **Three coach actions throw focus out of the coach, to the decision heading.** The M3 rescue (`focus.ts`) puts focus on the last board spot or `#decision-title` whenever the focused control unmounts, and the coach does not claim focus first. Observed with the keyboard (`focus.spec.ts`): Enter on **Count it with me** → `H2#decision-title` ("Your Main phase"); Enter on **Next** at question 3 → question 4 → the same heading; Enter on **Close** → the same heading. A screen-reader player is taken out of the questionnaire and hears the decision title instead of the question. L presses, "How many hits?" and Next on questions 1 and 2 are fine. | `.cache/l-review/e2e/focus.spec.ts` output; `coach.ts` `startGuided` and `guide` do not bump `focusSignal`; `focus.ts:42-50` | accessibility.md §4.3 and WCAG 2.4.3; learning-ui §2.1 (focus goes to the section's result when the player pressed a coach key) | Bump `focusSignal` in `startGuided`, `endGuided` and on a step change that replaces the focused button, aimed at `.guided-q` (or the result for Close). Add the three to `learning.spec.ts`. |
| L-08 | 2 | App: battle panel bound | **"What they could have" shows only +power, while A1 models Counters that also rest a Character or draw.** On an attack against Kaido the panel reads "N cards in hand: up to +X if each is one of their deck's +4000 Counters" and nothing else. The coach's own tier 3 says "Their Counter cards can also rest one of your Characters or draw a card" when it applies, and the proof depends on it (the planted A1 line). A learner reading the panel will assume only power can change the battle. The bound is a true upper bound on power; the omission is what misleads. `FALLBACK_COUNTER` is also defined twice (`BattleExtras.tsx:16`, `public.ts:33`), and `eventCounterOf` reads only `when === 'counter'`, not an array of timings (`knowledge.ts:24`), where `profile.ts` reads both. | `BattleExtras.tsx:47-61`; `profile.ts` `counterProfile`; the unit mutation M16 passes (below) | learning-ui §2.7; DECISIONS "the battle panel's coach additions" ("If A1's fix changes how `public` bounds a hidden card … this number should follow it") | Read `counterProfile(priorCardIds(leader))` in `theyCouldHave` and add one line when `rests` or `draws`. Export one `FALLBACK_COUNTER`. |
| L-09 | 2 | Scope against PLAN row 13 | PLAN row 13 lists "battle panel and **DON!! overlay (`preview`)**". The board overlay ("+4000 to stop" on each legal target, learning-ui §2.7) is not built, and no milestone is named for it. Also unbuilt and without an owner in STATUS: the opponent's-turn threat check (learning-ui §3.1 "Both players"; blocked by M5a-02), the "Practised: solved" mark on the flag, the "Their real hand: one way to see it" label on a hindsight puzzle, and the any-hand puzzle's harder hand. DECISIONS records each as skipped, which is honest; the gap is that nothing schedules them. For the slice they are acceptable (the done criterion needs none), but the PLAN row should be split. | PLAN row 13; DECISIONS "L UI" entries; STATUS "Not done" | PLAN §1 (every row has an owner) | Add rows (M7 or M8) for the overlay, the threat check and the puzzle bank, or strike them from row 13. |
| L-10 | 2 | Tests with teeth | Two fixes have no test that fails when they are removed (mutation run, below):<br>• **M2:** claiming `any-hand` when the model has gaps passes every L unit test. The only test of `gaps` is the "covers every [Counter] ability" test, which checks the profile, not the certainty.<br>• **M9:** running the always-on check inside a puzzle (the exercise) passes.<br>• **M16:** the battle panel's hand count has no unit test (the e2e covers it, with one position).<br>Also weak: the A1 planted test asserts only `not.toBe('proven')`, which a cap passes (`lethal.test.ts:755`); `lethal-games.test.ts` runs at 8,000 nodes by default and then only asserts the real hand does not **refute** a public proof, so 86% of positions (L-03) are `unknown` and pass; nothing replays a public proof against an exhaustive defender (L-02 passes the suite). | `.cache/l-review/mutate.log` | PLAN §5 ("tests that fail when the fix is reverted") | Add the three tests above, assert `refuted` in the A1 test, and add the exhaustive replay of L-02 to `lethal-games.test.ts` at a node cap where most positions finish. |
| L-11 | 1 | Copy and docs nits | • E03's evidence in the doc names the limit ("in its 4-second limit") and the position's defence; the code prints "checked N lines" with an unformatted number (`explain.ts` unknown branch) and no defence row.<br>• The guided count says "Order the attacks: smallest first, the hardest to stop last" (`Coach.tsx:476`). The curriculum (L16) says there is no universal smallest-first rule. The rule that holds is "the attack that must beat the most cards goes last"; say that.<br>• accessibility.md §3.12 says `C` moves focus into and out of the panel; learning-ui §2.1 and the code say it never does. The docs disagree and DECISIONS does not record the choice.<br>• `analyse.ts:88` `maxDefence` stops silently after 4,000 nodes, so a figure in the evidence can under-report.<br>• `checkGuidedCount` accepts a split by attack position, not by which attacker stands there, so a Character that a shrink effect singles out is judged like any other. | as cited | explanations.md copy rules; curriculum L16 | Fix the copy; record the `C` decision in accessibility.md. |

**Counts:** severity 4: 2 (L-01, L-02); severity 3: 1 (L-03); severity 2: 7; severity 1: 1.

## Exit criteria

| Criterion | Result |
| --- | --- |
| The planted missed-lethal game is flagged `any-hand` with a correct line | **Met for the planted game** (unit test, e2e, E01 word for word). **Not sound in general:** L-01 hides some lethal turns and L-02 can make the proof false. |
| The tiered detector works | **Partly.** Tier 1 to 3, the statuses, the guided count and the always-on badge work in planted positions and the keyboard path holds. At the app's caps it does not finish in 86% of the positions that need a search (L-03). |
| "Practice this" opens the moment as a puzzle; solved and failed are judged | **Met for the first attempt.** A later win reads solved and retries are not announced (L-06). |
| A manual screen-reader pass is recorded | **Not met (known outstanding).** `docs/design/a11y-passes/` has only the M3 passes. Nothing in L was heard in a screen reader. L-04 and L-07 are the sort of thing that pass would find. |
| PLAN row 13: battle panel | **Met**, with L-08. |
| PLAN row 13: DON!! overlay (`preview`) | **Not built** (L-09). |
| PLAN row 13: lethal search, `public` and `actual` | **Built; unsound in two ways** (L-01, L-02) and mostly unfinished against Kaido (L-03). |
| PLAN row 13: missed-lethal flag end to end with real copy | **Met** for the planted game, and `actual` hindsight flags from real games were all correct; false positives (L-05) and the unflagged turns of L-01 remain. |
| No hidden-information leak | **Met.** 522 differential checks, no difference; `actual` only after the game; hotseat off. |
| Accessibility basics | **Mostly met.** Axe clean on every L panel at 1280×720 and 1920×1080; keyboard-only tiers work and the coach never moves focus by itself; L-07 is the exception. |

## Verdicts on the L decisions (DECISIONS, 2026-11-05)

| Entry | Verdict |
| --- | --- |
| L: what `public` lethal assumes, and how the search is built | **Needs changes.** A7 is wrong as written (L-01). A5 and A6 (searched moves) are sound for proofs; I did not test the claim that a refutation is exhaustive under them. The 30 µs per node and 78,000-node figures for E20 are out of date after A1 (128,699 nodes, 4 s). |
| L: the lethal detector's output, the missed-lethal flag, and the worker request | **Acceptable**, with L-05. Skipping the opponent's-turn check and "lethal given away" is fine for the slice (L-09 asks for an owner). Reading certainty from the result is right. |
| L: A1 corrected | **Not complete.** The modes are the right idea and the rest and draw cases hold (the planted Kaido line is refuted). The skipped part, "costs dropped", is sound for DON!! and trash costs but **not** for costs that name a type or category (L-02), and dropping DON!! makes the model too strong (L-03). |
| L UI: the coach strip, the tiered detector and its worker | **Acceptable.** The second worker, the public-only request, the priorities and the "no always-on in a puzzle" rule are right (M9 shows the last has no test). Hotseat off and no "line kept" badge are acceptable. |
| L UI: "Count it with me" without the board sandbox | **Acceptable.** A table in the panel that calls nothing in `act` meets the intent (nothing is played); the spec's on-board step is the first thing a usability session would test. Keep L-07 and the "smallest first" copy in view. |
| L UI: the battle panel's coach additions use the public bound | **Acceptable with L-08.** |
| L UI: the missed-lethal review | **Acceptable.** Using the real hand for an any-hand puzzle is a fair, recorded simplification (the puzzle can be solved by a line that would not beat a harder hand, and the "Solved" copy says only "you won on the turn it was cut from"). L-06 and L-09 apply. |
| L: carried items M4a-16, M4a-18, M5a-18, M5a-21 | **Accepted.** `carried.test.ts` and `ai-guards.test.ts` pass; the unpayable-Event warning needs two presses and is spoken. M5a-17 is also fixed (`ai/src/explain.ts:78` `takeOutcome`, with `ai/test/take-outcome.test.ts`) though DECISIONS and STATUS do not list it. |

## Do the tests have teeth?

I applied each change to production code, ran the named tests, and restored the file (`git status` is clean afterwards).

| # | Change | Result |
| --- | --- | --- |
| M1 | A1 fix off (default model `power-only`) | **Caught** (`a Counter that rests an attacker refutes a line…`) |
| M2 | `any-hand` claimed despite model gaps | **Not caught** (L-10) |
| M3 | review flags a turn the seat won | Caught (`a turn the player won is not flagged`) |
| M4 | review treats the record's end as a turn | Caught (3 tests) |
| M5 | refutation copy says "stop N of N" | Caught (`refuted: the defender can stop a hit…`) |
| M6 | background detector at priority 1 | Caught (`coach.test.ts` always-on) |
| M7 | a puzzle never fails by the turn passing | Caught (`a puzzle fails when its turn ends…`) |
| M8 | detector offered in hotseat | Caught (`is not offered in hotseat`) |
| M9 | puzzle runs always-on checks | **Not caught** (L-10) |
| M10 | the guided count accepts any split | Caught (the guided-count test) |
| M11 | attackers prefilter off | Caught (`refutes without a search…`) |
| M12 | every deck card a drawing placeholder | Caught (a test fails; the run was slow and I stopped it) |
| M13 | Trigger note dropped | Caught (`depends on a Trigger…`) |
| M14 | the `need` figure off by 500 | Caught (4 tests, E01 and E20 among them) |
| M15 | the per-attack hand-size figure | Caught (4 tests) |
| M16 | the battle panel's hand count | **Not caught by a unit test** (the e2e position would catch it; I did not run it) |

E20 and E01 recompute their figures: `lethal.test.ts:535-565` derives the stop values and maximum defences from the planted position (`6000 + 2 × 1000`, `9000 − 5000 + 1000`, 1, 2 and 3 cards) and compares the explanation with the doc's own object. M14 and M15 confirm that breaking either figure fails them.

## What I ran

- `npm ci`; `npm run typecheck`; `eslint ai/src app/src`: clean.
- `vitest run` on the L suites: 50 passed.
- Playwright `app/e2e/learning.spec.ts`, 720p and 1080p, `E2E_PORT=4394`: 8 of 8 each.
- The probes of "Method", and the mutation script.
- The measured "Unknown" rate: **289 of 336 searched positions (86%)**; 18% of all Main decisions; against Kaido 202 of 203 (99.5%); against Rocks 87 of 133 (65%); 75 of 83 at a turn's first Main decision. At 3 s: 48 of 48 still unknown (one seed); at 8 s: 16 of 16.

## What I did not verify

- **A screen reader.** Nothing was heard; the pass is outstanding.
- **A human at the board.** The games were Rookie against Rookie, so the mix of positions is not a person's. No usability session.
- **Browser speed.** The detector's caps were measured in Node on an Apple M4-class machine, not in a browser worker; a slower worker is worse.
- **The full unit suite** (`npm test`) and the rest of the e2e suite: I ran the L suites and `learning.spec.ts` only. I did not rerun `hidden-differential`, `hotseat-leaks`, `a11y-focus` or `keyboard` specs against this build.
- **Severe flags from real games.** No real game I generated produced a severe flag, so the false-positive rate of the `any-hand` flag outside the planted game is not measured, and L-05 is from the code.
- **A5 and A6** (searched moves) as grounds for a *refutation*: I tested proofs, not the claim that a refutation covers every move.
- **Other archetypes' priors.** I scanned every prior's [Counter] operations (no gaps) but searched positions only against Rocks and Kaido.
- **Firefox, Safari, touch and the tablet layout** for the coach and the review.
- **Hindsight "Show" and the "Analyse deeper" path** in the browser (it reruns at 1,500,000 nodes per search).
- **Whether the detector's timing is hidden-information free under real load.** The differential shows the answer and the request depend only on the view; the wall-clock cap is the one thing that varies with the machine.

## Notes on severity

- **L-01 and L-02 are severity 4** under the project's own definition: each makes the coach state a falsehood ("No lethal", "works against any hand") about a position the engine can show otherwise. Both are in the slice's flagship deck.
- **L-03 is severity 3** because it defeats the milestone's purpose against one of its two decks and for its own worked example; the honesty of "Unknown" is why it is not 4.
- L-04 to L-10 are severity 2: each is an accurate defect with a small fix and no wrong game result.

L review: FAIL
