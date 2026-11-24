# OP-13 group A (OP13-005 .. OP13-031): independent test disagreements

No disagreement was found: every test in `OP13-0xx.test.ts` of this group passes against the scripts as written, so there is no `it.fails` entry.

Readings the tests rely on (each is also in the test header):

- "Set up to N DON!! as active" (OP13-023 Uta, OP13-030 Chopper) is asserted as "as many as possible, at most N, no count prompt" per DECISIONS E-D4 / OPEN-QUESTIONS E-Q11 (the tests also take the most if a prompt were asked). OP13-006 Woop Slap, where the DON!! are given, does ask a count (M4b-4).
- OP13-021 Gatling Gun: whether "Then, give -2000" still resolves after the DON!! part chose nothing is not asserted (the rules on file do not settle it).
- M6b-Q32 (state of a given DON!!) is open: OP13-005, -006, -021 assert only cost-area totals, the given count and the power.
- The hand-only scope of OP13-028 Shanks' bar (M6b-Q33) is not observable, see API-GAPS-a.md G2.
