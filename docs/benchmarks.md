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

The per-push pacing check now uses iteration budgets, measures four AI turns (the late-game turn and the first three of a turn-1 game), and checks each turn on its own: the whole turn within 8 s, the board's own pacing within 8 s, and the time waiting on the worker within 1 s. It runs without CI's retry.
