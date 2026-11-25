# EB-02 group A independent card tests: disagreements with the engine

None. All 23 cards (EB02-002, 003, 005, 006, 010, 011, 012, 013, 014, 015, 016, 018, 019, 023, 024,
025, 026, 027, 028, 032, 033, 036, 037) pass every test written from the card text and the rules,
including the checks that no prompt depends on a hidden card (EB02-014, EB02-016, EB02-013,
EB02-028, EB02-032: the "play up to 1 ... from your hand" pick is asked at max 0 when nothing in hand
matches) and that a colon-less "If" is an effect condition (EB02-006, EB02-010, EB02-011, EB02-025).

Probed against the lead's local `main` (scripts merged), 2026-11-24.

Readings the tests rely on, where a ruling could change them (no disagreement found):

- EB02-010, EB02-006: "the only Characters on your field are ..." with no Characters (M6b-Q21) and
  "Then" after an "up to" that moved nothing are not asserted.
- EB02-032: "[Galley-La Company]" is read as a card name (the Stage OP03-075), as "[Zou]" is on
  the sibling Carrot (EB02-013). If the printed bracket means the type, the Character cards of that
  type would also be candidates and the "decoy" tests would need another decoy.
- EB02-023: whether the 3 looked-at cards go all to the top or bottom together, or one by one, is
  not asserted (the engine asks one top/bottom question for the group); the tests check the same 3
  cards occupy the top 3 or the bottom 3 positions.
