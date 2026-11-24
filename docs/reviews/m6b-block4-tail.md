# M6b review: block 4 tail, scripting batch 9 (116 scripts: EB-04, EB-03, ST-29 and 11 older block 4 cards)

**Reviewer:** independent adversarial review (subagent). Brief: find what is wrong; no stake in the scripts.
**Build reviewed:** worktree branch merged with the lead's local `main` (`0bff3eb`, contains `engine/test/independent/cards/eb03/`, `eb04/`, `st29/`), `npm ci`. No repository code was changed: every temporary edit (a Leader/weight override in `engine/test/support/decks.ts`, the mutation edits, scratch tests and an AI harness, all prefixed `b4trev-`) was reverted or deleted; this file is the only commit.

**Rule:** severity 4 = hidden-information leak or wrong game result; 3 = rules error that changes play, or blocking defect; 2 = notable defect; 1 = nit. Any 3 or 4 fails.

**Verdict: FAIL.** One severity 3 (B4T-R1: EB04-010 Lulucia Kingdom "Set the power of up to 1 of your opponent's Characters to 0" is scripted as `setBasePower 0`, so a target that already has +power (given DON!!, an earlier buff) keeps it; CR 4-12-1 / rules-digest 35 lower the power by the current power). No severity 4. Two severity 2 (EB04-052 Sanji copies base power where the same wording in OP16-036 reads current power; the EB04-015 Jinbe "disagreement" is a test-helper artifact and the stale `it.fails` should be flipped). Three severity 1. The Jinbe disagreement is settled: the script is right; there is no leak (below). 127 scripts compared with the verified text (the 116 plus 11 older EB03/EB04 cards in the same directories); apart from R1 and R2 no cost, number, filter, owner, zone, "up to", "you may", "Then" gating, once-per-turn or printed keyword differs.

## Method

1. Listed the scripts: `cards/effects/EB-04` (57 scripts), `EB-03` (44), `ST-29` (15) and the 11 older cards (OP01-039, OP02-005, OP02-068, OP03-044, OP03-048, OP03-072, OP03-097, OP04-077, OP04-096, ST02-007, ST06-008). The 116 in scope are the ones with independent tests; the other 11 (EB03-053 and older EB04 cards such as 002, 007, 030, 031, 032, 040) were compared too. A throwaway `tsx` dump printed each loaded `CardScript` (without source text) beside `effectText` and `triggerText` from `cards/data/sets/*.json`, and every script was compared clause by clause. All 127 have a `verified: true` override in `cards/overrides/`; the cards tests (text hash, keywords, validators) pass.
2. Read the five readings docs (`EB-04-scripting-g1/g2`, `EB-03-scripting-g1/g2`, `ST-29-and-older-scripting`), DISAGREEMENTS-a/b for eb03 and eb04 and DISAGREEMENTS-a for st29, rules-digest (35, 104, 112, 121-122), rulings (RL-11, RL-52, QA-OP13 OP13-109), OPEN-QUESTIONS (M6b-Q9, Q21, Q25, Q26, Q29, E-Q4), DECISIONS ("Empty picks", the hidden-gate and optional-cost entries), the OP-13/OP-14 reviews for format.
3. Tests: `npx vitest run engine/test/cards/EB04 EB03 ST29 engine/test/independent/cards/eb04 eb03 st29 cards`: 1,642 files, 17,115 passed, 2 expected fail (the EB04-015 B-1 `it.fails` and one older). `cards/test/hidden-gate.test.ts` passes with no allowlist entry for any card here.
4. Settled the Jinbe disagreement with a raw-action two-position probe; judged the flagged readings with probes; two-position hidden-information probes; random games, AI games, mutation check.

## Findings

### B4T-R1 (3) EB04-010 Lulucia Kingdom: "Set the power ... to 0" ignores power the target already has (M6b-Q29)
- **Card:** "[On Play] Set the power of up to 1 of your opponent's Characters to 0 during this turn."
- **Script:** `setBasePower { value: 0, duration: 'thisTurn' }` (the audit's proposal, M6b-Q29 "setBasePower 0 for the turn", marked "ask before scripting: No").
- **Rule:** rules-digest 35: "« Set Power to 0 » lowers power for its duration by the target's current power at the moment of activation (CR 4-12-1). If the target's power is already negative, it does nothing (CR 4-12-2)." rulings.md D-3 layer 3 also puts it among the resolved continuous modifiers with a fixed amount. A base power of 0 only zeroes the printed part.
- **Probe (scratch test, real script):** opposing cost-5 Character (7000) with +2000 from an earlier effect: 9000 before; after Lulucia Kingdom's [On Play] `g.power` = **2000** (rules: 0). Given DON!! (+1000 each) behave the same. The author test (`EB04-010.test.ts`) only tries an unbuffed Character and pins "a later +2000 still adds", which is true under both readings.
- **Impact:** wrong game result in a common position (the target usually carries DON!! or a buff, which is why the effect is played): it is left attackable and able to block with that power instead of 0. Severity 3: the rules error is in the script/engine gap (there is no "set power to 0" step), no hidden information.
- **Scope:** `grep 'value: 0'` over `cards/effects`: EB04-010 and ST34-004 (outside this batch; same shape, same fix).
- **Fix:** a power modifier of minus the current power at resolution (CR 4-12-1/2), or a `setPowerZero` step in the DSL; add a test with a given-DON!! or buffed target that fails on the old code; revisit M6b-Q29's "power to 0" half.

### B4T-R2 (2) EB04-052 Sanji copies the Leader's base power, OP16-036 (same wording) reads current power
- **Card:** "[When Attacking] This Character's base power becomes the same as your opponent's Leader during this turn." Identical wording to OP16-036 Mr.2.Bon.Kurei(Bentham) [When Attacking]; OP16-055 says "the same as your opponent's Leader's power".
- **Script:** `select` the opposing Leader then `setBasePower` with `refStat basePower` (author tests pin "the Leader's base power is copied, not its current power"). The OP-16 review (OP16-R5) judged the same wording as current power (`refStat power`; the sibling card says "power") and left the question open (OP-16-Q2 in OPEN-QUESTIONS). The batch therefore reads one wording two ways.
- **Impact:** matters when the opposing Leader carries given DON!!, a buff or a debuff on your turn (DON!! given on their turn stay until their refresh; a -1000 from your own effect). Conditional, unsettled; but the two scripts cannot both be right.
- **Why 2:** unresolved reading (M6b-Q29 "same as Leader"), no official ruling; consistency.
- **Fix:** decide once for EB04-052, OP16-036 and OP16-055 and record it; if current power is chosen, EB04-052's `stat: 'basePower'` becomes `'power'` and two author tests and the independent one flip.

### B4T-R3 (2) EB04-015 Jinbe: the independent `it.fails` and DISAGREEMENTS-a B-1 are a test-helper artifact; flip them
- See the ruling below. `restCost` in `engine/test/independent/cards/op17/kit-op17b.ts` ends in `pickInOrder`, which sends `done` when the next decision is a `choose` that can finish with no candidates; after the cost it answers the empty "play up to 1" pick for the test, so the test sees "no prompt". The same artifact was found for OP14-052/116 and closed in that batch's kits; the op17 kit still has it.
- **Impact:** the independent suite carries one permanently red-by-design test and a false severity-4 line, and any other independent test that pays a rest cost with this helper before an empty pick cannot see a missing prompt.
- **Fix:** answer the cost with raw `pick` actions in `EB04-015.test.ts`, turn the `it.fails` into a plain test (pick asked at max 0 for an empty hand and for a hand with no green cost-6 Character), delete B-1; fix `pickInOrder` (stop at the cost's last pick; do not answer the next prompt).

### B4T-R4 (1) EB04-007 Roronoa Zoro: an "If" in the effect is scripted as an ability condition
- **Card:** "[Activate: Main] [Once Per Turn] If your opponent has a Character with 8000 power or more, this Character gains [Rush: Character] during this turn."
- **Script:** `conditions: [exists opponent Character power >= 8000]` on the ability. Without such a Character the activation is not offered; per the text it could be activated (spending the Once Per Turn) and do nothing. Sibling cards in the batch (EB03-013, EB04-012, `playedThisTurn`) put the "If" in the effect. Observable only in that a player cannot burn the once-per-turn for nothing. Harmless; nit.

### B4T-R5 (1) Mutation survivors (see numbers)
- Survive both suites: EB04-051 Emet (`gte: 12000` to 11000: no test with a base-power 11000 Character). Survive the author suite only (the independent test kills them): EB03-017 Bonney (cost 8 bound to 9: no cost-9 opposing Character). Survive the independent suite only: ST29-008 Nami (`type: 'Egghead'` to another type: the independent test never has a non-{Egghead} bystander on that replacement), EB04-041 Stealth Black (DON!! threshold 4 to 3), EB04-045 Ginny (cost 8 to 7). **Fix:** boundary cases for those five.

### B4T-R6 (1) Open readings that the scripts take and the tests pin (no defect found, listed so the owner can see them)
- EB03-012 Otama and EB03-061 Uta: "your opponent's DON!! cards or ... Characters with a cost of ..." rests an opposing DON!! regardless of the cost and type filters (M6b-Q25 open; tested both ways: "no cost or type test").
- EB03-010 Monet, EB03-042 Koala: "up to 1 X or up to 1 Y" is one card in total (M6b-Q26 open).
- EB04-013 Carrot: "set up to 2 of your {Minks} Characters and your Leader as active": the Leader is always set (not part of "up to 2"). Both readings agree on the tested cases.
- EB03-021 Alvida: the second placement has no "of your opponent's" and may take one of your own Characters (sequential picks; the same card cannot fill both).

## Disagreement ruling

| # | Card | Who is right | Reason |
| --- | --- | --- | --- |
| B-1 (eb04 A) | EB04-015 Jinbe: "play up to 1 green Character with a cost of 6 or less from hand" (after the rest cost, with a {Fish-Man} Leader) is "not asked without a match" | **Script.** The pick is asked in every hand; the independent author's observation is a test-helper artifact (severity 1 test defect, B4T-R3), **not a leak** | Raw-action two-position probe on the real script (Leader OP06-020, Jinbe K.O.'d while blocking, 3 active DON!!): after `optional accept` and one raw `pick` of the cost, the decision is `choose`, purpose `target`, prompt "play up to 1 of your cards in hand", with `max 0` and only `done` legal for an empty hand; `max 0` for a hand of {cost-3, green cost-7}; `max 1` with one green cost-6 card. For same-size hands with and without a match (`[c3, green7]` against `[c3, green1]`) the opponent's projected view and projected events, ids and card stats normalised, are identical at the prompt. `pickInOrder` (`kit-op17b.ts`, called by `restCost`) answers the next empty pick with `done`. Same cause and same resolution as OP14-052/116 in the OP-14 review; `engine/test/cards/empty-pick-hidden.test.ts` covers the shape. |
| other | none | n/a | DISAGREEMENTS-b (eb04), a and b (eb03) and a (st29) report none; their stated readings (EB04-045 both sides count, EB04-056 a Character named Bonney, EB04-057 battle K.O. not prevented, EB04-043 per-turn, EB03-042 one card, EB03-058, EB03-038, ST29-004/014) agree with mine; see the table below. |

## Readings flagged in the scripting docs and the DISAGREEMENTS files: judgments

| Reading | Judgment |
| --- | --- |
| ST29-005 / 008 / 009 [Trigger] "If your Leader is [Monkey.D.Luffy], play this card": card goes to the trash when the check fails | Right. The Trigger is activated, the `if` fails, and an activated Trigger card that is not moved goes to the trash (rules-digest 104 family; the engine note and tests pin it); declining adds it to the hand. The offer is not gated on a hidden fact (the Leader is public). |
| ST29-008 Nami `turnLifeFaceUp` with the top card already face-up | Right, probe: with the top Life card face-up the replacement is not offered and the Egghead is K.O.'d (no free save); with the top face-down and a face-up card second, it is offered; with 0 Life it is not offered. This is QA-OP13 OP13-109 (CR 1-3-2-1: "cannot be used if it is already face-up"). |
| EB03-056 Belo Betty unpayable face-up cost | Right, same rule: a face-up top card makes the cost unpayable (author test pins that accepting is illegal and nothing is K.O.'d). The state is public (face-up), so no hidden gate. |
| EB03-058 Lilith [Trigger] offered when "If your Leader is [Vegapunk]" is unmet | Right. A Trigger may be activated whatever its condition; with the If unmet the card is trashed. The offer depends only on the revealed Trigger card, not on a hidden zone. |
| EB03-038 / "you only have Characters with a type including GERMA" with no Characters | Acceptable. The script requires at least one Character (`exists` and `none not typeIncludes`); this is the E-Q4 precedent (QA-OP17 OP17-118: "only Characters ..." is false with 0 Characters). M6b-Q21 (OP16-022) stays the open counterpart. |
| EB03-042 Koala "up to 1 {Revolutionary Army} ... or up to 1 [Nico Robin] ..." | Acceptable (one card in total, same as Monet, M6b-Q26 open); R6. Name exclusion `not name Koala`, hand or trash, opponent's turn only, +4 cost with an {Revolutionary Army} Leader: right. |
| EB03-021 Alvida sequential placements | Acceptable. Each "up to 1" is its own pick, in text order; the second has no owner qualifier so it takes any Character; the first (opposing, base power 4000 or less) cannot also fill the second; base values read as base. Placing at the owner's bottom needs no order. |
| EB03-013 Carrot, EB03-015 Camie, EB03-024 Vivi: a "Then" after an "up to" that chose nothing | Right (CR 4-10-2, M4b-5). 013: the K.O. and the Zou play are both inside "If this Character was played on this turn" (a failed If blocks the Then; an unchosen K.O. does not). 015: give, then rest, no If. 024: play, then the `cannotPlay Character` restriction, which applies with nothing played (author test). The 024 restriction bars every Character play by any means for the turn. |
| EB04-006 Moda: [Lulucia Kingdom] name versus type | Right: square brackets are a name (the Stage EB04-010), Moda ({Lulucia Kingdom} type) is not a candidate. |
| EB04-013 Carrot | Acceptable; R6 (the Leader always set). |
| EB04-010 `setBasePower 0` (M6b-Q29) | **Wrong**; B4T-R1 (3). |
| EB04-052 Sanji base power (M6b-Q9/Q29) | Inconsistent with OP16-036/055; B4T-R2 (2). |
| EB04-025 Vivi "Then, your opponent places 1 card" | Right (CR 4-10-2): placed even when nothing was played (the play is "up to 1"); the opponent chooses the card; skipped only for an empty hand (public). |
| EB04-043 Kaku | Right. Black, base cost 5 or less, opposing effect only, 3 trash cards to the bottom in the owner's order, unusable with fewer than 3 (public trash); the use is spent when it is used only: probe, decline the first replacement and the second K.O. in the same turn is offered again. |
| EB04-054 Kuma | Right: the [On K.O.] has no Life condition (battle or effect), "up to 1" top opposing Life card to its owner's hand; the [On Play] adds from the deck to Life only with 2 or fewer Life. |
| OP04-096 Corrida Coliseum | Right. {Dressrosa} Leader gate, `Rush: Character` granted continuously to your {Dressrosa} Characters (also ones played after the Stage, author test); "Characters only", not the Leader. |
| EB03-052 Shirahoshi, EB03-017 Bonney, EB04-036 Foxy, EB03-060 Nami Event | Right (M4b-5): the "Then" is inside the "If" and does not resolve after a failed one; the cost is still paid. |
| EB04-028 Ice Time (cost before the Leader check), EB04-034 Pudding, EB04-029 | Right: the optional cost is paid first and a failed If does nothing. |

## Hidden information (severity 4 checks)

**Two-position probes** (scratch test, not committed): the same public position built with different hidden cards (p1's hand: 5 random cards drawn from EB-03/04, ST-29, OP-04/08/13/14 and ST-02 non-Leaders; deck 12; Life 4) for every non-Leader card in scope (127 scripts), every way an ability starts (play from hand, [Activate: Main], [Trigger] from the top Life card, [When Attacking], [On K.O.] of a rested Character K.O.'d by an opposing attack, [Counter] of an Event: 6 modes), under 9 Leaders (ST01-001, OP08-021, OP04-001, EB04-001, ST29-001, OP06-020, OP02-093, OP12-001, OP11-022) so that Leader gates open, with three position-independent policies (accept every optional and `done` on "up to"; decline every optional; accept and take the first listed pick). The opponent's projected view and projected events (card ids, instance handles and the stats of revealed cards normalised away) had to be identical at every step; the comparison stops where the owner's policy picks a hidden card (a played card's own effect then legitimately differs) or where the owner's accept is illegal (an unpayable cost: the "use" is shown unavailable, DECISIONS "Empty picks"). In counter mode the Life fill is trigger-free (a damage [Trigger] prompt is the engine's known, documented pause, ADR 0005, covered by `leaks.test.ts`). A planted hand-gated optional (positive control) makes the comparison fail, so the check can see a gate.
- **Final run:** 572 (card, mode) pairs started, 15,444 probes, 206,280 runs, 361,149 step comparisons, 10 fills each: **0 differences**. Two earlier runs of the same harness without the counter mode (6 fills seed 12345: 119,880 runs; 16 fills seed 777: 319,680 runs) also gave 0. The first counter-mode run flagged a dozen Event cards (EB04-009, 019, 020, 040, EB03-011, 020, 029 among them); each was the damage [Trigger] prompt of a fill with a [Trigger] Life card, gone when the Life fill had no [Trigger]. No hand-, deck- or Life-gated pick, optional or choice was found.
- **EB04-015 Jinbe** (task item 2): own raw-action probe, see the ruling; hand without a match is asked at max 0 and the opponent's view is identical.
- The hidden-gate check (`cards/test/hidden-gate.test.ts`, `cards/src/hidden-gate.ts`) passes; no allowlist entry exists for any of the 127. Prompts that depend on public facts only: the Life, DON!! and trash counts, the opponent's hand size (EB03-026, EB04-022), Characters on the field.

## Random games, AI games and mutation checks

**Decks.** A temporary override of `randomStandardDeck` (reverted, `B4T_LEADERS`): Leaders limited to EB04-001 Jewelry Bonney (the only scripted Leader with scripted cards among EB-04), ST29-001 Monkey.D.Luffy (scripted) and EB03-001 Nefeltari Vivi (legal, not scripted, wanted because EB03-011 and EB04-021 name her), the batch's scripted cards weighted 40 against 6 for other scripted cards; both seats play such decks. Every deck passes `deckIssues(.., 'standard')` (done by `randomStandardDeck`).

**Property harness** (`engine/test/property/standard-games.test.ts`, invariants after every action, replay hash equals live hash, every listed action reduces, sampled unlisted actions throw): 3,000 random legal games (`ENGINE_GAMES=3000`, `PROPERTY_SEED=9101`): 622,426 actions, 0 capped; 2,417 "damage at 0 Life", 583 "deck out"; 1,157,430 listed reductions, 4,868,142 unlisted attempts that threw. All pass.
**Leak, projection and skeleton properties** (`leaks.test.ts`, `skeleton-diff.test.ts`, `ENGINE_GAMES=3000`, `PROPERTY_SEED=9103`, "standard decks: true" variants use these Leader decks): 8 tests, all pass.

**AI games** (`ai/test/support/match.ts` `playMatch`, tier `pirate` vs `pirate`, seeds 300 to 359, both seats from the same Leader-restricted Standard decks): 60 games, 0 errors, 0 capped, every chosen action was in the seat's own view (`playMatch` throws otherwise), all 60 ended "damage at 0 Life", 10,857 actions. Deck seats per Leader: EB03-001 41, EB04-001 45, ST29-001 34 (at least 10 games each, 120 seats). `onFallback` was not counted.

**Mutation check.** 47 single-clause mutants across 47 distinct scripts (a threshold, a number, a cost amount, a power or cost bound, a type, a name, a `life: both` scope, `hasTrigger`, a `donGiven` count, a pick shape), each applied alone, the author test and the independent test of the card run separately, the file restored after each run (`git status` clean afterwards). Ids: ST29-001, 002, 003, 005, 008, 013, 014, 015, 017; OP01-039, OP02-005, OP03-048, OP04-096, ST06-008; EB03-004, 013, 017, 021, 024, 026, 028, 036, 037, 043, 045, 049, 052, 062; EB04-001, 003, 005, 008, 010, 016, 018, 019, 022, 028, 034, 041, 043, 045, 051, 055, 057, 059, 061.

| Result | Author tests | Independent tests |
| --- | --- | --- |
| Mutants killed | 45 of 47 | 43 of 47 |
| Survivors | 2: EB03-017 (`lte: 8` to 9), EB04-051 (`gte: 12000` to 11000) | 4: ST29-008 (`Egghead` type), EB04-041 (4 DON!! to 3), EB04-045 (cost 8 to 7), EB04-051 |

Survivors in both: EB04-051. Killed only by the independent suite: EB03-017. Killed only by the author suite: ST29-008, EB04-041, EB04-045. Listed in B4T-R5.

## Other observations (no finding)

- The only open `it.fails` in the batch is EB04-015's (R3); `DISAGREEMENTS-a.md` (eb04) B-1 should be removed with it. ST29's and EB03's DISAGREEMENTS files say none, and no `it.skip` or `it.todo` exists in the 116 author and independent test files.
- EB04-035 Kamazo: the Leader check is an ability condition tested when the event fires, so the Once Per Turn is not spent when the Leader is not {Kid Pirates}; the "[Your Turn]" gate reads the turn when the DON!! returns. Right.
- EB04-061 Luffy's "give this card in your hand −1 cost" is a hand-zone permanent conditioned on public Life (no hidden gate).
- ST29-014 Zoro's cost filters the hand by `hasTrigger`; the Activate is only offered with such a card, which tells only its owner (activations are per-player legal actions), and nothing is shown to the opponent before the use.
