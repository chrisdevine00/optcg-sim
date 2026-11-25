# Leftovers group C: API gaps and observations

Observations met while writing the ST24, ST25 and ST28 tests (none blocks a test).

- **Exact-1 hand pick with one candidate is asked.** ST24-001 with Bege as the only hand card: the "trash 1 card from your hand" pick has a single candidate (the drawn card) and the engine still asks it (`choose`, purpose `target`). The tests accept both an asked and an auto-resolved pick. Harmless, but it differs from the convention that an exact-1 pick with one candidate is chosen without a prompt.
- **"Up to 1" pick over opposing Characters with no candidate is skipped, not asked empty.** ST24-005 with only cost 6+ opposing Characters: no prompt. The tests accept either. (An empty hand pick is asked; see the OP-14 notes.)
- **[Activate: Main] with a "You may" cost has no decline step after activating.** ST25-004: choosing to activate is choosing to pay, and the engine goes straight to the cost pick (no `optional`, no `done`). The tests treat "not activating" as the decline.
- **DON!! count question timing is left open by the tests.** ST24-003 and ST24-005 ("set up to 1 DON!! as active", the latter "at the end of this turn"): the count question may be asked when the effect resolves or at the end of the turn. The tests answer it wherever it is asked (`countIfAsked`); only the "choose 0" tests require that the question is asked at all.
- **Shared Wano scenery.** The brief says V.c6 and V.c7 are {Land of Wano} Characters; in the card data OP02-007 Thatch and OP02-020 LittleOars Jr. are {Whitebeard Pirates}-based, while OP01-010 Komachiyo (cost 1) is {Land of Wano}. The tests use their own constants (`SCL` in `kit-lfc.ts`) with types noted.
- **Given DON!! add +1000 each on the owner's turn only.** ST28-005 expectations include that (0 printed, +1000 per DON!!, +3000 once with 2 or more).
