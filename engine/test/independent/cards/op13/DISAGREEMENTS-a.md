# OP-13 group A (OP13-005 .. OP13-031): independent test disagreements

No disagreement was found: every test in `OP13-0xx.test.ts` of this group passes against the scripts as written, so there is no `it.fails` entry.

Readings the tests rely on (each is also in the test header):

- "Set up to N DON!! as active" (OP13-023 Uta, OP13-030 Chopper) was asserted as "as many as possible, at most N, no count prompt" (DECISIONS E-D4, E-Q11); the OP-14 fix round (OP14-R2, engine 0.5.13) reversed that: a count is asked (most first, None last). Those two tests already took the most when asked and pass unchanged. **Fix-round edit (2026-11-24, OP-13):** OP13-024 Gordon now answers the count at the end of the turn (`answerCount` in `kit-op13b.ts`: 2, or 1 where one rested DON!! is left) and has a new fewer/None test. OP13-006 Woop Slap, where the DON!! are given, always asked a count (M4b-4).
- OP13-021 Gatling Gun: whether "Then, give -2000" still resolves after the DON!! part chose nothing is not asserted (the rules on file do not settle it).
- M6b-Q32 (state of a given DON!!) is open: OP13-005, -006, -021 assert only cost-area totals, the given count and the power.
- The hand-only scope of OP13-028 Shanks' bar (M6b-Q33) is not observable with the real pool, see API-GAPS-a.md G2; it is now scoped to the hand in the engine (`cannotPlay` `from: 'hand'`) and pinned by `engine/test/cards/m4b/actions.test.ts` (planted, fails when reverted).
