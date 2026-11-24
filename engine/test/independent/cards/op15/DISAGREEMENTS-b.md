# Disagreements: OP-15 independent tests, group B

Cards: OP15-047, 048, 050, 051, 052, 053, 054, 055, 056, 057, 060, 063, 064, 065, 068, 070, 072, 073,
079, 080, 081, 082, 083.

None. All tests in this group pass against the scripts as they stand; no `it.fails` was needed.

Readings the tests assume, so the review can check them:

- **OP15-073 Yama, "up to 1 [Heavenly Warriors] ... or up to 1 {Vassals}".** The engine allows one card in total
  (reachable pick sets are `{}`, one Heavenly Warriors, one Shura). This matches the auditors' reading of M6b-Q26,
  which is not answered by an official source. The test only asserts what both readings share (each card can be
  played alone, never a third card), so it does not pin the one-in-total reading.
- **OP15-079 Absalom, OP15-082 Lola, [On K.O.] reading from the trash.** The tests assume the K.O.'d card is already
  in the trash when the effect resolves, so it can be chosen itself (CR 10-2-17, RD 110). The engine agrees.
- **OP15-080 Oars, "there are no other [Oars] cards".** The text does not say whose field. Only another [Oars] on my own
  field is tested (removes the bonus). An [Oars] on the opponent's field is untested.
- **OP15-064 Kotori, OP15-072 Hotori, "You may rest this Character" in the cost.** For an [Activate: Main] the engine does
  not ask a separate yes/no: choosing to activate is choosing to pay (as `activate` in `kit.ts` already assumes). The
  tests do not assert whether the ability is offered when the "if you have [..] and [..]" condition after the colon
  fails; they assert only that nothing is rested / reduced.
