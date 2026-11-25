# Wave 6 group B (OP10-027, OP11-102, OP12-058, OP12-075, OP12-080, OP12-109, OP12-113, OP13-106, OP13-119, PRB01-001, ST16-002): independent test disagreements

No disagreement was found: every test in this group passes against the scripts as written, so there is no `it.fails` entry.

Readings the tests rely on, or leave open (each is also in the test header):

- M6b-Q72 (OP11-102 Camie, OP13-106 Conney): when the watcher resolves relative to the [Trigger] is not asserted. Camie is checked on the state after everything has resolved; Conney's [Blocker] is asserted from the next attack on, not for the attack that dealt the damage.
- M6b-Q73 (OP10-027 Kin'emon): the order of the two cards at the bottom of the deck is not asserted, only that they are the last two cards.
- M6b-Q75 (OP12-075, OP13-119): the Character just returned is in the opponent's hand when they play, so it is a candidate whatever the reading; with no DON!! left in the DON!! deck only the result (nothing added) is asserted, not whether the question is asked.
- M6b-Q70 (PRB01-001 Sanji): a [Trigger]-only Character (OP01-009 Carrot) qualifies as "without an [On Play] effect" under every reading, since the filter names only [On Play]; Characters whose [On Play] shares a line with [Blocker] or [Your Turn], or follows a static line, are asserted not to qualify.
- OP12-109 Pacifista, OP12-113 Zoro [Trigger]: "K.O. up to 1 ... and add this card to your hand" with the K.O. pick left empty is asserted to still add the card ("and" joins two actions of one effect, CR 4-10-2). A different reading would not add it; no ruling was found.
- OP11-102 Camie: whether choosing the [Once Per Turn] is spent when the "If" fails (opponent at 1 Life) is not asserted: it is not observable without a way to raise the opponent's Life.
- PRB01-001 Sanji: whether choosing no Character spends the [Once Per Turn] is not asserted (no ruling).
