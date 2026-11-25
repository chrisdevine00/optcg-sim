# Disagreements: OP-09 independent tests, group D (22 cards)

Cards: OP09-112, 114, 118, 019, 020, 039, 040, 041, 057, 058, 059, 079, 096, 097, 098, 115, 116, 117,
021, 060, 080, 099.

No open disagreements. Every test in `OP09-*.test.ts` of this group passes against the scripts as
written; there is no `it.fails` in this group.

Two cases where a first draft of a test disagreed with the engine were settled as test errors, not
engine faults, and are recorded so the review does not re-open them:

- OP09-059: with an empty hand the "trash up to 2 cards from your hand" pick is skipped. The pick has
  no filter and the hand size is public, so nothing hidden is revealed (the hidden-card rule applies to
  filtered picks such as OP09-116's "play up to 1 {Revolutionary Army} Character ... from your hand",
  which IS asked empty and is tested as such). The test accepts both.
- OP09-059: trashing the last cards of the deck by the effect ends the game (CR 9-2-1-2); the test
  asserts the loss, not a continued game.
