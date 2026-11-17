# M4b wave 2: Sabo (OP13-004) and Black Luffy (OP17-079) archetypes

Scripted 24 cards: OP13-004 EB04-007 OP15-088 OP17-080 OP17-081 OP17-082 OP17-083 OP17-084 OP17-086 OP17-087 OP17-089 OP17-093 OP17-095 OP17-096 OP17-119 ST01-011 OP14-096 OP15-092 OP17-098 (Sabo, 19) and OP17-079 OP17-090 OP17-094 ST14-017 OP17-091 (Black Luffy, 5). Tests: `engine/test/cards/<ID>.test.ts`, helpers in `helpers-sabo.ts`.

## Engine change (the one)

`engine/src/effects/run.ts`, `select`: a `pick.totalCost` budget (OP17-119 Loki, OP17-118 Rocks) summed the **printed** cost of each candidate (`defs[...].cost`), not the current cost. "Total cost" is the current cost (CR 2-7-6, RL-43). With Elbaph cards in play (Saul and Loki have +12 on the field) Loki could K.O. a cost 16 Character as if it cost 4. Fix: `dvOf(c, id).cost` (the derived cost; the candidate filter `cost` already did this). Test: `OP17-119.test.ts` "reads an opponent Character's current cost" fails without the fix. Because it changes how a game can play out, ENGINE_VERSION is bumped 0.5.2 to 0.5.3 and the three goldens are re-recorded (see Versions).

## Versions

Adding scripts changes SCRIPTS_VERSION, and the random golden games draw scripted cards, so their result changes; `record.ts` and the golden test then require a bump before re-recording. I bumped to 0.5.3 and re-recorded in this branch so the suite is green. Six agents do this in parallel: after merging, bump once and run `UPDATE_GOLDEN=1 npx vitest run engine/test/golden && npx prettier --write engine/test/golden` again (take either branch's JSON in a conflict, they are regenerated).

EB04-007 was used as an unscripted "9000 power, no Counter, no Trigger" stand-in. Scripting it broke six tests in `ai/test/lethal-bound.test.ts`; the constant there is now OP10-046 (unscripted, 9000, no Counter, not a meta card). Not touched, left for the lead to judge: `ai/bench/rate.ts`, `ai/test/lethal*.test.ts` (still green), `app/src/play/setup/scenarios.ts`, `usability-scenarios.ts`, `app/e2e/learning.spec.ts`, `app/test/coach.test.ts` use EB04-007 as filler; with the script its [On Play] and [Activate: Main] are live where it is played or in hand.

## Readings chosen

| Card | Reading | Alternatives | Source |
| --- | --- | --- | --- |
| "If there is a Character with a cost of 12 or more" (OP17-080, 082, 083, 084, 087, 090, 091, 093, 095, 096, 098) | Any Character on either side, current cost, the card itself included (`exists` with `owner: 'any'`). | Only your own Characters. | Card text says "there is a Character" (no "you have"), unlike OP13-004 "If you have a Character". The drafts use `owner: 'any'`. No per-card Q&A found for these in `rulings.md`. |
| OP13-004 "a Character with a cost of 8 or more" | One of your own Characters. | Any Character. | Text "If you have a Character". RL-51. |
| OP13-004 [DON!! x1] | `donGiven: 1` on the Leader, both turns (a state check). The +1000 per DON!! itself is your turn only. | none | RL-13, RL-51. |
| OP17-119 "K.O. your opponent's Characters with a total cost of 4 or less" | `pick: { upTo: 5, totalCost: { lte: 4 } }`: any number up to the 5-Character area, may choose none. The text gives no count. | `exactly` (forces a K.O.). | Same shape as OP17-118 Rocks; "up to" is the default for a budgeted choice (effect-dsl §4.11). Draft in `m4b-drafts/hard-cards.json`. |
| OP17-119 two permanents | One ability for "+12 cost" and one for "if it is your opponent's turn, +3000 power". | One ability with `tiers`. | Equivalent; separate abilities read like the text. |
| OP15-088 "You may trash 3 cards from the top of your deck:" | `mill: 3` as an auto cost (optional by construction); the milled cards are in the trash when the play is chosen, so one of them may be played. Cannot be paid with fewer than 3 cards in the deck, and then does not even ask (public information). | none | Draft; CR 8-3-1-4; engine `payable`. |
| OP15-092 tiers | Cumulative thresholds on the controller's trash count; "Apply each of the following effects": at 30 cards all three apply. The Leader's base power becomes 7000 only on the opponent's turn, even if that is not higher. | "Highest tier only". | The text says "Apply each". CR 4-9-2-1 (several base-power settings: highest). |
| OP17-095 replacement | Covers any of your Characters (not only itself), "any order" means the order picked (DECISIONS 2026-11-16). Used on removal from the field by the opponent's effect (K.O., trash); not battle, not your own effects, needs 3 cards in the trash (otherwise no prompt). | An `order` decision. | DECISIONS 2026-11-16, RL-31. |
| ST01-011 Brook | `giveDon n: 2, state: 'rested'` to `pick: { exactly: 1 }` of Leader/Characters (Brook itself is allowed). The DON!! just rested to pay for Brook are the rested DON!! given. | `upTo: 1` target. | Text: "your Leader or 1 of your Characters"; the target is required, only the DON!! count is "up to". |
| Event [Main] "You may rest N DON!!:" (OP14-096, OP17-098) | `costOptional: true`: the cost is asked and may be declined; accepting spends it even if the "if" after the colon fails. | none | DECISIONS 2026-11-09 B-1, RL-52. |
| OP14-096 [Counter] "10 or more cards in your trash" | Counted when the effect resolves; the Event itself is not yet in the trash. | none | CR event resolution; tested with 9 and 10. |
| EB04-007 [Activate: Main] condition | Checked on activation (CR 8-3-2-3); Once Per Turn is spent by activating. `[Rush: Character]` granted `thisTurn`. | none | G34 of the audit. |
| EB04-007 [On Play] "until the end of your opponent's next End Phase" | Duration `untilEndOfOpponentsNextTurn` (it ends in the opponent's End Phase). | none | RL-11, OP17-054 precedent. |
| OP17-079 | Permanent `grant` Blocker to your Characters whose current cost is 12 or more. | none | RL-43 and QA-OP17 OP17-079 rows 1 and 2, both tested (negating the Leader; negating a Character whose own +12 is the only reason it is 12). |
| "+12 cost" cards (OP17-081, 089, 094, 119, OP15-088 +6, OP15-092 +10) | Field only, not in hand, trash or deck. | none | QA-OP17 OP17-085 / OP17-089 via RL-43. |
| ST14-017 | Cost +1 for your black {Straw Hat Crew} Characters (colour Black, type SHC), not the opponent's, not the Stage itself. | none | Text. |

## Engine behaviours worth knowing (not changed)

- A choice from a hidden zone is asked even when nothing qualifies (a `choose` with `max: 0`, then `done`): after a look at the top of the deck with no {Elbaph} card, and when the opponent must trash from an empty hand (OP17-091), so no information leaks.
- An optional cost on an ability that cannot be paid on public information (deck size, DON!!) does not prompt; when it depends on the hand (a trash cost) the prompt appears with "use" unavailable. An Event's optional cost is always asked.

## Unverified

- No official Q&A rows for most of these cards were available offline: only the OP17-079 and OP13-004 entries in `rulings.md`. The "any Character" reading of "there is a Character with a cost of 12 or more" is from the wording, not from a ruling.
- Simultaneous-removal behaviour of OP17-095 (one application for two Characters, QA-OP17 OP17-021 / OP17-023 style) is not tested.
