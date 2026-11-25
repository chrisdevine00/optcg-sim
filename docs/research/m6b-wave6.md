# M6b-2 wave 6: what was built

Deliverable of PLAN §2a M6b-2, wave 6 (G49 to G58 of [m6b-runtime-audit.md](m6b-runtime-audit.md) §2 to §4). Method as in [wave 1](m6b-wave1.md) to [wave 5](m6b-wave5.md): a DSL type, an `IMPLEMENTED` entry and validation (every variant not built is refused), a hidden-zone classification, a runtime path, planted tests on vanilla test cards (no real card is scripted), each seen to fail with its implementation broken. `ENGINE_VERSION` stays **0.5.16**: see the last section. G58 needed no engine change (see its row).

Tests: `engine/test/cards/m6b-w6/` (10 files, 78 tests), `ai/test/m6b-w6-bound.test.ts` (8), `cards/test/m6b-w6-hidden.test.ts` (6) and `cards/test/m6b-w6-printed.test.ts` (8). Counts and the full-suite result are in the final section.

## Per gap

| Gap | DSL | Runtime | Test |
| --- | --- | --- | --- |
| G49 printed effects | filters `{ hasBaseEffect: boolean }` and `{ hasTiming: 'onPlay' \| 'whenAttacking' \| 'onOpponentAttack' \| 'onBlock' \| 'onKO' \| 'activateMain' \| 'endOfYourTurn' \| 'endOfOpponentsTurn' }` ("without" is `{ not: ... }`) | new `cards/src/printed.ts` reads the verified card text; `Def.baseEffect` and `Def.printed` are set in `toDef` (a hand-built test card falls back to its abilities); `eval.ts` `matchesOf`. `record.ts` leaves the two fields out of `cardsVersionOf` so no recorded game's card-data version moves | `g49-printed-effects.test.ts`, `cards/test/m6b-w6-printed.test.ts` |
| G50 played rested | continuous `{ playRested: Filter }` (a permanent ability; `tiers` work) | `eval.ts` `playsRested` reads the controller's live permanents when a play places a card (`flow.ts` `runPlay` `place`); not a layer, so `derive.ts` `layered` ignores it | `g50-play-rested.test.ts` |
| G51 opponent performs | `play { what, player: 'opponent' }` (the selector names their hand, `owner: 'opponent'`, `chooser: 'opponent'`); `addDon: [...], player: 'opponent'`; "may" is the existing `chooseOne` with `chooser: 'opponent'` | `run.ts` `play` pushes the play frame for the opponent and checks `cannotPlay` for them; `addDon` takes from and puts on their side, asks their count | `g51-opponent-effects.test.ts` |
| G52 place this card | cost `move { from: 'self', owner: 'you', pick: { exactly: 1 } } to deck / hand / trash` (a field cost of this Character or Stage) | `run.ts` `onFieldZones` accepts `self`: the card leaves through a `remove` frame with the cause `cost` (G1); `eval.ts` `payable` needs the card on the field | `g52-place-self-cost.test.ts` |
| G53 play the revealed card | `play { what: { from: 'deckTop' \| 'lifeTop', owner: 'you', filter: { ref }, pick: exactly or upTo 1 } }` after a `reveal` that bound the name | `eval.ts` `zoneIds` reads the top Life card; `hiddenPool` treats a pool that is only a bound top card as public; the existing play frame moves it (a card leaving Life fires `lifeRemoved`) | `g53-play-revealed.test.ts` |
| G54 same name | filter `{ sameNameAs: Name }` | `eval.ts` `matchesOf`: the name, or a name `alsoNamed` gives, shared with a bound card that still exists. Cost selectors already bind, so the cost's trash feeds it | `g54-same-name-as.test.ts` |
| G55 total power | `Pick` `upTo` gets `totalPower: { lte: Num }` | `run.ts` `selectCards` puts each candidate's current power (floored at 0) in `Decision.limits` with `what: 'power'`; `actions.ts` `checkPick` already sums `limits.costs` against `total` | `g55-total-power.test.ts` |
| G56 `triggerActivated` | timing `{ event: 'triggerActivated', by: 'you' \| 'opponent' \| 'any' }` | `flow.ts` `answerTrigger` fires it when the damaged player activates the [Trigger]; the watchers resolve after the [Trigger] does (pending effects wait for the damage to end) | `g56-trigger-activated.test.ts` |
| G57 [Trigger] to hand | `move { what: { from: 'self', owner: 'you', pick: { exactly: 1 } }, to: { zone: 'hand' } }`, only in a [Trigger] | `run.ts` `move`: the card in the `resolving` slot goes to the hand; `runTrigger` already trashes it only if it is still there (CR 10-1-5-3) | `g57-trigger-to-hand.test.ts` |
| G58 variable-count trash | none | none: the text has no colon, so it is an effect, and `trashFromHand` with `pick: { any: true }` and `bind` read by `refCount` (OP15-002 Lucy) already does it. The audit read it as a cost. | `g58-trash-any-scaled.test.ts` pins the shape (it cannot fail by reverting a change) |

Validator refusals pinned by tests: `hasBaseEffect` that is not a boolean, `hasTiming` outside the eight; `sameNameAs` naming nothing bound (in a script or a deck restriction); `totalPower` with `gte`, with `totalCost` or `exactly`, or in a cost; a `playRested` filter that reads state, `ref` or `isSelf`; `play` with `player` other than `'opponent'`, or with the opponent's play from another owner, without their `chooser`, from the trash or without a pick count; the top of the deck or Life played without a `{ ref }` naming a `reveal` (or with another owner, `upTo` 2, a mixed zone list, a ref bound by a plain selector); a `move` cost from `self` with an owner other than you, a filter, a mixed zone list, `upTo`, `topOrBottom` or Life; `self` as a `trash` cost; `move` of `self` outside a [Trigger], to anything but your hand, with `upTo`, a filter or `faceUp`; `triggerActivated` without `by` or with `both`; `addDon` with `player: 'you'`.

## Revert checks

Each implementation was broken in turn (one line changed, its test file run, restored; `w6-revert.py` in the working tree during the work, deleted before the commit). Failures with the break in place, out of the file's tests:

| Break | Failing tests |
| --- | --- |
| G49 `hasBaseEffect` reads the script / `hasTiming` reads the script | 2 of 7 / 2 of 7 |
| G50 `playsRested` never applies | 5 of 9 |
| G51 the play is made by you / `addDon` is by you | 2 of 13 / 3 of 13 |
| G52 `self` is not a field zone (the card is moved without a removal) / `payable` ignores where the card is | 1 of 8 / 1 of 8 |
| G53 Life top has no pool / the revealed card is a secret pool | 1 of 10 / 2 of 10 |
| G54 `sameNameAs` never matches | 3 of 6 |
| G55 no total power limit | 5 of 7 |
| G56 the event is not fired | 5 of 7 |
| G57 `move` of `self` does nothing | 3 of 6 |
| G58 | not applicable: no code changed |

## Readings

- **G49** the filter reads printed text, never the script (the audit's section 5.2: an unscripted card has no abilities). A card whose only text is keywords and their reminder text has no base effect (M6b-Q29, settled); text in parentheses is explanation (CR 2-8-4). A [Trigger] is printed text and counts as an effect (M6b-Q70). A bracket followed by the word "effect" names a timing and does not print it ("without an [On Play] effect" prints no [On Play], PRB01-001).
- **G50** every card of the controller's that matches the filter and is played enters rested, from the hand or by an effect, from any zone. Read when the card is placed, from the controller's live permanents; a negated source does nothing (M6b-Q74).
- **G51** the opponent chooses and plays from their own hand, free (an effect play), and a full Character area makes them trash one of their own first. For OP13-119 the card just returned is in their hand. A restriction on what they may play applies (M6b-Q75).
- **G52** "place this Character ... in any order" with another card from the trash (OP10-026, OP10-027) is two costs in the order written; the two cards go to the bottom in that order (M6b-Q73). It is a removal with the cause `cost`, as every field cost: replacements, removal watchers and last-known information see it. It is not payable when the card is not on the field (an [On K.O.] cost finds it in the trash).
- **G53** the card must be the top card the reveal showed; if it has moved, nothing is played. A Life card played this way is not damage (no [Trigger]) and fires the `lifeRemoved` watchers (M6b-Q40's reading, now exercised). The revealed card is known to both players, so playing it is no secret and the question is only the card's own "you may".
- **G54** compares card names (a name the rules also give a card, EB04-038, counts); a bound card that has left the game state matches nothing.
- **G55** the total is the chosen cards' current power, each floored at 0, at most the bound (M6b-Q71). Choosing fewer than the "up to" is always allowed.
- **G56** the event is the damaged player activating a [Trigger]; `by` is relative to the watcher, `any` is either player's. A [Trigger] that is declined (added to the hand) is not an activation. The watchers resolve after the [Trigger] has (M6b-Q72).
- **G57** only a [Trigger]: the card is in the `resolving` slot while its effect resolves, and "add this card to your hand" moves it from there. If the effect already put it elsewhere (played it), nothing happens.

## Hidden information and the AI

- **No new prompt depends on a hidden card.** The play by the opponent is asked of them with the same "up to" they would have for any effect (an empty or non-matching hand is still asked, so the pause tells nothing); a pick of the revealed card is no prompt (one public candidate, `exactly: 1`); `cards/src/hidden.ts` classifies `play` of a top card and of the opponent's hand as reading a hidden zone, "add this card to your hand" and a cost moving this card into a deck as moving into one, and the filters, `playRested`, the opponent's DON!! and the timing as reading none (`cards/test/m6b-w6-hidden.test.ts`). `hidden-gate.ts` needed no change: a `play` is a prompt token with its chooser, so a hidden condition that decides whether the opponent is asked is a gate, and the condition on a revealed card (`{ ref }`) is not hidden.
- **Leak cases** (two-position tests): G51, hands that differ only in whether they hold a card the filter admits give the other player the same decision and events; G53, two decks that differ only in the top card give the same view before the reveal, and after it both players know that one card and no other, from the deck and from Life (the other Life cards are never named); G57, the other player sees the [Trigger] card (already revealed) go to a hand, with no handle for where it is.
- **The lethal bound** (`ai/src/search/lethal/bound.ts`, `ai/test/m6b-w6-bound.test.ts`): `play` with `player: 'opponent'`, `addDon` with `player` and the permanent `playRested` are not in the neutral set, so `scanAbility` returns false and the solver searches; a cost that moves this card counts as taking the card off the board (`bouncesOf`), and a repeatable ability with that cost is not "limited", so it is searched; the new timing is an event-driven auto (capped); a [Trigger] that adds its own card to the hand is a [Trigger], which never fires on the attacker's turn. `winsByEffect` needed nothing (`play` and `addDon` are already life-safe).

## Deferred

- **OP10-022** also needs G67 (`Num` total cost of a selector, wave 7) and **ST20-003** needs G64 (look at Life and re-place, wave 7): neither is expressible after this wave although G53 and G57 are built.
- `hasBaseEffect` and `hasTiming` are not allowed in a `deckRestriction`, a `cannotBeKOd by` source filter or a `playRested` filter (the deck check and the source filters read other data); no card needs them there.
- `move` of `self` as an effect outside a [Trigger] ("return this Character to your hand") is not built; no card in the wave needs it.
- `triggerActivated` carries no count and no card; no card needs them.

## Cards now expressible, by set

- **EB-02:** EB02-022 (G49), EB02-039 (G54).
- **EB-03:** EB03-001, EB03-003, EB03-007, EB03-009, EB03-039 (G49).
- **OP-09:** OP09-008 (G52), OP09-018 (G55), OP09-022 (G50).
- **OP-10:** OP10-026, OP10-027 (G52).
- **OP-11:** OP11-102 (G56, with wave 4's G30).
- **OP-12:** OP12-058 (G53), OP12-075 (G51), OP12-080 (G52), OP12-109, OP12-113 (G57).
- **OP-13:** OP13-106 (G56), OP13-119 (G51).
- **PRB01:** PRB01-001 (G49).
- **ST-16:** ST16-002 (G58, no engine change).

22 cards (the audit's count). Cumulative with waves 1 to 5 and the scripted cards: 1,144 of 1,175 once they are scripted.

## Results

- Tests added: 78 in `engine/test/cards/m6b-w6/` (10 files), 8 in `ai/test/m6b-w6-bound.test.ts`, 6 in `cards/test/m6b-w6-hidden.test.ts`, 8 in `cards/test/m6b-w6-printed.test.ts`. No existing test edited.
- Full suite (`npx vitest run engine cards ai`): 28,226 passed, 26 expected fail, 10 skipped, 164 todo (2,716 files; 33 skipped files). `ENGINE_GAMES=2000 npx vitest run engine/test/property engine/test/golden`: 29 passed (10 files). Typecheck, eslint and prettier are clean.
- **`ENGINE_VERSION` stays 0.5.16, goldens not re-recorded.** No recorded game plays out differently: every new shape is one no scripted card uses; the changes to code paths scripted cards do run are invisible to them (`hiddenPool` reads a `{ ref }` over the top of the deck as public, which no script uses; `play` and `addDon` default to the controller as before; `runPlay` asks `playsRested` first, which is false without a `playRested` permanent). The two new `Def` fields are left out of the card-data version, so every record's `cards-` hash is as it was. The golden games and the 2,000-game property run replay with the same hashes with the version unchanged.
