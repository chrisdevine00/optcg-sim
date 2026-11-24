# M6b-2 wave 1: what was built

Deliverable of PLAN §2a M6b-2, wave 1 (the ten gaps G1 to G10 of [m6b-runtime-audit.md](m6b-runtime-audit.md) §4). Method: the M4b one ([m4b-runtime-audit.md](m4b-runtime-audit.md) §2): a DSL type, an `IMPLEMENTED` entry and validation (reject every variant not implemented), a runtime path, and planted tests on vanilla test cards (no real card is scripted). `ENGINE_VERSION` goes 0.5.4 to **0.5.5**, once for the wave. Goldens were re-recorded for the version only: the replayed hashes and event sequences are identical, so no recorded game plays differently.

Tests: `engine/test/cards/m6b-w1/` (3 files, 44 tests) and `ai/test/m6b-w1-bound.test.ts` (2 tests). Full suite: 4,560 passed (489 files); `ENGINE_GAMES=2000 npx vitest run engine/test/property` 17 passed.

## Per gap

| Gap | DSL | Runtime | Planted test |
| --- | --- | --- | --- |
| G1 own-Character costs | `Cost.ko`; `trash` and `move` accept `characters`/`stage` | `run.ts` `fieldCost`; `eval.ts` `payable`, `costIsSecret`; `flow.ts` `pushKo` takes cause `cost` | `g1-field-costs.test.ts` |
| G2 `cannotBeRested` | `'cannotBeRested'`, `{ cannotBeRested: { by: 'opponentEffect' } }` | `derive.ts` flags and `restBlocked`; `ops` `rest()`; `actions.ts` attack and block; `eval.ts` `payable`; `run.ts` `selectRest` | `g2-g6-g10-restrictions.test.ts` |
| G3 `attribute` filter | `Filter.attribute` | `eval.ts` `matchesOf` | `g3-g4-g5-g7-g8-g9.test.ts` |
| G4 `mill` action | `Action.mill: { player, n: Num }` | `run.ts` `action` | same file |
| G5 `activate` own [On K.O.] / [Counter] | `ability: 'onKO' \| 'counter'` | `run.ts` `activate`, and a "during this battle" effect with no battle does nothing | same file |
| G6 scoped K.O. protection | `{ cannotBeKOd: { cause: 'effect' \| 'opponentEffect' \| 'battle' } }` (timed and permanent) | `derive.ts` `koShield` and `koProtected`; `flow.ts` `runKo`; `layers.ts` `restrictionMod` | restrictions file |
| G7 `giveDon` cost | `Cost.giveDon: { n, state: 'active', to }` | `run.ts` `payCost`; `eval.ts` `payable` and `reservedActive` | `g3-...` file |
| G8 `turnLifeFaceDown` cost | `Cost.turnLifeFaceDown: n` | `run.ts` `payCost`; new event `LifeTurnedFaceDown` (no card named) | same |
| G9 `returnDon` active only | `Cost.returnDon: number \| { n, state: 'active' }` | `run.ts` `returnDon(..., activeOnly)`; `payable` | same |
| G10 `cannotActivateBlocker` | `'cannotActivateBlocker'` (timed and permanent) | `derive.ts` `cannotBlock`; `actions.ts` block legality | restrictions file |

New modifier kinds `cannotBeRested` and `cannotBlock` and a `scope` field on `Modifier` (`state.ts`); `restrictionMod` in `layers.ts` is the one place that maps a `Restriction` to a modifier, for timed (`run.ts`) and permanent (`layers.ts`, stage 5) alike. Permanent restrictions now accept the object forms. The validator also now rejects two shapes that used to pass and misexecute: a card-target `restrict` carrying a player restriction (`cannotDrawByOwnEffects`, `cannotPlay`), and the same inside a permanent.

### G1 in detail (audit §5.1)

A field cost goes through a `ko` frame (K.O.) or a `remove` frame (trash, hand, deck top or bottom) with `cause: { kind: 'cost', by }`, so replacements, removal-proofing, last-known information (`CardMoved.lki`, cause `cost`) and the return of given DON!! (to the cost area rested) all run, and a K.O. cost fires [On K.O.]. The paying ability resumes on the same instruction (`ph` marker), checks that every chosen card left the field, and otherwise stops without resolving (`EffectDeclined`, `reason: 'costNotPaid'`, no `Anomaly`). `trashSelf` is unchanged (it already calls `leaveField` with cause `cost`). The refusal in `dsl-validate.ts` is lifted for: `trash` from `characters`/`stage`; `move` from `characters`/`stage` to hand, trash or the top or bottom of the deck (exactly 1 card to a deck); `ko` from `characters`. All with `owner: 'you'`, never mixed with hand zones, never to Life (G61), never `topOrBottom`. `costIsSecret` is now false for a field trash cost; `hidden.ts`, `costText` (engine and app) cover the new shapes.

## Revert check (each planted test fails with its implementation reverted)

Done by breaking the implementation, running `engine/test/cards/m6b-w1` and `ai/test/m6b-w1-bound.test.ts`, and restoring (script: the break per gap is a one-line change to the code named in the table). Result per gap, with the planted tests that failed:

- **G1**: 7 fail (trash cost with cause, own-cost not an opponent effect, return to hand incl. self, bottom of deck, K.O. cost with [On K.O.], RL-16 protected K.O. cost, battle-only protection). The validation tests guard the validator half.
- **G2**: 4 fail (attack, pay rest cost and effect rest, block, opponent-effect scope, permanent).
- **G3**: 2 fail (power by attribute, Leader attribute condition).
- **G4**: 4 fail (top N face-up, `Num` count, opponent and clamp, immediate deck-out).
- **G5**: three independent breaks, 1 fail each: the [On K.O.] activation, the [Counter] activation, the no-battle check.
- **G6**: 5 fail (effects, opponent effects, battle, cost, timed and permanent).
- **G7**: 2 fail with the cost reverted (give to Leader, choose target); 1 fail with only the `payable` accounting reverted.
- **G8**: 1 fail with the cost reverted (hidden, fresh handle); 1 fail with the `payable` face-up check reverted.
- **G9**: 1 fail with the active-only class reverted (it asks or takes rested DON!!); 1 fail with the `payable` accounting reverted.
- **G10**: 2 fail (timed and permanent).

## Readings chosen (not rulings; the open questions stay open)

1. **A K.O. cost on a protected Character is offered and fails** (RL-16's recommended reading, "legal but failed payment"): earlier costs stay paid, the effect after the colon does not resolve. Rejected: removing protected Characters from the candidates (cannot express the Kyros case, where a replacement stops the K.O.: the same fizzle covers it).
2. A cost is an effect for "cannot be K.O.'d by effects" (RL-16, digest 112). "By your opponent's effects" needs the source player to be the card owner's opponent, so your own cost or effect is never stopped by it (RL-14, OP04-079). The cause of a K.O. cost is `cost`, treated like `effect` in `koProtected`.
3. **mill and deck-out**: the effect form clamps to the deck, then follows RL-26 and digest note 274.2: emptying a deck loses at once (the cost form already did). The audit's sentence that milling must never lose the game by itself contradicts RL-26 and was not followed.
4. `cannotBeRested` unscoped stops every rest, including your own effects and the card's own attack or block (digest 57). The "by your opponent's effects" form stops only a rest by an effect of the card owner's opponent (a cost, an attack, a block and your own effects pass). Whether a Leader's effect or only a Character's effect counts (M6b-Q30 family) is not distinguished.
5. G5: an effect with duration `battle` and no battle going on creates nothing and chooses nothing, for every action that takes a `duration` (`power`, `cost`, `setBasePower`, `grant`, `negate`, `restrict`). A [Counter] activated from a [Trigger] by battle damage does get its battle.
6. G10: targets are a snapshot taken at resolution (B3). OP01-120 (M6b-Q12: the power filter read at block time) is not expressible as a timed restriction; the permanent form reads the filter live, so it is a scripting question, left open.
7. G8 gives the turned Life card a fresh projection key and does not mark it known to anyone: the card was face-up, but the engine does not model memory of Life cards.
8. G7 and G9 cost forms are `active` only, to exactly one own card; `DonGiven` carries `by: 'cost'`.

## Hidden information and the AI

- G8 is the only new move that hides a card. `g3-...` asserts both players' projections show no card and a changed handle, and that no event names it. The other new costs read public cards (own Characters, DON!!, the top of the deck as a count). The property leak tests (2,000 games) pass; they play real decks that use none of the new shapes, so the planted G8 test is the leak guard.
- `ai/src/search/lethal/bound.ts`: the attack-side scan treated any string restriction as neutral. `cannotActivateBlocker` bars the defender's Blockers, so it now counts as a Blocker lost (`blockerLoss`; infinity for a permanent), as `cannotActivateBlockerAgainstIt` does. The scoped object restrictions, `mill`, `activate` and the new costs stay unclassified (`ok = false`), so the caller searches instead of trusting a bound (`ai/test/m6b-w1-bound.test.ts`). `profile.ts` was checked: unknown [Counter] ops are reported as gaps and unknown costs are dropped, which only strengthens the defender, so it stays sound.

## Deferred

- The `removed`/`leftField` timing (G29) and the cause on [On K.O.] (G28): the frames now exist for costs, but no watcher reads them yet.
- The `leaveField` replacement (opponent effects only) cannot see an own cost, correctly; the broader scope is G14.
- A `move` cost from a hand is still not `costIsSecret` (unchanged; `hidden.ts` does mark it).
- `trashSelf` still calls `leaveField` directly rather than a `remove` frame (no observable difference until G29).
- No real card was scripted, and the wave does not touch `cards/data/coverage-report.json`.
