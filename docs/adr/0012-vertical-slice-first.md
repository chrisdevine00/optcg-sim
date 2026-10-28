# ADR 0012: Build a vertical slice of two archetypes before breadth

**Status:** Accepted, 2026-10-28

## Context
PROMPT.md lists milestones M0–M10 in order. Both Phase 2 reviewers found that a strictly horizontal build would hurt the product in four ways:
- The learning layer, "the reason the product exists", would start about 70% of the way through the budget.
- The time-box rule would cut the learning layer first.
- AI throughput on real scripted cards would be unknown until late.
- The owner could not play a real game against an AI until most of the budget was spent.

## Decision
Every PROMPT.md milestone and its done criteria are kept, but the work runs in two passes:
- **Slice pass:** M0, M1, M2, M3 (including play vs Rookie), M4a (DSL plus the Rocks and Kaido archetypes), M5a (Pirate, explanations), and the learning slice L (battle panel, tiered lethal detector, missed-lethal review flag, "Practice this"). It ends with an owner usability session.
- **Breadth pass:** M4b (the other 10 archetypes), M5b (Warlord, Emperor, all playbooks), then M6–M10.

Rocks (blue, the top legal deck) and Kaido (purple, DON!! minus) were chosen for the slice because together they exercise searching by type, DON!! −X, opponent-turn leader effects and power reduction.

## Alternatives rejected
- **The strict M0–M10 order:** it fails the reasons above.
- **The learning layer before any AI:** it would have nothing real to explain.

## Consequences
- M4 and M5 are split in two, and STATUS.md reports them as M4a/M4b and M5a/M5b.
- The 10,000-game property test and the full strength matrix reach their final form in the breadth pass.
