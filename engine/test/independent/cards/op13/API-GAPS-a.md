# OP-13 group A (OP13-005 .. OP13-031): independent test API gaps

Observations the public API and the scripted-card pool did not let a test make.

| # | Card | Gap |
| --- | --- | --- |
| G1 | OP13-008 Emporio.Ivankov, OP13-017 Monkey.D.Dragon | No scripted card lets a player K.O. or remove their own Character by an effect without a type limit (EB05-045 K.O.s only {Baroque Works}; OP05-087 and the bounce/trash Events such as OP02-067 are not scripted), so "your own effect is not replaced" cannot be tested for K.O. Own-effect removal is tested only where a scripted source exists. Removal other than a K.O. (a trash or bounce by the opponent) cannot be tested for Dragon's "removed from the field" either. |
| G2 | OP13-028 Shanks | "You cannot play cards from your hand" is tested for plays from the hand only; no scripted card plays from the trash or deck at a point a test can reach, so the hand-only scope (M6b-Q33) is not observed. |
