# OP-10 group A (OP10-001 .. OP10-035, OP10-042, OP10-099): independent test API gaps

Observations the public API and the scripted-card pool did not let a test make.

| # | Card | Gap |
| --- | --- | --- |
| G1 | OP10-032 Tashigi, OP10-034 Franky, OP10-035 Brook, OP10-042 Usopp | No scripted card lets a player remove or K.O. their **own** Character by an effect at a point a test can reach without paying for another card's script, so "by your opponent's effect only" (Tashigi) and "your own removal does not draw / does not replace" are tested with the opponent's effects (EB01-059 Kingdom Come, OP14-048 Shiryu, OP12-104 Sentomaru's [Trigger]) and the negative cases of battle and own-turn K.O. only. |
| G2 | OP10-042 Usopp | The official RL-32 cost-order Q&As (OP02-106 Tsuru, OP07-080 Kaku, OP03-078 Issho against OP04-089 Bartolomeo) cannot be replayed: those cards are not scripted. Only the static +1 cost (and its effect on a cost filter, via OP12-104) is tested. |
| G3 | OP10-042 Usopp | "If you have 5 or less cards in your hand" failing on a first removal (Once Per Turn spent, colon-less If) cannot be told apart from a skipped use: nothing in the pool shrinks my hand during the opponent's turn between two removals. |
| G4 | OP10-099 Kid | The mirror of M6b-Q59 (top Life face-up while a lower Life card is face-down) is not asserted: no ruling is on file. |
| G5 | OP10-035 Brook | Whether the opposing Leader is a legal target of a "Leader or Character with a cost of 5 or less" rest is open (M6b-Q48), so the tests cover Characters only. |
