# Disagreements: engine wave 4, independent tests, group B

Cards: OP14-001, OP14-009, OP14-017, OP14-115, EB03-008, EB03-054, EB03-055, EB03-057, EB04-044, EB04-050.

No disagreement: every test in this group passes against the scripts (there is no `it.fails`).

Readings the tests avoid, so the review can look at them:

- **OP14-115 Rindo, "Add up to 1 card ... Then, you take 1 damage" after declining.** The engine asks the "add the top card?" question as an `optional`; after "no" the damage still follows (a trigger decision for the card taken). Whether a "Then" runs when the "up to" step added 0 cards is open (the M4b-5 ruling covers a failed "If", not an "up to" of 0). The decline test asserts only that no deck card moved and the game goes on.
- **EB04-044 Koby, "would be removed from the field" (M6b-Q5).** Replacement tests use an opponent's K.O. effect (EB01-059), which every reading covers. The engine also offers the replacement for a battle K.O. (seen in a scratch run); no test asserts that. The Once Per Turn test ends with a battle K.O. of the second removal, which no reading replaces after the first use.
- **EB03-055 Nico Robin, "You may trash 1 ...: If your Leader has {Straw Hat Crew}, add up to 2" with another Leader.** The cost step is asserted for neither outcome; only that no card is added to Life.
- **OP14-001 and OP14-017 with fewer than two eligible Characters.** Whether the ability or Event is offered, and whether Once Per Turn is spent, is not asserted; only that no power changes.
- **OP14-001 / OP14-009 / OP14-017 and M6b-Q51** (swap against another base-power setting) is not tested: no cheap scripted card sets a base power in the test pool.
