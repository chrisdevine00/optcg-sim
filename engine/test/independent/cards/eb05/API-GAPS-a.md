# EB-05 group A independent card tests: API gaps

- **Pick order hides candidates.** Instance ids are random strings and unordered picks must be made in
  canonical (sorted id) order, so for "pick 2 of 3" the first `choose` shows only some candidates.
  `choiceCards` is therefore not "the set of eligible cards" when `min > 1`. Tests use
  `reachablePickSets` (union of reachable picks) or pick by hand instance with `choose`. A
  `Decision.candidates` list would remove the workaround.
- **Printed [Blocker] without a data keyword.** Several older Characters print "[Blocker] (After your
  opponent declares an attack...)" in their text but have `keywords: []` in the card data and no script
  (for example ST08-006, OP03-104, OP05-090). In the engine they are not Blockers. EB05-010 needs a
  Wisdom Character with [Blocker]; the tests use OP17-046 Gloriosa, whose keyword is in the data.
  Not an EB-05 card, noted for the data audit.
- **[Your Turn] [On Play] on the opponent's turn (EB05-016).** No public way to put a Character into play
  from hand on the opponent's turn without a scripted card, so "the [On Play] does not run on the
  opponent's turn" is only covered through the [Trigger] path (the card is not played at all).
- **Reveal visibility.** Costs and effects that "reveal" cards from hand (EB05-004, -007, -008) cannot
  be checked for what the opponent sees; the tests assert only that the cards stay in hand.
- **"Used" state of a [Once Per Turn] auto effect.** Only visible indirectly (the second occurrence is
  not offered). EB05-010 and EB05-013 are tested that way; there is no query for the spent flag.
- **Cost-pick of "rest 1 of your cards" (EB05-019).** The choice covers DON!! classes and card
  instances; the test counts rested things (`restedThings`) because the helper cannot say which card
  was picked.
