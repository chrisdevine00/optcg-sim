# M6b review: OP-15 scripts (scripting batch 5, 68 scripts)

**Reviewer:** independent adversarial review (subagent). Brief: find what is wrong; no stake in the scripts.
**Build reviewed:** worktree branch merged with the lead's local `main` (`engine/test/independent/cards/op15/` present, ENGINE_VERSION 0.5.11), `npm ci`. No repository code was changed: the temporary files for the random-game, leak, skeleton, AI and mutation runs were removed or restored (`git status` clean before this file).

**Rule:** severity 4 = hidden-information leak or wrong game result; 3 = rules error that changes play, or blocking defect; 2 = notable defect; 1 = nit. Any 3 or 4 fails.

**Verdict: PASS.** No severity 4, no severity 3. Four severity 2 and five severity 1 findings. No script differs from its verified card text in a cost, condition, "up to", "you may", "Then", duration, filter, owner or timing. Both independent disagreements (A-1, A-2) are real engine behaviour, not script faults: A-1 is an engine layering defect (not the "exactly 0" threshold the independent author guessed), A-2 is an expressiveness gap that wave 3 did not close. No hidden-information leak was found by the leak, skeleton or random-game runs, apart from one pre-existing skeleton/view inconsistency that shows nothing the rules do not already make public (OP15-R7).

## Method

1. Dumped each of the 68 scripts beside the verified card text (`cards/data/sets/OP-15.json`, `textFixes` included) and compared clause by clause. Names used as filters (`Brook`, `Kelly Funk`, `Bobby Funk`, `Rebecca`, `Lucy`, `Satori`, `Hotori`, `Kotori`, `Shura`, `Heavenly Warriors`, `Gecko Moria`, `Oars`, `Kalgara`, `Tony Tony.Chopper`, `The Outcome Will Tell Us Who's Strong and Who's Weak`) and types (`Fish-Man`, `East Blue`, `Dressrosa`, `Sky Island`, `Vassals`, `Thriller Bark Pirates`, `Straw Hat Crew`, `Shandian Warrior`) were checked against the card data: all exist, spelling exact.
2. Read CLAUDE.md, runbook step f, the four earlier reviews, the three readings files, the three DISAGREEMENTS and API-GAPS files, rulings (RL-41, RL-52), rules-digest 74, 112, 117, 122, 123, OPEN-QUESTIONS (M4b-5, M6b-Q2, Q7, Q26, Q30, Q41), DECISIONS (the 2026-11 "Empty picks" entry, the order-decision entry), BACKLOG section 5, and `engine/src/derive.ts`, `layers.ts`, `eval.ts`.
3. Probed A-1 (derived values at each layer stage) and scanned every script in the repo for `play { from: 'self' }`.
4. Random games, leak, skeleton and AI runs; mutation run (numbers below).

All 68 scripts exist; all 68 have an author test and an independent test. `npx vitest run engine/test/cards/OP15 engine/test/independent/cards/op15`: 160 files, 1,201 passed, 2 expected fail (the two `it.fails`, A-1 and A-2).

## Findings

### OP15-R1 (2) OP15-013 Pincers (and OP15-102 Gan.Fall): a hand-cost effect reads the Leader's or Character's power without its power-stage permanent effects (disagreement A-1)
- **Card:** "If your Leader has 0 power or less, give this card in your hand -2 cost." The script (`conditions: [{ leader: { power: { lte: 0 } } }]`, `zone: 'hand'`, `cost -2`) is right.
- **Probe:** OP13-004 Sabo (printed 5000, "if you have 4 or more Life cards, give this Leader -1000 power", so 4000) with two OP15-009 Koby replacements (-2000 each). `leaderPower` = 0, Pincers still costs 4. At the third replacement (-2000) the cost drops. Inside the engine: `derive(leader).power` is 0, but `deriveAt(leader, upto 0).power` is 1000. The cost permanent is stage 1 (`STAGE_OF.cost`), and a stage reads only the stages before it (`derive.ts` header), so the Leader's own permanent -1000 (stage 3) is invisible to Pincers' condition.
- **Ruling on A-1:** the text "0 power or less" is true at exactly 0, and the engine's comparison (`cmp lte`) is right. The independent author is right that the result is wrong, but the cause is not the threshold: it is the layering. Any hand-cost permanent whose condition reads a power sees the base plus timed modifiers only. Affected in this batch: OP15-013 (Leader power) and OP15-102 Gan.Fall ("a {Sky Island} Character with 7000 power or more": a 6000 Character with a +1000/+2000 permanent effect is not counted). The effect is wrong in both directions. **OP15-004 Sea Cat is not affected**: its condition is an auto effect's `conditions`, evaluated with the full `derive` at resolution (it reads exactly 0 correctly; by code, not testable in the pool, API-GAPS-a G1).
- **Why 2, not 3:** reaching it needs a power-changing permanent on the same Leader or Character at the moment (Sabo-like Leaders, a +power aura); no pool card puts a Leader at exactly 0 without one.
- **Fix (engine):** compute hand-zone cost permanents after the field stages (a hand card's cost feeds no power-stage permanent except through filters on hand cards, which no script uses), or re-read power at the last stage for `zone: 'hand'` abilities. The `it.fails` in `OP15-013.test.ts` then becomes an `it`.

### OP15-R2 (2) OP15-024 Usopp: "cannot be rested by your opponent's Leader and Character effects" also stops opposing Events and Stages (disagreement A-2)
- **Evidence:** the script uses `cannotBeRested: { by: 'opponentEffect' }`. `engine/src/derive.ts` keeps `cannotBeRestedByOpp` as a boolean; `canBeRested` (line 78) tests `reason === 'effect' && by !== owner`, with no source card. Wave 3's `sourceFilter` exists only on the event triggers (`trashedFromHand`, the `koed`-family event) in `cards/src/dsl.ts`, not on `restrict` or the modifier, and `restrictionMod` has no source-type field. So it is **not expressible today**.
- **Ruling on A-2:** the independent author is right on the text. An Event or Stage effect is neither a Leader effect nor a Character effect, so the real card does not protect Usopp from `OP17-038`-style Events. The sim over-protects. The script documents it ("M6b-Q30 family"), so this is a known approximation.
- **Why 2:** wrong result only when the opponent uses an Event or Stage effect to rest Usopp on their own turn. The comment names the Q30 family, but Q30/Q41 are about costs and attacks, not source types; a new line is needed in OPEN-QUESTIONS.
- **Fix:** an `effectSource: ['Leader','Character']` qualifier on `by` (the effect context already knows the source card: `run.ts` passes it to triggers) or record it as accepted.

### OP15-R3 (2) OP15-098 Monkey.D.Luffy (Leader): "removed from the field by your opponent" is scripted as opponent's effects only (M6b-Q7), and is not in OPEN-QUESTIONS
- The verified text has no "effect": "...would be removed from the field by your opponent, you may add 1 card from the top of your Life cards to your hand instead". The script uses `cause: 'opponentEffect'`, so a battle K.O. is not replaced; the ruling in the script says so. This is the same call as EB05-061 (review EB05-R3, severity 2, M6b-Q7) and OP15-035/069.
- **Judgement:** consistent with the earlier ruling, and a Leader of this kind is the shape where a battle K.O. most often matters (the most common removal in play). If the printed meaning includes battle, this Leader gives the wrong result on the most frequent path. Cannot be settled from the files: no Q&A row for OP15-098 in `docs/research/rulings.md`. Add OP15-098 to M6b-Q7; fetch the official card text and Q&A.
- **Not 3:** no ruling contradicts the script; it is the repository's standing reading.

### OP15-R4 (2) OP15-024 Usopp [On K.O.]: "Leader or Character cards with a cost of 7 or less": the Leader is never eligible, and this is not in OPEN-QUESTIONS
- The pool filter `cost lte 7` compares `def.cost`, which is `null` for a Leader (`eval.ts cmp`: `v === null` is false). The script's ruling says so. The wording names the Leader, so the designers probably meant it to be a target; the rules digest has no entry on a Leader's cost in a "cost of N or less" filter (a Leader has no cost, so a literal reading excludes it).
- **Judgement:** the script follows the literal rule; the open point is whether the Leader should count as cost 0. Behaviour today: only opposing Characters can be rested by this effect. Log it as an open question and look for an official Q&A; no change to the script until then.

### OP15-R5 (1) Replacement and hand-paid costs are offered when the player's hand or Life makes them impossible on public information
- OP15-090 Perona: with an empty hand the replacement is offered and only "decline" is legal (author test "cannot be used with an empty hand"). A hand size is public (DECISIONS "Empty picks": "unpayable on public information means the effect is not offered"). OP15-098 and OP15-105 with 0 Life are not offered (RL-41). No leak (the same prompt shows with or without a card), only a needless decline prompt. The hand-dependent costs (OP15-042 Kyros, 045 Sai, 048 Chinjao, 057 Dressrosa Kingdom, 096 Counter) are asked with "use" unavailable by the standing rule (ADR 0005): correct, since the contents of the hand are hidden (an Event in hand is a secret). Only the empty-hand case is public.
- **Judgement on the brief's flagged item (OP15-090):** acceptable, consistent with the other hand-trash replacements (ST30-009/011).

### OP15-R6 (1) Mutation survivors (author and independent tests)
- 64 one-clause mutations in 60 scripts: author tests caught 63, independent tests caught 63, both 62, neither 0.
- **OP15-004 Sea Cat** `amount: -3000` to `-2000`: author caught, **independent survived** (7 tests, none read the exact -3000).
- **OP15-110 Braham** `leader type 'Shandian Warrior'` to `'Sky Island'`: **author survived** (5 tests, none with a non-{Shandian Warrior} Leader of another type), independent caught.
- Tests to add: Sea Cat exact -3000 in the independent test; a {Sky Island}-Leader negative case in `OP15-110.test.ts`.

### OP15-R7 (1) Pre-existing skeleton/view inconsistency for a card being played at a "make room" prompt
- One skeleton mismatch in 1,250 seeds x 2 viewers (life mode, seed 956, viewer p2, step 112): `projectForSearch(...).skeleton.state.cards.$k000009.card` differs (`EB02-015` vs `EB04-012`) while `project(...)` is equal. The card is the one p1 is playing from hand with a full Character area (`Your Character area is full. Choose 1 of your Characters to trash.`). `determinize.ts` treats a card being played as known (CR 2-7-2), the view does not show its identity at that prompt. Nothing the rules keep secret is shown, and no script is involved (the hand card differs between the two games because their Life orders differ, so a Life card reached hand earlier; the prompt itself is the base play rule). Reported for the AI/view owners; the property's "equal views give equal skeletons" needs an exception for the card being played, or the view should reveal it.

### OP15-R8 (1) OP15-073 Yama (M6b-Q26): one card in total
- "Play up to 1 [Heavenly Warriors] with a cost of 1 or up to 1 {Vassals} type Character card with a cost of 1 from your hand." Scripted as one selector over an `any`, `upTo: 1`: one card in total. **Ruling:** "or" between the two descriptions chooses one description; one card. Keep. The independent test assumes only what both readings share, so it does not pin it; fine until Q26 is answered.

### OP15-R9 (1) OP15-080 Oars: "no other [Oars] cards" is read on your Characters only; the `from: 'self'` zone bug is avoided
- The text does not name a field. The script checks your Characters named [Oars] other than itself (an opposing [Oars], or one in hand, does not count). Plausible; the opposing case is untested. Recorded in the readings.
- **BACKLOG section 5 (`play { from: 'self' }` plays from wherever the card is now):** the script uses `from: 'trash'` with `isSelf`, so paying the cost with Oars himself leaves nothing to play (author test). I scanned all scripts in the repo for `play { what: { from: 'self' } }`: 25 hits (P-088, ST36-002, ST30-008, OP14-105/107/114, EB05-051/053/055/056, OP15-103, OP16-014/107/111/113, OP17-015/071/102/103/104/106/107/110/111/114). Only the Trigger plays (no cost, the card sits in the Trigger area) and hand-trash costs (EB05-053/055, OP16-107, ST30-008, OP16-014, OP17-015) are among them; none has a cost that can move the source card, so none hits the bug. OP15-103 Genbo is a Trigger play with no cost.
- **OP15-080 order:** the 3-card deck-bottom cost asks the owner for an order (author test `kind: 'order'`), as the earlier OP16-R3 fix requires.

## Readings judged (the brief's list)

- **OP15-095/096/097 Event trash thresholds:** an Event is trashed before its effect resolves (rules-digest 74, 123), so 14 other cards make 15 for the Main or Counter. Right and tested at both boundaries. For OP15-097's [Trigger] the card is in no area while it resolves, so it does not count. Right (tested at 10 and 9).
- **OP15-109 Robin "Then":** the "Then, play up to 1 {Sky Island}" sits inside the leading "If your Leader has the {Straw Hat Crew} type" (M4b-5, closed: a "Then" after a failed "If" does not resolve; OP15-116 Q&A). Right. The play is independent of whether a card was added from the deck ("Then" clause rule, rules-digest 122). **OP15-115 Impact Dial:** no "If"; "Then, add 1 card from the top of your Life cards" is independent of the K.O. (also rules-digest 122), mandatory, skipped with 0 Life. Right.
- **OP15-102 -3 cost:** the sign comes from a Limitless-sourced `textFix` (M6b-Q2); script and card agree on -3. Right.
- **OP15-090 empty hand:** see R5.
- **OP15-079 Absalom / OP15-082 Lola choose themselves:** the K.O.'d card is in the trash when [On K.O.] resolves (CR 10-2-17), and Absalom is a {Thriller Bark Pirates} card, so it can add itself; Lola (cost 4) is a legal pick. Right. Absalom's [Trigger] activation: the card is not in the trash yet, so only others qualify (tested).
- **OP15-054 Leader gate:** the leading "If your Leader is [Lucy], choose one:" gates the whole choose-one; the Event is played and spent without [Lucy] and no mode is asked. Right (comma, no colon).
- **OP15-052 Leo:** the payload is any one of your Characters at the deck bottom, including the Character being removed or Leo himself. Right; battle K.O.s and your own effects are not replaced.
- **OP15-064 / OP15-072 condition after a paid cost:** the "If" follows the colon, so DON!! -2 and the rest are paid even when the names are missing (RD 112). Right. The "You may rest this Character" is not a separate yes/no on an [Activate: Main]: choosing to activate is choosing to pay. Equivalent.
- **OP15-042 Kyros:** the card is trashed first, then the Leader check; the [On K.O.] add from the trash is mandatory and from the trash only. Right.
- **OP15-020 Fire Fist:** the K.O. target is chosen after the -8000 (a Character at 8000 or less is at 0 or less), the trash of 2 is a "may" and the K.O. is "If you do"; with fewer than 2 cards in hand nothing is trashed and nothing is K.O.'d (hand size is public). Right.
- **Hidden-information check (every new script):** no script's prompt depends on a hidden card in a way the standing rule (DECISIONS "Empty picks", ADR 0005) does not already cover: a pick over a filtered hand or deck with no candidate is still asked at max 0 (OP15-043 Kelly Funk, 007 Gin, 037/040/044/053 look-at-N); a hand-paid optional cost is offered with "use" unavailable (042, 045, 048, 057, 096); the deck-top "add up to 1 to Life" (OP15-109, 110) and Life-to-hand (033, 098, 100, 105, 115) are blind yes/no or forced. The leak and skeleton runs below found none.

## Script versus card text: result

68 of 68 compared. No mismatch found beyond the readings above. Points checked and found right (likeliest to be wrong): OP15-011 `basePower lte 6000` and both clauses gated on the Leader; OP15-021 Main and Counter share one effect; OP15-033 add mandatory after the set-active; OP15-041 once per turn and Orlumbus may place himself; OP15-053/OP15-111 `donGiven: 1` (at least 1 DON!! given, both turns); OP15-063 DON!! -1 optional, K.O. at current power 2000 or less with 6 or fewer DON!!; OP15-070 grant to [Shura] cards and Fuza, `setBasePower 6000` only on the opponent's turn; OP15-083 trash count read after the cost (Spoil counts); OP15-085 `not name Tony Tony.Chopper` excludes every printing; OP15-086 Rush only on the played Character (`bind`/`ref`); OP15-094 `isSelf: false`, `trashSelf` is a trash (no [On K.O.]); OP15-097 `baseCost`; OP15-103 Life count read after the card left Life; OP15-106 colour Yellow, Character or Stage, cost 2 or less; OP15-117 give one rested DON!! to a {Sky Island} Leader or Character, Trigger gated on the Leader type.

## Disagreement rulings

| # | Card | Ruling | Severity |
| --- | --- | --- | --- |
| A-1 | OP15-013 Pincers (and OP15-004 Sea Cat) | "0 power or less" is true at exactly 0 and the script is right. The failure is an engine layering defect (hand cost reads power before power-stage permanents), not the threshold; Sea Cat is not affected. The independent author is right that the result is wrong. See R1. | 2 |
| A-2 | OP15-024 Usopp | The independent author is right on the text (an Event is not a Leader or Character effect). Not expressible: no source-card-type field on `cannotBeRested`; wave 3's `sourceFilter` covers some event triggers only. Script approximation stays, to be logged. See R2. | 2 (was 1) |

## Numbers

- **Author and independent tests (OP-15 folders):** 160 files, 1,201 passed, 2 expected fail.
- **Random games:** 3,000 Standard games, 11 Leaders (OP15-039, 058, 098; OP13-004, OP13-001; EB05-010; OP09-062; OP08-098; OP05-098; OP14-041; OP17-079; the unscripted OP15 Leaders 001, 002, 022 skipped), decks of 50 weighted 25:4:1 for batch cards, other scripted, other cards (a temporary copy of `randomStandardDeck`), a fifth of the games passive. Invariants after every action, replay hash equals live hash, a sampled listed action reduces at every state, no Anomaly. **0 failures, 0 capped, 578,586 actions**; results 2,400 damage at 0 Life, 600 deck out. Every batch card with an effect was played at least 142 times (lowest OP15-007 Gin 142, OP15-013 145, OP15-011 146, OP15-033 148); OP15-098 is a Leader, in 518 decks.
- **Leak property** (`leaks.test.ts` copy, Standard decks above, ENGINE_GAMES=7,500: 500 games per property): views, observed `autoSkip`, search skeletons and projected events invariant under hidden permutations; handles never link across hidden zones: **0 failures**.
- **Skeleton reachable pairs** (`skeleton-diff.test.ts` copy, 1,250 seeds x 2 viewers per mode): "all" mode 0 mismatches; "life" mode 1 (R7, pre-existing, not a leak).
- **AI:** 110 Pirate-versus-Pirate matches, 10 per Leader above (opponent from the same seed): 0 errors, 0 capped, all ended by damage at 0 Life.
- **Mutation:** 64 mutations in 60 scripts (thresholds, amounts, filters, names, types, once-per-turn, owner, zone, keyword). Author tests caught 63 (survivor: OP15-110 Shandian Warrior type), independent tests caught 63 (survivor: OP15-004 -3000), both 62, neither 0.
