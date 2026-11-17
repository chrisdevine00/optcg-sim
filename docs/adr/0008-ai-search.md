# ADR 0008: The AI plans per turn with determinized MCTS; budgets are iterations in CI and wall-clock in the app

**Status:** Accepted, 2026-10-28 (revised after plan review 1). Confirmed 2026-10-29 by the M4a benchmark on the scripted Rocks and Kaido decks: a median of 5,588 two-turn simulations per second in a worker (target 1,000), so the fallback is not triggered (`docs/benchmarks.md`).

## Context
- **Strength targets:** Warlord must beat Rookie 95% of the time and Pirate 65%.
- **Hidden information:** hands and decks are unseen.
- **Long turns:** a single turn is 20–40 small decisions.
- **Waiting time:** both reviews showed that 1.5 s per decision means a 30–60 s AI turn.
- **Reproducibility:** wall-clock budgets make seeded test games machine-dependent.
- **CI cost:** 200 games per pairing at 1.5 s per decision would take hours.

## Decision
- **Planning.** Information-set MCTS over turn plans:
  - determinizations come from the archetype prior (ADR 0005);
  - the playbook is a prior on move order;
  - progressive widening over DON!! allocation;
  - the heuristic evaluates the position at the end of the opponent's next turn.
- **Per-turn budget.** About 2.5 s for Warlord and 6 s for Emperor, spent at the start of the AI's Main Phase. Re-search happens only when the plan breaks (a counter, trigger, block or reveal).
- **Defence and forced moves.** Defensive decisions get 0.4 s. Forced moves cost nothing.
- **Tree reuse.** The tree is kept between decisions within a turn.
- **Overlap.** The worker searches while animations play.
- **Lethal first.** The lethal check (proven / refuted / unknown) runs before search and short-circuits it.
- **CI budgets.** Tests use iteration budgets and run strength matches sequentially with fixed deck pairs and swapped seats.
- **Timing.** The full 200-game matches run nightly; a 20-game smoke runs on every push.

## Alternatives rejected
- **Per-decision wall-clock search:** the turns are too slow.
- **Full-game random rollouts:** too slow and too noisy.
- **Perfect-information alpha-beta:** it cheats.
- **Learned policies:** there is no training data and no server.

## Consequences
- **Throughput comes first.** `reduce` and `derive` speed is a first-class engine requirement. `derive` is incremental.
- **Benchmark gate.** The benchmark runs on the M4a scripted decks. If it finds fewer than 1,000 two-turn simulations per second in a worker, Warlord falls back to expectimax over the current turn's lines with sampled opponent responses, and this ADR is updated.

## Addendum, 2026-11-17 (M5b: as built)
- Built per this ADR in `ai/src/search/mcts.ts` and `warlord.ts`; the expectimax fallback was not needed. Details are in ARCHITECTURE §4.2 and DECISIONS 2026-11-17 "M5b Warlord and Emperor".
- **Budgets.** One search at the start of Main (the worker does it during the turn-start animations), then no search while the plan holds; a re-search is 25% of the plan (it was 40% when the 200-game runs were made; lowered for pacing). Defence is a flat search. CI iteration budgets: Warlord 4,000 per plan and 300 per defence; Emperor 10,000 and 500. **These are fixed counts so a run is reproducible (PLAN M5b), not "2.5 s" and "6 s":** in the app's millisecond mode the same time buys about 2,000 to 78,000 iterations for Warlord (median about 31,000) and 5,000 to 170,000 for Emperor (review M5b-2, measured on real positions), so the gates measure a lower bound of the shipped Warlord, and the Emperor gate result describes the CI proxy, not the shipped Emperor.
- **PROMPT's tier table is out of date, not this ADR.** PROMPT.md "Tiers" lists budgets per decision of 10, 100, 1,500 and 5,000 ms (Rookie, Pirate, Warlord, Emperor). This ADR (accepted earlier, revised after plan review 1) replaced per-decision budgets with per-turn plans: Pirate 500 ms for the plan and 250 ms for other decisions, Warlord 2,500 and 400, Emperor 6,000 and 600, Rookie 10 ms. PROMPT.md is not edited (the owner's file); `ai/test/budget.test.ts` checks each tier within its budget plus 20%, the PROMPT's own rule (DECISIONS 2026-11-17 "M5b fix round").
- **Emperor is the opt-in slow tier.** Its typical turn (10 to 15 s) exceeds the 8 s turn target by design; it is offered as "more thinking time", not as a measured stronger player.
- **Deviation.** Emperor's iterative deepening caps the tree's depth in four stages of one budget (depth 3, 6, 12, then all), not a re-search from scratch at each depth: the statistics carry over, so the stages are a prefix of the same search.
