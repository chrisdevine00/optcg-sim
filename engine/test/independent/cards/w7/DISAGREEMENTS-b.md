# Wave 7 group B (OP12-036, OP12-117, OP13-064, OP13-105, OP14-053, OP14-060, OP15-093, OP16-080, ST15-001, ST20-003, ST36-005): independent test disagreements

No disagreement was found: every test in this group passes against the scripts as written, so there is no `it.fails` entry.

Readings the tests rely on, or leave open (each is also in the test header):

- M6b-Q77 (ST15-001 Atmos): whether a cost that adds a Life card to the hand ("You may add 1 card from the top of your Life cards to your hand:") can still be paid after the restriction is NOT asserted. The restriction is asserted through an effect with no cost (OP15-115 Impact Dial: the K.O. happens, the Life card is not added). The Kid (OP09-075) tests are before the attack, for a non-Newgate Leader, or in the next turn.
- M6b-Q83 (OP13-064 Roger): whether a Leader whose own type includes "Roger Pirates" is exempt is not asserted; the tests use a Leader without that type.
- M6b-Q84 (OP14-053 Vista): the Leader's "base power" is asserted as the printed power (6000), unaffected by a +3000 Counter or by DON!! given; whether a stored base-power change counts is not tested.
- M6b-Q86 (ST36-005 Kid): not asserted: whether a Kid Leader is a legal redirect target, and what happens when no Kid with 5000+ base power exists after the cost is paid. When only this Kid qualifies the tests accept either "no question" or a one-candidate question.
- M6b-Q78/Q81: Slam Gibson is asserted for a face-down placement in the owner's Life; the face state of looked-at cards (ST20-003, OP13-105) is not asserted. When only one end can be used (one payable Life end, one Life card) the tests accept both "asked" and "not asked".
- M6b-Q85 (OP14-060, OP16-080): after a redirect the Block Step is asserted (a [Blocker] of mine can still be declared); whether timings fire again is not asserted, only that [Once Per Turn] is respected.
- OP15-093 (M6b-Q76): the granted "Slash" attribute is observed only through OP12-036 Zoro's protection (a <Slash> attacker cannot K.O. it), not through a view field; whether it replaces or adds to the printed attributes is not asserted (Luffy P-041 prints <Strike>).
