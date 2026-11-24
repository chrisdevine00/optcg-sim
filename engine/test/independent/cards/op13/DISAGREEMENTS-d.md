# OP-13 group D (OP13-089 .. OP13-120): independent test disagreements

**Fix round 2026-11-24 (OP-13 review, OP13-R1/R2):** D-1 and D-2 are resolved, the independent author was right. OP13-102 Edison and OP13-108 Jewelry Bonney now have the "Then" step inside the failed-"If" guard; both `it.fails` are plain `it` tests and the author tests that pinned the old reading are flipped.

Each entry (before the fix) is an `it.fails` in the card's independent test. Severity as in the review docs (1 low, 3 high). Both entries are the same question: a "Then" after a failed "If" (closed in OPEN-QUESTIONS M4b-5 by CR 4-10-1, CR 8-3-3 and the official OP13-118 / OP14-111 / OP14-112 Q&As: the "Then" part does not resolve).

| # | Card | Test | Card text / rule | Engine behaviour | Severity |
| --- | --- | --- | --- | --- | --- |
| D-1 | OP13-102 Edison | `boundary: 5 vs 4 Life: the "Then, rest" part does not resolve either (no target is even offered)` | "[Activate: Main] You may trash this Character: If the number of your Life cards is equal to or less than the number of your opponent's Life cards, draw 1 card. Then, rest up to 1 of your opponent's Characters with a cost of 3 or less." With more Life cards than the opponent the "If" fails, so the "Then" must not resolve. | With 5 Life against 4 nothing is drawn, but the engine still asks for the rest target (a candidate is offered) and would rest it. The "rest" step is outside the "If" guard. | 3 |
| D-2 | OP13-108 Jewelry Bonney | `a Leader without {Egghead}: the "Then" part does not resolve either, the opponent keeps all 4 Life cards` | "[On Play] If your Leader has the "Egghead" type, this Character gains [Rush] during this turn. Then, your opponent adds 1 card from the top of their Life cards to their hand." With a Leader that is not {Egghead} the "If" fails, so the opponent must keep their Life. | With ST09-001 Yamato as Leader there is no [Rush] (correct), but the opponent still adds their top Life card to their hand (4 Life become 3). The "Then" step is outside the "If" guard. | 3 |

The other 20 cards had no disagreement. Open readings that the tests deliberately do not assert: see API-GAPS-d.md (item 1).
