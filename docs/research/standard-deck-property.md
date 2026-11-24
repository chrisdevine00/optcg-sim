# Random Standard-deck property coverage

Generator: `randomStandardDeck(rng)` and `standardDecksFor(seed)` in `engine/test/support/decks.ts`.
A Standard-legal (legal or restricted) Leader, then 50 Standard-legal non-Leader cards in the
Leader's colours, scripted cards weighted 6:1, copies drawn in bunches of 1 to 4, restricted limits,
`anyNumberInDeck`, Leader `deckRestriction` and banned pairs respected, validated with
`deckIssues(deck, lookup, 'standard')` (no errors) with retry. Cards with `unknown` legality are not used.

Used by: `standard-games.test.ts` (invariants, replay hash, listed/unlisted actions), the two leak
properties in `leaks.test.ts` (`describe.each([false, true])`), and the skeleton-diff property.
A failure logs `seed`, `PROPERTY_SEED` and both decks. Reproduce with `PROPERTY_SEED=<n>` and
`standardDecksFor(seed)`; `playRandomGame({ seed, standard: true })` and
`leakGame(seed, true, undefined, true)` rebuild the game.

Counts: per push 60 games (standard-games), leaks and skeleton-diff as before for each deck source;
nightly `ENGINE_GAMES=10000` (`npm run test:nightly` globs `engine/test/property`, so the new file is included).

## Run results

- `standard-games.test.ts`, 10,000 games (PROPERTY_SEED=203953110): clean, about 1.8M actions, 235 s.
- `leaks.test.ts` both deck sources plus standard-games, 10,000: 8 tests passed, 227 s wall.

## Finding 1: hidden hand decides whether a replacement prompt pauses (FIXED in 0.5.9, see replacement-offer-leak.md)

- Property: leaks, "views ... invariant under hidden permutations" (events part), standard decks.
- Seed 15, PROPERTY_SEED=24301 (the per-push default). Decks: `standardDecksFor(15)`;
  p1 Leader OP10-001 with OP16-018 x3, p2 Leader OP09-062.
- Symptom: at action 66 (`endCounter` by p1) OP16-018 "Rockstar" is KO'd in battle. In the real
  state p1 has no Character with 6000 power or more in hand, so no prompt and the battle events
  continue (KO, DonReturned, CardMoved, BattleEnded). With p2's hidden cards permuted so p1's hand
  holds such a Character, the game pauses with an `optional` decision for p1 ("Use Rockstar's
  effect instead of the K.O.?") after only `DamageStep`. The opponent (p2) sees a different event
  stream depending on p1's hidden hand.
- Suspected cause: the OP16-018 `shield` replacement is offered only when the cost (trash a 6000+
  Character from hand) is payable, so the pause itself reveals hand contents. Whether this is a bug
  depends on the product call: a tabletop player would also be asked, but the observable pause leaks
  that the hand holds a qualifying card.
- Handling: seed 15 is listed in `KNOWN_STANDARD_LEAK_SEEDS` in `leaks.test.ts` and skipped in that
  one property only. Other occurrences will fail a nightly run with the seed and decks logged.
  Remove the seed when fixed.

No invariant violations, crashes, Anomaly events or replay mismatches were found in 10,000 games.
