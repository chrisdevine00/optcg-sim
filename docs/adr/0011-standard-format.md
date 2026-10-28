# ADR 0011: v1 supports the English Standard Regulation only

**Status:** Accepted, 2026-10-28

## Context
Bandai's Block Number System has applied to the English game since 2026-04-01: blocks 2 to 5 are legal until 2027-03-31, with exception lists, a banned list and banned pairs (`docs/research/meta-landscape.md`).

## Decision
The deck validator and Meta Explorer target Standard Regulation. Block numbers, exceptions, bans and pairs with effective dates live in `cards/format/standard.json`, so the April 2027 rotation (blocks 3 to 6) and new ban lists are data changes. The copy limit groups by card number across alternate arts (CR 5-1-2-3). Extra Regulation and the Japanese format are backlog items.

## Alternatives rejected
No format enforcement (lets the player practise with decks they cannot bring to an event).

## Consequences
`cards:update` must capture block numbers, or `standard.json` must supply them; Track B reports which.
