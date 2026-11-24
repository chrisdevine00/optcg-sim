# OP-12 group C independent card tests: disagreements with the engine

Cards: OP12-078, 079, 084, 085, 086, 087, 089, 090, 091, 093, 094, 095, 096, 097, 098, 100, 102, 104, 105,
106, 107, 116, 118, 119 (OP12-081 is unscripted and not covered).

**No disagreements.** Every test passes against the merged engine; there is no `it.fails` in this group.

Readings the tests rely on that the card text leaves open (all passed; a reviewer who reads them the other way
should check the matching test):

- **OP12-098 Hair Removal Fist**: "that card gains an additional +2000" is read as the Leader or Character chosen in the first
  sentence (it ends at +4000 when I have a Revolutionary Army Character with cost 8 or more), not the cost-8 Character.
  The engine agrees.
- **OP12-086 Koala**: "up to 1 [RA card] or up to 1 [Nico Robin]" (total of one vs one of each) is open (M6b-Q26 family);
  the tests add one card and finish the pick, which both readings allow.
- **OP12-096 Ursa Shock**: the "may select ... instead" wording is M6b-Q37; the tests only assert that a cost-6 target is
  selectable with a cost-8 Character of mine and not without (every reading shares this).
- **OP12-119 Kuma**: "Then, this Character gains +2 cost" after "add up to 1" is read as a plain sequence (the +2 is granted even when no
  card is added, because the cost was paid); the engine agrees.
