# M11 Track C review: Franky (OP18-021) and Monkey.D.Luffy Green/Purple (EB02-010) as the 13th and 14th archetypes

**Date:** 2026-11-28
**Reviewer:** an independent review by a subagent with no stake in the work. The brief was to find what is wrong.

**Build reviewed:** worktree branch `worktree-agent-a4d1ea89cae9a4fed` at `5ba59b79` merged with `main` (`e7f9967d`, the Track C commit), own `npm ci`. Merge conflicts in `docs/BACKLOG.md` and `docs/DECISIONS.md` were taken from `main`; nothing else conflicted. E2E ran on production builds at ports 5317 to 5319.

**Rule:** any severity 3 or 4 finding fails the track. 4 = hidden-information leak or a wrong answer shown as certain; 3 = rules error, wrong card reading, a sourced claim its source does not support, a broken training path; 2 = notable; 1 = nit.

**M11 Track C review: FAIL.** Five severity 3 findings (M11C-R1 to M11C-R5), no severity 4. No hidden-information leak was found in the counter-grant change. The failures are a wrong card reading in the Franky guide, two wrong plans in other guides' rows about the new Luffy, an overclaimed source statement, a mulligan rule that contradicts its own guide (the trainer then states false defence figures), and an AI that burns its Leader's DON!! cost for nothing.

## What ran

| Check | Result |
| --- | --- |
| `npx vitest run ai/test/counter-grant.test.ts ai/test/game-plan-g4.test.ts app/test/meta-guides.test.ts app/test/meta-model.test.ts` | 4 files passed; 119 passed, 5 expected-fail (the BIAS_ONLY `it.fails`), 1 skipped; 5.8 s |
| `E2E_PORT=5317 npx playwright test app/e2e/m11c-training.spec.ts` | 10 passed (both projects), 2.0 min, including a Franky game to the end and its review |
| `npm run drills:bank -- <lethal, counter, don, mulligan> --check` | all four "committed bank is current" |
| Every card in both guides (42 ids) and every matchup row against `cards/data/sets` | scripted read of cost, power, type, text; 2 wrong readings (R1, R3), several smaller slips (R6) |
| Standings cache (`.cache/meta/standings`, 53 events) | recounted: Franky 11 and Luffy 4 decks in the four OP18-era events, 381 decks in all (the guides say 379 Standard); every copy count in both guides' tables matches the lists; list placings match |
| 15 seeded Pirate-vs-Pirate games (Luffy, Franky against Rocks, Sabo, Luffy RG, each other; seeds 91000 to 91014) | Luffy's DON!! −2 used 46 times, 8 with no Character on the field (R5); Franky's Stage activation 59 times, 9 with no Stage in hand (R7) |
| Hidden-permutation differential: Rocks AI against a Franky hand of four Stages versus four non-Stages, same list, same seed | `project` views, `publicState` and all 20 chosen actions identical: no leak (section "Hidden information") |
| Scan of every script for a hand-Counter grant | only OP18-021 matches `leaderCounterGrants`; OP16-118, OP17-063 and OP17-118 (Characters, narrower or conditional) correctly excluded |
| Browser: Meta tiles, both guides, Play this deck, Play against, Setup with both, mulligan trainer for each, a full game against the Pirate AI as each leader | works; axe 0 violations on the Luffy guide, the matchup grid and the mulligan start screen; finding R8 |

Not run: NVDA and VoiceOver (owner's), the nightly tallies (`PLAN_GAMES_G4`).

## Done criteria

| Criterion (plan, Track C) | Verdict |
| --- | --- |
| 14 tiles, 14 by 14 grid | Met (tests and browser) |
| Guides `confidence: low`, sourced or marked inference | **Not met**: R1, R3, R4, R9 |
| Playbooks registered, assertions from the guide's seeds | Met in form; the AI's use of the Leader abilities is wasteful (R5, R7) |
| Counter estimate reads the Leader's grant | Met for lethal, threat, review and Rookie; **not** in the mulligan rule (R2) |
| Mulligan trainer labelled as our reasoning | Label met; the Franky answers contradict the guide (R2) |
| Drills regenerated; Luffy DON!! items and Franky Stage items where the generator admits them | Partly: no Luffy-as-mine DON!! item, no Franky counter item (R10) |
| Training path in a browser | Met (e2e passes; full games run) |

## Findings

### M11C-R1 (severity 3): the Franky guide says a Stage is a Water Seven card (Nico Robin's End of Your Turn)

`docs/content/archetypes/OP18-021.md`, T3 row: "Nico Robin OP18-031 (its End of Your Turn sets a Water Seven card, such as your Stage, and a DON!! active)" [CARD-18]. OP18-031's text is "[End of Your Turn] Set up to 1 of your {Water Seven} type cards and up to 1 of your DON!! cards as active." All four Stages (OP18-075 to OP18-078) have type **Straw Hat Crew** only (`cards/data/sets/OP-18.json`), and none is Water Seven. So Robin cannot untap the Stage (which would give Thousand Sunny's, White Hobby Horse's or Mini-Merry's Activate a second use). What she can set is the Leader (Water Seven) or Franky OP18-034 / Luffy OP18-118 (Water Seven). The line is sourced to the card text and the text says the opposite.
**Judgement:** wrong card reading in a game plan the owner trains from.
**Fix:** say "sets one of your Water Seven cards (the Leader, Franky OP18-034 or Luffy OP18-118; not a Stage, which is Straw Hat Crew only) and a DON!! active". Add a test that every "[type] card, such as X" claim in a guide holds for X (or just a one-off check of this line).

### M11C-R2 (severity 3): the Franky mulligan rule does not count Stages as Counters, so the trainer shows a wrong answer and false defence figures

The guide says: "A Stage in hand counts as a +3000 Counter with this Leader, so Stages double as defence and the counter requirement is usually met by the Stage itself." The playbook's `counters` piece (min 1) is judged by `mulliganVerdict` (`ai/src/search/mulligan.ts:40`, `counterValueOf(c) > 0` with no Leader) and the explanation text by `explainMulligan` (`ai/src/search/review/mulligan.ts:88`, again no Leader). A Stage has no printed Counter, so it counts for the `stage` piece only, and each card counts toward one piece.
Evidence (run with the shipped rule, `mulliganVerdict` on real cards): Iceburg, Thousand Sunny, Shark Submerge 3, Franky OP18-034, Luffy OP18-118 going first: **redraw** (`counters` unmet); Iceburg and four Stages going first: **redraw**; a searcher plus a Stage plus three expensive Characters going second: keep only because of `secondShort`. In the committed bank (`app/src/drills/banks/mulligan.json`):
- `mulligan-OP18-021-franky-1st-redraw`: hand Zambai, Shark Submerge 3, Thousand Sunny, Thousand Sunny, Franky OP18-034. The answer text says "It defends with one card: Zambai, +1000." Under this Leader the hand defends with 3 Stages (+9000) and Zambai (+1000). The false line is shown with certainty `any-hand`.
- `mulligan-OP18-021-franky-2nd-redraw`: hand Shark Submerge 3, Thousand Sunny, EB02-061, ST18-004, OP18-034. The answer says "Your hand lacks a card with a Counter. It has no card that defends." Two Stages are +6000 of defence. The guide's own rule (going second, one piece short is acceptable, Stages count) would keep or at least not call the hand defenceless. A player who follows the guide is marked wrong.
The review is unaffected (never flags these decks, correct), but the trainer and `explainMulligan`'s "It defends with ..." line are exactly the counter estimate BACKLOG §15 R4 says is fixed.
**Judgement:** the fix for the counter estimate was applied to the lethal, threat, review and Rookie paths and missed the mulligan path, so a drill answer contradicts its guide and states a false figure. At the severity 4 boundary (a wrong figure printed under a certain label); rated 3 because the label says "our reasoning" and the verdict direction (redraw without a searcher going first) matches the guide in the first item.
**Fix:** pass the hand owner's Leader id to `counterValueOf` in `mulliganVerdict` and `explainMulligan` (`pb.leaderId` or the item's Leader); then regenerate the mulligan bank (`npm run drills:bank -- mulligan`) and re-read the Franky items. Add a test: with Franky, a hand of a searcher and a Stage satisfies `counters`; the explanation counts Stages at +3000.

### M11C-R3 (severity 3): two matchup rows say only Shanks can rest the new Luffy's big bodies; Demon Aura (in all three lists) can too

`OP17-058.md`, EB02-010 row: "Their rest tools stop at 5000 power (Mamaragan) or cost 8 (Nami OP14-031), so your 9 and 10 cost bodies are safe from both; only Shanks OP17-022's rest-all reaches them". `OP17-079.md`, EB02-010 row: "cost-13 Giants are above the first, while Shanks OP17-022's rest-all is the one effect that stops your blocks". OP12-037 Demon Aura ("[Main] You may rest 3 of your DON!! cards: Rest up to a total of 2 of your opponent's Characters or DON!! cards") is run 2/2/2 in all three Luffy lists, costs 1, and has no cost or power limit; the Luffy guide itself says "use OP12-037 or Shanks' rest-all on them" in its own Sabo and OP17-079 rows. Shanks is 1 copy in one list. So the rows name the rare card as "the one effect" and omit the common one: the plan "your Giants are safe except from Shanks" is wrong, and a player keeping blockers back for a 10-cost play that will not come is misled.
**Judgement:** wrong card reading about the other leader, presented as complete ("only", "the one effect").
**Fix:** both rows: "OP12-037 (2 to 3 copies in every list) rests up to 2 Characters of any cost for 3 rested DON!!, and Shanks rests all of them". Add OP12-037 to the OP17-058 row's list of reach.

### M11C-R4 (severity 3): the guides and sources say the three lists are "the best placings found"; for Franky they are not

`OP18-021.md` Standing paragraph: "the three lists below are the best placings we found, not top-8s". `docs/research/meta-lists.json` (`handAdded`) and `docs/content/sources.md` [ML-ADD]: "the three lists per deck are the best placings found in the cached Limitless Play standings". In the cached standings Franky also placed 34th of 95 (ricmasterflash, 3-2, ChinoizeCup #137) and 69th of 105 (Tommy N, 1-2, #139); the third list used is 100th of 105 (0-2). Both passed-over lists run block-2 cards (OP08-067 Charlotte Pudding, OP05-074, OP05-040, OP05-077) that are held and unscripted; DECISIONS says exactly this ("the best placings that need no unscripted card"). The user-facing guide and the source tag do not. A reader is told the third list is among the best; it is the 100th of 105 with 0 wins.
**Judgement:** a sourced claim its source (the standings) does not support. Luffy's lists (15th, 22nd, 62nd) are consistent with the claim as far as the cache ranks (three 64- and 53-player events carry no placing).
**Fix:** reword all three places to "the best-placed lists that need no card the simulator has not scripted yet (better-placed Franky lists, 34th and 69th, run Charlotte Pudding and other block-2 cards)"; and show the 0-2 record in the Standing paragraph. Optionally script OP08-067 and take the 34th-place list (BACKLOG §16 already carries it).

### M11C-R5 (severity 3): the Luffy AI pays DON!! −2 with no Character on the field, over and over

`ai/playbooks/EB02-010.json` bias 1 (`activate set-active`, `fromOwnTurn: 2`, bonus 3.0) rewards the activation whenever it is legal. The engine reads "the only Characters on your field are Straw Hat Crew" as false with no Characters (`cards/effects/EB-02/EB02-010.ts` ruling), but the cost is paid before the condition: the 2 DON!! return and the once-per-turn is spent for no effect. Seeded games (my harness over `playMatch`, Pirate tier, `onDecision`): seed 91000 (Luffy vs Rocks) activated at turns 3, 5, 7 with no Characters (3 of 4 uses wasted); seed 91002 (Luffy vs Franky) activated at turns 3, 5, 7, 9, 11, every own turn, with an empty board (5 of 5 wasted); overall 8 of 46 activations had no Character. Both games were lost. The planted tests (`game-plan-g4.test.ts` seed 1) plant a Straw Hat Character first, so they cannot see it, and `isNoOpActivation` (`ai/src/search/sim.ts`) does not catch it because the cost changes the state.
The guide's T2 row ("use the Leader's DON!! −2 once you have at least 2 spent DON!! to return and 2 to set active") never says a Straw Hat Crew Character must be on the field; read as written it sends the player into the same mistake.
**Judgement:** a broken training path: the opponent the owner trains against throws away 2 DON!! a turn from turn 3 in a fifth of its uses, and the guide omits the condition.
**Fix:** (a) guide: add "needs at least one Character on your field, all Straw Hat Crew; with an empty board the DON!! −2 is spent for nothing (the engine reads an empty field as false)" to the Leader line and the T2 row; (b) playbook: add a `when` condition to the bias (own Characters exist and all are Straw Hat Crew), or make the planner treat an activation whose condition fails as a no-op; (c) a planted test with an empty board that asserts no activation, and a tally in `plan-tally-g4.ts` counting activations with an unmet condition.

### M11C-R6 (severity 2): the Luffy rows in other guides miss the commonest Rush and the Franky Family rows cite the wrong tags

- `OP05-098.md`, EB02-010 row: "Their pressure is ST30-012 and Shanks OP17-022 Rush". ST30-012 is 0/2/0 and Shanks 0/1/0 across the lists; EB02-061 (3/1/1, 7000) gains Rush with a multicolour Leader against 5 or more opposing DON!!, and its When Attacking returns 2 active DON!! to set it active and take a Life card. It is the card that matters.
- `OP17-058.md`, Franky row: "Their Characters are cost 5 to 7 (OP18-072, OP18-034, Zambai)": 5, 6 and 5; no cost 7.
- `OP13-004.md`, Franky row: Loki's K.O. "takes two of Tom, Nami and Iceburg"; costs 1, 1, 2 total 4, so it takes all three.
- Luffy guide: "Hold DON!! for Counter events (Gum-Gum Giant +4000, Mamaragan)" and "Counter events ... pay in DON!!": Mamaragan's Counter has no DON!! cost (its Main does); the Luffy guide's Franky row says their Stages draw and add DON!! "each turn", true only while a Stage is in hand.
**Fix:** correct the four lines; EB02-061 into the OP05-098 row.

### M11C-R7 (severity 2): the Franky AI pays DON!! −1 with no Stage in hand

Same cause as R5 for the other deck: bias 1 (`activate play-stage`, bonus 3.0, from turn 1) has no "a Stage is in hand" condition although the guide's seed says "whenever a Stage is in hand". In the 15 games the activation came with no Stage in hand 9 times of 59 (seeds 91001 turn 6, 91003 turn 9, 91006 turns 5, 7 and 9, 91007 turns 20 and 22, 91011 turns 4 and 6); a visible case in the browser (full game as the Pirate Franky): "Their Franky: DON!! −1 ... Return 1 DON!! to the DON!! deck" with nothing played. One DON!! each, so a smaller cost than R5.
**Fix:** a condition on the bias (a Stage of cost 5 or less in hand), and an assertion counting the unmet case.

### M11C-R8 (severity 2): the mulligan trainer's archetype list has three entries called "Monkey.D.Luffy"

On `/drills/mulligan` the Archetype select now reads "... Monkey.D.Luffy, Enel, Monkey.D.Luffy, Boa Hancock, ... Monkey.D.Luffy, Franky". The Red/Green (OP13-001), Black (OP17-079) and Green/Purple (EB02-010) decks are indistinguishable. The Meta tiles use "Luffy (Green/Purple)"; Setup uses "Monkey.D.Luffy (EB02-010)". A learner picks one at random.
**Fix:** use the same label as the Meta tiles (or "Monkey.D.Luffy (EB02-010)") in the drill selects.

### M11C-R9 (severity 2): CARD-18 is used for cards it does not cover

`docs/content/sources.md` defines [CARD-18] as "Exact card text for ... every OP-18 card and the EB02-010 and OP18-021 Leaders". Both guides cite it for older cards: OP12-037, PRB02-012, ST18-004, OP14-031, EB02-017 and OP13-040 (for example "OP12-037 (rest up to 2 Characters) [CARD-18]", "Nami OP14-031 ... [CARD-18]", the Banish and Trigger lines; EB02-017, ST18-004 and PRB02-012 lines in both guides). The text matches the data, so no claim is false, but tags are the guide's evidence chain. Also the mulligan explanations list `SH-MUL` among sources for the two our-reasoning guides: correct for the generic questions, but it sits beside "our reasoning" with no gloss.
**Fix:** [CARD] for pre-OP-18 cards (or widen the definition and say so); on our-reasoning items, show SH-MUL only as the source of the three keep questions.

### M11C-R10 (severity 2): drill coverage is below the plan for the two decks

The plan asked for Luffy DON!! −2 items and Franky Stage-play items where the generator admits them. Committed banks: mulligan 3 and 4 items (Luffy has no going-second redraw item, Franky 1), DON!! Franky 2 / Luffy 0 as "mine" (2 as "theirs"), counter none for Franky and 2 as "theirs" for Luffy, lethal 2 "theirs" for Franky (both "none, attackers": they test nothing about the Stage Counter). DECISIONS discloses the counts and BACKLOG §16 carries it; the Franky counter question (a Stage as +3000) has no item and the owner's stated goal was to practise the line. Not a defect in what exists; a gap against the plan.
**Fix:** seed the generators for a Franky counter item and a Luffy DON!! −2 item (the generator is ordered by seed), or say in the guide that these are untrained.

### M11C-R11 (severity 1): nits

- Franky guide, Robin: "also rests instead of leaving the field to an opposing effect" reads as protecting herself; the text rests her in place of any of your Characters.
- Franky guide: Shark Submerge 3's +1000 is for "the Leader and 2 Characters" but only a Leader of 5000 power or less (omitted).
- `docs/content/sources.md` LL-18 says 379 Standard decks; the standings hold 381 decks in the four events (two not Standard, not independently rechecked).
- The mulligan start screen still reads "A deck with no sourced mulligan rule has no items here; picking it says so", though two decks without a written source now have items labelled as ours (R2's copy and the label are right; the screen is stale).
- `ai/playbooks/EB02-010.json` lists OP17-022 Shanks as a win condition (1 copy in one list); the guide calls it a finisher that turns the Leader's ability off.

## Hidden information (item 4)

The grant is read from the Leader's script, a public card (`leaderCounterGrants`), and from the card's own category; a hidden hand card never supplies its identity in a path the AI uses. Call sites: lethal `factsOf` reads the actual defender hand only when `mode === 'actual'` (drill proofs with full information); the public path uses the prior's card ids plus the public Leader (`publicState`, `defenceBound`, `counterProfile`); `threat.ts` reads the AI's own hand; the review and `explainShouldCounter` run post-game. My differential (Rocks AI at seat p1 against a Franky hand of four Stages versus four other cards of the same list, same seed, same Life, otherwise identical): `project(state, 'p1')`, `publicState(projectForSearch(...))` and all 20 actions chosen by the Pirate with biases were identical. Conditional, narrower and Character grants are excluded (scan above). No Leader other than OP18-021 matches. I found nothing to fix here. The strong claim is limited to that position and to the paths named; the nightly leak properties (10,000 games) are the standing guard and were not run.

## Mulligan label (item 5)

Wording is honest: "From the Franky guide (our reasoning, no written source)" (`certaintyLabel`, basis `reasoning`); `isSourced` stays false for both playbooks (no `SH-` tag), so the review's mulligan detector never flags a hand from them, and `mulliganCoverage` reports the three classes (9 sourced, 2 ours, 3 none). `isOurReasoning` keys on the playbook's `source` text, so a future playbook that writes "our reasoning" for any other reason becomes a trainer deck by accident; consider an explicit field. The label is correct; what it labels is wrong in places (R2).

## Source tags (item 2)

Every tagged claim about card text matches the card data except R1; the copy counts, placings, dates, event sizes and shares match the standings cache; `confidence: low` is honest for both guides; no invented source. R4 is the one tagged statement the data contradicts; R9 is tag hygiene.

## Fix round (2026-11-28)

Branch `worktree-agent-a59e4a354dde23539`, merged with `main` first. R2, R8 and R10 are with the agent that owns the drill generators, banks and the mulligan counter code; this round does not touch them. Revert evidence: the change was removed (the playbooks' `when`, the guide files from `HEAD`) and the named tests run.

| Finding | Change | Test | Fails on revert |
| --- | --- | --- | --- |
| R1 | Franky guide T3 row: Robin sets the Leader, OP18-034 or OP18-118; a Stage is Straw Hat Crew only (all four Stages checked in `cards/data/sets/OP-18.json`). Robin's other line reworded (nit R11). | `app/test/meta-guides.test.ts`, "R1": no Stage has type Water Seven; the guide no longer says "Water Seven card, such as your Stage". | Guides at `HEAD`: 3 failures (R1, R3, R6). |
| R3 | OP17-058 and OP17-079 Luffy rows name OP12-037 Demon Aura (2 copies in every list, any cost, 3 rested DON!!) next to Shanks' rest-all (1 copy). | "R3": both rows name Demon Aura and no longer say "the one effect" or "only Shanks". | As above. |
| R4 | Franky guide Standing paragraph, `handAdded` (and its pinned fixture) and the [ML-ADD] source text say the lists are the best-placed lists that need no unscripted card, name the 34th and 69th lists and their block-2 cards, and show the third list's 0-2 record. Luffy's text states its lowest placing. No block-2 card scripted. | Prettier and `meta-update.test.ts` (hand-added text kept); reading check only. | Not mechanically tested (a wording fix). |
| R5 | `activate` playbook bias gained `when` (`ownCharactersAllType`), read from the engine's field and the card data by `activateWhenMet` (`ai/src/search/conditions.ts`). With the condition unmet the bias gives no bonus or citation, `unmetPenalty` 25 applies, and Pirate drops the candidate (`dropUnmetActivations`). EB02-010 uses type Straw Hat Crew; the guide's Leader paragraph, T2 row and seeds state the condition; new playbook seed 4 and a tally. | `ai/test/game-plan-g4.test.ts`, "seed 4": no DON!! −2 with an empty board, and with a Character that is not Straw Hat Crew (Pirate and Warlord, biases on). Tally `EB02-010#4` in `plan-tally-g4.ts` (threshold 0.95). | `when` removed from both playbooks: 6 failures (empty board and non-Straw-Hat, both tiers; Franky no-Stage, both tiers). |
| R6 | OP05-098: EB02-061 (7000, Rush with 5 or more DON!! on your field, When Attacking sets it active again for 2 DON!!) is the pressure. OP17-058 Franky row: cost 5 or 6 (OP18-072 5, OP18-034 6, Zambai 5). OP13-004 Franky row: Loki takes all three of Tom, Nami and Iceburg (1 + 1 + 2). Luffy guide: Mamaragan's Counter costs nothing (its Main costs DON!! −2); the Franky row says Stages draw and add DON!! when played, not every turn. The Franky guide's own Sabo and OP17-079 rows (Loki takes all three) match. | "R6" in `meta-guides.test.ts` checks the cost range and the Loki total against card data and the rows' wording. | As R1. |
| R7 | Same mechanism: `handStage` (a Stage with printed cost 5 or less in hand) on the OP18-021 bias, in the guide's T1 row and seed 4. | "seed 4: no DON!! −1 with no Stage in hand" (hand of Zambai, OP18-072, OP18-034), Pirate and Warlord; tally `OP18-021#4`. | As R5. |
| R9 | [CARD] for cards older than OP-18 in both guides' rows and lines (OP12-037, PRB02-012, OP14-031, OP07-064, Shanks OP17-022 and the like); [CARD-18] kept for OP-18 cards and the two Leaders; `sources.md` says so. The `SH-MUL` gloss on the mulligan explanations lives in `ai/src/search/review/mulligan.ts` and the drills, which belong to the drill agent: **not changed here**. | Reading check (tag per claim); no mechanical test. | n/a |
| R11 | Robin's text corrected; Shark Submerge 3 limited to a Leader of 5000 or less; LL-18 says the cache holds 381 decks, 379 passing the Standard check (the other two not rechecked); the Weak-to line about DON!!-resting reads active DON!!. Not changed: OP17-022 in the Luffy playbook's `winConditions` (the guide calls Shanks a finisher, which is what the field means; one copy in one list) and the mulligan start-screen copy (drill agent's files). | Reading check. | n/a |

### What the stronger first attempt showed

A first version of R5 and R7 only added the condition to the bias bonus (and a 3.0 penalty). The 40-game Pirate tally for seed 4 then read 122 of 126 (Luffy) and 140 of 147 (Franky): the remaining activations were in losing positions on turns 10 to 15 (values of −20 to −35), where every other move ranked below the penalised activation. Pirate now removes those candidates before ranking (`dropUnmetActivations`, as `holdDon` does for its DON!! rule); a 40-game probe over the same pairings found 0 unmet activations in 278.

### Gates

`npm run typecheck`, `npx eslint .`, `npx prettier --check .` clean. `npx vitest run engine ai app cards/test`: 3304 files passed, 34984 tests passed (run again after the candidate filter, same result). `npm run build` passes. `E2E_PORT=5314 npx playwright test app/e2e/m9-meta.spec.ts app/e2e/m11c-training.spec.ts`: 18 passed.

The g4 plan tests in nightly mode (`PLAN_GAMES=40 npx vitest run ai/test/game-plan-g4.test.ts`, the `test:strength:pirate` configuration; Pirate, 40 games, with and without the biases): passed. Tallies with the biases (hits/total, rate, threshold): EB02-010 seed 1 122/123 (0.99, 0.8), seed 2 18/18 (1.00, 0.8), seed 3 5/10 (0.50, 0.8), **seed 4 122/122 (1.00, 0.95)**; OP18-021 seed 1 69/69 (1.00, 0.8), seed 2 1/1 (1.00, 0.8), **seed 4 140/140 (1.00, 0.95)**. Without the biases: EB02-010 1 88/119, 2 17/21, 3 12/26, 4 88/94 (0.94); OP18-021 1 43/74, 2 23/23, 4 82/92 (0.89). Luffy seed 3 (Sanji & Pudding before the DON!! −2) is a small, weak sample: 5 of 10 passes only because the one-sided 99% bound at n = 10 cannot rule out 0.8; it is not touched by this round.
