# Disagreements: OP-10 independent tests, group B

Cards: OP10-036, 037, 038, 043, 044, 045, 046, 047, 048, 049, 051, 052, 053, 055, 056, 057, 058, 062, 063, 065, 066, 069, 071, 072, 074.

One disagreement, **closed in the B3B-R3 fix round** (the engine now announces a hand reveal; the test is a plain test).

1. **(Closed.)** **OP10-058 Rebecca, "reveal up to 2 ... Dressrosa type Character cards ... from your hand": a revealed card that is not then played gets no `CardRevealed` event.** After revealing Blue Gilly and Viola and choosing to play Gilly, the event stream holds `CardRevealed` only for the play of Gilly (`reason: 'play'`); Viola (cost 5, so not played) is never announced as revealed. CR 11-2-1 and rules-digest 50 make a revealed card known to both players until the effect resolves, so the opponent learns Viola's identity and the engine tells nobody. Severity 1 or 2 (information the opponent is owed, no board effect). Test: `OP10-058.test.ts`, "a card revealed from hand but not played (Viola ...) is announced as revealed". Expected: a `CardRevealed` for each revealed card, played or not.

Readings the tests assume, so the review can check them:

- **OP10-036 Perona, "rested by your effect" (M6b-Q41, Q30).** Tests use a rest by an effect (Camie's [On Play], both on an opposing Character) and an attack declaration. A rest paid as a cost is not asserted.
- **OP10-037 Lim and OP10-049 Sabo and OP10-074 Pica, "removed from the field by your opponent's effect" (E-Q7, M6b-Q5).** Only a K.O. by an opposing effect and a return to the hand by an opposing effect (Lim, Sabo) are asserted as replaced, and a battle K.O. as not replaced. For Lim, whether Lim itself is a legal "1 of your ODYSSEY Characters" to rest is not asserted (the engine offers it).
- **OP10-057 Leo, "If your Leader is [Usopp]" after the colon.** Read as an effect condition: with another Leader the cost is still paid (the Leader is rested) and nothing is looked at. The brief's convention for a colon-less If; here the If follows the cost colon, so it is not an activation condition under any reading.
- **OP10-058 Rebecca, "If there is a Character with a cost of 8 or more".** Read as either field, current cost, this card included (M4b-7). The test that Rebecca herself reaches cost 8 under the Leader OP10-042 Usopp (+1 cost for {Dressrosa} Characters of cost 2 or more) asserts that the "If" holds, which depends on that Leader being scripted (it is) and on the same reading.
- **OP10-058 Rebecca, empty candidate sets.** A "play 1 of the revealed cards" pick with one revealed card is asked with one candidate (min = max = 1); with none revealed it is asked at max 0. The tests accept the empty one being asked or skipped.
- **OP10-062 Violet and OP10-069 Fighting Fish, "DON!! −1".** Read as optional (the reminder text says "You may return"); the engine asks an `optional`, which the tests answer.
- **OP10-072 Rosinante, [End of Your Turn] 7 or more DON!!.** DON!! given to cards were not used as part of the count; the tests use the cost area only.
