# API gaps: OP-09 independent tests, group C

None of these stopped a test from being written. Each says what the public API leaves open and how the tests cope.

1. **Exact-N picks list only the cards that can start a selection.** A "trash 2 cards from your hand" pick (OP09-105 Sanji) offers a subset of the hand at the first pick (the canonical order), so a test cannot read the full candidate list from `choices`. Tests assert membership (every offered card is in the hand) and pick by card id. Exact-1 picks (OP09-087, OP09-092, OP09-111) list every card and are compared in full.
2. **A forced cost pick may not be asked.** With exactly one candidate (OP09-089 with one card in hand) the engine may decide the hand cost itself. Tests answer the pick only when it is pending and assert the outcome.
3. **Mode ids are not stable.** OP09-084's three keywords are options `0`, `1`, `2`; tests pick by the label text ("Gains [Banish]") and never by id.
4. **Negation is observable only through `negated` and the effect's outcome.** OP09-093 checks `CardView.negated`, the Leader's power (EB04-001's [Opponent's Turn] +2000 with 1 Life) and a negated [Blocker] missing from the Block Step; there is no list of which effects a negation removed.
5. **A [Trigger] decision is asked for every Life card taken.** After a hit the defender owes `trigger` even when the card has none; `activate: true` is offered only when the card has a scripted [Trigger] that can be paid. OP01-104 Speed has no script in this tree (`activate: true` was not offered), so scenery [Trigger] cards are used only as Life cards that are taken to hand or banished, never activated.
6. **The scenario caps DON!!.** DON!! given plus the cost area must not exceed 10 (OP09-088 puts 1 on Shiryu and 9 in the cost area; OP09-075 sets `donDeck` when it needs a non-empty DON!! deck with fewer than 10 on the field).
7. **The Life card being resolved is in no area.** Life-count conditions in a [Trigger] (OP09-100, OP09-108) read the count without that card; the tests state this in their text because the API shows only the zones.
