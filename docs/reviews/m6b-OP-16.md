# M6b review: OP-16 scripting batch 3 (95 new scripts)

**Reviewer:** independent adversarial review (subagent). Brief: find what is wrong; no stake in the scripts.
**Build reviewed:** worktree branch merged with the lead's local `main` (`9c95ed0`, contains `engine/test/independent/cards/op16/`), `npm ci`. No repository code was changed: every temporary edit (a deck override in `engine/test/support/decks.ts`, scratch deck builder and AI test, an engine debug line, the mutation edits) was reverted; `git status` is clean apart from this file, which is the only commit.

**Rule:** severity 4 = hidden-information leak or wrong game result; 3 = rules error that changes play, or blocking defect; 2 = notable defect; 1 = nit. Any 3 or 4 fails.

**Verdict: FAIL.** One severity 3 (OP16-R1: OP16-022 treats "the only Characters on your field are {Impel Down}" as true with no Characters, against the decision on file). No severity 4. Four severity 2 (two open readings on OP16-001 and OP16-034, the Bentham power reading, and an engine gap for "in any order" from hand), three severity 1. Of the three independent disagreements, A-1 (OP16-022) and B-1 (OP16-047) are real; A-2 (OP16-035) is a defect in the independent test kit, not in the script or the engine. Nothing differs from the verified text in a cost, number, filter, duration, once-per-turn or timing keyword across the 95 scripts.

## Method

1. Listed the 95 new scripts (`git log --diff-filter=A --name-only --format= d46f6d1..HEAD -- 'cards/effects/OP-16/OP16-*.ts'`: 95) and dumped each beside its verified text in `cards/data/sets/OP-16.json` and its override (`cards/overrides/OP16-*.json`), then compared clause by clause: costs, conditions, "up to" vs exact, "you may", "Then" vs "If you do", durations, once per turn, owner/zone/filter, base vs current values, thresholds, printed keywords (checked by a script: printed `[Blocker]`, `[Rush: Character]`, `[Unblockable]` match the script, the override and the card data for all 95).
2. Read the four `OP-16-scripting-g*.md` files, DISAGREEMENTS-a/-b/-c and API-GAPS-a/-b/-c, rules-digest, rulings (RL-15, RL-19, RL-33), `m6b-runtime-audit.md` section 7 (Q9, Q13, Q16, Q21, Q26, Q29), OPEN-QUESTIONS (E-Q4, E-Q11, M4b-5, M6b-Q*), DECISIONS 2026-11-23 "M6b-1 decisions", `effect-dsl.md` (the `window` row), and the two earlier reviews for format.
3. Tests: `npx vitest run engine/test/cards/OP16 engine/test/independent/cards/op16 cards`: 807 files, 8,063 passed, 3 expected fail (the three `it.fails`: OP16-022, OP16-035, OP16-047). The `optional-cost` checker failures that group 1 and 2 reported are fixed on `main` (the test passes).
4. Settled the disagreements by reading the engine (`engine/src/effects/run.ts`) and by probes with a scratch test.
5. Random games, AI games and a mutation check (below).

## Findings

### OP16-R1 (3) OP16-022 Monkey.D.Luffy (Leader): "the only Characters on your field are {Impel Down}" is true with no Characters
- **Card:** "[Activate:Main] [Once Per Turn] If the only Characters on your field are {Impel Down} type Characters, set up to 2 of your DON!! cards as active."
- **Script:** `conditions: [{ none: { from: 'characters', owner: 'you', filter: { not: { type: 'Impel Down' } } } }]`, which is vacuously true at 0 Characters. The author test (`engine/test/cards/OP16-022.test.ts` line 28) pins it: "with no Characters at all there is no other Character, so it can be activated (reading)".
- **Evidence:** DECISIONS 2026-11-23 (M6b-1 decisions): "'only Characters without a Counter' is false with no Characters (E-Q4; OP16-022)"; `m6b-runtime-audit.md` M6b-Q21: "Script OP16-022 as false at 0 Characters unless the wording differs"; OPEN-QUESTIONS E-Q4, resolved by QA-OP17 OP17-118 (0 Characters: the condition is not met). The grammar is the same ("if the only X on your field are Y"). The independent test `it.fails` "M6b-Q21: with no Characters at all the condition is false" confirms the engine offers the activation at 0 Characters and sets 2 DON!! active. The scripter's note calls it "open"; it was closed by the decision before scripting.
- **Impact:** a wrong game result in a common state: this Leader with an empty board (turn 1 to 2, or after a board wipe) gets 2 free active DON!! every turn, which the card does not give.
- **Fix:** `conditions: [{ all: [ exists characters you, none characters you not type Impel Down ] }]` (or the `exists` as a second condition); flip the author test at line 28 to "not offered / does nothing", and turn the independent `it.fails` into `it`.

### OP16-R2 (2) OP16-001 Portgas.D.Ace (Leader): the 8000-power clause is read on one branch only
- **Card:** "Up to 1 of your [Monkey.D.Luffy] Characters or up to 1 of your Characters with a type including "Whitebeard Pirates", with 8000 power or more, gains [Rush] during this turn."
- **Script:** `any[ name Monkey.D.Luffy, all[ typeIncludes Whitebeard Pirates, power >= 8000 ] ]`; the audit (M6b-Q16) read "the condition applies to both".
- **Evidence:** the clause is set off by a comma after the second branch, which in Bandai's wording more naturally modifies the whole coordination (it follows both "up to 1" phrases), and the audit read it that way; but the nearest-noun reading (second branch only) is also grammatical, and the scripter's design argument (a 6000 [Monkey.D.Luffy] OP16-015 with its hand discount) is a guess about intent, not a source. No Q&A on file; M6b-Q16 is "No" for an official answer. The independent author deliberately asserted only differences both readings share (10000 Luffy in, 8000 non-Whitebeard out).
- **Why 2, not 3:** genuinely ambiguous. If the audit's reading is the right one, the script lets a 5000 to 7000 Luffy gain [Rush] (too permissive, a wrong result); if the script's is right, the audit is too strict.
- **Fix:** put the question in OPEN-QUESTIONS (M6b-Q16 already names it); if both-branches, change the filter to `all[ any[name Luffy, typeIncludes WB], power >= 8000 ]` and flip the one author test and the independent assertions that cover a low-power Luffy.

### OP16-R3 (2) OP16-047 Donquixote Doflamingo (and OP17-053, OP17-095): "place ... at the bottom of the deck in any order" from hand or trash gives the owner no order choice
- **Card:** "they place 2 cards from their hand at the bottom of their deck in any order."
- **Script:** one `move` of 2 hand cards to `{ zone: 'deck', position: 'bottom' }`, `chooser: 'opponent'`. The scripting note says "the order of two hidden cards is not observable".
- **Evidence (disagreement B-1):** `engine/src/effects/run.ts` `move` asks for an order (`kind: 'order'`) only for cards leaving `characters`/`stage` (the OP06-058 branch near line 1475); the branch for `zones.every(z => z === 'trash' || z === 'hand')` (line 1463) moves the cards in canonical (instance) order with no decision. OP16-059/072 do offer an order because `lookAtTop` ... `rest: 'bottomAnyOrder'` has its own order step. CR 3-1-7/3-1-8 (rules-digest 47) and the printed "in any order" give the owner the choice. The order is observable later: it fixes which card the owner draws first when the deck is cycled, and the choice is the owner's, secret from the other player.
- **Affected scripts (engine-wide):** every scripted `move` to deck bottom of more than one hand or trash card: OP16-047, OP17-053 (same wording, 2 from hand), OP17-095 (3 from trash, as a replacement). OP11-054 has its own top/bottom order path, EB05-027/OP17-046 move one card, OP17-041/OP06-058 move field Characters (ordered). Other scripted cards that pay "place N from trash at the bottom in any order" as a cost (the `trash`/`place` cost forms) were not found by `grep "position: 'bottom'"`; they use a different shape and were not re-checked.
- **Who is right:** the independent author on the rule; the script is a faithful transcription, so the defect is the engine. Severity 2: no leak (the order is simply not offered), the effect on play is small.
- **Fix:** give the hand and trash branch the same order step as the Character branch for 2 or more cards of one owner (`kind: 'order'`, hidden from the other player), then the `it.fails` in `OP16-047.test.ts` becomes an `it`.

### OP16-R4 (2) OP16-034 Monkey.D.Luffy: "for each of your Characters with a different card name" (M6b-Q9, no ruling)
- **Script:** `count` with `distinctNames: true` over all your Characters, Luffy included, times 1000. A lone Luffy gets +1000, two Characters with different names +2000.
- **Evidence:** the competing reading, "Characters whose name differs from Luffy's", gives 0 for a lone Luffy and counts two same-named Characters as 2. M6b-Q9 says "No" for an official answer; both authors assert only the common ground (one more distinct name +1000, a same-named copy +0). Differences are exactly +1000 in the lone-Luffy case and for repeated other names.
- **Why 2:** a 1000-power difference in every use until ruled; not provable wrong.
- **Fix:** leave until the Q&A; the open question is already recorded.

### OP16-R5 (2) OP16-036 and OP16-055 Mr.2.Bon.Kurei(Bentham): the copied power is the Leader's current power, the audit said base power (M6b-Q29)
- **Card:** 036 "This Character's base power becomes the same as your opponent's Leader during this turn." 055 "... the same as your opponent's Leader's power ...".
- **Script:** `select` the opposing Leader, then `setBasePower` with `refStat power` (current power at resolution, DON!! and effects included).
- **Evidence:** the Blue text says "Leader's power", which means current power; the Green text omits "power" but is the same effect printed twice, so the same reading is right for both. The audit (M6b-Q29) preferred base power for "same as your opponent's Leader" with no source. It matters only when your own effects have lowered or raised their Leader on your turn (common: a -1000 or -2000 effect). Both authors pinned the current-power reading.
- **Why 2:** unresolved reading, small and conditional effect.
- **Fix:** none now; list in OPEN-QUESTIONS next to M6b-Q29.

### OP16-R6 (1) Disagreement A-2 (OP16-035) is an independent-kit defect, not an engine behaviour
- See the ruling below. The `it.fails` in `engine/test/independent/cards/op16/OP16-035.test.ts` fails because `playCard` (`engine/test/independent/helpers.ts` `play` then `payFromActive`) answers any pending `choose` that offers a `costActive` DON!! candidate, treating it as the play-cost payment. Zoro's "rest up to 1 of your opponent's cards" offers the opposing DON!! class, so the kit rests one opposing DON!! before the test looks.
- **Fix:** the test should use `act(g, { type: 'playCard', ... })` and `need(g, 'choose', 'p1')`, and become an `it`; the helper should only auto-pay while the decision's source is the play cost (`purpose`), so a future [On Play] "rest N of your cards" or "rest your opponent's cards" is never hidden from a test. Any independent test that plays a Character whose [On Play] offers a DON!! class right after the play is exposed to the same blind spot.

### OP16-R7 (1) Author and independent tests miss clauses (mutation survivors)
- Author-only survivors: OP16-012 (10 DON!! to 9), OP16-085 (cost 6 to 7), OP16-059 (play up to 2 to 3), OP16-105 (Life 1 to 2), OP16-103 (own-turn [On K.O.] condition removed; an own-turn K.O. needs a scripted source, and EB05-048/049 K.O.-your-own-Character costs would do).
- Survivors in both suites: OP16-081 Otama (cost 8 to 7: no test at cost 7), OP16-084 (cost 20 to 19: a Momonosuke of cost 19 is not reachable with real cards), OP16-104 (`refStat power` to `basePower`: no test puts a modifier on the selected Character), OP16-096 (cost 6 to 7: equivalent, no cost-7 Yamato exists).
- **Fix:** add boundary cases for 012, 081, 085, 059, 105, a modified-power case for 104, and an own-turn K.O. case for 103.

### OP16-R8 (1) OP16-048 Buggy: RL-19's remark that a Leader can gain [Blocker] from OP16-048 does not match the card, and the "this effect can be activated when your opponent attacks" shape is scripted as an auto, not as an activation window
- **Card:** "... [Once Per Turn] This effect can be activated when your opponent attacks. Up to 1 of your [Prisoner of Impel Down] cards gains [Blocker] during this turn."
- **Script:** second ability `auto`, `onOpponentAttack`, `oncePerTurn`, target your Characters named [Prisoner of Impel Down], up to 1, [Blocker] this turn.
- **Evidence:** the verified text can only target [Prisoner of Impel Down] cards, which are Characters; a Leader cannot be chosen, so the script is right for the text. The RL-19 sentence "Leaders can also gain [Blocker] from effects (QA-OP16 and QA-OP17, card OP16-048 Buggy)" cannot be checked from the repository (no Q&A text on file) and does not fit this card; probably a mis-citation (the Q&A may be about a Leader gaining [Blocker] by another card, or about [Blocker] on an attacked card). `effect-dsl.md` models "can be activated when ..." as an `activate` ability with a `window`; the DSL has no `window` on activate abilities, and as an auto the difference is only that the player is not asked at the attack (they are asked for the target, with "up to 1" they can decline, and declining keeps the Once Per Turn use for a later attack, QA-OP17 OP17-058). No wrong result.
- **Fix:** lead to re-read the QA-OP16 row for OP16-048 and correct RL-19 if it is a mis-citation; no script change.

## Script versus card text: result

95 of 95 compared. Apart from R1, R2 (reading), R4, R5 (readings), no mismatch in costs, conditions, "up to", "you may", "Then" gating, durations, once-per-turn, owner/zone/filter, base or current values, printed keywords or textHash. Points checked and found right (the ones most likely to be wrong):

- **Numbers and thresholds:** 003 reveal 2, -6000; 005 -3 cost, 8000+; 006 rest 2, 4000 or less; 008 trash base 10000, K.O. 8000 or less (current); 009 Rush and +2000 to the end of the opponent's next End Phase; 010/011/013 base power 2000/2000/8000 (printed); 012 10 DON!! on the field (rested and given count), the "If" after the colon so the 1 DON!! is spent even when it fails; 015 -2 cost with an "Ace" name Leader and 6 DON!!, both bases 7000; 017 -4000 when no cost 8 Whitebeard Character; 018 once per turn, 6000 or more; 019 two, exactly 8000; 038 rest 6 and 5 different {Impel Down} names; 043 cost 5; 045/050 return cost 2 or more; 047 8 or more cards; 051 5 or less after the card left the hand; 053 6 or less; 054 5 or more with DON!! x1 on your turn; 056 cost 9; 057 two Prisoners, +4000; 058 10 DON!!, base 7000; 059 rest 7, look 5, up to 2, 6000 or less; 060 return 8 active DON!!, up to 3 different names; 063 DON!! -1, once per turn; 073 DON!! -2, set active, [Blocker] until the end of the opponent's next End Phase; 076 rest 3, up to 3, +2000, counter +4000; 081 cost 8 or more, -2000; 084 cost 20, 9 DON!!, cost 9 exactly; 085 cost 6 or less, not [Kouzuki Momonosuke]; 087 +20 cost; 089 -4 cost; 090 cost 1 or less; 099 rest 6, mill 5; 101 10 in trash, cost 2 or less; 105 Life 1 or less, three plays; 111 Life 2 or less; 116 10 DON!!.
- **Once Per Turn:** 001, 022, 048, 052, 063, 094 have it; 049, 056, 060, 081, 084, 098, 047, 021 have none (their text has none).
- **Optional costs:** `costOptional` only on Events (020 main and counter, 038, 059, 076, 099); the rest are "you may" activations or auto costs.
- **Timing:** [Your Turn] 003, 034, 054 (as ability conditions, with `donGiven: 1` where printed); [Opponent's Turn] 103; [End of Your Turn] 030, 073; [On K.O.] 013, 014, 031, 043, 094, 096, 102 to 103, 106, 107, 109, 110, 114; [On Your Opponent's Attack] 015, 048; the six "[Trigger] Activate this card's [On K.O.] effect" cards use `activate: onKO of self`.
- **Then/If:** 026, 035, 089, 090, 093, 097, 099, 101 (Then, if), 102, 110 are independent steps; 066, 106, 116 sit inside the leading "If" (see the judgments); 035's "you may trash ... If you do, give" is `may` plus `ifDid`.
- **Targets:** 001 one pick over the union; 020/057/076 counter Leader or Character; 021 Leader or Character for the DON!!; 036/055 the opposing Leader; 039/040 [Monkey.D.Luffy] as Leader or Character; 058 counter [Buggy] by exact name over Leader and Characters; 087 [Kouzuki Momonosuke] Characters; 118 one card in total.

## Readings flagged in the scripting docs: judgments

| Reading | Judgment |
| --- | --- |
| OP16-001 8000 on one branch | Ambiguous; finding R2 (2). |
| OP16-066 / OP16-106 / OP16-116 "Then" inside the if | Right. Closed ruling M4b-5 and RD 121-122 (CR 4-10-1, 8-3-3): a "Then" after a failed "If" does not resolve. 106 is "draw 1, then up to 1 ... base power" inside one "If" sentence. 116: the audit's stronger reading (Life step ungated) was answered "no" under M6b-Q13; the Life step does not depend on a Teach having been played (tested by the independent author). |
| OP16-084 cost-20 activation condition | Right. "Trash this Character with a cost of 20 or more" is a cost whose object must qualify; an activation condition on the Character's current cost is equivalent (cannot be paid below 20). The 9-DON!! check is after the cost; the target is the printed cost 9 in the trash by name. Mutation 20 to 19 survives (unreachable value). |
| OP16-087 Characters-only target | Right. A Leader has no printed cost to raise and "[Kouzuki Momonosuke]" is a Character name; the +20 is a cost change on the field only. |
| OP16-048 [Blocker] grant | Script right for the verified text (Prisoner Characters only); RL-19's Leader remark is unverified; R8 (1). |
| OP16-034 distinct names | R4 (2), open M6b-Q9. |
| OP16-036 / OP16-055 "same as your opponent's Leader" | R5 (2). |
| OP16-099 mill then play | Right. The target is chosen after the 5 cards are trashed, so a milled Character can be played; "Then" is independent; a deck of 5 or fewer loses (RL-26, tested). |
| OP16-104 base power fixed at resolution | Acceptable. The selected Character's power with its modifiers is read when the effect resolves and fixed; no ruling on later changes; with no selection nothing changes. The `power` stat is not pinned by any test (R7). |
| OP16-118 hand permanent | Right. A permanent of the Character on the field whose target zone is the hand; the printed power of the hand card (no modifiers apply in hand) decides; the +2000 replaces the printed counter (the highest applies, CR 2-10-4). One card in total for the look (the text says "add it"; M6b-Q26 has no ruling, same reading as OP15-073). |
| OP16-012 cost paid when the "if" fails | Right. The "If" follows the colon, so it is the effect's condition; the rest of 1 DON!! is spent either way. |
| OP16-022 "only Characters are {Impel Down}" with none | Wrong against the decision on file; R1 (3). |
| Other g1 readings (reveal or play "with 8000 power" is exactly 8000; 015's base 7000 can lower a higher base; 005's "a Character with 8000 power or more and a type including ..." is one Character meeting both) | Right; each matches the text and is tested by both authors. |

## Disagreement rulings

| # | Cards | Who is right | Reason |
| --- | --- | --- | --- |
| A-1 | OP16-022 | Independent author | DECISIONS 2026-11-23 (M6b-1 decisions), M6b-Q21 and E-Q4 (QA-OP17 OP17-118): "the only Characters on your field are X" is false with 0 Characters. The script is vacuously true; the author test pins the wrong reading. Severity 3, OP16-R1. The `it.fails` becomes an `it` with the fix. |
| A-2 | OP16-035 | Script and engine; the independent test is wrong | The engine asks: with the opponent holding 3 active DON!! and a Character, `playCard` followed by a raw `act` leaves a pending `choose` for p1 ("rest up to 1 of your opponent's Leader or Characters or Stage or DON!! cards.", min 0, max 1; legal picks: the Leader, the Character, the `costActive` DON!! class, and `done`). `selectRest` (`engine/src/effects/run.ts` line 771) does ask for `upTo`; no decision is skipped. The kit's `playCard` -> `payFromActive` answers any `choose` that lists `costActive`, so one opposing DON!! was rested before the test looked. Not an engine-wide behaviour of DON!!-including selectors: every `rest` over a zone list that includes `donCostArea` (this card, and the "rest N of your cards" scripts such as EB05-019 and OP17-021/037/038) goes through the same `selectRest`, which asks whenever `upTo` or a surplus of candidates leaves a real choice. Only a kit that auto-answers hides it. Severity 1 (test kit), OP16-R6. |
| B-1 | OP16-047 | Independent author on the rule; the defect is the engine | See OP16-R3: no order step for a hand or trash move to the bottom of the deck; OP16-059/072 differ because `lookAtTop` has its own order step. Engine-wide: OP16-047, OP17-053, OP17-095. Severity 2. |
| C | none | | DISAGREEMENTS-c.md reports none; spot checks of its riskiest assertions (OP16-101 counting the Event in the trash, OP16-105/111 Life counts after the damage card left, OP16-118 one card in total) agree with my readings. |

## Random games, AI games and mutation checks

**Decks.** Twelve legal Standard decks (50 cards, at most 4 per id, colours within the Leader's; `deckErrors` empty), two per Leader (OP16-001 Ace, OP16-022 Luffy, OP16-041 Buggy, OP16-060 Sengoku, OP16-079 Yamato, OP16-080 Teach), built only from scripted or vanilla Standard cards, with 33 to 50 batch cards each (10 to 18 distinct batch scripts per deck; OP16-041/079/080 lead unscripted Leaders, which play as vanilla Leaders). For the property harness `metaDecks()` was temporarily pointed at these twelve plus the two pinned Rocks/Kaido lists that two properties require (reverted).

**Property harness** (`ENGINE_GAMES=3000`, `npx vitest run engine/test/property`, all 8 files, 17 tests, pass): 3,000 random legal games (4 parts of 750), 586,309 actions, 0 capped; results 2,419 "damage at 0 Life" and 581 "deck out"; every listed action reduces (1,068,176 sampled reductions), 4,590,144 unlisted actions threw, replay hash equal to live hash in every game. Leak, projection and skeleton-diff properties (`leaks.test.ts`, `projection.test.ts`, `skeleton-diff.test.ts`, the link tracker with its planted leaks) pass with the batch's cards in the decks, including OP16-047 (opponent-chosen hand placement), OP16-107 (opposing Life card to its owner's hand), OP16-108 (face-up Life) and the six [Trigger] activations.

**AI games** (`ai/test/support/match.ts` `playMatch`, tier `pirate` vs `pirate`, 10 games per deck against rotating other decks, alternating seats, seeds 9000 and up): 120 games, 0 errors, 0 capped, 0 fallbacks (`onFallback` counted), results 120 "damage at 0 Life"; every chosen action was in the seat's own list (the harness throws otherwise). Wins as the named deck: Ace v0 8/10, v1 7/10; Luffy v0 1/10, v1 6/10; Buggy v0 5/10, v1 10/10; Sengoku v0 3/10, v1 1/10; Yamato v0 8/10, v1 7/10; Teach v0 4/10, v1 3/10 (random pairings and random fill; not a strength claim). Caveat: the `pirate` tier does not search (`session.ts`: only warlord and emperor search), so "no fallback" is weak evidence for the search path; the engine side was exercised by the 3,000 random games.

**Mutation check.** Temporarily broke one clause in 56 mutants across 55 distinct scripts (restored after each; `git status` clean afterwards), ran the author test and the independent test of the card. One more (OP16-103 `opponentsTurn: true` to `false`) was an equivalent mutation (the validator only allows `true`), redone as "condition removed".

| Result | Author tests | Independent tests |
| --- | --- | --- |
| Mutants killed | 47 of 56 | 51 of 56 |
| Survivors | 9: OP16-012, 081, 084, 085, 059, 096, 103, 104, 105 | 5: OP16-081, 084, 096, 104 (and 103 only by the equivalent form; the removal form is killed) |

Author survivors that the independent tests kill: OP16-012, OP16-085, OP16-059, OP16-105, OP16-103 (condition removed). Survivors in both: OP16-081 (cost 8 to 7), OP16-084 (20 to 19, unreachable), OP16-104 (`power` to `basePower`), OP16-096 (6 to 7, equivalent: no cost-7 Yamato exists). See OP16-R7.

## Other observations (no finding)

- The independent kits (`kit-op16*.ts`, over `kit-op17b.ts`) still accept some "optional" prompts automatically (the EB05-R4 blind spot, in BACKLOG).
- An "up to 1" step with no candidate opens an empty `choose` in OP16-116 with 10 DON!! and no [Marshall.D.Teach], but not in OP16-097. Harmless (the empty pick is auto-skipped for a human watcher: no candidates to hide).
- Scripts compile to hashes that match the data (`cards/test/script-text.test.ts` passes); the registry and set index are current.
