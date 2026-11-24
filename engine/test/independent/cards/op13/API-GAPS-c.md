# API gaps: OP-13 independent tests, group C

None of these stopped a test from being written. Each says what the public API leaves open and how the tests cope.

1. **A forced cost pick is not asked.** When exactly one card can pay an exact-N cost (OP13-059 return 1 Character, OP13-081 place 1 trash card, OP13-082 trash 1 hand card, OP13-069 DON!! −1 with one DON!! class), the engine decides it (ARCHITECTURE §2.3 auto-skip). Tests ask for the pick only when two or more candidates exist and otherwise assert the outcome.
2. **`choose` in kit.ts sends `done` below the maximum.** A multi-pick ("play up to 5", OP13-082) must be passed as one `pickInst(g, [a, b])` call, not as consecutive calls, or the first call ends the pick.
3. **An empty "up to" pick is skipped for a public empty zone and asked for the hand.** OP13-074 Hera asks the "play up to 1" pick even with an empty hand (max 0, no candidates); a target pick with no legal Character on the board (OP13-059 after the cost) is not asked. Tests accept an empty pick where the zone is hidden or the engine may skip it.
4. **Damage always ends in a `trigger` decision.** After a hit the defender owes the "add the Life card to your hand" decision even with no [Trigger]. Counter tests finish the battle with `passCounter` (which takes the damage), not with a bare `endCounter`.
5. **End-of-turn DON!! adds.** OP13-066's count question is asked as p1 owes it while p1's turn ends (`endMyTurn` in kit-op13c.ts answers it with the most). The public API does not show a pending delayed add during the turn.
6. **Protected Characters.** "Cannot be removed from the field by your opponent's effects" (OP13-080, OP13-083) is observable only by the outcome: the target pick may offer the Character or not. `tryKo` / `tryBounce` pick it when offered and end the pick otherwise.
7. **Scenario DON!! caps.** Given DON!! plus cost-area DON!! must be at most 10, so tests that need an empty DON!! deck use `costArea.active` of 10 minus the DON!! given.
8. **Opponent's DON!! give no power on my turn.** A DON!! given to the opponent's Character adds +1000 only during the opponent's turn, so OP13-062's "base power" test shows the Character is offered with DON!! given rather than comparing powers.
