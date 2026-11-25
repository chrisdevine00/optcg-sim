# Disagreements, leftovers group A

None. All 18 cards (EB02-030, EB03-018, OP09-033, OP09-045, OP09-086, OP10-070, OP10-104, OP11-006, OP11-023, OP11-046, OP12-021, OP12-024, OP12-027, OP12-028, OP12-034, OP12-101, OP13-025, OP15-099) pass every black-box test written from the card text and the rules.

Two engine behaviours the tests rely on that differ from a first guess (both are the documented ones, so they are not disagreements):

- OP15-099 Urouge: a hand cost with exactly one candidate ({Supernovas} card) is still asked as a `choose` (hidden-zone choices are always asked, DECISIONS 2026-11-24 "M2-19"); the test pays it.
- EB03-018, OP12-021, OP11-046, OP10-070 and others: the protected Character is still offered as a target of the opposing K.O./rest effect, which then does nothing (rulings D-4).
