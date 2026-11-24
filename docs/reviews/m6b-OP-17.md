# M6b review: OP-17 scripting batch 2 (59 scripts: OP-17 plus the wave 2 cards)

**Reviewer:** independent adversarial review (subagent). Brief: find what is wrong; no stake in the scripts.
**Build reviewed:** worktree branch merged with the lead's local `main` (`git merge FETCH_HEAD`, contains `cards/effects/OP-17/OP17-117.ts` and `engine/test/independent/cards/op17/`), `npm ci`. No repository code was changed: the temporary edits (a deck override in `engine/test/support/decks.ts`, scratch AI test and deck builder, and the mutation edits to scripts) were all reverted; the only committed file is this review.

**Rule:** severity 4 = hidden-information leak or wrong game result; 3 = rules error that changes play, or blocking defect; 2 = notable defect; 1 = nit. Any 3 or 4 fails.

**Verdict: PASS.** No severity 3 or 4. Three severity 2 and four severity 1 findings. Both independent disagreements (B-1, OP17-068 and OP17-078) are the known E-Q11 engine behaviour, not script defects. No script differs from its verified text in a cost, number, filter, duration, once-per-turn or timing keyword. The two things most likely to be wrong in play are readings, not transcription: the power limit of OP17-007 (R1) and the Double Attack scope of EB05-052 (R3).

## Method

1. Dumped all 59 scripts (`git log --diff-filter=A --name-only 45af49d..HEAD -- cards/effects`: 58 OP-17 scripts, including the wave 2 cards OP17-018/020/043/116, plus EB05-052) beside the verified text in `cards/data/sets/OP-17.json` / `EB-05.json` (and `cards/overrides/OP17-007.json`) and compared clause by clause: costs, conditions, "up to" vs exact, "you may", "Then" vs "If you do", durations, once per turn, owner/zone/filter, base vs current values, timing keyword.
2. Read the three OP-17 readings files, `wave2-cards-scripting.md`, both DISAGREEMENTS and API-GAPS files, rules-digest (items 15, 87, 95, 103, 117, 120), rulings, `m6b-runtime-audit.md` §7, OPEN-QUESTIONS (E-Q5, E-Q11, M4b-4, M4b-5), `m6b-wave2.md` (D4, G14), and the EB-05 review for format.
3. Tests: `npx vitest run engine/test/cards/OP17 engine/test/cards/EB05-052 engine/test/independent/cards/op17 cards`: 616 files, 6,076 passed, 4 expected fail (the two OP-17 `it.fails`, OP17-068 and OP17-078, and the two EB-05 ones, EB05-033/036, still documenting E-Q11).
4. Random games, AI games and mutation checks (below).

## Findings

### OP17-R1 (2) OP17-007 Kouzuki Oden: the 6000 power limit is applied to both alternatives
- **Card:** "[On Play] If your Leader is [Edward.Newgate] or has the {Land of Wano} type, play up to 1 {Land of Wano} type Character card **or Character card with a type including "Whitebeard Pirates" with 6000 power or less** from your hand." (override restored "or Character card" from Limitless; `data-sources.md` row 25).
- **Script:** one filter `all[category Character, any[type Land of Wano, typeIncludes Whitebeard Pirates], power <= 6000]`.
- **Evidence:** the restored "or Character card" makes two noun phrases; as written the trailing "with 6000 power or less" follows the second phrase only (the second "with" is the attachment point). Bandai's own two-alternative wording elsewhere has the same shape and puts the limit on the last phrase (OP09-046: "Play up to 1 "Cross Guild" type Character card or Character card with a type including "Baroque Works" with a cost of 5 or less"; not scripted yet, so no precedent in the repo). If the limit belongs to the second phrase only, a {Land of Wano} Character of any power (including 7000 to 10000) is playable and the script is too strict. The readings file records this as open; the independent author chose the same reading without outside evidence. The unambiguous alternative is not obviously wrong, so this is not a transcription error.
- **Why 2, not 3:** genuinely ambiguous, no official Q&A on file. It becomes a 3 if the Q&A says the limit is on the second alternative only.
- **Fix:** put the question in OPEN-QUESTIONS (new M6b entry); if confirmed literal, change the filter to `any[ all[type Land of Wano], all[typeIncludes Whitebeard Pirates, power <= 6000] ]` and flip the two tests that pin the current reading.

### OP17-R2 (2) E-Q11 "adding more DON!! is never worse" is false; counter-examples exist in this batch and EB-05 (see the E-Q11 assessment)
- **Cards:** OP17-068 Sasaki, OP17-078 Drunken Dragon Bagua (and, same engine path, EB05-033, EB05-036; `addDon` is in 20 script files now, BACKLOG says 18).
- **Evidence:** `engine/src/effects/run.ts` `addDon` adds `min(n, donDeck)` with no decision. The rule (CR 4-8-1, rules-digest 15, QA-GR) allows 0 to N. 38 Standard-legal cards read DON!! counts against the opponent's (list under the assessment); for them extra DON!! on your own field can only hurt you or help the opponent. M4b-4 already made `giveDon` ask the count in the same fix round, so "a count decision would only cost prompts" no longer distinguishes the two.
- **Impact:** a legal option (add fewer) is unavailable; a small strength loss in purple/Animal Kingdom decks that also play the "equal to or less than your opponent's DON!!" family, and a free enabler for the opponent's `EB02-061`/`OP05-069`/`OP05-071`-style conditions. No wrong result for a player who does not care.
- **Fix:** see the recommendation below (ask a count for `addDon` only, most first, "fewer" last, as `giveDon` does). Keep `setActive` as is.

### OP17-R3 (2) EB05-052 Gloriosa: one replacement covers a whole Double Attack hit, and no test covers it
- **Card:** "If you would take damage, you may trash this Character instead."
- **Script/engine:** `replaces: { damage: 'you' }`; `m6b-wave2.md` D4: accepting "pops the whole damage frame (every Life card still owed, a Double Attack's two included)", also at 0 Life.
- **Evidence:** rules-digest 95 and CR 7-1-4-1-1-3 describe Double Attack as 2 damage processed by repeating the Life step; OPEN-QUESTIONS Q3 reads each point as a separate "Leader takes damage" event for effect damage. If each point is a separate "would take damage", Gloriosa prevents only the first point of a Double Attack hit and the second still lands (and at 0 Life, still wins the game for the attacker); the engine prevents both. That is a wrong game result under that reading (attacker's win denied). The independent authors explicitly did not test Double Attack (API-GAPS-a) and no effect damage is scripted as scenery.
- **Why 2:** M6b-Q5/Q8 are recorded as open and the reading is documented in the script; the whole-hit reading is defensible ("the amount is fixed once determined", QA-GR).
- **Fix:** ask for a ruling; add a Double Attack test with the chosen reading (author or independent).

### OP17-R4 (1) OP17-010 Fossa, OP17-030 Monkey.D.Luffy, OP17-034 Rockstar: a leading "If" is read as an activation condition
- **Quote (034):** "[Activate: Main] [Once Per Turn] If your opponent's Leader has 6000 power or more, set up to 1 of your DON!! cards as active. Then, ..."
- **Evidence:** rules-digest 87 and rulings.md line 263 support "must hold at the activation timing" only for `[DON!! xX]`. For a plain "If" opening the effect sentence the alternative is "activate, pay the (here empty) cost, spend Once Per Turn, effect does nothing". The engine's reading never lets the player waste the Once Per Turn use; the only observable difference is that the activation is not offered. No wrong result is possible from it (a fizzled activation is never useful), so severity 1. Note that for OP17-034 the gating of the base-power step by the same "If" is consistent with the closed M4b-5 ruling ("Then" after a failed "If" does not resolve).
- **Fix:** none needed; record in OPEN-QUESTIONS with EB04-007.

### OP17-R5 (1) Author tests miss two clauses that the independent tests catch
- **OP17-066 Orochi:** mutation `cost gte 10` to `gte 9` survives all 5 author tests (killed by 1 independent test). The author test uses a Character far from the threshold.
- **OP17-021 Crone Oil:** mutation `cause: 'opponentEffect'` to `'any'` survives all 6 author tests (killed by 1 independent test). The author test never checks that Crone Oil is not offered for a battle K.O. or the owner's own effect.
- **Fix:** add a boundary case (cost 9) and a "battle K.O. is not replaced" case to the author tests.

### OP17-R6 (1) OP17-015 Marco: the replacement is offered for his own removal
- **Evidence:** API-GAPS-a. When Marco is himself the Character removed by the opponent's effect (bounce, bottom of deck), "K.O. this Character instead" is offered; accepting turns a bounce into a K.O. (and then [On K.O.] can replay him from the trash at the cost of a hand card). It is optional and arguably legal ("one of your Characters" includes him). The independent test declines it if asked. Not a defect; the extra prompt and the "worse than bounce" option are harmless.
- **Fix:** none; note for the Q&A list (M6b-Q7 family).

### OP17-R7 (1) OP17-085 Dorry / OP17-092 Brogy: the lock does not stop a chained play of a third copy
- **Evidence:** G3 readings: the Character play restriction is applied after the play, so the fetched card's own [On Play] can play another Dorry/Brogy from hand or trash (a legal chain with 4 + 4 copies); the fetched card's [On Play] then applies the lock again. Reading "Then, you cannot play Character cards during this turn" as taking effect after the play is the natural one, and the chain terminates. No finding beyond documentation; listed so the lead knows it was checked.

## Script versus card text: result

59 of 59 compared. Apart from R1 (reading) and R3 (engine reading), no mismatch in costs, conditions, "up to", "you may", "Then" gating, durations, once-per-turn, owner/zone/filter or timing keyword. Points checked and found right (the ones most likely to be wrong):

- **Numbers:** every power/cost amount and threshold matches the text (001 +4000; 005 -4 cost, 10000, base 8000; 009/014/016 base power 2000; 013 -2 cost and -6000; 018 8000 base and +4000; 036 6 DON!!, cost 6, two K.O.s; 038 rest 4; 041 base cost 1; 053 +3000; 057 +1000; 064 +2000; 072 +1000; 078 add 3, rest 2, trash 2; 097 -1 cost and +3000; 099, 101 -3000 and cost 5; 103 -3000; 108 cost 6; 115 +4000; 116 two Triggers; 117 +3000, three cards, cost 6).
- **Once Per Turn:** 001, 010, 020, 025, 030, 034, 053, 064, 072, 101 have it; 014, 033, 057 do not (their text has none).
- **Optional costs:** `costOptional` only on Events (018, 036, 037 counter, 038, 078, 116); the rest are "you may" activations or auto costs, as the optional-cost validator requires.
- **Timing:** [Opponent's Turn] on 002/009; [Your Turn] on 103/104 as an ability condition (a [Trigger] play on the opponent's turn does nothing: tested); [DON!! x2] on 011; [End of Your Turn] on 031/047; [On K.O.] on 012/015/025/026/053; [On Your Opponent's Attack] on 001/014/033/057/064/072.
- **Then/If:** 029, 036 independent "Then" (the second step runs even if the first did nothing); 003/013/026/027/034/066/067/068/069/078/085/092/103/104 "Then" or follow-up sits inside the leading/colon "If" (M4b-5 closed ruling); 099 mode 1 "Then add up to 1" not gated on the trash; 117 `if hand >= 3` with `else` K.O.
- **Costs before the colon:** 066/067/069/071 `donMinus 1` is paid before the Leader/Character `if` is read (cost paid even if the condition fails); 068/078/104 cost paid before the Leader-type `if`.
- **Targets:** 004 one pick over the union; 033/057/064/001/072/018/038 one pick over Leader or Characters; 036/115/117 `name` filter over Leader or Characters ("up to 1 of your [Shanks]/[Charlotte Linlin]" has no zone); 115 [Main] Leader only, no pick; 041 no pick (all matches); 097 snapshot of all.

## Readings flagged in the scripting docs: judgments

| Reading | Judgment |
| --- | --- |
| OP17-007 limit on both alternatives | Ambiguous; the literal grammar leans the other way. Finding R1. |
| OP17-010/030/034 leading "If" as activation condition | Acceptable, not worse than the alternative; R4 (1). |
| OP17-015 Marco `opponentEffect`, play back active | Right. No "rested" in the text, so the play is active; the text says "by your opponent's effect", so battle K.O. is not covered (tested by both authors). Own-removal prompt: R6. |
| OP17-043 Ganzui `cause: any` | Right for the verified text ("would be removed from the field", no qualifier). Offered for battle K.O., both players' effects and bounce; not for the rule trash that makes room (CR 3-7-6-1-1). Replaced costs are allowed (CR 8-3-1-7), so an own "trash this Character" cost on Ganzui would also qualify; no card combines them. Independent tests agree. |
| OP17-085/092 "Then" inside the if | Right (closed M4b-5). Lock not gated on having played a card ("up to 1" may be empty); consistent. R7 chain note. |
| OP17-099 Linlin | Right. "Your" is the Leader's controller (the opponent only picks the mode); mode 1 "Then add" is not gated on the trash; mode 2 is a blind pick by the controller (E-Q5, random in the engine); mode choice is a `chooseOne` by the opponent with neutral labels for the other seat (leak, skeleton and projection properties pass with it in the decks). |
| OP17-103 "Then" | Right: inside the "if", not "If you do"; the -3000 resolves with the Life card declined (CR 4-10-2). |
| OP17-117 Maser Saber | Right. With 3 or more cards the opponent chooses before the K.O. target is picked; with fewer the K.O. happens. The K.O. target is chosen by the Event's owner (no `chooser`), the trash by the opponent. The "do not trash" option is selectable even with no legal K.O. target, which is the opponent's free choice. |
| EB05-052 whole-damage replacement at 0 Life | Defensible; Double Attack scope unconfirmed and untested. R3. |
| OP17-020 `oneOf` | Right. "You may ... or ..." is the player choosing to activate; only payable alternatives are offered, the player chooses when both are payable (the independent test selects by label and passes); the effect is "up to 1 rested" so with none rested the cost is still paid. |
| OP17-018 / OP17-116 [Counter] "If" at resolution | Right. A [Counter] has no separate activation, so the condition belongs to the effect: the Event can be played and its cost is spent even if fewer than two qualifying Characters exist. `basePower >= 8000` (018) and printed `hasTrigger` (116) are the printed-value readings the text asks for. |

## Disagreement rulings

| # | Cards | Who is right | Reason |
| --- | --- | --- | --- |
| B-1 | OP17-068, OP17-078 | Independent author on the rule; the engine deviates deliberately | CR 4-8-1, rules-digest 15 and QA-GR allow adding 0 to N. `addDon` adds the maximum (E-Q11). Not a script defect: both scripts are correct (`upTo: true`). Both `it.fails` stay. Severity 2 for the engine-wide behaviour, see R2 and the assessment. |
| A | none | | DISAGREEMENTS-a.md reports none; spot checks of its riskiest assertions (OP17-007, 004, 021, 014, EB05-052 at 0 Life) passed and agree with my readings, except R1 and R3 where "agrees with the script" is not evidence of the rule. |

## E-Q11 assessment ("add up to N DON!!" and "set up to N DON!! as active")

**Claim:** more DON!! is never worse "unless a card makes fewer better". **It is false for adding, true in practice for setting active.**

Evidence, from card data (Standard-legal) and this batch:

1. **38 Standard cards compare DON!! counts** (EB05-033 among them): EB02-035/037/039/041, EB03-035/038, EB04-038, EB05-033, OP06-061/063/065/067/069/072/077, OP07-062/064/065/066/068/069/070/078, OP08-060, OP09-066, OP10-075, OP12-041/062/073/078, OP14-063, P-093, PRB02-010, ST10-012, ST26-005 ("the number of DON!! cards on your field is equal to or less than the number on your opponent's field" or "at least N less"), plus the opponent-facing EB02-061 ("opponent has 5 or more DON!!": Rush), OP05-069 Trafalgar Law and OP05-071 Bepo ("opponent has more DON!! cards on their field than you"). For these, extra DON!! on your side makes **your** conditions false and **the opponent's** true.
2. **Within this batch:** OP17-068/078 (Animal Kingdom Pirates, purple) add 2 or 3 rested DON!! mid-turn. A purple deck with OP06-061 Vinsmoke Ichiji, OP06-063/065/069 or EB04-038 (none requires a GERMA Leader for the DON!! clause of the [On Play]) cannot play them after attacking with Sasaki without the condition being false; with 0 to N it could add fewer or none. Sequencing (play first, attack later) hides some but not all cases (Sasaki fires on every attack, Bagua is a Main Event).
3. **Within EB-05:** two EB05-033 Nico Robin in one turn: the first adds 4 DON!! (forced), which closes the "at least 6 less than the opponent's" gap and disables the second. With "up to 4" and 0 chosen the second could still draw 3. Same for EB05-036 Tsuru ahead of a DON!!-comparison card.
4. **`setActive`** ("set up to 1 of your DON!! as active", OP17-029/030/034): no counter-example in the card pool; the only conceivable one is keeping the last rested DON!! rested to feed "give up to 1 rested DON!! card" (OP17-025 Building Snake, EB01-002), and an active DON!! is never worse than a rested one for any cost. Keep.
5. **Prompt cost:** M4b-4 made `giveDon` ask the count (most first, "None" last) in the same fix round; the engine already carries that machinery.

**Recommendation: revisit E-Q11 for `addDon` only.** Implement the count choice for `addDon` when the DON!! deck holds more than 0 and the player could take fewer, defaulted/ordered most first (as `giveDon`), and let the AI treat it as a normal branch (two to four options). Keep `setActive` as decided. Until then keep the two `it.fails` and the BACKLOG item, and correct the OPEN-QUESTIONS rationale (the "never worse" claim). Not blocking this batch (severity 2, and a deliberate owner decision).

## Random games, AI games and mutation checks

**Decks.** Seven legal Standard decks (50 cards, at most 4 per id, colours within the Leader's), built only from scripted cards, using the batch's cards first (Newgate OP17-001 with 16 batch cards, Shanks OP17-020 15, Rocks Xebec OP17-039 5, Kaido OP17-058 8, Luffy OP17-079 3, Linlin OP17-099 9, plus a Linlin deck with 4 EB05-052 Gloriosa). For the property harness `metaDecks()` was temporarily pointed at these seven (reverted).

**Property harness** (`ENGINE_GAMES=3000`, `npx vitest run engine/test/property`, all 8 files, 17 tests, pass): 3,000 random legal games (4 parts of 750; 1 in 5 played passively), 658,793 actions, 0 capped; results 2,397 "damage at 0 Life" and 603 "deck out"; every listed action reduces (1,158,792 sampled reductions), 5,156,602 unlisted actions threw, replay hash equal to live hash in every game. Leak properties (`leaks.test.ts`, 200 runs; `projection.test.ts`; `skeleton-diff.test.ts`, 250 seeds in both modes; link tracker with its planted leaks): no hidden-information finding with OP17-099, OP17-117, OP17-047/053 (opponent-chosen hand placements) and EB05-052 in the decks.

**AI games** (`ai/test/support/match.ts` `playMatch`, tier `pirate` vs `pirate`, 10 games per deck against rotating other decks, alternating seats, seeds 9000+): 70 games, 0 errors, 0 capped, 0 fallbacks (`onFallback` counted), results 69 "damage at 0 Life", 1 "deck out"; every chosen action was in the seat's own list. Wins per deck as first named: Newgate 7/10, Shanks 5/10, Xebec 5/10, Kaido 2/10, Luffy 6/10, Linlin 6/10, Linlin+Gloriosa 4/10 (not a strength claim; random pairings). Caveat: the `pirate` tier does not search (`session.ts`: only warlord/emperor search), so "no fallback" is weak evidence for the search path; the engine side was exercised by 3,000 random games.

**Mutation check.** Temporarily broke one clause in 24 scripts (script restored after each; `git status` clean afterwards), ran the author test and the independent test of that card. Two further attempts were discarded: OP17-004 `typeIncludes "Whitebeard Pirate"` is an equivalent mutation (substring match), and the OP17-047 pattern was not present.

| Card | Mutation | Author | Independent |
| --- | --- | --- | --- |
| OP17-016 | up to 2 to up to 1 | 1 fail | 3 fail |
| OP17-036 | rest 6 DON!! to 5 | 1 fail | 2 fail |
| OP17-053 | +3000 to +2000 | 1 fail | 2 fail |
| OP17-064 | drop Once Per Turn | 1 fail | 1 fail |
| OP17-041 | base cost 1 to 2 | 3 fail | 5 fail |
| OP17-066 | cost 10 to 9 | **0 fail (survives)** | 1 fail |
| OP17-099 | opponent chooses to you choose | 1 fail | 7 fail |
| OP17-117 | hand >= 3 to >= 2 | 1 fail | 1 fail |
| OP17-043 | trash 2 to trash 1 | 3 fail | 5 fail |
| OP17-020 | rest 1 DON!! to 2 | 3 fail | 2 fail |
| OP17-103 | -3000 to -2000 | 2 fail | 3 fail |
| EB05-052 | optional to mandatory | 3 fail | 8 fail |
| OP17-010 | 10000 to 9000 | 1 fail | 1 fail |
| OP17-085 | restriction Character to Event | 1 fail | 2 fail |
| OP17-005 | base power 8000 to 7000 | 2 fail | 6 fail |
| OP17-021 | opponentEffect to any | **0 fail (survives)** | 1 fail |
| OP17-015 | opponentEffect to any | 5 fail | 5 fail |
| OP17-057 | +1000 to +2000 | 2 fail | 4 fail |
| OP17-025 | Once Per Turn off | 1 fail | 1 fail |
| OP17-101 | -3000 to -2000 | 1 fail | 1 fail |
| OP17-105 | hasTrigger filter off | 4 fail | 8 fail |
| OP17-029 | rest up to 2 to up to 1 | 1 fail | 2 fail |
| OP17-097 | -1 cost to -2 | 1 fail | 3 fail |
| OP17-068 | add 2 to add 1 | 1 fail | 3 fail |

**24 of 24 killed by the independent tests; 22 of 24 by the author tests** (survivors: OP17-066 and OP17-021, finding R5).

## Other observations (no finding)

- `cards/src/optional-cost.ts` already has `/would (?:be|take)/` for replacements, so the tooling finding in `wave2-cards-scripting.md` is fixed.
- The four `it.fails` in the suite are the E-Q11 documentation tests (OP17-068, 078, EB05-033, 036); none hides another defect.
- The independent kits (`kit-op17a.ts`, `kit-op17b.ts`) still accept some "optional" prompts automatically (the EB05-R4 blind spot, in BACKLOG); the OP-17 disagreements do not depend on it, but a missing effect-level "use?" prompt would not be seen by those helpers.

## Fix round (2026-11-24)

- **OP17-R2 (E-Q11):** accepted. `addDon` gets a count choice (most first, as `giveDon`), as a separate engine change with its own planted tests and ENGINE_VERSION bump; `setActive` stays as it is (no counter-example found). The four `it.fails` (OP17-068, OP17-078, EB05-033, EB05-036) become `it` with that change.
- **OP17-R5:** the author tests of OP17-066 (cost threshold) and OP17-021 (cause) are tightened with the same change.
- **OP17-R1 (OP17-007 power limit) and OP17-R3 (EB05-052 against Double Attack):** reading questions, added to OPEN-QUESTIONS (OP-17-Q1, M6b-Q5/Q8); scripts unchanged until a ruling.
- **OP17-R4, R6, R7:** severity 1, accepted as they are (R7 is correct play).

Batch merged to main after the review (runbook step h).
