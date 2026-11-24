# Disagreements: ST-32 to ST-36 independent tests, group B

Cards: ST32-001, 002, 004, 005; ST33-001, 002, 003, 005; ST34-001, 002, 005; ST35-001, 002, 003, 004, 005;
ST36-001, 002, 003, 004.

None. Every test passes against the scripts: there is no `it.fails` in this group.

Readings that a reviewer may want to re-check, because the tests pin them and the card text can carry another:

- **ST34-002 Cracker, empty DON!! deck:** "add up to 1 DON!! ... Then, K.O. up to 1 ..." with no DON!! left to add: the test pins that the K.O. still resolves (RD 122: a "then" that cannot be resolved does not stop the clause after it; only a failed "if" does).
- **ST35-003 Karasu, ST36-004 Bartolomeo, ST36-001 Cavendish, deck of exactly N:** the tests pin RL-26 (emptying the deck by a cost or by the draw loses the game at once) rather than "the effect is unusable".
- **ST32-002 Oden and ST32-005 Zoro:** the engine offers a "cannot be rested" Character as a target of "rest up to 1"; the test only requires that it stays active (rules-digest 57), not that it is not offered.
