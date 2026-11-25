# Wave 7, group A: independent test API gaps

Observations the public API and the scripted-card pool did not let a test make.

| # | Card | Gap |
| --- | --- | --- |
| G1 | OP10-022 Trafalgar Law, OP11-116 | The data prints the official exact `"Supernovas"` type as `"X"`, and a substring match as `type including "X"`. No card in the pool has a type that merely contains "Supernovas", so exact versus substring is untestable. |
| G2 | EB02-053, OP10-116 | M6b-Q81: the face state of a looked-at card after it is placed, and what the other player is told about the look, cannot be asserted (open). The `known` map and `project` views were not used: the tests stay on the god view (`TestGame.zone`). |
| G3 | OP11-101 Bege | Own-effect removal is tested with OP11-116 (placing my own Character into my Life); no scripted card K.O.s my own Character, so "my own K.O. effect is not replaced" is tested only for that placement. Whether a declined use spends the [Once Per Turn] is open and not asserted. |
| G4 | OP10-022 | A Character whose cost differs from its printed one (M6b-Q84) is not tested: no cheap scripted card changes a cost. A revealed Life card's face state afterwards is not asserted. |
| G5 | EB03-006, EB04-023 | Paying "-5000" a second time on a Leader already at 0 power is not asserted: two copies cost more than 10 DON!!, and the power floor (0 versus negative) is not settled by the rules on file. A draw from a deck with fewer cards than asked is not tested. |
| G6 | OP09-101 | The Life end ("top or bottom") is the attacker's choice; the opponent's view of it is not tested (hidden-information projections are covered by the engine's own leak tests). |
