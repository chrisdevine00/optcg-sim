# Independent card tests, M4b group B: disagreements with the engine

Two entries. Both tests are marked `it.fails` with a comment that points here, so the suite stays
green while the question is open. Everything else in group B (about 380 tests) agrees with the
engine.

## B-1. "Give up to 1 rested DON!! card to ..." cannot give 0 DON!!

- **Cards:** ST21-014 Monkey.D.Luffy (`[When Attacking] Give up to 1 rested DON!! card to your
  Leader or 1 of your Characters.`) and ST31-005 Thousand Sunny (`[Activate: Main] You may rest this
  Stage: Give up to 1 rested DON!! card to 1 of your [Monkey.D.Luffy] cards.`). Same shape as
  ST01-001 and OP12-015 [On Play].
- **Tests:** `ST21-014.test.ts` ("up to 1: giving nothing is allowed") and `ST31-005.test.ts`
  ("up to 1: giving no DON!! is allowed"), both `it.fails`.
- **Expected:** "up to 1" is on the DON!! card, so the player may choose 0 (CR 8-4-4-1, 1-3-5-1).
  With 0 chosen no DON!! is given and the cost (resting the Stage) stays paid.
- **Engine:** the only decision is a target `choose` with `min: 1, max: 1`
  ("give DON!! to 1 of your Leader or Characters"). A recipient must be picked, and the DON!! is
  given. There is no way to give nothing, and `done` is not offered.
- **Support:** CR 8-4-4-1 ("up to"); `rules-digest.md` line 60 (QA-GR "up to ... choose 0").
- **Confidence:** medium (about 60%). It is a quirk of how the sentence splits the quantifier ("up
  to 1 DON!!" and "1 of your Leader or Characters"). It changes the outcome only for a player who
  does not want to give the DON!!, which is rare. Where the recipient is `1 of your [Monkey.D.Luffy]
  cards` (ST31-005) it also forces the Stage's cost to give a DON!! to a Leader/Character the player
  might not want powered up.

## B-2. "Rest up to 1 of your opponent's cards" offers the opponent's DON!! as a target

- **Card:** OP15-032 Brook, `[On Play] Rest up to 1 of your opponent's cards.`
- **Test:** `OP15-032.test.ts` ("cards is not DON!! cards ... no DON!! class is offered"), `it.fails`.
- **Expected:** the targets are the opponent's cards on the field that are Leader, Character or Stage
  cards. DON!! cards are named separately in the game's own wording whenever they are meant (OP12-037:
  "Characters or DON!! cards"; OP07-026: "Character or DON!! cards"). So a bare "cards" does not
  include them.
- **Engine:** with 3 active DON!! in the opponent's cost area, the target `choose` offers the
  opponent's Leader, the Character and a DON!! class (`{ from: 'costActive' }`). With no DON!! in
  the cost area only Leader, Character and Stage are offered.
- **Support:** no Q&A found in `rulings.md`. The argument is the wording contrast above and the usual
  OPTCG reading that "cards" means Leader, Characters and Stage. Not a CR rule.
- **Confidence:** low to medium (about 55-65%). The CR does call DON!! cards "cards", so the
  engine's reading is defensible. If a Q&A for OP15-032 exists, it settles this.
- **Related, not tested:** OP15-035 Laboon's "rest 2 of your cards" may be paid with DON!! under the
  same reading. The Laboon tests keep every DON!! rested so they hold under either reading.
