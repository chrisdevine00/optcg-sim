# OP-12 group A (OP12-001 .. OP12-039, 19 cards): independent test disagreements

No disagreement was found: every test in `OP12-0xx.test.ts` of this group passes against the scripts as written, so there is no `it.fails` entry.

Readings the tests rely on (each is also in the test header):

- OP12-008 Shanks: after the cost was declined, whether a second opposing attack in the same turn offers the effect again is not asserted (CR 10-2-13-5 says a failed payment spends the use; a declined "you may" is not settled). The engine offers it again after a decline. Only "after using it, no second use" is asserted.
- OP12-026 Kuina, OP12-029 Shimotsuki Kouzaburou, OP12-031 Tashigi: whether the "Then" part still runs when the "up to 1" first part chose nothing is not asserted (no ruling on file; same stance as OP13-021 in `../op13/DISAGREEMENTS-a.md`). Where the first part has no legal target at all, the tests assert only what follows from the engine skipping the empty prompt (OP12-029: the K.O. step is asked straight away).
- M6b-Q32 (state of a DON!! given from the rested pool) is open: OP12-013, -014, -026, -031 assert only cost-area totals, the given count and the power.
- OP12-017 Color of Observation Haki: "reveal up to 1 red Event or up to 1 Character card with a cost of 3 or more" is asserted as one card in all (an "or" between the two kinds). Every reading shares at most one card of each kind, and the tests assert at most one in total.
- Empty "up to" picks over field cards (OP12-007, -012, -029, -031, -033, -022): the engine asks no prompt when no candidate exists. The tests accept either no prompt or an empty pick that ends with `done` (`if (kind(g) === 'choose') { expect(offered).toEqual([]); none(g); }`). An "up to" pick over the hand with a filter is asked even when empty (brief convention); no card of this group has one at a point a test can reach, except OP12-003 where the same either-way tolerance is used.
