# M4b group A: API notes from writing the independent card tests

None of these stopped a test from being written. They are places where a test asserts on outcomes or
needs a workaround.

1. **Candidate sets of a multi-pick `choose` are not visible from the first offer.** Unordered picks must
   come in canonical order (ARCHITECTURE section 2.3), so the first offer leaves out candidates that cannot
   start a valid sequence (for example the last card when exactly 2 must be picked). Tests that need the
   candidate set ("reveal 2 cards with a [Trigger]", OP17-111; "up to a total of 2", OP15-101) read
   `reachablePickSets`. A `Decision.candidates` list would make this direct.
2. **Vacuous decisions.** "Your opponent trashes 1 card from their hand" with an empty hand asks p2 a
   `choose` with `min = max = 0` whose only legal answer is `done` (OP17-106). `finishEmpty` in `kit-a.ts`
   answers it. The engine could skip it like other forced picks.
3. **[Trigger] activation vs a "you may" cost.** For a [Trigger] with a cost (OP05-115), activating is the
   choice: no `optional` follows, and `activate: true` is simply not legal when the cost cannot be paid.
   Tests assert on `legalActions` there, not on an `optional` decision.
4. **Unscripted scenery.** `OP01-104 Speed` ("[Trigger] Play this card.") cannot have its [Trigger]
   activated (`activate: true` is not legal), so it works as a "card with a [Trigger]" for hand costs
   (text-based) but not as a Life card whose Trigger fires. Tests that need a firing [Trigger] use
   `OP17-107 Charlotte Daifuku`.
5. **View handles vs instance ids.** As in M4a, tests read `legalActions` (instance ids), not
   `PlayerView.actions` (handles).
