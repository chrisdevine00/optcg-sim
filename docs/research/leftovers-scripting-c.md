# Leftovers scripting, group C (ST-24, ST-25, ST-28)

Cards: ST24-001 to ST24-005, ST25-001 to ST25-005, ST28-001, ST28-002, ST28-003, ST28-005 (14; ST28-004 is a gap card, G70, not in this group). Source: `docs/research/m6b-audit/leftovers.md` (all "ready"). Readings, one line each; none settles an open question. Tests: `engine/test/cards/<ID>.test.ts`, helpers in `engine/test/cards/helpers-lfc.ts`.

## ST-25

- ST25-001 Alvida: "If you have 2 or more Characters with a base cost of 5 or more, this Character gains +1 cost." Base (printed) cost; her own base cost is 4, so she never counts herself; only your Characters count (same reading as OP12-042).
- ST25-001 "[On Play] If your Leader is [Buggy], draw 3 cards and trash 2 cards from your hand." No colon, so an effect condition (`if` step); draw and trash are both inside it; "[Buggy]" is the Leader's name (any Leader named Buggy, whatever its type).
- ST25-002 Cabaji: "gains [Blocker] and +1 cost" are one permanent with one condition; the [Blocker] is granted, not printed, so `keywords` is empty.
- ST25-002 "[Opponent's Turn] This Character gains +5000 power." A permanent on the opponent's turn only (1000 becomes 6000).
- ST25-003 Crocodile & Mihawk: "Draw 2 cards and trash 1 card from your hand. Then, play up to 1 ..." The "Then" is not an "If": the play is not gated on the draw or the trash. The card trashed is chosen before the play, so it cannot be the card played. The play pick is asked at max 0 when nothing is eligible (hand contents are not a gate).
- ST25-003 "[Once Per Turn] If your "Cross Guild" type Character would be removed from the field by your opponent's effect, you may trash 1 card from your hand instead." One replacement ability covering every {Cross Guild} Character of yours, this card included; one use per turn in all (not per Character). Opponent's effects only (a K.O., a bounce, a deck bottom...; your own effects and battle K.O.s are not covered).
- ST25-004 Buggy: "You may trash 1 card from your hand and trash this Character: If your Leader is [Buggy], play up to 1 ..." The "If" is after the cost colon, so an effect condition: with another Leader the cost is still paid and nothing is played. The cost is optional by being activated (not `costOptional`). The play is `upTo` 1 and may be declined.
- ST25-005 Mohji: same permanent as Cabaji. "[On K.O.] If your Leader is [Buggy] and you have 3 or less cards in your hand, draw 1 card." No colon: an effect condition read when the effect resolves.

## ST-24

- ST24-001 Bege: "6 or more rested cards" = rested Leader, Characters and Stage plus rested DON!! (M6b-Q25, as OP12-118). The 2 DON!! rested to pay Bege's own cost are rested by then and count; Bege himself (played active) does not. "If" has no colon: an effect condition; draw and trash both inside it.
- ST24-002 Kid & Killer: ""Supernovas" type card" is the exact type element (optcgapi prints `"X" type`), any category. The deck is looked at top 5; the pick is asked at max 0 when none is eligible.
- ST24-002 "[On Your Opponent's Attack] You may trash this Character: Set up ..." is an auto with a trash cost, optional by construction, no Once Per Turn (asked at every opposing attack while it is on the field). With no rested DON!! the cost may still be paid and nothing is set active (the count prompt is skipped).
- ST24-003 Hawkins: [End of Your Turn] "set up to 1 DON!!" is the usual count prompt (0 or 1) when a rested DON!! exists, no prompt otherwise (as EB02-015).
- ST24-004 Law & Bepo: "Rest up to 1 of your opponent's Characters and that Character will not become active in your opponent's next Refresh Phase." The chosen Character (bound) skips the next Refresh; an already rested Character may be chosen (it stays rested). With none chosen nothing is skipped.
- ST24-004 "Then, if your opponent has 2 or more rested Characters, your Leader gains +2000 power until the end of your opponent's next End Phase." The `if` is read after the rest and counts every rested opposing Character, whether or not this effect rested them (also read when "up to 1" was declined). Duration `untilEndOfOpponentsNextTurn`.
- ST24-005 X.Drake: "If your Leader has the "Supernovas" type, rest up to 1 ... Then, set up to 1 of your DON!! cards as active at the end of this turn." The delayed DON!! is inside the guard (M4b-5: "Then" after a failed "If" does not resolve). With the Leader right it is set active at the end of the turn even if no Character was rested (the "Then" is not an "If you do"). "Cost of 5 or less" is the current cost; a Leader is never a target (a cost filter does not match Leaders).

## ST-28

- ST28-001 Ashura Doji: "If your Leader has the "Land of Wano" type and your opponent has 3 or more Life cards, K.O. ..." no colon: an effect condition; "base cost" is the printed cost (a lowered or raised Character is judged by its printed cost).
- ST28-002 Izo: "[DON!! x2] This Character gains [Blocker]" is a permanent with `donGiven: 2`; "[On Play] Your "Land of Wano" type Leader gains [Banish] during this turn" grants to the Leader only (nothing if the Leader is not that type), this turn only.
- ST28-003 Kin'emon: "[Trigger] If your Leader has the "Land of Wano" type and your opponent has 3 or less Life cards, play this card." The opponent's Life is counted when the [Trigger] resolves. With the condition false the activated card goes to the trash (engine rule for an activated [Trigger] whose effect does nothing).
- ST28-005 Yamato: "[DON!! x2] [Your Turn] +3000" is `donGiven: 2` and your turn (the +1000 per DON!! given is the engine's, not this card's). [On Play]: a "Land of Wano" type card with "a cost of 2 or more" is the printed cost in the deck (a card without a cost never matches); any category; look at 5, rest to the bottom in any order.

## Cards left unscripted

None of the 14: all are scripted.
