# API gaps: OP-10 independent tests, group D

None of these stopped a test from being written. Each says what the public API leaves open and how
the tests cope.

1. **"You may <cost>:" on [Activate: Main] and on [Trigger] asks no yes/no.** For OP10-021 (Punk Hazard
   Stage) and OP10-113 (Zoro's [Trigger]) the engine goes straight to the cost pick after the activation:
   activating is choosing to pay. For [On Play] and [When Attacking] (OP10-112, OP10-118) the `optional`
   (`use`) is asked first. The tests answer exactly the prompt each card shows and assert that no extra
   `optional` appears where none is expected.
2. **Exact-N cost picks list only a canonical prefix.** OP10-118's "place 3 cards from your trash" offers
   two of four cards in the first pick (only the earliest candidates can start a canonical selection), so
   the tests pick by card id with `payHand`/`pickByCardIds` rather than by instance. With exactly 3 cards
   in the trash nothing is asked (the pick is forced) and the game goes to the `order` decisions.
3. **An Event's [Counter] with all active DON!! of one state asks no DON!! pick.** The tests set the active
   DON!! to exactly the cost where a pick would otherwise be asked.
4. **"Trash up to 1 card from the top of your opponent's Life" (OP10-112) is an `optional` ("trash the top
   card?")**, not a `choose`. The tests answer it with `yes`/`no`.
5. **A "DON!! cards on your field" count (OP10-080)** is read through `don(g, player)`: active + rested +
   given. Given DON!! is placed with `{ card, don: n }` on a Character.
6. **Keywords, negation and "cannot be K.O.'d"** are observed through `CardView.keywords`, the zone
   contents after the effect, and the cost-reduction view (`cost`), not through any negation flag. OP10-098's
   [Trigger] is observed by [Blocker] on the opposing Leader (OP05-022) and [Rush] on an opposing Character
   (ST21-014) disappearing.
7. **No way to read a Life card's face state from `CardView` in a test without the Life zone view.** OP10-119's
   "face-down" is asserted by zone order (`lifeCards(g)[0]`) and the `CardMoved` event (`faceUp: false`).
