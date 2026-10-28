# ADR 0013: Replacement hooks, last-known information, and scenario starts are engine primitives

**Status:** Accepted, 2026-10-28

## Context
The engineering review found three gaps in the first architecture:
- **Replacement effects.** The model could not express them (CR 8-1-3-4). A top-12 leader, OP12-061 Rosinante, depends on one.
- **Old-card references.** It could not handle effects that refer to a card after the new-object rule gave it a new ID (CR 3-1-6, 10-2-17-2).
- **Arbitrary starting positions.** It could only start games from a seed. The tutorial, drills, puzzles, the "show me" button, card tests and independent rule tests all need a described position instead.

## Decision
- **Atomic operations.** Every one goes through a single choke point that collects the applicable replacements and orders them per CR 8-1-3-4-2. A "may" replacement becomes an `optional` decision that can suspend mid-operation. Each replacement applies to an event at most once.
- **Renames and snapshots.**
  - A card leaving the field gets a new ID, and a `renames` entry maps the old ID to the new one.
  - Its departure event carries a last-known-information snapshot: power, cost, types, given DON!! and cause.
- **Scenario starts.** `createFromScenario(spec)` builds a validated position, and a record may start from a scenario.

## Alternatives rejected
- **Ad-hoc replacement checks inside each rule:** they are easy to miss and impossible to order correctly.
- **Keeping the instance ID across zones:** that breaks the new-object rule.
- **Building scenarios by replaying scripted actions:** that is brittle, and it cannot reach many positions.

## Consequences
M2 grows to about 70 hours. The fixture API built on scenarios is frozen at the start of M2 so that independent test authors can write against it.
