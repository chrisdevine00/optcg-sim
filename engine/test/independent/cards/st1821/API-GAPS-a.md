# ST-18 .. ST-21 group A: observation and setup gaps

- **G1 (ST19-002 Sengoku, ST19-001): a multi-card exact pick lists only canonical-order picks.** With 3 candidates and 2 to choose, the first pick lists only the cards that can start a canonical (instance-sorted) selection, so "which cards are offered" is read through `reachablePickSets`, not the first pick list.
- **G2 (ST20-001 Katakuri, ST20-002 Cracker): Life face state after an effect is read through `CardView.faceUp` of the Life zone.** Open question M4b-3 / M6b-Q59 (a top Life card already in the wanted state) is not asserted: only a face-down top card and an empty Life area are tested.
- **G3 (ST19-004 Hina, ST20-001, ST21-001, ST21-009, ST21-012): DON!! are interchangeable in the public API.** Tests read counts from `queries.don` (active, rested, given) and the `don` count of the receiving card, not which DON!! moved.
- **G4 (ST19-003 Tashigi): the [Smoker] Leader's own [Activate: Main] (OP02-093) is not offered in a scenario with 1 DON!! given**, so a cost-0 Character is made another way (a second Tashigi played this turn). Scenery only; Tashigi is not affected.
- **G5 (ST18-002 O-Nami): the exact "trash 1 card from your hand" with an empty hand after the play is not asserted** (no ruling says whether the draw still happens); the single-candidate case is answered when asked.
