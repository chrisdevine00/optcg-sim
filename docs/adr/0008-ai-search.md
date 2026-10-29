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
