# M5b review: Warlord, Emperor and the 12 playbooks

**Date:** 2026-11-17
**Reviewer:** independent adversarial review. Brief: find real problems, not confirm the builders' reports. No source was edited; probes and screenshots are outside the repo (scratchpad `m5b-review/`).
**Build reviewed:** `main` at `3f9d62f` (commits 8323f61..3f9d62f; `bba97bc` is docs only), `node_modules` as installed.

**Rule:** any severity 3 or 4 finding fails the milestone. 4 = wrong game result or hidden-information leak; 3 = blocks a stated done criterion or changes play materially; 2 = should fix; 1 = nit.

**Verdict: FAIL.** Open: M5b-1 (severity 3). No severity 4: no hidden-information path was found, and a twin-world differential over 1,057 decisions found none (below).

The search itself is sound and the hidden-information discipline is good. The failure is that the default tier does not follow the playbooks the way the assertions say it does, because the assertions were only ever run against Pirate.

## Method

1. Read PROMPT.md (AI opponent), PLAN §2 M5b, ADR 0008, DECISIONS and benchmarks M5b entries, STATUS, board.md §5.2, principles.md §10, the code in scope.
2. Hidden-information probe: a twin-world differential (`diff-twin.ts`, below).
3. Re-ran the game-plan assertion files with Warlord instead of Pirate, in a mirror tree that symlinks the repo (`TIER=warlord`, scenario helper changed in the copy only).
4. Ran the 20-game strength smoke (`strength-warlord.test.ts`, defaults) with per-test timings; a 12-game Warlord-vs-Pirate census (iteration budgets, `onFallback` throwing); an iteration-rate probe on the app's millisecond budgets over 12 real positions; Playwright screenshots of Setup, the thinking state and Why? at 1280x720 and 1920x1080 on the dev server.
5. Did not run the 200-game series, as asked.
6. Read CI history with `gh` (the CI run for 3f9d62f was still running at review time).

## Hidden information: no leak found (probe result, not an item)

`diff-twin.ts` builds two worlds with the same public view and different hidden cards (a permutation of each side's hidden cards, or the opponent's hidden cards replaced by arbitrary cards of the game's two decks), asserts the two `projectForSearch` views are byte-identical, then runs one session per world across a whole turn (tree reuse, queue, re-search, lethal queue), comparing action, explanation, alternatives and stats at each step. 12 deck pairs, 2 seeds, up to 6 turns, 2 variants each.

| Tier | Variant | Decisions compared | Of which after a reused tree | Mismatches |
| --- | --- | ---: | ---: | ---: |
| Warlord | permute | 310 | 194 | 0 |
| Warlord | replace | 310 | 194 | 0 |
| Emperor | permute | 437 | 315 | 0 |

Worlds that diverge in public view (a counter, a Trigger flip) are dropped from the comparison (63 and 58 cases), as they should be. The existing `warlord.test.ts` differential builds a fresh session per sample, so it never exercised tree reuse; this probe does, and passes. Read-through agrees: `sample.ts` takes only the view, the AI's own list and the archetype prior; `mcts.ts` and `warlord.ts` read `GameState` only through determinized states; the playbook conditions that read hidden-looking data read the AI's own hand (`avoidPlay`, `activateBefore`, `pickWithTrigger`) and are never cited by `why.ts`. Determinism: no `Math.random`, `Date.now` or unseeded RNG in `ai/src` outside the clock and lethal's millisecond cap; iteration budgets are deterministic (the ms-mode lethal cap and search are not, by design).

One note, not an item: `controller.ts:681` derives the AI's seed from the game seed (`session.seed * 2654435761 + at * 40503`). The determinization RNG is a different stream, so there is no usable correlation, but it is a function of the secret that seeds the shuffles. Fine today; do not reuse the game seed directly.

## Findings

### M5b-1 (3) Warlord, the default and strongest tier, fails the game-plan assertions; pick biases are dropped inside macro moves
- **Done criteria:** PROMPT "Done when": "the strongest AI tier ... plays each loaded meta deck according to that deck's game plan"; PLAN M5b: "game-plan assertions for all 12 playbooks". Every assertion in `game-plan.test.ts`, `game-plan-g1/g2/g3.test.ts` runs Pirate: `ai/test/support/scenario.ts:100` hardcodes `'pirate'` in `play()`, and the self-play tallies pass `tiers: { p1: 'pirate', p2: 'pirate' }` (`game-plan-g1:594`, `g2:617`, `g3:372`). `grep -i "warlord\|emperor" ai/test/game-plan*.test.ts` finds nothing.
- **Evidence:** the same files with `TIER=warlord` (iteration budgets, planted positions, biases on): 7 tests fail that pass for Pirate (CI is green for Pirate).
  - g1 Kalgara seed 1: "the Leader attacks with a DON!! given and plays a Shandian Warrior free" (g1:295, `expected false to be true`).
  - g1 Kalgara seed 2: "the free play is the highest-cost Shandian Warrior" (g1:323, field is `['OP15-101','OP12-099']`, not `OP15-114`).
  - g2 OP13-001 seed 2: "plays Sanji before Luffy OP13-118 when it plays both".
  - g3 Purple Enel seed 2: "gives the leader's DON!! to the Character that can attack" (`expected [] to include ...`).
  - g3 Rosinante seed 1: "plays a Law at full cost when the discount does not pay" (the discount was used).
  - g1 "Why? cites the group-1 lines" (Enel Linlin / Kalgara giveDon cite not produced for Warlord).
  - g2 mechanics "avoidBasePower: a wanted 9000 Character stays in hand".
  Full output: `scratchpad/m5b-review/plan-warlord.out` (23 failed, 125 passed, counting biases-off runs, which are expected to differ).
- **Cause (code):** a Warlord macro move carries its first prompt's answer (`mcts.ts:85-104`, `withPrompts`), and the tree scores it with `mainBias` only. `mainBias` (`pirate.ts:360-517`) has no case for `targetHighestPower`, `preferPick`, `targetCanAttack`, `pickWithTrigger`, `avoidTarget` (pick) or `acceptOptional`; those live in `otherBias` (`pirate.ts:~640-760`), which Warlord applies only to a stand-alone decision (`warlord.ts:448`). The queued rest of a macro is returned by `takeQueue` before any decision logic (`warlord.ts:493`). So any bias on the pick that a play raises is ignored, unless the choice happens to be a later, separate prompt. DECISIONS says "every bias kind that is a move prior applies"; that is not true for these kinds. Kalgara 2 and Purple Enel 2 fail for exactly this reason.
- **Fix:** apply `otherBias` to the `pick` actions inside a macro (add its score to `info.bias` for the candidate), or stop packing a prompt into the macro when the playbook has a pick bias for that source. Parameterise the scenario `play()` helper and the planted tests over `['pirate','warlord']` (and Emperor for a subset), and run the self-play tallies for Warlord nightly. Until then, say in STATUS and the guide pages that the assertions describe Pirate.

### M5b-2 (2) The strength gate measures a Warlord with a fraction of the search the app runs
- **Evidence:** `BUDGETS.warlord.iterations.turn = 4000`; `session.ts:41-42` and the ADR say that is "about 2.5 s". Measured with `rate.ts` (`planTurn` on the app's `ms` budgets, real positions, 6 deck pairs, 2 positions each; machine loaded, load average 4 to 8): Warlord 2,161 to 77,975 iterations in 2.5 s (median about 31,000; seven of twelve above 30,000), Emperor 5,687 to 168,037 in 6 s (median about 90,000). The CI budget is 4,000 and 10,000. The first position of each pair (mid-game) ran 25,000 iterations per second, the second 800 to 2,800. So the app's Warlord has 1 to 19 times the gate's search, depending on the position and the machine.
- **Consequence:** the 133/200 figure and the "Emperor is not stronger" figure are for a different player from the one a user plays. The latter is the more important: Emperor at 10,000 iterations versus Warlord at 4,000 says little about 150,000 versus 30,000.
- **Fix:** correct the comments and ADR (the iteration count is a CI proxy, not 2.5 s). Either calibrate the iteration budgets per tier to the median ms-mode count, or add one nightly series on a fixed larger budget (for example Warlord 30,000) and report it beside the 4,000 one.

### M5b-3 (2) Warlord vs Pirate gate: point estimate, 3 games of margin, measured on code that has since changed
- **Evidence:** `strength-warlord.test.ts:163` is `winRate >= 0.65`; `wilson()` is only written to the JSON report. Measured 133/200 (66.5%, interval 59.7 to 72.7%): the gate passes at 130. The measurement used the 40% re-search budget; the shipped code is 25% (`warlord.ts:99`), and the playbooks arrived mid-run (benchmarks.md says so). Seeds are fixed (`130_000 + g`), so the nightly replays the same 200 games every night: it adds no information until code changes, and every code change is a fresh coin flip near the threshold.
- **Fix:** keep 65% as the PROMPT number but add a second assertion that the Wilson lower bound exceeds 50% (Warlord is better than Pirate at all), and rotate the seed base nightly (log it, as the property tests do) with a fixed-seed run kept as the regression gate. Re-measure at 25% before sign-off (in progress by the lead).
- **Fair pairs?** Yes: the 12 ordered pairs include both orders of each deck pair and both seats (`g % 2` for seat, `(g >> 1) % 12` for the pair), so a deck advantage cancels. Per-pair results are lopsided (17/18 and 6/18 for the same pair), which dilutes the tier gap; same-archetype mirrors would separate the tiers better and the DECISIONS entry already says so. Both tiers use their playbooks, so the gate does not measure what the playbooks add.

### M5b-4 (2) Nightly strength can time out instead of reaching a verdict; the M5b steps have never run on CI
- **Evidence:** `vi.setConfig({ testTimeout: 3_600_000 })` (60 min per test, `strength-warlord.test.ts:26`). The smoke's Warlord-vs-Pirate test took 509.6 s for 20 games (25.5 s a game, laptop under load) in this run; 200 games is about 85 min, over the 60 min cap, on a machine faster than a GitHub runner. Warlord vs Rookie took 208.9 s for 20, so 35 min for 200. The job has `timeout-minutes: 300`; five 200-game series plus 40 Emperor games at 10,000 iterations will not fit if the runner is two times slower. A timeout fails the job without any strength information. Separately the `property` job keeps `timeout-minutes: 60` and gained `test:plan-g1`, game-plan g2/g3 at `PLAN_GAMES=40`, and four nightly Playwright specs (several 1x games of 3 to 8 AI turns each); its last runs were 15 to 30 min before M5b. `gh run list --workflow=nightly.yml` shows no run since the merge.
- **Fix:** raise the per-test timeout to match the job (or run each series in its own step), set a job cap from a measured dispatch run, and dispatch the workflow once before sign-off (as was done for M4a-20). The wiring otherwise fails correctly: no `continue-on-error`, `npm run` exits non-zero, results uploaded `if: always()`.

### M5b-5 (2) `budget.test.ts` is a partial replacement for the removed Pirate test
- **What it does well:** it runs the app's real ms budgets for Pirate, Warlord and Emperor over real positions, includes determinization and the lethal check in the plan time (the timer wraps `planTurn`), and uses the near-maximum (`quantile(..., 0.95)` of 12, 10 and 4 samples is the largest sample).
- **Gaps:**
  1. The plan allowance is `(turn.ms + lethal.ms) * 1.2` (`budget.test.ts:69`): 3,180 ms against a 2,500 ms budget is 27% over; Emperor 7,560 against 6,000 (26%). PROMPT says budget plus 20%.
  2. Only the first Main decision with no plan and the non-Main decisions are timed. The re-search path (`mainDecision` with `replanBudget` = 625 ms / 1,500 ms plus a second lethal check and `consistent()`) is never timed. `decide()` on a Main position, with `planTurn` not called first, is not timed.
  3. One deck pair (Rocks and Kaido, seeds 41 and 42). The rate probe above shows iteration cost varies 10x across decks; overshoot is bounded by one iteration, but determinization and lethal cost are deck-dependent and untested.
  4. No Rookie (10 ms) test anywhere ("every tier").
  5. The check is nearly a tautology (the loop stops on the clock). The removed test failed on CI at 148.1 ms against a 144 ms limit (run 44035361839, `pirate.test.ts`), which shows a fixed overhead of about 28 ms. A 500 ms budget hides that overhead, it does not remove it; PROMPT's own Pirate number is 100 ms.
  6. `warlord.test.ts:317-339` keeps a 120 ms wall-clock test with `* 1.2 + 15` ms slack: the same shape as the flaky test that was removed, with the +15 ms added to hide the flake, and a looser rule than the criterion.
- **Fix:** allowance `budget * 1.2` and report the lethal cap separately (or lower the search budget by it); add the re-search and no-plan Main cases and three more deck pairs; add a Rookie assertion; drop or relax the duplicate at `warlord.test.ts:317`.

### M5b-6 (2) Emperor is labelled "for hard practice" with no evidence it is harder
- **Evidence:** `Setup.tsx:195` "the Warlord's search with more than twice the thinking time, for hard practice". benchmarks.md: Emperor 30/60 against Warlord (50.0%, interval 37.7 to 62.3%) and "Emperor is 'longer thinking', not measurably stronger"; DECISIONS (7) says the same; the nightly assertion is `>= 0.35`. The gate cannot fail for a no-op. Compare M5b-2: the tested budgets are not the app's.
- **Fix:** copy that says what is true ("the Warlord with more thinking time; no measured difference in strength yet"), or hide Emperor until it measures stronger on the app's budgets. `Home.tsx` lists it by name too.

### M5b-7 (2) Pacing: no regression for a typical Warlord turn, but Emperor and long turns miss the stated targets with no recorded decision
- **Warlord:** measured 5.3 to 7.5 s for 2 to 7 moves (4 turns), within the 8 s target; board.md §5.2 itself predicted about 9.2 s, so this is better than the design. The "up to about 12 s for a long one" in Setup copy (`Setup.tsx:18`) is an estimate (Pirate's 10.0 s plus the wait), not measured, and sits above principles.md §10's "90th percentile at most 11 s". principles.md's check asks for ten seeded Warlord turns; four were measured.
- **Emperor:** typical 10 to 15 s, long 17 s, against the 8 s target (PLAN M5a, ARCHITECTURE §4.1, principles §10 median). The copy is honest about it. No DECISIONS entry accepts it; board.md §5.2 still says Warlord visible thinking is at most 1,800 ms and PD-4 still says typical Warlord 9.2 s, and the e2e allows `limit + thinkMs` (8 s plus the wait), so the guarded number is not "turn at most 8 s".
- **Fix:** record the decision (accept Emperor's 10 to 15 s as stress practice, or cap its budget), update board.md §5.2 with the measured figures (wait 2.2 to 3.5 s: the plan is not hidden by the 700 ms animation), measure ten Warlord turns including one 15-move turn, and make the e2e bound the whole turn.

### M5b-8 (2) Playbooks: duplication, 25-point rules, thin assertions, and one guide edit that contradicts its source
- **Overlap (duplication, not a defect):** `playOnlyIf` (g1: OP05-098, OP08-098, OP14-041) and `playOnlyWhen` (g2: ST30-001, OP17-079) differ in condition vocabulary only; `giveDon` (g1), `leaderDon` (g2) and `giveDonLeader` (g3) are three spellings of "DON!! on the Leader" with different gating. No playbook mixes two overlapping kinds, so no double count today (checked per file). The risk is the next author choosing the wrong one. Merge into one `playOnly` and one `giveDon` with optional gates when convenient; also `pirate.ts:~452` repeats `x.ability === bias.ability &&` twice (harmless).
- **Rule-like penalties:** `keepActiveDon` (OP13-001) and `playOnlyWhen` (OP17-079) at 25 (`OP13-001.json:86`, `OP17-079.json:75`). The search squashes values with `tanh(v / 12)` (`mcts.ts:56,69`), so a 25-point penalty is 0.97 of the whole range: it behaves as a veto that only a winning line (1000) overrides. That is what DECISIONS says it wants ("a rule, not a preference"); the cost is that nothing weighs it against a bad alternative. Bias is also summed along the path only for moves in the tree; rollouts after the tree pay none, so the penalty on `endTurn` is paid by paths that end the turn inside the tree and not by paths that stop earlier. Acceptable, but untested.
- **Evidence of effect:** an on/off A/B was measured only for Rosinante (4 against 12 wins at first, hence the relaxed seed 1). g1 states no A/B for Robin, Enel, Kalgara, Hancock; g2 has none for the three it wrote. The strength gate cannot show it (both tiers use their playbooks). Group 3's A/B shows a playbook can cost strength.
- **Seeds with too few cases:** Robin 5 (0 of 1), Kalgara 4 and 5 (none), ST30-001 5 and 6, OP13-001 2 (never came up), ST30-001 4 (vacuous by construction) are judged by a planted position only. With M5b-1 those planted tests do not describe Warlord.
- **Guide edited to fit the AI:** `docs/content/archetypes/OP12-061.md` seed 1 and the T2/T3 rows were rewritten so the AI's measured line (12 to 4 wins of 40, then 17/60 against 15/60) is the guide's line, while still tagged `[SH-ROS]`, whose step 3 says the opposite. The text carries "inference ... measured self-play", which is honest, but the citation tag now attaches a source to a line it does not support (PROMPT: never invent; "the playbook is what the guide is written from"). Remove the `[SH-ROS]` tag from the changed rows or keep the sourced line and say the AI deviates.

### M5b-9 (2) The per-push `npm test` is now dominated by one file; CI went from 2.5 to over 14 minutes
- **Evidence:** `ai/test/strength-warlord.test.ts` at its default 20 games, per test on this machine (under load): Pirate vs Rookie 15.0 s, Warlord vs Rookie 208.9 s, Warlord vs Pirate 509.6 s, then Warlord vs a one-iteration Warlord and the one-iteration Warlord vs Pirate (still running when this was written; the log is `scratchpad/m5b-review/smoke.log`). That is more than 12 minutes of the roughly 18 minutes reported, in one file. CI: the `checks` job for 3f9d62f was at 14 minutes and still running; STATUS records 2 min 35 s at M4a, and the earlier M5b commit's `checks` took 7 min 10 s.
- **Does it belong per push?** Not at 20 games: a 20-game Warlord-vs-Pirate result has an interval of about 40 points, the gate is `>= 55%`, and it cannot show 65%. It fails per push only for a gross break, which a 4-game Warlord-vs-Rookie and 4-game one-iteration check would also catch in under 2 minutes.
- **Fix:** per push, `STRENGTH_GAMES=6` (or run only Warlord vs Rookie and one-iteration vs Pirate); everything else nightly. The per-push smoke covers 5 of the 6 deck pairs (20 games reach ordered pairs 0 to 9; `OP08-098/OP13-001` and its reverse never run), another reason to choose the games, not the count.

### M5b-10 (1) "Give up to N DON!!": the AI does give fewer; thin evidence, never zero
- **Evidence:** census over 12 Warlord-vs-Pirate games (1,154 Warlord decisions, 0 fallbacks): 5 "how many DON!!" prompts, all Purple Enel (OP15-058), answered 3 of 3, 3 of 4, 2 of 4, 4 of 4, 3 of 4: fewer than all in 3 of 5, zero never. `warlord.test.ts:414` checks candidates (a macro for every count, including 0), not outcomes. STATUS says so ("tested by candidates, not by a game where fewer wins").
- **Fix:** one planted position where giving fewer or none is the only winning line (keep a DON!! for a counter), asserted on the chosen action.

### M5b-11 (1) Silent fallback paths
- `AiSession.decide` and `planTurn` call `onFallback` for every error except `CannotDeterminize` (`session.ts:173,193`), which silently plays the Rookie policy. The strength gate's `noFallback` therefore does not trap it, and nothing counts it. Across the census it never happened (0 of 1,154: the explanation text "It could not search this position" would show it), so this is a guard, not a bug. `provenLine` also swallows any lethal error as "unknown" (`warlord.ts:111`), by design. Fix: count `CannotDeterminize` in the gate (throw in tests, tally in `report`).

### M5b-12 (1) Stale comments and docs
- Re-search budget: code 25% (`warlord.ts:99`); comments and docs say 40% (`warlord.ts:53`, `session.ts:42`, ADR 0008 addendum line 39). benchmarks.md notes the 200-game runs used 40%.
- PROMPT's tier table lists budgets of 10, 100, 1,500 and 5,000 ms per decision; ADR 0008 (accepted earlier) replaced them with per-turn plans (Pirate 500/250 ms, Warlord 2,500/400, Emperor 6,000/600). The table was never updated; the PROMPT is the stated source of truth.
- ADR addendum: Emperor's "iterative deepening" is depth caps over one budget (recorded as a deviation; the UI does not claim more).

### M5b-13 (1) Screenshots against principles.md (Setup, thinking, Why?; 1280x720 and 1920x1080)
Files in `scratchpad/m5b-review/`: `setup-1280.png`, `setup-1920.png`, `setup-emperor-*.png`, `thinking-1280.png`, `thinking-1920.png`, `why3-1280.png`, `why3-1920.png`.
- **Setup:** Warlord is the default and listed first; each tier has one line and a measured turn time (principle 9, honest; but see M5b-6 for "hard practice"). The long Warlord line (7 wrapped lines at 1280) pushes the Opponent column well past the others. A first-time visitor defaults to a 5 to 8 s turn tier, not the learner-friendly one; flows.md moved the default deliberately. At 1920 the three columns stop at about 1160 px and leave 760 px empty (pre-existing).
- **Thinking:** shown only when real (principle 10); an orange "Thinking" chip, the strip "Kaido is thinking...", and the rail's "Kaido is thinking..." all say the same, and the rail adds "Last: Kaido is thinking..." which echoes it. The strip and rail name the deck ("Kaido"), the header names the tier ("Kaido · Warlord AI"); consistent enough. The Emperor suffix "The Emperor thinks longer." was not exercised in the screenshots.
- **Why?:** a public-only badge and a template line. For declined effects the content is tautological ("It did not use its Leader's effect. ... The effect is not used."), so it does not meet PROMPT's "real, not decorative"; Main-phase end-of-turn is similar ("It ended its turn ... Its turn is over."). Plays and attacks with a playbook line cite the guide; otherwise "Best found in its time". The dialog covers the event log and rail (by design).
- No console errors apart from the blocked image requests I injected.

## What passed

- 0 mismatches in 1,057 twin-world decisions (above); 0 fallbacks and 0 illegal actions in 12 full games (the harness checks every action against the view's list).
- Strength smoke at the repository's own thresholds: Pirate 20/20 and Warlord 20/20 against Rookie; Warlord vs Pirate and the M5a-10 pair were still running when this was written.
- The two M5a-10 control gates (one-iteration Warlord must lose to the full one and to Pirate) are meaningful and wired to fail.
- Nightly wiring fails loudly (see M5b-4 for the timeout caveat).
- Candidate generation covers every count of "give up to N" including none; the Why? differential tests for the three new decks pass.
- Setup, Home, PlayRoute and Game changes are small and correct; tier names flow through to the oppTier label.

## Order of fixes

1. M5b-1 (blocking).
2. M5b-4 and M5b-9 (CI cost and nightly timeouts) before the nightly is relied on.
3. M5b-2, M5b-3 (make the gate describe the shipped Warlord).
4. M5b-5, M5b-6, M5b-7, M5b-8, then the severity 1 items.

**Verdict: FAIL** (M5b-1).
