# M4b wave 2: R/G Luffy (OP13-001) and Purple Enel (OP15-058), readings chosen

28 cards scripted, all from `cards/data` text. Scripts are in `cards/effects/<SET>/<ID>.ts`, registered through `cards/effects/rgluffy-penel.ts` (one spread line in `index.ts`). The lead folds the items below into DECISIONS and OPEN-QUESTIONS.

## Readings of ambiguous wording

| Card | Reading chosen | Alternative | Source |
| --- | --- | --- | --- |
| OP13-118 | "If your Leader is multicolored, set up to 4 DON!!. Then, you cannot play Character cards with a base cost of 5 or more" puts the restriction inside the guard: with a Leader that is not multicolored the restriction does not apply. | The restriction is unconditional. | CR 4-10-1 (a clause after a failed "if" cannot resolve), rules-digest item 122. No official Q&A found. |
| OP15-074 | "If your Leader is [Enel], draw 1 card. Then, up to 1 of your Characters gains +2 cost ..." puts the cost boost inside the guard. | The boost is unconditional. | CR 4-10-1, same as above. |
| OP15-075 | The K.O. after "Then" needs the [Enel] Leader too (inside the guard). | K.O. unconditional. | CR 4-10-1. |
| OP15-076 | The -1000 power after "Then" needs the [Enel] Leader (inside the guard). | Unconditional. | CR 4-10-1. |
| OP15-058 | "Then, give up to 4 rested DON!! ..." is inside the "second turn or later" guard; the whole ability does nothing on the first turn but the Once Per Turn is used. | Giving DON!! is unconditional. | CR 4-10-1; QA-OP15 OP15-058 (RL-40). |
| OP05-038 | [Counter] "Then, you may trash 1 card from your hand. If you do, set up to 3 DON!!" is part of the effect (not a cost). The `may` + `ifDid` pair is wrapped in `if hand >= 1`: a `may` label means "accepted" in the runtime, so with an empty hand accepting would otherwise still set DON!! active although nothing was trashed. | A bare `may` + `ifDid` (wave 1 shape). | effect-dsl §4.10; found by a failing test while writing this card. |
| OP13-001 | One recipient gets the whole boost (this Leader or one Straw Hat Crew Character); `rest any number` includes 0. | Split among recipients. | effect-dsl §6.1; open question Q-T2 stays. |
| OP13-001 | The condition (5 or less active DON!!) and the rest are decided at [On Your Opponent's Attack], before any Counter. | Counter first. | QA-OP13 OP13-001, RL-46. |
| OP15-035 | "Rest 2 of your cards instead": Leader, Characters, Stage and active cost-area DON!!, mixed in one pick; only active cards can be rested; Laboon may rest itself. | Only DON!! or only Characters. | CR 1-3-2-1; wave 1 `rest` cost with `donCostArea`. |
| OP17-023 | The replacement applies to K.O. by effect and by battle, to any of your {East Blue} or {Straw Hat Crew} Characters including Nami herself while active, and one rest covers several simultaneous K.O.s. | One rest per Character. | QA-OP17 OP17-023. Tested with a planted "K.O. all" effect. |
| ST21-003 | The 6000 power is checked when selecting, not when it attacks; "cannot activate [Blocker]" is the `noBlocker` modifier, not [Unblockable]. | Check at attack time. | DECISIONS 2026-11-16 "M4b wave 1". |
| ST31-004 | "-1000 power" (the minus sign was lost upstream; `data-sources.md` fix 56). The count of {Straw Hat Crew} cards on the field is taken once when the effect starts and includes this card, the Leader and the Stage; each repetition picks again. | Re-count each time. | `forEach` semantics (wave 1). |
| ST10-010 | The opponent chooses the 2 cards (E-Q5); the 7-card condition is read on resolution after DON!! -1 is paid. | The controller chooses. | effect-dsl §4.6 `trashFromHand`. |
| OP09-072 | "DON!! -2, You may trash 1 card from your hand" is one optional cost for an [On Play] (an auto with a cost is optional by construction). Both parts are paid or neither. | Trash is a separate "may". | effect-dsl §4.2 (auto with a cost). |
| OP13-076 | [Main] "You may rest 5 DON!!" uses `costOptional`; "any DON!! given" is read after the rest. [Counter] "You may trash 1 card" also `costOptional`. | None. | `cards/src/optional-cost.ts` (the check accepts all of them). |
| OP05-077, OP15-074 to 077 | `DON!! -1:` only on an Event is optional without `costOptional` (the Mamaragan precedent). | n/a | DECISIONS 2026-11-09 B-1. |
| OP15-118 | Removal protection covers K.O., bounce and other removal by the opponent's effect, not a battle K.O. (a tie lost to a 10000 attacker is tested). Given DON!! count as on the field for "6 or less". | n/a | wave 1 `removalProof`. |
| OP15-071, OP15-067 | "6 or less DON!! cards on your field" is `donOnField` (cost area plus given), as in the digest. | n/a | rules-digest. |

## Not covered by official Q&A

None of OP05-038, OP13-027, OP13-118, OP14-022, OP15-035, OP17-022, ST21-003, ST31-004, OP08-036, OP05-077, OP10-067, OP12-071, OP13-076, OP15-061/066/067/071/074/075/076/077/118, ST10-010, OP09-072, OP07-064 has a Q&A entry in `docs/research/rulings.md`. Tests are named after the card text instead.

## Cross-cutting items for the lead

- **ENGINE_VERSION is bumped to 0.5.3 and the three goldens are re-recorded** (separate commit). `meta-random-deckout` replays differently with the new scripts (the meta decks hold some of these cards), so the convention in `engine/test/golden/golden.test.ts` requires a bump. With six waves merged the goldens must be re-recorded once after the merge; this commit can be dropped and redone (`UPDATE_GOLDEN=1 npx vitest run engine/test/golden && npx prettier --write engine/test/golden`).
- **AI lethal tests used three of these cards as unscripted fixtures** (`OP13-001` a plain 5000 Leader, `OP13-027` a 7000 vanilla, `OP13-118` a 7000 [Double Attack] vanilla). Scripting them made 9 tests in `ai/test/lethal.test.ts` and `lethal-bound.test.ts` fail (the bound reads `SCRIPTS`). Fix: `ai/test/support/vanilla.ts` (`asVanilla(ids)` removes the scripts for one test file; vitest isolates files) called in the four `lethal*` test files. The same will happen for other waves' cards that these tests use (for example OP14-104 as MORIA); extend the `asVanilla` list rather than changing the assertions.
- **Runtime observation, not changed:** a `may` step that has nothing to do (an empty hand for a "may trash") is still offered and still counts as accepted for `ifDid`. Scripts that need the stricter reading guard with an `if` (OP05-038 does). A cleaner fix would be to not offer a `may` whose steps cannot act; left to the lead since it touches semantics.
- No engine source change other than the ENGINE_VERSION constant.
