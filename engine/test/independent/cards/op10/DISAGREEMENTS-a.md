# OP-10 group A (OP10-001 .. OP10-035, OP10-042, OP10-099): independent test disagreements

No disagreement was found: every test in the `OP10-0xx.test.ts` files of this group passes against the scripts as written, so there is no `it.fails` entry.

Readings the tests rely on (each is also in the test header):

- **Colon-less "If" is an effect condition** (DECISIONS 2026-11-24): OP10-001 Smoker Leader's Activate is always offered and spends its Once Per Turn when no 7000-power Character is present; OP10-003, -008, -009, -017, -023, -024, -025, -029 do nothing and ask nothing when their "If" fails. OP10-024 Newgate: the "Then" (K.O.) is also gated by the failed "If" (M4b-5).
- **"Set up to 1 / up to 2 DON!!" and "give up to 2 DON!!" ask a count** (OP14-R2): OP10-001, -003, -016, -030 take the count question as a `mode` choose (options most first, "None" last). OP10-003's [Opponent's Turn] "add up to 1 DON!!" also asks it.
- **No prompt depends on hidden cards**: OP10-007, -008, -017 ("play up to 1 ... from your hand") ask the pick at max 0 / no candidates when the hand holds no match, via raw `g.act`.
- **M6b-Q42** (order of "removed from the field" watchers and [On K.O.]): OP10-042 Usopp's draw resolves before Franky's [On K.O.]; the test asserts only the official Q&A (Usopp's draw is done before the played Rebecca's [On Play]).
- **M6b-Q48** (a cost filter against a Leader): OP10-035 Brook asserts Characters only; the engine currently also offers the opposing Leader.
- **M6b-Q47** (whose Character effects OP10-030 Smoker's restriction covers): only my own Character (OP14-024 Kin'emon) and my own Leader (OP10-001) are asserted.
- **M6b-Q59** (turning Life face-up needs a face-down top card): OP10-099 asserts only "all Life face-up" and "no Life" as unpayable.
- A cost chosen from exactly one candidate (OP10-002 Caesar's returned Character, OP10-099 target) may be resolved by the engine without a question; the tests accept that.
