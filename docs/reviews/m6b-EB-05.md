# M6b review: EB-05 scripting batch (53 scripts)

**Reviewer:** independent adversarial review (subagent). Brief: find what is wrong; no stake in the scripts.
**Build reviewed:** `main` at `0afa10f` (the worktree branch had no commits of its own and was fast-forwarded to it so the scripts were present), `npm ci`, no repository code changed (temporary edits for the random-game and mutation runs were removed; `git status` clean).

**Rule:** severity 4 = hidden-information leak or wrong game result; 3 = rules error that changes play, or blocking defect; 2 = notable defect; 1 = nit. Any 3 or 4 fails.

**Verdict: PASS.** No severity 3 or 4. Two severity 2 and four severity 1 findings. Of the four independent-test disagreements, two (A-1, A-2) are real but trivial script faults, one (B-1) is a known deliberate engine-wide choice, and one (B-2) is a **false positive caused by the test kit** (the engine and EB05-060 are right).

## Method

1. Dumped each of the 53 scripts beside its verified card text (`cards/data/sets/EB-05.json`) and compared clause by clause: costs, conditions, "up to" vs exact, "you may", "Then" vs "If you do", durations, once per turn, target owner/zone/filter, timing keyword. Checked card names used as filters (`Senor Pink`, `Megalo`, `Nico Robin`, `Nami`, `Shirahoshi`) against the card data.
2. Read the three scripting readings files, both DISAGREEMENTS files, both API-GAPS files, rulings, rules-digest item 15, DECISIONS (M4b fix round: M4b-03, E-Q11), OPEN-QUESTIONS, `m6b-wave1.md`, `m6b-runtime-audit.md` §7.
3. Probed the engine (`engine/src/effects/run.ts` `addDon`, `move` deck-top branch, `askUse`) and ran a probe test that prints the decision sequence of EB05-060.
4. Random games and AI games (below). 5. Nine mutation checks (below).
6. `npm run typecheck`, eslint on the batch, `npx vitest run cards` (494 files, 4,763 passed, 5 expected fail), `engine/test/cards/EB05*` + `engine/test/independent/cards/eb05` (106 files, 843 passed, 5 expected fail = the 5 `it.fails`).

All 53 scripts exist (6 vanilla cards EB05-003, 015, 026, 032, 041, 058 have no script and empty text; EB05-031 and EB05-052 intentionally absent). Every script has an author test (53 files).

## Findings

### EB05-R1 (1) EB05-013 Shirley and EB05-017 Mermaid Cafe Dancers: the Leader boost is a skippable "up to 1" choice
- **Card:** EB05-013 "[On Your Opponent's Attack] [Once Per Turn] You may rest 1 of your DON!! cards: Your {Fish-Man} or {Merfolk} type Leader gains +2000 power during this battle." EB05-017: same with "+4000", cost "rest 1 of your DON!! cards and trash this Character".
- **Evidence:** both scripts target `{ from: 'leader', filter: {any: [type Fish-Man, type Merfolk]}, pick: { upTo: 1 } }`. The text has no "up to"; after the "you may" cost is paid the effect is mandatory (CR 8-1-2; 8-4-4-1 allows 0 only for "up to"). The engine asks a `choose` with a legal `done`, so a player can pay (and for 017 lose the Character) and then pick nothing. Compare EB05-009/039/040/048 "Your Leader gains ..." which correctly use no `pick`. The independent `it.fails` tests are right.
- **Impact:** a choice that is never useful to take plus a pointless prompt mid-battle; no wrong result for a rational player. No other existing script has this shape (grepped `cards/effects` for `from: 'leader'` with `upTo`).
- **Fix:** drop `pick` (a filtered Leader selector with no pick applies to the matching Leader); flip both `it.fails`.

### EB05-R2 (1) "Add up to N DON!!" is always taken in full (EB05-033, EB05-036; engine-wide)
- **Evidence:** `engine/src/effects/run.ts` `addDon` adds `min(n, donDeck)` with no decision (comment: "DECISIONS M4a: adding fewer is never asked"); the script's `upTo: true` is ignored. CR 4-8-1 / rules-digest 15 allow 0. DECISIONS (M4b fix round 1) and OPEN-QUESTIONS E-Q11 record this as deliberate: "more is never worse for the player ... revisit if a card makes fewer better".
- **Ruling:** the independent authors are right on the rule; the engine deviates knowingly. Not a defect of the two scripts. Is "more never worse" still true for EB-05? Not strictly: EB05-033 itself reads the DON!! difference, and DON!! on your field can be a drawback against opposing DON!!-count conditions, but no EB-05 card makes it matter. Severity 1.
- **Scripts affected by the same engine behaviour** (all `addDon`): EB05-033, EB05-036, EB04-031, EB04-032, EB04-038, OP05-077, OP07-076, OP08-074, OP09-062, OP09-077, OP15-058, OP16-065, OP17-060, OP17-062, OP17-073, OP17-074, OP17-077, P-093 (18 files with `addDon`). `setActive` DON!! has the same E-Q11 status.
- **Fix (optional):** keep the two `it.fails` as documentation or turn them into passing "full amount" tests citing E-Q11; revisit only with a card that needs fewer.

### EB05-R3 (2) EB05-061 Nami: battle K.O. is not replaced; the printed wording is unqualified (M6b-Q7)
- **Card:** "[Once Per Turn] If one of your Characters with 6000 base power or less would be removed from the field by your opponent, you may add 1 card from the top of your Life cards to your hand instead." I re-fetched the page on Limitless (onepiece.limitlesstcg.com/cards/EB05-061): the text is exactly this, with no "effect".
- **Evidence:** the script uses `replaces.leaveField` with `cause: 'opponentEffect'` (as OP15-035 Laboon), so a battle K.O. is not replaced. The reading is documented in the script and in g3 notes, and tested ("Gravity Blade ... replaced"; no test asserts the battle case either way). It is genuinely open: "by your opponent" could include a K.O. in battle, and the DSL cannot express "any opponent-caused removal incl. battle" for `leaveField`.
- **Why 2, not 3:** no official ruling exists in either direction (M6b-Q5/Q7 open); the conservative reading is consistent with the family (OP15-035). If the owner's Q&A says battle counts, this becomes a wrong-result bug.
- **Fix:** keep as is, mark the Q open in the script rulings; if confirmed otherwise add a `cause` that covers battle K.O.s.

### EB05-R4 (2) Independent test B-2 is a kit artifact, and the helper masks "up to" prompts
- **Evidence:** the EB05-060 `it.fails` ("after the cost, only 0/3 is reachable") fails because `beginUse` in `engine/test/independent/cards/eb05/kit-b.ts` loops `if (d.kind === 'optional') accept(g)`, accepting the cost prompt **and then also the effect's own "add the top card of your deck to the top of your Life cards?" prompt**. Probe (temporary test, removed): after `playCard`, decision 0 is `optional/use` ("pay trash 1 of your Characters ..."), decision 1 is `optional/use` ("add the top card of your deck to the top of your Life cards?"). So the engine already offers the choice, exactly as for EB05-055.
- **Impact:** a wrong disagreement entry, and any test using `beginUse` cannot see a missing or extra effect-level optional prompt. 
- **Fix:** make `beginUse` accept only the first (cost) prompt, rewrite the B-2 test to decline the second, delete the entry in DISAGREEMENTS-b.md. Check other tests that use `beginUse` for the same blind spot.

### EB05-R5 (1) EB05-043 Perona: mode asked before the target and even with no legal target
- "K.O. or rest up to 1 of your opponent's Characters with a cost of 6 or less": script is a `chooseOne` then a targeted step each. Harmless (no hidden information, the player picks the mode with the board known) but offers a K.O. mode with no K.O.-able target, and the text order is ambiguous. M6b-Q23 already notes it. Leave.

### EB05-R6 (1) EB05-010 Nico Robin: "without [Blocker]" is read from printed values; old unverified cards print [Blocker] with `keywords: []`
- `koed` reads the K.O.'d card with printed values (OPEN-QUESTIONS M4b-2), so an effect-granted [Blocker] is ignored (rare). Independent API-GAP: several older cards (ST08-006, OP03-104, OP05-090) print "[Blocker]" but have `keywords: []` (ST08-006 is `verified: false`), so they are not Blockers in the engine and would count as "without [Blocker]" for this Leader. Not an EB-05 script defect; it belongs to the data audit. Severity 1 for this batch, but the data gap is worth a ticket (it also stops those cards from blocking).

## Script versus card text: result

53 of 53 compared. Besides R1, R2 (engine), R3 and R5, no mismatch in costs, conditions, "up to", "you may" placement, "Then" gating, durations, once-per-turn, owner/zone/filters or timing keywords was found. Points checked and found right (the ones most likely to be wrong): EB05-001 ("draw 2 and play" one `if`); EB05-002 (trash 1 unconditional); EB05-004 (`rested` play; reveal cost); EB05-005/014/017 (`trashSelf` / `restSelf` as activation cost); EB05-006 (Once Per Turn on the activation; mode chosen after cost; any owner); EB05-008 (cost order, Counter if-gate); EB05-009 (`basePower`, owned Characters only); EB05-018 (`rested` filter, skipRefresh); EB05-019/020 (optional cost, Trigger `if`); EB05-021 (restriction unconditional and after the play; Characters only); EB05-024/046 (permanent, live conditions); EB05-028 (opponent chooses their own 4); EB05-029 (cost before target; return after negate); EB05-033 ("Then" inside the "if", `<=` opponent minus 6 counts given DON!! via `donOnField`); EB05-034/046 (condition read after the cost); EB05-035 (play step not gated); EB05-039/040 (DON!! cost optional for Events; `returnDon` active only); EB05-045 (K.O. may choose itself); EB05-048 (snapshot of cost-0 targets); EB05-053/055 (Trigger cost then Life `if`; ability condition for the attack-time check); EB05-057 (give 1; declining is reachable: independent test "choosing nothing gives nothing" passes); EB05-059 (`basePower eq 4000`, cause battle, to end of opponent's next End Phase); EB05-060 (see R4); EB05-061 (see R3).

## Disagreement rulings

| # | Cards | Who is right | Reason |
| --- | --- | --- | --- |
| A-1 | EB05-013 | Independent author | No "up to" in the text; the "may" is the cost (CR 8-1-2, 8-4-4-1; rules-digest 112/124). Script fault, severity 1 (R1). |
| A-2 | EB05-017 | Independent author | Same shape; both cost halves are paid before the skip is possible. Severity 1 (R1). |
| B-1 | EB05-033, EB05-036 | Author tests are right on the rule (rules-digest 15, CR 4-8-1, QA-GR); the engine is wrong *by design* | `addDon` has no up-to; DECISIONS 2026-11-16 and OPEN-QUESTIONS E-Q11 keep it deliberately. Engine-wide: 18 scripts (list in R2). Severity 1; not a script defect. |
| B-2 | EB05-060 vs EB05-055 | **Engine and script are right; the test is wrong** | The engine asks the "add up to 1" yes/no for both; the test helper `beginUse` accepted that prompt automatically (R4, probe output). Both scripts use `move deckTop upTo 1`; there is no difference between them. |

## Readings worth review: judgments

- **EB05-061 "removed by your opponent":** conservative and consistent (OP15-035) but unconfirmed; see R3, severity 2.
- **EB05-011 turnLifeFaceDown with a face-down top card:** reasonable. A face-down card cannot be "turned face-down" (same principle as CR 1-3-2-1 and M4b-3 for face-up), so the cost is unpayable and the effect does not run. Consequence: Otohime does nothing with face-down Life, which is the normal case. Faithful as far as the rules go; a Q&A would settle it. No finding.
- **EB05-008:** the Event is played first, so the Event cost reveals two *other* red Events and the DON!! must still be active; fine. The Counter's "up to 1 of your Leader or up to 1 of your Characters" as one target is the usual reading. No finding.
- **EB05-021:** unconditional restriction after the optional play, Character cards only, includes effect plays; right.
- **EB05-033:** "Then" inside the "if" follows audit Q10; the comparison counts all DON!! on the field including given ones, as it should.
- **EB05-034:** "7 or more" read after DON!! −2: right (cost before the colon, "if" in the effect).
- **EB05-053/055 Trigger cost:** activating the Trigger is the choice; cost paid, then Life read; a lost cost when Life is 3 or more is the literal result. Right.
- **EB05-043:** see R5. **EB05-045:** itself a legal target and [On K.O.] firing: literal and fine. **EB05-047:** the trashed cost card is already in the trash and may be played back: literal and fine.

## Random games

Decks (built by script from the verified data, Standard-legal, 50 cards, at most 4 copies, colours within the Leader, only scripted or vanilla cards): EB05-010 (Green/Yellow, 40 EB-05 cards), ST01-001 (Red, 36), OP03-040 (Blue, 36), OP12-041 (Blue/Purple, 40), OP02-093 (Black, 32), OP07-097 (Yellow, 36), plus the real Rocks and Kaido lists for the leak harness. The harness reads decks from a temporary override of `engine/test/support/decks.ts` (restored).
- `ENGINE_GAMES=6000 npx vitest run engine/test/property` over these 8 decks: games-1..4 (6,000 random games, invariants after every action, replay hash, every listed action reduces, unlisted actions throw, Anomaly events fail the game), leak (indistinguishability, events, linkage, 400 runs), skeleton-diff (500 seeds), projection, link-tracker: **17 of 17 pass**, 0 invariant violations, 0 leaks.
- Separate 1,500-game coverage run (500 per EB-05 deck, no capped games, no Anomaly): **all 53 EB-05 cards appear**; every script with an ability activated or resolved at least once (for example EB05-010 3,681 activations; Events 008/009/019/029/030/039/040/048/049/059/060 each 160 to 1,000 activations).
- AI: 60 full Pirate-versus-Pirate games (10 per EB-05 deck, rotating opponents and mirrors) through `ai/test/support/match.ts` with `onFallback` collected: **0 errors, 0 fallbacks, 0 capped, 60 of 60 pass**.

## Mutation checks (9 scripts, one clause each, restored by `git checkout`)

| Script | Mutation | Author test | Independent test |
| --- | --- | --- | --- |
| EB05-001 | draw 2 to draw 1 | 2 fail | 3 fail |
| EB05-007 | reveal exactly 3 to 2 | 2 fail | 4 fail |
| EB05-018 | cost lte 6 to 7 | 1 fail | 2 fail |
| EB05-021 | restriction Character to Event | 2 fail | 3 fail |
| EB05-029 | cost lte 6 to 7 | 1 fail | 1 fail |
| EB05-034 | "7 or more" to 6 | 1 fail | 1 fail |
| EB05-046 | trash count 10 to 9 | 1 fail | 1 fail |
| EB05-053 | opponent hand 9 to 8 | 1 fail | 1 fail |
| EB05-059 | duration to `thisTurn` | 2 fail | 3 fail |

**9 of 9 killed by both the author and the independent tests.** The suites are meaningful on the clauses sampled. The weak spot is R4 (the `beginUse` helper), not the assertions.

## Other observations (no finding)

- Author-test and independent-test counts match the scripts (53 each); the only `it.fails` are the five disagreement tests (013, 017, 033, 036, 060).
- `EB05-016`'s `[Your Turn]` condition is untestable through [On Play] on the opponent's turn (API-GAPS-a); low risk.
