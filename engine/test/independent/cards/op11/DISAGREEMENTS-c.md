# OP-11 group C: disagreements with the scripts

Cards OP11-072 to OP11-119 (30 cards: 072, 075, 076, 077, 080, 082, 083, 084, 085, 086, 090, 091, 095, 096, 097, 098, 099, 100, 103, 104, 107, 108, 109, 110, 112, 114, 115, 117, 118, 119). The independent tests were written from the verified card text and the rules only.

**None.** Every test passes against the scripts; no `it.fails` was needed.

Readings the tests rely on (each follows the rules digest or an answered question, but a reviewer may want to confirm them):

- **Turning a Life card face-down needs a face-up top card** (OP11-100, 103, 104, 107, 108; G8 in the runtime audit): with a face-down top Life card the cost is unpayable. This mirrors the official OP13-109 / OP15-114 ruling for "turn face-up" (M4b-3, CR 1-3-2-1) and is the audit's design; there is no official ruling for the face-down mirror itself. OP11-117 (turn face-up) is tested the same way round: it needs a face-down top card.
- **"Then" after a failed "If" does not resolve (M4b-5)** is asserted for OP11-082 Aramaki (non-{Navy} Leader: no cards are trashed from the deck).
- **An [Activate: Main] with a "you may" cost asks no extra yes/no**: choosing to activate is choosing to pay (OP11-072, 103, 107, 117). The engine does the same.
- **OP11-097**: whether the Event itself counts as a trash card when the "Then" checks "10 or more cards in your trash" is not asserted (only 10 already there = true, and 8 = false are).
- **OP11-095 / OP11-082**: a "Then" that follows an "up to 1" left empty (give no DON!!, grant to nobody) is not asserted either way.
