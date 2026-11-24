# OP-11 group C: API gaps

Observation gaps met while writing the OP11-072 .. OP11-119 tests (none blocks a test).

- **Exact-N picks list only starting cards.** For "trash 2 cards from your hand" (OP11-083, 109) and similar exact-N picks the `pick` actions name only the cards that can start a canonical selection, so `choices` shows a subset. Tests read `reachablePickSets` instead of the offered list.
- **Forced picks are resolved by the engine.** When the candidates equal the required count (3 {Navy} trash cards for OP11-095, exactly 3 Events for OP11-091) no pick is asked and the next prompt is an `order` or the effect's next step. A test cannot tell "forced pick" from "pick skipped"; it checks the outcome.
- **"Use?" is not asked for an [Activate: Main] "you may" cost.** The activation is the choice; there is no `optional` to decline. A test of "declining" for OP11-103 / 107 can only be "never activating".
- **Few scripted older cards as scenery.** OP02-089 Judgment of Hell, OP02-106 Tsuru and others have no script, so tests use scripted scenery (OP07-076 Slow-Slow Beam Sword for a [Counter] DON!! −1 on the opponent's turn, ST06-008 Hina for a cost reduction) or vanilla cards.
- **Face state of a Life card** is readable only through `CardView.faceUp` of the owner's own `zone('life')`; a view for the opponent would hide it, so the tests check it from the owner's side only.
