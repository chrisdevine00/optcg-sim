# M6b-2 wave 3: what was built

Deliverable of PLAN §2a M6b-2, wave 3 (G20 to G29 of [m6b-runtime-audit.md](m6b-runtime-audit.md) §2 and §4). Method as in [wave 1](m6b-wave1.md) and [wave 2](m6b-wave2.md): a DSL type, an `IMPLEMENTED` entry and validation (every variant not built is refused), a runtime path, planted tests on vanilla test cards (no real card is scripted), each seen to fail with its implementation broken. `ENGINE_VERSION` goes 0.5.10 to **0.5.11**, once for the wave. Goldens were re-recorded for the version string only: the replayed hashes and event sequences are identical (the new state, `hist`, exists only in a game where a card reads it).

Tests: `engine/test/cards/m6b-w3/` (4 files, 63 tests) and `ai/test/m6b-w3-bound.test.ts` (4 tests). Full suite: 9,920 passed, 25 expected fail, 10 skipped, 164 todo (1,031 files), and one timing test, `ai/test/budget.test.ts` (a p95 of 487 ms against a 480 ms limit), that failed under the full run's load and passes alone (4 of 4). `ENGINE_GAMES=2000 npx vitest run engine/test/property`: 25 passed (9 files). Typecheck, eslint and prettier are clean. `npm run cards:measure` regenerates `cards/data/coverage-report.json` unchanged: no real card is scripted.

## Per gap

| Gap | DSL | Runtime | Planted test |
| --- | --- | --- | --- |
| G20 give the opponent's DON!! | action `giveDon` `{ from: 'opponent', state: 'rested' \| 'active' \| 'any', to }`; cost `giveDon` `{ from: 'opponent', state: 'rested', to }` | `run.ts` `giveDon` (donor, `give`, the active-or-rested split), `payCost` `giveDon`; `eval.ts` `payable`, `reservedActive`; `Scratch.act` | `g20-g21-g27-don.test.ts` |
| G21 `cannotSetDonActive` | player `Restriction` `{ cannotSetDonActive: { by: 'characterEffects' } }` | new `ModKind` `cannotSetDon` on the Leader (like `cannotDraw`); `run.ts` `setActive` (DON!! branch), `restrict`; `eval.ts` `cannotSetDonByCharacter` | same |
| G22 `trashedFromHand` | timing `{ event: 'trashedFromHand', owner, by?, sourceFilter?, includeCosts? }`; `Num` `{ eventCount: true }` | `flow.ts` `fireTrashedFromHand`; `run.ts` `handTrashed` from `trashFromHand`, a hand-to-trash `move` and (with `includeCosts`) the hand costs; `Ev` carried by `fire`, `PendingEffect`, the effect frame and `Ctx` | `g22-hand-trash.test.ts` |
| G23 `Num` division | `{ div: [Num, int >= 1] }` | `eval.ts` `numOf` (`Math.floor`) | `g23-g26-g28-conditions.test.ts` |
| G24 `rested` | timing `{ event: 'rested', owner: P \| 'any', filter?, by?, sourceFilter? }` | `ops/index.ts` `rest` (new `hooks.rested` with the reason, the acting player and card), `flow.ts` `hooks.rested`; `run.ts` passes the source card | `g24-g25-g29-timings.test.ts` |
| G25 `cardPlayed` qualifiers | `{ event: 'cardPlayed', from?: 'hand' \| 'trash', via?: 'rule' \| 'effect' \| 'characterEffect' }` | `flow.ts` `runPlay` (origin read before the card moves); `Frame.play.via`, set by `run.ts` `play` and the `lookAtTop` play | same |
| G26 history conditions | conditions `{ koedThisTurn: P }`, `{ eventsActivatedThisTurn: P, baseCost?: Cmp }` | new `engine/src/history.ts` (`State.hist`, recorded in `flow.ts` `runKo` and `runPlay`, read in `eval.ts`); `hash.ts`, `determinize.ts` | `g23-g26-g28-conditions.test.ts` |
| G27 `returnDon` for the opponent | action `returnDon` `{ n, player: 'opponent', from?: 'active' }` | `run.ts` `returnDon` (new `who`, `asMany`), `action` | `g20-g21-g27-don.test.ts` |
| G28 `[On K.O.]` by cause | condition `{ koCause: 'opponentEffect' \| 'effect' }` (only in an `onKO` auto) | `flow.ts` `runKo` passes `{ cause }` to `fire`; `eval.ts` `holdsOf` | `g23-g26-g28-conditions.test.ts` |
| G29 `removed` / `leftField` | timing `{ event: 'removed' \| 'leftField', owner, filter?, cause?, to? }` | `ops/index.ts` `moveCard` (new `hooks.removed`), `flow.ts` `hooks.removed` | `g24-g25-g29-timings.test.ts` |

Also touched: `cards/src/hidden.ts` (`div` reads the hidden zone its numerator reads), `app/src/play/game/text.ts` (words for the new modifier kind) and `app/test/m4b-fix.test.ts` (its exhaustive record over `ModKind`), `ai/src/search/lethal/bound.ts` (`numBound` for `div`), `docs/OPEN-QUESTIONS.md` (M6b-Q41 to Q47).

## Revert check (each planted test fails with its implementation broken)

Done by breaking one line at a time, running `engine/test/cards/m6b-w3` and `ai/test/m6b-w3-bound.test.ts`, and restoring (script kept out of the repo; 44 mutations). Result per gap, with the number of planted tests that failed:

- **G20**: the donor always yourself, 5 fail (every effect test); cost `payable` not reading the opponent's DON!!, 1; the cost paid from your own DON!!, 1; the active-or-rested choice off, 2; validator accepting no `from`, 2.
- **G21**: the Character check off, 1 (the same ability's own earlier set is the allowed one); the restriction not created, 1; validator without the `by`, 4.
- **G22**: `fireTrashedFromHand` returns at once, 5; the `trashFromHand` hook removed, 3; `includeCosts` ignored, 1; `eventCount` fixed at 1, 2; `by` ignored, 1; validator without the event, 9.
- **G23**: floor replaced by round, 2; divisor check off, 1; the AI `numBound` without `div`, 1.
- **G24**: the `rested` hook removed, 4; `yourEffect` ignored, 1; the `sourceFilter` ignored, 1; `by` also taking attacks and costs, 1; validator without the event, 7.
- **G25**: `from` ignored, 1; every effect play read as `effect` (no `characterEffect`), 1; `via` not set on a play by an effect, 2; validator without `from`, 1.
- **G26**: K.O. not recorded, 4; Event activation not recorded, 1; the record not clearing with the turn, 1; `baseCost` ignored, 1; recorded in a game that no card reads, 1.
- **G27**: the owner not the chooser (you return them), 4; no "as many as they have", 2; validator taking `from` on your own DON!!, 1.
- **G28**: no cause passed to the ability, 3; `opponentEffect` also matching your own effect, 1; validator accepting `koCause` outside `onKO`, 1.
- **G29**: the `removed` hook removed, 8; `to` ignored, 2; `yourEffect` ignored, 1; a battle or rule move counted as an effect, 2; `leftField` not an alias, 1; `filter` ignored, 1.

## Readings chosen (not rulings; the open questions stay open)

1. **G20, whose DON!! and which state (M6b-Q24).** `from: 'opponent'` takes the opponent's DON!! from their cost area and gives it to the opponent's own Leader or Character, picked by the giver (one target; `each` is refused). `state: 'rested'` or `'active'` fixes the kind; `'any'` (OP15-023, OP15-025, OP15-028) asks the giver how many, then, only when both kinds are there and not all of them go, which kinds (the `choose` over DON!! classes of `returnDon`). The DON!! return to their owner at the owner's Refresh (CR 6-2-3: `returnGivenDon` runs for the card's owner). The cost form takes exactly one target, rested DON!! only, and pays none of the giver's DON!! (`reservedActive` skips it). New question M6b-Q44.
2. **G21.** The restriction is on the DON!!'s owner and stops a Character effect of either player setting that player's DON!! active; Leader, Stage and Event effects and the Refresh Phase are unaffected. It is created by a timed `restrict` on a player only; a permanent one and a card target are refused. The set that comes first in the same ability stands (OP10-030). M6b-Q47.
3. **G22, one event per instruction, effects only (M6b-Q31, Q46).** A `trashFromHand`, a hand-to-trash `move` or a hand cost fires one event per owner with that instruction's count. Costs are excluded unless the timing says `includeCosts: true`, so both readings of Q31 are expressible and none is chosen. `by` is the controller of the effect relative to the watcher (OP12-040 "your Navy type card's effect" is `by: 'you'` with a `sourceFilter`), absent for "an effect". The count reaches the ability as `{ eventCount }`, valid only in an auto that watches this event (the validator refuses it elsewhere, so it can never read 0 silently).
4. **G23.** `Math.floor` of the quotient; the divisor is a whole number of 1 or more. Negative numerators are not a case that occurs (counts).
5. **G24, which rests count (M6b-Q30, Q41).** The hook sits in `rest()`, so it sees every active-to-rested change: an effect, a cost, and the rules' own (an attack declaration, a block). With no `by` all of them count; any `by` matches a rest by an effect only (costs and rules excluded). `by` is relative to the watcher; `sourceFilter` reads the card whose effect rested it ("by your opponent's Character's effect" is `by: 'opponentEffect'` with a Character `sourceFilter`). `owner: 'any'` serves "a Character is rested by your effect" (OP10-036). A card that was already rested or cannot be rested does not become rested and fires nothing.
6. **G25.** `from` is the zone the card was in when the play began (a card taken from a look at the deck has the origin `deck`, matched by neither `hand` nor `trash`). `via: 'rule'` is the player's normal play from hand; `effect` any effect; `characterEffect` an effect whose source card is a Character (the printed category of the source). OP16-079's "that Character gains [Rush]" needs the event's subject (D9): not built.
7. **G26, kept only when read.** `State.hist` is `{ turn, koed per owner, Events activated (player, base cost) }` and exists only in a game where some card definition's script names `koedThisTurn` or `eventsActivatedThisTurn` (found once per set of definitions). Any other game carries no field, so its hash, golden and replay are untouched. It is keyed by turn and counts as empty on any other turn. A K.O. counts when it happens (a replaced or prevented one does not, M6b-Q22 read the natural way), for Characters only, whoever did it. An Event counts when it is activated from hand ([Main] or [Counter]), with its printed cost.
8. **G27.** The opponent chooses the DON!! classes (a `choose` for them; RL, QA-OP16 OP16-074), returns as many as they have (an effect, not a cost: nothing happens with none), `from: 'active'` offers only the active cost-area DON!!, and `donReturned` fires for their watchers only. Open: OP15-059's "may return 1 of their active DON!!" with none active (M6b-Q45).
9. **G28.** The cause is carried from `runKo` through the pending effect to the resolution (the condition is checked again there, CR 8-3-2-3). `opponentEffect` is an effect of the K.O.'d card's controller's opponent; `effect` is an effect of either player, a cost included (as `cause: 'effect'` of a replacement, RL-16). A battle K.O. matches neither.
10. **G29, any move off the field (M6b-Q20, Q42, Q43).** The hook sits in `moveCard`, so every exit that goes through `leaveField` fires it, after the move: a K.O. (battle, effect, cost), a trash, a return to hand or deck, and a rule trash (the Character limit). The filter and `to` read the card where it went. `cause` limits it to an effect (a cost included): `effect` any, `yourEffect` the watcher's, `opponentEffect` the other player's; a battle K.O. and a rule move match no `cause`. The watchers are the cards still on a field when it leaves (a card cannot watch its own removal). `leftField` is the same event under the second name the audit used. The removal watchers are queued before the K.O.'d card's [On K.O.] as their own batch.

## Hidden information and the AI

- **No timing or condition reads a hidden card.** The hand-trash hook fires on cards that go to the trash face up; its count and source are public. `removed` to a hand or deck reads the card as it left the field, which both players saw. The history conditions read K.O.s and Event activations, which are public. None of them changes which prompts are offered: a hand cost is still `secret` (`costIsSecret`) with its accept unavailable when unpayable, and the new hooks add no decision of their own. `engine/test/cards/m6b-w3/g22-hand-trash.test.ts` checks that two games differing only in an untouched hand card project identical events to the other player. The opponent-DON!! choices (G20 kinds, G27 classes) read DON!! counts, which are public.
- **The projection.** `hist` is not projected (nothing in `ProjectedView` reads it), is carried into the search skeleton (`determinize.ts`) so a determinized world agrees with the real one, and is in the summary hash only when present.
- **The lethal bound** (`ai/src/search/lethal/bound.ts`, checked against every new shape; `ai/test/m6b-w3-bound.test.ts`): `div` is bounded by its numerator (without the case it fell to the 100,000 ceiling, sound but useless); `cannotSetDonActive` is an object restriction, so `scanAbility` leaves it unclassified and the solver searches (a Smoker or Bird Neptunian attacker is searched, never trusted with a bound); the opponent-side `giveDon` and `returnDon` add nothing the attacker reaches (the given DON!! do not add power on the attacker's turn: `derive` adds a DON!!'s +1000 on its owner's turn only; `sc.giveDon` still over-counts the attacker's DON!!, which is sound); the new events are event-driven autos (up to 10 firings a turn). Defender-side watchers (a draw on a hand trash, a K.O. when rested) only make the real defender stronger than the reduced one the bound models, so ignoring them is sound as before. `reachOf` already counts a `grant` of [Rush] under any timing (OP14-045/049).

## Deferred

- **D9, the event's subject (OP16-079, and any "that Character" after a timing).** Not built: the `cardPlayed` timing now says `from: 'trash'` but the effect cannot yet act on the played card.
- **G34 (`donGiven` filter, per-target `Num`)** blocks OP15-008, OP15-015 and OP15-025; wave 4.
- **`rested` and `removed` qualifiers beyond the cards' needs:** `removed` with `to: 'life'` (G61), a `rested` cause that includes costs only (M6b-Q41), a `koCause: 'battle'`, a per-effect-resolution count for G22 (Q46).
- **OP15-059's offer** when the opponent has no active DON!! (Q45).
- **Scripts.** No real card was scripted; texts, hashes and per-card tests belong to the batches.

## Cards now expressible

Gap cards, 48 references; the audit counts 44 cards as unblocked by this wave (the four that still wait are named last).

- **G20:** OP15-003, OP15-010, OP15-012, OP15-017, OP15-023, OP15-026, OP15-028. (OP15-008, OP15-015 and OP15-025 also need G34.)
- **G21:** EB04-016, OP10-030.
- **G22:** OP12-040, OP14-045, OP14-049, OP14-056.
- **G23:** EB04-048, OP09-086, OP12-070, ST27-004.
- **G24:** OP10-036, OP14-021, OP14-027, OP14-028, OP14-032, OP14-035, OP14-070, OP14-119, PRB02-009, ST32-003.
- **G25:** OP12-081. (OP16-079 also needs D9.)
- **G26:** OP15-002, OP16-100.
- **G27:** OP14-065, OP15-059 (with the Q45 edge), OP16-074.
- **G28:** OP09-052, OP11-024, OP11-035, OP11-051, OP16-024, ST15-003.
- **G29:** EB02-023, OP09-080, OP10-042, OP13-078, OP16-041.
- **Still waiting:** OP15-008, OP15-015, OP15-025 (G34) and OP16-079 (D9).
