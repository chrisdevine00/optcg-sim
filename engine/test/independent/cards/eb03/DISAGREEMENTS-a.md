# EB-03 group A independent card tests: disagreements with the engine

None. All 22 cards (291 tests) pass against `main` as merged into this branch (scripts present). No
`it.fails` is used in this group.

Points where the card text or the rules leave a reading open, and the tests assert only what every
reading shares (so a later ruling cannot turn a passing test into a wrong one):

- **EB03-010 Monet** (M6b-Q26): "up to 1 Character ... or up to 1 Event". Tests assert at most one card
  of each kind and the single-card outcomes, not "one card in total" versus "one of each".
- **EB03-021 Alvida**: the second target ("up to 1 Character with a base cost of 3 or less") has no
  "of your opponent's". Tests use only opposing Characters for it; whether the player's own Characters
  may be chosen is not asserted.
- **EB03-023 Kaya**: "place them at the top or bottom ... in any order" (all together, or split). Tests
  assert the multiset, the untouched cards below, and that "all on top" and "all at the bottom" are
  both reachable.
- **EB03-013 Carrot, EB03-015 Camie, EB03-024 Vivi**: a "Then" after an "up to" that chose nothing is
  read as still resolving (CR 4-10-2, rules-digest 122); a failed "If" blocks it (M4b-5). The engine
  agrees; if a ruling says otherwise, the tests "up to 1: may K.O. nobody, and Zou can still be
  played", "giving none still lets the rest part resolve" and "the restriction applies even when
  nothing was played" are the ones to revisit.
- **EB03-017 Bonney**: whether "cannot be rested" also stops the Character from attacking is not
  asserted (only rest effects are probed).
