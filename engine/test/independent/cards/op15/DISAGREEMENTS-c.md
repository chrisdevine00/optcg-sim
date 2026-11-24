# Disagreements: OP-15 independent tests, group C

None. All tests written from the verified card text and the rules agree with the scripts' observable behaviour, so no `it.fails` was needed.

Readings the tests deliberately do not assert, because the rules on file leave them open:

- **OP15-098 Luffy (Leader):** the text says "removed from the field by your opponent" with no "effect". Whether a battle K.O. is covered is open (M6b-Q7 for the sibling EB05-061). No test asserts battle either way.
- **OP15-115 Impact Dial:** whether the "Then, add 1 card from the top of your Life cards" step resolves when "up to 1" K.O. chose no target is not settled by the rules on file (RD 122 covers only a failed "If"). Not asserted.
- **OP15-109 Nico Robin:** the "Then, play up to 1 {Sky Island} ..." step is read as gated by the Leader condition (RD 122, M4b-5). The test asserts that reading; a different reading would need a ruling.
