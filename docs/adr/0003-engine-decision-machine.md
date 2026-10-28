# ADR 0003: The engine is a decision state machine with a serializable resolution stack

**Status:** Accepted, 2026-10-28 (amended after plan review 1)

## Context
OPTCG effects pause for choices mid-resolution (targets, "you may", ordering, Trigger reveals), and the opponent acts inside the active player's turn (Blocker, Counter). The engine must be pure, replayable from `{ seed, actions }`, transferable to a Web Worker, and searchable by the AI.

## Decision
At every moment exactly one player owes a typed decision (`state.decision`). `reduce(state, action)` applies one decision and runs the game forward until the next decision. Effect resolution is an interpreter over data with an explicit stack of frames stored in state; a choice suspends the frame, and the next action resumes it. State is plain JSON: no closures, classes or Maps. Multi-card choices are made one pick at a time (`pick`, then `done`) so the action space stays small for search and keyboard play. A pick is offered only if the choice can still be completed (lookahead over counts, cost limits and payability), and picks for unordered sets go in canonical order so search never duplicates branches. Actions carry an `intentId` that groups them into player-level moves. `legalActions` runs on full state; the projected view embeds the decider's actions. `whyNot` and `preview` are part of the API so the UI never computes rules.

## Alternatives rejected
Generator- or callback-based effects (cannot be serialized, hashed, or cloned cheaply for search); an effect "prompt" side channel outside `reduce` (breaks replay); enumerating all target combinations as single actions (combinatorial blow-up for "choose up to 3").

## Consequences
Every UI interaction, tutorial step, coach hint and AI move is an `Action` from `legalActions`. The interpreter is more work up front than ad-hoc effect functions, but it is the only design where rewind, replay, review and AI search are all trivial.
