# Wave 5 group B (OP10-033, OP11-005, -066, -071, -073, -074, -079, -081, -092, OP13-002, OP14-003, PRB02-018, OP12-081): independent test disagreements

No disagreement was found: every test in this group passes against the scripts as written, so there is no `it.fails` entry.

Readings the tests rely on, or leave open (each is also in the test header):

- M6b-Q67 "choose a cost" (OP11-066, -071, -073, -074, -079, -081): asserted only what the readings share: the number is asked (0 to 10) after the cost is paid and before anything is revealed, the revealed card is the opponent's deck top, it stays on top, and a match is a base-cost equality. An empty opposing deck is asserted to ask the number and fail the comparison (Q67's built reading).
- OP11-066 Oven: whether "Then, add up to 1 DON!!" runs when the K.O. was hit but "up to 1" chose nothing is not asserted (no ruling; same stance as OP12-026 in `../op12/DISAGREEMENTS-a.md`). A miss (failed "If") is asserted to add no DON!! (M4b-5).
- M6b-Q68 (OP11-005 Smoker, OP14-003 Bege): whether a protected Character is offered as a K.O. target is not asserted. The tests pick it when offered, choose nothing otherwise, and assert it stays; the control test in each file shows the same effect K.O.s an unprotected Character. A K.O. in battle and by an Event are asserted to go through (the text says "effects of Characters").
- M6b-Q66 (OP13-002 Ace): Double Attack as one or two damages is not asserted; the once-per-turn draw is asserted for two separate hits in a turn (one draw).
- M6b-Q69 (OP10-033 Nami): the tests count the opponent's DON!! by state (rested/active) after their Refresh Phase and do not ask which rested DON!! is held.
- OP12-081 Koala: the "Once Per Turn" is asserted as one use shared between the base cost 8+ branch and the effect-played branch only for the effect-played branch (two Characters played by effects, one Life card moved); a base cost 8 play plus a second trigger in one turn needs more than 10 DON!!.
