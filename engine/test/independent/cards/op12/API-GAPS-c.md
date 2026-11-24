# OP-12 group C independent card tests: API and observation gaps

- **`CardView` has no base cost.** The "base cost" conditions (OP12-089 Hack [On K.O.], OP12-102 Shirahoshi) are tested through
  the printed costs of the scenery and through effects (a Morley whose current cost is 8 but whose base cost is 4 is a legal
  Hack target), never by reading a base cost.
- **Unscripted Events cannot be played** (no `playCard` action is offered), so opposing removal in the tests is limited to scripted
  cards: OP11-018 Honesty Impact (-4000, then K.O. 6000 or less: reaches any base cost) and OP11-061 Gum-Gum Jet Culverin.
- **A K.O. of my own Doflamingo or Kuma on my own turn cannot be built** (no scripted self-K.O. cost or effect names their types), so
  "[Opponent's Turn] [On K.O.]" is not tested for the negative case "K.O.d on my turn". The positive case (K.O.d on the opponent's
  turn by battle and by an effect) is covered.
- **Multi-pick lists omit later candidates.** For an exact-N or "up to N" pick the engine lists only picks that can start a canonical
  selection, so "every candidate is offered" cannot be asserted for N >= 2 (OP12-087's two-card hand trash asserts only that the offered cards
  are in the hand).
- **No observation of a replacement's "instead".** For Shirahoshi's Life turn-face-up the test reads `CardView.faceUp` of the Life cards;
  a Life card already face-up as the top card was not tested (M4b-3 covers a cost, not a replacement).
- **[Your Turn] [On Play] played on the opponent's turn** (OP12-105 Lammy) could not be reached: no scripted card plays her during
  the opponent's turn.
