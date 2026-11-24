# Disagreements: OP-16 independent tests, group B

Cards: OP16-038, 039, 040, 042, 043, 044, 045, 047, 048, 049, 050, 051, 052, 053, 054, 055, 056, 057,
058, 059, 060, 063, 066, 068, 069, 070, 071, 072, 073, 075, 076, 081.

Each entry is an `it.fails` in the named test file. The review settles which side is right.

## B-1 "Place 2 cards from their hand at the bottom of their deck in any order" gives the opponent no order choice (OP16-047)

- **Card and test.** OP16-047 Donquixote Doflamingo, `"in any order": both orders of the two cards at the bottom are reachable by the opponent`.
- **Card text.** "[Activate:Main] You may rest this Character: If your opponent has 8 or more cards in their hand, they place 2 cards from their hand at the bottom of their deck in any order."
- **My reading.** The opponent (the owner of the cards) chooses the order in which the two cards go to the bottom, so for any pair both orders are available. The order is hidden information (hand to deck is secret to secret) but it fixes which card is drawn first later.
- **Engine.** After the 2-card `choose` for p2 there is no `order` decision and no order pick. Exploring every action p2 can take (`outcomes`) reaches exactly one bottom order per pair of cards (the order of the hand cards), never both.
- **Source.** rules-digest item 47 (CR 3-1-7: when several cards enter an area at once their owner chooses the order unless an effect specifies; CR 3-1-8 for the hidden case) and the card's own "in any order". Other "rest to the bottom in any order" steps of this set (for example OP16-059, OP16-072) do offer an order, so this is the same wording handled differently.
