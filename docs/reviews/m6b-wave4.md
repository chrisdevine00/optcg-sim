# M6b review: engine wave 4 and the 21 cards it unblocked (batch 10)

**Reviewer:** independent adversarial review (subagent). Brief: find what is wrong; no stake in the code or the scripts.
**Build reviewed:** worktree branch merged with the lead's local `main` at `a96e897` (contains `4f2e5e5` wave 4, `8983119` block 4 tail fix round with `targetPower`, the 21 scripts and the independent tests in `engine/test/independent/cards/w4/`). `npm ci`, no symlinked `node_modules`. No tracked file was changed; every temporary mutation was restored with `git checkout` (`git status` shows only untracked `w4rev-*` scratch files, which are not committed). Only this file is committed.

**Rule:** severity 4 = hidden-information leak or wrong game result; 3 = rules error that changes play, or blocking defect; 2 = notable; 1 = nit. Any 3 or 4 fails.

**Verdict: FAIL.** One severity 3 (the lethal solver's attacker-count gate refutes positions that `damage`, `winGame` or a Life move win at once, so "unclassified means search" is not true end to end). No severity 4: every two-position hidden-information probe was equal, 0 leak and 0 skeleton differences in 2,000 random games. 4 severity 2, 5 severity 1.

## Method

1. Read `engine/src` (`git diff 1b7b030..4f2e5e5`, plus `8983119`), `cards/src` (DSL, validator, `hidden.ts`, `hidden-gate.ts`), the lethal bound (`ai/src/search/lethal/bound.ts`, `lethal.ts`, `search.ts`), `m6b-wave4.md`, both readings docs, DISAGREEMENTS and API-GAPS, Q50 to Q57, DECISIONS (top two entries), `rules-digest.md` items 34, 122, 135 and `rulings.md` RL-22 / R3.
2. Compared each of the 21 scripts with the verified text in `cards/data/sets/*.json`, clause by clause (timing, cost and its colon, "up to", "If" and "Then", duration, filter, owner, counts, Once Per Turn). Names and types used as filters exist with exact spelling.
3. Hidden information: two-position probes (`engine/test/w4rev-leak.test.ts`, scratch). Positions differ only in hidden cards (the second Life card, the deck top, the hand filler, whether the hand holds a card the filter wants); a fixed policy plays the sequence; the other seat's `project` and `projectEvents` are compared at every step. Covered: OP15-116, EB03-054, EB03-055 (play), EB03-057 (K.O., opponent's Life), OP13-046 Vista (hand with and without a {Whitebeard Pirates} card, and an empty hand), EB03-054 and OP14-115 as the Life card taken by damage (Trigger offer against a vanilla Life card), EB03-055 [On K.O.] damage onto a Life card with a [Trigger]. The remaining 14 scripts read no hidden zone (their prompts are over the board and public DON!! counts) and `cards/test/hidden-gate.test.ts` passes with an empty allowlist.
4. Random games (`engine/test/w4rev-games.test.ts`, `w4rev-decks.ts`): Standard decks that force 3 copies of every one of the 21 cards that fits the Leader's colours and fill to 50 with random Standard cards; one game in four has OP15-001 on p1, one in four OP14-001, the rest random Leaders (the other 19 cards are not Leaders). Checks per game: invariants after every action, replay hash equal to the live hash, view and search-skeleton equality under permutation of the cards hidden from each viewer on every third state.
5. Pirate AI games (`ai/test/w4rev-pirate.test.ts`, `ai/test/support/match.ts`): 10 games per Leader deck, rotating random opponents.
6. AI lethal probes (`ai/test/w4rev-lethal.test.ts`): positions where `damage`, `winGame` and a Life move to the trash decide lethal.
7. Mutation: one clause of each script (21 first pass, 44 second pass with extra clauses for the multi-ability cards), one line of each wave 4 primitive (30), run against the author test and the independent test of the card, or against the whole wave 4 set for a primitive; restored each time.

Baseline (unmutated) over `engine/test/cards/m6b-w4`, `engine/test/independent/cards/w4`, `ai/test/m6b-w4-bound.test.ts`, the 21 author tests and `cards/test`: 312 files, 5,437 tests, all pass.

## Findings

### W4-R1 (3) The lethal solver refutes a position that `damage`, `winGame` or a Life move wins at once
- **Claim:** `docs/research/m6b-wave4.md` ("Hidden information and the AI") and DECISIONS: "every new action is unclassified there, so the solver searches". `ai/test/m6b-w4-bound.test.ts` pins this with 12 calls of `scanAbility` only.
- **What happens:** `lethal()` in `ai/src/search/lethal/lethal.ts` first asks `attackersPossible` (`attackReach` in `bound.ts`), which counts attacks (the seat's attackers, [Rush] cards in hand, and what `reachOf` finds: `setActive`, `play`, a granted [Rush]) against the Life to remove. It never reads `damage`, `winGame`, or an opponent's Life move, so it answers `refuted / any-hand / reason 'attackers'` with `nodes: 0`, before `refutedByBound` or the search is reached. `scanAbility` returning "unclassified" is therefore never consulted for these shapes.
- **Probe** (planted [Main] on an unscripted Event, 3 active DON!!, Leader 5000, opponent at 1 Life with 5 cards in hand; the engine itself ends the game when the Event is played):
  - `damage { player: 'opponent', n: 2 }`: engine result `{"winner":"p1","reason":"damage at 0 Life"}` after the play; `lethal` in `public` and in `actual` mode: `status refuted`, `certainty any-hand`, `defence.reason attackers`. `attackerPotential` is `null` and `refutedByBound` is false (so the unit tests' claim holds, and is beside the point).
  - `winGame`: engine `{"winner":"p1","reason":"card effect"}`; `lethal` refuted, `any-hand`, `attackers`.
  - `move lifeTop opponent -> trash` (exactly 1): the Event takes the last Life card, the one Leader attack then lands at 0 Life; `lethal` refuted, `any-hand`, `attackers`.
- **Consequence:** the Pirate and Warlord tiers skip a win they have in hand, and the review/explanation surface tells the player "no lethal exists against any hand", which is false and certain-sounding. Real scripted cards already in this shape: OP16-116 [Main] and EB03-053 [On Play] (the opponent's Life top to hand, pre-wave 4, same gate), EB03-057 [On K.O.] (wave 4). The 21 scripts of this batch do not win on the attacker's own Main with such an effect, which is why no random or Pirate game showed it.
- **Fix:** make `attackReach` (or `attackersPossible`) return "possible" whenever a reachable script holds an op that can end the game or take the opponent's Life without an attack (`damage` aimed at the opponent, `winGame`, a `move` from `lifeTop`, `trashLifeUntil`), the same conservative direction as `reachOf`. Add end-to-end tests through `lethal()` for each shape (`found` or at least not `refuted`), not only `scanAbility`. Correct the sentence in `m6b-wave4.md`.

### W4-R2 (2) EB03-008 and EB04-050: no test pins the {SWORD} filter against a card that is {Navy} but not {SWORD}
- Mutation `filter: { type: 'SWORD' }` to `{ type: 'Navy' }` survives the author and independent tests of both cards (0 failing in each of the four runs). Every test uses Hibari or the OP11 cards, which are both {Navy} and {SWORD}, so a Navy-only Character is never offered as a target in a test, and a {SWORD}-only card is never tried. The scripts are right ("{SWORD} type Leader or Character cards"); the tests would not notice a wrong type.
- Fix: one negative test per card with a {Navy} non-{SWORD} Character and a {SWORD} non-{Navy} Character on the board.

### W4-R3 (2) Chained swaps give both cards the larger value (M6b-Q51 consequence)
- Two OP14-017 Chambres on the same two opposing Characters (5000 and 8000): after the first, 8000 / 5000 as printed; after the second, **8000 / 8000** (observed). Each swap is "one more base-power setting" and the highest setting wins (CR 4-9-2-1 as digested), so the second swap cannot undo the first. The same arises for OP14-001 followed by a second swap effect on one of the pair in a turn. This is what Q51 says by design and it follows the digest's reading, so it is not filed higher; it is the one place where "swap" stops meaning exchange. The second swap should be at least in Q51's text, with a ruling asked for. Rare (needs two swaps on the same card in one turn: two copies of Chambres, or Chambres with an opponent's swap).

### W4-R4 (2) OP15-001 aura with no Characters on the field (flagged reading)
- Script: `exists characters you` plus `none` non-{East Blue}, so with an empty field the -2000 does not apply. The empty-field state is common for a Krieg Leader (early turns, after a wipe), so the reading decides real games. "If the only Characters on your field are {East Blue} type Characters" presupposes Characters in ordinary English, which supports the script; the vacuous reading is also defensible. I judge the script reasonable; no Q&A exists, the same open point as OP16-022 ("the only ..."). Add it to `OPEN-QUESTIONS.md` as its own row (it is currently only in the card's `rulings` string) and pin the empty-field case in a test (API-GAPS G3 says it is untested).

### W4-R5 (2) OP15-008 "that Character" (M6b-Q55): per-target is a defensible reading, not the only one
- Text: "give all of your opponent's Characters -1000 power during this turn for every DON!! card given to that Character". Built: each affected Character gets -1000 per DON!! given to **it**. Rival reading: "that Character" is the one Character the [On Play] gave DON!! to, so every opposing Character gets -1000 x that count. The two differ whenever more than one opposing Character holds DON!!. All tests use one opposing Character (API-GAPS G4), so the tests cannot tell them apart; the mutation `-1000` to `-500` on the amount was caught (author 2, independent 5). Nothing in `rulings.md`. Keep the reading, keep Q55 open, and add a two-Character test that states the chosen reading so a later ruling flips one line.

### W4-R6 (1) EB04-044 Koby: the replacement is not offered when Koby is chosen for the Character-area overflow trash
- With 5 Characters including Koby and a 6th played, choosing Koby for the rule trash trashes it with no offer (probe). "Would be removed from the field" read literally covers it; the rules process is not an effect and no official ruling applies. Acceptable (Q5 stays); mention in the card's `rulings`.

### W4-R7 (1) Readings judged acceptable, as asked
- **OP13-046 Vista, one use for both events (Q6):** a list is one ability and one Once Per Turn; the author test pins that a K.O. use leaves none for a later removal. One sentence, one "[Once Per Turn]" tag: the reading is right.
- **Offered with no matching hand card:** correct and required. Probe: hand `[{Whitebeard Pirates} card]` against `[vanilla]` against `[]`: the opponent's decision is `optional` in all three at the same step (`project` equal for the first two), only the owner's legal actions differ (accept missing). It is the `costIsSecret` convention (ADR 0005). In the empty-hand case the prompt is needless (the hand size is public) but harmless.
- **OP15-025 Kuro end-of-turn pick:** `delayed endOfThisTurn` reads "rested" and the DON!! count at the end of the turn, owner opponent (the text's "your opponent's next Refresh Phase" makes a card of yours pointless). Matches "Then, at the end of this turn, up to 1 rested Character ...". Accepted.
- **OP15-015 / 008 / 025 "Then":** the following clause is not conditional on the give (digest 122: a "then" that cannot resolve does not stop the next clause). Matches the script.
- **OP15-116 guard:** the whole Main is inside the Leader guard (digest 122, official OP15-116 Q&A cited in DECISIONS); with no Life the trash does nothing and the add and the hand trash still happen. Right. The public gate (the Leader's type) leaks nothing.
- **OP14-051 Q53:** last-known given DON!! is what CR 8-3-2-3 needs once the DON!! have returned; draws with 2 given, not with 1 or 0 (probe: hand 0 to 1, 0, 0).
- **EB03-055 "up to 2" as two yes/no:** same outcome set; the prompts differ, nothing hidden is asked. **Life cost before the If:** matches the printed colon (cost, then "If your Leader ..."). Accepted.
- **OP14-115 Then damage after a declined add:** digest 122, "when a then clause cannot be resolved the following clause still can". Probe at 1 Life: accept the add gives Life 2 then 1 (alive, Trigger asked); decline gives 0. Right.
- **OP14-001 / 017 with fewer than 2 eligible:** nothing selected, nothing swapped, the Once Per Turn use is spent. Activating with a short list is the player's choice; accepted.
- **EB04-044 "cause any including battle" (Q5):** accepted; `leaveField` covers K.O. and removal (a battle K.O. replaced, an own effect replaced). The independent tests do not assert the battle case (mutation `any` to `opponentEffect` survives the independent test, killed by the author test).
- **EB03-008 / EB04-050 grant on a just-played card:** allowed; for a card without [Rush] it changes nothing (RL-17), for a [Rush] Character it works. Right.
- **Q50 `winGame` precedence:** the effect's win is final at once. No scripted card in the 21 uses it; OP09-118's condition is "Life 0 on either side", so a simultaneous defeat is not constructible from a card's own effect. Fine.

### W4-R8 (1) Wave 4 engine review (no defect found)
Each primitive read against the digest and the cards it serves:
- **G30 Life to trash:** a Life move, not damage; no [Trigger]; the card goes face up (public by rule); `lifeRemoved` fires through `moveCard`. `owner: 'any'` asks nobody and takes the top card of each player that has one. The cost `trashLife` is counted in `payable`. Two-position probes equal.
- **G31 look / `topAnyOrder`:** the author's two-position tests pass (equal for the other seat, different for the looker as the control); the look at the opponent's deck marks `known` for the looker only; the validator refuses every shape that takes or moves cards.
- **G32:** a modifier read in `checkAttack` only; RL-17, rested targets and the Leader unchanged.
- **G33:** reads base power through the layers before either modifier is added, `b` is never `a`; the chained case is W4-R3.
- **G34:** per-target amounts are read once per target on the effect's turn (`c.target`); opposing given DON!! add no power on your turn (derive). `donGivenToTarget` is bounded at 10.
- **G36 `damage`:** the battle damage frame without banish; each point is a separate decision, 0 Life defeats (RL-22, EB03-055 Q&A, rulings R3 per-point). D4 replacements share the frame.
- **G37 / G38:** the `rest` frame is built only for a card with a matching replacement and only for an effect whose source is a Character of the other player; `koed` owner uses `p !== owner`.
- **D6:** a modifier on the controller's Leader with the ability as `mod-<id>`; expires with the turn; falls back to the Leader when the source card has left (instance ids change on a zone move). No Once Per Turn can be expressed on a created replacement (not needed by any card).
- **`[DON!! xN] [On K.O.]`:** `ev.don` is captured before `leaveField`, only for a card with such a condition.
- **G14 (b) list:** `considered` is keyed per ability, so a K.O. that matches both entries is offered once; one Once Per Turn.
- **`play from self`:** grep over all scripts (`w4rev-selfplay.ts`): 4 non-[Trigger] abilities play `from: 'self'` (OP14-120, OP16-014, OP17-015, ST30-008, all `onKO`), the card is in the trash then, so the new check holds; the other 31 plays are [Trigger]s (`resolving`). No existing behaviour changed wrongly.
- **`targetPower` (8983119):** read once per target through `dvOf`, floored at 0, lethal bound 20,000. Mutation to `basePower` is caught (2 failing).

### W4-R9 (1) Mutation survivors (the full list)
- **Primitives:** 30 one-line mutations, 30 caught (1 to 22 failing tests each; fewest: G34 per-target cost 1, G37 "source is a Character" 1, D6 duration 1, G30 `owner: 'any'` both players 1). Survivors: none. Mutated: G30 move target, cost order, `payable`; G31 `stay` mark and `topAnyOrder`; G32 `checkAttack`; G33 value and `b` not `a`; G34 filter, per-target cost, per-target power, `donGivenToTarget`, `refStat donGiven`; G35 winner; G36 amount and player; G37 offer and source category; G38 owner; D6 read of `state.mods` and duration; G14 (b) any-entry; `ev.don` read and capture; `play from self` zone check and the Trigger zone; `targetPower`; the held rest; Life `any`.
- **Scripts:** 21 first-pass and 44 second-pass mutations. Caught by both suites unless listed. Survivors:
  - EB03-008 and EB04-050 `type: 'SWORD'` to `'Navy'`: survive both suites (W4-R2).
  - OP15-116 hand trash `exactly: 1` to `upTo: 1` (the player could decline the mandatory trash): survives both suites (the tests always answer the pick).
  - OP15-038 `amount: 4000` to `3000` and `cost: { lte: 8 }` to `9`: survive the author test, caught by the independent test (3 and 1 failing).
  - OP13-046 removal entry `cause: 'opponentEffect'` to `'any'` and EB04-044 `cause: 'any'` to `'opponentEffect'`: caught by the author tests (1 each), survive the independent tests (API-GAPS G1 and the Q5 avoidance).
  - Equivalent or inert (not defects): OP15-008 `playedThisTurn: false` (the filter ignores its value; removing the clause is caught, 2 failing), OP15-025 a stray key, OP13-046 `typeIncludes 'Whitebeard'` for `'Whitebeard Pirates'` (no other type contains "Whitebeard").
  - The first-pass OP15-008 mutation hit the label string, not the effect; redone as `-500` on the amount and caught (author 2, independent 5).

### W4-R10 (1) Doc nits
- `m6b-wave4.md` says wave 4 "lethal bound ... the solver searches" (see W4-R1) and counts 91 or 92 planted tests; the directory now has 9 files (the ninth, `b4t-targetpower.test.ts`, is the fix round's).
- `wave4-scripting-a.md` lists OP15-001's empty-field reading only in the script's `rulings`; Q-list does not have it (W4-R4).

## Numbers

- Scripts compared: 21; clause mismatches against the text: 0; readings that need a ruling or a pinned test: W4-R3 to R5 (Q51, empty field, Q55); the rest of the flagged readings are accepted in W4-R7.
- Findings: severity 4: 0; severity 3: 1 (W4-R1); severity 2: 4 (R2 to R5); severity 1: 5 (R6 to R10).
- Random games: 2,000 games, 352,098 actions, 0 invariant failures, 0 replay differences, 0 capped; 1,714 ended by damage at 0 Life and 286 by deck-out; 237,404 view-and-skeleton permutation checks (every third state, both viewers), 0 differences. In those games the 21 cards produced, among others: OP13-046 ReplacementApplied 12, EB03-055 effects 422 (declined 169), EB03-054 595 plays (declined costs 260), OP14-009 1,699 activations (1,215 declined), OP15-001 Leader rests/aura 4,067 activations, OP14-001 swaps 4,182 activations. Event-counts are by card in `w4rev-games.txt`, not in the repo.
- Pirate AI games: 20 played (10 each with OP15-001 and OP14-001 as p1, random opponents), 0 errors, 0 fallbacks, 0 capped; OP15-001 won 3 of 10, OP14-001 won 3 of 10 (not a strength gate).
- Targeted two-position probes: 11 position pairs (OP15-116, EB03-054, EB03-055 play, EB03-057 Life trash, Vista with three hands, EB03-054 and OP14-115 as the damaged Life card, EB03-055 K.O. damage); leaks in 0. Hidden-gate check passes.
- AI lethal probes: 3 shapes (`damage`, `winGame`, Life to trash), 3 wrongly refuted with `reason 'attackers'` (W4-R1); `refutedByBound` false in all 3.
- Mutations: primitives 30 of 30 caught; scripts 65 mutations: 56 caught by the author test, 56 by the independent test; survivors in both suites: 7, of which 3 real (EB03-008, EB04-050, OP15-116), 3 equivalent or inert, and 1 first-pass mutation that hit a label string (redone and caught).
- Baseline of the reviewed set: 312 files, 5,437 tests, all pass.
