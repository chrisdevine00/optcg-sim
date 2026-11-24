# OP-12 group A (OP12-001 .. OP12-039): independent test API gaps

Observations the public API and the scripted-card pool did not let a test make.

| # | Card | Gap |
| --- | --- | --- |
| G1 | OP12-001 Silvers Rayleigh | The deck-building rule ("cannot include cards with a cost of 5 or more") is not a board effect. It is tested through the public `deckIssues` check (format `free`), not through a played game. |
| G2 | OP12-033 Helmeppo | "cost of 5 or less" is a current-cost limit. A p2 Character whose current cost is above 5 while its printed cost is 5 or less, on p2's own turn (the only time [On Block] fires), needs a +cost source on the opponent's side. The one scripted source (OP13-120 Activate: Main) has a second effect that this group does not drive, and the other sources act on p1's turn only (EB04-046 Doll is [Opponent's Turn]). Only printed-cost boundaries (5 yes, 6 no) are asserted. |
| G3 | OP12-022, OP12-029 | The current-cost direction "printed cost above the limit, lowered by an effect" is observed through OP17-097 (-1 cost to all opponent Characters), which is the only scripted -cost effect playable by p1 with a Leader of any colour (OP02-117 and similar Events are not scripted). The "-1" step is the only size tested. |
| G4 | OP12-003, -009, -013 and the other reveal costs | What the opponent sees of a reveal cost (the 2 Events shown, then hidden again, CR 11-2-2) is read from `CardRevealed` events (`revealedByEffects`); the projection of the other player is not inspected here (the property tests cover leaks). |
| G5 | OP12-030 Dracule Mihawk | "You cannot play Character cards with a base cost of 7 or more" cannot be tested at cost 7 exactly: Mihawk leaves only 6 active DON!! (10 - 8 + 4), so a printed cost-7 card cannot be paid for anyway. The bar is observed with OP17-005 (printed cost 10, current cost 6 in hand with an opponent 10000-power Character) and the cost-6 Characters stay playable; the 6/7 boundary itself is not reached. |
