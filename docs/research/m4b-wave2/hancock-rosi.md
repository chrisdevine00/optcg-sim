# M4b wave 2: Hancock (OP14-041) and Rosinante (OP12-061) readings

29 cards scripted (16 Hancock, 13 Rosinante), none left out. Scripts in `cards/effects/<SET>/<ID>.ts`, tests in `engine/test/cards/<ID>.test.ts`, shared constants and helpers in `engine/test/cards/helpers-hancock-rosi.ts`. For the lead to fold into DECISIONS and OPEN-QUESTIONS.

## Readings chosen where the wording is ambiguous

| Card | Reading | Alternative | Source |
| --- | --- | --- | --- |
| OP06-115 [Trigger] | "If you have 0 Life cards, you may add up to 1 card ... Then, trash 1 card from your hand." The trash is inside the "If" (CR 4-10-1), and inside it the trash happens even when the add was declined ("Then", CR 4-10-2). | The trash always happens (the "If" gates only the add). | No Q&A for OP06-115 itself; RL-42 for the neighbouring OP05-098 shows the same shape ("Then, trash 1" follows the add). |
| OP14-112 [On Play] | "If your Leader has {The Seven Warlords of the Sea}, add ... deck to Life. Then, add up to 1 card from the top of your opponent's Life" : both clauses gated by the Leader condition. Each "up to 1" can be declined on its own. | Second clause always runs. | CR 4-10-1; same reading as OP14-107 and EB04-038. |
| OP14-107 [On Play] | "draw 2 cards and trash 2 cards" are one gated clause. | none | text ("and"). |
| EB04-038 [On Play] | "If ... draw 1 card. Then, add up to 1 DON!!" : the DON!! add is gated by the DON!! comparison. | DON!! add always runs. | CR 4-10-1. |
| OP07-057 [Main] | The restriction "if the selected card attacks, your opponent cannot activate [Blocker]" is a `cannotActivateBlockerAgainstIt` modifier on the selected card for this turn, written as a separate step after the power step. It applies only if a card was selected. Not [Unblockable]. | Treat as Unblockable. | DECISIONS 2026-11-16 (G27). |
| OP14-104 [On Play] | A `select` binds the target first, then a `chooseOne` (play it / add to Life face-up) runs only if a card was selected (`if exists ref`). | Choose the mode first, then the card. | text order. |
| OP06-058 [Main] / [Trigger] | "Characters" are of any owner; each goes to the bottom of its **owner's** deck. "In any order": the order picked, no `order` decision (DECISIONS 2026-11-16). | `order` decision. | text; DECISIONS 2026-11-16. |
| ST17-004 [On Play] | `lookAtTop` with `take: []` and `topOrBottomAnyOrder` (all to top or all to bottom), as OP17-050. The DON!! is given to "1 of your ..." target (`exactly: 1`), so the new Hancock itself is a legal target. | none | QA-OP17 OP17-050 (same wording). |
| OP14-114, ST17-004 giveDon | target is `exactly: 1`; the DON!! count is "up to 1" and the engine gives min(1, rested DON!! available). With no rested DON!! the ability still activates (once per turn is spent) and gives nothing. | A card with no rested DON!! cannot activate. | text: "Give up to 1 rested DON!!" has no cost. |
| OP14-105 | "You may reveal 3 ... : Give" is an Activate: Main cost, so no `costOptional`; activating is the choice (DECISIONS 2026-11-09, B-1). The hand must hold 3 matching cards. | none | `cards/src/optional-cost.ts`. |
| OP10-114, OP12-061 discount, OP16-065 ramp | Conditions after the colon are `if` steps: the cost is paid even when the condition then fails. | Condition as an activation requirement. | text order, effect-dsl.md §6.5. |
| P-088 [Trigger] | "you and your opponent have a total of 5 or less Life cards" uses `life: both` at resolution. At a damage [Trigger] the revealed card has left the Life area, so the count excludes it. | Count it. | CR 10-1-5 (the card is in `resolving`). |

## Official rulings encoded in tests

- RL-47 / QA-OP14 OP14-041: the draw is mandatory and fires per Character played; the Life move is not damage (no [Trigger]) and needs a real K.O. Not tested: three Characters played at once (needs OP16-105 Moria, not scripted here).
- RL-41 / QA-OP12 OP12-061: replacement unusable with 0 Life; Life-to-hand is not damage.
- QA-OP17 OP17-050 wording for ST17-004.
- RL-42 / QA-OP11 OP11-102 (context for OP06-115's [Trigger] putting a card back to Life).

## Not tested or unverified

- OP12-061 discount with an effect play (E-Q2) and with the 5-Character rule trash (CR 3-7-6-1-1).
- OP14-041 [On K.O.]-style reading uses printed values (OPEN-QUESTIONS M4b-2): a Kuja Character buffed from under 5000 to 5000 power is not distinguished from base power, and no vanilla Kuja/Amazon Lily card with base power under 5000 was used.
- "Cards in any order" at a deck bottom cannot be observed for two cards of one owner with the `pick` helper (it picks in canonical order).

## Other changes outside `cards/effects` and tests

- `cards/src/optional-cost.ts`: `unitsOf` drops keyword tags (`[Blocker]` etc.) before splitting a card's text into ability units. EB04-038's text is "[Blocker] [On Play] ...", and the splitter's lookbehind (which keeps "[Activate: Main] [Once Per Turn]" together) refused to split before `[On Play]`, so the checker found no unit for the ability. Checker only; no runtime effect.
- `engine/src/record.ts` ENGINE_VERSION 0.5.2 to 0.5.3 and the three goldens re-recorded (separate commit). The `meta-random-deckout` game plays out differently because the random meta decks now run these scripts. Every wave-2 branch will need the same bump: after merging, bump once and run `UPDATE_GOLDEN=1 npx vitest run engine/test/golden && npx prettier --write engine/test/golden`.
