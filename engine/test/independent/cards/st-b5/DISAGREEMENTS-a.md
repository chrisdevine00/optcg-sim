# ST-block-5 group A independent card tests: disagreements with the engine

Cards: EB04-061, OP01-120, OP02-013, OP03-122, OP04-083, ST30-002 .. ST30-004, ST30-006 .. ST30-011, ST30-014 .. ST30-017, ST31-002, ST31-003.

Each disagreement is an `it.fails` in the card's test file. Both are left for the review to settle.

## ST30-014 Mr.3(Galdino): the DON!! count of "up to 2 rested DON!! cards each" is not asked, and the target count is cut by the rested DON!! available

- **Text:** "[Activate: Main] You may rest this Character: Give up to 2 of your Characters with 6000 base power up to 2 rested DON!! cards each."
- **My reading:** "up to 2 ... each" lets the player give 0, 1 or 2 rested DON!! to each chosen Character, so (a) a count is asked for each Character, as for every "up to N DON!!" effect (E-Q11, `docs/research/eq11-adddon.md`, `giveDon` asks a `choose` of purpose `mode`, most first), and (b) with 3 rested DON!! and two Characters both may still be chosen (2 to one, 1 to the other).
- **Engine behaviour:** after the Characters are chosen, no count is asked: each chosen Character gets exactly 2 rested DON!! (5 rested DON!! and two Characters leave 1 rested and 4 given). With only 3 rested DON!! the Character choice is capped at 1 target ("up to 1 of your Characters", `max: 1`), so the second Character cannot be chosen at all. With one Character and 5 rested DON!! it also gives exactly 2 without a question.
- **Tests:** `ST30-014.test.ts`, "'up to 2 rested DON!! each': the count per Character is asked (2, 1 or 0), not fixed at 2" and "with 3 rested DON!! and two Characters, both may be chosen (2 to one, 1 to the other)".
- **Source:** CR 8-4-4-1 ("up to" allows fewer), E-Q11 reopened (OP17-R2); the runtime audit also lists this card as a known gap (G16, "allow `each` together with `pick: { upTo: 2 }`").
