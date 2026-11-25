# API gaps: OP-09 independent tests, group D

None of these stopped a test from being written. Each says what the public API leaves open and how the
tests cope.

1. **Negation is visible only through its consequences.** There is no "negated" flag on `CardView`.
   OP09-097 / OP09-098 observe it through `CardView.keywords` (a negated [Double Attack] or [Blocker]
   disappears) and, for OP09-098, through the Block Step offering no blocker.
2. **Multi-card picks list only the cards that can start a canonical selection.** The first pick of
   "place 2 cards from your hand" (OP09-060) offers 2 of 3 candidates; the tests read the reachable pairs
   with `reachablePickSets` instead of the first pick's candidate list.
3. **A single-candidate choice may be taken by the engine.** OP09-058 ("your opponent chooses 1 ...")
   with one candidate, and OP09-114 / OP09-040 with an empty public candidate set, may skip the prompt;
   those tests accept both an empty prompt and no prompt (public zones only).
4. **Activated abilities with a "you may ... cost" ask no separate `optional`.** For OP09-060 / OP09-099
   (Stages) the activation itself is the choice to pay; the cost `choose` follows at once. With a hand
   that cannot pay, the tests accept either "not offered" or "offered, then unpayable".
5. **The Life total at [Trigger] time.** OP09-112 / OP09-114 count the Life cards after the damaged card
   has left the Life area (the card is being resolved). The boundary tests (total exactly 5 vs 6) follow
   that reading; the clear-cut cases (total far below or above 5) do not depend on it.
6. **"Then" after an empty "up to" pick is not asserted.** OP09-019 ("give up to 1 ... Then, if ... draw")
   and OP09-079 ("Rest up to 1 ...: Then, draw 1") — whether the second sentence resolves when the first
   chose nothing is not settled by the rules text, so no test relies on it.
7. **Gum-Gum Lightning (OP09-077) only takes opposing Characters.** It cannot be used to remove the
   tester's own Character, so OP09-080's "removed by your own effect" case could not be built; the
   opposing-effect, battle and "returned to hand" (Special Muggy Ball) cases are covered instead.
8. **OP09-118 win by effect is observed through `queries.result`** (winner and reason); the
   simultaneous-defeat question M6b-Q50 is not exercised.
