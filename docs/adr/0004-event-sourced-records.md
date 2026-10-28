# ADR 0004: Games are records of actions; rewind and review replay them

**Status:** Proposed, 2026-10-28

## Context
Rewind, replay, Game Review, "restore this moment", drills drawn from real games, and bug reports all need any past state.

## Decision
A game is `GameRecord = { engineVersion, cardsVersion, seed, setup, actions[] }`. State at step n is `replay(record, n)`. The app keeps a checkpoint (full state) every 20 actions so rewind is fast. `hashState` gives a stable hash; golden records with expected hashes guard against accidental rules changes. Records are what we store locally and export.

## Alternatives rejected
Storing state snapshots per action (large, and hides nondeterminism bugs); undo stacks of inverse operations (error-prone with effects).

## Consequences
The engine must be fully deterministic (enforced by lint and the replay property test). An engine or card-data change can invalidate old records, so records carry versions, and the app replays an old record with a warning rather than silently.
