# API gaps: OP-11 independent tests, group B

None of these stopped a test from being written. Each says what the public API leaves open and how the tests cope.

1. **"Look at 1 card from the top of your opponent's deck" (OP11-062, OP11-070).** No prompt is asked and the card is not exposed to the test (the only trace is the `CardsLooked` event with `owner` and `count`). Tests assert the event, the opponent deck's size and order, and the cost paid.
2. **"Return ... or place ... at the bottom" (OP11-050) is a `choose` with purpose `mode`** whose options are labelled `Return up to 1 Character ...` and `Place up to 1 Character ...`. The test picks the option by a regex on the label (`/hand/i`, `/bottom/i`); the ids (`0`, `1`) are not stable API.
3. **"Top or bottom ... in any order" (OP11-040, OP11-049).** A `choose` (mode `top`/`bottom` for the whole group), then one `order` decision per card; the last card is forced and not asked (N cards ask N-1 orders). Tests answer `order` with `{ first }` for all but the last.
4. **[Activate: Main] "You may trash 1 card" costs (OP11-044) and "You may rest this Character" (OP11-070)** ask no `optional`: the activation is the consent and the cost pick follows at once. The helper accepts a "use" question if one is asked.
5. **A sole candidate is still asked** (OP11-039, OP11-065 K.O. source): the pick over one Character is asked, not resolved by the engine. Where only the Leader qualifies (OP11-038 Counter), the pick may be skipped; `chooseIfAsked` copes.
6. **The count of DON!! added (OP11-067, OP11-069)** is a `choose` with purpose `mode` and options `1` / `0`; tests use `takeDon` / `donCountOptions` (kit-op16b). With an empty DON!! deck the question may be skipped; the tests accept both.
7. **OP11-040's start-of-turn effect asks no `optional`;** the first prompt is the candidate pick (up to 1, skippable).
8. **The effect source of a K.O. by an opposing effect** has to be a scripted card: OP15-100 Kamakiri (cost-6 K.O.) is used for OP11-051.
