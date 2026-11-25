# M6b review: block 3 batch A scripting (OP-10 97, PRB-02 15, ST-15 to ST-21 35, ST-26 and ST-27 10 = 157 new scripts)

**Reviewer:** independent adversarial review (subagent). Brief: find what is wrong; no stake in the scripts.
**Build reviewed:** worktree branch merged with the lead's local `main` (`cb44e99`, contains `engine/test/independent/cards/{op10,prb02st,st1821,st2627}/`), `npm ci`. No repository code was changed: every temporary edit (a deck-pool override in `engine/test/support/decks.ts`, the mutation edits to `cards/effects`, the positive-control gate in OP10-007, scratch tests and harnesses, all prefixed `b3brev-`) was reverted or deleted; `git status` is clean apart from this file, the only commit.

**Rule:** severity 4 = hidden-information leak or wrong game result; 3 = rules error that changes play, or blocking defect; 2 = notable defect; 1 = nit. Any 3 or 4 fails.

**Verdict: FAIL on one severity 3 (B3B-R1: the unlimited no-op [Activate: Main] of OP10-030 Smoker makes the Pirate AI never end its turn; 3 of 90 AI games hit the action cap, all in that loop; EB04-016 has the same latent defect).** No severity 4: no hidden-information leak (39,196 two-position cases, 0 differences; positive control detected). No script disagrees with its verified text on a number, comparator, owner or timing. Five severity 2 (R2 to R6) and eight severity 1.

## Method

1. Dumped all 163 scripts in the eleven folders (157 new; six older ones without an independent test: OP10-067, 114, ST17-004, ST21-003, 014, 017, read too) beside the card text and read each clause by clause: numbers, comparators (base vs current), names (exact vs "type including"), owners, durations, costs vs effects, "up to", "Then", "If" placement, tags, Once Per Turn. Mechanical cross-checks: (a) every integer in each text appears in the script; (b) printed keywords equal `keywords` (two false positives, ST21-003 and 016, "cannot activate [Blocker]"); (c) a `trigger` ability exactly when the card has trigger text; (d) every timing tag and `[DON!! xN]` and `[Once Per Turn]` in the text has a matching construct in the script. **No mismatch.** The 16 unscripted cards with text in these sets are the held-back ones (STATUS).
2. Read the five DISAGREEMENTS and API-GAPS files and the readings docs.
3. Baseline: the brief's command, 354 files, 7,459 tests pass, 2 expected failures (the two `it.fails`, OP10-058 and OP10-119), hidden-gate check passes with no allowlist entry for these cards.
4. Test audit: every `isLegal` or `legalFor` in the new tests passes `player` (the 80 `g.legal()` uses are the deciding player's list); no `it.skip` or `.todo`; hand-gated empty picks (OP10-006, 007, 008, 017, ST18-005, ST21-015, PRB02-010) are asserted asked at max 0 with raw actions; `settleEmptyChoose` and `skipEmpty` are used only where the gate is public (opposing board, trash).
5. Probes, hidden-information probes, random, AI and mutation checks below.

## Findings

### B3B-R1 (3) OP10-030 Smoker: an unlimited, effect-less [Activate: Main] makes the Pirate AI loop until the action cap
- **Card:** "[Activate: Main] Set up to 1 of your DON!! cards as active. Then, you cannot set DON!! cards as active using Character effects during this turn." (no cost, no Once Per Turn).
- **Script:** `activate` with `setActive` then `restrict cannotSetDonActive by characterEffects`; faithful to the text.
- **Probe 1 (rules):** Smoker with 3 rested DON!!: activation 1 asks the count and sets one; activations 2 to 6 are legal and do nothing (no prompt). Text-faithful, harmless for a human.
- **Probe 2 (AI games):** 90 Pirate-vs-Pirate games on random Standard decks weighted to the batch (seeds 5000 to 5089): 87 end by damage at 0 Life, **3 never end (seeds 5031, 5044, 5080)**. The last 60 decisions of each are the same `activate OP10-030#activate` in the Main Phase until the 2,000-action cap. Nothing in `app/`, `ai/` or `engine/` caps actions or ends the game (`LoopDetected` only fires inside one engine step with no decision), so against a deck holding Smoker the game never ends. The AI ranks `activate` first (`structural` 2.5 in `ai/src/search/mcts.ts`, `endTurn` -1) and the repeat leaves the state unchanged, so the value ties.
- **Judgement:** blocking defect, severity 3; root cause is AI/engine, not the script text. EB04-016 (same text, `cards/effects/EB-04/EB04-016.ts`, no `oncePerTurn`) has the identical latent loop.
- **Fix:** in the AI candidate generation (`mainCandidates`), drop an `activate` whose resulting state (summary hash) equals the current one, or break ties toward `endTurn`; optionally an engine cap on repeats of an unchanged state. Re-run seeds 5031, 5044, 5080 with the batch deck weighting (see Method) expecting 0 capped.

### B3B-R2 (2) OP10-098 Liberation: the cost-6 pick first is a trap; reverse the two picks
- **Card:** "K.O. up to 1 of your opponent's Characters with a base cost of 6 or less and up to 1 ... with a base cost of 4 or less."
- **Script:** two sequential `ko` picks, cost 6 first, cost 4 second.
- **Probe:** opposing cost-6 Thatch and cost-4 Hajrudin. First prompt offers both (prompt text just "K.O. up to 1 of your opponent's Characters", no limit shown); picking the cost-4 card first ends the effect at once, the cost-6 card is not eligible for the second pick: one K.O. instead of two. With another cost-4 target the second pick exists. [On K.O.] of the first victim is queued until the effect ends (probe with OP10-005), so no timing difference from a simultaneous K.O.
- **Judgement:** no outcome is unreachable (choosing the cost-6 card first always gives every legal pair), so not a rules error, but a human or AI clicking the cost-4 card first silently loses a K.O.; a reversed order (cost 4 first, then cost 6) cannot lose any outcome. Severity 2 (the lead's question: not a 3).
- **Fix:** swap the two `do` steps in `cards/effects/OP-10/OP10-098.ts`; adjust the tests that expect the cost-6 pick first (`OP10-098` author and independent).

### B3B-R3 (2) Reveals from the hand are not announced (OP10-119, OP10-058): the independent disagreements are right
- **OP10-119 Law** "Reveal up to 1 {Supernovas} Character from your hand and add it to the top of your Life face-down": events hold one `CardMoved` with no `CardRevealed`; the opponent is never shown the card.
- **OP10-058 Rebecca** "reveal up to 2 ... from your hand. Play 1 ... and the other rested if cost 4 or less": the revealed card that is not played (cost 5 to 7) stays in hand unannounced.
- **Judgement:** CR 11-2-1 (a revealed card is shown to the opponent). Not a leak (nothing hidden is sent), the opponent is under-informed; no board effect. Severity 2 each, one engine fix: an effect-level reveal of hand cards emitting `CardRevealed` (as the cost `reveal` does in `engine/src/effects/run.ts`), a `reveal` flag on `move` and on `select` from the hand, then mark the cards known until the effect ends; add `reveal: true` to both scripts and drop the two `it.fails`.

### B3B-R4 (2) ST16-005 Luffy "a rested [Uta]" counts a Leader: unrecorded reading
- Probe: with Leader OP06-001 or ST11-001 (Leaders named Uta) rested, Luffy is 3000 to 4000. The reading ("the text does not say Character") is only in `PRB-02-ST15-17-scripting.md`; OP10-008/017 read "have [Rock]" as a Character. Defensible, but neither recorded in OPEN-QUESTIONS nor consistent with those.
- **Fix:** add an OPEN-QUESTIONS entry (does a bare "[Name]" include the Leader?); no script change unless ruled.

### B3B-R5 (2) Surviving mutants that matter (both suites)
- ST18-003 San-Gorou: removing `oncePerTurn` survives (no second attack in one turn is tested); ST15-003 Kingdew: `koCause: 'effect'` to `'opponentEffect'` survives (no K.O. by his own side's effect on the opponent's turn); PRB02-006 Zoro: `opponentCharacterEffect` to `opponentEffect` survives (the "Leader effect does not fire" test passes with both: check the cause value is really distinguished); OP10-082 Kuzan: cost bound 5 to 6 survives. **Fix:** one boundary test each.

### B3B-R6 (2) OP10-100 `rulings` line is wrong about the Trigger
- The script says a failed colon-less "If" in [Trigger] makes "the card go to the hand". Probe (real engine, OP10-100, OP10-110, OP10-113): an activated [Trigger] whose condition fails sends the card to the **trash**; declining sends it to the hand. This is right by the rules (a revealed Trigger that is activated is trashed after resolving, one not activated goes to hand), and agrees with the OP09-100/108/109 assertions. Engine and tests are right; only the ruling text in `cards/effects/OP-10/OP10-100.ts` is wrong (severity 2 only because a stale reading invites a wrong "fix"; no play effect). **Fix:** correct the text to "goes to the trash"; check OP10-110/113 wording and tests assert the trash.

### Severity 1
- **B3B-R7** OP10-099 Kid: cost-8 upper bound survives the author suite (killed by the independent one). Add a cost-9 case.
- **B3B-R8** OP10-045 Cavendish: removing `oncePerTurn` survives the independent suite (author kills it).
- **B3B-R9** The generic prompt for multi-limit effects (OP10-098) does not show the cost limit; UI text only.
- **B3B-R10** Six older scripts lack independent tests (OP10-067, 114, ST17-004, ST21-003, 014, 017); author tests exist and pass.
- **B3B-R11** OP10-035 Brook: Leader always eligible for "cost 5 or less" (M6b-Q48, still open); consistent with OP15-024; recorded.
- **B3B-R12** OP10-036 Perona: Once Per Turn spent by the first rest by your effect whether or not a DON!! can be set active (M6b-Q30 open); a rest paid as a cost does not count (probe: Monet's cost rest does not fire it); recorded.
- **B3B-R13** ST20-004 mutation (`lte: 3`) found no match for my pattern, not run (the cost bound is covered by the author suite).

## Readings flagged for this review: judgments

| Reading | Judgment |
| --- | --- |
| OP10-098 two sequential picks | Right (outcome set equal), order should be reversed (R2). Not severity 3. |
| OP10-042 two timings, one Once Per Turn | Right. Probe: a K.O. of the opponent's own Dressrosa Character does not fire (`koed` defaults to your cards); one removal by the opponent's effect draws once; a second in the same turn does not. |
| OP10-119 / OP10-058 reveal | Engine change needed, severity 2 (R3). |
| ST16-005 Leader | Defensible, unrecorded (R4). |
| PRB02-006 Zoro | Right. Probe: alone or with only a rested other Character: no offer, Zoro rests; with an active other Character: offered. Leader effect does not fire. |
| PRB02-009 Mr.3 | Right. Probe: rested by an opposing Leader effect or Character effect: "do this?" prompt (accept trashes and draws 2); rested by your own effect: no prompt. |
| OP10-036 Perona | Right (R12). |
| ST27-001 Pizarro | Right. Probe: not offered without a [Fullalead] (Stage or other); the Once Per Turn is spent when the cost is paid even with a non-Blackbeard Leader. |
| OP10-030 Smoker | Script right; loop defect (R1). |

## Independent disagreements

OP10-058 and OP10-119: confirmed engine gaps (R3). The other DISAGREEMENTS files list none; their open readings (OP10-100/110 Life count boundary, OP10-118 Q36, Q47, Q48, Q59) are recorded questions, no new defect.

## Hidden information (severity 4 checks)

Two-position probe (scratch test): for every one of the 163 scripts, nine ways a card starts (play, [Activate: Main], [When Attacking], opponent's attack, [Counter], [On Block], [On K.O.], [Trigger] from the top Life card, end of turn), eight Leaders (or the Leader card itself), accept and decline, three different sets of hidden cards for the owner (8-card hands holding an Event, Dressrosa, Donquixote, Supernovas, Navy, 6000-power and Thriller Bark cards, vs 8 cost-1 vanillas, vs expensive vanillas; decks; Life with Triggers), same public position, a structure-only policy; the other player's projected view and projected events (identities, power, cost, keywords and the known-map masked) equal at every step up to the first step where the owner's own answer differs or a legitimate reveal differs.
- Owner p1 hidden, viewer p2: **19,590 cases, 60,402 steps, 0 differences.** Mirror (p2 hidden, viewer p1): **19,606 cases, 63,541 steps, 0 differences.**
- **Positive control:** OP10-007 temporarily gated on an Event in hand: 16 differences, all in that card; restored.
- First run flagged ST17-001 Crocodile only because the legitimately revealed top card appears in the `known` map; masked, 0.

## Random games, AI games and mutation checks

**Decks.** Temporary override of `randomStandardDeck` (reverted): Leaders limited to 16 (OP10-001, 002, 003, 042, 099, ST21-001 and ten others of the batch's colours and types, 11 playable), batch cards weighted 40 against 6. Over 300 seeds: 14,732 of 30,000 deck cards from the batch, 177 distinct.
**Property harness** (`standard-games.test.ts`, `ENGINE_GAMES=3000`, `PROPERTY_SEED=9201`): **3,000 games, 562,719 actions, 0 capped, 2,405 damage at 0 Life, 595 deck out; all pass.** Leak, projection, skeleton-diff and linkage suites (`ENGINE_GAMES=3000`, `PROPERTY_SEED=9203`): 17 tests pass.
**AI games** (`playMatch`, `pirate` vs `pirate`, seeds 5000 to 5089): 90 games, 20,573 actions, every chosen action in the seat's view; 87 end by damage at 0 Life, **3 capped (R1)**.
**Mutation check.** 62 mutants (thresholds, owners, causes, "up to", durations, Once Per Turn, base vs current); 61 matched; each ran against the author and independent test of the card.

| Result | Author tests | Independent tests |
| --- | --- | --- |
| Valid mutants | 61 | 55 (6 scripts have none) |
| Survivors | 5: ST15-003, PRB02-006, ST18-003, OP10-099, OP10-082 | 5: ST15-003, PRB02-006, ST18-003, OP10-045, OP10-082 |

Survivors of both suites: ST15-003, PRB02-006, ST18-003, OP10-082 (R5). Author-only: OP10-099 (R7). Independent-only: OP10-045 (R8). All other mutants killed by at least one suite.

## Fix round suggestions

R1 (AI no-op filter; also covers EB04-016), R2 (swap the steps), R3 (engine reveal from hand; two scripts), R4 and R6 (docs), R5 and R7 to R8 (tests).

## Fix round

Commit `ea37ab2` (code, tests, DECISIONS, OPEN-QUESTIONS, BACKLOG). Each fix was shown to fail its test when reverted. ENGINE_VERSION stays 0.5.16 (the only event-log change is a new `CardRevealed` for the two cards that set `reveal`; no golden game holds them; goldens pass untouched).

| Finding | Fix |
| --- | --- |
| B3B-R1 (3) | `isNoOpActivation` (`ai/src/search/sim.ts`) drops an `activate` that leaves the semantic hash (modifiers read as a set, new `summaryHash(state, dedupeMods)` argument, default unchanged) unchanged under every answer to its prompts; used by `mainCandidates` (Pirate) and `treeCandidates` (Warlord, Emperor). Guard `ai/test/noop-activation.test.ts` (planted Smoker and EB04-016 positions through all three tiers, plus seed 5044's decks); 11 of its 12 tests fail with the filter off. Seed 5044 capped before, ends after; 5031 and 5080 end. Decision recorded 2026-11-25. |
| B3B-R2 (2) | OP10-098 asks the cost-4 pick first; author and independent tests updated (9 fail on the old script). |
| B3B-R3 (2) | Selector `reveal: true` (DSL, validator, `select()` emits `CardRevealed` reason `effect`); set in OP10-119 and OP10-058; both `it.fails` are plain tests; DISAGREEMENTS-b and -d closed; planted tests `engine/test/cards/m6b-b3a/reveal-hand.test.ts` (4 fail with the emit off, with the two former `it.fails`). |
| B3B-R4 (2) | OPEN-QUESTIONS M6b-Q60 ("a rested [Uta]" includes the Leader). |
| B3B-R5 (2) | New tests: ST18-003 second attack, ST15-003 own-effect K.O. on the opponent's turn, OP10-082 cost-6 non-Kuzan (the old cost-6 card was itself a Kuzan, hidden by the name exclusion). PRB02-006: the runtime never reads `cause` for a `rest` replacement; the mutant is not a valid script and is killed by the registry validation (`cards/test/dsl.test.ts`); a validator test was added to the author file. |
| B3B-R6 (2) | OP10-100 `rulings` now says an activated [Trigger] whose "If" fails goes to the trash. |
| B3B-R7, R8 (1) | OP10-099 cost-9 case (OP14-009), OP10-045 same-turn second attack (independent suite). |
| B3B-R9 to R13 (1) | Left; listed in `docs/BACKLOG.md` section 7. |
