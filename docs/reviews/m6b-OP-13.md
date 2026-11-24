# M6b review: OP-13 scripting batch 8 (86 new scripts)

**Reviewer:** independent adversarial review (subagent). Brief: find what is wrong; no stake in the scripts.
**Build reviewed:** worktree branch merged with the lead's local `main` (`d47db7b`, contains `engine/test/independent/cards/op13/`), `npm ci`. No repository code was changed: every temporary edit (a deck override in `engine/test/support/decks.ts`, the mutation edits, a positive-control script edit, scratch tests, all prefixed `op13rev-`) was reverted or deleted; `git status` is clean apart from this file, which is the only commit.

**Rule:** severity 4 = hidden-information leak or wrong game result; 3 = rules error that changes play, or blocking defect; 2 = notable defect; 1 = nit. Any 3 or 4 fails.

**Verdict: FAIL.** Two severity 3 (OP13-R1 OP13-102 Edison and OP13-R2 OP13-108 Jewelry Bonney: the "Then" after a failed "If" still resolves; both are the independent author's `it.fails`, and the independent author is right). No severity 4. Two severity 2, five severity 1. No hidden-information leak was found (13,202 probe cases, 39,606 hidden-card variants, 0 differences; the positive control is detected).

## Method

1. Dumped all 94 scripts in `cards/effects/OP-13/` (86 new, 8 older: 001, 004, 027, 037, 040, 076, 113, 118) as compact JSON beside the verified text (override text where one exists, else `cards/data/sets/OP-13.json`) and compared clause by clause: numbers, comparators (base vs current), names, types (exact vs "including"), categories, owners, durations, costs vs effects, "up to", "Then", "If" before/after the colon, [Trigger] text, printed keywords. Only OP13-102 and OP13-108 mismatch (below).
2. Read the four `OP-13-scripting-g*.md`, DISAGREEMENTS-a..d, API-GAPS-a..d, the OP-14/OP-15/wave3 reviews, OPEN-QUESTIONS (M4b-5 closed, M6b-Q33, Q34), DECISIONS "Empty picks" (2026-11-16 and the OP-14 entry).
3. Baseline: `npx vitest run engine/test/cards/OP13 engine/test/independent/cards/op13 cards`: 1,408 files, 14,512 passed, 6 expected fail (the 4 OP-13 `it.fails`: OP13-050, 052, 102, 108, plus 2 older elsewhere). The hidden-gate check (`cards/test/hidden-gate.test.ts`) passes with no OP-13 allowlist entry.
4. Probes, random games, AI games, mutation check (below).

## Findings

### OP13-R1 (3) OP13-102 Edison: "Then, rest up to 1 ..." runs after a failed "If" (disagreement D-1)
- **Card:** "[Activate: Main] You may trash this Character: If the number of your Life cards is equal to or less than the number of your opponent's Life cards, draw 1 card. Then, rest up to 1 of your opponent's Characters with a cost of 3 or less."
- **Script:** `effect: [ { if: life <= opp life, then: [draw 1] }, { do: rest up to 1 ... } ]`: the rest is a sibling of the `if`, not inside `then`.
- **Rule:** M4b-5 is closed (CR 4-10-1, 8-3-3, official OP13-118, OP14-111/112 Q&As): a "Then" after a failed "If" does not resolve. OP13-118 in the same set is scripted that way (`then: [setActive, restrict]`), so the batch is inconsistent.
- **Impact:** with more Life than the opponent (the "If" fails) the owner still rests a cost-3-or-less Character: a wrong game result in the main case where the "If" is false. The [Trigger] text is unconditional and its script is right.
- **Why tests passed:** the author test `more Life than the opponent: no draw, the rest still happens ("Then" is a separate sentence)` pins the wrong reading and must be flipped with the fix. The independent `it.fails` is the correct test.
- **Fix:** move the `rest` into the `then` of the `if`; flip the author test; remove the `it.fails`.

### OP13-R2 (3) OP13-108 Jewelry Bonney: the opponent adds a Life card to hand after a failed "If" (disagreement D-2)
- **Card:** "[On Play] If your Leader has the "Egghead" type, this Character gains [Rush] during this turn. Then, your opponent adds 1 card from the top of their Life cards to their hand."
- **Script:** `if leader type Egghead then [grant Rush]` followed by a sibling `move lifeTop opponent exactly 1 to hand`.
- **Impact:** with any non-{Egghead} Leader the opponent still loses a Life card to their hand (4 Life become 3). Wrong game result, and it is the opponent's resource, so it changes lethal math.
- **Why tests passed:** the author test `without {Egghead} there is no [Rush], but the opponent still adds a Life card ("Then")` pins it. The independent `it.fails` is correct.
- **Fix:** put the Life step inside the `then`; flip the author test; remove the `it.fails`. The [Trigger] (`if life <= 1`, effect-level) is right; the engine round that evaluates trigger `conditions` may move it into `conditions` (optional).

### OP13-R3 (2) OP13-028 Shanks: `cannotPlay` of every category also bars plays from the trash and the deck (M6b-Q33)
- **Card:** "Then, you cannot play cards from your hand during this turn."
- **Script:** `cannotPlay { category: [Character, Event, Stage] }`, which `playBlocked` applies to plays by any means (no zone scope in `Filter`).
- **Probe (scratch, real scripts):** Leader [Imu], Shanks played from hand with 10 DON!!, then Five Elders (OP13-082) activated with three 5000-power Five Elders in the trash: the activation is offered, the costs are paid, all Characters are trashed and **nothing is played** (Characters empty, trash holds the three).
- **Impact:** a wrong result for any same-turn "play from trash/deck" effect after Shanks; the text bars hand plays only. Reachable but narrow (green Leader plus such an effect). The author notes it as open; it is a real over-restriction, not a harmless reading.
- **Fix:** an engine gap (a `from` scope on `cannotPlay`); until then keep the card as is and record it in BACKLOG.

### OP13-R4 (2) OP13-066 Silvers Rayleigh: the DON!! add is delayed as a whole (M6b-Q34)
- The script follows the audit's proposal (delayed active add; the count is asked at end of turn). Reading "add ... and set it as active at the end of this turn" as "add now (rested), set active at end of turn" is just as natural and differs in play: the DON!! counts on the field during the turn (OP13-068/071 "8 or more DON!!", rested-DON!! gives such as OP13-100, 005) and can be given. No ruling on file; owner decision. Keep, flag open.

### OP13-R5 (1) "up to" gives that cannot give none: OP13-042 Newgate and OP13-081 Koala
- 042: `giveDon each` asks 1 to 2 per target, never 0 ("up to 2 ... each"). Newgate costs 10, so every DON!! is rested and giving is nearly always good; unobservable in practice. 081: `giveDon n 1 ... exactly 1` cannot be declined once the cost (a trash card to the deck bottom) is paid; same shape as OP14-R4. Optional engine improvement.

### OP13-R6 (1) B-1 OP13-050/052: the two `it.fails` should become plain tests
- See ruling B-1. The engine is right; the brief to the test writers was wrong. No leak, no script change.

### OP13-R7 (1) OP13-097 on an empty board is false, with no test either way (M6b-Q21/E-Q4, API-GAPS-d 1)
- "If the only Characters on your field are {Celestial Dragons}": the script requires at least one Character. Acceptable and open (the precedent says false); nothing tests it.

### OP13-R8 (1) Mutation survivors and one-sided kills (numbers below)
- Survivors in both suites: OP13-104 (Life add position top to bottom: no test looks at which Life card is on top) and OP13-074 (power 3000 to 4000: the pool has no {Homies} Character at 3001 to 4000, so the boundary cannot be seen).
- Author tests alone kill OP13-008, 047, 060 (cause `opponentEffect` to `any`; the independent suite never fires the same effect from its own side: API-GAPS-a G1/G3); independent tests alone kill OP13-032 (cost 8 to 9: no cost-9 vanilla in the author tests, DISAGREEMENTS g2 note) and OP13-108 (trigger cost 7 to 8).

## Disagreement rulings

| # | Cards | Who is right | Reason |
| --- | --- | --- | --- |
| D-1 | OP13-102 Edison | Independent author; script wrong (severity 3, OP13-R1) | M4b-5 is closed: a "Then" after a failed "If" does not resolve. The rest is a "Then" sentence after the conditional draw. |
| D-2 | OP13-108 Jewelry Bonney | Independent author; script wrong (severity 3, OP13-R2) | Same: the Life step is a "Then" after the Egghead "If". |
| B-1 | OP13-050 Boa Sandersonia, OP13-052 Boa Marigold | Script and engine; the `it.fails` should become a plain `it` asserting the empty pick is asked | DECISIONS "Empty picks": a hidden-zone pick is skipped only when the zone is empty and there is no filter and no `restrict`; a `play` always carries `restrict`, so the pick is asked at max 0 in every hand state. The brief's "an empty hand skips an up-to hand pick" is not the engine's policy. Own probe: a hand with and without a [Boa Hancock] match asks the same prompt and the opponent's view and events are identical. The UI answers `done` at max 0. |
| A (a..c) | none | n/a | DISAGREEMENTS-a and -c report none; spot checks of their riskiest assertions (Uta base cost, 082 activation condition, 060 self-protection) agree with my reading. |

The same "Then after failed If" pattern was searched in the OP-13 and OP-14 batches (every effect text with "If ..." followed by "Then, ..."): inside the guard and right are OP13-054, 061, 066, 067, 118, OP14-078, 112 (and 042, 087, 120 where the If covers the whole effect or "Then, if" is its own condition); OP13-115 and OP14-077 are "Then, if", independent by wording. Only OP13-102 and OP13-108 are wrong; no OP-14 script has it.

## Readings flagged in the scripting docs: judgments

| Reading | Judgment |
| --- | --- |
| OP13-028 Shanks `cannotPlay` broader than hand | Wrong in a reachable case: OP13-R3 (2). |
| OP13-023 Uta base cost vs cost | Right. The bar is `baseCost >= 5` (text: base cost); the [On K.O.] play is `cost <= 5` (text: cost). A base-cost-5 hand card is therefore barred on the same turn, which follows the rules. |
| OP13-017 Dragon `leaveField` opponentEffect | Right. "removed from the field by your opponent's effect" covers K.O., bounce and trash; `oncePerTurn` is spent on use (mutation killed in both suites). The Limitless -2000 is the verified text. |
| OP13-008/017 protect themselves | Acceptable. "Your Revolutionary Army Character" includes themselves; Ivankov trashing himself is legal and pointless, Dragon giving himself -2000 is a real, useful effect. Same for OP13-047 Fossa and OP13-060 Toki (severity 1 at most; the replaced event differs only for [On K.O.]). |
| OP13-005/021/006 "give up to" prompts | Right. 005 and 021 ask the target pick with `upTo` (can decline), 006 asks the count then a target; "Then" in 021 is independent (no "If"). |
| OP13-047 Fossa self | Acceptable (above). |
| OP13-042 Newgate | Select-then-give is right; no "give 0" (OP13-R5, 1). Draw runs before the trash so drawn cards are candidates. |
| OP13-054 Yamato | Right: the give is inside the Life "If" (M4b-5). The target prompt has min 0. |
| OP13-038/039 | Right. 038: the delayed set-active is independent of the rest ("Then" not gated); 039's [Trigger] activates the [Counter] with no battle and a full K.O. |
| OP13-035 Bepo choose-one | Right as a mode choice; both modes always offered; harmless. |
| OP13-053 Teach | Right (optional cost of one of your Characters, Teach included; self-trash leaves the draw and a Banish grant on nothing). |
| OP13-066 Rayleigh delayed add | Keep, open: OP13-R4 (2). |
| OP13-077 two picks | Right (M6b-Q6): 4000 pick first, then the 3000 pick; choosing the only 3000 first forfeits the second. Player skill. |
| OP13-060 Toki | Right (cause `opponentEffect` only; mutation killed by the author suite). |
| OP13-080/083 protected targets selectable | Right: a protected Character may be chosen and the removal does nothing (QA-ST05 shape, rulings RL-14). |
| OP13-082 Imu activation condition | Right: "If your Leader is [Imu], you may ..." is an activation condition (conditions before costs, CR 8-4-1); not offered otherwise, nothing paid. "Trash all" includes itself. |
| OP13-098 If after the colon | Right: the DON!! is rested even without Imu; both the Main and the Counter conditions are effect-level. |
| OP13-097/095 "only Celestial Dragons" | 095 right (Rosward is always on the field). 097 empty board false: open, OP13-R7 (1). |
| OP13-114 Trigger offered on hand size | Right: public hand size, accepted only with a card to trash; probes show no hand-content dependence. |
| OP13-120/100 give 0 DON!! | Right. 120 asks a target with min 0; 100 asks the count 2/1/0 then the target. Once Per Turn is spent at resolution (nit, 1). |
| OP13-104 yes/no | Right: the top card is hidden, so "up to 1" is accept or decline; the Leader check follows the colon. Position untested (R8). |

## Hidden information (severity 4 checks)

Two-position probes (scratch test, not committed): for every one of the 86 new scripts and every way an ability starts (play, [Activate: Main], [When Attacking], [On K.O.] in battle, [Trigger] from the top Life card, [Counter] activated), with seven Leaders ([Imu], [Gol.D.Roger], Whitebeard, [Boa Hancock], Sabo, Bonney, Luffy) and four board variants (given DON!! on the Leader and a Character, rested DON!!, an eight to ten card trash), the same public position was built with different hidden cards: the player's own hand, deck and Life, then the opponent's, drawn at random from the OP-05 to OP-17 and ST-1x pools (Life cards without [Trigger], since a [Trigger] is revealed by damage by rule). A structure-only policy drove both positions; the other player's view (decision kind, player and prompt, zones with card identity masked, DON!!, battle, delayed, known-map size) and the event type sequence had to be equal at every step, up to the first step where the owner's own accept/decline differed.
- **13,202 cases, 39,606 hidden-card variants, 0 differences.** 294 starts skipped as not legal in the position.
- **Positive control:** OP13-074 temporarily gated on "a cost 5 or more card in hand": the probe reports differences for every Leader and variant. Restored.
- The prompts that depend on hidden cards only through "asked at max 0": OP13-012, 016, 065, 083, 086, 096, 113, 116 (look at top, ask the take at max 0 and the order), 050, 052, 074, 099, 110 (play from hand, asked at max 0 with no match), 104 (yes/no on a hidden top). OP13-024's cost offer is shown with accept unavailable when no Music/FILM card is held: the legal-action set is the owner's alone and the opponent's view is identical in both positions.
- The hidden-gate check passes; the public facts behind prompts: Life counts (043, 054, 092, 108, 115), hand size (045, 055, 114), trash counts (080 to 099), DON!! counts (068, 071, 100).
- B-1 (050/052) confirmed as not a leak (ruling above).

## Random games, AI games and mutation checks

**Decks.** A temporary override of `randomStandardDeck` (reverted): Leaders limited to the scripted OP-13 Leaders and OP-13 scripted cards weighted 40 against 6 for other scripted cards. Scripted OP-13 Leaders: OP13-001 Luffy, OP13-004 Sabo, OP13-100 Bonney (OP13-002, 003 are not scripted, OP13-079 Imu is design item D1). Over 300 seeds (600 decks): 210, 202, 188 uses of the three Leaders, 11,621 OP-13 cards (about 19 per deck), 73 distinct OP-13 cards.

**Property harness** (`engine/test/property/standard-games.test.ts` and a scratch copy that prints the tally): invariants after every action, replay hash equals live hash, every listed action reduces, sampled unlisted actions throw.
- Pass 1: 2,000 games (`PROPERTY_SEED=8001`), all pass.
- Pass 2: 3,000 games (`PROPERTY_SEED=8003`, four parts of 750): 613,432 actions, 0 capped; 2,379 "damage at 0 Life", 621 "deck out"; 1,132,119 listed reductions, 4,801,950 unlisted attempts that threw. All pass. **5,000 random legal games in all.**
- Leak, projection and linkage properties and the skeleton diff (`leaks.test.ts`, `skeleton-diff.test.ts`, `ENGINE_GAMES=3000`, `PROPERTY_SEED=8004`, including the "standard decks: true" variants on the OP-13 Leader decks): 8 tests, all pass.

**AI games** (`ai/test/support/match.ts` `playMatch`, tier `pirate` vs `pirate`, both seats OP-13-Leader Standard decks, seeds 300 to 329): 30 games, 0 capped, 5,808 actions, every chosen action in the seat's own view; all 30 ended "damage at 0 Life". Leader seats: OP13-001 20, OP13-004 18, OP13-100 22 (at least 10 each); 1,119 OP-13 cards in the 60 decks.

**Mutation check.** Broke one clause in 46 mutants across 43 distinct new-batch scripts (a threshold, a base-power or cost filter, an operator, a duration, a cause, a Once Per Turn, a keyword, a count, a position; each applied alone, author and independent tests run separately, file restored after each run; `git status` clean afterwards). Six mutants first did not match the file's formatting and were re-run with a corrected pattern (counted once).

| Result | Author tests | Independent tests |
| --- | --- | --- |
| Mutants killed | 42 of 46 | 41 of 46 |
| Survivors | 4: OP13-032, 074, 104, 108 | 5: OP13-008, 047, 060, 074, 104 |

Survivors in both: OP13-074 and OP13-104 (R8). Killed by the author suite only: OP13-008, 047, 060. Killed by the independent suite only: OP13-032, OP13-108.

## Which scripts the parallel OP-14 engine fix round will touch

- **Duration "until the end of your opponent's next End Phase" (`untilEndOfOpponentsNextTurn`):** OP13-032 Robin (text says End Phase; [On Play], own turn), OP13-026 Sunny-Kun and OP13-120 Sabo (text "next turn"; both are own-turn Activates). None is created on the opponent's turn, so the OP14-R1 bug does not show; re-run their tests after the change.
- **`setActive` up to N asking a count:** OP13-023 Uta (2), 024 Gordon (2, delayed), 030 Chopper (2), 034 Brook (1), 035 Bepo (DON!! mode, 1), 038 Elephant Gun (2, delayed), and the older 027 Sanji, 037 Zoro, 118 Luffy. OP13-028 Shanks ("all", `any: true`) is not affected. The author and independent tests for these accept "most, no prompt" or take the most; expect prompt-count assertions to change.
- **`includeCosts` for "trashed from hand by an effect":** no OP-13 script uses `trashedFromHand`; none touched.
- **Trigger `conditions`:** OP13-108's [Trigger] uses an effect-level `if` and keeps working; it can move into `conditions` (cosmetic). The OP13-108 fix of R2 is in the [On Play] and independent of it.

## Other observations (no finding)

- The OP-13 independent kits `need` each prompt kind; the two `it.fails` of OP13-050/052 are the only artifact of the helper (the same shape as OP14-052).
- Of the 94 scripts, text and printed keywords agree with card data and overrides for all (textHash test passes).
- OP13-099's "black" filter is untestable with the pool (API-GAPS-d 2); the other {Five Elders} Characters are all black, so no observable difference.

## Fix round (2026-11-24, ENGINE_VERSION 0.5.14)

| Finding | Fix | Evidence |
| --- | --- | --- |
| Local main red | The 18 independent failures (OP13-024, 034, 035, 038) were the OP14-R2 count prompt for "set up to N DON!! as active". The tests now answer it (`answerCount` in `kit-op13b.ts`, most first) and each card gained a fewer/None test. Notes in DISAGREEMENTS-a and -b. | All 18 pass; the touched-card set (032, 026, 120 duration; 023, 024, 030, 034, 035, 038, 027, 037, 118 setActive) passes. |
| OP13-R1, R2 (3) | OP13-102 rest step and OP13-108 Life step moved inside the failed-"If" guard. Author tests flipped; independent `it.fails` D-1/D-2 are plain tests; DISAGREEMENTS-d updated. | 4 tests fail on the old scripts (checked), pass on the new. |
| OP13-R3 (2) | `cannotPlay` takes `from: 'hand'` (validator, runtime, `playBlocked` reads the card's zone); OP13-028 uses it. No other script names the hand. Settles M6b-Q33. | Planted tests in `engine/test/cards/m4b/actions.test.ts`; fails with the zone check removed. |
| OP13-R4 (2) | No change; OPEN-QUESTIONS Q34 now names OP13-066 and the two readings. | n/a |
| OP13-R5 (1) | Not changed, BACKLOG section 6: a None per target costs a prompt per target (OP14-105); Koala can already decline (test added). | OP13-081 decline test. |
| OP13-R6 (1) | OP13-050/052 `it.fails` are plain tests: the empty pick is asked at max 0 with an empty hand and with no match alike. | pass |
| OP13-R7 (1) | OP13-097 empty-board test (false, M6b-Q21): no K.O. target asked, back at Main. | pass |
| OP13-R8 (1) | OP13-074: boundary test with the 3000 Homies raised to 3001 and 4000 in a copy of the defs (no real Homies Character is in 3001 to 4000); OP13-104: the runtime adds deck top to the top of Life whatever `position` says, so the review's mutant is unreachable at runtime; a script-level test pins `top` and that a `bottom` variant fails validation (BACKLOG). | Mutants killed: OP13-074 3000 to 3001 fails the new test. |
