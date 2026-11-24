# M6b-2 wave 2: what was built

Deliverable of PLAN §2a M6b-2, wave 2 (G11 to G19 and design item D4 of [m6b-runtime-audit.md](m6b-runtime-audit.md) §2, §3 and §4). Method as in [wave 1](m6b-wave1.md): a DSL type, an `IMPLEMENTED` entry and validation (reject every variant not implemented), a runtime path, and planted tests on vanilla test cards (no real card is scripted). `ENGINE_VERSION` goes 0.5.5 to **0.5.6**, once for the wave. Goldens were re-recorded for the version only: the replayed hashes and event sequences are identical.

Tests: `engine/test/cards/m6b-w2/` (4 files, 48 tests), 14 new tests in `engine/test/rules/deck-format.test.ts` and `ai/test/m6b-w2-bound.test.ts` (4 tests). Full suite: 5,733 passed (600 files, 33 skipped); `ENGINE_GAMES=2000 npx vitest run engine/test/property` 17 passed; typecheck, eslint and prettier clean. One more test in `app/test/decks.test.ts` (the Leader's deck-rule check row, shown only when broken). `npm run cards:measure` regenerates `cards/data/coverage-report.json` unchanged: no real card is scripted.

## Per gap

| Gap | DSL | Runtime | Planted test |
| --- | --- | --- | --- |
| D4 damage replacement | `ReplaceEvent` `{ damage: 'you' }` | `flow.ts` `collectDamageReplacements`, `offerDamageReplacement`, `runDamage`, `applyReplacement` (damage frame); `Frame.damage` gains `considered` and `zero` | `d4-damage-replacement.test.ts` |
| G11 `ko` with a cause | `{ ko, cause?: 'opponentEffect' \| 'effect' \| 'battle' }` | `flow.ts` `causeMatches`, `collectReplacements` | `g11-g14-ko-replacements.test.ts` |
| G12 `anyNumberInDeck`, `deckRestriction` | `RulesClause` (already typed) | `engine/src/deck.ts` `deckIssues` (new 4th parameter `rulesOf`, new issue code `deckRestriction`), `deckRulesOf`, `cardMatchesDeckFilter`; `defs.ts` `DECK_RULES` | `deck-format.test.ts`, `g12-rules-clauses.test.ts` |
| G13 `nameIncludes` | `Filter.nameIncludes` | `eval.ts` `matchesOf` | `g13-...` file |
| G14 `leaveField` any cause | `{ leaveField, cause: 'opponentEffect' \| 'any' }` | `flow.ts` `collectReplacements` | `g11-g14-...` file |
| G15 distinct names | `Num { count, distinctNames: true }` | `eval.ts` `numOf` | `g13-...` file |
| G16 `giveDon` each, up to N targets | `each` with `pick: { upTo }` | `run.ts` `giveDon` | same |
| G17 `lookAtTop` to play | `Take.to: 'play'`, `Take.rested` | `run.ts` `lookAtTop` (the `play` frames of the `play` action, batch rule) | same |
| G18 `ko` on a Stage | `ko` accepts `stage` | `flow.ts` `runKo` | same |
| G19 `oneOf` cost | `Cost { oneOf: Cost[][] }` | `compile.ts` (`alt` instruction), `run.ts` `exec`, `eval.ts` `payable` and `costIsSecret` | same |

Everything else the wave touched: `hidden.ts` (a `oneOf` cost reads a hidden zone when an alternative does; a damage replacement reads none), `costText` (engine and app: "A or B"), the app's `ReplacementApplied` log line (the damage), a builder check row for the Leader's deck rule (`app/src/decks/model.ts`), and `bound.ts` `reachOf`.

### D4 in detail (audit §3 D4; recommendation A, as decided in DECISIONS "M6b-1 decisions")

`{ damage: 'you' }` replaces damage to the controller of the replacing card, on the Leader, a Character or the Stage. `runDamage` offers the replacements before the Life card moves; accepting pops the whole damage frame (every Life card still owed, a Double Attack's two included), runs the payload, and takes no Life card, so no [Trigger] either (CR 4-6-3-1, rules-digest 103). Declining takes the damage as before, and the same replacement is not offered again for that damage. It is offered for battle and effect damage, banish included, and also **at 0 Life**: a battle hit determined against 0 Life used to win at once with no frame, so a frame (`zero: true`) is pushed only when the defender has a possible damage replacement, and the attacker wins after it only if the replacement is declined or none was possible. A defender with no damage replacement runs byte for byte as before, which is why the goldens did not change. `DamageDealt` is still emitted before the offer (it records the hit); `ReplacementApplied` (`replaced: 'damage'`, `player`) follows when it was replaced.

### G12 in detail (audit §2 G12)

`deckIssues` is the single validator. It reads a card's clauses from its loaded script (`SCRIPTS[id].rules`), else from `DECK_RULES` in `defs.ts` (the builder runs before any script is loaded; the `RULES_CLAUSES` table of `donDeckSize` is the precedent). A test loads every script and asserts the two agree, so a script that gains a deck clause fails until the table has it. `anyNumberInDeck` lifts the 4-copy cap (CR 5-1-2-3) for that card number only; a restricted card's limit still applies. `deckRestriction` is read over the main deck from the Leader's clauses, as a CR-level error in every format (including `free`, which `createGame` uses), `code: 'deckRestriction'`, `rule: "<Leader> (Leader rule)"`, `cards`: the offending card numbers, one issue per Leader clause. The filter is read over printed card data: the validator accepts only `category`, `cost`, `baseCost`, `power`, `basePower`, `hasCounter`, `type`, `typeIncludes`, `name`, `nameIncludes`, `color`, `attribute`, `multicolor`, `hasTrigger`, `all`, `any`, `not`, with numeric comparisons; `cardMatchesDeckFilter` implements exactly those. `deckIssues` also accepts a `rulesOf` function for a caller or test that has clauses of its own.

## Revert check (each planted test fails with its implementation reverted)

Done by breaking the implementation (one line each), running `engine/test/cards/m6b-w2`, `engine/test/rules/deck-format` and `ai/test/m6b-w2-bound.test.ts`, and restoring. Result per gap, with the number of planted tests that failed:

- **D4**: offer step removed, 7 fail (battle accept, decline, 0 Life, Double Attack, effect damage, Once Per Turn mandatory, lethal search). The 0-Life frame alone reverted (always plain win at 0 Life): 2 fail. Validator without `damage`: 1.
- **G11**: `cause` ignored, 4 fail (opponentEffect, effect, effect as a K.O. cost, battle).
- **G12**: `anyNumberInDeck` ignored 2 fail; `deckRestriction` ignored 3 fail.
- **G13**: 2 fail (power by name, Leader condition); validator without it, 2.
- **G14**: `any` treated as `opponentEffect`, 2 fail (battle, own effect and an opponent effect; a removal that is not a K.O.); validator, 1.
- **G15**: counts cards, 2 fail; validator, 1.
- **G16**: the pick cap ignored, 1 fail (6 DON!!, 3 Characters, up to 2); validator, 5.
- **G17**: the `play` branch off, 3 fail (play and rest, none and rested, full Character area); validator, 4; `reachOf` without the take, 1.
- **G18**: Character-only K.O., 4 fail (the K.O., [On K.O.] versus the Character watcher, protection, replacement); validator, 4.
- **G19**: `payable` ignoring `oneOf`, 4 fail; no choice asked, 2; per-alternative cost lists off, 1 (the give-DON!!-after-a-rest case); validator, 5.

## Readings chosen (not rulings; the open questions stay open)

1. **A damage replacement covers the whole damage, not one Life card** (a Double Attack's two cards are one damage, as a card says "if you would take damage"). M6b-Q8 (no Life card, no [Trigger]) is followed as the CR 4-6-3-1 text reads; it stays an open question for the card EB05-052.
2. **A damage replacement is offered at 0 Life too**, because the player "would take damage" and a replacement that prevents it prevents the defeat. Rejected: offering only with Life cards left (the card would be useless exactly when it matters).
3. **`ko` replacement causes** (G11): `effect` is an effect of either player and a K.O. cost (a cost is part of the effect, RL-16); `opponentEffect` is an effect of the K.O.'d card's owner's opponent (RL-14), so a cost never counts; `battle` is a battle K.O. A `ko` replacement with no cause is unchanged.
4. **`leaveField` any** (G14, M6b-Q5): "any" covers a battle K.O., your own effects and costs that go through the removal frames (a field cost K.O. or trash). A rule move (a Character trashed for room, CR 3-7-6-1) never goes through a frame and is not replaced. One event is replaced once: a `ko` and a `leaveField` replacement on the same card are two offers of one K.O., and accepting one pops the K.O., so the other is never asked. Rejected: a list `replaces` for one Once Per Turn over two events (OP13-046): deferred, see below.
5. **OP10-118 "once per turn, cannot be K.O.'d by your opponent's effects"** (M6b-Q36): expressed as a mandatory Once Per Turn `ko` replacement with an empty `instead` and `cause: 'opponentEffect'`; it prevents the K.O. and is spent when it prevents. Pinned with a planted test. Whether it should be spent when nothing was about to happen is the open question.
6. **Distinct names** (G15, M6b-Q9): the number of different `def.name` values among the cards the selector matches; whether the source card counts is the selector's `isSelf` filter, not the Num, so the open question stays open.
7. **`giveDon` each with an `upTo` pick** (G16): every chosen target gets the full M; the DON!! on hand cap the number of targets (`floor(DON / M)`), so "up to M each" gives M. Rejected: asking per target how many (never worse to give more; it would multiply the decisions).
8. **A K.O.'d Stage** (G18) fires its own [On K.O.], is protected by "cannot be K.O.'d" and offers its `ko` replacements like a Character, and does not fire "when one of your Characters is K.O.'d" watchers (the card category is checked).
9. **`oneOf`** (G19): the alternatives that can be paid are offered (a "mode" choice); with one payable it is taken without asking; none payable: the ability is not offered. Costs before the "A or B" are paid in the order printed; the choice is made first. It is refused inside a replacement payload and nested, and at most one per cost list.
10. **`lookAtTop` to play** (G17): a Character or a Stage that you are not barred from playing may be taken; the played cards leave the look, so the rest still go to the bottom; a full Character area asks which to trash as for any play; `rested` plays them rested.

## Hidden information and the AI

- Nothing new hides a card. The `play` frames of G17 reveal the card played, as any play does; a `oneOf` cost with a hand alternative makes the cost secret (`costIsSecret`), so "not payable" never reveals the hand. The property leak tests pass (2,000 games); real decks use none of the new shapes, so the planted tests are the guard.
- `ai/src/search/lethal`: a damage replacement is not classified by the bound at all and does not need to be: the search runs the real engine, which offers the defender the replacement as an answer (`defenderAnswers` enumerates "accept"), so a hit it can replace is not a proven lethal (`ai/test/m6b-w2-bound.test.ts`, `actual` and `public`; with the 0-Life frame reverted the proof is wrongly found). The count refutations (`attackersPossible`, `refutedByBound`) only weaken the defender, so they stay sound. `reachOf` now counts a `lookAtTop` take that plays as extra attacks (an over-estimate, like `play`). A `oneOf` cost on an unlimited activate is not in the "limited cost" list of `scanAbility`, so it stays unclassified and the caller searches. `profile.ts` was checked: an unknown filter key such as `nameIncludes` on a hand cost is reported as a gap, which only strengthens the defender.

## Deferred

- G14(b), one `replaces` list so a single Once Per Turn covers two events (OP13-046 Vista): not built (the wave's list says "leaveField scope"); `replaces` stays a single event.
- The deck builder shows the Leader's rule in a new check row; the AI deck generator does not read the clauses (it builds from sourced lists).
- A deck clause in a script that is not in `DECK_RULES` fails the agreement test, not the builder: add both.
- No real card was scripted. Gloriosa (EB05-052), OP12-001 and OP16-042 are now expressible; their scripts, text verification and tests belong to their batches.
