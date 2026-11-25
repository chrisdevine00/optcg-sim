# Disagreements: OP-10 independent tests, group D (22 cards: OP10-018 to OP10-021, 039 to 041, 059 to 061, 078 to 080, 096 to 098, 112, 113, 115, 117 to 119)

Each open entry has an `it.fails` in the card's test file, so the suite stays green while the question is
open. When it is settled, fix the engine and drop `it.fails`, or change the test and delete the entry.

## D-1. OP10-119 Trafalgar Law: "Reveal up to 1 {Supernovas} Character from your hand and add it to the top of your Life" never reveals the card (severity 2)

- **Card text:** "[On Play] Reveal up to 1 {Supernovas} type Character card from your hand and add it to the
  top of your Life cards face-down. Then, give up to 1 rested DON!! card to 1 of your {Supernovas} type
  Leader."
- **Test:** `OP10-119.test.ts`, "the card is revealed (CR 11-2-1): the opponent's view of the events names it".
- **What happens:** the event stream holds `EffectActivated` and one `CardMoved` (hand to life, `faceUp:
  false`, no `revealed` flag), and no `CardRevealed`. `projectEvents(events, 'p2')` therefore drops the
  card id: the opponent is never shown which Character went into the Life area.
- **Why it is a disagreement:** CR 11-2-1 says a revealed card is shown to the opponent. The other
  reveal effects in this group (OP10-039 and OP10-059, "look at 5, reveal up to ... and add it to your
  hand") do emit `CardRevealed` and are asserted in the same way.
- **Everything else on the card holds:** the card leaves the hand, goes on top of the Life area face-down
  (Life 4 becomes 5), the "up to 1" pick is asked even with no candidate in hand (max 0), and the
  rested DON!! goes to the {Supernovas} Leader only.

## Readings the tests rely on (no disagreement; each held against the engine)

- **An Event is in the trash while its effect resolves** (rules-digest 74: reveal, rest DON!!, trash, then
  resolve). OP10-097's "10 or more cards in your trash" is therefore asserted at 8 other cards (no
  [Banish]) and 10 other cards ([Banish]); the 9-other-cards boundary, where the Event itself makes the
  tenth, is not asserted.
- **OP10-080's "5 or less cards in your hand"** does not count the Event being played (it is in the trash).
  Asserted at 5 other cards (draws) and 6 other cards (does not).
- **OP10-113 Zoro, [Trigger] with a Leader that is not {Supernovas}:** "You may trash 1 card from your hand:
  If your Leader has the {Supernovas} type, play this card." The "If" is after the colon, so it is an
  effect condition (DECISIONS 2026-11-24): the cost is paid, nothing is played, Zoro is trashed. The test
  asserts the Zoro half (not played, in the trash) and the cost half in separate sentences of the same
  test; both readings of the check agree on the Zoro half.
- **OP10-118 Luffy, once per turn:** only "the first K.O. by an opponent's effect is prevented and a later
  one in the same turn happens" is asserted. Whether the protection is spent when no K.O. was attempted
  is M6b-Q36 (open) and is not asserted.
- **OP10-018, OP10-020 "Then" after an "up to 1" that is skipped:** whether the second step is still asked
  after the first target pick was left empty is not stated by the card. The tests assert only what both
  readings share (the second pick, if asked, offers only the right candidates).
