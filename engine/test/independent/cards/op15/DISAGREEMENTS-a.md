# OP-15 group A (OP15-004 .. OP15-045): independent test disagreements

Each entry is an `it.fails` in the card's independent test. Severity as in the review docs (1 low, 3 high).

| # | Card | Test | Card text / rule | Engine behaviour | Severity |
| --- | --- | --- | --- | --- | --- |
| A-1 | OP15-013 Pincers | `boundary: Leader at exactly 0 power ... gives cost 2` | "If your Leader has 0 power or less, give this card in your hand -2 cost." True at exactly 0. | With the Leader at 0 power (OP13-004 Sabo 4000, two OP15-009 Koby replacements) the hand card still costs 4; at -2000 it costs 2. The condition behaves as "less than 0". The same threshold would also decide OP15-004 Sea Cat's "0 power or less" (not reachable in a test, see API-GAPS-a.md G1). | 2 |
| A-2 | OP15-024 Usopp | `the restriction names Leader and Character effects only: an opposing Event may rest it` | "[Opponent's Turn] This Character cannot be rested by your opponent's Leader and Character effects". An Event effect is neither. | An opposing Event (OP17-038, "rest up to 1 of your opponent's Characters") picks Usopp but Usopp stays active: the engine treats every opposing effect as covered. | 1 |
