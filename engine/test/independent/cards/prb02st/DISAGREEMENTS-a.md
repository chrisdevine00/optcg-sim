# PRB-02 / ST-15 / ST-16 / ST-17 (group A): independent test disagreements

Each entry would be an `it.fails` in the card's independent test. Severity as in the review docs (1 low, 3 high, 4 prompt that depends on hidden cards).

None. All 26 cards (about 270 tests) agree with the card text and the rules, including the hidden-information checks (an "up to 1" hand pick with a filter is asked empty for PRB02-010; the "use" question is asked with accept unavailable for PRB02-003 with an empty hand).

Behaviours that differ from a tester's first guess; each is a legal reading and the tests accept it:

- **ST16-001 Uta and ST17-005 Teach [Activate: Main] with a hand cost that cannot be paid** (no "FILM" card in hand, an empty hand): `activate` is not among the legal actions at all. The tests probe on a copy and accept both "not offered" and "offered, then the cost pick is empty". Same precedent as ST29-004 (st29/DISAGREEMENTS-a.md): it depends on the deciding player's own hand.
- **Readings the tests rely on** (no ruling found):
  - ST16-003 Katakuri "6 or more rested cards" counts rested DON!! cards, the Leader, Characters (itself included) and the Stage of the controller (CR 6-2-4 names these areas). Tests pin it with rested DON!! alone and with Leader + Stage + Characters alone.
  - PRB02-001 Koby: the "Then, if you have 6 or less cards in your hand, draw 1" runs when the K.O. was declined ("up to 1" answered with nothing) or found no target (CR 4-10-2: "Then" is a sequence, not a condition on the first part). PRB02-013 Moria reads the same way for its DON!! step.
  - PRB02-009 Mr.3 (M6b-Q41): only rests by an opposing effect (a Character's On Play and an Event) and the not-an-effect cases (blocking) are asserted; a rest paid as a cost is not.
  - ST16-005 Luffy "a rested [Uta]": any card named Uta counts (ST16-001 and OP09-002 are tested); a Leader named Uta is not tested (no ruling on whether a Leader is "a [Uta]").
