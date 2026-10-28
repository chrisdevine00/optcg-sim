# ADR 0008: Warlord uses determinized MCTS with heuristic cut-off; fallback is turn-scoped expectimax

**Status:** Proposed, 2026-10-28 (to be confirmed by the M2 throughput benchmark)

## Context
Warlord must beat Rookie 95% and Pirate 65% within 1.5 s per decision in a browser worker, with hidden hands and decks. Turns are long sequences of small decisions (play, give DON!!, attack), and the opponent makes decisions inside the turn (Blocker, Counter).

## Decision
Information-set MCTS: per iteration, sample a determinization consistent with the view (ADR 0005), descend with UCT using the archetype playbook as a prior for move ordering, and stop a rollout at the end of the current turn plus the opponent's next turn, scoring with the heuristic from `strategy-concepts.md` (board power, DON!! efficiency, life differential and thresholds, hand and counter density, tempo). Iterative deepening fills the budget; Emperor is the same with 5 s. Lethal is checked exactly before search and short-circuits it.

## Alternatives rejected
Full-game random rollouts (too slow and too noisy for this game); perfect-information alpha-beta (cheats); learned policies (no training data or server; revisit in the backlog).

## Consequences
Throughput of `reduce` and `derive` is a first-class engine requirement (PLAN risk 3). If the M2 benchmark shows fewer than 2,000 simulations per second, Warlord falls back to expectimax over the current turn's action sequences with sampled opponent responses, and this ADR is updated.
