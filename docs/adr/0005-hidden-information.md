# ADR 0005: Hidden information is enforced by projection; the AI determinizes

**Status:** Proposed, 2026-10-28

## Context
PROMPT.md requires that the AI never cheats and that hidden information is enforced by projection, not convention.

## Decision
`project(state, player)` produces a `PlayerView` that replaces hidden cards (opponent hand, both decks, face-down Life) with placeholders, and tracks cards revealed to that player per CR 3-x and 11-x. The AI worker receives only views. Search determinizes: it samples the unseen cards from the known remaining pool (decklist minus seen cards) to build full states, and searches those. A property test fuzzes views for leaked card IDs.

## Alternatives rejected
Passing full state with an "honest AI" convention (unverifiable); perfect-information search (cheats, and teaches wrong lessons in review).

## Consequences
Analysis mode for Game Review may use full information, because the replay knows everything; the review explains when a better line depended on information the player could not have had.
