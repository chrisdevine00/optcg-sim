# Disagreements: OP-09 independent tests, group C

One disagreement, closed in the block 3 batch B fix round (B3C-R3).

- **C-1 OP09-095 Laffitte (closed, B3C-R3).** The first reading was that the quoted `"Blackbeard Pirates" type` matches by substring, so OP09-094 Peachbeard ({Blackbeard Pirates Allies}) would be offered; the `it.fails` is now a plain test that it is not. Reason: optcgapi renders the official `{X} type` as `"X" type` (docs/research/data-sources.md rows 43 and 54), while the substring form is always printed `type including "X"`. The script (exact type) is right.

Readings the tests deliberately do not assert, because the rules on file leave them open:

- **OP09-093 Teach (colon-less "If" with a "Then" and two "up to 1" picks):** whether the second sentence ("Then, negate the effect of up to 1 of your opponent's Characters ...") still resolves when the first "up to 1" (the Leader) chose nothing. The tests assert only the Leader outcome after that skip. Whether the Character's negation lasts only "during this turn" or as long as the attack ban is also not asserted: the tests check the negation during the turn it was applied (a negated [Blocker] cannot block) and the attack ban across the opponent's next turn.
- **OP09-105 Sanji:** whether the trash of 2 resolves when the "add up to 1 card" was answered with none (OP13-066 note on a "Then" after an "up to" that chose nothing). Not asserted; the skip test checks only the Life count and the deck.
- **OP09-107 / OP09-105 / OP09-109 and the other [Trigger] cards:** with the Life card in no area while its [Trigger] resolves (CR 10-1-5-3), Life-count conditions (OP09-100, OP09-108) are tested with that card not counted. A reading that counts it would move every boundary by one.
