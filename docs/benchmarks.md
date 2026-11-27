# Benchmarks

## Two-turn simulations on scripted decks (M4a exit criterion, ADR 0008)

This is **engine playout throughput**: random playouts from real positions. It does not yet include
what MCTS will add per iteration (determinization, `project` at the root, evaluation), and it runs in
Node, not a browser worker; M5a adds those figures (review M4a-13).

**Result (2026-10-29): median 5,588 two-turn simulations per second** in one `worker_threads`
worker, on the scripted Rocks (OP17-039) and Kaido (OP17-058) lists. The target was at least 1,000,
so ADR 0008's fallback is **not** triggered.

| Run | Simulations | Seconds | Simulations/s | Actions/s | Actions per simulation |
| --- | --- | --- | --- | --- | --- |
| 1 | 22,450 | 4.01 | 5,600 | 169,857 | 30.3 |
| 2 | 22,050 | 4.00 | 5,510 | 167,061 | 30.3 |
| 3 | 22,400 | 4.01 | 5,588 | 169,484 | 30.3 |

**Machine:** Apple M4 Pro, Node v25.9.0 (the owner's development machine). A browser Web Worker on a
2020 laptop will be slower; ADR 0008's CI budgets are iterations, so strength tests do not depend on
this number.

**Run it:** `npm run bench:two-turn` (`BENCH_SECONDS`, `BENCH_RUNS` to change the defaults of 4 s
and 3 runs). Source: `engine/bench/two-turn.ts`.

**Method:**
1. **Start positions.** 40 seeded random Rocks-vs-Kaido games (both seatings) with every card's
   effect scripted. The state at the start of each Main Phase from turn 3 on is kept: 485 positions
   with real boards, hands, DON!! and effect state.
2. **One simulation.** From a start position, a random legal action is applied with `reduce` until
   two turns have ended or the game is over. The policy is the property tests' one: never concede,
   and ending the turn is less likely while other moves exist. Every effect, cost, choice, order
   decision and replacement on the way is answered by the same policy. `legalActions` is called once
   per action, as a search would.
3. **Measure.** A `worker_threads` worker runs simulations round-robin over the positions for the
   time budget and reports simulations, actions and elapsed time. The main thread reports each run
   and the median of three.

Earlier figures (M2, before effects): median `reduce` about 3–4 µs, `project` about 26 µs
(`npm run bench`, `engine/bench/reduce.bench.ts`). With effects, one action including its
`legalActions` call costs about 6 µs on average in the simulation above.

## M4b archetypes: two-turn simulations per second, before and after the derive fix (2026-11-16)

`npm run bench:two-turn` now runs five matchups (override with `BENCH_MATCHUPS=A:B,...` leader ids):
Rocks vs Kaido (the M4a one) and four M4b archetypes each against Rocks, same method as above
(random playouts of two turns from real Main Phase positions of 40 seeded games, one worker, median
of 3 runs). Machine: Apple M4 Pro, Node v25.9.0. Before: 3 s runs on `origin/main` 768f719; after:
4 s runs with the fix (DECISIONS 2026-11-16 "M4b perf"). ADR 0008 target: at least 1,000.

| Matchup | Before (sims/s) | After (sims/s) |
| --- | --- | --- |
| Rocks OP17-039 vs Kaido OP17-058 (no permanents) | 4,371 | 4,190 |
| Sabo OP13-004 vs Rocks | 333 | 1,866 |
| Luffy & Ace ST30-001 vs Rocks | 648 | 2,205 |
| Enel OP15-058 vs Rocks | 1,101 | 2,840 |
| Boa Hancock OP14-041 vs Rocks | 1,104 | 3,169 |

Rocks vs Kaido is unchanged within run noise (about 4,100 to 4,700). The golden test's `meta-random-2`
replay went from 4.7 s to 0.9 s, mostly from making its step loop linear; one replay is 12.7 ms
(was 46 ms).

## M5a: Pirate strength, game plan and AI turn time (2026-10-29)

### Strength: Pirate vs Rookie (PLAN M5a exit: at least 75%)

**Result: 200 wins in 200 games (100%), Wilson 95% interval 98.1% to 100%.**

| Pirate's deck | Games | Wins | | Pirate's seat | Games | Wins |
| --- | --- | --- | --- | --- | --- | --- |
| Rocks (OP17-039) | 100 | 100 | | p1 | 100 | 100 |
| Kaido (OP17-058) | 100 | 100 | | p2 | 100 | 100 |

**Method** (`ai/test/strength.test.ts`, `npm run test:strength`; nightly):
- Decks: the first sourced list of Rocks and of Kaido (`docs/research/meta-lists.json`), the Pirate playing each deck in each seat in turn (game g: Pirate in seat p1 when g is even; Pirate's deck Rocks when ⌊g/2⌋ is even), against the other deck.
- Seeds 10,000 to 10,199; who chooses first follows the seed. Both sides see only their own views; every chosen action is checked against the view's own list.
- Budgets in iterations, so the run is the same on every machine: 900 rollouts per turn plan, 120 per defensive decision, 4 determinized states (`BUDGETS.pirate.iterations`). No game hit the 2,000-action cap; no draws.
- The interval is the Wilson score interval. With 200 of 200 the lower bound is 98.1%.
- Per push, the same test runs 20 games (seeds 10,000 to 10,019) with a wide tolerance (at least 60%); it takes about 10 s.

### Search cost (maps iteration budgets to the app's milliseconds)

Measured over the same 200 games in Node on the owner's machine (Apple M4 Pro): **5,593 rollouts per second** (one rollout plays a candidate move and the rest of the turn with the quick policies, then evaluates). Pirate's search time per own turn: median 31 ms, 95th percentile 266 ms, maximum 959 ms; per decision: median 1.3 ms, 95th percentile 30 ms. The app uses wall-clock budgets of 500 ms per plan and 250 ms per defensive decision (`BUDGETS.pirate.ms`), which at this rate is above the CI iteration budget; a 2020 laptop's worker is slower, and the budget then caps the search. A test holds a 120 ms budget to within 20% at the 95th percentile (`ai/test/pirate.test.ts`).

### Game-plan assertions (ARCHITECTURE §4.6)

Per push, each playbook seed is a planted-position test (`ai/test/game-plan.test.ts`, 12 tests, all pass). Nightly, the same seeds are measured over 40 Pirate-vs-Pirate games (Rocks vs Kaido, seats swapped, seeds 30,000 to 30,039; Rocks won 34, Kaido 6), because against Rookie most games are decided before the guides' key turns. A turn the AI's own search scores as a win in at least half its samples is a finishing turn and is not judged by the plan. An assertion is enforced when it has 10 or more cases.

| Playbook seed | Cases | Met | Rate | Threshold |
| --- | --- | --- | --- | --- |
| Rocks 1: Leader attacks every turn from T2 | 145 | 145 | 100% | 90% |
| Rocks 2: pays the reveal cost with 2+ cards | 210 | 210 | 100% | 90% |
| Rocks 3: OP17-118 on the first 10-DON!! turn | 7 | 6 | 86% | 80% (too few cases to enforce) |
| Rocks 4: no Buckin while OP17-118 is in hand after T3 | 68 | 67 | 99% | 80% |
| Rocks 5: Stussy targets the highest power | 18 | 17 | 94% | 80% |
| Kaido 1: the −2000 on a Character attacker when it changes the result | 36 | 30 | 83% | 80% |
| Kaido 2: each −2000 on their turn cuts the Counter needed by 1000+ | 108 | 95 | 88% | 80% |
| Kaido 3: a DON!!-adding Character by T3 | 38 | 38 | 100% | 80% |
| Kaido 4: Ulti & Page One after the Leader's −2000 | 6 | 3 | 50% | 80% (too few cases to enforce; the planted test passes) |
| Kaido 5: a 9- or 10-cost Character by T5 | 28 | 27 | 96% | 60% |

### AI turn time at 1× (PLAN M5a exit: 8 s or less)

Measured in the browser (Playwright, Chromium, the production build, the real worker) by the game controller: from the start of the AI's turn to the end of its End Phase hold, the time of the player's own Block, Counter and Trigger decisions excluded (flows F21). The player ends each turn at once and takes every hit (`app/e2e/pirate.spec.ts`).

| Start | AI turn (game turn) | Moves shown | Time waiting on the worker | Turn time |
| --- | --- | --- | --- | --- |
| Turn 1, seed 31 | 2 | 1 | 0 ms | 1.0 s |
| Turn 1, seed 31 | 4 | 5 | 12 ms | 2.8 s |
| Turn 1, seed 31 | 6 | 6 | 13 ms | 3.6 s |
| Turn 1, seed 31 | 8 | 9 | 52 ms | 4.5 s |
| Late-game position (`scenario=late`) | 8 | 15 | 132 ms | 6.8 s |

Every measured turn is within 8 s; the heaviest (15 moves) took 6.8 s. The worker plans during the turn-start segment and searches each next decision while the previous move animates, so the board waited on it for at most 132 ms in a turn. Per push, the late-game measurement must keep its median within 8 s; nightly, the turn-1 game must too (at least 3 turns).

## M5a fix round 1 (2026-10-29): gates that can fail, game plan with and without biases, A/B

All runs: iteration budgets, Node on the owner's Apple M4 Pro, `npm run test:strength` (nightly) unless noted.

### Strength gates (review M5a-10)

| Run | Games | Pirate wins | Wilson 95% | Gate |
| --- | --- | --- | --- | --- |
| vs Rookie, seeds 10,000–10,199 | 200 | 200 | 98.1%–100% | ≥ 95% nightly (≥ 90% over 20 per push: 20/20) |
| vs a shallow Pirate (no rollouts), seeds 20,000–20,099 | 100 | 66 | 56.3%–74.5% | ≥ 60% (per push, 20 games: 14/20) |
| Control: shallow vs shallow, seeds 20,000–20,039 | 40 | 21 | 37.5%–67.1% | none: it shows the 60% gate fails for a Pirate without rollouts |
| vs Rookie, the Pirate's prior leaving out the opponent's actual list | 100 | 100 | 96.3%–100% | ≥ 95% nightly |

Why "a shallow Pirate", not "1 rollout": since the scoring fix (M5a-15), the first round of samples always completes, so a 1-rollout budget still scores every candidate once and is no longer weak (it beat the shallow Pirate 29/40 and the searchless baseline 40/40). The searchless baseline (the rollouts' quick policy alone, which never plays a card) lost 60/60, too weak to gate on. The shallow Pirate, which scores each move by the position right after it, is what a Pirate with broken rollouts becomes. Search speed: 5,523 rollouts per second; per own turn median 30 ms, 95th percentile 270 ms.

### Game-plan assertions, with and without the biases (review M5a-08)

40 Pirate-vs-Pirate games (Rocks vs Kaido, seats swapped, seeds 30,000–30,039). Finishing turns (the AI's search scores a win in at least half its samples, or it wins that turn) are not judged: with biases 77 of 252 Rocks turns and 17 of 236 Kaido turns; without, 59 of 251 and 17 of 238.

| Seed | With biases | Without biases | Threshold |
| --- | --- | --- | --- |
| Rocks 1 Leader attacks from T2 | 135/135 | 145/152 (95%) | 90% |
| Rocks 2 pays the reveal cost | 212/212 | 200/200 | 90% |
| Rocks 3 OP17-118 on the first 10-DON!! turn | 4/4 | 10/11 | 80% |
| Rocks 4 no Buckin while OP17-118 is in hand | 52/53 | 37/51 (73%) | 80% |
| Rocks 5 Stussy targets the highest power | 19/19 | 7/16 (44%) | 80% |
| Kaido 1 −2000 on a Character attacker when it changes the result | 37/45 (82%) | 29/31 (94%) | 80% |
| Kaido 2 each −2000 on their turn cuts the Counter needed | 92/105 (88%) | 31/67 (46%) | 80% |
| Kaido 3 a DON!!-adding Character by T3 | 39/40 | 37/40 | 80% |
| Kaido 4 Ulti & Page One after the Leader's −2000 | 3/6 | 1/11 | 80% |
| Kaido 5 a 9- or 10-cost Character by T5 | 22/23 | 16/18 | 60% |

**What this shows.** Search alone plays Rocks 1–3 and Kaido 1, 3 and 5 as the guides say. Rocks 4 and 5 and Kaido 2 and 4 hold only because a bias encodes the guide's line; Kaido 2 is close to true by construction when its bias applies (it rewards the −2000 exactly when the attack lands). Per push, the planted tests run both ways (`ai/test/game-plan.test.ts`): search alone passes 7 of the 10 seeds' planted positions plus the Leader-attack hold, and the two that need their bias (the −2000 hold, the Ulti set-up) are marked as such. The biases cost no strength: Pirate with biases beat Pirate without 22/40 (39.8%–69.3%).

### Heuristic A/B (review M5a-09)

Current Pirate against a Pirate with one weight set back to its M5a value:

| Variant | Seeds 60,000–60,039 | Seeds 70,000–70,099 | Together |
| --- | --- | --- | --- |
| `restedExposed` 0.35 (M5a's first value) | 15/40 | 60/100 | 75/140 (53.6%) |
| `lifeMine` as in M5a, 1 → 0 cheaper than 2 → 1 | 15/40 | 57/100 | 72/140 (51.4%) |

Neither difference is measurable at this size. The weights are kept for what they were changed for, not for strength: 0.15 because 0.35 ended a traced turn with attackers unused, and the new Life table because 0 Life must cost the most (strategy-concepts §3) and because at 2 Life a cheap Blocker must beat a hit (E12). Both are labelled as inference in `heuristic.ts`.

### Pacing (review M5a-12)

The per-push pacing check now uses iteration budgets, measures four AI turns (the late-game turn and the first three of a turn-1 game), and checks each turn on its own. It runs without CI's retry.

**After the fix round's added holds (2026-11-05).** The M5a-12 fixes added a 400 ms dwell after the AI's own effect picks and at the end of each DON!! group, as board.md §5.2 asks. That took the late-game turn (15 moves: two Queens with their draws, three DON!! groups, two attacks, King's activation, an Event with a reveal, Yamato, Mamaragan) from 6.8 s to **11.5 s**, and the "every turn within 8 s" check failed. The compression rule (§5.2) is now built: once the turn has spent 6 s of board time, non-attack dwells drop to 240 ms. Measured at 1× with iteration budgets, Chromium, production build:

| Start | AI turn | Moves | Worker wait | Uncompressed | Compressed |
| --- | --- | --- | --- | --- | --- |
| Late-game position | 8 | 15 | 50 ms | 11.5 s | **10.0 s** |
| Turn 1, seed 31 | 2 | 1 | 0 ms | 1.0 s | 1.0 s |
| Turn 1, seed 31 | 4 | 6 | 37 ms | 3.5 s | 3.5 s |
| Turn 1, seed 31 | 6 | 6 | 22 ms | 4.1 s | 4.1 s |

The check now follows §5.2, which promises 8 s for a *typical* turn and budgets heavy turns above it rather than cutting attack holds (principle 10). A typical turn (at most 6 moves, §5.2's 3 moves and 3 attacks) must fit in 8 s of board pacing; the late turn, a heavy one with a fixed line, must fit in 10.6 s, which the uncompressed code fails; the nightly whole game allows heavy turns up to §5.2's 12.3 s; and the wait on the worker stays within 1 s on every turn. The table above in "AI turn time at 1×" is the pre-fix-round measurement.

### Setup copy (review M5a-21, 2026-11-05)

The turn-time lines on the Setup screen are exported from `app/src/play/setup/Setup.tsx` and checked against this file by `app/test/carried.test.ts`; if the numbers here change, change the copy with them.

- Pirate: typically 1–8 s a turn at 1×, up to about 10 s for a long one. From the Pacing section above: ordinary turns 1.0–7.5 s (a typical turn, at most 6 moves, must fit 8 s), the 15-move late-game turn 10.0 s.
- Rookie: typically 1–8 s a turn at 1×, up to about 12 s for a long one. First measured 2026-11-05 (Chromium, production build, 1×, iteration budgets, the player ends each turn at once and takes every hit; `seed=31`, `seed=7` and `scenario=late`, 12 turns). Turns of 6 moves or fewer took 1.0–4.0 s; longer turns took 4.8–12.1 s (the longest, 17 moves, 12.1 s). Rookie plays more moves per turn than the Pirate because it has no plan, which is why its long turns run longer.

## M5b: Warlord and Emperor (2026-11-17)

### Strength (PLAN M5b exit), 200 games per pairing
`npm run test:strength:m5b`; `ai/test/strength-warlord.test.ts`. Iteration budgets (Warlord 4,000 per plan and 300 per defence, Emperor 10,000 and 500), twelve ordered deck pairs from six disjoint archetype pairs covering all twelve archetypes (Rocks/Kaido, Robin/Sabo, Luffy & Ace/Enel OP15, Luffy OP17/Hancock, Rosinante/Enel OP05, Kalgara/Luffy OP13), each seat in turn, fixed seeds, Wilson 95% intervals. These runs used the playbooks as merged in this branch (the 12 playbooks arrived by rebase after the runs started; the figures are re-measured nightly with all of them).

| Pairing | Wins | Rate | 95% interval | Gate |
| --- | --- | --- | --- | --- |
| Pirate vs Rookie | 200 / 200 | 100.0% | 98.1–100% | at least 75% |
| Warlord vs Rookie | 200 / 200 | 100.0% | 98.1–100% | at least 95% |
| Warlord vs Pirate | 133 / 200 | 66.5% | 59.7–72.7% | at least 65% |
| Warlord vs a one-iteration Warlord | 165 / 200 | 82.5% | 76.6–87.1% | at least 70% (M5a-10) |
| one-iteration Warlord vs Pirate | 55 / 200 | 27.5% | 21.8–34.1% | under 65% (M5a-10) |

- **Warlord vs Pirate clears 65% by a thin margin:** the lower end of the interval is 59.7%. Per deck pair (A's deck first, wins of 16 to 18 games): Rocks/Kaido 17 of 18, Kaido/Rocks 6 of 18; Robin/Sabo 13, Sabo/Robin 10; Luffy & Ace/Enel 15 of 16, Enel/Luffy & Ace 7 of 16; Luffy OP17/Hancock 10, Hancock/Luffy OP17 12; Rosinante/Enel OP05 9, Enel OP05/Rosinante 16 of 16; Kalgara/Luffy OP13 15, Luffy OP13/Kalgara 3 of 16. The deck matchups are lopsided (one deck beats the other from both seats), so the pairs dilute the tier gap.
- **Sensitivity.** In 96-game tuning runs on same-archetype pairs (two lists of one archetype, both orders, so no deck gap; `ai/bench/duel.ts`), Warlord beat Pirate 59% to 75% depending on settings (tuning runs, about ±9 points of noise, not gates). Rollouts that play Characters (`quickPlays`) gave 71.9% against 61.5% without at 1,500 iterations.
- **The one-iteration Warlord loses to Pirate (27.5%) and to the full Warlord (17.5% for it).** M5a's crippled Pirate still won 80% against Rookie; these two gates catch a search that is too small.
- **Emperor vs Warlord** (60 games at the 200-game budgets, before the gate was cut to 40 games): 30 of 60 (50.0%, 95% interval 37.7–62.3%). **Emperor's 2.5 times larger budget and iterative deepening gave no measurable gain**; Warlord at 1,500, 4,000 and 8,000 iterations also showed differences inside the noise in 96-game runs. The heuristic and the rollout policies limit strength, not the search budget. Emperor is "longer thinking", not measurably stronger; the work to make it so is in the next steps.
- Per-push smoke at the time of the first M5b merge (20 games): Pirate 20 of 20, Warlord 20 of 20 against Rookie, Warlord 13 of 20 against Pirate, Warlord 19 of 20 against the one-iteration Warlord, the one-iteration Warlord 4 of 20 against Pirate. **Since the M5b fix round** the per-push smoke is 12 games, one per ordered deck pair, Pirate and Warlord against Rookie only; Warlord against Pirate and the controls are nightly (DECISIONS 2026-11-17 "M5b fix round").

### Closing measurements (2026-11-23, time-box; DECISIONS 2026-11-23)
The gate's exact 200 games (seeds 130,000+) on a local 13-process runner, Warlord wins against Pirate; "fresh" is 200 games on seeds 530,000+.

| Variant | Gate seeds | Fresh seeds |
| --- | --- | --- |
| Shipped Warlord | 123 (61.5%) | 123 (61.5%) |
| Pirate vs Pirate (deck baseline) | 96 (48.0%) | |
| Leaf horizon 1 | 130 (65.0%) | |
| Horizon 1, 2× turn budget | 130 | |
| Horizon 1, choose by mean | 132 | |
| Horizon 1, no Character plays in rollouts | 134 | |
| Horizon 1, Pirate's defence | 134 | |
| Horizon 1, 3× defence budget | 122 | |
| Horizon 1, no rollout plays, Pirate's defence | 127 | 119 (59.5%) |
| No playbook bias in leaf values (partial) | 47/76 vs 45/76 | 52/82 vs 51/82 |
| 16 determinizations (partial) | 60/95 vs 58/95 | 56/92 vs 56/92 |

Nightly on CI (five runs, 2026-11-19 to 23): 123/200 each night. **The PLAN target (65%) is not met**; the nightly asserts a 55% regression floor. Every variant is within noise; strength does not move with budget.

### Search throughput and transpositions (review L-03)
`npx tsx ai/bench/profile.ts` (10 real Main positions, 3,000 iterations each, 8 determinizations): about 9,000 iterations per second under load (112 microseconds per iteration, Node). `summaryHash` costs 21 microseconds per state (19% of an iteration if every state were keyed by it) and 28% of expanded states repeat a state reached by another move order, so a transposition table would save about 3% net: **not built for MCTS**. The profile of the lethal search is different: with `RATE_NODES=40000 node --cpu-prof ai/bench/rate.ts`, `summaryHash` is **63% of the lethal search's CPU time** (25% in the JSON string, 24% building the summary, 7% hashing). A cheaper key there would raise lethal throughput by up to 2.5 times and so cut L-03's Unknown rate; it needs a key with the same discrimination (instance ids canonicalised), checked against `summaryHash` over random games. Carried, not done.

### Decision time against budgets (PROMPT.md: every tier within its budget plus 20%)
`ai/test/budget.test.ts` runs each tier on the app's millisecond budgets over real positions from two deck pairs (Rocks/Kaido, Purple Enel/Luffy OP13-001): the 95th percentile (the largest of a few samples) of the plan, of a first Main decision with no plan, and of a re-search (25% of the plan) is within 1.2 times the budget **plus the lethal check's cap** for Pirate (500 ms), Warlord (2,500 plus 150 ms) and Emperor (6,000 plus 300 ms), i.e. 3,180 ms and 7,560 ms for the searching tiers, which is 27% and 26% over the search budget alone (stated in the test header: the lethal cap is a second budget); every other decision is within 1.2 times the defence budget (250, 400 and 600 ms), and Rookie within 12 ms. The gates' iteration budgets are a lower bound of what the app searches: in ms mode Warlord's 2.5 s buys about 2,000 to 78,000 iterations (median about 31,000; review M5b-2, `ai/bench/rate.ts` on real positions) against the gates' 4,000, and Emperor's 6 s about 5,000 to 170,000 against 10,000.

### AI turn at 1× in the app (board.md §5.2)
`app/e2e/warlord.spec.ts` (Chromium, production build, the player ends each turn at once and takes every hit). On iteration budgets: Warlord turns of 2 to 7 moves took 2.1 to 4.1 s, the wait on the worker at most 0.22 s; Emperor 2.2 to 4.5 s, the wait at most 0.53 s.

**On the app's millisecond budgets, re-measured 2026-11-17 for review M5b-7 (11 Warlord turns, three games: `seed=31` first, `seed=77` second, `seed=5` Sabo against Purple Enel; 3 Emperor turns, `seed=31`).** Warlord whole-turn times in seconds by moves: 2 moves 5.3 and 3.5; 4 moves 6.2; 6 moves 6.1, 6.2 and 6.0; 7 moves 7.5 and 9.8; 8 moves 7.9; 9 moves 10.8; 11 moves 10.2. So a turn of 6 moves or fewer took 3.5 to 6.2 s, and turns of 7 to 11 moves took 7.5 to 10.8 s; the worker's wait was 1.8 to 4.1 s (plan plus each re-search). Median 6.2 s; 11 of 11 within 11 s, 6 of 6 typical turns within 8 s. Emperor: 10.3, 10.9 and 14.4 s (2, 6 and 7 moves), waits 7.0 to 9.2 s. **A 15-move Warlord turn was not produced:** the late-game scenario ends in one Warlord turn (0 turns recorded), and in three whole games the longest turn had 11 moves; the "long" figure is therefore the 9 to 11 move turns, 10.2 to 10.8 s. **board.md §5.2's 1.8 s of visible thinking for Warlord is not met** (it assumed the plan overlaps about 1.2 s of animation; the worker's wait is the plan plus each re-search, 25% of the plan, after an attack's result breaks it), but a typical Warlord turn fits 8 s. **Emperor exceeds the 8 s target by design**: it is the opt-in slow tier (DECISIONS 2026-11-17 "M5b fix round").

### Setup copy (M5b)
- Warlord: typically 4–8 s a turn at 1×, up to about 11 s for a long one. Measured above (11 turns, 2 to 11 moves, 3.5 to 10.8 s; 6 moves or fewer 3.5 to 6.2 s, 9 to 11 moves 10.2 to 10.8 s).
- Emperor: typically 10–15 s a turn at 1×, up to about 17 s for a long one. Measured above (3 turns, 10.3 to 14.4 s); the long-turn figure is an estimate (no long Emperor turn was produced).

## M10 baseline (2026-11-27, base commit c07fc7f6 plus the WP0 wiring)

The starting numbers for M10 (`docs/design/m10-plan.md`), taken by `npm run perf:lighthouse -- --runs 3 --mobile` and `PERF=1 npx playwright test app/e2e/perf-frames.spec.ts` (the scaffold smoke) on a production build (`npm run build`, served by `scripts/serve-dist.ts` with gzip and `cache-control: max-age=600`, the way GitHub Pages serves it).

**Machine and throttles.** Apple M4 Pro, 14 cores, 24 GB, macOS 27.2.1, Node 25.9.0, Lighthouse 13.6.0, Playwright 1.64.1, Chromium 156 (headless). Load average 4.7 (1 minute) at the start of the Lighthouse run, 2.1 at the start of the frame runs; nothing else of mine was running. Lighthouse: desktop form factor, 1350×940, simulated throttling (RTT 40 ms, 10 Mbit/s, CPU slowdown 4×), cold cache and cleared storage, 3 runs per route, median per metric. Frames: CPU slowdown 4× through CDP (`Emulation.setCPUThrottlingRate`), 60 Hz headless compositor on the Mac, 3 runs.

### Lighthouse, six routes (median of 3; performance min to max over the runs)

| Route | Performance | Accessibility | Best practices | LCP ms | FCP ms | TBT ms | CLS | Transfer KB |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | 100 (100 to 100) | 100 | 96 | 441 | 203 | 0 | 0 | 177 |
| `/cards` | 100 (100 to 100) | 100 | 96 | 545 | 203 | 0 | 0.016 | 201 |
| `/play?scenario=late&opp=pirate&speed=step` | 100 (100 to 100) | 100 | 96 | 684 | 204 | 0 | 0.044 | 302 |
| `/meta` | 100 (100 to 100) | 100 | 96 | 732 | 308 | 6 | 0.008 | 199 |
| `/learn` | 100 (100 to 100) | 100 | 96 | 625 | 203 | 0 | 0.026 | 247 |
| `/rules` | 100 (100 to 100) | 100 | 96 | 556 | 203 | 0 | 0.025 | 204 |

- **Which criteria already pass: Lighthouse performance 90 or more and accessibility 90 or more pass on all six routes with room to spare** (100 and 100; the nightly bound is 85 and 90). The run-to-run spread is nil in score and a few ms in the metrics, so the simulated throttle is stable on this machine.
- **Best practices 96, not 100, on every route**: the three links WP0 added to `index.html` (`favicon.svg`, `apple-touch-icon.png`, `manifest.webmanifest`) 404 until WP6 adds the files (a console error). Without those links the same build scored 100.
- **The boot line moves LCP, not FCP.** `index.html` now has "Loading OPTCG Sim…" in `#root`, so FCP is the boot line (about 203 ms) on every route and means "the HTML painted", not "the app painted". Before the line (the same build with the old `index.html`; 3 runs) LCP and FCP were both 203 ms on `/`, 202 on `/cards`, 203 on `/play`, best practices 100; with it LCP on those three routes is 441, 545 and 684 ms. WP1's before and after must therefore compare **LCP** (the page's real first content), not FCP. Both are inside any bound; the performance score stays 100.
- **Mobile profile** (Lighthouse's default, one run per route, information only, never asserted): performance 99 (`/`), 96 (`/cards`), 89 (`/play`), 94 (`/meta`), 92 (`/learn`), 95 (`/rules`); accessibility 100 everywhere; LCP 2.1 to 3.2 s; `/play` CLS 0.12 (the others 0.06 to 0.10, `/` 0).

### JavaScript, gzip

- **Initial JS: 84.3 KB in 2 files (index 81.2 KB, `jsx-runtime` 3.1 KB), against 83.5 KB in 1 file before WP0.** `check:bundle` counts it as 84.3 KB. The entry chunk itself is 2.3 KB smaller than before (the route table's fourteen copies of `Suspense` became one), but Rolldown now emits React's `jsx-runtime` wrapper as its own initial chunk, and a second gzip stream costs about 1 KB. Bisected: any change to `App.tsx` or `Footer.tsx` that adds JSX moves it (the same effect with only the new `Footer`, only the new `App.tsx`, and a plain `<a>`); reverting both gives one file again. It is a chunking heuristic, not code: WP2 owns `check:bundle` and the cap (100 KB) and can pin it (see the report to the lead).
- **Route sizes** (the route's chunk plus every chunk it imports statically that the initial bundle does not; workers excluded; by hand, WP2 builds the table into `check:bundle`): Cards 22.5, Meta 18.7, Matchups 31.2, Guide 29.0, Rules 24.7, Rule entry 22.5, About 0.3, Decks 71.7, Learn 67.7, Progress 72.9, Drills home 99.7, Settings 103.3, Lesson 137.5, Tutorial 178.7, Drill run 184.1, Drill start 185.5, Reviews 195.1, **Play 194.8** (Game 65 + engine 43 + ai 40 + review flow 13 + 33 of smaller chunks), Show me 198.4 KB. The card-data chunk is not in the Cards route's figure because it loads at runtime per set.

### Frames at 4× CPU slowdown: the AI's 13-move turn (smoke scenario)

`scenario=late&opp=pirate&speed=1&aibudget=iterations`, the player ends each turn at once and takes every hit; the window runs from the first turn to the end of the AI's first turn (turn 8: 13 moves, 9.39 s of board time at speed 1, 41 to 46 ms of worker thinking).

| Project, run | Frames | p50 | p95 | p99 | Max | Over 25 ms | Long tasks |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 720p, 1 | 643 | 16.7 | 16.8 | 16.8 | 33.3 | 0.3% | 0 |
| 720p, 2 | 643 | 16.7 | 16.7 | 16.8 | 33.4 | 0.3% | 0 |
| 720p, 3 | 643 | 16.7 | 16.8 | 16.8 | 33.4 | 0.5% | 0 |
| 1080p, 1 | 645 | 16.7 | 16.8 | 16.8 | 50 | 0.2% | 0 |

On this Mac every frame of the turn is on the 60 Hz tick at 4× (the requirement: p95 under 20 ms, p99 under 34 ms, at most 2% over 25 ms, no long task over 100 ms: all met with headroom). The smoke records one scenario only: the human turn, the review timeline scroll and the hand fan (WP3 scenarios b to d) are not measured yet. The CI runner's software compositor is slower than this Mac; the nightly number is the one that decides.

### Gap list for the lead

1. **No Lighthouse gap**: performance and accessibility are 100 on all six routes at the fixed throttle. WP2's Lighthouse work has no failing score to fix; its remaining value is the per-route size table, the 100 KB cap and the lethal-solver decision, and WP1's is the gate itself (the store is off the first paint's path either way, the measure is "time to a playable board with IndexedDB delayed 2 s", not a score).
2. **The one measurable regression is Best practices 96**, from three icon links whose files WP6 adds.
3. **Initial JS grew 0.8 KB** (84.3 against 83.5) through chunk splitting, not code; WP2 should pin `react/jsx-runtime` into the entry chunk or accept 84.3 as the new reference before it lowers the cap.
4. **The frame requirement is met by the AI-turn smoke at 4×;** the other three scenarios are unmeasured, so WP3 keeps its hours until they are.

## M10 WP1 (2026-11-27): first paint with the store off the critical path

Same machine, throttle and command as the M10 baseline (`npm run perf:lighthouse -- --runs 3 --routes home,cards,play`, Apple M4 Pro, Lighthouse 13.6.0, Chromium 156, simulated 4x CPU, 10 Mbit/s, 40 ms RTT; load average 4 to 7 at each start). Median of 3, run-to-run range under 1 ms in LCP and none in score. **Compare LCP, not FCP** (FCP is 203 ms in every row).

| Build | `/` LCP | `/cards` LCP | `/play` LCP | `/play` perf | `/play` transfer KB |
| --- | --- | --- | --- | --- | --- |
| Before (WP0: `await initStore()`, boot line) | 441 | 544 | 684 | 100 | 302 |
| WP1, boot line kept | 441 | 541 | 739 | 99 | 386 |
| **WP1, boot line removed (shipped)** | **203** | **203** | 742 | 99 | 386 |

- **The boot line costs LCP and buys nothing now**: with React rendering at once, removing it brings Home and Cards LCP from 441 and 541 ms to 203 ms (performance stays 100, accessibility 100). It is gone from `index.html`; the inline background stays.
- **Home and Cards no longer wait for the database.** Their first render is not behind `initStore` (the measurable effect needs a slow database: the e2e holds the open request and Home, Cards and the Play gate all paint; see `app/e2e/first-paint.spec.ts`). A fast IndexedDB shows no LCP change on Home or Cards beyond the boot-line effect above.
- **`/play` moved 684 to 742 ms and 302 to 386 KB** (performance 100 to 99). Not slower work: the page now paints its heading at once, so the two variable fonts (84 KB woff2, `Inter` 48 KB and `Fraunces` 37 KB) are requested and counted in the Lighthouse window where before the first paint came after them; the LCP element is the Setup heading after the lazy Play chunk, which now starts one store-open after render. WP2's font work is where this goes.
- **Time to a playable board at 4x CPU with IndexedDB released 2 s late** (`/play?scenario=late&opp=pirate&speed=step&start=1`, 720p, 3 runs): **2961, 2967, 2967 ms**: the 2 s wait plus about 0.96 s (Play chunk, setup, first decision). Target 3000 ms; asserted at 4500 ms in the perf workflow only (`PERF=1 PERF_ASSERT=1`).
- **Initial JS** 84.8 KB gzip in 2 files (84.3 at the baseline): `store/ready.ts` and the gate.

## M10 WP3: frames in four scenarios, and the AI's wait split (2026-11-27)

Taken on the production build (`npm run build`, `vite preview`, the Playwright webServer) with `PERF=1 npx playwright test app/e2e/perf-frames.spec.ts` (frames; scenarios a to d, `PERF_RATES=4,1` for the line, `PERF_RATES=8,12,16` for the sweep) and scenario e of the same file for the wait. **Machine:** Apple M4 Pro, macOS 27.2.1, Node 25.9.0, Playwright 1.64.1, Chromium 156 headless with the software compositor, 60 Hz tick. CPU slowdown through CDP `Emulation.setCPUThrottlingRate`. **Load average (1 minute) at the start of each run:** 4.5, 6.1 and 5.5 for the three frame runs (the 4x and 1x rows), 8.0 for the sweep (one run; the number is a headroom sketch, not a result), 2.4 to 7.3 for the wait runs. Nothing is asserted per push; the nightly asserts the bounds (`PERF_ASSERT=1`).

### Frames: median of 3 runs (range), both sizes

Scenarios: **ai-turn** is the AI's 13-move turn of `scenario=late` at speed 1; **human-turn** a keyboard turn (play Kyo, 2 DON!! on the Leader, attack, the AI's answer and its counter-attack answered); **review-scroll** the 300-decision game's timeline (40 wheel steps out and back) and twelve presses of N; **hand-fan** the pointer then the arrow keys along the hand, four passes. Requirement at 4x: p95 20 ms, p99 34 ms, at most 2% of frames over 25 ms, no long task over 100 ms; nightly bound 30, 50, 3%, 150. At 1x: p99 20 ms, bound 30.

| Scenario, size | Rate | p95 | p99 | Max | Over 25 ms | Long tasks |
| --- | --- | --- | --- | --- | --- | --- |
| ai-turn, 720p | 4x | 16.7 (16.7 to 16.75) | 16.8 | 50 (33.3 to 66.6) | 0.5% (0.2 to 0.6) | 0 |
| ai-turn, 1080p | 4x | 16.77 (16.7 to 16.8) | 16.8 | 50 (49.9 to 66.6) | 0.5% (0.3 to 0.6) | 0 |
| human-turn, 720p | 4x | 16.7 (16.7 to 16.78) | 16.8 | 33.4 (33.3 to 33.4) | 0.2% (0.1 to 0.3) | 0 |
| human-turn, 1080p | 4x | 16.8 (16.7 to 16.8) | 16.8 | 33.4 (33.3 to 33.4) | 0.5% (0.1 to 0.5) | 0 |
| review-scroll, 720p / 1080p | 4x | 16.7 / 16.8 | 16.8 | 16.8 | 0% | 0 |
| hand-fan, 720p / 1080p | 4x | 16.7 | 16.8 | 16.8 (to 33.3 at 1080p) | 0% (to 0.4%) | 0 |
| all four, both sizes | 1x | 16.7 to 16.8 | 16.8 | 16.8 (a single 33.3 to 33.4 frame in a few runs) | 0% to 0.6% | 0 |

**Verdict: every line is met at 4x and at 1x on both sizes, by a wide margin** (p95 16.8 against 20, p99 16.8 against 34, over-25 at most 0.6% against 2%, no long task). The Mac draws every frame on the tick except a few single dropped frames (the "max" column). The CI runner's software compositor is slower; the nightly number is the one that decides, and the owner's `npm run perf:frames -- --headed` is the GPU reference. Traces (`test-results/trace-<scenario>-<project>-<rate>x.json`, 12 to 45 MB each) are workflow artifacts, not committed.

**Headroom, one run each at 720p** (load 8.0): the human turn is the first to lose frames: 8x p99 33.3 ms, 2.9% over 25 ms, 5 long tasks (longest 78 ms); 12x p95 33.3, p99 50.1, 6.0%, 14 long tasks (108 ms); 16x p95 33.4, p99 83.4, 8.7%, 30 long tasks (130 ms). The AI turn: 8x p99 33.3, 2.4%, 2 long tasks; 12x p99 66.7, 4.3%, 8; 16x p95 33.4, 8.2%, 18 (157 ms). The review scroll holds p99 16.8 ms to 12x (16x: 0.8% over 25, one long task of 55 ms); the hand fan likewise (16x: p99 33.3, 1.8%). So the requirement has about twice the headroom. In the 12x trace of the human turn the main thread spends its time in React renders run from the controller's timers (146 timer fires, 1.7 s of the window), layout (556 ms), paint (555 ms) and layerize (535 ms) under a software renderer. No defect is named, so nothing was changed (DECISIONS 2026-11-27 "M10 WP3").

### The wait on the worker, split (Warlord, ms budgets, `seed=31&first=me&speed=1`, four AI turns at 1x, three runs each)

Every request carries the parts: **transfer** (the message there and back), **queue** (the worker reads no message while it runs a search, so a request sent during the plan waits for it, plus the card scripts), **setup** (the session built on first use) and **search**. A turn's `thinkMs` is apportioned over the parts of the requests it waited on. Turn: moves, total ms, wait (`thinkMs`) and its parts (transfer / queue / setup / search), medians of the three runs; the three runs agree within 10 ms because a search runs until its budget is spent.

| AI turn | Moves | Whole turn | Wait | Transfer | Queue | Setup | Search |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2 | 2 | 5,302 | 3,238 | 1 | 1,807 | 0 | 1,430 |
| 4 | 6 | 6,555 | 2,268 | 12 | 1,862 | 0 | 395 |
| 6 | 6 | 9,195 | 4,255 | 1 | 1,948 | 0 | 2,305 |
| 8 | 7 | 7,089 | 2,841 | 21 | 1,949 | 0 | 871 |

- **Setup plus transfer is 1 to 22 ms of a 2.3 to 4.3 s wait; there is nothing to fix there.** The queue is the turn plan: 2,500 ms of budget (ADR 0008) less the 700 ms of turn-start animation that hides part of it, 1.8 to 1.95 s. The search part is decision searches the animation did not hide (400 ms each, 400 to 715 ms in the requests), 0.4 to 2.3 s a turn.
- **The warm-up changes nothing measurable.** The session builds in 0 to 0.1 ms; the first plan ran 160,452, 162,074 and 154,818 rollouts cold and 160,640, 163,158 and 159,011 warm (Setup open for 4 s before Start). The wait is the same to within 10 ms.
- **Against board.md §5.2's 1.8 s target:** met by the plan's remainder alone (1.8 to 1.95 s), missed by the turn as a whole (2.3 to 4.3 s) when decision searches are also waited on. The nightly bound (2,700 ms) is the product figure times 1.5 and stays.
