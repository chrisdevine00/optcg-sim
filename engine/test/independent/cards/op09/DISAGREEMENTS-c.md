# Disagreements: OP-09 independent tests, group C

One disagreement, left as an `it.fails` for the review to settle.

- **C-1 OP09-095 Laffitte (severity 1 or 2, low confidence).** The text says `reveal up to 1 "Blackbeard Pirates" type card`. The rules digest (item 27, CR 2-4-3-1) reads a quoted `"text"` as a substring match on types, so OP09-094 Peachbeard (types {Peachbeard Pirates}/{Blackbeard Pirates Allies}) should be offered among the top 5. The script offers only exact {Blackbeard Pirates} cards. Test: `OP09-095 ... "type including" ...` (`it.fails`). If the quotes in the verified text are only a rendering of the printed {Blackbeard Pirates} (the other OP-09 cards print their types in quotes in the same data), the exact reading is right and the test should be dropped; the card text on file does not say which. No other card in this group has a type variant of its quoted type, so the same question has no other observable effect here.

Readings the tests deliberately do not assert, because the rules on file leave them open:

- **OP09-093 Teach (colon-less "If" with a "Then" and two "up to 1" picks):** whether the second sentence ("Then, negate the effect of up to 1 of your opponent's Characters ...") still resolves when the first "up to 1" (the Leader) chose nothing. The tests assert only the Leader outcome after that skip. Whether the Character's negation lasts only "during this turn" or as long as the attack ban is also not asserted: the tests check the negation during the turn it was applied (a negated [Blocker] cannot block) and the attack ban across the opponent's next turn.
- **OP09-105 Sanji:** whether the trash of 2 resolves when the "add up to 1 card" was answered with none (OP13-066 note on a "Then" after an "up to" that chose nothing). Not asserted; the skip test checks only the Life count and the deck.
- **OP09-107 / OP09-105 / OP09-109 and the other [Trigger] cards:** with the Life card in no area while its [Trigger] resolves (CR 10-1-5-3), Life-count conditions (OP09-100, OP09-108) are tested with that card not counted. A reading that counts it would move every boundary by one.
