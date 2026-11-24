# Disagreements: OP-17 independent tests, group B

Cards: OP17-030, 031, 032, 033, 034, 036, 037, 038, 041, 043, 047, 053, 057, 064, 066, 067, 068, 069,
071, 072, 078, 085, 092, 097, 099, 101, 103, 104, 105, 108, 115, 116, 117.

Each entry is an `it.fails` in the named test file. The review settles which side is right.

## B-1 "Add up to N DON!! cards as rested" is always taken in full (OP17-068, OP17-078)

- **Cards and tests.**
  - OP17-068 Sasaki, `"up to 2": adding fewer DON!! (0 or 1) after paying is a reachable outcome`.
  - OP17-078 Drunken Dragon Bagua, `"up to 3": adding fewer DON!! (0 to 2) after paying is a reachable outcome`.
- **Card text.**
  - OP17-068: "[When Attacking] You may trash 2 cards from your hand: If your Leader has the {Animal Kingdom Pirates} type, add up to 2 DON!! cards as rested from your DON!! deck."
  - OP17-078: "[Main] You may rest 2 of your DON!! cards and trash 2 cards from your hand: If your Leader has the {Animal Kingdom Pirates} type, add up to 3 DON!! cards as rested from your DON!! deck."
- **My reading.** "Up to N" lets the player take any number from 0 to N, so adding fewer (or none) is a legal choice after the cost is paid.
- **Engine.** `outcomes()` over every decision p1 owes reaches only the full amount (rested DON!! +2, resp. +3, or all that is left in the DON!! deck). No `choose` or `optional` is asked for the DON!! count.
- **Source.** rules-digest item 15 (CR 1-3-5-1, 4-8-1, 8-4-4-1; QA-GR "up to ... choose 0"). This is the known, deliberate engine-wide choice recorded in OPEN-QUESTIONS E-Q11 (see also the EB-05 review, finding EB05-R2, severity 1); I expect the review to rule it the same way.
- **Same cause, not separately tested.** The "set up to 1 of your DON!! cards as active" of OP17-030 Monkey.D.Luffy and OP17-034 Rockstar is a `setActive` DON!! step, which E-Q11 says has the same status. Their tests assert the observable result (exactly one DON!! is set up) and do not try to skip it.

No other disagreement was found. Points that looked close to one and turned out to match the rules as I read them:

- OP17-043 Ganzui: the replacement is offered for a battle K.O., for an opposing K.O. effect and for an opposing bottom-of-deck effect (unqualified "would be removed from the field", M6b-Q5 reading "any cause"); it is not offered when the Character is trashed to make room for a sixth Character (CR 3-7-6-1-1). "becomes 6000" sets the base (a printed 7000 Leader goes to 6000).
- OP17-103 / 104: [Your Turn] [On Play] does nothing when the card is played by its [Trigger] on the opponent's turn.
- OP17-103: a Leader without the {Big Mom Pirates} type gets neither the Life card nor the -3000 (the "Then" is inside the failed "if", M6b-Q13); declining the "up to 1" Life card still resolves the -3000 (CR 4-10-2).
- OP17-085 / 092: the "Then, you cannot play Character cards" restriction applies when the "up to 1" play chose nothing, and does not apply when the "if" failed.
