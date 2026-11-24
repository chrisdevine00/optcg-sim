# Bottom-of-deck order from a hand or trash (OP16-R3, B-1; engine 0.5.8)

## What changed

`engine/src/effects/run.ts`: several cards of one player placed at the bottom of their deck by an effect `move` from a hand or trash, or by a `move` cost from a hand or trash (OP17-095's replacement), now ask the owner for the order. This reuses the `order` decision of the field case (OP06-058, DECISIONS 2026-11-16): the owner is asked whoever chose the cards, one answer per card until one is left, "first = ends up above the rest".

- No DSL flag. The field case never needed one (it asks whenever more than one card of one owner goes to a deck bottom), so the hand and trash case asks on the same rule. A script that places several cards at the bottom is, by the rules (CR 3-1-7, 3-1-8), the owner's order.
- Shared helpers `bottomOrder` (the ask) and `placeHandTrash` (the move). The cards move in fixed (id) order, each slotted above those owed below it (`MoveOptions.above`), so the event stream is identical for every answer.
- Hidden information: a hand card going into a deck is no longer marked `revealed`. Before, `revealed: true` named the card in the other player's projected events. Trash cards are public, so nothing there changed. The pending `order` decision (names of the hand cards) is shown to its decider only.
- One card, or cards of both players (one each): no order, as before.

## Scripts affected

OP16-047 (opponent's 2 from hand), OP17-053 (opponent's 2 from hand), OP17-095 (own 3 from trash, a cost). Searched `cards/effects` for every `position: 'bottom'` move or cost from a hand or trash: OP17-047 and OP17-041 place one card or Characters (field case), EB05-027 and OP17-046 are field moves. Unscripted cards (OP-03 CP cards, OP05-093, etc.) will take this path when they are scripted.

## Tests

- `engine/test/cards/m6b-order/bottom-order.test.ts` (5): the owner is asked (p2 for OP16-047), both answers place the cards in that order, p1's projected events and view are identical for both answers and never name the hand cards, three cards from a trash need two answers, p2's events are identical whatever the order.
- `ai/test/bottom-order.test.ts` (3): Rookie, Pirate and Warlord as the owner pick the cards, answer the `order` decision, no fallback.
- Author tests updated to answer the order: OP16-047, OP17-053, OP17-095, `m4b/costs`; independent OP16-047 (the `it.fails` is now `it`) and OP17-053.
- R7: OP16-081 boundary (a cost 7 Character leaves no target prompt; the old cost 7 test only checked power, which a pending prompt also leaves unchanged) and OP16-104 (the selected Character carries a power modifier, so `power` and `basePower` differ).

## Revert checks

- Engine change reverted (`git checkout engine/src/effects/run.ts`): all 5 planted tests and the 4 independent OP16-047 tests fail.
- `revealed: true` restored for hand to deck: the "p1 cannot learn the order or the cards" test fails.
- OP16-081 `gte: 8` to `gte: 7`: the two cost-boundary tests fail (the earlier suites passed). Restored.
- OP16-104 `stat: 'power'` to `'basePower'`: the new modifier test fails. Restored.

## Version

ENGINE_VERSION 0.5.7 to 0.5.8. The three goldens replay to the same hashes; they were re-recorded only for the version.
