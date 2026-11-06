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

## Re-review 1

**Verdict: FAIL.** Open: L-03 (severity 3, not fixed), and two new severity 3 findings: L-12 (the attackers bound still says "No lethal, any hand" when a draw finds the Rush Character) and L-13 (the new polite and visual Trigger line says "Works against any hand" next to the chip "Depends on their hand").

**Build reviewed:** `20f4538` on main, in a clean worktree with its own `npm ci`; no production code changed. Probes lived in a gitignored `.cache/rr/` and the probe test files were deleted. Mutations were applied by a script that restores each file; `git status` is clean apart from this doc.

**What I ran**
- Builders' soundness harness at 160 positions, 4 hands each (`LETHAL_POSITIONS=160 LETHAL_HANDS=4`): 83 proven, 316 replays against every defender answer, 0 broken.
- My own harness (wider than theirs): p1 Leader plain or Kaido with Rush and draw Characters in hand; defender Rocks or Kaido with 0 to 2 random prior Characters (some rested), a prior Stage, 1 to 2 Life, 0 to 3 hand cards, 0 to 10 DON!!; every `any-hand` oblivious proof replayed against every defender answer on its own hand and on 5 re-rolled hands (half biased to Events and Counters of 2000 or more). 240 positions, 97 proven (85 any-hand), 474 replays, **0 broken**. Same run, hidden-info differential (re-rolled hand, Life and deck, then compare status, certainty, line, defence, facts, trigger, node count): **0 differences in 240**. The L-02 model holds on the slice.
- Script audit: all 37 scripts, every `do` op, every `grant`. The attackers bound's script walk is right for what it names (setActive, play, grant Rush and Double Attack). Double Attack at 1 Life correctly does not win (flow.ts `runDamage`, RL-20), so the `(n-1)*2` bound is right.
- Rate probe (Rookie v Rookie, 4 pairings, 3 seeds, `public`, 1.5 s cap): see L-03.
- `learning.spec.ts`, 720p and 1080p: 20 of 20 pass. App unit suite: 67 pass.

### Old findings

| ID | Status | Evidence |
| --- | --- | --- |
| L-01 | **Partly fixed** | Planted Rush case now proven; `reachOf` off fails 3 tests. The claim "can only err toward searching" is false for **draw then play**: see L-12. |
| L-02 | **Fixed for the slice** | Placeholder with the union of types and colours; Shiki now fires. 0 broken in 316 + 474 replays; mutation "types empty" fails the Shiki test; "gaps ignored" fails `a proof with a model gap is not any-hand`; "handCostGaps off" fails the same test. Caveats: 10 of 12 archetype priors have gaps (`Event without a script`), so their proofs are always "Depends on their hand" (honest, but see L-13 for how the UI words it). A `not: {type}` filter on a hand selection is not treated as a gap although an all-types placeholder cannot meet it; no slice card has one (not reproduced). |
| L-03 | **Not fixed** | Measured 72% (311 of 433 searched positions) unknown at the 1.5 s cap; see below. |
| L-04 | **Partly fixed** | The ai `tier1.sr` and the visual panel now carry the Trigger caveat, the tooltip is softened, "usual lists" wording is in. But the caveat text is wrong when the proof has gaps (L-13), and no test covers the polite line (L-14). |
| L-05 | **Fixed** | Played-the-proof exemption added; removing it fails `played the line and lost to a card outside the model`. Not reproduced: a needed non-attack step (rest a Blocker first) that the player skipped, while attacking with the same attackers in order, would exempt the turn (reading only: `playedIt` compares attackers and power, not the line's other steps). Severity 1 to 2, untested. |
| L-06 | **Fixed** | A win on a later turn is "failed"; reverting the turn test fails `a win on another turn…`; removing the `puzzleNoted` reset fails `a retry after Rewind is announced again`. The first test fakes the puzzle turn (`puzzle(7)`) rather than playing a real later win; acceptable. |
| L-07 | **Fixed** | The keyboard e2e walks every step and checks `activeElement`. Removing the `focusSignal` increments in `coach.ts` fails it. Reverting only the `focus.ts` rescue fails nothing (the two fixes overlap; the rescue branch is untested alone). |
| L-08 | **Fixed in the UI, untested** | The panel reads `defenceBound` and `FALLBACK_COUNTER` from `@optcg/ai` (20f4538). Forcing `extras` to `{false,false}` in `theyCouldHave` passes all 67 app tests; the unit test calls `counterExtras` directly and no e2e looks for the line. |
| L-09 | **Fixed (scope)** | DON!! math built (off by default, e2e green); remaining items have owners M7, M8, M9 in DECISIONS and PLAN. See L-15 for a nit. |
| L-10 | **Mostly fixed** | M2 (gaps claim any-hand): caught. M9 (always-on in a puzzle): caught. M16 (hand count): caught (`hand + 1` fails). New gaps: see L-14. |
| L-11 | **Fixed** | L16 copy ("the one that has to beat the most cards goes last"); `C` key doc aligned with learning-ui §2.1. The E03 "N lines" copy is still unformatted; trivial. |

### L-03 measured

Rookie v Rookie, Rocks and Kaido in all four pairings, 3 seeds, 1,181 Main-phase decisions of either seat, `public` mode at `{ ms: 1500 }`, Node, nothing else running.

| Quantity | Result |
| --- | --- |
| Answered at once by the attackers bound | 748 of 1,181 (63%) |
| Needed a search | 433 |
| Of those: proven / refuted / **unknown** | 26 / 96 / **311 (72%)** |
| Unknown against a Rocks defender | 155 of 204 (76%) |
| Unknown against a Kaido defender | 156 of 229 (68%) |
| Unknown at the first Main decision of a turn | 74 of 82 (90%) |
| Median wall time of a searched position | 1,502 ms (the cap) |
| Hidden-info differential (every third position) | 393 checks, 0 differences |

The builders' figure is 61% overall (33% Rocks, 80% Kaido); mine is worse against Rocks and a little better against Kaido. The seeds differ and the cap is wall time, so the two are not directly comparable, but both are far from the target of about 30%: **not fixed**. The suite's gate (`ai/test/lethal-games.test.ts:141`, at least 50% "decided") counts every position the attackers bound answers as decided, so it passes at any Unknown rate among searched positions; it does not guard L-03.

What the app shows on Unknown: tier 1 "?" and chip "Unknown"; tier 2 "You need N hits. You have M attackers" (useful); tier 3 "checked N lines" (not useful). `defenceBound` is **not** shown on Unknown in the coach (only the battle panel uses it). "Check again" reruns at the same cap and gets the same answer. Grade: D for the milestone's purpose (Unknown for about three positions in four that need a search, nine in ten at the start of a turn).

### New findings

| ID | Sev | Where | Problem and repro | Fix |
| --- | --- | --- | --- | --- |
| L-12 | 3 | `ai/src/search/lethal/lethal.ts:224` `attackersPossible`; `ai/src/search/lethal/search.ts:276` `IDLE_OPS` | **The bound still refutes at certainty `any-hand` a turn that wins, when the Rush Character is drawn.** The builders' sentence "it can only err toward searching" is false: a hand card whose only op is `draw` adds nothing to the reach, and the search never plays such a card (`draw` is idle, A3: "own deck draws blanks"), although in `actual` mode the deck is known. Repro, played through the engine: p1 Kaido Leader (OP17-058), hand Queen EB04-032 and OP17-076 (an Animal Kingdom card to trash), deck top EB04-030 then Zoro, 10 active DON!!; p2 Rocks, 1 Life, no hand, no DON!!. Play Queen (trash OP17-076, draw 2 incl. EB04-030), play EB04-030 (DON!! −2, Rush), attack with it, then the Leader: **p1 wins, "damage at 0 Life"**. `lethal({mode:'actual'})` returns `refuted`, `any-hand`, reason `attackers`; `attackersPossible` is false; `reviewMissedLethal` skips the turn, so the miss is never flagged. In `public` mode the same shortcut says "No lethal: you need 2 hits and have 1 attacker" while the player's own draw could find it (A3 documents blanks; the explanation does not say so). | In `actual` mode (and review) count the real deck: a hand or board card with `draw`, `lookAtTop` or a search `move` turns the bound off (or add the known top cards to the reach); do not treat those ops as idle. In `public` mode do the same, or word the result "no lethal from what you hold" and not `any-hand`. Add this position as a test. |
| L-13 | 3 | `ai/src/search/lethal/explain.ts:54-66`; shown in `app/src/play/coach/Coach.tsx` (`coach-note`) | **The Trigger caveat says "Works against any hand, unless a Life card's Trigger stops it" on a proof whose certainty is `needed-hidden-info`.** `tier1` builds `triggerNote` with those words whatever `r.certainty` is. Repro: p1 Luffy (OP13-001), three Characters, 10 DON!!; p2 Sabo (OP13-004), 1 Life, empty hand. `public` proves with certainty `needed-hidden-info` (4 model gaps), chip "Depends on their hand", and `tier1.sr` = "Lethal: proven. Works against any hand, unless a Life card's Trigger stops it (their usual lists run 5)." Same for OP14-041, OP12-061, OP05-098. Before the fix round the polite line read "Lethal: proven, depends on their hand." for these, so L-04's fix made the screen-reader line state the false thing alone, without the chip. Ten of twelve archetypes have gaps (OP17-079 has a gap and no Trigger note, so it reads correctly). | Build `triggerNote` from the certainty: as now for `any-hand`, otherwise "Depends on their hand, and a Life card's Trigger could stop it". Test both certainties in `tier1` and in the polite line. |
| L-14 | 2 | tests: `ai/test/lethal-games.test.ts:141`; `app/test/fixround.test.ts` | Gaps in the new tests, each shown by a mutation that passes: (a) the polite tier 1 line without the Trigger caveat (`explain.ts:66` reverted) passes the ai, explanations and app suites; (b) `theyCouldHave` forcing `extras` to false passes the app suite; (c) the `focus.ts` rescue reverted passes the e2e; (d) the "decided" gate counts bound answers, so it cannot fail on L-03. | Add the tests named; gate (d) on `(proven + refuted) / searched`. |
| L-15 | 1 | `app/src/play/game/Game.tsx:274` `donMathTag` | "+X to stop" uses the cards' current powers. When the preview says the attack lands but `ap < tp` (a [When Attacking] boost), it prints "+1000 to stop"; it also ignores Blockers and the defender's own on-attack effects, which the battle panel lists. From the code, not reproduced. | Use the preview's powers, or label it "Counters only". |

### Verdict on the fix round

- Fixed: L-02 (slice), L-05, L-06, L-07, L-08 (UI), L-09 (scope), L-11; L-10 mostly.
- Partly: L-01 (L-12), L-04 (L-13).
- Not fixed: L-03.
- Soundness of the slice model is strong: 790 independent replays of any-hand proofs, none broken; no hidden-information leak (240 + 393 differentials, 0 differences).
- PASS requires no open severity 3 or 4. Open: L-03, L-12, L-13 (all severity 3).

L re-review 1: FAIL

## Re-review 2

**Verdict: PASS.** No severity 3 or 4 finding is open. L-03 is not closed in the builders' own terms (35% Unknown among searched positions, target under about 30%), but it no longer blocks the milestone's purpose, so I re-graded it from severity 3 to **2**. L-12 and L-13 are fixed. The new refutation paths held up under everything I threw at them (0 unsound in about 1,000 checks), but the suite that is meant to guard them is weak: 9 of 13 mutations of `bound.ts` pass every test (L-16, severity 2).

**Build reviewed:** `ba74433` on main, in a clean worktree with its own `npm ci`; no production code changed. Probes lived in a gitignored `.cache/rr2/`. Mutations were applied by a script that restores each file; `git status` was clean after every run. E2E ran on `E2E_PORT=4512`.

**What I ran**
- **Soundness of `refutedByBound` and the reduced-defender pass.**
  - I read the `bound.ts` header argument and re-derived it. It holds as written: the online defender stops an attack when it costs at most `t = floor(H/k)` cards, up to `k` stops, and Blockers take the `free` expensive attacks. I checked the case split (`C >= k` gives at most `need-1` landed; `C < k` needs `E >= need+free`), the adaptive attacker, ties, `t = 0`, Double Attack at 1 Life, and `handLoss` taken up front (the most favourable timing for the attacker, so it is safe).
  - I audited all 37 scripts: every `do` op, every `restrict`, every `trashFromHand`, `setActive`, `grant`, `addDon`, `power`. No op the scan classes as neutral can raise power, DON!!, attacks or reduce their hand. The two `restrict` forms in the slice (`cannotAttack`, on the opponent's Characters) are neutral. The DSL has no restriction that bars Counters, so the loose `typeof what === 'string'` check (L-17) cannot be hit today.
  - **My harness (`wide.probe.ts`)**, wider than `lethal-bound.test.ts`:
    - Attacker side: any of the 37 scripted cards in hand, Characters, Stage and trash; rested, summoning-sick and DON!!-carrying Characters; rested DON!!; scripted and vanilla Leaders.
    - Defender side: Rocks, Kaido, Sabo and Luffy, with Blockers (OP17-042, OP17-062) rested or active, 0 to 7 hidden cards, 1 to 2 Life, 0 to 4 DON!!.
    - Checks: wherever a public answer refutes by `bound` or `reduced`, `lethal(public, bound:'off')` at 150,000 nodes must not prove. Wherever it refutes by `attackers` at `any-hand`, `lethal(actual)` at 150,000 nodes must not prove. Every oblivious `any-hand` proof is replayed against every defender answer on its own hand and 2 re-rolled hands. Every second position gets the hidden-information differential (re-rolled hand, Life and decks of both seats).
    - 4 seeds x 120 positions = 436 usable positions: 92 `bound` and 79 `reduced` refutations (171), of which 119 were decided by the off search, **0 proven**, and 52 were off-search Unknown, so unchecked. 17 `attackers` `any-hand` refutations against `actual`: **0 proven**. 22 oblivious `any-hand` proofs, 66 replays: **0 broken**. Differential: **0 differences**.
    - The builders' `BOUND_POSITIONS=300`: 47 bound, 41 reduced, 131 attackers, 88 checked, 0 differences, 16 of 16 tests pass.
  - **Planted counterexamples:** the hand-built families (Torch, Blocker plus a KO card, a rested King adding DON!!, over DON!! 0 to 10 and hand 0 to 3) found no position where the real bound refutes and the off search proves. The same families do show what the suite cannot see (L-16).
- **Engine hash change.** I loaded the old `hash.ts` (from `ba74433~6`) next to the new one. 20,000 random strings, including non-BMP and empty: identical `hashString`. 2,710 states from 8 Rookie games: identical `summaryHash`, and identical `summary` JSON. The new code is the same cyrb53 pair with the same seeds in one pass, and `canon` returns an empty array unchanged, which `JSON.stringify` cannot tell from a copy. It is a correct canonical hash, with the same output. The engine golden and property suites pass in `npm test`.
- **Any-hand replay harness** (`LETHAL_POSITIONS=160 LETHAL_HANDS=4`): 85 proven, 316 replays, **0 broken** (126 decided of 160). Hidden-information differential on real positions, including bound-refuted ones: covered by the 300-position bound property (0 differences) and my 436-position harness (0).
- **Rate** (`npx tsx ai/bench/rate.ts`, `RATE_OUT` set, nothing else running): see "L-03 measured".
- **Suites:** `npm run typecheck` clean; `npm run lint` clean (eslint and prettier); `npm test`: 159 files passed, 1,118 tests passed (2 expected fail, 164 todo); Playwright `learning.spec.ts` and `focus.spec.ts` at 720p and 1080p: 22 of 22 pass.

### Old findings

| ID | Status | Evidence |
| --- | --- | --- |
| L-03 | **Improved, not closed. Re-graded to severity 2** | 35% Unknown of searched positions (was 72%); 20.7% of all Main decisions; Kaido defender 40% (was 68%); E20 proven at 97 ms (was Unknown at 3 s). Detail below. |
| L-12 | **Fixed** | The reviewer's repro, played through the engine: `actual` is now `proven` (255 nodes), not `refuted`; `reviewMissedLethal` flags the turn. `public` says `refuted`, `needed-hidden-info`, reason `attackers`, `drawsIgnored: true`, worded "from what you hold (cards you draw are not counted)". Mutations: `actual` using the no-deck count fails 2 tests; the deck not counted (`deckKnown` off) fails 2. One gap: see L-16. |
| L-13 | **Fixed** | `triggerNote` follows the certainty, and the Sabo case (`needed-hidden-info`) now reads "Depends on their hand, and a Life card's Trigger could stop it". Mutations: certainty ignored fails 3 tests (ai and app); the polite line dropping the caveat fails 3. |
| L-14 | **Fixed (3 of 4 checked)** | (a) the polite-line caveat is caught (above); (b) forcing `theyCouldHave` extras off fails `fixround.test.ts`; (d) the gate is now (proven + refuted) / searched over positions the attackers bound did not answer. (c) the `focus.ts` rescue-only e2e is new and passes at both sizes; I did not run the revert mutation. |
| L-15 | **Carried to M10** | Not touched; still severity 1. |

### L-03 measured

Rookie v Rookie, Rocks and Kaido in all four pairings, 3 seeds, 1,181 Main-phase decisions of either seat, `public` at `{ ms: 1500 }`, Node, nothing else running (stock script, my reading of its row output).

| Quantity | Result |
| --- | --- |
| Answered at once by the attackers bound | 480 of 1,181 (41%; was 748) |
| "Searched" (everything else) | 701 |
| Of those: refuted by `bound` / by the reduced pass / proven / **Unknown** | 33 / 398 / 26 / **244** |
| **Unknown as a share of searched** | **34.8%** (36.5% if the 33 free `bound` answers are left out of the denominator) |
| **Unknown as a share of all Main decisions** | **20.7%** |
| Unknown against Rocks | 88 of 313 searched (28%); 15.8% of 558 decisions |
| Unknown against Kaido | 156 of 388 searched (40%); 25.0% of 623 decisions |
| Unknown at the first Main decision of a turn | 88 of 152 searched (58%): Rocks 35 of 70, Kaido 53 of 82 (was 74 of 82, 90%) |
| Median wall time of a searched position | 246 ms (a real search, excluding `bound`: 294 ms; p90 1,503 ms, the cap) |
| Proven against a Kaido defender | 0 of 388 |
| E01 / E20 | proven `any-hand` in 10 ms / 97 ms (was Unknown at 1.5 s and 3 s) |

The builders' 35% of searched and 20.5% of all decisions reproduce (244 against their 242). **Is "searched" gamed by the denominator?** Not materially. The replay accounting made the attackers bound answer fewer positions (748 to 480), which moves positions into the searched pool, the honest direction. The `bound` refutations take 1 ms and are 33 of 701, so counting them as searched changes the rate by 1.7 points. What the figure does hide is that of the 701 "searched", only 26 are proofs and 398 are refutations by the reduced-defender pass: the detector's strongest output is "they can stop it, depends on their hand", and a proof is rare (none against Kaido). That is a true statement about this play (Rookie rarely has lethal), not a defect.

**Grade for L-03:** on "of searched" it still misses its target (35% against under about 30%, and 58% at a turn's first decision). On "of all decisions" a learner gets an answer 79% of the time, and the flagship examples answer in under 100 ms. The original finding was a coach that "almost never answers" against Kaido (99.5%); that is gone. I keep it open as **severity 2**, not 3: it no longer blocks the purpose of the slice, and what remains is a tuning problem, not a soundness or honesty one. What the app shows on Unknown is now useful: tier 2 ("You need N hits. You have M attackers") plus a new public-bound line ("Their 3 cards in hand could add up to +6000 ... 1 active Blocker stops one attack. Their Counters can also rest one of your Characters."). It does not say what to do, and "Check again" reruns at the same cap and, being deterministic in nodes, mostly the same answer; but the player gets a figure to count with. Fix: close the 58% at the turn's first decision (the Kaido case) or lift the cap for the first press of a turn; gate on `rate.ts` with a fixed node cap in `benchmarks.md`.

### New findings

| ID | Sev | Where | Problem and repro | Fix |
| --- | --- | --- | --- | --- |
| L-16 | 2 | `ai/test/lethal-bound.test.ts` (tests with teeth for the bound) | **Nine of thirteen mutations of the new bound pass `lethal-bound.test.ts` and `lethal.test.ts`, and my 436-position harness did not catch them either.** Caught: `handLoss` dropped (2 tests), replay multiplier dropped (1), the K formula (12), `deckKnown` (2). **Survive:** `blockerLoss` ignored (`free = blockers`), `i < need + free` reduced to `need`, `gainTotal` not subtracted, permanent `gain` not subtracted, `unblockable` ignored, Double Attack ignored (`h = 1`), `addDon` dropped, `bounces > 4` guard removed, `rushy` replay attacks dropped. Of these, all but `need + free` and the bounce guard move the bound toward refuting (unsound if they are wrong). **One is shown real:** Kaido Leader, a rested King EB04-031 (adds 1 DON!!), Zoro, 1 active DON!!, against Rocks at 1 Life with 1 hidden card: the off search **proves** lethal and the real bound does not refute; with `addDon` dropped the bound **refutes** it (`planted.probe.ts`, row "king don 1 hand 1"). The planted tests in the suite for `blockerLoss` and `gainTotal` assert only the potential (`blockerLoss > 0`, `gainTotal` equals 2x), not a refutation. Also not caught: removing the reduced-defender pass (`reduced-pass-off`) fails nothing, and the search playing a `draw` when the deck is known (`DECK_OPS`) fails nothing, because the L-12 test asserts only `not refuted` (the `actual` result is `proven`, 255 nodes, so it could assert that). | One planted test per mutation, each a position where the off search proves and the mutated bound would refute (the King case above is one); assert `proven` in the L-12 test; a test that E01 or E20 is decided in under N nodes with the reduced pass on and not without it. |
| L-17 | 1 | `bound.ts` `scanAbility` `restrict` branch; `explain.ts` copy | (a) The code and DECISIONS say a `restrict` is neutral "only for the attack-side kinds (a barred Counter or Event play is not)", but the code only rejects a non-string `what`; a string kind that bars Counters would pass as neutral. The DSL has no such kind today (`Restriction` is `cannotAttack`, `cannotActivateBlockerAgainstIt`, `cannotDrawByOwnEffects`, `cannotBeRemovedByOpponentEffects`, `cannotBeKOd`, `{cannotPlay}`), so it is latent. (b) The headline of a bound refutation is "No lethal: their N cards can stop enough of the M hits you need", at chip "Depends on their hand"; "No lethal" is stronger than "could be stopped if each card is a Counter". Same family as the search refutations, so not new. (c) The `don` budget ignores the untap in OP17-062's `setActive` of a rested DON!!; I could not make it exceed the bound (the DON!! it adds is paid for by the return that triggers it), not reproduced. | (a) Whitelist the two attack-side kinds by name. (b) Lead with "They could stop this" when `reason` is `bound` or `reduced`. (c) Note the argument in `bound.ts`. |

### What I did not verify

- The 52 bound or reduced refutations whose off search was itself Unknown at 150,000 nodes: unchecked, not shown sound. Nor positions the random families do not reach (a Stage plus a rested bounce card, Life-to-hand scripts; none exist in the 37 scripts).
- The full real-game hidden-information differential on the `lethal-games` run beyond what `npm test` covers at its default 6 games; I did not run `npm run test:lethal` (24 games at 60,000 nodes).
- A replay of `reduced` or `bound` refutations against real hands: a refutation is a statement about the worst-case model, so a real hand can lack the Counters; there is nothing to replay it against, and its certainty is `needed-hidden-info`, which says so.
- The `focus.ts` rescue-only revert mutation, and the app's behaviour at a real worker slowdown (the 1.5 s cap is wall-clock; a browser worker at half the speed would see more Unknown than my Node figure).
- The Kaido `OP17-062` untap argument (L-17 c) beyond the cases I worked by hand.

### Verdict on the fix round

- Fixed: L-12, L-13, L-14; L-03 is down from severity 3 to 2 (35% of searched, 20.7% of all decisions, flagship in under 100 ms).
- The new refutation paths are sound on everything I tried: 171 refutations checked against the off search (0 proven), 17 `attackers` refutations against `actual` (0 proven), 316 + 66 proof replays (0 broken), 0 hidden-information differences in about 900 comparisons, hash output identical.
- Open: L-03 (2), L-16 (2), L-17 (1), L-15 (1). None at severity 3 or 4.

L re-review 2: PASS
