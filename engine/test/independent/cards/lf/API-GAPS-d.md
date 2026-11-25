# API gaps: leftovers group D independent tests (ST33-004, ST28-004, OP11-088)

None of these stopped a test from being written.

1. **Exact-N DON!! cost picks list a subset at the first pick** (ST28-004, "return 2 total of your
   given DON!!"): with three cards holding one given DON!! each, the first pick offers only two of them
   (the cards that can start a selection). The test asserts membership and picks by card.
2. **Cost-area DON!! counts come from `queries.don`** (`active`, `rested`, `given`, `deck`); the
   returned DON!! of ST28-004 are seen only through those counts and `CardView.don`.
3. **A Hand card's current cost is `CardView.cost`** of the hand instance (ST33-004); no separate
   "effective cost in hand" query exists, the tests read the card view.
