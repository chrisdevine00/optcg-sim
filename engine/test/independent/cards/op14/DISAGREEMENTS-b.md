# Disagreements: OP-14 independent tests, group B

Cards: OP14-035, 036, 037, 038, 039, 040, 042, 043, 044, 045, 046, 047, 048, 049, 050, 052, 054, 056, 057, 058, 059, 061.

One disagreement (an `it.fails` in the card's test file).

1. **OP14-052 Hannyabal, [On Play] "You may trash 3 cards from your hand: Play up to 1 {Impel Down} type Character card with a cost of 6 or less from your hand." The play pick is not asked when no card left in hand qualifies.**
   After paying the cost with a hand that leaves only a non-{Impel Down} card (Marco), the engine goes straight back to the Main Phase. When a qualifying card exists the pick is asked, and the same "play up to 1 ... from your hand" shape is asked with 0 candidates on OP14-043, OP14-047 and OP14-058. A missing prompt tells the opponent that the remaining hand holds no {Impel Down} card of cost 6 or less, so a prompt depends on hidden cards (severity 4 by the brief). Test: `OP14-052.test.ts`, "with no {Impel Down} card to play after paying, the pick is still asked ...". Expected: a `choose` with no candidates and `done` available.

Readings the tests assume, so the review can check them:

- **OP14-035 Yosaku, "becomes rested" (M6b-Q30).** The tests use an attack as the way it becomes rested, and assert nothing about resting by a cost or by an effect on the owner's turn. The test that an opposing effect (OP14-038) resting it on the opponent's turn asks nothing and holds nothing back rests on "[Your Turn]".
- **OP14-045 Kuroobi, OP14-049 Jinbe, OP14-056 Wadatsumi, "trashed from your hand by an effect" (M6b-Q31, Q46).** Every test uses OP16-093 Bartholomew Kuma, whose trash is an effect and not a cost. Whether a cost paid from the hand counts is not asserted. Kuma trashes two cards in one instruction; the tests assert only that the watchers react (one or more events), never how many times.
- **OP14-057 Don't Worry, "all of your ... gain +1000".** A Character that arrives after the Event resolved is not tested (no official ruling).
- **OP14-044 Newgate, "type includes".** A quoted type matches by substring (CR 2-4-3-1), so {Whitebeard Pirates Allies} and {Former Whitebeard Pirates} count. The engine agrees.
- **OP14-061 Vergo, "removed from the field by your opponent's effect" (M6b-Q5, E-Q7).** Only a K.O. by an opposing effect (replaced) and a battle K.O. (not replaced) are tested. A trash or return-to-hand removal, and an own-effect removal, are not.
- **Public-zone costs.** For "rest N of your cards" and "give DON!!" costs the engine asks no `optional` for an [Activate: Main] or a [Counter]; the tests accept both a missing and a present question where the brief allows it (public information).
