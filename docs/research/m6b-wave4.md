# M6b-2 wave 4: what was built

Deliverable of PLAN §2a M6b-2, wave 4 (G30 to G38 and D6 of [m6b-runtime-audit.md](m6b-runtime-audit.md) §2 to §4, plus three items from BACKLOG sections 5 and 6 and the audit's G14 (b)). Method as in [wave 1](m6b-wave1.md) to [wave 3](m6b-wave3.md): a DSL type, an `IMPLEMENTED` entry and validation (every variant not built is refused), a hidden-zone classification, a runtime path, planted tests on vanilla test cards (no real card is scripted), each seen to fail with its implementation broken. `ENGINE_VERSION` goes 0.5.14 to **0.5.15**, once for the wave. Goldens were re-recorded for the version string only.

Tests: `engine/test/cards/m6b-w4/` (8 files) and `ai/test/m6b-w4-bound.test.ts`. Counts and the full-suite result are in the final section.

## Per gap

| Gap | DSL | Runtime | Test |
| --- | --- | --- | --- |
| G30 Life to trash | `move { what: { from: 'lifeTop', owner: you \| opponent \| any }, to: { zone: 'trash' } }`; cost `{ trashLife: n }`; `trashLife` as a replacement payload | `run.ts` `move` (lifeTop branch, `any` trashes each player's top card, `upTo` is asked), `payCost`; `eval.ts` `payable` (Life count) | `g30-life-trash.test.ts` |
| G31 look | `lookAtTop { player: 'opponent', take: [], rest: 'stay' }`; `rest: 'topAnyOrder'` | `run.ts` `lookAtTop` (`stay` marks the cards known to the looker; `topAnyOrder` fixes `top`) | `g31-look.test.ts` |
| G32 attack active | action `canAttackActive { target, duration: 'thisTurn' }` | new `ModKind` `attackActive`, `Derived.attackActive`, `actions.ts` `checkAttack` | `g32-g33-attack-swap.test.ts` |
| G33 swap | action `swapBasePower { a, b, duration: 'thisTurn' \| 'battle' }`, each selector `exactly: 1` | `run.ts` (a, then b never equal to a, then two `basePower` modifiers) | same |
| G34 donGiven | filter `donGiven: Cmp`; `Num` `donGivenToTarget` (power and cost amounts); `refStat` stat `donGiven` | `eval.ts` `matchesOf`, `numOf` (`Ctx.target`); `run.ts` evaluates `power` and `cost` amounts per target | `g34-dongiven.test.ts` |
| G35 winGame | action `winGame: true` | `run.ts` calls `endGame` | `g35-g36-win-damage.test.ts` |
| G36 damage | action `damage { player, n: Num }` | `run.ts` pushes the existing `damage` frame | same |
| G37 rest replacement | `replaces: { rest: Selector, cause: 'opponentCharacterEffect' }` | new `rest` frame (`flow.ts` `runRest`), `collectReplacements` takes `rest` and the source card; `run.ts` `rest` action holds only cards that have a replacement | `g37-g38-rest-koed.test.ts` |
| G38 koed | `koed` timing gets `owner?: 'you' \| 'opponent'` | `flow.ts` `runKo` | same |
| D6 | action `addReplacement { replaces, optional, instead, duration: 'thisTurn' }` | a `replacement` modifier on the controller's Leader carrying the ability as `mod-<id>`; `abilityOf` resolves it, `collectReplacements` reads `state.mods` | `d6-g14b-replacements.test.ts` |
| BACKLOG (a) | condition `donGiven` on an `onKO` auto | `runKo` passes `ev.don` (only for a card with such a condition); `holdsOf` reads it | `g34-dongiven.test.ts` |
| G14 (b) | `replaces` may be a list (2 or more `ko` / `leaveField` entries) | `collectReplacements` offers the ability once, whichever entry matches; one `considered` key and one Once Per Turn | `d6-g14b-replacements.test.ts` |
| BACKLOG (c) | none | `run.ts` `play`: `from: 'self'` is offered only in `resolving` (a [Trigger]) or the trash (any other ability) | `backlog-play-self.test.ts` |

Validator refusals pinned by tests: `trashLife` below 1; a Life move to anywhere but the hand or trash; `owner: 'any'` with anything but a trash move with `exactly 1`; a look at the opponent's deck that takes cards or moves them; `stay` with a take; `canAttackActive` for anything but `thisTurn`; `swapBasePower` selectors without `exactly: 1` or off the Leader and Characters; `donGivenToTarget` outside a `power` or `cost` amount; a `rest` replacement with another cause; a `replaces` list under 2 or with `damage` or `rest`; `addReplacement` for `damage` or `rest` events or with a duration but `thisTurn`.

## Revert checks

Each implementation was broken in turn (one line changed, its test file run, restored). Failures with the break in place, out of the file's tests:

| Break | Failing tests |
| --- | --- |
| G30 effect (Life move to the trash) | 2 of 13 |
| G30 cost (`trashLife`) | 2 of 13 |
| G31 `stay` | 4 of 10 |
| G31 `topAnyOrder` | 3 of 10 |
| G32 (`attackActive` read in `checkAttack`) | 3 of 13 |
| G33 (the swap's modifiers) | 3 of 13 |
| G34 filter / per-target amount / `refStat` | 3 / 2 / 1 of 13 |
| BACKLOG (a) `ev.don` | 2 of 13 |
| G35 `endGame` | 3 of 14 |
| G36 damage frame | 8 of 14 |
| G37 offer in `runRest` | 3 of 11 |
| G38 owner | 2 of 11 |
| D6 reading `state.mods` | 4 of 12 |
| G14 (b) any-entry match | 1 of 12 |
| BACKLOG (c) zone check | 2 of 5 (the first version of the test used a Character on the field, which a cost renames, so it passed with the check removed; it now plants the Oars shape: an [On K.O.] cost that moves the card from the trash) |
| Lethal bound `donGivenToTarget` | 1 of 12 |

## Readings

- **G30** is not damage: no [Trigger], the card goes face up to the trash, `lifeRemoved` and `lifeBecameZero` fire as for any Life move. `owner: 'any'` takes your card first, then the opponent's, and is never optional (OP11-102).
- **G31** looking at the opponent's deck is remembered (`State.known`) until the card moves or the deck is shuffled; the other player is told that a look happened and its size (`CardsLooked`), nothing else (M6b-Q54 was not needed: this is how every look works).
- **G32** is a modifier, so it works for a Leader or Character, lasts the turn, and changes nothing else: RL-17 holds (a Character cannot attack the turn it is played) and rested targets and the Leader stay legal.
- **G33** reads base power through the layers (set effects included) when the effect resolves and gives each card the other's value as one more base-power setting; with another base setting the highest wins (M6b-Q51).
- **G34** per-target amounts are read once per target on the effect's own turn; given DON!! add power only on their owner's turn, so an opposing Character's own given DON!! add nothing during your turn. OP15-008's "that Character" is built per target (M6b-Q55).
- **G35** the win is final at once (M6b-Q50).
- **G36** is the battle damage frame: a Life card taken, a [Trigger] decision for the damaged player for every card (whether or not it has one), `damage` replacements (D4) apply.
- **G37** only the rest by an effect whose source is a Character of the other player; a Leader, Stage or Event effect, your own effect and a rest paid as a cost are not covered. A card that cannot be rested is not offered a replacement. Several of the owner's Characters rested by one effect are each offered it (M6b-Q52).
- **D6** the created replacement may apply to every matching K.O. or removal of the turn (M6b-Q54); it ends with the turn like any `thisTurn` modifier.
- **G14 (b)** `replaces` as a list is one ability: M6b-Q6 (does one Once Per Turn cover both events) stays open, the mechanism offers both answers (a list: one use; two abilities: two uses).
- **BACKLOG (a)** reads the last-known given DON!! (M6b-Q53). **(c)** from a [Trigger] the card is in `resolving`, from an [On K.O.] in the trash; a cost that moved it elsewhere leaves nothing to play. An ability that trashes itself as a cost and then plays "this card" still plays it from the trash.

## Hidden information and the AI

- **Life moves (G30)** reveal only the card that goes to the trash, which the rules show. Whether a Life cost is payable, and whether the "up to" question is asked, depend on the Life count, which is public. Two-position tests (positions differing only in the second Life card) show equal views, actions and events for the other player, for the effect and for the cost.
- **Looking at the opponent's deck (G31)** asks nothing, moves nothing and marks the cards known to the looker alone; two positions differing in the top card of the opponent's deck give equal projections for the deck's owner and different ones for the looker (the control). `topAnyOrder` is the existing order decision, asked of its controller only.
- **Damage (G36)** keeps the trigger decision asked for every Life card, so the damaged player's prompt does not tell the other player whether the card has a [Trigger]; a test compares the damager's view for a Life card with and without one.
- **hidden.ts / hidden-gate.ts**: `trashLife` and `damage` read no hidden card (classified, with the reason); `damage` is a prompt token in the gate check; the new actions with selectors are classified by their selectors.
- **The lethal bound** (`ai/src/search/lethal/bound.ts`, `ai/test/m6b-w4-bound.test.ts`): `damage`, `winGame`, `swapBasePower`, `canAttackActive`, `addReplacement` and a Life move are not in the neutral set, so `scanAbility` returns false and the solver searches; the search's idle-op list (`search.ts`) is a whitelist, so none of them is idle. A look at the opponent's deck is idle, as every look is. A `trashLife` cost is the attacker's own Life and adds nothing. `donGivenToTarget` is bounded at the 10 DON!! a player owns (it fell to the 100,000 ceiling without it). The counter profile (`profile.ts`) reports any other op in an Event's [Counter] as a gap, so a defender's Event with `damage` or `winGame` is not trusted either.

## Deferred

- **Kuro (OP15-025) and Mohji-type text** need nothing more; **OP11-102 Camie** also needs the "[Trigger] activated" timing (G56, wave 6).
- **`rest` replacement** for rests inside `rest` effects that also take cost-area DON!! (the `donCostArea` branch) is not routed through the new frame; no card needs it.
- **Replacement payload "possible"**: an effect payload is always counted as possible (as before); PRB02-006 with no other Character is offered and does nothing.
- **Permanent `canAttackActive`** (no card needs it).
- **`addReplacement`** for damage and rest events (no card needs it).

## Cards now expressible, by set

- **EB-02:** EB02-030 (D6).
- **EB-03:** EB03-008 (G32), EB03-054, EB03-055 (G30, G36), EB03-057 (G30).
- **EB-04:** EB04-044 (G38 with wave 2's `leaveField: any`), EB04-050 (G32).
- **OP-09:** OP09-107 (G30), OP09-118 (G35).
- **OP-10:** OP10-109, OP10-112 (G30).
- **OP-11:** OP11-010, OP11-014, OP11-082, OP11-084, OP11-119 (G32), OP11-062, OP11-070 (G31), OP11-102 (G30; the [Trigger]-activated half needs G56).
- **OP-13:** OP13-046 (G14 b, with wave 2).
- **OP-14:** OP14-001, OP14-009, OP14-017 (G33), OP14-051 (BACKLOG a), OP14-115 (G36).
- **OP-15:** OP15-001, OP15-008, OP15-015, OP15-018, OP15-025, OP15-027, OP15-031, OP15-038 (G34; OP15-008 with the Q55 reading), OP15-116 (G30), OP15-080 (BACKLOG c, no new shape).
- **ST:** ST17-003 (G31), ST20-002, ST20-005 (G30).
- **PRB02:** PRB02-006 (G37).

## Results

- Tests added: 91 in `engine/test/cards/m6b-w4/` (8 files; the count rose to 92 after the BACKLOG (c) rewrite kept 5 there) and 12 in `ai/test/m6b-w4-bound.test.ts`. Existing tests edited: `cards/test/dsl.test.ts` (two "rejects" cases that wave 4 now accepts were changed to shapes still refused), `app/test/m4b-fix.test.ts` (words for the two new modifier kinds).
- Full suite: 16,873 passed, 26 expected fail, 10 skipped, 164 todo (1,674 files); one timing test, `ai/test/budget.test.ts`, failed under the full run's load and passes alone (4 of 4). `ENGINE_GAMES=2000 npx vitest run engine/test/property`: 25 passed (9 files). Typecheck, eslint and prettier are clean. `npm run cards:measure` leaves `cards/data/coverage-report.json` unchanged (no real card is scripted).
- Goldens re-recorded (`UPDATE_GOLDEN=1`) for the version string only: the diff is the six version lines, the replayed hashes are identical.
