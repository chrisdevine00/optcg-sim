# Backlog

Ordered by value (PROMPT.md "After M10"). Items carried from closed milestones carry their source.

1. **Warlord at least 65% against Pirate** (PLAN M5b target, not met; DECISIONS 2026-11-23). Measured 61.5% (123/200), flat in budget. Leads: tune the heuristic's weights by self-play on a larger sample than 200 games; give the opponent's turn in rollouts a policy that removes Characters and counters like a player; score defence decisions on shared samples. Use the parallel gate runner pattern (13 processes, about 13 minutes per 200 games) and always re-check on fresh seeds.
2. **M10 must close these M6 carries** (docs/reviews/m6-review.md; F17 states them as requirements): M6-3 arrow keys in the builder grid, Tab between panes, Enter/Backspace to add and remove, `A` to cycle art (F17 steps 1 and 6); N-2 the grid's 127 Tab stops (roving focus fixes it) and a skip link back from the deck pane; M6-14 colour and set filters, DON!! deck size, group by category; severity 1 items M6-11, 15, 17 to 21, N-4 (Setup's automation line beside an invalid deck; "Unknown card" for every card when loading fails).
3. Sealed mode.
4. More AI depth: Emperor measurably stronger than Warlord.
5. More archetypes.
6. Japanese-format toggle.
7. Replay sharing by URL.
