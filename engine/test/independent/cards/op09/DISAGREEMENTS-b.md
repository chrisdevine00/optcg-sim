# Disagreements: OP-09 independent tests, group B

Cards: OP09-031, 032, 034, 035, 036, 037, 043, 044, 046, 047, 048, 050, 051, 052, 053, 054, 056, 064, 066, 069, 071, 074.

None. Every test passes; no `it.fails` was needed.

Readings the tests assume or leave open, so the review can check them:

- **OP09-032 Rosinante, [Once Per Turn] when already active.** Not asserted whether the use is spent when the Character is already active at the first opposing attack (no ruling). The tests only use a rested Rosinante for the spent-use case.
- **OP09-051 Buggy, second sentence after a placement that did nothing.** "Then, if you do not have 5 Characters with a cost of 5 or more, place this Character ..." when no opposing Character was placed (the pick was declined or the opponent has none): the tests assert only the cases every reading shares (the check passes, so Buggy stays). The failing-check case after a declined or empty placement is not asserted (CR 4-10-2 / M4b-5 wording).
- **OP09-047 Oden, [Double Attack] against 1 Life.** The tests follow RL-20 (it does not win; Life goes to 0 and the game continues).
- **OP09-048 Mihawk, deck of exactly 2.** The tests follow RL-26 (drawing the last card loses at once, no trash step).
- **OP09-052 Marco, a K.O. by your own effect.** No scripted source of an own-side K.O. of one's own Character exists in the repo. Fix round B3C-R2: a planted [On Your Opponent's Attack] on p1's Leader that K.O.s one of p1's own Characters is tested as a non-trigger on the opponent's turn (it kills the `koCause: 'effect'` mutant). The own-turn side is still untested; the battle K.O. is also tested as a non-trigger.
- **OP09-074 Bepo, "[Your Turn]" from the other side.** An opposing DON!! return on the opponent's turn is tested to prompt nobody about Bepo; a DON!! return of mine on the opponent's turn has no scripted source.
- **OP09-074 Bepo, whether a declined "up to 1" pick spends the [Once Per Turn].** Not asserted.
- **Prompt order.** Which of Bepo's pick and Lightning's or Killer's own pick comes first is not asserted.
