# M7 review: tutorial and the rest of the coach

**Date:** 2026-11-25
**Reviewer:** an independent review by a subagent, with no stake in the work. The brief was to find what is wrong, not to confirm the builder's report.

**Build reviewed:** local `main` with WP0 to WP7 (head `2aa05cc`), merged into a clean worktree with its own `npm ci` (no symlinked `node_modules`). E2E ran on its own port (4818, and 4819 for the mutation build). No product code was changed: every temporary edit was reverted and every probe file (`m7rev-*`) deleted before the commit; the only file added is this review.

**Rule (as in M4a and M5a):** any severity 3 or 4 finding fails the milestone.
- 4 = a hidden-information leak or a wrong game result;
- 3 = blocks a done criterion, breaks a principle, a WCAG AA failure, or a rules error;
- 2 = notable defect;
- 1 = nit.

**M7 review: FAIL** (open: M7-R1 at severity 3). Everything else I tried to break held: no hidden-information leak was found in any coach path or in the tutorial, the interruption contract holds for focus, expansion and assertive speech, the tutorial teaches the rules correctly and can be finished by pointer and by keyboard, and every automated check is green. The failure is that the **hint states a false DON!! count** and the same defect sits in the position the S2 kit chose to avoid it. Five severity 2 findings follow.

## What ran

| Check | Result |
| --- | --- |
| `npx vitest run engine ai app cards/test` | 2,998 files passed, 33 skipped; 31,709 tests passed, 26 expected fail, 10 skipped, 164 todo; 0 failed (473 s on a loaded machine) |
| `ENGINE_GAMES=3000 npx vitest run engine/test/property engine/test/golden` | 10 files, 32 tests passed (leaks, skeleton-diff, projection, link tracker, goldens); the 2,000-game run is a subset |
| `E2E_PORT=4818 npx playwright test` | 299 passed, 41 skipped (the nightly ones), 0 failed, both projects (1280×720, 1920×1080) |
| `npm run typecheck`, `npx eslint .`, `npx prettier --check .`, `npm run check:contrast` | clean; clean; clean; 72 pairs, 0 failing |

## Method

1. Read CLAUDE.md, PROMPT.md, `docs/design/m7-plan.md`, the eight M7 DECISIONS entries, `learning-ui.md` §2, `docs/content/tutorial.md`, `rules-digest.md` for the rules the copy states, and the code of the coach (`ai/src/coach`, `ai/src/search/{hint-line,score,lethal/threat}.ts`, `app/src/play/coach/*`), the tutorial (`app/src/tutorial/*`) and the engine change (`determinize.ts`, `engine/test/support/foreign-decision.ts`).
2. Ran every check above, then three mutation tests to see whether the guards have teeth (below).
3. Replayed the E15 Luffy position and the S2 `ub-hint-1` position through the engine myself (probe tests), and compared the hint's numbers with the engine's.
4. Played the tutorial through Playwright by pointer (all eight steps, then off-script: wrong cards, End turn, DON!! on t4, Take the hit on t5, End turn on t8, Back), read the copy as a first-time player, and read screenshots of every step at 1280×720 and 1920×1080. The keyboard-only run is the authors' `tutorial-keyboard.spec.ts` (green, 10 s of machine time at both sizes; its inputs are exactly the keys the step text names). I did not time a human: the 20-minute criterion is the owner's session 2.
5. Opened the coach with `H`, then each tab by keyboard, during a Main and during a defence; recorded `focusin` events; ran axe (WCAG 2.2 AA plus best-practice) on the open hint, on a defence with the coach strip, on Settings and on the tutorial.

### Mutation tests (do the guards have teeth)

| Mutation | Result |
| --- | --- |
| Engine: copy a foreign Main decision verbatim into the skeleton (`decision = foreign && !foreignMain ? ... : s.decision`) | Fails 6 tests (`skeleton-diff` all and life mode, both deck sets; the `leaks` permutation property, both deck sets) at `ENGINE_GAMES=120`. The guard works. |
| App: the coach sends the other seat's `searchView` for hint and threat | Fails 5 tests in `coach-panel.test.ts` (the hint and threat requests, the two hidden-information differentials, Do step 1). Works. |
| App: the coach panel speaks an unprompted polite line (see M7-R3) | **All four `coach-contract` e2e tests pass.** A hole in the test. |

## Hidden information

I found no leak.

- **Worker input.** The coach's hint, score and threat requests carry `session.searchView(me)` only (`coach.ts` 500, 670; `blunder.ts` 137), and the coach worker's `init` carries the player's own list and both Leaders (`ensurePort`); the AI seat's worker never gets it (`controller.ts` 295, 765; tested). The tutorial's `inertCoachPort` never starts a worker. Scenario lists given to the coach are decklists, not deck order.
- **Differentials.** `hint.test.ts` (two worlds differing only in their hand, deck and Life give an identical request and an identical hint, and the test has teeth), `blunder-differential.test.ts` (table, kinds and warnings), `threat.test.ts` (identical results; an `actual`-mode check tells the worlds apart), `coach-panel.test.ts` (request and answer for any hidden cards of theirs). Their copy names only the board or the player's own cards (`explain-hint.ts` resolves names through view handles).
- **Threat.** Blanks their hand, deck and Life, says "This does not count the cards in their hand", and states a [Trigger] chance only from the player's own list when it matches what the view shows. `proven` is checked against the exact solver (`threat.test.ts`, "sound against actual mode with their hand empty").
- **Engine change (WP3).** `skeletonOf` keeps a foreign Main searchable only when the stack is exactly the turn frame in its `main` step, in the view's own public shape. The property tests at 3,000 games hold, with floors on how many foreign Mains they reach, and fail when the decision is copied verbatim (above).
- **Tutorial.** The scripted opponent chooses only from `view.actions` of its own seat. The copy states only public numbers (Life, power, counts); t8's "no cards in hand" is their public hand count. The tutorial's fixed Life cards are not named to the player.

## The done criteria

- **Interruption contract.** The unit test (`coach-contract.test.ts`) and the e2e (`coach-contract.spec.ts`) pass at defaults, with tier 1 on and with the blunder warning on. I tried to break it a different way than the authors (who made the coach steal focus and expand): speech through the UI layer. It passes undetected (M7-R3). The product itself is compliant: I found no unprompted focus move, expansion, sound or request. `H` moved focus exactly once (one `focusin`, on the hint result) at both sizes. The first-game preset's tier 1 detector is specified (flows F2) and named on the Setup screen.
- **Hint returns a line.** Yes: the 50-position test passes, and my replays give non-empty lines whose first step is legal. The numbers in the lines are not all right (M7-R1).
- **Tutorial.** Finishes by pointer and by keyboard (both e2e runs, both sizes), no network beyond the app and art origins, JSON and CSV export work. Under 20 minutes is the owner's session 2; nothing here suggests it cannot be met (eight short steps, 10 s of machine time end to end).

## Findings

### M7-R1 (severity 3): the hint's "end with N DON!! active" is wrong, in the E15 position and in the S2 kit's own position

**Evidence.** I ran the hint on the E15 Luffy position (turn 6, 6 DON!! active) with the pinned Luffy list, at 3,000 iterations and at 2.5 s. Both give "Attack their Leader and end with 8 DON!! active. ... keeps 8 DON!! active for their turn. ... You end your turn with 8 DON!! active, after giving 5.", chip "Works against any hand". I then replayed give 5, then `endTurn` through the engine: right after `endTurn` it is turn 7, their Main, and the player has **1 active DON!!, 5 given** (`{"deck":4,"active":1,"rested":0,"given":5}`). The player has only 6 DON!! in total. The engine holds given DON!! through their turn (rules digest §81-82). The 8 is 1 + 5 + 2: the DON!! the player will have at the start of their **next** turn, after Refresh and the DON!! Phase.

The cause is in `ai/src/search/hint-line.ts` (`facts`, line 308): `facts.activeAtEnd = queries.don(s, me).active` is read after `s = settle(s, me, ctx)`, and `settle` (`sim.ts` 336) takes its turn number from the state **after** `endTurn` was applied. It therefore does not stop at their Main (same turn number) but plays their whole turn and stops at the player's next Main.

The same defect is in the S2 kit's chosen position. I replayed `ub-hint-1`: 4 active DON!!, Yamato costs 3, one given to the Leader, so at most 1 DON!! can be active at the end of the turn. The hint says "End your turn with 5 DON!! active" and, in the UI, "keeps 5 DON!! active for their turn" (read from the page at both sizes). WP7 swapped E15 for this position because of the 6-to-8 symptom ("not checked further"); the same bug is still shown to the participants of task 2.3.

**Why it is a 3.** A coach that states a false number as "any hand" certain, on the topic it exists to teach (DON!! efficiency, E15's lesson), and which also picks the lesson from it (`activeAtEnd >= 3` selects `don-efficiency`, line 318). The test ties E15's figures to the doc, but through an injected line, so the real search path was never compared with the engine. "Hint returns a line, and its numbers are right" is the done criterion as I read it.

**Fix.** In `facts`, read the count at the end of **their** turn start, not mine: capture `const turnBefore = queries.turn(s).number` before `apply(s, a, ctx)`, settle only until the first decision of a different turn (`settle` with the pre-apply turn number, or a variant that returns as soon as the turn counter changes), and read `queries.don(s, me).active` there (end-of-turn effects such as E15's Nami have resolved by then, and nothing of theirs has run). Add regression tests: for E15 (best line) and `ub-hint-1` the printed N equals `queries.don(s, me).active` at the first state with `turn > line turn`, and is at most (active before + DON!! the line adds) minus (cost paid and given); and an unconditional property over the 50 positions of `hint returns a line`. Re-run the E15 and `usability-s2` tests, then the hint text the S2 kit quotes.

### M7-R2 (severity 2): Why, Math and Tempo do nothing visible during a tall decision, and the press is stored

**Evidence.** Reaching a defence in `ub-why-1` (the AI has moved, so the Why button shows) and pressing Why, then Math: `data-mode` stays `strip`, no dialog, no live-region line, `aria-pressed="false"`, at both sizes. The profile in `localStorage` however becomes `{"expanded":true,"tab":"math",...}`, so **the coach opens itself to Math when the defence ends**, with no new press. That is the WP7 finding, and it is worse than "inert": it is a deferred, unannounced expansion. (`W` and the log's "Why?" link still work, so no keyboard path is lost; Hint renders inside the decision body and works.)

**Fix.** While the decision panel owns the rail, either hide Why, Math and Tempo, or render them inside the decision body as Hint is, or at least announce "Opens when this decision is done" (as Lethal does, L-SR2) and do not persist `expanded` until the coach actually opens.

### M7-R3 (severity 2): the interruption-contract suite cannot see coach speech made through the UI layer

**Evidence.** The unit test finds coach speech by the `source: 'coach'` tag on `controller.announce`, but the coach UI components call `g.ctl.announce(...)` with the default source `'game'` (`Coach.tsx` 507, 522, 534; `HintSection.tsx` 30, 166). The e2e records only the assertive region, and its `politeCoach` field is always `[]` (`coach-contract.spec.ts` 80). I added a `useEffect` to `CoachPanel` that announces "Tip: press H for a hint, it will tell you what to do this turn." on mount, rebuilt, and ran `coach-contract` at 1280×720: **4 of 4 pass**. An unprompted spoken coach line is exactly what learning-ui §2.2 forbids ("makes a sound unless the player asked for it"). Today's code has no such line (the existing `g.ctl.announce` calls are all after a press), so this is a test gap, not a product breach; but the done criterion is a test, and one channel is unguarded. I rate it 2 only because the product is compliant; if the owner reads the criterion as "the test must be able to fail on every channel", it is a 3.

**Fix.** Give the UI components a `coachAnnounce` (source `'coach'`) and fail the build on a coach file calling `ctl.announce` without a source (an ESLint `no-restricted-syntax` rule on `app/src/play/coach/**`), and make the e2e record the polite region's coach text for the no-key game (fail on any line at defaults).

### M7-R4 (severity 2): in t1 the Trash popover can leave "Next" and the "done" words covered, and Esc does not close it

**Evidence.** t1 asks the player to click every zone. Opening Trash shows a popover with a scrim over the rail, so the step card (its "done" copy and the Next button) is covered. With the popover open, clicking other zones works (it is not modal), after which two Escape presses leave `dialogs: 1`, `.rail-scrim` present, and the element at the Next button's position is the scrim (Playwright: "`.rail-scrim` intercepts pointer events"; the test hung 180 s). The authors' pointer test passes only because it opens Trash **last** and presses Escape once with focus still in the popover. A pointer player who opens Trash early, as the lit order invites, sees "9 of 9" but no way on until they find the popover's X. Keyboard players are fine (focus is inside the dialog, Esc works).

**Fix.** Close the popover on Escape from anywhere (document-level handler while it is open), or close it when another zone is clicked; and put the tutorial's step card above the scrim. Add an e2e that visits Trash first.

### M7-R5 (severity 2): at 1280×720 the battle caption overprints the turn bar, on tutorial step 5 and on every defence

**Evidence.** Screenshots `720p-t5.png` and the `ub-why-1` defence: the turn bar reads "Ace & Newgate attacks you**Turn 5 · Opponent's turn**" and "Return 1 DON!! to the DON!! deck**Turn 8 · Opp...**" with the two texts printed over each other. At 1920×1080 it does not happen. The board predates M7, but step 5 is the tutorial's key rules step and a first-time player at 1280×720 meets a garbled bar there.

**Fix.** Truncate or hide the caption when it would meet the turn bar (the rail's log already says it), or give the bar its own row at narrow widths.

### M7-R6 (severity 2): the hint's "Other lines" can be incoherent

**Evidence.** For `ub-hint-1` (at both sizes) the open hint shows: "Other lines: Attack their Leader with your Leader. Instead, attack their Leader with your Leader: it ranked lower in the games the search played out." The alternative's text is the same as step 3 of the main line, and the reason is the generic fallback. A first-time player cannot tell what the alternative is (it is the same attack **without** playing Yamato first) or why it is worse. In E15 the second alternative is "Play Laboon ... ranked lower in the games the search played out", also content-free.

**Fix.** Name an alternative by its first **line** ("Skip Yamato and attack with 4 DON!!") and say its measured cost in the heuristic's own terms, or show no alternative whose only reason is the fallback sentence. Cut order in the plan already lists "Other lines" first; cutting it is better than showing these.

### M7-R7 (severity 1): the Tempo tab and the Hint tab contradict each other on the same turn

In `ub-hint-1` the Tempo tab says "Ending your turn leaves 4 DON!! unused ... Give 4 DON!! to your Leader (9000) before it attacks" while the Hint says play Yamato (3 DON!!) and give 1. Both are on request, so no contract issue; but the second tab disagrees with the first without saying so. A one-line "the hint plans for this" or hiding Tempo's line while a fresh hint exists would do.

### M7-R8 (severity 1): `t7-leader` cites CR 6-5-4, which is not in `tutorial.md`'s `sources`

The step's `rule` is correct (the digest has Activate effects at CR 6-5-4-1), but the front matter lists 6-5-3-1, 6-5-5-2 and 6-5-6-1 and not 6-5-4. The content test checks the table keys and slots, not that each cited rule is a listed source. Add 6-5-4 and a test.

### M7-R9 (severity 1): the blunder warning is silent on a quick End turn (known, documented)

A press within about 1.5 s of a Main starting can commit silently (the table is not ready and the 300 ms rule drops a late answer). That is the specified behaviour (learning-ui §2.8: "only if analysis finishes within 300 ms") and the S2 card tells the facilitator to wait; it does mean the warning cannot be relied on by a fast player. Consider scoring one decision ahead (while the previous action animates) to shrink the window.

## Judged and cleared

- **The Why button during a tall decision** (WP7's open finding): judged severity 2 and worse than reported, see M7-R2.
- **"Hint on E15 says give 5, end with 8 from 6 DON!!":** a bug, see M7-R1. The give-5-and-attack line itself is a sound plan for that position (10,000 Leader, they need 6,000 of counters; I recomputed 10000 − 5000 + 1000 = 6000).
- **Tempo "They need N more power of counters":** correct (a delta between the stops needed with and without the DON!!; E06b agrees).
- **Tutorial copy against the rules digest and engine.** t2 (second player has 2 DON!! on their first turn; nobody attacks on their own first turn), t3 (a given DON!! adds 1000 only on your turn; the Leader shows 5000, then 6000), t4 (a tie goes to the attacker, 5000 against 5000 hits; only the Leader is a legal target here, copy says why), t5 (counter +1000 lifts 5000 above 5000; "Take the hit" is inert and says so, then the counter window still works), t6 (Activate uses the [Trigger] free, Add to hand keeps the card; 5 Life to 4), t7 (Luffy's [DON!! x1] [Activate: Main] [Once Per Turn] gives up to 2 rested DON!!; the card text matches), t8 (a hit at 0 Life wins; with 1 Life you need two hits; End turn restarts the step with "Not quite") are all true. Off-script: clicking a card that is not lit, giving DON!! on t4, End turn on t4 and t8, Take the hit on t5, Back from t4 to t3 all behave, and none strands the player.
- **Allowed-action filter.** `controller.actions()` and `act()` only filter the engine's own legal list; nothing in `steps.ts` adds an action. The t7 filter rejects option picks other than "2" and all `pick` follow-ups that are card handles, which works because Stussy is the only Character (a second Character would need the filter widened; it is a fixed scenario).
- **Timing log.** Read `timing.ts`: a step's wall time splits into active and hidden, exited time is not counted, idle over 120 s is reported in `idleMs` and left in `activeMs`, hidden time is never idle, resume restarts the step and counts one exit, the CSV is RFC 4180. Its unit tests and the e2e export agree. Note that `totalActiveMs` includes idle time, so "under 20 minutes" from the log is a generous reading; the facilitator should also read `idleMs`.
- **Reduced motion, axe, focus.** Axe clean on every tutorial step, the open hint, a defence with the strip, Settings and Home. Reduced motion shows no pulse (tests). Nothing but `H`, `L` (when pressed), the Do step 1 note and the guided count moves focus, and each is a press.
- **Blunder gate.** The 300 ms rule, "late answer commits silently", Commit anyway, Use the better choice, and mute are covered by `blunder.test.ts` and `blunder.spec.ts` (green); thresholds: the corpus test caps flags at 1% of decisions in every kind (WP2 measured 0.28%).

## Not verified here

The owner's usability session 2 (a human finishing the tutorial under 20 minutes, the teach-back), and the NVDA and VoiceOver runs (`a11y-nvda` is dispatched by hand). NVDA's browse mode and the tutorial's letter keys remains the WP7 open question.

## Fix round

**Date:** 2026-11-25. Each fix has a test that fails on the old code (the change was reverted, the test run and watched to fail, the change restored). The decision entry is in `docs/DECISIONS.md` (the first one).

| Finding | Fix | Test, and what it showed on the old code |
| --- | --- | --- |
| **M7-R1** (3) | `facts` in `ai/src/search/hint-line.ts` captures the turn number before `endTurn`, settles only until the turn counter moves (`settleToTurnChange`) and reads `queries.don(s, me).active` there. The lesson choice reads the same value. `ub-hint-1` now says "End your turn with 0 DON!! active, after giving 1" (4 DON!!, Yamato 3, 1 given), and its lesson is board-vs-face. | `ai/test/hint-don-count.test.ts` replays the searched line through the engine's reducer (`ai/test/support/line-oracle.ts`, no search code) and compares: E15 searched, and every Main position of the "hint returns a line" set (the printed N equals the engine count at the first state of the next turn). `app/test/usability-s2.test.ts` does the same for `ub-hint-1`. Old: E15 "expected 8 to be 1"; position seed 1 "expected 4 to be 0". `S2-kit.md` task 2.3 corrected (5 became 0). The ub-why-1 "kept 3 DON!!" is the AI's real end-of-turn state and was right. |
| **M7-R2** (2) | While a decision is tall, Why, Math and Tempo are `aria-disabled` with a reason (title and a described-by line), `aria-pressed` false, and a press writes nothing to the profile; nothing opens when the decision ends. Hint is unchanged (it shows in the decision body). | `app/e2e/coach-tall.spec.ts` (both sizes): at a defence in `ub-why-1` the three buttons are disabled with the reason, pressing them keeps the strip and the stored profile identical, and after "Take the hit" the coach is still a strip. Old (prop forced off): "Expected aria-disabled true, received empty". |
| **M7-R3** (2) | The coach components speak through `ctl.coachAnnounce` (source `coach`); an ESLint rule on `app/src/play/coach/**/*.tsx` forbids `.announce(` and a source-less `.alert(`; the polite and assertive live regions carry `data-source`; the polite queue keeps each line's source. | e2e `coach-contract.spec.ts` records `politeCoach` and `assertiveCoach` by source: empty at the defaults, assertive empty in the tier 1 run, only `Warning:` lines in the blunder run, non-empty after H (the recorder is not blind). Unit: `coachAnnounce` is tagged, and a scan fails any coach component that calls `.announce(`. **The reviewer's planted line** (an unprompted polite "Tip: press H for a hint, it will tell you what to do this turn." in `CoachPanel`, tagged or not): tagged, 2 of the 4 contract e2e tests fail (defaults and blunder) at 1280×720; untagged, the lint rule and the unit scan fail. Reverted. |
| **M7-R4** (2) | In the tutorial the Trash scrim and popover end above the step card (the tall panel's top); Escape closes the popover from anywhere (a document-level key handler while it is open, deferring to a nested dialog). | `app/e2e/tutorial-trash.spec.ts` (both sizes): Trash first, then every other zone, the card is clear of the popover and nothing at its centre is the scrim, one Escape after focus has left closes it, Next works. Old: popover bottom 468 against a card top of 244. |
| **M7-R5** (2) | `.mid-left` in `play.css` is limited to the room left of the centred turn words (`max(96px, 50% - 296px)`), two lines clamped. Layout is board.md §3.8's: the centre is on the axis. | `app/e2e/battle-caption.spec.ts` (both sizes, tutorial t5 and a defence in an ordinary game): the caption box ends before the turn words, the words before the stepper, the stepper inside the band, and the caption does not spill. Old: caption right edge 260 against turn words at 199.8 (and 302 in the ordinary game). |
| **M7-R6** (2) | `mainHint` drops an alternative that equals a step of the main line and one with no specific reason (`whyWorse` returns null instead of "it ranked lower"); a defence or choice alternative needs a measured margin of 0.5 or more. | `ai/test/hint-alternatives.test.ts` (all positions: none repeats a main-line step, none is a bare "ranked lower") and `ub-hint-1` in `usability-s2.test.ts` (no "Attack their Leader with your Leader." alternative). Old: both fail on exactly that alternative. |
| **M7-R7** (1) | The Tempo tab states the ledger as the board stands now (no attack evidence, no "Give N DON!!" line) and says to ask for a hint for a plan (`explainUnused(..., ledgerOnly)`). The blunder warning keeps its suggestion. | `usability-s2.test.ts`: on `ub-hint-1` the tab's explanation has no line and no "Give N DON!!". Old: "expected [ giveDon, attack ] to be null". |
| **M7-R8** (1) | `CR 6-5-4` added to `tutorial.md`'s sources. | `tutorial.test.ts`: every step's cited rule is in the sources (old: "t7-leader cites CR 6-5-4: expected [ ...] to include 'CR 6-5-4'"). |
| **M7-R9** (1) | Left as documented: a press within about 1.5 s of a Main may commit silently (learning-ui §2.8 and the S2 card say so). Scoring one decision ahead stays an idea for M8. | None. |

**Gates (this worktree, own `npm ci`):** `npx vitest run engine ai app cards/test`: 3,000 files passed, 33 skipped; 31,718 tests passed, 26 expected fail, 10 skipped, 164 todo; 0 failed. `E2E_PORT=4819 npx playwright test`: 307 passed, 41 skipped (the nightly ones), 0 failed, both projects (the review's run was 299; the fix round adds `coach-tall`, `tutorial-trash` and `battle-caption`, each at both sizes, and strengthens `coach-contract`). `npm run typecheck`, `npx eslint .`, `npx prettier --check .` and `npm run build` are clean. A first e2e run failed the blunder contract test because the polite queue had merged a coach line into game lines; the queue now never merges lines of different sources (unit-tested).
