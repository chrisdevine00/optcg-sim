# Disagreements: EB-04 independent tests, group B

Cards: EB04-028, 029, 033, 034, 035, 036, 037, 039, 041, 042, 043, 045, 046, 047, 049, 051, 052, 053, 054, 055, 056, 057, 060.

No disagreements: every test passes against the scripts (no `it.fails`).

Readings the tests assume, so the review can check them:

- **EB04-045 Ginny, "If there are 2 or more Characters with a cost of 8 or more".** Read as Characters of both sides (the text does not say "your"). Tests assert one of mine plus one of the opponent's counts, and two of the opponent's alone count. If the reading is "yours only", those two tests are wrong, not the engine.
- **EB04-052 Sanji, "base power becomes the same as your opponent's Leader".** Per M6b-Q29 (answered): copies base power. The tests only use Leaders with no power modifiers, so base and current agree; DON!! given to Sanji still adds +1000 each on top.
- **EB04-056 Pacifista, "If you have [Jewelry Bonney]".** Tests use a Character named [Jewelry Bonney] on the field only. Whether a Leader with that name counts is not asserted.
- **EB04-057 Vegapunk, "cannot be removed from the field by your opponent's effects".** Asserted for an opposing K.O. (Gum-Gum Lightning) and for a return to the hand (Ice Time [Trigger] from the opponent's Life); a battle K.O. is asserted as not prevented. The tests accept either "the protected Character is not offered" or "offered and nothing happens".
- **EB04-034 Pudding / EB04-029 / EB04-049 "You may" cost with a failing "If".** When the condition is already false the tests assert only the outcome (no power, no K.O.), not whether the optional question is still asked or whether the cost is spent. The brief's convention (a cost paid from the hidden hand is offered even when unpayable) is asserted only where the hand is the cost (EB04-029 [Counter] with an empty hand).
- **EB04-043 Kaku, "once per turn".** Asserted per turn (a second use on the next opponent turn is offered). Whether a declined offer consumes the use is not asserted.
- **EB04-042 Alpha / EB04-043 Kaku / EB04-049: deck-out.** Paying the cost with exactly the whole deck (3 cards for Alpha) empties the deck and the game ends at once (CR 9-2-1-2, rules digest point 3). Tested for Alpha only.
- **EB04-041 Stealth Black, "4 or more DON!! cards on your field".** DON!! given to a card is counted with the cost area (3 + 1 given passes), and the Event's own cost does not reduce the count (rested DON!! stays on the field).
