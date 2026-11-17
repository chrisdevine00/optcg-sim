# M4b review: effects breadth (143 meta cards scripted)

**Date:** 2026-11-16
**Reviewer:** independent review by a subagent (two sub-reviewers for the AI and app parts). Brief: find real problems, not confirm the builders' reports.
**Build reviewed:** `main` at `248a6d3` (commits 3fe028a..248a6d3), clean worktree, `npm ci`, no repository code changed.

**Rule:** any severity 3 or 4 finding fails the milestone. 4 = wrong game result or hidden-information leak; 3 = rules error that changes play, or blocking defect; 2 = should fix; 1 = nit.

**Verdict: FAIL.** Open: M4b-01, M4b-02, M4b-03 (rules errors, severity 3), M4b-04 and M4b-05 (blocking defects, severity 3). No severity 4 found: no hidden-information leak in the engine or in the hotseat veil, and no wrong game result found in 3,600 random games.

The scripting itself is good. Of about 70 scripts compared with card text and the official Q&A, 4 were wrong (M4b-01, -02, -06, -03 family). The wave 3 authors were right on most disagreements, and the builders' notes were right on the three they got from official Q&As (Zoro, Brook DON!!, Loki). Failures are concentrated in "up to"/mandatory handling, one who-chooses ruling, and two UI/AI robustness gaps.

## Method

1. Read CLAUDE.md, PROMPT.md, PLAN M4b, STATUS, DECISIONS 2026-11-16, OPEN-QUESTIONS M4b-1..7, the five DISAGREEMENTS/API-GAPS files.
2. Fetched the official Comprehensive Rules and all 47 Q&A PDFs from en.onepiece-cardgame.com (robots.txt is 404; one request per second; cached under `.cache/m4b-review/web/`). Rulings below cite them. The Q&A tables print the card label after its question.
3. Script-vs-text audit: dumped each script (`.cache/m4b-review/dump.ts`) beside its card text and compared about 70 of the 143 (all high-weight cards, every card in the lead's notes, every "If ... Then" card, all hard shapes). Mechanical check: scripts whose `upTo` count differs from the text's "up to" count. Q&A check: every scripted meta card that has Q&A rows.
4. Probes (copies in `.cache/m4b-review/probes/`; the repo copies were deleted): a leak property over M4b decks on both seats with real scripts; a skeleton-diff copy likewise; 3,600 random games across all 144 pairings of the 12 archetypes.
5. Two sub-reviewers: AI (lethal soundness without `asVanilla`, 60 Pirate games) and app (Playwright, hotseat veil, coverage, S1 scenarios, full e2e).
6. `npm run typecheck`, `eslint .`, `npx vitest run engine cards` (427 files, 3,649 passed, 15 expected fail), `npx vitest run ai/test` (112 passed), `vitest app/test` (101 passed), full Playwright e2e (186 passed).

## Done criterion (item 7): met literally

All 182 meta-list cards (194 entries in `meta-lists.json` minus 12 tournament names in the `event` field) are scripted (180) or genuinely vanilla (OP12-114, OP08-099: empty effect text in the verified data). Each of the 180 has a named author test file in `engine/test/cards/`, and the M4b ones an independent test in `engine/test/independent/cards/`. The browser readout (463 of 2,799 play fully; meta: all 182), inspector chips and Setup copy (12 decks) match engine truth.

## Findings

### M4b-01 (3) OP05-098 Enel: a mandatory effect is offered as optional
- **Evidence:** `cards/effects/OP-05/OP05-098.ts:36` uses `pick: { upTo: 1 }` for "add 1 card" (no "up to" in the text). `engine/src/effects/run.ts` ~1100 (the `deckTop` to Life branch of `move`) always asks an `optional` decision, whatever the pick, unlike the generic branch at ~1127 (`mandatory = !what.pick || 'exactly' in what.pick`). Declining skips the add and the "Then, trash 1 card from your hand". Independent test A-1 (`it.fails`) shows it.
- **Rule:** CR 8-1-2 (only "may/can" is optional). A player can dodge a mandatory discard and the Once Per Turn.
- **Fix:** script `exactly: 1`; make the `deckTop` branch honour mandatory picks; drop the `it.fails`. Check other `deckTop` to Life moves (all others say "up to 1": no change).

### M4b-02 (3) ST10-010 Trafalgar Law: the wrong player chooses the discarded cards
- **Evidence:** `cards/effects/ST-10/ST10-010.ts:40` has `chooser: 'opponent'` (E-Q5 reading). The official ST10 Q&A, row labelled ST10-010: "If my opponent has 7 or more cards in their hand, which player chooses the cards to be trashed according to this [On Play] effect? The player who activated this [On Play] effect chooses 2 cards from their opponent's hand face-down." OP17-075 (same wording) was fixed from QA-OP17; ST10-010 was missed. OPEN-QUESTIONS E-Q5 and effect-dsl E-Q5 still say "opponent chooses".
- **Fix:** `chooser: 'you', blind: true` as in OP17-075; update the ST10-010 tests; close E-Q5 fully.

### M4b-03 (3) "Give up to N rested DON!!" can never give fewer or none (M4b-4)
- **Evidence:** `giveDon` (`engine/src/effects/run.ts:1055`) gives `min(n, available)` and the recipient `choose` is `exactly: 1`. Official Q&A: ST01-011 Brook: "Can I use this [On Play] effect to give only 1 rested DON!! card? Yes, you can. When a card's text states 'up to' a specified number of cards, you can choose 0 cards." QA-GR: "up to ... can I choose 0? Yes." OP13-119 Ace row: giving none is a normal case. CR 4-8-1 and 8-4-4-1. The four independent authors (A-2, B-1, D-1, DISAGREEMENTS-d 2) are right.
- **Cards (meta weight):** ST31-005 (24), ST21-014, OP15-114, OP14-114, EB03-053, OP12-015 (12 each), ST01-011 (7), ST17-004 (5), OP15-058 (3), OP14-105 (each: up to 1, fewer targets). It also means a rested DON!! cannot be kept for a later cost.
- **Fix:** `giveDon` asks a number 0..N (or lets the recipient `choose` carry `done`), recipient `min: 0`; flip the 6 `it.fails`. M4a's E-Q11 (add/set up to N DON!!) is the same principle; the CR says fewer is legal; keep as severity 1 unless a card needs it.

### M4b-04 (3) Pirate throws on a decision while the battle names a dead card
- **Evidence (AI sub-review):** 10 of 60 full games crashed with `No card instance $s000000 (it may have become a new object, CR 3-1-6)`: `queries.card` in `battleNumbers` (`ai/src/search/sim.ts:96`), reached from `lethalOnMe` (`ai/src/search/pirate.ts:763`, called at :914; unguarded calls also at pirate.ts:384, 507 and sim.ts:104, 145, 162; `why.ts`). Trigger: a battle target is K.O.'d and its [On K.O.]/optional prompt arrives while `queries.battle()` still holds the dead id. Repros: seed 1 `OP17-079` v `OP14-041` (Usopp K.O.s Shakuyaku, Hancock's `ko-life` prompt); seed 2 `OP08-098` v `OP13-001`. Failing pairs also `OP14-041` v `OP13-004`. `ai/src/session.ts:113` only catches `CannotDeterminize`, so the error reaches `worker.ts:75` as `{type:'error'}`; app handling not verified.
- **Fix:** `battleNumbers` returns null if either card is gone; session falls back to the rookie policy on any unexpected error rather than stalling. Add a regression test for the two repros.

### M4b-05 (3) "Choose none" does nothing when a look-at-top has no eligible card (UI stuck)
- **Evidence (app sub-review):** Saul (OP17-089) with no {Elbaph} in the top 3: panel "choose up to 1 ... 0 of 0 chosen / Choose none"; `#choose-done` and Enter do nothing (6 tries, 720p and 1080p). `commit()` in `app/src/play/rail/Decision.tsx` ~1693 sends `done` only `if (chosen.length < max)`; the engine asks `max: min(n, cands.length)` = 0 (`run.ts` ~1262). Only Rewind or concede escapes. Same for Lilith, Nami, Streusen, Koby. Related: lead's note about `choose max 0` (OP17-091's empty "trash 0 cards").
- **Fix:** engine skips an empty pick (matches effect-dsl 4.11 "0 candidates, no decision"), and the UI sends `done` when `max` is 0. Test in the app and engine.

### M4b-06 (2) OP08-115: "Then, play [Upper Yard]" runs after a failed "If" (A-4)
- Official rulings gate a "Then" after a failed "If": OP14-111/OP14-112 ("If my Leader does not have {Seven Warlords} ... can I use the 'Then, add ...' part? No."), OP14-070, OP15-116, EB02-052, and OP13-118 (the mono-green Leader row). CR 4-10-1 and 8-3-3. `cards/effects/OP-08/OP08-115.ts:35` puts `play` outside the guard (wave 2 reasoning "governs only the +3000" is wrong). Of all "If ... Then" cards only OP08-115 is out of line (OP05-115, EB03-053, OP12-015, OP12-018, OP17-017, OP14-031 are not "If, Then": the "if" follows or no "if"; they are right). Severity 2: only a non-{Shandian Warrior} Leader in a Yellow deck reaches it.
- **Fix:** move `play` into the `then`; flip the independent test; close M4b-5.

### M4b-07 (2) OP15-119: "reveal up to 1" always reveals (M4b-6, A-3)
- CR 4-8-1 and QA-GR allow 0; the official OP15-119 Q&A shows a face-up top card is "revealed" again, so reveal is the normal case. Forced reveal exposes a Life card the owner may not want shown. Fix: offer the choice (an `optional` decision before `reveal`).

### M4b-08 (2) OP06-058: who orders two Characters at the bottom of a deck
- Official OP06 Q&A: "which player decides the order? The owner of the cards." and "am I allowed to know the order? No." The engine uses the picker's order and the picker sees it. Fix: owner orders when the cards belong to the other player (or place in a random order). Same for any `bottomAnyOrder` over another player's cards (none other in the 182).

### M4b-09 (2) Nightly leak property is red on M4b decks (test model)
- `engine/test/property/leaks.test.ts` test 2 ("a handle never links a card ... ") fails with `p1 relinked ... (event CardMoved.newInstance)` in the repository's own run: `ENGINE_GAMES=10000 npx vitest run engine/test/property/leaks.test.ts` failed (PROPERTY_SEED 1737875533, counterexample 2083250152). Cause: OP15-119/OP15-114 style "reveal from Life" shows p1 a Life card, the view turns it hidden again, and when that same card later moves (damage, trigger) the handle repeats. That is legitimate (the card did not move; the official OP15-119 Q&A says the player "declares" the revealed card). The property only models `revealedInHand`. Not an engine leak: the permutation property (test 1) passed over 800 games with M4b decks on both seats and real scripts, and the skeleton-diff copy over 250 seeds passed.
- Also: both properties pin one seat to Rocks/Kaido and replace a third of card scripts with a stub trigger, so M4b-vs-M4b never occurs and a third of the new scripts never run. Fix: a `revealedInLife` exemption; widen the deck pairing; do not overwrite the real scripts.

### M4b-10 (2) Life cards turned face-up are never shown (app)
- `engine/src/project.ts:77, 121-136` projects face-up Life with the card; `app/src/play/board/Board.tsx:291-305` always draws backs and says "N cards, face down". Public information is lost after Wyper, EB04-059, EB03-053 (screenshots `faceup-*-after-OP15-114.png`).

### M4b-11 (2) The look-at-top panel hides the ineligible looked-at cards (app)
- Only eligible candidates are listed (`Decision.tsx` ~1677-1760). "Look at 5, take 1" with 3 matches shows 3 names; "trash the rest" gives no log line for the trashed cards. The look-and-trash cards (Saul, Usopp) are the most played in OP17.

### M4b-12 (2) Log wording for new effects (app)
- `app/src/play/game/text.ts:237-251`: `ModifierAdded` words only grant, negate, cannotAttack, basePower; kinds `cost`, `cannotDraw`, `cannotPlay`, `playCost`, `skipRefresh`, `cannotBeKOd`, `noBlocker`, `cannotBeRemoved` give an empty string (confirmed in play: "cannot play base cost 5+" is invisible). Deck to trash (look, reason 'look'), rest to bottom, Life top turned face-up (logs "Reveal X"), look to Life and add to Life (no Life delta) are silent or vague.

### M4b-13 (2) Independent `it.fails` tests that encode wrong readings
- B-2 (OP15-032 offers the opponent's DON!!) and D-2 (OP17-095 one payment saves two) are the engine being right: official Issho/Mihawk Q&A ("Rest up to 1 of your opponent's cards": Leader, Character, Stage or DON!! card) and OP17-095's own Q&A ("place 3 cards ... and if you do, neither Character leaves the field"; OP15-035 and OP17-021 likewise). The `it.fails` must be rewritten to assert the engine, or they will turn green later for the wrong reason.

### Severity 1
- M4b-14 `koed` reads printed values, not last-known (M4b-2): no deck can show it in the meta; fix when a base-power setter shares a deck with OP14-041.
- M4b-15 Inconsistent unpayable costs: `lifeToHand` not offered at 0 Life, others offered with `accept` illegal; empty "trash 0 cards" choose (OP17-091) and `lookAtTop` max 0 (the cause of M4b-05).
- M4b-16 Duplicate "K.O. ... trashed" log lines; "463 of 2,799 here" copy when "Automated only" is on; stale "vanilla filler" comments for EB04-007 in `usability-scenarios.ts:6-7` and `scenarios.ts` (the S1 lessons are unaffected: EB04-007 is only Life/deck/hand filler and is never drawn or played).
- M4b-17 The golden guard now accepts any SCRIPTS_VERSION change: an engine change landing together with a script change can be re-recorded without a bump. Acceptable; note it.
- M4b-18 API gaps: no public "is scripted" query; `Decision.max` is remaining picks; canonical-order picks hide candidates.
- Pre-existing: the "In meta decklists (verified)" filter includes OP05-022 (documented in `app/src/cards/meta.ts`). OP05-097 "type NULL" is not reproduced (category Stage, unverified).

Counts: severity 4: 0; severity 3: 5; severity 2: 8; severity 1: 5 items (M4b-14..18, plus the pre-existing note).

## Rulings on the disagreements and open questions

| Item | Ruling | Who is right | Sev | Fix |
| --- | --- | --- | --- | --- |
| A-1 OP05-098 optional | mandatory (CR 8-1-2) | independent | 3 | M4b-01 |
| A-2, B-1, D-1, DISAGREEMENTS-d 2, M4b-4 (give up to N DON!!) | 0..N, any number (ST01-011, QA-GR, CR 4-8-1) | independent | 3 | M4b-03 |
| A-3, M4b-6 OP15-119 reveal up to 1 | may reveal none (CR 4-8-1) | independent | 2 | M4b-07 |
| A-4 OP08-115 "Then" | gated (OP14-111, OP15-116 Q&As) | independent | 2 | M4b-06 |
| M4b-5 other "Then" cards | all others consistent and correct; the split by wording is right | builders | none | close |
| B-2, M4b-1 OP15-032 hits DON!! | yes, DON!! is a rest target (Issho/Mihawk Q&A) | engine | none | rewrite test (M4b-13) |
| D-2 OP17-095 two Characters | one payment covers both (OP17-095, OP15-035 Q&As) | engine | none | rewrite test |
| ST10-010 chooser | the activating player, face-down | independent/E-Q5 is wrong | 3 | M4b-02 |
| DISAGREEMENTS-d 1 empty trash 0 | engine deviates from effect-dsl 4.11, harmless rules-wise | independent | 1 (3 with M4b-05) | skip empty picks |
| M4b-2 koed printed values | last-known is the rule; no meta impact | open | 1 | later |
| M4b-3 face-up Life cost when top is already face-up | unpayable (OP15-114 Q&A) | engine | none | close |
| M4b-7 "Character with cost 12+" | either field, current cost (text has no "your") | engine | none | close |
| OP17-119 up to 5 within budget | "choose 0" and "any number" confirmed by the Loki Q&A | engine | none | close |
| OP13-004 own Characters only | text says "you have": right | engine | none | none |

## What I could not verify
- Hidden-information coverage is property based. No exhaustive proof, and the nightly property is not green until M4b-09 is fixed, so nightly coverage of the new decks is weaker than claimed.
- Roughly 70 of 143 scripts were read against text. The rest were covered only by the mechanical `upTo` check, Q&A lookup and the author tests.
- Pirate wall-clock p95 passed alone; the AI crash rate (10 of 60 games) was found on 10 archetype pairs, not all 144.
- Log wording for `playCost`, `skipRefresh`, `cannotBeKOd` was read from code, not seen. AI path of the zero-candidate choose and app handling of the worker `error` message untested. No 1080p full game ran (harness timeouts); 1080p screenshots come from scenarios.
- Random-game robustness: 3,600 games (all 144 pairings, 25 each, random and passive policy, invariants after every action): 0 crashes, 0 Anomalies, 0 stuck decisions, 0 capped. Soundness: 450 scripted positions with no `asVanilla`: 0 unsound proofs, 0 unsound bound refutations.
- Artifacts: probes and screenshots under `.cache/m4b-review/` (gitignored).

## Re-review 1

**Date:** 2026-11-16. **Build:** `origin/main` at `4dca69e` (f2cbe42 AI and app, 4dca69e engine and cards), rebased into the review worktree, `npm ci`. No repository code changed.

**Verdict: PASS.** No open severity 3 or 4. Two severity 2 items and five severity 1 items remain (below), none of which blocks the milestone.

### Checks run
- `npx vitest run` (all workspaces): 465 files passed, 3,923 tests passed, 2 expected fail (both pre-existing, EB04-040 and an older entry; none from M4b). Typecheck and eslint were clean at the first review and the diff is test, engine, AI and app code only; the full vitest and full Playwright e2e (196 passed, 0 failed, 720p and 1080p) are green.
- Revert checks (I reverted the fix, ran the tests, restored it):
  - M4b-01 (`OP05-098` back to `upTo: 1`): 6 tests fail. Reverting `engine/src/effects/run.ts` to 248a6d3 (all engine fixes at once): 43 tests fail, covering the M4b-01, -03, -05 and -08 tests, ST01-011, OP15-058, EB03-053, the independent DON!! tests, and two goldens.
  - M4b-02: reverting only `chooser` changes nothing, because `blind: true` overrides it (`run.ts:388`); reverting `blind` fails the ST10-010 test. So the guard is real, and `chooser: 'you'` is redundant but harmless.
  - M4b-04 (`ai/src/search/sim.ts` back to 248a6d3): 2 failures in `pirate-robust.test.ts` (the seed 1 OP17-079 v OP14-041 repro and the `battleNumbers` unit test).
  - M4b-05, M4b-03 and M4b-08 are covered by the `run.ts` revert above; the app half of M4b-05 was checked in the browser.
- Pirate sweep (my own probe): 132 full Pirate v Pirate games, every ordered pairing of the 12 leaders, seeds 7000+, `onFallback` counted: 0 crashes, 0 fallbacks, 0 capped. The earlier failing pairs now finish. The fallback cannot hide a bug in tests: `pirate-robust` fails on any `onFallback`, and the production path logs `console.error`.
- Lethal soundness with scripts, no `asVanilla` (the same probe as the first review, 2 batches of 150 positions over all leaders, 20,000 nodes): 0 unsound public proofs, 0 unsound bound refutations (135 checked), 0 unsound actual proofs (99 proven), 0 solver crashes (9 scenario-sampler rejections for OP15-058 with over 6 DON!!, my sampler's fault as before). The `giveDon` change did not break the solver.
- Properties at `ENGINE_GAMES=10000`: `leaks.test.ts`, `skeleton-diff.test.ts` and the new `link-tracker.test.ts`: all pass. The old failure is gone. The exemption is narrow: `link-tracker.test.ts` plants five real relinks that still fail (a hand card returning under the same handle, a second use after the exemption is spent, an older handle, a hand-revealed card, another card). `leaks.test.ts` now pairs M4b decks with each other and no longer replaces real scripts with the stub trigger.
- App (sub-review in Chromium, 1280×720 and 1920×1080; evidence under `.cache/m4b-review/app/rr1-*`): no console errors, no page errors.

### Status per finding
| Finding | Status |
| --- | --- |
| M4b-01 Enel optional | Fixed, revert-checked. |
| M4b-02 ST10-010 chooser | Fixed, revert-checked (guard is `blind`). |
| M4b-03 give up to N DON!! | Fixed, revert-checked. Count choose (N..0, "None") then target; with one DON!! the target `choose` ends with `done`. Browser: ST01-011 and OP15-058 play, keyboard works, "None" returns to main. Rookie AI completes it; the Pirate AI completes Enel's Activate. I could not confirm that either AI ever answers above 0 (not a correctness issue: the default pick gives all, as before). ST31-005 was not exercised in the browser (same code path). |
| M4b-04 Pirate crash | Fixed, revert-checked, 132-game sweep clean. |
| M4b-05 look with no eligible card | Fixed: Saul with 0 eligible completes in hotseat, vs Pirate, and when the Pirate plays it. The engine still asks max 0 when cards were looked at, deliberately (skipping would tell the opponent no card matches, CR 8-4-4-2); an empty deck or empty zone with no filter is now skipped. I agree with that choice. |
| M4b-06 OP08-115 "Then" | Fixed (script, test). |
| M4b-07 OP15-119 reveal | Fixed: Use/Skip prompt after a veil in hotseat, not offered at 0 Life. |
| M4b-08 OP06-058 order | Fixed: the owner gets an `order` decision; p1 does not see the order (test: events and views identical for both answers; hotseat curtain checked). |
| M4b-09 nightly leak property | Fixed, 10,000-game run green, exemption narrow with planted leaks. |
| M4b-10 face-up Life | Fixed in substance: tiles drawn, sr-only text correct ("3 cards, 1 face-up: Nami"), face-down names not in the DOM. Reopened as M4b-19 (severity 2) for the design below. |
| M4b-11 look panel | Fixed: ineligible cards listed and marked "can't be chosen"; trashed cards logged. |
| M4b-12 log wording | Fixed for cost, cannotDraw, cannotPlay, skipRefresh, playCost, look-to-Life, add-to-Life, face-up Life, deck-to-trash. The duplicate "K.O. ... trashed" is gone. Nits in M4b-20. |
| M4b-13 wrong `it.fails` tests | Fixed: B-2 and D-2 rewritten to assert the engine; the DISAGREEMENTS files say so. |
| M4b-14 koed printed values | Open, severity 1, unchanged (no meta impact). |
| M4b-15 unpayable/empty choose inconsistencies | Partly fixed (empty zone, no filter, now skipped); the rest of the inconsistency stays, severity 1. |
| M4b-16 duplicate K.O., readout copy, stale comments | K.O. duplicate and the EB04-007 comments fixed; "463 of 2,799 here" copy with "Automated only" on unchanged, severity 1. |
| M4b-17 golden guard | Accepted as noted; goldens re-recorded for the new engine and scripts versions. |
| M4b-18 API gaps | Open by design, severity 1. |

### New and remaining items
- **M4b-19 (2) Face-up Life tile (app).** `Board.tsx` draws a bright cream block (#f1ebdd) with a 12px name, no art, cost or power. It clashes with the dark UI and with principles.md section 6 (art is the hero). "Charlotte Smoothie" and "Sweet 3 Generals" are clipped (`scrollWidth > clientWidth`). With two or more face-up Life cards only the top name is readable (the next is overlapped to a sliver; sr-only text lists both). The tile cannot be inspected: hover shows no inspector, click and Enter and "i" do nothing, so the Counter, Trigger and cost of a public card are unreachable. Fix: use the card art (a thumbnail or a cropped art strip), make the tile inspectable like any other card, and fan the stack so each name stays readable. The information is correct and public; this is presentation and access.
- **M4b-20 (1) Log and tile nits.** The cannotDraw line names the Leader ("Enel cannot draw with effects") instead of the player; the OP13-118 restriction shows only the ability label in hotseat; the cannotBeKOd and cannotBeRemoved wording is unverified (no line appeared for OP15-118); the "N Life" plate covers part of the face-up tile name.
- Severity 2 open: M4b-19 (it also covers the inspect gap) and the unverified 2: none other. Counting the clipping/stack readability and the inspect gap as two separate items, 2 open at severity 2. Severity 1 open: M4b-14, M4b-15 (remainder), M4b-16 (readout copy), M4b-18, M4b-20.

### Not verified in this round
- ST31-005 and EB03-053 [On K.O.] in the browser; whether either AI ever gives more than 0 DON!!; the cannotBeKOd/cannotBeRemoved log wording; 1080p full games (scenario screenshots only).
