# M4b wave 2: Robin and Yellow Enel readings

Scripts: `cards/effects/<SET>/<ID>.ts` for 23 cards (OP09-062, EB04-058, OP09-078, OP12-112, OP16-117, OP16-119, OP17-102, OP17-106, OP17-107, OP17-109, OP17-110, OP17-111, OP17-112, OP17-113, OP17-114, ST34-003, OP05-098, EB02-052, OP11-106, OP13-113, EB01-056, EB01-059, EB04-059). Tests: `engine/test/cards/<ID>.test.ts`, helpers in `engine/test/cards/helpers-robin.ts`.

## Readings chosen

| Card | Reading | Alternative | Source |
| --- | --- | --- | --- |
| OP09-078 Gum-Gum Giant | "If your Leader has the "Straw Hat Crew" type, up to 1 ... +4000. Then, draw 2" : the draw is inside the "if" (a failed condition skips it). The DON!! -2 and the trash cost are paid either way. | Draw 2 always (a "Then" clause that does not depend on the first). | CR 4-10-1 (rules-digest 122); no per-card Q&A in QA-OP09. |
| EB02-052 Enel | "If you have 1 or less Life cards, add up to 1 ... to Life. Then, this Character gains +1000 power": the +1000 is inside the "if". The trash cost is paid either way. | +1000 always. | CR 4-10-1; no per-card Q&A found. |
| Quoted types | `has the "Straw Hat Crew" type` and `"Sky Island" type` (quotes) are `typeIncludes`; `{Big Mom Pirates}`, `{Blackbeard Pirates}` (braces) are exact `type`. | exact type for the quoted ones. | CR 2-4-3-1, same as OP17-056. |
| OP05-098 Enel | `lifeBecameZero` on `owner: you`, `opponentsTurn` condition, `oncePerTurn`; "add 1 from deck" is "up to 1" (asked), "trash 1 card from your hand" is mandatory and does nothing with an empty hand. A [Trigger] on the last Life card resolves first. | none | RL-42, QA-OP05 OP05-098, QA-OP11 OP11-102. |
| OP09-062 Robin | The "trash 1 card with a [Trigger]" cost is offered with "you can't pay" when no such card is in hand (runtime behaviour for unpayable `trash` costs); with an empty DON!! deck the cost is payable and nothing is added. The DON!! enters rested. | none | RL-50, QA-OP01 OP01-101. |
| [Your Turn] [On Play] (OP17-106, 110, 114) | A `yourTurn` condition on the auto: when the card enters on the opponent's turn through [Trigger] nothing activates and no cost is offered. | none | card text; CR 8-1-3 |
| OP17-110 Perospero | "Then, this Character gains [Rush]" is independent of the play (it gains Rush even if nothing was played). | none | CR 4-10-2 |
| OP17-112 Linlin | Permanent base-power layer (`setBasePower` under `yourTurn`) reads the printed 4000 and `hasTrigger`; modes are `chooseOne` with `neutral` log lines for the opponent. | none | DECISIONS 2026-11-16 (staged layers) |
| EB01-059 Kingdom Come | [Trigger] cost bound `{ life: 'both' }` is evaluated while the Trigger card is in no area, so it is not counted. [Main] K.O. then `trashLifeUntil 1` is not gated on the K.O. | none | QA-EB01 EB01-059, RL-25 |
| EB04-059 Twister | Two `select`s (cost <= 6, then cost <= 5 and not the first), then two K.O.s; each "up to 1". The cost "turn 1 Life face-up" is only payable when a face-down top card exists (OPEN-QUESTIONS M4b-3). | one 2-card pick with `groups` (not implemented) | draft in m4b-drafts |
| OP17-102 Oven | The K.O.'d Oven is already in the trash when [On K.O.] resolves and is excluded by name. | none | text |

## Runtime observations (not changed)

- With 0 Life, the cost `lifeToHand` (OP11-106, EB01-056) is not offered at all (the ability silently does nothing), whereas an unpayable `trash`, `reveal` or `turnLifeFaceUp` cost is offered as an `optional` decision whose accept is illegal. Inconsistent but harmless; the tests pin the current behaviour.
- A `lookAtTop` whose candidates are all filtered out still shows a `choose` decision with `max: 0` (OP13-113 test), while a `play` from trash with no candidate shows none.
- An `upTo` draw-from-deck move to Life ("add up to 1 card from the top of your deck to Life") is an `optional` yes/no decision.

## Tooling fix

`cards/src/optional-cost.ts`: `[Trigger]` was in the header list used to split effect text into units, so "trash 1 card with a [Trigger] from your hand:" (OP09-062, OP16-117, OP17-109, OP17-111) was cut in two and the "you may ... :" clause was not found. Effect text never has a [Trigger] header (it is in `triggerText`), so it was removed from `HEADERS`. Planted test: `cards/test/optional-cost-trigger-word.test.ts`.

## Goldens

`SCRIPTS_VERSION` changed; the three golden records were re-recorded (`UPDATE_GOLDEN=1`). ENGINE_VERSION unchanged: no state hash or result changed, only the `scripts` version and one event-type sequence hash (`meta-random-deckout`). Six agents each re-recording will conflict in these JSON files: re-record once after the merge.
