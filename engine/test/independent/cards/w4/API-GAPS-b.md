# API gaps: engine wave 4, independent tests, group B

None of these stopped a test from being written. Each says what the public API or the card pool leaves open and how the tests cope.

1. **No way to K.O. one of my own Characters on my own turn with an unscripted-free card.** The "[Opponent's Turn]" limit of OP14-115 Rindo and EB03-055 Robin, and the "[Your Turn]" limit of EB04-044 Koby, cannot be tested from the other side for my own Character: Gum-Gum Lightning (OP09-077) and Kingdom Come (EB01-059) pick the opponent's Characters, and the cards that K.O. one's own Character are black {Baroque Works}/{Thriller Bark} cards or attack-gated. The tests cover the other direction (the effect fires on the opponent's turn; a K.O. of my own Character on the opponent's turn draws nothing for Koby; Koby's draw is asserted on my turn).
2. **OP01-104 Speed is not a usable [Trigger] scenery card.** The kit comment calls it "[Trigger] Play this card", but the engine offers no activation for it (not scripted). A scripted Trigger card (OP14-115 Rindo with a {Kuja Pirates} Leader) stands in.
3. **OP05-116 is not automated** (`whyNot`: "This card's effect is not automated yet"), so it cannot be a second removal Event; EB04-044's Once Per Turn test uses a battle K.O. as the second removal.
4. **EB03-057 Yamato's "fewer than 3 rested DON!!" case is unreachable from hand.** Paying the cost rests 5 DON!!, so the count question always offers 3, 2, 1, 0.
5. **A forced second pick is not asked.** With exactly two eligible Characters (OP14-001, OP14-017) the engine picks the second itself; the helpers ask the second prompt only when one is pending. With one candidate left, the two Events/abilities may or may not be offered; tests accept both.
6. **The power of a Character is observed only as current power.** Base power is read as power with no DON!!/modifier on the card, or with a known modifier added on top (OP14-001 given-DON!! test).
