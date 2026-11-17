# Disagreements found by the group C independent tests (M4b wave 2)

Each entry is a test kept as `it.fails` in this folder. Remove the `.fails` when the engine or the
reading changes. Expectations come from the printed text and the Comprehensive Rules, never from
observed engine behaviour.

## D-1. "Give up to N DON!!" always gives the maximum, and Brook's recipient is mandatory

- **Cards:** ST01-011 Brook, OP15-058 Enel (Leader).
- **Text:**
  - ST01-011: "[On Play] Give up to 2 rested DON!! cards to your Leader or 1 of your Characters."
  - OP15-058: "... Then, give up to 4 rested DON!! cards to 1 of your Characters."
- **Expected:** "up to N" lets the player choose any number from 0 to N (CR 8-4-4-1: "up to" allows 0).
  Giving only 1 of 2 (or 1 to 3 of 4) is a legal choice, and for Brook so is giving none. The
  rested DON!! left behind can matter, for example to pay a later DON!! −X cost or to keep a
  DON!! on the Leader for another effect.
- **Engine:**
  - Brook: one `choose` for the recipient with min 1 / max 1, then every rested DON!! up to 2 is
    given with no further question. The only reachable outcome is `given = 2` (checked with
    `outcomes()`).
  - Enel: the recipient is optional (min 0, max 1, so "none" works), but if a Character is picked all
    4 rested DON!! are given. Reachable outcomes are `given = 0` and `given = 4`.
- **Tests:** `ST01-011.test.ts` (two `it.fails`), `OP15-058.test.ts` (one `it.fails`).
- **Confidence:** medium. The text and CR 8-4-4-1 favour a free choice of the number. The M4a
  reading of "give up to 1 rested DON!!" (one DON!!) cannot show it. No official Q&A found.

## D-2. One K.O. effect on two Characters: a replacement should apply per Character

- **Card:** OP17-095 Roronoa Zoro.
- **Text:** "If one of your Characters would be removed from the field by your opponent's effect, you
  may place 3 cards from your trash at the bottom of your deck in any order instead."
- **Setup:** the opponent's OP17-098 Kong Gun ("K.O. up to 2 of your opponent's Characters with a
  cost of 6 or less") picks Zoro and another Character of mine.
- **Expected:** each Character's removal is its own event (CR 8-1-3-4: the replacement is
  tied to "one of your Characters"; CR 8-1-3-4-3 only forbids applying the same replacement to
  the same event twice). So the owner is asked per Character and pays 3 cards each time:
  - with 3 cards in the trash only one Character can be saved (after the first payment the second
    replacement is impossible, CR 8-1-3-4-5), so exactly one is K.O.'d;
  - with 6 cards in the trash both can be saved, trash 0, deck +6.
- **Engine:** asks once ("Use Roronoa Zoro's effect instead of the K.O. of Roronoa Zoro?"). If
  accepted, BOTH Characters stay and only 3 cards are moved (trash 6 → 3, deck +3). If declined,
  both are K.O.'d.
- **Tests:** `OP17-095.test.ts`, two `it.fails` ("one effect removing two Characters with only 3
  cards in the trash", "each Character is its own removal").
- **Confidence:** medium-low. The CR does not spell out simultaneous removal of two cards by one
  effect, and no official Q&A was found, so the engine's "one payment, one event" reading is not
  clearly wrong. The single-Character behaviour is correct and fully tested.

## Not disagreements, but readings worth a second look (all tests pass)

- **OP15-074 / 075 / 076 "If your Leader is [Enel], ... Then, ...":** the tests expect that with a
  non-Enel Leader the clause after "Then" does not resolve either (CR 4-10-2: a "then" after a
  failed "if" cannot resolve; CR 8-3-3). The engine agrees. If official rulings later say the "Then"
  clause stands alone, those tests need flipping.
- **OP15-066 Satori "place them at the top or bottom ... in any order":** the tests accept both cards
  together on top or together on the bottom, with no split (same reading as the M4a OP17-050
  test). The engine offers exactly those four arrangements.
- **ST10-010 Trafalgar Law:** the engine lets the opponent choose which 2 cards of their own hand are
  trashed. The tests do not assert who chooses (the text does not say).
- **OP15-088 / any "trash 3 from the top of your deck" cost:** paying it with exactly 3 cards left
  empties the deck and loses the game at once (CR 9-2-1-2). The engine agrees; the test
  documents it.
