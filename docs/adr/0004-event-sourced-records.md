# ADR 0004: Games are versioned records of actions with per-turn snapshots

**Status:** Accepted, 2026-10-28 (revised after plan review 1)

## Context
Rewind, replay, Game Review, "restore this moment", drills drawn from real games, and bug reports all need any past state. The engineering review pointed out that scripting a new card adds decisions, so old records would drift or throw, and that a raw state hash breaks on every refactor.

## Decision
- `GameRecord = { versions: { engine, cards, scripts }, start: { setup } | { scenario }, actions[], snapshots[] }`.
- Actions name instance IDs and option kinds, not list indexes.
- A record whose versions match replays live. One whose versions differ opens read-only from its per-turn snapshots, with an explanation.
- `summaryHash` hashes a canonical game summary, so internal refactors do not change it.
- The app keeps a checkpoint every 20 actions for fast rewind. Rewind steps by player-level move (`intentId`).
- Golden records are re-recorded deliberately when versions change.

## Alternatives rejected
- Snapshots per action: large, and they hide nondeterminism bugs.
- Inverse-operation undo: error-prone once effects are involved.
- Replaying old records "with a warning": they silently desync.

## Consequences
The engine must be fully deterministic, which lint and the replay property test enforce. Old reviews stay viewable, but not replayable, after an engine or card change.
