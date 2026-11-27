# M9 review: meta explorer, drills, rules reference, progress

**Date:** 2026-11-26
**Reviewer:** an independent review by a subagent with no stake in the work. The brief was to find what is wrong.

**Build reviewed:** local `main` at `a40527ba` (all of M9, WP0 to WP7), merged into a clean worktree with its own `npm ci`. E2E ran on port 5249 against the production build. WP8 (e2e and a11y) was written in parallel and is not part of this build.

**Rule:** any severity 3 or 4 finding fails the milestone. 4 = hidden-information leak or a wrong verdict shown as certain; 3 = done criterion not met, rules error, data loss or blocking defect (including an axe-level failure); 2 = notable defect; 1 = nit.

**M9 review: FAIL.** Three severity 3 findings (M9-R1 to M9-R3), no severity 4. I found no hidden-information leak: the lethal, counter and flag-derived items give the same item, header and answer text for every opponent hand, deck and face-down Life I could construct (see "Hidden information"), and every "provably none" lethal item is correct. The failures are a rules error in a "Show me" demo, an axe failure on 7 of the 12 guide pages, and a counter verdict that contradicts its own answer text.

## What ran

| Check | Result |
| --- | --- |
| `npx vitest run app ai/test/drills-*.test.ts ai/test/review engine/test/records/scenario-of.test.ts` | 87 files passed, 1 skipped; 1,032 tests passed, 3 skipped; 0 failed (204 s). No file timed out. |
| `npm run build` (typecheck, contrast, build, bundle) | passes. Initial JS 83.4 KB gzipped, budget 300. |
| `E2E_PORT=5249 npx playwright test app/e2e/m9-*` | 28 passed (both projects) |
| My own axe sweep (WCAG 2.0 to 2.2 AA and best-practice) over all 12 guides and 7 other M9 routes at 720p | 12 of 19 passed; **7 guide pages fail** (M9-R2). `/rules`, `/rules/RL-26`, `/rules/deck-out/show`, `/progress`, `/learn`, `/drills`, `/meta/matchups` pass. |
| Independent search of every "provably none" lethal item (14), the opponent never blocks, counters or uses a Trigger, my own depth-first search over `legalActions` | 14 of 14 have no winning line (the searches are complete: 8 to 960 nodes, none capped) |
| Real played games through the real review and the worker's `puzzleResponse` | 15 seeded Rookie games, 66 flags: see M9-R10 |
| Mutation sample | 20 mutants run, 17 killed, 3 survived (M9-R9) |

Not run: NVDA and VoiceOver (owner's).

## Done criteria

| Criterion | Verdict |
| --- | --- |
| Guides render with as-of dates and sources, all 12 | Met for content: each of the 12 shows "as of 2026-10-28 · confidence: ..." and 59 to 84 source links. **Not met for a11y**: 7 of the 12 fail axe `target-size` (M9-R2). |
| Each drill at least 20 items, re-verified in CI | Met: lethal 28, counter 24, DON!! 22, mulligan 34 (built at call time, M9-R11). Mutation check: flipping a counter item's `expect`, pointing a DON!! item's `best` at a worse line, deleting a lethal item's Character, and giving a "none" item three more Characters each fail the bank tests. An engine mutant (`attackerWon = ap > tp`, ties lost by the attacker) fails the counter, lethal, DON!! and rules-demo tests. |
| Puzzles include items generated from review flags | Met in code and tests. Driven from real reviewed games it yields few items (M9-R10). |
| Progress persists, exports and imports, recommends a next lesson | Met. The sanitizer (`sanitizeProgress`, `sanitizeSession`) rejects bad ids, dates, counts, timer factors and prototype keys, drops unknown fields, caps sessions; `mergeProgress` is commutative and idempotent and the earliest-date mutant is killed. |

## Findings

### M9-R1 (severity 3): the "An empty deck loses the game" demo teaches the wrong deck-out timing

`app/src/rules/demos/turns.ts:309` (demo `deck-out`, cites RL-26 and CR 1-2-2-2) says: "Nothing happens while it is empty, but at the start of your next turn the Draw Phase asks you to draw, and a player with 0 cards in their deck loses." The goal line says "see what your next Draw Phase does". `docs/research/rulings.md` RL-26 says the opposite: "A player loses as soon as their deck has 0 cards ... checked by rule processing the moment it happens ... Failing to draw is not what triggers it", and `rules-digest.md:274` has a whole entry named "Deck-out is not 'failing to draw'". The demo's own cited ruling contradicts its sentence. A player who learns this believes they can run to 0 and live until the next draw; the real rule loses the game the moment the last card leaves the deck (including a "draw 2" with 1 card left). The scenario (a deck of `[]` mid-game) is also a position that cannot occur, which is why the engine only produces the loss at the next check and the demo "passes".
**Fix:** rewrite the sentence to RL-26 ("you lose the moment your deck reaches 0, even in the middle of an effect; you do not wait for a draw"); start the demo with 1 card in the deck and draw it (a Draw Phase or a "draw 2"), so the loss on screen is the one the rule describes; keep the existing `expect`. Add the RL-26 "draw 2 with 1 card" case as an `expect: legal`-style check. The owner's "read the 24 sentences" step would have caught this.

### M9-R2 (severity 3): 7 of the 12 guide pages fail axe `target-size` (WCAG 2.2 AA, 2.5.8)

Probe: a Playwright spec that opens `/meta/<leaderId>` for all 12 guides and runs axe with `wcag2a, wcag2aa, wcag21aa, wcag22aa, best-practice` (the same tags `m9-meta.spec.ts` uses). Failing: OP09-062, OP13-004, OP14-041, OP15-058, OP17-058, OP17-079, ST30-001. Passing: the other five, among them OP17-039, the only guide `m9-meta.spec.ts` visits. Each failure is `target-size`: the Sources links (`.meta-foot > ul > li > a[target=_blank]`) are 16 px tall ("Target has insufficient size (378.6px by 16px, should be at least 24px by 24px)" and insufficient space to their neighbours). Which guides fail depends on how the source lines wrap, so the one tested page hides it. This is an axe-level failure on a new screen, the done criterion "axe on every new screen".
**Fix:** give `.meta-foot a` (and any list of external links in `meta.css`) `display:inline-block; min-height:24px; padding-block:4px`. Make `m9-meta.spec.ts` loop all 12 guides through axe (the loop is 12 page loads, 2 s).

### M9-R3 (severity 3): two "take it" counter items mark a counter the answer text calls acceptable as wrong

`no-counter-on-attack` (`controller.ts:648`) fails the item on any `counter` action. For `counter-1` and `counter-14` (counter-wasted case a) the answer text, built by `explainCounter`, says: "Best: take the hit and keep ... Also fine: add You're the One Who Should Disappear. (10000 vs 8000), spending 2 cards to save 1 Life." and for `counter-14`, "Also fine: add Bad Manners Kick Course (11000 vs 8000), spending 3 cards to save 1 Life." A player who plays exactly that counter is shown "Not this time" and "This one was better taken, with your cards kept", directly above a line that says their play is fine, with the chip "Works against any hand". The summary counts it as a miss and L10's exit (8 of 10) moves with it. This is the pattern in the severity table (a verdict that disagrees with what the item itself teaches). I rate it 3 rather than 4 because the item names the take as the best play and the lesson (cards are a resource) is defensible; but the verdict wording ("wrong") is not.
**Fix:** either judge these two items `survive-turn` plus "kept at least N cards" (counter allowed, scored on cards kept), or drop the "Also fine" sentence from take items and keep only items where no counter that stops the attack exists, or word the verdict "Not the best play" for them. Add a test: every `take` item's answer text contains no "Also fine" unless its judge accepts a counter.

### M9-R4 (severity 2): the "passed (timed)" badge on Progress disagrees with the summary, and the factor the badge uses can be changed after the answers

WP7 reported the first half. Decision: **severity 2**. It is a badge, not a verdict or a lesson, and no data is lost; but it is a credit the player is told on one screen they did not earn and shown on the next. `summarise` (`drills/session.ts:181`) needs each correct answer within the limit; `drillPassedAt(..., timedOnly)` (`progress/exit.ts`) credits `passedTimedAt` to any session that passes untimed with `factor <= 1`. Reproduce: run a 10-item set at 100%, answer 8 slowly (the timer shows "Over time" and does not stop you), see "The timed badge needs 7", then open Progress and see "passed (timed)". Two more holes make the badge cheap. `DrillRun` passes the current `factor` to `summarise` and `toDrillSession`, so switching the "Time allowed" select to 100% before the last item (or at the summary) scores the whole set at 100%, and each answer's `ms` is measured against the final limit, not the one it ran under. The Pause button excludes paused time with no cap.
**Fix:** record `within` (answers inside the limit that applied to them) in `DrillSession`; credit `passedTimedAt` from it; freeze the factor at the first answer of a set.

### M9-R5 (severity 2): the mulligan label says "(sourced)" for rules the guides themselves mark as inference

Every mulligan answer carries "From the Rocks guide (sourced)". `isSourced` (`search/review/mulligan.ts:20`) is true when the playbook's `source` string contains an `SH-` handbook id. For 7 of the 9 guides that string says "keepable hand, inference" (printed in the probe: Rocks "SH-XEB; OP17-039 guide (keepable hand, inference)", Nico Robin, Luffy-Ace "inference built on SH-LA", Kaido, Luffy RG, Luffy Black, Boa Hancock). The Rocks guide's *sourced* statement is only "Shonen TCG's simulation mulliganed any hand without a 1- to 3-cost Character [SH-XEB]"; the "Keepable hand" and "Mulligan" lines are both `(inference)`. They also disagree: the Mulligan line redraws only "hands of only 6+ cost cards, or no 1-3 cost Character going first", while the drill's rule also requires the "backup" piece going first. A Rocks hand going first with Streusen and nothing else useful is a Redraw in the drill (the pieces `early` and `backup` must both be met going first) and a keep by the guide's Mulligan line; the answer is shown as certain and "sourced".
**Fix:** label by what the guide says: "From the Rocks guide (sourced baseline, inference)" when the rule is tagged inference; reconcile the two guide lines or say which the drill uses; the explanations.md certainty table needs a row for it.

### M9-R6 (severity 2): counter and DON!! items are "Works against any hand" because the opponent's hand is empty, and the answer does not always say so

WP3's positions give the attacker no hand and inert Life, so `any-hand` is true vacuously. That is honest where the text says so ("They had no cards in hand and no active DON!!, so their hand adds nothing", should-counter items) and not where it does not: `counter-20` (counter-wasted b, "Take the hit", "At high Life, let a lone hit through") says only "Their board could attack your Leader once this turn: at most 1 more Life" and teaches a rule whose truth in play depends on the opponent's hand (a Rush Character, an Event). M8-R6 flagged the same bound. The player does see an empty hand on the board, so this is a labelling and scoping problem, not a leak.
**Fix:** put the empty-hand fact in every counter and DON!! answer, and word `nextTime` as conditional ("with nothing in their hand").

### M9-R7 (severity 2): DON!! "best" is the best of a menu of 3 to 4 lines that leaves out the dominating one

`candidateLines` offers spend, two cheaper plays, give-all-and-attack, play one and give 1, and hold. In `don-10` the best is "Give 8 DON!! to your Leader, attack" (0 unused) against "Play Sweet 3 Generals (6), give 1 DON!! to your Leader, attack" (1 unused); the mixed line "play the 6-cost, give the other 2" is not offered. "Choose a line" marks a development line wrong against a dump of every DON!! onto the Leader, and the text says "Every DON!! did something this turn", which teaches that dumping beats developing. Board mode accepts any play with `unused <= unusedMin`, so the two modes disagree about the same position. 8 of the 22 items have "give everything to the Leader or a Character" as best (WP3 says at most half). I did not run the mixed line on the engine; it follows from the line list in the bank.
**Fix:** add the mixed line (spend what can be played, then give the rest) to the menu, or say in the answer that the best is among the lines shown.

### M9-R8 (severity 2): a one-answer drill session outranks any plausible flag evidence in "what to work on next"

`recommend.ts` adds `DRILL_EVIDENCE = 2` when the last session's score ratio is below the exit, whatever its size. The strongest evidence a concept can have is severe flags in every one of 10 games: 3 × (1 − 0.85^10)/0.15 / 10 = 1.61 (more only with several flags in one game). So a session of one item, answered wrong (or "Show answer"), makes that drill's lesson the top suggestion over a concept flagged severe in all 10 games. The spec says "the last drill session below the exit" and WP6 followed it exactly; the spec's intent (a failing drill) is not a 1-item session. By calculation, not run.
**Fix:** count drill evidence only for a session with at least `of` items (the same rule `sessionPasses` uses), or scale it by `min(1, n/of)`.

### M9-R9 (severity 2): three mutants survive the suites

- `endLedger <= unusedMin + 1` in `puzzleState` (`controller.ts:635`): the DON!! judge may accept one unused DON!! too many; survived all of `app/test` (the `m9-drills` e2e "Submit turn is judged by the ledger" is the only cover and it is not part of `vitest`).
- `DRILL_EVIDENCE = 2` to `0.5`: survived `progress-recommend.test.ts`; the weight 2 is a spec number and is not pinned.
- `ms / 1000 <= limit` to `<` in `summarise`: the timed-badge boundary is not pinned.
Killed: the counter judge, the target judge, `sessionPasses`, the L10 threshold, `DECAY`, `MIN_REVIEWED`, `PASS_WINDOW`, the Hindsight weight, `STALE_AFTER_DAYS`, `mergeProgress` earliest date, `judgeMulligan`, `allowFor`, a flipped counter `expect`, a worse DON!! `best`, a lethal item minus a Character, a "none" item plus attackers, and the engine tie rule.
**Fix:** a vitest that plays a bank DON!! item with one DON!! left unused and asserts `failed`; pin the two constants.

### M9-R10 (severity 2): few real flags become drill items, and none exercised the any-hand harder-hand path

15 seeded Rookie games, 66 flags, each through `puzzleResponse` (the worker's path): 9 mulligan flags go to the trainer by design; 12 DON!! flags (and 1 counter, 1 lethal, both Hindsight) became items; 34 + 6 DON!! flags, 6 counter flags and 3 of 4 missed-lethal flags answered "This moment cannot be rebuilt as a puzzle" (DON!! and target are practised in place, the rest falls back to the record restored as before). No `any-hand` missed-lethal or counter flag came out of a real game, so the harder-hand path was exercised only on the bank's synthetic records (`drills-lethal.test.ts` (d)); every item that was built replayed with `checkInvariants` clean. The "flag-derived items" criterion holds, but a real player's counter and lethal flags mostly cannot be rebuilt.
**Fix:** say in the flag list when a flag cannot become a drill item and why; widen `lookBack` or accept a modifier-free cut at the Main before; add a planted E01 game test through `puzzleResponse` and `materialise` to pin the any-hand path end to end.

### M9-R11 (severity 2): the mulligan bank is built at run time from the live meta file, and CI checks the pinned copy

`mulliganBank(metaListSets(), cards)` reads `docs/research/meta-lists.json` in the app and `ai/test/fixtures/meta-lists.pinned.json` under vitest. Today they are the same content (I diffed them with keys sorted: no difference; the files differ only in formatting), and the 34 items are identical. After the weekly meta PR changes a list, the shipped hands change (the ids `mulligan-<archetype>-1st-keep` stay) while CI re-verifies the old ones, and saved sessions' `itemIds` point at different hands. The plan said banks are committed and re-verified.
**Fix:** commit the mulligan bank like the others, or add a CI test that runs `mulliganBank` on the live file and checks the counts (at least 20, both classes).

### M9-R12 (severity 1): scratch notes

- The lethal, counter and DON!! banks are generated and checked on the pinned lists, but the app re-solves a lethal item for its answer text (`judgeLethal` calls `classify`) with the live lists; if the live prior ever drifts from the pinned one the header or bound could differ from the committed item. Today the files agree (not tested with a drifted file).
- `progress.v1` import accepts a session whose `lesson` code does not match its `drill` (a forged `lethal` session under `L12-...`); only `drill` is read, so no effect.

## Verdict checks, by drill

**Lethal.** 14 of 14 "none" items re-searched with a passive opponent have no win (complete searches). All are reason `attackers`. The 14 "lethal exists" items are covered by the solver re-check in CI and their mutation. The header ("N Life cards to take, so N hits to win · N cards in their hand, up to +2000 each") contains only counts and the prior's per-card bound.
**Counter or take.** 12 should-counter and 12 take items; the classes come from the M8 detectors, re-run in CI. One verdict issue (M9-R3), one labelling issue (M9-R6).
**DON!!.** The ledger and `best` are re-scored in CI; the hold items teach E07 correctly. M9-R7 is the menu problem.
**Mulligan.** The verdict is the guide's rule, as the AI uses it; M9-R5 is about what the label claims.

## Hidden information

- The WP2 differential (permute the opponent's hand, deck and face-down Life across a record) gives byte-identical `puzzleFromFlag` items on the any-hand path; the Hindsight path differs by design and carries the "Their real hand: one way to see it" label, also on the answer screen.
- The item header and answer text read `lethal` in `public` mode from the item's seat's own view, so only counts and the per-card bound show.
- `scenarioOf` refuses a counter step, a battle, a pending or delayed effect, any modifier, an Once-Per-Turn mark and any known hidden card with a closed reason; in the real games above that means the counter flags fall back to the record prefix with the real hand.
- A hindsight item's cached scenario holds the opponent's real hand card ids (`drills.flagItems` in the progress store, and so in a progress export). The same ids are in the saved game's record, so nothing new is exposed, but a progress export file contains them.
- No app code under `drills/`, `rules/`, `progress/`, `meta/` or `learn/` imports a full-state engine function; the rules sit in `ai/` and `engine/`.

## What is good

- The mutation coverage of the banks is real: three kinds of bank edit and an engine tie change all fail CI.
- The "Show me" filter is a narrowing only (`allowFor` mutated to allow everything fails the demo tests); the sentences I read against the digest and rulings (all but the deck-out one) agree with the digest and RL-04, RL-07, RL-13, RL-18, RL-20, RL-21 and RL-28 (I read them, I did not replay each against a second source).
- Startup and Game chunks are clean: drills, rules and guide strings are in no chunk the Game route loads; `data-*.js` (the rules text) is imported only by the rules chunk.
- The timer never gates (by reading `Timer.tsx` and `timer.ts`: "Over time" is a label and the answer is still taken).
- Progress is derived (win rates, flags) rather than copied, and the sanitizer's rejections are specific.


## Fix round

**Date:** 2026-11-26. Every finding except M9-R2 (guide target size, WP8's, with `app/e2e/**`, `app/a11y/**`, `app/src/meta/meta.css` and the tutorial-keyboard flake) is fixed or recorded below. Decisions are in DECISIONS ("M9 fix round"). "Revert" means the stated change was undone and the named test run; every one failed as shown.

| Finding | Outcome | What changed | The test | Fails on revert |
| --- | --- | --- | --- | --- |
| M9-R1 (3) | Fixed | The deck-out demo starts with 1 card in the deck: ending the turn, the Draw Phase draws it and the game is lost the moment the deck reaches 0, with 5 Life in play. The text says RL-26 ("you lose the moment your deck reaches 0 ... a rule process"; "an effect that draws your last card loses the same way"). | `app/test/rules-demos.test.ts` "deck-out says what RL-26 says": the text, and on the engine deck 0, hand 1, Life 5, result `p2`; a deck of 2 survives the same line. | Old empty-deck scenario: `deck-out` replay, its mutation test and the engine test fail (3). Old sentence: the text test fails. |
| M9-R3 (3) | Fixed | A take item's counter alternative reads "Weaker: add X (10000 vs 8000), which stops it but spends 2 cards to save 1 Life." (was "Also fine"); `counter-1` and `counter-14` now agree with the judge. E19's example text (`explanations.md`, `examples.json`) changes with it. | `ai/test/drills-fix-round.test.ts` R3: over all 24 items, for each choice, "the text accepts it" equals `judgeCounter`; no take item says "Also fine"; a teeth test shows a text of "Also fine" would disagree. | "Weaker" back to "Also fine": the agreement test, the no-"Also fine" test and the counter-1/14 test fail (3). |
| M9-R4 (2) | Fixed | `DrillSession.timedOk` (additive; sanitised: 0 to `correct`, never on an untimed session); `timedPasses` is the one rule for the summary and for Progress; each answer records the limit it ran under (`AnswerResult.limit`); the factor is fixed from the first answer (the select is disabled, with a spoken reason); Pause stays but an item with a pause has no limit and does not count, and the timer says so. Old sessions stay valid and earn no timed badge. | `drills-session` (per-answer limit, pause, boundary, summary and stored session agree), `progress-exit` (`timedPasses`, old and untimed sessions), `progress-store` (`timedOk` sanitising). | `timedPasses` back to the old share-correct test: 4 fail (per-answer limit, summary vs stored session, slow answers, old/untimed sessions). |
| M9-R5 (2) | Fixed | The label says "(sourced baseline, inference)" for a guide whose rule is tagged inference (7 of 9) and "(sourced)" only otherwise; the chip on the answer screen follows. The Rocks rule is the guide's own Mulligan line (`redrawIfAllCostAtLeast: 6`): going first, an early play without the backup piece is a keep. | `drills-mulligan` label test over the whole bank, and the Rocks rule cases (keep, redraw, going second). | Playbook without `redrawIfAllCostAtLeast`: 4 fail (keep going first without the backup piece, a 4-5 cost card going second, the redraw text, the committed bank). Label forced to "(sourced)": the label test fails. |
| M9-R6 (2) | Fixed | Every counter and DON!! answer says "They had no cards in hand, so nothing hidden adds to this. With cards in their hand, count what a Rush Character or an Event could add first." unless it already does; the take-at-high-Life rule (`counter-20` and 5 like it) starts "With nothing in their hand, ...". `counter-20` kept. | `drills-fix-round` R6: all 46 bank positions have no hand; every answer says it; the `b` rule is conditional; an item with cards in the opponent's hand gets no premise. | `explainCounter` without `withHandPremise`: "every counter answer says so" fails. |
| M9-R7 (2) | Fixed | `spend-give` ("play what can be played, then give the rest") joins the menu (up to 5 lines); lines tied for the least unused DON!! are all best, so Choose-a-line and board mode read one set; an item needs a non-"hold" line worse than the best. Bank regenerated: 22 items, 6 hold. | `drills-fix-round` R7: the mixed line is best where offered; wherever it is distinct the menu has it; line judge and board judge agree for every listed line; a menu whose only wrong line is "hold" is not an item; the committed file is the generator's. | `spend-give` out of `KINDS`: "is what the generator writes" fails (the committed bank has mixed lines the generator no longer offers). "Hold is the only wrong line" admitted again: that test and the generator test fail. |
| M9-R8 (2) | Fixed | `drillEvidence = 2 * min(1, n / of)`: a one-answer session adds 0.2, and "under the 8 of 10" is said only for a ten-item session. Reading of learning-ui §6.1 recorded in DECISIONS. | `progress-recommend` "the drill evidence weight": a 10- or 20-item failing session beats severe flags in all ten games (1.61); a 1- or 5-item one does not; the scaling values. | A flat 2: "a session of one item ... does not outrank" and the scaling test fail. |
| M9-R9 (2) | Fixed | Three mutants now die (below). | `app/test/drills-judges.test.ts` "don-ledger judge: no slack"; `progress-recommend` (pinned 2 and the full-session case); `drills-session` boundary at exactly the limit. | See the mutant table. |
| M9-R10 (2) | Recorded | No code change. Which flags cannot become items, and why, is in DECISIONS and BACKLOG §13 with the three wanted changes (modifier-free cut before a counter; a planted E01 game through `puzzleResponse` and `materialise`; the flag list saying why). No cheap fixture exists: a real seeded game that reaches a lethal-or-counter any-hand flag needs the 15-game corpus run, which is not a unit test. | n/a | n/a |
| M9-R11 (2) | Fixed | The mulligan bank is committed (`app/src/drills/banks/mulligan.json`), generated on the pinned lists by `npm run drills:bank -- mulligan` (and `--check`); each item carries its 50-card list, so hands and odds do not move with the live file. | `drills-mulligan` "is the committed file"; `ai/test/drills-live-lists.test.ts` loads the drills again on the live `meta-lists.json` and requires a bank of at least 20 hands in both classes. | Ignoring `item.deck` (text back on the live list): the committed-file test fails. The bank file itself is checked by `npm run drills:bank -- mulligan --check`. |
| M9-R12 (1) | Fixed | The lethal answer re-solve is checked against the live prior (same test file): headline, header and explanation equal the pinned run's for all 28 items and both submissions. `sanitizeSession` rejects a session whose lesson is not its drill's. | `drills-live-lists`; `progress-store` "a session whose lesson is not its drill's". | Lesson check removed: the forged-session test fails. |

### Surviving mutants, now killed

| Mutant | Test | Result with the mutant |
| --- | --- | --- |
| `endLedger <= unusedMin + 1` (`app/src/play/game/controller.ts`) | `app/test/drills-judges.test.ts` "a line that leaves one DON!! more unused than the best fails" | fails (1) |
| `DRILL_EVIDENCE = 2` to `0.5` (`app/src/progress/recommend.ts`) | `app/test/progress-recommend.test.ts` "the drill evidence weight" | fails (2: the pin and the scaling values) |
| `ms / 1000 <= limit` to `<` (`withinLimit`, `app/src/drills/timer.ts`) | `app/test/drills-session.test.ts` "the boundary counts" | fails (1) |

### Notes for the lead

- `app/e2e/m9-progress.spec.ts` ("progress with drill sessions ...") seeds a `factor: 1` session with no `timedOk` and expects "passed (timed)". Under the one timed rule that session no longer earns the badge; the seed needs `timedOk: 9` (WP8's file, not edited here).
- The review's mulligan flag still says "From the <Leader> guide (sourced)" (`app/e2e/review-m8-fix.spec.ts` asserts it); the drill label changed. BACKLOG §13.
