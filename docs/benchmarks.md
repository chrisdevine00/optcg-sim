# Engine benchmarks

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
