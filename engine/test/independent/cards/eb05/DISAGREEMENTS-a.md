# EB-05 group A independent card tests: disagreements with the engine

Each entry has a test marked `it.fails` that points here. When the question is settled, either fix the
script and drop `it.fails`, or change the test and delete the entry. Probed against `main` at 0559649
(scripts merged). Confidence is the author's confidence that the engine is wrong, not that the test is
right.

## A-1. EB05-013 Shirley: the Leader boost is offered as a skippable "up to" choice

- **Text:** "[On Your Opponent's Attack] [Once Per Turn] You may rest 1 of your DON!! cards: Your
  {Fish-Man} or {Merfolk} type Leader gains +2000 power during this battle."
- **Test:** `EB05-013.test.ts`, "the Leader boost has no "up to": after paying, the player cannot choose
  to skip it".
- **Expected:** once the DON!! is rested the effect resolves on the Leader with no choice. The text says
  "Your ... Leader", not "up to 1 of your ... Leader", so nothing is optional after the cost (CR 8-1-2:
  only "can/may" is optional, and that "may" is the cost; CR 8-4-4-1 allows 0 only for "up to").
- **Engine:** after paying, a `choose` decision "choose up to 1 of your Leader" (`min: 0`, `max: 1`,
  `purpose: target`) with a legal `done`. The player can pay the DON!! and then pick nothing.
- **Source:** plain reading plus CR 8-1-2 / CR 8-4-4-1 (rules-digest 112, 124).
- **Confidence:** medium. Impact: a player can pay the cost and refuse the boost (never useful, so low
  impact), and the UI shows a pointless choice. Every other test in the file picks the Leader when asked.

## A-2. EB05-017 Mermaid Cafe Dancers: same shape as A-1

- **Text:** "[On Your Opponent's Attack] You may rest 1 of your DON!! cards and trash this Character: Your
  {Fish-Man} or {Merfolk} type Leader gains +4000 power during this battle."
- **Test:** `EB05-017.test.ts`, "the Leader boost has no "up to": after paying, the player cannot choose
  to skip it".
- **Expected / Engine / Source:** as A-1. Here the skip is more visible: both halves of the cost (the
  rested DON!! and the trashed Dancers) are already paid when the player can still pick nothing.
- **Confidence:** medium.
