# Backlog

Ordered by value (PROMPT.md "After M10"). Items carried from closed milestones carry their source.

1. **Warlord at least 65% against Pirate** (PLAN M5b target, not met; DECISIONS 2026-11-23). Measured 61.5% (123/200), flat in budget. Leads: tune the heuristic's weights by self-play on a larger sample than 200 games; give the opponent's turn in rollouts a policy that removes Characters and counters like a player; score defence decisions on shared samples. Use the parallel gate runner pattern (13 processes, about 13 minutes per 200 games) and always re-check on fresh seeds.
2. **M10 must close these M6 carries** (**note, M10 fix round: M6-14 is deferred by the M10 plan, DECISIONS 2026-11-27 "M10 plan", and BACKLOG §14; it stays open pending the owner's yes to that deferral, since this item is his instruction**) (docs/reviews/m6-review.md; F17 states them as requirements): M6-3 arrow keys in the builder grid, Tab between panes, Enter/Backspace to add and remove, `A` to cycle art (F17 steps 1 and 6); N-2 the grid's 127 Tab stops (roving focus fixes it) and a skip link back from the deck pane; M6-14 colour and set filters, DON!! deck size, group by category; severity 1 items M6-11, 15, 17 to 21, N-4 (Setup's automation line beside an invalid deck; "Unknown card" for every card when loading fails).
3. Sealed mode.
4. More AI depth: Emperor measurably stronger than Warlord.
5. More archetypes.
6. Japanese-format toggle.
7. Replay sharing by URL.

## 3. M6b-1 design items left stats-only (DECISIONS 2026-11-23 "M6b-1 decisions")

- D1 rules-changing Leaders OP13-079 Imu, OP13-003 Roger, OP15-022 Brook (per-leader rule flags).
- D5 whole-side [On Play] negation, OP09-081 Marshall.D.Teach (needs a ruling on [Trigger] [On Play]).
- D7 a battle watcher registered by an Activate effect, OP12-020.
Details and options: `docs/research/m6b-runtime-audit.md` §3.

## 4. EB-05 review nits (docs/reviews/m6b-EB-05.md)

- EB05-R5 (sev 1): EB05-043 asks K.O.-or-rest before checking that any Character is a legal target.
- EB05-R6 (sev 1): unverified older cards print [Blocker] with `keywords: []` (ST08-006 etc.), so printed-value reads miss it; closed by the Standard-wide Limitless verification run.
- Test kit: `engine/test/independent/cards/eb05/kit-b.ts` `beginUse` accepts every optional prompt, which can hide a missing "up to" prompt; narrow it before reuse.
- ~~E-Q11 revisit~~ done 2026-11-24 (`addDon` asks a count).


## 6. OP-13 batch (2026-11-24, docs/reviews/m6b-OP-13.md)

- Engine (OP13-R5, severity 1): `giveDon` with `each` and fixed targets (no `upTo` on the target pick: OP13-042 Newgate "your Leader and 1 of your Characters up to 2 rested DON!! each", OP14-105 "each of your Characters") asks a count per target of 1..M, never 0, so a fixed target cannot be given none. The text ("up to") allows 0 per target, and with fixed targets "fewer targets" cannot express it (STB5-R1 rejected a 0 option only where it could). Not done: a None option per target adds a prompt per target (OP14-105 has up to six targets and M = 1, so every target would be asked "1 DON!! / None"), for a case the review calls unobservable in practice (Newgate costs 10, so all DON!! are rested and giving is nearly always better). A cleaner shape wants a design decision: one up-front "how many in total" question for fixed-target gives, or a 0 option only when M is above 1. OP13-081 Koala is already fine: with an exact target and one DON!! the target pick ends with `done` (test added).
- OP13-104 Hiyori (OP13-R8): the runtime adds a deck-top card to the top of Life whatever `position` says (`run.ts` `move`, deck top to Life). The validator rejects `bottom` for this move, so it is unreachable; a script-level test pins `top`.

## 5. OP-15 batch (2026-11-24)

- ~~Engine: `play { from: 'self' }` plays the source card from wherever it now is, not from the zone the text names (found by the OP-15 group 2 scripter: OP15-080 Oars, paying the deck-bottom cost with Oars itself, would play it from the deck bottom). OP15-080 uses `from: 'trash'` with `isSelf`; OP17-015, OP16-014, ST30-008 pay hand costs and cannot hit it. Fix: the validator should reject `from: 'self'` play where a cost can move the source, or the runtime should check the source's zone.~~ Fixed 2026-11-24 (M6b-2 wave 4, engine 0.5.15): `play` with `from: 'self'` offers the card only where its text names (the `resolving` slot of a [Trigger], the trash for any other ability); a card a cost moved elsewhere is not played. Test `engine/test/cards/m6b-w4/backlog-play-self.test.ts`.
- Engine (OP15-R2): `cannotBeRested` needs a source-card-type filter. OP15-024 Usopp "cannot be rested by your opponent's Leader and Character effects" over-protects against opposing Event and Stage effects (independent disagreement A-2, still an `it.fails`). `restrictionMod` and the derived `cannotBeRestedByOpp` boolean carry no source card type; the effect context knows the source card, so an `effectSource: ['Leader','Character']` qualifier on `by` is the fix. Accepted approximation until then.
- OP15-090 Perona (OP15-R5): with an empty hand the hand-trash replacement is offered and only "decline" is legal. The hand size is public, so it is only a needless prompt; left as is.
- ~~Engine/view (OP15-R7): skeleton versus view mismatch for a card being played at a "Character area is full, choose 1 to trash" prompt: `determinize.ts` `seenBy` treats a card on a `play` frame as known (CR 2-7-2) but `project.ts` `canSee` does not reveal it. Probe: review random games, life mode, seed 956, viewer p2, step 112, `projectForSearch(...).skeleton.state.cards.$k000009.card`. Tried adding the play-frame card to `canSee`: the skeleton mismatch disappears but `leaks.test.ts` "views and observed autoSkip are invariant under hidden permutations" fails. Either the view reveals it and the leak property exempts the card being played, or the skeleton stops treating it as known. No secret is shown today.~~ Fixed 2026-11-24: the view reveals a card past `pay` on a `play` frame (and hides its hand slot); see DECISIONS.
- ~~Engine gap (not in the M6b-1 audit), for wave 4: `[DON!! xN] [On K.O.]` (OP14-051 Hatchan). A `donGiven` condition on an `onKO` auto reads the card after it is in the trash, where its DON!! have returned, so it never fires. `leaveField` already records `lki.don`; `runKo` passes only `{ cause }` to `fire`. Needed: `donGiven` on an `onKO` auto reads the last-known value (via `ev`, like G28 `koCause`). No scripted card uses the combination today (checked 2026-11-24).~~ Fixed 2026-11-24 (M6b-2 wave 4, engine 0.5.15): `runKo` passes the K.O.'d card's given DON!! as `ev.don` (only when the card has such a condition) and a `donGiven` condition reads it. Test `engine/test/cards/m6b-w4/g34-dongiven.test.ts`.
- Engine gap (OP-12 group 3 scripter): an `attack` timing that names both `attacker` and `target` matches on either side alone (`attackMatch` in engine/src/flow.ts uses `target` only for the defender and `attacker` only for the attacker), so "when this Leader attacks your opponent's Leader" (OP12-081 Koala Leader) also fires on an attack on a Character. Fix: require both to match when both are given. **Fixed 2026-11-25** (`attackMatch` requires the other side too; planted test `engine/test/cards/m6b-b3a/attack-both-sides.test.ts`); OP12-081 scripted.

## 7. Block 3 batch A review, severity 1 (2026-11-25, docs/reviews/m6b-block3-A.md)

- B3B-R9: the generic prompt of a multi-limit effect (OP10-098: "K.O. up to 1 of your opponent's Characters") does not show the cost limit of the pick in progress; UI text only.
- B3B-R10: six older scripts have author tests but no independent test: OP10-067, OP10-114, ST17-004, ST21-003, ST21-014, ST21-017.
- B3B-R11: OP10-035 Brook, the Leader is always eligible for "cost 5 or less" (M6b-Q48, open; consistent with OP15-024).
- B3B-R12: OP10-036 Perona, the Once Per Turn is spent by the first rest by your effect whether or not a DON!! can be set active (M6b-Q30, open); a rest paid as a cost does not count.
- B3B-R13: ST20-004 mutation `lte: 3` was not run by the review (its pattern did not match); the cost bound is covered by the author suite. Run it when the mutation harness is next used.
- B3C-R4: OP09-041 "set up to 2 of your Characters as active" offers every Character, active ones included (legal but pointless choices). Filtering `state: 'rested'` would shorten the prompt; the text does not say "rested", so no rules change.
- B3C-R5: EB02-023 Crocodile "(a cost of yours counts as an effect)" (M6b-Q20): no scripted card returns an opponent's Character as a cost, so the reading cannot be observed yet; revisit when one is scripted.

## 8. Waves 5 to 7 fix round, engine part (docs/reviews/m6b-waves5-7.md)

- W57-R11 (severity 1): G48 (OP10-033 Nami, M6b-Q69) holds a count of rested DON!!, not particular ones. If the opponent returns rested DON!! before their Refresh (a DON!! -N cost or an effect), the count is capped by the rested DON!! left and another rested one stays held. The rules would hold the chosen one, which would then be gone. DON!! are not individual objects in the engine (the cost area is two counts), so the fix is a design change (identity for held DON!!), not a one-liner. Rare: the held DON!! would have to be returned in the one turn between the effect and the Refresh.
- Other self-leaving costs (a `move` cost of this card, G52) do not carry the source into a later K.O. by the same effect (W57-R6 covers `trashSelf` only). No scripted card does it.

## 9. Leftovers batch fix round (docs/reviews/m6b-leftovers.md)

- LF-R8 (severity 1): the app log (`app/src/play/game/text.ts`) writes `DonReturned` only when `to` is `donDeck`, so the cost of ST28-004 Momonosuke (`returnGivenDon`: given DON!! go rested to the cost area) leaves no log line. Not a one-line addition: the same `DonReturned` with `to: costRested` is also emitted when a Character holding DON!! leaves the field (`ops/index.ts`) and at the Refresh Phase, so logging the event as is would add a line to every such event. Wanted: a log line only for the cost, for example by giving the cost its own `reason` on the event and printing "Return N given DON!! to the cost area rested".
- LF-R3 (severity 2, not a defect): the OP12-028 Hiyori mutant `upTo: 1` to `exactly: 1` is equivalent. `lookAtTop` always asks its take with `min: 0` (a search may take nothing, so asking for a match would tell the opponent what the top cards hold); the existing author test "taking nothing is allowed" already declines a matching card and passes with the mutant.

## 10. Wave 8 (docs/research/m6b-wave8.md)

- W8-N1 (severity 1): a DON!! rest whose only candidates are DON!! (`rest` of `donCostArea`, `exactly: N` below the active count) asks which DON!! class although there is one (`selectRest`). PRB02-005 therefore shows its opponent a one-answer prompt at the start of their Main Phase; OP11-024, OP11-035 and OP12-018 already ask the same. Auto-answering it changes the tests and recorded flows of those three cards (ENGINE_VERSION), so it was left out of wave 8.
- W8-N2 (severity 1): an Event activated from the trash by an effect (EB03-031) runs with its source still in the trash; a [Main] that names "this card" would read it there. No such Event is known; revisit if one is scripted.
- W8-N3 (severity 1, fix round R5): mutants killed by one suite only and not yet pinned in the author files: OP15-014 `baseCost` to `cost` (the independent suite's Just Watch Me, Ace!!! case), OP16-079 duration `thisTurn` (the Rush), OP12-041 DON!! add `upTo: true` to `false`. OP12-041's boundary of 3 and "choose none" are pinned (`w8-fix-round-r2.test.ts`).

## 10. Review search (M8-2, 2026-11-26)

- The public lethal search caps on busy late-game boards (3 to 5 attackers, 5 or 6 hidden cards), so the review marks those turns "Not fully checked" (44% of turns on the 303-decision fixture). A sharper refutation bound over hidden counters would settle most of them; shared with L-03 (Unknown rate) and the M5b search budget. The review gate holds this under a 50% ceiling.

## 11. M8 review, scope carries (docs/reviews/m8-review.md, fix round)

- M8-R10: lethal given away covers only a lost-by-damage last game with a Blocker attack the turn before (not a Character attack, not a missed block or counter); mulligan flags only for sourced guides (OP05-098 and OP08-098 never). Documented in `docs/design/m8-plan.md` "Scope limits". The in-app copy should say "checked: Blocker attacks" (app part of the fix round).
- M8-R6 follow-up: the counter-wasted bound counts every draw and every re-activation conservatively, so it fails (flag becomes Hindsight or none) while they hold unspent DON!! and a list with cheap re-activators. A sharper bound (the cost of the drawing card, a draw effect's real amount, once-per-turn) would keep more E04-style flags `any-hand`. Measure the rate on the gate fixture before tightening.
- ~~M8-R8 app follow-up~~ **Done 2026-11-26:** `sanitizeRecord` keeps `final` (rebuilt field by field) and `Session.restore` recomputes it with `finalOf` (tests `app/test/record-final.test.ts`, `session.test.ts`).

## 12. ~~First paint waits for the store (M8 boot, 2026-11-26)~~ done in M10 WP1

Done: React renders at once and `StoreGate` holds only the routes that read saved data (DECISIONS 2026-11-27 "M10 WP1"; `app/e2e/first-paint.spec.ts`). Kept for the record:

- `main.tsx` awaits `initStore()` (IndexedDB open and migration, capped at 3 s) before the first render, so the first paint waits on IndexedDB. Render a shell first and open the store in parallel (only the save path, History and Settings → Data need it). Target: M10 performance pass (first playable board under 3 s on a throttled profile).

## 13. M9 review, scope carries (docs/reviews/m9-review.md, fix round)

- M9-R10: most counter and DON!! flags from real games cannot become drill items (a counter step carries pending state `scenarioOf` refuses; DON!! and target are practised in place); no any-hand lethal or counter flag came out of 15 seeded Rookie games, so the harder-hand path is tested on the bank's records only. Wanted: a modifier-free cut at the Main before a counter, a planted E01 game through `puzzleResponse` and `materialise`, and the flag list saying why a flag cannot be practised as a puzzle.
- M9-R5 follow-up: the review's mulligan flag still says "From the <Leader> guide (sourced)" for a guide whose rule is tagged inference (its e2e asserts the text); the drill label says "(sourced baseline, inference)". Carry the basis on the flag and change both together.
- M9-R4 follow-up: Progress cannot show why a timed session did not earn the badge (it stores `timedOk` only); the summary says it.

## 14. M10 carries (WP7, 2026-11-27)

- **Life-tile caption** (M10 WP7 cut): the caption item lives in `app/src/play/board/Board.tsx`, outside WP7's files; not built. The midline's truncated activity text now has a `title` tooltip (the full text was already its accessible name).
- **M6-14, M6-15, M6-17 to M6-21** (builder filters by colour and set, DON!! deck size, group by category, and the M6 review's smaller items): cut from M10 by the M10 plan (DECISIONS 2026-11-27 "M10 plan"); BACKLOG §2 had named M6-14 for M10.
- **Builder tab stops:** 12 from the search box to the deck name (127 before); the spec's "12 or fewer to the last action" is not met literally (the page is under 25 stops).
- **The Warlord's wait on the worker (M10 WP3, DECISIONS 2026-11-27 "M10 WP3"):** setup and transfer are 1 to 22 ms of it; the wait is the turn plan's remainder (about 1.8 to 1.95 s, the budget less the turn-start animation) plus decision searches the animation does not hide (0.4 to 2.3 s a turn), 2.3 to 4.3 s for the four turns measured. board.md §5.2's 1.8 s target holds only for the plan. **Measured miss (M10 fix round, M10-R3): in the app's millisecond mode a typical Warlord turn takes 9.2 s against the 8 s requirement, and the wait is 2.3 to 4.3 s against 1.8 s;** the requirement stays, the nightly bounds are 12 s and 6 s (1.5 times, and the worst measured wait plus headroom) and print requirement and observation. Options when someone owns it: start decision searches earlier than the previous move's animation (they are requested after the move is applied), or give a defence or follow-up decision a smaller budget than 400 ms. Both change the AI's strength or the pacing and need the strength gates.
- **Memoising the board's cards (M10 WP3):** `BoardCard` is not `memo`ised and its props are new objects each render; the human turn first drops frames at 8x CPU slowdown (the requirement is 4x). Worth doing only if the nightly's software compositor misses the bound.

## 15. OP-18 carries (docs/reviews/m6b-OP-18.md, 2026-11-27)

- ~~R4: Rookie and the AI helpers (`ai/src/session.ts` `counterOf`, `ai/src/choose.ts`, `ai/src/search/hint-line.ts`) read the printed Counter, so a Stage under OP18-021 Franky ranks as 0 for them; the search AIs and the review use the engine's value. The lethal profile (`ai/src/search/lethal/profile.ts`) also counts only printed Counters in the opponent's hidden hand, so it underestimates a Franky deck's defence. For Track C (Franky as an archetype).~~ Fixed 2026-11-28 (M11 Track C): `leaderCounterGrants` (`ai/src/knowledge.ts`) reads a Leader's public hand-Counter grant from its script and `counterValueOf(card, leaderId)` applies it (archetype average and biggest Counter, the lethal profile's plain Counter and defence bound, the review's hand totals, the lethal threat's own hand); Rookie takes the engine's value from the view. Tests `ai/test/counter-grant.test.ts`.

## 16. M11 Track C carries (2026-11-28)

- Franky OP18-021 lists in the cached OP18-era standings run OP08-067 Charlotte Pudding (5 of 11 decks), OP05-074 Eustass "Captain" Kid and OP05-040 Birdcage (block 2, held, unscripted). The three lists chosen need none of them, so the block-2 exception was not taken; script them (runbook new-set d to g) before a list that uses them is added. P-111 and OP05-076 appear in older EB02-010 decks (not in the chosen lists).
- The counter drill bank holds no Franky item and the lethal/DON!! banks few; the generators sample pairs by seed in order and stop at their class caps, so a Franky-specific item (a Stage played free, a Stage as the Counter) needs a seeded pairing for the leader.
- The mulligan trainer's unsourced rule (OP05-098, OP08-098, OP12-061 say "no sourced rule" or carry no handbook tag) still has no items; only EB02-010 and OP18-021 (labelled "our reasoning") were added.
