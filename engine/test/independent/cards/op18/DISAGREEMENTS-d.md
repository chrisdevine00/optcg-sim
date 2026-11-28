# OP-18 group D: disagreements between the blind tests and the engine

Two tests are kept as `it.fails`. Everything else in group D (32 cards) passes.

## OP18-046 Mr.0 & Ms. All Sunday: "up to 2 rested DON!! cards each" cannot be given 0

- Text: "[On Play] Draw 2 cards and give your Leader and all of your Characters up to 2 rested DON!! cards each."
- Expected (CR 8-4-4-1, "up to N" may choose fewer, including none): the count question for each target offers 0, 1 and 2, so a player can skip a target, for example to keep rested DON!! for a later DON!! cost or to leave one target ungiven.
- Engine: each target's question (`choose`, purpose `mode`, min 1, max 1) offers only "2" and "1"; "0" is missing, and there is no `done`. Every target must be given at least 1 while rested DON!! remain.
- Test: `OP18-046.test.ts`, "up to 2: a target may be given 0".

## OP18-080 Van Augur: the first clause cannot be exercised with a real [Marshall.D.Teach] Leader (engine gap, not a Van Augur script fault)

- Text: "[Your Turn] [Once Per Turn] When a card is trashed from your hand by your [Marshall.D.Teach] Leader's effect, if you have no other [Van Augur], draw 1 card."
- Expected: with the OP09-081 Marshall.D.Teach Leader, paying its [Activate: Main] cost ("You may trash 1 card from your hand") trashes a card by that Leader's effect, so Van Augur draws 1 (M6b audit Q6: a cost counts).
- Engine: OP09-081 has no script (not in `cards/effects/registry.ts`), so it offers no [Activate: Main] at all; the trash cannot happen. OP16-080, the only other Teach Leader, trashes a card on the opponent's turn, where the [Your Turn] clause is correctly silent (that case is tested and passes). The "no other [Van Augur]" and once-per-turn parts therefore cannot be tested either.
- Test: `OP18-080.test.ts`, "with OP09-081 Teach, trashing a card ... draws 1".

**Settled (review, 2026-11-28):** OP18-046 — the engine deviates from "up to" when the targets are "all of your Characters" (no target pick): OP18-R8, severity 2, carried to BACKLOG §15 (the fix changes `giveDon each` for older cards too, so it needs an ENGINE_VERSION bump and new goldens). OP18-080 — not a script fault: OP09-081 Teach is unscripted (BACKLOG D5), OP18-R12. Both `it.fails` stay until those land.

**OP18-046 fixed (2026-11-28, ENGINE_VERSION 0.5.19):** `giveDon` gained `upTo` ("up to N ... each"); with no target pick every count now offers 0. The test is a normal test again.
