# M6b-2 wave 5: what was built

Deliverable of PLAN §2a M6b-2, wave 5 (G39 to G48 of [m6b-runtime-audit.md](m6b-runtime-audit.md) §2 to §4). Method as in [wave 1](m6b-wave1.md) to [wave 4](m6b-wave4.md): a DSL type, an `IMPLEMENTED` entry and validation (every variant not built is refused), a hidden-zone classification, a runtime path, planted tests on vanilla test cards (no real card is scripted), each seen to fail with its implementation broken. `ENGINE_VERSION` stays **0.5.16**: see the last section.

Tests: `engine/test/cards/m6b-w5/` (10 files, 73 tests), `ai/test/m6b-w5-bound.test.ts` (10) and `cards/test/m6b-w5-hidden.test.ts` (6). Counts and the full-suite result are in the final section.

## Per gap

| Gap | DSL | Runtime | Test |
| --- | --- | --- | --- |
| G39 delayed + bound cards | none: `{ ref }` in a `delayed` body now resolves | `Delayed.b` and `PendingEffect.b` carry the creating frame's `f.b`; `pushEffect` restores it (`run.ts` `delay`, `flow.ts` `fireDelayed`, `drainPending`) | `g39-delayed-bound.test.ts` |
| G40 `donReturned` qualifiers | timing `{ event: 'donReturned', owner, min?: n >= 2, cause?: 'effect' \| 'yourEffect' \| 'opponentEffect' }` | new `fireDonReturned` (`flow.ts`) replaces `fireEvent`: one event per returning instruction with the whole count, watchers of both fields, `owner` now read | `g40-don-returned.test.ts` |
| G41 Life face state | action `{ turnLifeFaceDown: 'all' }`; `Num` `{ lifeFaceUp: P }` | `run.ts` `turnFaceDown` (shared with the G8 cost), `eval.ts` `numOf` | `g41-life-face.test.ts` |
| G42 `returnDon` variable count | cost `{ returnDon: { atLeast: n } }` | `returnDon(..., atLeast)`: a count decision (fewest first, then the existing class choice), `payable` needs n, one `donReturned` | `g42-return-don-atleast.test.ts` |
| G43 `damageTaken` | timing `{ event: 'damageTaken', owner: P }` | the `damage` frame counts Life cards taken (`taken`) and fires when it ends with any (`flow.ts` `runDamage`, `fireDamageTaken`) | `g43-damage-taken.test.ts` |
| G44 choose a cost, reveal, compare | action `{ chooseNumber: { min, max, bind } }`; `reveal` gets `player?: 'opponent'`; `Num` `{ chosen: Name }` | `chooseNumber` is a `mode` choice 0 to 10 stored in `f.n` and announced (`ModeChosen`); `reveal` reads the opponent's deck top and marks it known to both | `g44-choose-cost-reveal.test.ts` |
| G45 Life top or bottom to hand | `move { what: { from: 'lifeTopOrBottom', owner: 'you', pick: { exactly: 1 } }, to: { zone: 'hand' } }` | `run.ts` `move` branch and `lifeEnd` (shared with the `lifeToHand` cost) | `g45-life-top-or-bottom.test.ts` |
| G46 K.O. protection by source | `{ cannotBeKOd: { cause, by?: Filter } }` | `Modifier.by`, `Derived.koBy`, `koProtected(..., source)`; the `ko` frame carries `src` (the attacker, or the effect's card) | `g46-ko-source-filter.test.ts` |
| G47 `cannotAttackTarget` | restriction `{ cannotAttackTarget: Filter }`, timed and permanent | `ModKind` `cannotAttackTarget`, `Derived.cannotAttackTarget`, `actions.ts` `checkAttack` | `g47-cannot-attack-target.test.ts` |
| G48 `skipRefresh` of DON!! | `skipRefresh { from: 'donCostArea', owner: 'opponent', filter: { state: 'rested' }, pick: { upTo \| exactly: n } }` | `ModKind` `skipRefreshDon` on the owner's Leader (`amount` = held), read in `untapAll` | `g48-skip-refresh-don.test.ts` |

Validator refusals pinned by tests: `min` below 2 or on another event, `cause` outside the three; the action `turnLifeFaceDown` with anything but `'all'`, `lifeFaceUp: 'both'`; `atLeast` below 1, with other keys, or in a replacement payload; `damageTaken` without an owner; `chosen` with no earlier `chooseNumber`, a range outside 0 to 10, a name bound twice, `reveal { player }` for Life or for `'you'`; a Life move from the top or bottom to anywhere but your hand, `upTo`, another owner; `by` and `cannotAttackTarget` filters that read anything relative to the protected card or the attacker (`ref`, `isSelf`, `playedThisTurn`, `donGiven`, a `Num` in a comparison), `cannotAttackTarget` on a player or a Stage; `skipRefresh` of DON!! for your own DON!!, without `{ state: 'rested' }`, without a count, or mixed with card zones.

## Revert checks

Each implementation was broken in turn (one line changed, its test file run, restored). Failures with the break in place, out of the file's tests:

| Break | Failing tests |
| --- | --- |
| G39 (`b` not stored by `delay`) | 1 of 4 |
| G40 `min` check / `cause` checks | 2 of 7 / 2 of 7 |
| G41 action (`turnFaceDown` not called) / `lifeFaceUp` counts every Life card | 2 of 8 / 4 of 8 |
| G42 (`atLeast` read as a fixed number) | 5 of 9 |
| G43 (`fireDamageTaken` not called) | 5 of 8 |
| G44 `reveal` reads your own deck / `{ chosen }` reads 0 | 3 of 8 / 2 of 8 |
| G45 (the `lifeTopOrBottom` branch off) | 5 of 6 |
| G46 the filter is never matched / no `src` for a battle / no `src` for an effect | 4 of 10 / 2 of 10 / 2 of 10 |
| G47 (`checkAttack` ignores the filters) | 4 of 5 |
| G48 (`untapAll` holds none) | 4 of 8 |
| Lethal bound numbers (`lifeFaceUp`, `chosen` not bounded) | 1 of 10 |

## Readings

- **G39** the delayed body reads the bindings as they were when `delayed` was reached. A played Character keeps its id while it stays on the field, so the reference finds it; once it has left it has a new id and finds nothing, so nothing happens (M6b-Q38, the audit's reading).
- **G40** a cost counts as part of the effect (RL-16, M6b-Q31), so `cause: 'yourEffect'` fires for DON!! −N and for an effect, and not when the opponent makes you return DON!!. The audit read EB03-033 as excluding costs (M6b-Q65). `owner` was ignored before (every returning player's own watchers fired); no script used anything but `you`, so no game changes.
- **G41** only face-up cards turn; with none face-up nothing happens, no event, and "if you do" reads it as not done. The face-up count is public.
- **G42** the choice is "how many" (fewest first, so the AI's default is the cheapest payment), then which classes, unless one class supplies them or all of them go. Active DON!! a later cost needs are kept back as for every `returnDon` cost. The count is the whole instruction: one `donReturned` of that number.
- **G43** fires once per damage after its processing ends (the draw waits for a [Trigger], rules-digest 106, QA-OP13 OP13-002). A damage a replacement stopped takes no Life card and fires nothing. Double Attack is one damage (M6b-Q66).
- **G44** the controller names 0 to 10 before the reveal; both players are told the number and see the revealed card, which stays on top of the opponent's deck. The comparison is `{ ref: r, matches: { baseCost: { eq: { chosen: c } } } }`. M6b-Q67.
- **G45** your own Life, mandatory: with one card there is no question, with none nothing happens. Not damage: no [Trigger]; `lifeRemoved` watchers fire. The choice is blind (Life is face-down).
- **G46** the source is read where it is when the K.O. is checked; a protection with a source filter and one without are separate (the first never makes the second weaker). A K.O. without a known source (the test operation, a rule move) is not stopped by a filtered protection. M6b-Q68.
- **G47** the target filter is read on the card that would be attacked; a Leader has no base cost, so a cost filter never bars the attack on a Leader. OP12-020 also needs D7 and is not made expressible.
- **G48** the count is read when the effect resolves (up to n, as many as they have) and kept as a modifier on their Leader that ends with their next Refresh Phase. M6b-Q69.

## Hidden information and the AI

- **No new prompt depends on a hidden card.** `chooseNumber` is always asked; `lookAtTop`-style reveals are not gated on anything. `cards/src/hidden.ts` classifies the new nodes (`reveal` of the opponent's deck and a move from the top or bottom of Life read a hidden zone, `chooseNumber`, `turnLifeFaceDown`, `lifeFaceUp`, a DON!! skip, `atLeast` and the restriction forms read none), `hidden-gate.ts` counts `chooseNumber` as a prompt and DON!! held back as a count (`cards/test/m6b-w5-hidden.test.ts`).
- **Leak cases** (two-position tests): G44, two opposing decks that differ only in the top card give the same decision and the same events to the other player until the reveal, and after it both players know that one card and no other; G45, the question and the events do not depend on the Life cards and the moved card is never named to the other player; G41, the turned cards get fresh handles and the event names no card.
- **The lethal bound** (`ai/src/search/lethal/bound.ts`, `ai/test/m6b-w5-bound.test.ts`): `turnLifeFaceDown`, `chooseNumber`, `skipRefresh`, an object `restrict` (the filtered K.O. protection, `cannotAttackTarget`), a move from `lifeTopOrBottom` and a `returnDon { atLeast }` cost on a repeatable ability are not in the neutral set, so `scanAbility` returns false and the solver searches; `winsByEffect` sends any op outside `LIFE_SAFE_OPS` (the two new actions) to the search too. `reveal` of the opponent's deck is neutral. `numBound` knows `lifeFaceUp` (6) and `chosen` (10) instead of the 100,000 ceiling.

## Deferred

- **OP12-036** also needs G63 (a hand-zone restriction, wave 7), **OP12-020** needs D7: neither is expressible after this wave although G46 and G47 are built.
- A permanent `cannotAttackTarget` is validated and tested on a Character; no card needs it.
- `damageTaken` carries no count of Life cards and no battle or effect qualifier; no card needs them.

## Cards now expressible, by set

- **EB-02:** EB02-035 (G40).
- **EB-03:** EB03-033 (G40), EB03-051 (G41).
- **OP-03:** OP03-008 (G46, with waves 1 and 3).
- **OP-09:** OP09-025 (G46), OP09-061 (G40), OP09-065, OP09-068, OP09-070, OP09-073, OP09-076, OP09-119 (G42), OP09-104 (G45).
- **OP-10:** OP10-033 (G48).
- **OP-11:** OP11-005 (G46), OP11-066, OP11-071, OP11-073, OP11-074, OP11-079, OP11-081 (G44), OP11-092 (G39).
- **OP-13:** OP13-002 (G43).
- **OP-14:** OP14-003 (G46).
- **PRB02:** PRB02-018 (G41).

25 cards (the audit's count). Cumulative with waves 1 to 4 and the scripted cards: 1,122 of 1,175 once they are scripted.

## Results

- Tests added: 73 in `engine/test/cards/m6b-w5/` (10 files), 10 in `ai/test/m6b-w5-bound.test.ts`, 6 in `cards/test/m6b-w5-hidden.test.ts`. Existing tests edited: `app/test/m4b-fix.test.ts` (words for the two new modifier kinds).
- Full suite (`npx vitest run engine cards ai`): 28,121 passed, 26 expected fail, 10 skipped, 164 todo (2,669 files). `ENGINE_GAMES=2000 npx vitest run engine/test/property engine/test/golden`: 29 passed (10 files). Typecheck, eslint and prettier are clean.
- **`ENGINE_VERSION` stays 0.5.16, goldens not re-recorded.** No recorded game plays out differently: every new shape is one no scripted card uses; the two behaviour changes that touch existing code paths are invisible to the scripted cards (`donReturned` now reads `owner`, and every scripted `donReturned` watcher says `you`; `delayed` records now carry the bindings, which no existing delayed body reads). The golden games and the 2,000-game property run replay with the same hashes with the version unchanged.
