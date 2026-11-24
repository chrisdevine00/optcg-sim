# M6b review: ST block 5 starters and legal exceptions (scripting batch 4, 40 scripts)

**Reviewer:** independent adversarial review (subagent). Brief: find what is wrong; no stake in the scripts.
**Build reviewed:** worktree branch merged with the lead's local `main` (`git fetch` + merge; `engine/test/independent/cards/st-b5/` present), `npm ci`. No repository code changed: the temporary edits for the random-game, probe and mutation runs were removed or restored (`git status` clean before this file).

**Rule:** severity 4 = hidden-information leak or wrong game result; 3 = rules error that changes play, or blocking defect; 2 = notable defect; 1 = nit. Any 3 or 4 fails.

**Verdict: FAIL.** One severity 3 (STB5-R1, ST30-014 Mr.3 `giveDon each`: legal plays are unreachable, and with 1 rested DON!! nothing can be given at all). No severity 4. Two severity 2, four severity 1. No hidden-information leak and no wrong result was found in the other 39 scripts. The independent author is right on disagreement A.

## Method

1. Dumped each of the 40 scripts (abilities, keywords, rules, rulings) beside the verified card text (`cards/data/sets`) and compared clause by clause: costs, conditions, "up to" vs exact, "you may", "Then" vs "If you do", durations, once per turn, owner/zone/filter, names used as filters (`Portgas.D.Ace`, `Monkey.D.Luffy`, `Monkey.D.Garp` against the data), timing.
2. Read CLAUDE.md, runbook step f, the three previous reviews, the two readings files, both DISAGREEMENTS and API-GAPS files, rulings, rules-digest (15, 47, 57, 122), `m6b-runtime-audit.md` §7, OPEN-QUESTIONS, DECISIONS (2026-11-24 E-Q11 revisit; wave 2 "giveDon each"; the deck-bottom order entry), `m6b-wave2.md`; read `giveDon`, `donReturned`, restriction and `layers.ts` code in `engine/src/effects`.
3. Probed ST30-014 with 1, 2 and 3 rested DON!! (temporary test, removed).
4. Random games, AI games, mutation checks (below). `npx vitest run` of the 40 author tests + 40 independent tests plus the other 7 files in those folders: 87 files, 669 passed, 2 expected fail (the two ST30-014 `it.fails`).

All 40 scripts exist, all 40 have an author test and an independent test.

## Findings

### STB5-R1 (3) ST30-014 Mr.3: `giveDon each` caps the targets by `floor(DON / M)`, so legal "up to 2 ... each" plays cannot be made
- **Card:** "[Activate: Main] You may rest this Character: Give up to 2 of your Characters with 6000 base power up to 2 rested DON!! cards each."
- **Evidence:** `engine/src/effects/run.ts` `giveDon`, `each` branch: `fits = floor(rested / per)` and the target pick becomes `upTo: min(fits, cap)`. Probe with Mr.3 plus two 6000-power Characters:
  - 1 rested DON!!: the only legal actions after activating are `done` and `concede`. **Nothing can be given**, though giving 1 DON!! to one Character is plainly legal ("up to 2 each" allows 1).
  - 2 rested DON!!: one Character may be chosen (max 1); giving 1 to each of two is unreachable.
  - 3 rested DON!!: one Character (2 DON!!) only; the third DON!! stays rested. 2 + 1 is unreachable and strictly better (+3000 total power instead of +2000).
- **Why this is a rules error, not the E-Q11 "more is never worse" case:** wave 2's rationale (DECISIONS wave 2 item 7, `m6b-wave2.md`: "never worse to give more; it would multiply the decisions") covers the count asked per target. It does not cover removing targets: the cap gives *fewer* DON!! than the text allows in the 1-, 2- and 3-DON!! cases (CR 1-3-5, 4-8-1, 8-4-4-1; rules-digest 15). Mr.3 is a rest-this-Character cost, so it is normally used with whatever few rested DON!! the turn left. The planted wave-2 test and the author test pin the 3-DON!! one-target result as spec.
- **Fix (engine, `giveDon` `each`):** see "Disagreement A" below. The independent `it.fails` tests are right.

### STB5-R2 (2) OP01-120 Shanks: the Blocker filter is a snapshot at [When Attacking] resolution, in both directions
- **Card:** "[When Attacking] Your opponent cannot activate a [Blocker] Character that has 2000 or less power during this battle."
- **Evidence:** the script is a timed `restrict` with a `characters` selector filtered on `keyword: Blocker` and `power lte 2000`; a timed restriction stores the matching instance ids when it resolves (`layers.ts` `RESTRICT_KIND`, `cannotBlock` modifier). Two wrong results, both needing a power or keyword change between [When Attacking] and the Block Step: (a) the defender's own `[On Your Opponent's Attack]` effect (resolved after the attacker's [When Attacking] in the same window) pumps a 2000-power Blocker to 3000 or more: the sim still bars it, the text does not; (b) a Character that gains [Blocker] or drops to 2000 or less after resolution may still block.
- **Not 3 because:** no ruling exists (M6b-Q12 open), the script documents the approximation, and the audit's proposed reading ("at block time, current power") is not what shipped; the author notes "nothing in the pool changes power between ... on its own", which is true only for unscripted pairs. Cards of the defender's [On Your Opponent's Attack] family do exist in the pool.
- **Fix:** a live (non-snapshot) selector for `cannotBlock` (the Block Step check re-reads the filter against the blocker), or keep and record the open question.

### STB5-R3 (2) Author and independent tests do not pin the "in any order" owner choice (ST30-002, ST30-017)
- **Mutation:** `rest: 'bottomAnyOrder'` changed to `'bottom'` in ST30-002 and in ST30-017 survives **both** the author tests and the independent tests (0 failures each). The tests call `orderAll(g)`, which answers an `order` decision only if one is pending, so nothing asserts the decision appears. The same clause is in the card text ("in any order") and in every earlier look-at-N batch.
- **Fix:** assert an `order` decision is pending (2 or more cards go to the bottom) in one test per card; make `orderAll` fail-if-absent in a strict variant.

### STB5-R4 (1) ST30-014 no count is asked per target (E-Q11 on `each`)
- With the target cap fixed (R1), the count per target (0, 1 or 2) is still never asked: each chosen target gets exactly M. Like the old `addDon` case this is "more is never worse" for rested DON!! (given DON!! stay on the field, so DON!! counts used by comparison cards do not change; a rested DON!! given away is back in the cost area after Refresh anyway). I could not construct a counter-example in the pool, so severity 1. Needed only for the 2 + 1 split when DON!! is short, which the R1 fix covers by itself.

### STB5-R5 (1) Script `rulings` cite the audit's B5-Q numbers, which collide with the M6b-Q numbering
- OP01-120 says "M6b-Q9" (the audit's B5-Q9; OPEN-QUESTIONS M6b-Q9 is OP16-034, Shanks is M6b-Q12); OP04-083 says "M6b-Q15" (OP17-099; Sabo is M6b-Q18); OP02-013 "M6b-Q10" (OP16-080; the Then-after-If answer is M4b-5 / M6b-Q13). The g2 readings file says "Q15", "Q10", "Q9" without the prefix. Misleading for the next reader. Also the OP03-122 script ruling says the returned Character "may be Sogeking itself": Sogeking costs 7, so it is never eligible at cost 6 or less (the readings file says so correctly).

### STB5-R6 (1) OP03-122 "treat this card's name as [Usopp]": scripted (`rules: [{ alsoNamed: ['Usopp'] }]`) but not independently tested
- The script is right (same shape as EB04-038). Removing it is caught by the author test (1 failure) and not by the independent tests (0), as API-GAPS-a says. The clause is also missing from the readings file. No script fault.

### STB5-R7 (1) ST32-002 Oden: a Character already unable to be rested is offered as a target
- "cannot be rested" on a second use targets the same Character again (harmless, idempotent). Not a fault; recorded only because the brief asked. Same for ST32-002 as a rest-effect target: legal to choose, resolves to nothing.

## Script versus card text: result

40 of 40 compared. Besides the above, no mismatch in costs, conditions, "up to" vs exact, "you may", "Then", durations, once-per-turn, filters, owner or timing. Points checked and found right (the likeliest to be wrong):
- **EB04-061:** `life <= 1` in hand (0 counts); both On Play halves follow the paid cost; `untilEndOfOpponentsNextTurn` for the Leader +2000 and the Blocker (as OP17-005).
- **OP02-013:** "Then, if" is its own condition (Rush with no target chosen); `typeIncludes` on the Leader. **OP04-083:** `cannotBeKOd` cause `effect` (covers your own effects too), until `untilStartOfYourNextTurn` (ends at 6-2-1, covers the opponent's whole turn, RL-10).
- **ST30-003:** includes Edward himself, `basePower`, Leader excluded. **ST30-004:** reveal, then draw 3, then trash 2 of the new hand. **ST30-006/008:** cost filter "Character with 6000 power" (printed power in hand). **ST30-007:** rest-DON!! cost, Rush this turn, -1000 on up to 1 opposing Character only.
- **ST30-009/011:** replacement scope is any of your Characters with 6000 base power, cause `opponentEffect` (K.O., bounce, trash, deck by an opponent's effect; a battle K.O. is not replaced), the replacing card (2000 and 1000 base) never covers itself. ST30-009's "trash this Character and draw 1" is in `instead` (an effect payload): the player may decline the whole thing; Oars is trashed, not K.O.'d, so no [On K.O.]. ST30-011's "rest this Character" is `restSelf`, so a rested Buggy offers nothing. Right.
- **ST30-015:** the Counter's leading "If" has a comma and no colon, so it is read at resolution; the Counter is playable and does nothing with fewer than 2 (consistent with EB05-008 and the "activate then nothing happens" Q&A family). The Trigger reads current power. **ST30-016:** "Then, if" is independent of the +3000; both names are exact filters and base power 6000 each. **ST30-017:** Trigger activates the [Main].
- **ST31-002:** draw then play, the drawn card is a candidate; no category filter (an Event can't be played). **ST31-003:** `donGiven you` counts the Leader's DON!! and every Character's (`eval.ts` `givenDon`); `opponentsTurn` condition.
- **ST32-001:** `oneOf` cost (Slash Leader that is active, or 1 DON!!). **ST32-004:** permanent in the field with a Leader attribute condition; On Play is not conditional. **ST32-005:** printed Rush: Character; the `if` is the Leader attribute.
- **ST33-002:** hand check after the cost (the count is the opponent's); the opponent chooses their trash. **ST33-003:** both cards to the owner's deck bottom; one owner and several cards means the owner is asked the order (DECISIONS 2026-11-24 deck-bottom entry; rules-digest 47: the owner orders, hidden from the other player). **ST33-005:** `conditions` on the auto, equivalent to a leading `if` with no cost; "other than [Monkey.D.Garp]" is a name `not`.
- **ST34-001:** the Once Per Turn and the Leader type are ability conditions, so the use is spent only when they hold; a count is asked (2, 1, None) and capped by the DON!! deck, which holds the returned card. **ST34-002:** both steps inside the "If" (M4b-5; the K.O. does not need the DON!! to have been added). **ST34-005:** `donMinus` cost, optional as a reminder cost (E-Q12).
- **ST35-003:** `mill: 2` cost, with the RL-26 deck-out result pinned. **ST35-004/005:** the +1/+3 cost and Blocker are field-only permanents (no zone marker, so not in hand); "Then, play" is not "If you do"; the give is a choose with min 0, hand or trash.
- **ST36-001/004:** costs and `deckTop upTo 1` (an `optional` yes/no). **ST36-002:** the On Play carries `yourTurn`, so a copy played by its Trigger on the opponent's turn adds no Life; the Trigger's "If ..., play this card" is an effect condition read after the Life card has been taken. **ST36-003:** the draw is unconditional; the base power applies to a Supernovas Leader only.
- Data: ST32-001 and ST32-004's `<Slash>` was restored (data commit 8b2351b); every card name used as a filter matches `cards/data`.

## Readings flagged in the scripting docs: judgments

| Reading | Judgment |
| --- | --- |
| ST30-009/011 replacement scope and "trash this Character and draw 1" | Right (see above). The draw as part of the replacement payload is the only encoding the DSL allows; a cost list can't carry the draw. |
| ST34-001 once per turn and DON!! deck cap | Right. The Once Per Turn is not spent when the Leader type fails (intervening if); "None" still spends it. Cap by the DON!! deck is checked (options 2, 1, None). The opponent-turn exclusion is tested only in the independent file (Counter DON!! -1). |
| ST34-002 "Then" | Right, with the OP16 / M4b-5 precedent. A reader who takes "Then" as outside the "If" gets the K.O. without the Leader type; the official Q&A on file says no. |
| ST30-015 [Counter] condition at resolution | Right. |
| ST30-016 | Right. |
| ST31-002 | Right. |
| OP01-120 power read time (M6b-Q12) | **Approximation with wrong results in both directions: STB5-R2 (2).** |
| OP04-083 Sabo duration and late arrivals | Duration right (RL-10). Late arrivals: the conservative "on the field when it resolves" reading is the common rule for timed effects on "your Characters"; it is open (M6b-Q18) and pinned by a test. No finding. |
| OP02-013 "Then, if" | Right (own condition; Rush even with 0 targets). |
| OP03-122 | Right, including `alsoNamed`. Cost 6 or less excludes Sogeking (cost 7). |
| ST36-002 Killer | Right. |
| ST35-004/005 field-only cost bonus | Right. |
| ST33-003 order | Right (owner orders; public cards, so no leak; the leak and skeleton properties pass). |
| EB04-061 duration | Right. |
| ST32-002 "cannot be rested" target | STB5-R7 (1): offered but harmless. |
| ST33-002 hand count | Right. |

## Disagreement rulings

### A. ST30-014 Mr.3: **independent author is right on both points; wave 2 was half right**

Wave 2 (DECISIONS, `m6b-wave2.md` item 7): "`giveDon each` with an `upTo` pick: every chosen target gets the full M; the DON!! on hand cap the number of targets (`floor(DON / M)`), so 'up to M each' gives M. Rejected: asking per target how many (never worse to give more)."

- **(a) No count per target.** CR 8-4-4-1 and rules-digest 15 allow 0 to N. The E-Q11 revisit (2026-11-24) overturned "more is never worse" for `addDon` because DON!! counts are compared; that reason does not apply to giving rested DON!! (they stay on the field, so DON!! on-field totals do not change), and no counter-example exists in the pool. So the missing count is a deviation of severity 1 by itself (STB5-R4); it is not the defect.
- **(b) Target cap.** The cap `floor(DON / M)` removes legal plays: 1 rested DON!! gives nothing, 3 rested gives 2 to one Character instead of 2 + 1. This is a rules error (STB5-R1, severity 3) and the argument "never worse to give more" does not defend it. Probed: 1 rested DON!!: only `done` is legal.
- **Scripts that use `giveDon` with `each`:** exactly two. **ST30-014** (up to 2 each: affected) and **OP14-105** "Give your Leader and all of your Characters up to 1 rested DON!! card each" (M = 1: `floor(DON / 1)` = DON, which is the correct cap since each target can take only 1; unaffected, and the "player picks which targets" behaviour is right). The other 19 `giveDon` scripts (EB03-053, EB05-008, EB05-057, OP12-015, OP14-114, OP15-058, OP15-114, OP16-021, OP16-035, OP16-052, OP16-093, OP16-094, OP17-025, ST01-011, ST17-004, ST21-014, ST31-005, ST35-004, ST35-005) have no `each` and take the non-each path, which asks a count (most first, "None" last) when more than one DON!! is available; that path is right.
- **Recommended engine change (`run.ts` `giveDon` `each`):** (1) the target pick is `upTo: min(cap, max(1, DON))` wherever at least one DON!! is available (each chosen target needs at least 1 to matter), not `floor(DON / per)`; (2) after the targets are chosen, for each target in order ask a count `0..min(per, remaining - (targets still to serve))` with the reused `mode` choose (most first, so the AI and the first legal pick still give the maximum), skipping the ask when the range has one value; (3) keep OP14-105 unchanged (per = 1: a count of 0 or 1 is exactly "pick which targets"). The two `it.fails` in `ST30-014.test.ts` then flip to `it`; the author test "never more than 2 targets" and the wave-2 planted test that pins one target for 3 DON!! must be rewritten (2 + 1 becomes reachable). With (2) skipped and only (1) done, R1 is closed and R4 stays at 1.

### B. Group B (ST32 to ST36): none
`DISAGREEMENTS-b.md` lists no `it.fails` and I found none to add. The three readings its author asked a reviewer to re-check: (i) ST34-002 with an empty DON!! deck: the K.O. resolves (RD 122: a "then" that cannot resolve does not stop the next clause; only a failed "if" does) — right; (ii) ST35-003, ST36-004, ST36-001 deck-of-exactly-N: RL-26 immediate loss — right; (iii) ST32-002 and ST32-005 offer a "cannot be rested" Character as a target: STB5-R7, harmless.

## Random games, AI games and mutation checks

**Decks.** A temporary override of `randomStandardDeck` (restored) drew from 21 Standard-legal Leaders that fit the batch: ST30-001, ST21-001, OP13-001 (Straw Hat Red/Green), OP12-020, OP10-001, OP15-001 (Green Slash), OP12-040, OP05-041 (Navy Blue), OP11-062, OP08-058 (Big Mom Purple), OP05-001, OP13-004, OP12-081 (Revolutionary Army), OP10-099, ST13-003, EB05-010, OP15-098 (Kid and Straw Hat Yellow), OP17-001, OP16-001, ST22-001 (Whitebeard), OP09-001 (Shanks Red); batch cards weighted 60 against 6 for other scripted cards and 1 otherwise, 50 cards, 4 copies, colours within the Leader, `deckIssues(.., 'standard')` clean. (The five ST31 to ST36 products carry no Leader of their own; the Leaders above are the Standard-legal ones for their types and colours.)

- `ENGINE_GAMES=6000 npx vitest run engine/test/property/{standard-games,leaks,skeleton-diff,projection,link-tracker}`: **5 of 5 files, 21 of 21 tests pass**: 6,000 random games with invariants after every action, replay hash equal, every listed action reduces, unlisted actions throw, Anomaly fails the game; leak properties (400 runs, standard decks); skeleton diff (500 seeds); projection; link tracker. 0 invariant violations, 0 leaks. (An earlier 4,000-game run of `standard-games` also passed.)
- **Coverage run, 3,000 games** (`playRandomGame({ standard: true })` with an `onEvents` tally): 0 capped, 0 Anomaly, results 1,491 / 1,509; **all 40 batch cards appeared** (an effect activated, an Event played or its Counter/Trigger revealed, or a replacement applied). Weakest: ST30-009 replacement applied 1 time and ST30-011 never applied (they need an opposing removal effect of a 6000-power Character while both are out; the author and independent tests cover them), ST34-001 [Your Turn] 143 resolutions, ST35-004 80. The permanent-only cards (ST30-003, ST31-003) do not emit events.
- **AI:** 60 Pirate-versus-Pirate games (`ai/test/support/match.ts`, decks from the same override, 21 distinct Leaders) with `onFallback` collected: **0 errors, 0 fallbacks, 0 capped, 60 of 60 finished**.

**Mutation checks (22 clauses; each restored with `git checkout`; author / independent failures):**

| Script | Mutation | Author | Independent |
| --- | --- | --- | --- |
| ST30-002 | power eq 6000 to 7000 | 3 | 9 |
| ST30-003 | +1000 to +2000 | 2 | 6 |
| ST30-004 | draw 3 to 2 | 2 | 4 |
| ST30-004 | reveal 2 to 1 | 4 | 6 |
| ST30-009 | replacement draw 1 to 2 | 1 | 3 |
| ST30-010 | skipRefresh `rested` to `active` | 3 | 9 |
| ST30-011 | replaced base power 6000 to 5000 | 3 | 6 |
| ST30-015 | Counter `>=2` to `>2` | 2 | 7 |
| ST30-016 | second name Luffy to Ace | 2 | 3 |
| ST31-003 | given DON!! `>=3` to `>3` | 3 | 5 |
| ST32-002 | base cost 6 to 7 | 1 | 2 |
| ST34-001 | Once Per Turn removed | 1 | 1 |
| ST34-002 | Leader type to Navy | 4 | 8 |
| ST35-004 | cost +1 to +2 | 1 | 1 |
| ST36-002 | `yourTurn` removed | 1 | 1 |
| ST36-003 | base power 7000 to 6000 | 2 | 4 |
| EB04-061 | `life <= 1` to `<= 2` | 1 | 2 |
| OP02-013 | -3000 to -2000 | 2 | 4 |
| OP04-083 | duration to `thisTurn` | 2 | 3 |
| ST33-003 | cost 2 to 3 | 1 | 1 |
| OP01-120 | power 2000 to 3000 | 2 | 2 |
| *second round* | | | |
| OP03-122 | `alsoNamed` removed | 1 | **0** |
| ST30-008 | play rested to active | 1 | 4 |
| ST32-004 | attribute Slash to Strike | 1 | 3 |
| ST32-001 | Leader attribute Slash to Strike | 3 | 5 |
| ST33-002 | opponent hand 6 to 5 | 1 | 1 |
| ST35-003 | opponent hand 7 to 6 | 1 | 1 |
| ST30-007 | -1000 to -2000 | 1 | 3 |
| ST34-001 | add 2 to 1 | 2 | 1 |
| ST36-004 | cost type Supernovas to Navy | 3 | 6 |
| ST30-002 | `bottomAnyOrder` to `bottom` | **0** | **0** |
| ST30-017 | `bottomAnyOrder` to `bottom` | **0** | **0** |

**32 mutations run, 30 killed by the author tests, 29 killed by the independent tests; 2 survive both (ST30-002 and ST30-017, STB5-R3) and 1 survives the independent tests only (OP03-122 `alsoNamed`, STB5-R6; the author test kills it).** Author-test survivors: ST30-002 and ST30-017 only.

## Other observations (no finding)

- 157 Characters have [Blocker] in `effectText` and no `keywords` entry (readings g2 data note): for OP01-120 this is harmless (such cards cannot block in the sim anyway). The data ticket stays open.
- ST34-001's two simultaneous own effects (Tamago's K.O. then Katakuri's add) resolve in a fixed order without asking; the tests do not assert the order (API-GAPS-b 10).
