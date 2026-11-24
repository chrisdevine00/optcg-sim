# OP-16 group A independent card tests: disagreements with the engine

Cards: OP16-001 .. OP16-003, OP16-005 .. OP16-015, OP16-017 .. OP16-022, OP16-025 .. OP16-027, OP16-029 .. OP16-037.

Each disagreement is an `it.fails` in the card's test file. Both are left for the review to settle.

## OP16-022 Monkey.D.Luffy (Leader): "the only Characters on your field are {Impel Down}" with no Characters

- **Text:** "[Activate: Main] [Once Per Turn] If the only Characters on your field are {Impel Down} type Characters, set up to 2 of your DON!! cards as active."
- **My reading:** the condition is FALSE when I have no Characters at all, so no DON!! is set active. This is the answer on file: M6b-Q21 in `docs/research/m6b-runtime-audit.md` section 7 ("answered by analogy, opposite" to the auditor), resting on QA-OP17 OP17-118 / OPEN-QUESTIONS E-Q4 ("only Characters without a Counter" is false with 0 Characters).
- **Engine behaviour:** with 0 Characters the activation is offered and resolves: with 3 active and 7 rested DON!! it leaves 5 active and 5 rested (treated as vacuously true). With one non-{Impel Down} Character it is correctly not offered / does nothing.
- **Test:** `OP16-022.test.ts`, "M6b-Q21: with no Characters at all the condition is false and no DON!! is set active".
- **Source:** M6b-Q21 (answered), E-Q4, QA-OP17 OP17-118.

## OP16-035 Roronoa Zoro: "Rest up to 1 of your opponent's cards" is resolved without asking when the opponent has DON!!

- **Text:** "[On Play] Rest up to 1 of your opponent's cards. Then, you may trash 1 card from your hand. If you do, give up to 3 rested DON!! cards to your Leader."
- **My reading:** the player chooses the card, or nothing ("up to 1"), among the opponent's Leader, Characters, Stage and DON!! cards (M4b-1 / E-Q3: "Rest up to 1 of your opponent's cards" may rest a Leader, Character, Stage or DON!! card). A `choose` decision is owed whenever there is more than one candidate.
- **Engine behaviour:** when the opponent has DON!! in the cost area (with or without Characters and a Leader), no decision is asked: one of the opponent's active DON!! is rested at once (`DonRested` for p2, count 1) and play goes on to the "you may trash" question. Without any opposing DON!! the `choose` is asked as expected (candidates: Leader and Characters, `done` allowed).
- **Test:** `OP16-035.test.ts`, "the player is asked which card to rest even when the opponent has DON!! in the cost area".
- **Source:** card text; M4b-1 (closed 2026-11-16), E-Q3.
