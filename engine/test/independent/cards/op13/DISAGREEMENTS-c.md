# Disagreements: OP-13 independent tests, group C

None. All 233 tests written from the verified card text and the rules agree with the scripts' observable behaviour, so no `it.fails` was needed.

Readings the tests deliberately do not assert, because the rules on file leave them open:

- **OP13-066 Silvers Rayleigh (M6b-Q34):** when the DON!! is added ("add up to 1 DON!! card and set it as active at the end of this turn"). Tests assert only that my active DON!! count is unchanged during the turn and that, once my turn has ended, the DON!! is on my field and active. The count question is answered at the end of the turn in the engine; the tests do not require that timing.
- **OP13-066:** whether "Then, add ..." resolves when "rest up to 1" chose no target (the OP15-115 note: RD 122 covers only a failed "If"). Not asserted. A failed "If" (no DON!! given) is asserted to block both clauses (RD 122, M6b-Q13).
- **OP13-075, OP13-077 (cost before the colon, "If" after it):** with a false "If" the cost may or may not be paid; tests assert only that no DON!! is added / nothing is K.O.'d.
- **OP13-082 Five Elders:** "If your Leader is [Imu]" is read as an activation condition (CR 8-4-1 (1): conditions are checked before costs), so with another Leader the ability is not offered. If an engine offered it and paid the cost, the test would fail; the card text puts the "If" before "you may", so this is the CR reading.
- **OP13-078 Oro Jackson:** a Roger Pirates Character saved by OP13-060 Toki's "trash this Character instead" (is the Toki trash a removal by the opponent's effect?) is not covered.
- **OP13-060 Toki:** Toki herself K.O.'d by an effect (a replacement that trashes the Character that would be trashed anyway): the test accepts an offer or none and asserts only the final board.
- **OP13-080 / OP13-083:** whether the engine excludes a protected Character from the opponent's target list or lets the opponent pick it and fails the removal. Tests assert only that the Character is still on the field.
