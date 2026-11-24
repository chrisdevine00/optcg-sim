# Disagreements: OP-11 independent tests, group B

Cards: OP11-037, 038, 039, 040, 041, 042, 043, 044, 047, 048, 049, 050, 051, 056, 057, 058, 059, 060, 061, 062, 063, 065, 067, 069, 070.

None. Every test passes against the engine; there is no `it.fails` in this group. The empty "look at N" pick is asked at max 0 (hidden-information policy honoured) on OP11-037, 047, 048, 051, 060 and 070.

Readings the tests assume, so the review can check them:

- **OP11-040 Luffy, "at the start of your turn".** Treated as before the Refresh/DON!!/Draw phases: 8 DON!! on the field when the turn begins fires it, 7 does not (the 2 DON!! of the DON!! Phase come later). Active, rested and given DON!! all count. A reading that checks after the DON!! Phase would make the 7 case fire; the engine agrees with the early reading.
- **OP11-039 Vagabond Drill, quoted types.** {Fish-Man Island} (Surume) is not {Fish-Man} and is not a boost candidate. OP11-037 Poseidon: {Fish-Man} (Jinbe) is not {Fish-Man Island}. Quoted types are matched as that exact type, "type including" only where the text says so (OP11-047, which is tested with {Kingdom of GERMA} and {The Vinsmoke Family} alone).
- **OP11-059 King Cobra, "cards in your hand".** The Event has left the hand when its Counter resolves, so 4 other cards in hand (5 with the Event) still give the extra +2000. A 7000 attack against a 5000 Leader is used because a tie goes to the attacker.
- **OP11-063 Sadi, OP11-069 Brulee, cost before condition.** The cost (DON!! -1; adding the Life card) is paid even when the "If your Leader has ..." that follows is false; nothing else happens. Tests accept the "use" question being asked or not where the cost is public and assert the board.
- **OP11-070 Pudding, "DON!! -1, You may rest this Character".** Read as one cost: activating returns 1 DON!!, rests Pudding and looks at 1 card. Whether declining the rest still allows the look is not asserted. No question is asked by the engine for the rest.
- **OP11-044 Judge, "All of your {GERMA 66} Characters gain +1000 during this turn".** A Character that arrives after the activation is not tested (no official ruling).
- **OP11-043 Ichiji and OP11-059 Cobra and others, "Then" after an empty "up to 1" pick.** Not asserted: the tests of the chosen path only. (OP11-043: whether "Then, trash 2 cards from the top of your deck" runs when no boost target was chosen.)
- **OP11-041 Nami, own Life removal.** Tested through OP11-069 Brulee's cost (a scripted card used as a source of "a card is removed from your Life"); the opposing-Life case is tested with a plain attack.
- **OP11-051 Sanji, K.O. by an opposing effect.** Tested through OP15-100 Kamakiri (cost 6 or less), the only scripted source that can K.O. a cost-6 Character in the pool; a battle K.O. is the must-not case.
