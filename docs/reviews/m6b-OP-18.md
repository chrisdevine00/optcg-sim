# M6b review: OP-18 slice (16 cards for the Franky and Luffy decks) and engine wave G1-G2

**Reviewer:** independent adversarial review (subagent). Brief: find what is wrong; no stake in the scripts.
**Build reviewed:** worktree branch `claude/zealous-montalcini-101d31` at `fe668ffc` (slice scripts, G1/G2, blind tests, Limitless import `e18367bb`). No repository code was changed; scratch probe tests and a scratch property test (all deleted) lived under `engine/test/`, logs under `/private/tmp/claude-502/`. Source mutation checks were not run (editing tracked scripts was blocked), so test gaps below are by reading and by probe.

**Rule:** severity 4 = hidden-information leak, crash or wrong game result; 3 = wrong card behaviour in a plausible game; 2 = minor/edge or test gap; 1 = nit. Any 3 or 4 fails.

**Verdict: PASS.** No severity 3 or 4. Two severity 2 findings (the counter UI cannot show a Stage's Counter value; one test gap) plus one severity 2 ruling question, and four severity 1. All 16 scripts match their verified text clause by clause. No leak, skeleton, foreign-decision or invariant failure in 920 random games with the slice's decks.

## Method

1. Dumped the 16 scripts beside `cards/data/sets/OP-18.json` and compared each clause: targets and owners, "up to", cost and power boundaries, type and name filters, durations, Once Per Turn, `[Opponent's Turn]`, colon-less "If", cost versus effect, optionality, trigger and counter timing. Read `docs/research/OP-18-scripting.md`, `m6b-audit/OP-18.md`, `rulings.md` (cannot be rested, line 321), DECISIONS (M4a-10a group replacement), OPEN-QUESTIONS M6b-Q94.
2. Ran `engine/test/cards/OP18-*`, `engine/test/independent/cards/op18`, `engine/test/cards/m6b-op18` (33 files, 282 tests pass) and `cards/test` (23 files, 5,898 pass).
3. Probe tests (deleted) for: Franky OP18-034 offering Events, OP18-074 [Trigger] with no DON!!, Sunny with no valid target, Robin and Sanji together, one effect K.O.ing several Characters, Robin against an opponent's [Trigger] on your own turn.
4. Scratch property test: p1 and p2 each play the Franky list (OP18-021, 3 copies of 15 slice cards) or a Luffy EB02-010 list (4 copies of 118/027/031/026/034/038/075-078, 3 of 074), start from a scenario like `leakGame`, random legal play with `checkInvariants` on every action. Every 4th state, for both viewers: `project` and `projectForSearch(...).skeleton` equal under permutation of hidden cards, and `checkForeignDecision` clean. Seeds `7919 * k`, k = 1..800 (800 games, 132,641 actions, none capped) plus a first run of 120. Failures: none. 1,888 Stage cards were trashed as Counters in those games, so G1 was exercised heavily.
5. Read the G1 and G2 diff, then every consumer of a Counter value in `engine/src`, `ai/src`, `app/src`.

## Findings

### OP18-R1 (2) The app cannot show a Stage's Counter value; defence numbers undercount it
- **Where:** the app reads the printed `Card.counter` (null for a Stage) instead of the view's per-card `counter` (`ViewCard.counter`, `engine/src/api.ts:192`, filled by `extras()` through `counterOf`): `app/src/play/rail/Decision.tsx:1213` (`total`), `:1439` (`worth`), `:1511` (button label), `app/src/play/game/Game.tsx:407` (staged chip), `:966` (spoken "worth"), `app/src/play/board/BoardCard.tsx:215` (the `+N` plate on a hand card). Only `Dock.tsx:135` uses the view value.
- **Effect:** with OP18-021 in play a Stage in hand is a legal Counter (engine and legal actions are right), but its button reads "Thousand Sunny +—", the staged chip "+— ✓", the plate is absent, the spoken announcement says "worth 0", and `defenceNumbers().total` ignores it. The engine's own simulation still resolves the battle correctly (`sim.damage`), so only the text is wrong. The same defect already existed for OP17-063/OP17-118 Characters; G1 makes it visible on a whole new card class and the Franky deck is the intended use.
- **Fix:** read `g.cardOf(h).view.counter` (add it to `cardOf`) in those six places, falling back to the printed value.

### OP18-R2 (2) No test covers the `[Opponent's Turn]` gate of OP18-031 Nico Robin on its own
- **Evidence:** the author tests only use the opponent's turn. The independent test (`OP18-031.test.ts:124`) covers p1's own effect on p1's turn, which `cause: 'opponentEffect'` already excludes, so the `conditions: [{ opponentsTurn: true }]` clause is not pinned by any test. Probe (deleted): p1 attacks, p2's Life card has a [Trigger] "K.O. up to 1 of your opponent's Characters" (an opponent's effect on p1's turn); the script correctly offers nothing. So behaviour is right, but removing the clause would pass every test.
- **Fix:** add that case (Life [Trigger] K.O. on the owner's turn, no offer) to the author tests. The same reading would also cover [Your Turn]-only text on Sanji (none; Sanji has no turn clause).

### OP18-R3 (2) One accepted replacement saves a whole group of removals (Sanji, Robin); ruling question
- **Probe:** Sanji present, an opponent effect K.O.s two {Straw Hat Crew} Characters at once; one "trash this Character instead" accepted: Sanji is trashed and both survive (D). Robin plus two others K.O.ed by one effect: one "rest this Character instead" accepted: all three survive, Robin rested (B). Declining: all three go.
- **Cause:** deliberate engine rule M4a-10a (DECISIONS: one removal event, one replacement offer, from QA-OP15 OP15-069 "one DON!! return keeps both"). That ruling is about a payment that covers a group; for "trash this Character instead" (a card that can be used only once) saving several Characters for one Sanji is a stretch. Severity 2 because it needs a multi-target removal and the engine behaviour is documented and ruled on a similar card.
- **Fix:** add the question to OPEN-QUESTIONS next to M6b-Q94 (does a "this Character" replacement cover one removal or the batch?); no script change unless a Q&A says per-Character.

### OP18-R4 (1) Rookie and the AI helpers read the printed Counter, so a Stage counts as 0
- `ai/src/session.ts:191`, `ai/src/choose.ts:14` and `ai/src/search/hint-line.ts:933` build `counterOf` from `Card.counter`. In Rookie's "counter a lethal attack" branch (`ai/src/rookie.ts:91`) a +3000 Stage ranks below a +1000 Character. The search AIs and the review (`counter-wasted.ts:386`, `pirate.ts:1185`, `heuristic.ts:141`) use the view value and are right; `counterOnlyPower` returns true for a Stage, as wanted. No wrong result, only a weaker Rookie pick. **Fix:** same as R1, pass the view counter.

### OP18-R5 (1) Activations with no legal target are offered (OP18-075, same for any "up to 1" activate)
- Probe: Thousand Sunny with only a rested {The Franky Family} Character (no {Straw Hat Crew}) still offers the activation; paying DON!! -2 and resting the Stage does nothing. This is the engine's general rule (a cost is never refused for lack of an effect target), as `OP18-021` "up to 1, still pays". Not a defect.

### OP18-R6 (1) Open ruling M6b-Q94 carries all of OP18-021
- The G1 reading (a Stage with an effect-given Counter is trashed in the Counter Step) is the only reading under which the card's first line does anything, and it is consistent with CR 2-10-4. No Q&A was read. Keep the entry open until the OP-18 Q&A is published; if Bandai says no, OP18-021's first ability and G1 both come out (one `counterCard` line, one `counterOf` clause).

### OP18-R7 (1) OP18-098 (outside the slice) has `keywords: []` while its text is a bare "[Unblockable]"
- The audit notes bare keyword lines need an override carrying `keywords`; `cards/overrides/` has none for OP18-098 (nor -104, -106, -111, -112). The engine reads script keywords, so it will matter when those cards are scripted; they are not in this slice. Note for the next slice.

## Script versus card text: result

16 of 16 compared; no mismatch in a cost, number, filter, duration, once-per-turn, owner, zone or timing keyword. The points most likely to be wrong, checked and right:

- **OP18-021:** counter value 3000 for the owner's hand Stages only (opponent's and field Stages excluded; tested both sides); play filter Stage and cost <= 5, `upTo 1`, still pays DON!! -1 with an empty pick; OPT. G1 does not change any existing Counter-giving script (OP16-118, OP17-063, OP17-118 all filter `category Character` or `self`), so no earlier card gains a Stage Counter. `counterOf` computes the value before the card leaves the hand (`actions.ts:648`).
- **OP18-026/031:** Sanji covers {Straw Hat Crew} including himself with no turn clause; Robin covers any Character, `[Opponent's Turn]` condition, a rested Robin cannot pay. Both need `cause: opponentEffect` (own effects not covered, tested by both authors). Official-text point: neither has "other than this Character" and both were scripted self-inclusive, consistent.
- **OP18-027:** base-power clause: Leader name [Monkey.D.Luffy], active, 3 or more DON!! given, opponent's turn only (given DON!! add power only on the owner's turn, so 7000 not 10000; tested). [On Play] "Then" is independent of the DON!! count; cost <= 6 inclusive, restriction is the full `cannotBeRested` (cannot attack or block, rules.md 321).
- **OP18-034:** the Stage check after the play (a cost 5 Stage just played counts); a Character costing 6 is not playable; Events never offered (probe P1: only the {Straw Hat Crew} Character candidate); rest target cost <= 6.
- **OP18-038/061:** [Sogeking] is an exact name (OP03-122 and EB02-024; "Zoro & Sogeking" does not qualify); Iceburg is one take of `upTo 2` over Stage or {Water Seven}; the rest to the bottom in any order.
- **OP18-066/072:** G2 `ko` cost names your own Stage with `pick exactly 1`; runtime `costText` says "Stages"; 072 has OPT and the colon-less "If this Character was played on this turn" as an effect condition (the cost and OPT are spent on later turns: a reading, no wrong result, as OP17-R4).
- **OP18-070/074:** Tom's cost `donMinus 1` plus `trash 1` from hand, optional by construction; 074's [Counter] reads the Stage condition when it resolves, +4000 for the battle; its [Trigger] cost `donMinus 1` is not offered with no DON!! on the field (probe P2: only decline is legal).
- **OP18-075..078:** each [On Play] is `draw 1` then `addDon rested upTo` (a count is asked, run.ts 1873); 075 DON!! -2 and rest, current power <= 7000 (a 6000 Character with 2 DON!! is not offered); 076 Leader power read when the effect resolves (the opponent's turn, so given DON!! do not count), Characters unrestricted, `upTo 2`; 077 grants `Rush: Character`; 078 `each`, `upTo 4`, one rested DON!! apiece.
- **OP18-118:** setActive up to 3, then the restriction with no cost limit; [End of Your Turn] {Water Seven} Leader, Character or Stage.

## G1 and G2: side effects checked

| Consumer | Result |
| --- | --- |
| `engine/src/actions.ts` `check`/`legalActions` | Both use `counterCard`; an Event, Leader or a Stage with no Counter is still refused ("no Counter value"). Targets are your Leader or Characters as before. |
| Hidden information | `viewCard` gives `counter` only for cards the viewer can see (`hiddenCard` carries none); a Stage in the opponent's hand shows no Counter. Legal actions are the viewer's own. Permutation of hidden cards leaves `project`, `projectForSearch(...).skeleton` and `checkForeignDecision` identical in 920 games, 1,888 Stage counters. The Counter-step skip is unchanged (observed seats never skip on a non-empty hand, `game.ts:139`). No leak. |
| Search AIs, `counter-wasted`, defence-line, hint-line | Use the live view counter or `legalActions`; Stage counters work. `counterOnlyPower` treats a Stage like a Character (free, power only). |
| Rookie, session `counterOf` | Printed value: R4. |
| App | R1. |
| `hasCounter` deck and effect filters | Still the printed value (`deck.ts:79`, `eval.ts:191`), correct ("Counter" cards in a search are printed). |
| G2 validator | `ko` cost accepts `characters` or `stage`, owner `you` only, pick required; an opponent's Stage or a missing pick is rejected (tested). `costText` handles array `from`. |
| ENGINE_VERSION | No bump argued: no recorded game contains a Stage Counter or a Stage K.O. cost. Agreed. |

## Data import (e18367bb), light review

- `mergeLimitless`: a card with a set or starter row in optcgapi always wins; promo rows do not count; the difference report runs against the Limitless page. Sound.
- `limitlessSetIds` (`/cards/OP18-ddd\b`) cannot match alternate-art ids (`_p1`), and unlisted ids throw. `limitlessRow` throws on an unknown rarity rather than guessing. [Trigger] splitting takes the last "\n[Trigger]" block; no OP-18 card has "[Trigger]" inside its effect text (checked all 119); 7 text-less cards come out as `''`, not as a stray section.
- Risk to keep in mind, not a defect: the first optcgapi OP-18 row silently replaces each card's Limitless text; the textHash on each script (and `verified: true` overrides) is what will flag a difference, so run the per-card tests after the first optcgapi refresh.

## Blind independent tests

No disagreements were filed, and the author and independent suites do agree on every point probed above. They are strong on boundaries (cost 5 and 6, power 7000 and 8000, DON!! given 2 and 3). The weak spots are R2 (the turn gate) and anything about several simultaneous removals (R3). No test pins the Sanji or Robin behaviour for a group.

## Recommendations (in order)

1. R1: pass the view's `counter` to the app (six read sites); add a component test with OP18-021 and a Stage in hand.
2. R2: one author test for the Robin turn gate.
3. R3 and R6: two OPEN-QUESTIONS lines; no code.
4. R4, R7: with the next slice.

## Fix round (2026-11-27)

The verdict was PASS, so no severity 3 or 4 needed fixing; the severity 2 findings were fixed anyway, once (runbook step g).

- **R1 fixed.** The app now reads the engine's current Counter: `cardOf` in `app/src/play/game/Game.tsx` returns `counter` (the view's value, else the printed one), and every Counter read site uses it (`Game.tsx` staged chip and `worth`, `rail/Decision.tsx` total, worth, staged list and announcement, the hand list, `board/BoardCard.tsx` hand plate). A Stage in hand under OP18-021 now shows +3000. No component test was added (the read sites are covered by typecheck and the e2e game flows); recorded here as the one recommendation not taken.
- **R2 fixed.** `engine/test/cards/OP18-031.test.ts` "must not apply on your own turn, even to the opponent's effect": p2's Life [Trigger] K.O.s p1's Character on p1's turn and no replacement is offered. With the `opponentsTurn` condition removed from the script the test fails (checked).
- **R3, R6:** OPEN-QUESTIONS M6b-Q95 (one replacement saves a group) and M6b-Q94 (the G1 reading). Also M6b-Q96 (OP18-071's "{Sugar}"), from the rest-of-set scripting.
- **R4, R5, R7:** carried. R4 (Rookie's printed Counter) goes to `docs/BACKLOG.md` with Track C; R7's cards are scripted in the rest-of-set batch.
