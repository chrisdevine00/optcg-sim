# ADR 0005: Hidden information is enforced by projection; the AI determinizes from an archetype prior

**Status:** Accepted, 2026-10-28 (revised after plan review 1)

## Context
PROMPT.md requires that the AI never cheats and that hidden information is enforced by projection, not convention. The engineering review showed three ways the first draft could still leak or cheat:
- instance IDs that track a card through a shuffle;
- the position of a card in the opponent's hand;
- determinization that sampled from the human's exact decklist.

## Decision
- Views use opaque per-view handles. Hidden zones are re-keyed on every shuffle and on every move into them.
- The opponent's hand appears in canonical order.
- Resolution-stack locals are redacted.
- Knowledge is tracked per zone and cleared when that zone is shuffled.
- A property test asserts that states differing only by a permutation of hidden cards project identically.
- The AI receives only views. It determinizes the opponent's unknown cards from an **archetype prior** (the sourced lists for that leader), never from the human's actual list. It also determinizes its **own** hidden deck order and Life.
- Review analysis may use full information. Each finding is labelled `any-hand`, `needed-hidden-info` or `search-incomplete`.

## Alternatives rejected
- An "honest AI" convention: unverifiable.
- Perfect-information search: it cheats, and it teaches wrong lessons in review.
- Sampling from the human's own decklist: also cheating.

## Consequences
Against an off-meta list, the AI's guesses about the opponent's hand are worse. That is realistic.
