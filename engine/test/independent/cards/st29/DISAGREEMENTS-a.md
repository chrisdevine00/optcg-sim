# ST-29 and older block-4 cards (group A): independent test disagreements

Each entry would be an `it.fails` in the card's independent test. Severity as in the review docs (1 low, 3 high, 4 prompt that depends on hidden cards).

None. All 26 cards (297 tests) agree with the card text and the rules. Two behaviours differ from the first guess a tester might make; both are legal readings and the tests accept them:

- **ST29-004 Sanji [Trigger] with an empty hand:** the engine does not offer `activate` at all (the cost "trash 1 card from your hand" cannot be paid), so declining is the only legal answer and the card goes to the hand. Rules-wise activating would only lose the card to the trash, so nothing is lost. Not a prompt that depends on hidden cards: it depends on the deciding player's own hand.
- **ST29-004 Sanji / ST29-014 Zoro "You may trash 1 card ..." cost:** after the Trigger or ability is chosen the hand pick is mandatory (no `done`); the "you may" is answered by not activating. ST29-014's ability is not offered without a [Trigger] card in hand.
