# OP-10 group C: disagreements with the scripts

Cards OP10-075, 076, 077, 081, 082, 083, 085, 086, 087, 088, 090, 091, 092, 093, 094, 095, 100, 102, 103, 106, 107, 108, 109, 110, 111 (25 cards). The independent tests were written from the verified card text and the rules only.

**None.** Every test in the group passes against the scripts; no `it.fails` was needed.

Readings the tests deliberately avoid deciding (they assert only what every reading shares):

- OP10-100 Inazuma and OP10-110 Heat & Wire, [Trigger] Life-count conditions ("a total of 5 or less Life cards", "2 or less Life cards"): whether the Life card being resolved is still counted (before or after it leaves Life) is not settled in `rulings.md`. The tests use totals far from the boundary (clearly met or clearly missed under both readings) and no test sits on the boundary.
- OP10-087 / 081 / 091 / 095 "Then" after an "up to 1" K.O. with no target chosen: asserted as resolving (CR 4-10-2, "a then clause that cannot be resolved does not stop the next"); the M4b-5 rule (a "Then" after a failed "If" does not resolve) is asserted only for OP10-087, whose first clause is an "If".
- OP10-086 Shiryu: "base cost" is exercised with a +3 cost modifier from OP10-093 (current cost 5, base 2). No test lowers a cost.
