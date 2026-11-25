# OP-10 group C: API gaps

Observation gaps met while writing the OP10-075 .. OP10-111 tests (none blocks a test).

- **Forced picks are not asked.** A "rest 1 of your Dressrosa Leader or Stage" cost with exactly one candidate, and a "place 2 {Thriller Bark Pirates} cards" cost with exactly 2 candidates, ask nothing; with more candidates a `choose` (purpose `cost`) is asked. A test cannot tell "paid on its own" from "never asked" except through the outcome, so the helpers (`payRestDress`, `payTrash`) answer a cost pick only when one is pending.
- **A single-card "up to 1" over the opponent's Life top is an `optional`, not a `choose`** (OP10-109: "trash up to 1 card from the top of your opponent's Life cards"); with 0 Life the question is either not asked or asked with accept illegal, so the test uses `unusable`.
- **"Add up to 1 DON!!"** is a `choose` with purpose `mode` and options "1" and "0"; recognised through `asksCount`, as in the earlier groups.
- **No view of the "played this turn" flag.** OP10-086 Shiryu's condition ("was played on this turn") can only be observed through the effect's outcome (a Shiryu placed in the scenario counts as not played this turn).
- **Keywords come from `CardView.keywords`.** Granted keywords ([Rush], [Double Attack], [Blocker]) are asserted there, and through `legalActions` (blockers, attacks) where the game uses them.
