# M6b review: block 3 batch B scripting (OP-09 88, EB-02 45 = 133 new scripts)

**Reviewer:** independent adversarial review (subagent). Brief: find what is wrong; no stake in the scripts.
**Build reviewed:** worktree branch merged with the lead's local `main` (`4043f35`, then the OP-09 group A blind tests and `kit-op09a.ts`, merged on request), `npm ci`. No repository code was changed: every temporary edit (a deck-pool override in `engine/test/support/decks.ts`, the mutation edits to `cards/effects`, the positive-control edit to EB02-014, scratch tests and harnesses, all prefixed `b3crev-`) was reverted or deleted; `git status` is clean apart from this file, the only commit.

**Rule:** severity 4 = hidden-information leak or wrong game result; 3 = rules error that changes play, or blocking defect; 2 = notable defect; 1 = nit. Any 3 or 4 fails.

**Verdict: PASS. No severity 3 or 4.** No hidden-information leak (3,192 targeted games, 1.43 million two-world comparisons, 0 differences; the positive control is detected). No script disagrees with its verified text on a number, comparator, owner, timing, keyword or tag. No batch B card has the cost-free, no-Once-Per-Turn [Activate: Main] shape that looped the Pirate AI in batch A, and none of 260 Pirate games looped on a batch B card. Three severity 2 (unrecorded readings, two surviving-mutant groups, the two `it.fails`) and four severity 1.

## Method

1. Dumped the 133 scripts (the files added by commits `cfb5cb6`, `9f9852d`, `a4f0873`, `a54e201`, `00d78a1`, `cfae2e5`, `bec4c09`) beside the merged card text (`cards/data/sets/OP-09.json`, `EB-02.json`, which already carry the overrides) and read each clause by clause: numbers, comparators (base vs current), names (exact vs "type including"), owners, durations, costs vs effects, "up to", "Then", "If" placement, Once Per Turn, tags. Mechanical cross-check (script, 133 cards): (a) every integer in each card text (reminder text removed) appears in the script; (b) printed keywords equal `keywords`; (c) a `trigger` ability exactly when the card has trigger text; (d) every timing tag, `[DON!! xN]` and `[Once Per Turn]` has a matching construct. **0 flags** (positive control: a mutated 6000 in OP09-009 is flagged). No card has an "If" before a cost colon; all "If" clauses after a colon or without a colon are effect conditions in the scripts, as the house rules say.
2. Read the six DISAGREEMENTS files, the API-GAPS notes and the readings docs (`OP-09-scripting-g1..g4.md`, `EB-02-scripting-g1`, `g2`).
3. Baseline (the brief's command): 291 files, **7,591 tests pass, 2 expected failures** (the two `it.fails`: OP09-095 and EB02-044). 133 independent test files (about 1,340 `it` blocks) and 133 author test files (about 700). Hidden-gate check (`cards/test/hidden-gate.test.ts`, 10 tests) passes with an empty allowlist.
4. Test audit: 14 direct `isLegal`/`whyNot` calls in the new tests, all pass `player`; the other illegality assertions go through kit helpers on `g.legal()` of the deciding player with the decider asserted first (`canAct`) or implied by the position (R6). No `it.skip`, `.todo` or `.only`. Prompt-appearance assertions use raw `g.act` (`need`, `answerEmptyChoose` asserts the prompt is asked and empty); `skipEmptyPick`/`skipEmptyChoose` are used only for public sources (the trash, the opposing board, own Characters), as the group notes say.
5. Probes (rules, hidden information, random, AI, mutation) below.

## Findings

### B3C-R1 (2) Open readings not recorded in OPEN-QUESTIONS
Four readings change play if the official ruling goes the other way. Each is in a scripting note or a DISAGREEMENTS file; none is in `docs/OPEN-QUESTIONS.md` (batch A's B3B-R4 asked for the same).
- **EB02-059** `[Counter] ... play up to 1 of your yellow "Straw Hat Crew" type Character cards or [Sanji] with a cost of 5 or less from your hand.` Script: `(yellow AND {Straw Hat Crew}) OR name Sanji`, cost 5 or less on both. Probe: with Life 1 and a red {Straw Hat Crew} [Sanji] (ST01-004) in hand the pick offers it (`["OP03-102","ST01-004"]`). If "yellow" binds both options the red Sanji must not be offered. Only a yellow Sanji is tested. Judgement: the script's reading is the natural one (a name option is not coloured by the colour word before a type option), but it is unsettled and affects non-yellow Sanji in multicolour decks only.
- **OP09-093** `Then, negate the effect of up to 1 of your opponent's Characters and that Character cannot attack until the end of your opponent's next turn.` The first negation says "during this turn"; the second has no duration. Script: `thisTurn` for both, ban `untilEndOfOpponentsNextTurn`. Also the second "up to 1" is asked even when the Leader pick was skipped (a "Then" after an "up to" that chose nothing, the OP13-066 precedent). The DISAGREEMENTS-c note says both are deliberately not asserted.
- **OP09-032** `[On Your Opponent's Attack] [Once Per Turn] Set this Character as active.` Whether the use is spent when Rosinante is already active is unspecified (DISAGREEMENTS-b); the script spends it (an effect with no condition resolves).
- **OP09-001 / OP09-074** `up to 1` picks that choose nothing: the Once Per Turn is spent when the ability resolves with "done" (Shanks) or the trigger fires and no target is chosen (Bepo); not asserted for later attacks (DISAGREEMENTS-b).
- **Fix:** add M6b-Q entries for the four; no script change unless ruled.

### B3C-R2 (2) Surviving mutants that matter
86 mutants (Method 7). Survivors: **OP09-080 Thousand Sunny** `cause: 'opponentEffect'` to `'effect'` (survives both suites: no test removes your own {Straw Hat Crew} Character by your own effect on the opponent's turn); **EB02-048 Brook** [On K.O.] Laboon cost bound 4 to 5 (survives both; equivalent in the pool, no cost-5 Laboon exists: Laboon cards are cost 1, 2, 4, 4); **OP09-111 Brook** hand boundary 6 to 5 (author suite only; the independent suite kills it); **OP09-052 Marco** `koCause: 'opponentEffect'` to `'effect'` (independent suite only; the author suite kills it: "no scripted own-side K.O. source" in DISAGREEMENTS-b).
- **Fix:** add one boundary test each: OP09-080 (own-effect removal on the opponent's turn, e.g. a trash cost; none expected), OP09-111 (5-card hand: no trash), and for OP09-052 a K.O. by your own effect on the opponent's turn if a source exists.

### B3C-R3 (2) The two `it.fails` are test errors: settle and rewrite
**EB02-044 Sengoku** (`black "Navy" type`) and **OP09-095 Laffitte** (`"Blackbeard Pirates" type card`): the blind tests read a quoted type as a substring (rules-digest 27) and expect OP17-089 (`{Former Navy}`) and OP09-094 Peachbeard (`{Blackbeard Pirates Allies}`) to be offered. Evidence for the exact reading, all from the data:
- `docs/research/data-sources.md` row 43 (OP12-056_p2: the official `{Navy}` is rendered `"Navy"` by optcgapi) and row 54 (P-084_p1: `{Cross Guild}` rendered `"Cross Guild"`).
- The substring form is always printed in words: 87 card texts in `cards/data` contain `type including "X"`; 295 contain a quoted `"X" type`. OP09-044 and OP09-046 (this batch) print both forms in one sentence (`"Land of Wano" type card or card with a type including "Whitebeard Pirates"`), which a renderer that quoted both would not do.
- The verified overrides (`cards/overrides/EB02-044.json`, `OP09-095.json`) cite the Limitless pages and add no type note.
**Judgement:** the scripts are right; the two tests are wrong (so the "expected failure" records a non-defect). Severity 2 because two `it.fails` stay in the suite as a false engine gap. **Fix:** replace each with an assertion that the substring-only card is not offered (the exact reading), and drop both entries from the DISAGREEMENTS files.

### Severity 1
- **B3C-R4** OP09-041 `set up to 2 of your Characters as active` offers every Character, active ones included (pointless but legal choices; no outcome is unreachable). Filtering `state: 'rested'` would shorten the prompt; the text does not say "rested", so no rules change.
- **B3C-R5** EB02-023 Crocodile: "(a cost of yours counts as an effect)" is recorded in M6b-Q20, but no scripted card returns an opponent's Character as a cost, so the reading cannot be observed.
- **B3C-R6** `playable` in `kit-op09d.ts` reads `g.legal()` without asserting the decider is p1 (`canAct` asserts it). The two users (OP09-039 and OP09-116, "not playable in my Main Phase") start in p1's Main Phase, so the assertion is not vacuous today; add `expect(g.decider).toBe('p1')`.
- **B3C-R7** The Pirate AI loop of batch A (B3B-R1, `activate` repeated until the cap) is still present in this build: seeds 7112 (EB04-016, p2) and 7169 (OP10-030) capped in my AI games. Neither card is in batch B; no batch B card has the shape. Fix is batch A's.

## Readings flagged by the lead: judgments

| Reading | Judgment |
| --- | --- |
| OP09-004 Shanks "Give all of your opponent's Characters -1000 power." as a continuous effect | Right. The card has no timing tag (the full text is the sentence plus the [Rush] line); data and override agree; permanent covers later-played Characters, both turns. A one-shot or "during this turn" reading would have needed a tag. Pinned by author and independent tests; mutation (amount, owner) killed. |
| OP09-118 Roger `winGame` on the opponent's [Blocker], either Life 0 | Right. Blocker activated by the opponent (not your own), either player at 0, no turn condition; condition read as the trigger resolves. 1 Life each: no win. Win against a simultaneous defeat is M6b-Q50 (recorded). Mutation (0 to > 0) killed. |
| OP09-041 "set up to 2 of your Characters" offering active ones | Right, nit (R4). |
| OP09-058 opponent chooses exactly 1, [Trigger] either side | Right. "chooses 1 of their Character" has no "up to": exactly 1, by the opponent, cost 6 or less; nothing asked when none qualifies. The [Trigger] names no owner: both sides offered, as tested. |
| OP09-007 Heat reading the Leader's current power | Right ("with 4000 power or less" is current power; given DON!! count). Mutation killed. |
| OP09-014 Limejuice target snapshot | Right. The Blocker is chosen when the effect resolves, 4000 is its current power then; the bar lasts the turn even if power rises afterwards (tested: the bar holds for a second attack). |
| OP09-051 Buggy self-move (`characters` + `isSelf`) | Right. "Then, if you do not have 5 Characters with a cost of 5 or more" is its own condition (not "if you do"), counts Buggy (cost 10) and current cost; checked after the placement whether or not an opposing Character was placed. Tests show the declined/empty case with 5 big Characters keeps Buggy and with fewer places him at the bottom. |
| OP09-052 Marco | Right. Optional hand-trash cost, trigger = K.O. by the opponent's effect on the opponent's turn; battle K.O. and own-effect K.O. do not fire it; with an empty hand the prompt is still asked and accepting is illegal. Mutation survival: R2. |
| OP09-105 Sanji yes/no | Right. [Trigger] asks activate or add to hand; a failing "If" (no {Egghead} Leader) with the Trigger activated trashes the card (probe). "Then, trash 2" is inside the guard; with "up to 1" answered none, the trash still happens (recorded, DISAGREEMENTS-c). |
| EB02-059 "yellow" scope | Plausible, unsettled (R1). |
| EB02-023 "your effect" and a cost | Moot in this pool (R5). |
| EB02-056 Vegapunk's final `if` | Right. "and if your opponent has 2 or less Characters, trash 1 card from your hand" is an independent effect-level condition read after the look; an empty opposing board counts; tests cover 0, 2, 3 Characters and the empty-top-5 case. |
| Activated [Trigger] with a failing condition goes to the trash | Confirmed. Probe on OP09-100, 105, 106, 108, 109, 111, 112, 114 and EB02-055 (all with a Leader or Life count that fails): each activated card ends in the trash, and the next decision is the owner's Main Phase. No batch ruling says otherwise (grep). |

## Independent disagreements

- OP09 group A, B and D: none. Group C: C-1 OP09-095 Laffitte (settled, R3). EB02 group A: none. EB02 group B: EB02-044 (settled, R3); its readings 1 to 6 are recorded questions (EB02-059 colour: R1; EB02-060 face-up top Life card cannot be turned again: CR 1-3-2-1, right; the rest asserted either way).
- OP09-093, 105, 107 and the [Trigger] Life-count timing (the card is out of the Life area while its [Trigger] resolves, CR 10-1-5-3): the engine and scripts agree; the tests pin a count without the revealed card.

## Hidden information (severity 4 checks)

- **Targeted two-world probe** (scratch test): for each of the 133 cards, 4 placements (own hand; own board or Stage or Leader slot; the opponent's top Life card for [Trigger]; the opponent's hand and board for [Counter], [Blocker] and opponent-turn effects), 6 random positions each (16 Leaders of the batch's types, hands, decks, Life with some face-up cards, trash, DON!!), 80 random steps biased 60% toward legal actions that name the card: **3,192 games, 478,010 state comparisons, 1,431,524 two-world action comparisons (two viewers, three twin worlds each: a permutation of the hidden cards, every hidden card replaced by the same plain Character, every hidden card replaced by a different Character or Event of the game), of which 1,413,900 compared the full projected view, skeleton and events step by step; 129,426 were card plays.** Each twin differs from the real position only in the identity of cards hidden from the viewer that belong to the other player; the card named by the action keeps its identity, and a step that legitimately reveals a hidden card (a `CardRevealed`, `TriggerRevealed` or revealed move not of the named card) is compared up to the reveal. Result: **0 differences, 0 Anomaly events.** This compares the view *after the action*, so it catches a prompt that appears or not depending on a hidden card (the existing `leaks.test.ts` skips `playCard`, `counter` and activated Triggers, the actions that start most [On Play] and [Trigger] prompts, and compares only a pending decision with its permutation).
- **Positive control:** EB02-014 Sarfunkel temporarily gated on `exists {Event} in hand`: 11 differences in 40 games (`"Your opponent is choosing."` vs the Main Phase view), found by this harness; restored. An earlier run of the harness with a rare card name as the gate was not detected because hidden hands seldom held it: the control needs a common class.
- `leaks.test.ts`, `projection.test.ts`, `skeleton-diff.test.ts`, `link-tracker.test.ts` with the batch weighting (below): 17 tests pass.
- No script gates a prompt on a hidden-zone condition: the static hidden-gate check passes with an empty allowlist; the hand-sourced "up to" picks (EB02-013, 014, 016, 028, 032, 038, 048 [On K.O.], 056, 059, OP09-010, 030, 043, 046, 053, 116) are recorded in the DISAGREEMENTS notes as asserted asked at max 0 when the hand holds nothing that qualifies (OP09-043, 046, 053 use `answerEmptyChoose`, which fails if the prompt is not asked).

## Random games, AI games and mutation checks

**Decks.** Temporary override of `randomStandardDeck` (reverted): Leaders limited to the OP-09 and EB-02 Leaders (OP09-001, 022, 042, 061, 062, 081, EB02-010), batch cards weighted 40 against 3.
**Property harness** (`standard-games.test.ts`, `ENGINE_GAMES=3000`, `PROPERTY_SEED=9301`): 3,000 games, 4 tests pass (invariants after every action, replay hash, listed and unlisted actions). Leak, projection, skeleton-diff and link suites (`ENGINE_GAMES=3000`, `PROPERTY_SEED=9303`): 17 tests pass.
**AI games** (`playMatch`, `pirate` vs `pirate`, standard decks as above, seeds 7000 to 7059, 7100 to 7199, 7200 to 7299): **260 games, 48,134 actions, 0 errors, 0 fallbacks, every chosen action in the seat's view; 258 end, 2 capped (seeds 7112 and 7169), both in batch A's loop (R7) on EB04-016 and OP10-030.** No batch B card appears in a loop. Shape search: no batch B script has an `activate` with `when: 'activateMain'` and neither a cost nor `oncePerTurn` (searched all 133); every [Activate: Main] has a cost (rest, DON!!, trash, Life) or Once Per Turn.
**Mutation check.** 86 mutants over 78 scripts (thresholds, owners, causes, "up to", durations, Once Per Turn, base vs current, type exact vs including, the `isSelf` flag); each ran against the author and the independent suite of its card; all 86 applied.

| Result | Author tests | Independent tests |
| --- | --- | --- |
| Killed | 83 | 83 |
| Survivors | 3: OP09-080, EB02-048, OP09-111 | 3: OP09-080, EB02-048, OP09-052 |

Survivors of both: OP09-080 and EB02-048 (R2; the second is equivalent in the pool). Author only: OP09-111. Independent only: OP09-052. All 11 Once Per Turn removals and all 30 or so numeric thresholds were killed by both suites.

## Fix round suggestions

R1 (OPEN-QUESTIONS entries), R2 (four boundary tests), R3 (rewrite the two `it.fails` and update the DISAGREEMENTS files), R4 to R6 (optional), R7 belongs to batch A's fix round (AI no-op filter). No script or engine change is required for batch B.

## Fix round

Step g of `docs/runbooks/new-set.md`, on the build merged with the lead's local `main` (batch A's fix round, including the AI no-op-activation filter). No script or engine change.

| Finding | Fix | Evidence |
| --- | --- | --- |
| B3C-R1 (2) | `docs/OPEN-QUESTIONS.md` M6b-Q61 (EB02-059 "yellow" scope), Q62 (OP09-093 second negate with no duration, and the "Then" after a skipped "up to"), Q63 (OP09-032 Once Per Turn when already active), Q64 (OP09-001 / OP09-074 Once Per Turn after an "up to" that chose nothing). Each has the card text, the scripted reading and the competing reading. | Docs only. |
| B3C-R2 (2) | OP09-080: new author test `must not fire when your own effect removes the Character on your opponent's turn` in `engine/test/cards/OP09-080.test.ts` (a planted [On Your Opponent's Attack] on p1's Leader K.O.s p1's own {Straw Hat Crew} Character; no offer, Stage stays active, no DON!! added). OP09-111: the existing "5 cards" test now also asserts no trash prompt is asked (before, a mutant that fired still passed, because the prompt left the hand and trash unchanged). OP09-052: new independent test in `engine/test/independent/cards/op09/OP09-052.test.ts` (own-effect K.O. on the opponent's turn, same planted scenery). EB02-048 Brook's Laboon bound 4 to 5 is equivalent (no cost-5 Laboon in the pool; the Laboon cards are cost 1, 2, 4, 4): noted, no test. | Fail-on-mutant: OP09-080 `cause: 'opponentEffect'` to `'effect'` fails the new test (1 failed, 8 passed); OP09-111 `6` to `5` fails "must not fire with 5 cards in their hand" (1 failed, 4 passed); OP09-052 `koCause: 'opponentEffect'` to `'effect'` fails the new independent test and the author test "does not fire when K.O.'d by your own effect" (2 failed). Each script restored; `git diff` on `cards/effects` is empty. |
| B3C-R3 (2) | The two `it.fails` are plain tests: `engine/test/independent/cards/eb02/EB02-044.test.ts` (OP17-089 {Former Navy} in the trash is not offered; an exact {Navy} card still is; with only the {Former Navy} card nothing is played) and `.../op09/OP09-095.test.ts` (OP09-094 {Blackbeard Pirates Allies} in the top 5 is not offered; the pick is still asked with nothing to choose, the deck being hidden). Both DISAGREEMENTS files (`eb02/DISAGREEMENTS-b.md` #1, `op09/DISAGREEMENTS-c.md` C-1) are closed with the reason: optcgapi renders the official `{X} type` as `"X" type` (data-sources rows 43 and 54), and the substring form is printed `type including "X"` (87 card texts). | Both files pass with no expected failure (the suite has no `it.fails` left in these sets). |
| B3C-R4 (1) | Listed in `docs/BACKLOG.md` section 7. | |
| B3C-R5 (1) | Listed in `docs/BACKLOG.md` section 7. | |
| B3C-R6 (1) | `playable` in `engine/test/independent/cards/op09/kit-op09d.ts` asserts `g.decider` is p1 before reading `g.legal()`. | OP09-039 and OP09-116 (the two users) pass. |
| B3C-R7 (1) | Batch A's fix, on this build. | See below. |

**B3C-R7 result.** Method: temporary override of `randomStandardDeck` in `engine/test/support/decks.ts` (reverted; Leaders limited to OP09-001, 022, 042, 061, 062, 081, EB02-010; OP-09 and EB-02 cards weighted 40, others 3), scratch test `playMatch` pirate vs pirate. The review's exact weighting is not recorded, so the decks are not the reviewer's: seeds 7112 and 7169 on this pool hold neither EB04-016 nor OP10-030. They end (7112 in 213 actions, 16 turns; 7169 in 161 actions, 12 turns). Wider run, seeds 7000 to 7059 and 7100 to 7299 (260 games): **0 capped**; two games hold a loop card (seed 7181 EB04-016, seed 7256 OP10-030) and both end (149 and 80 actions). The direct guard for the loop remains `ai/test/noop-activation.test.ts` from batch A. So the loop is not seen on this build, but the reviewer's own two decks were not reproduced.
