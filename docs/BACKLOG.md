# Backlog

Ordered by value (PROMPT.md "After M10"). Items carried from closed milestones carry their source.

1. **Warlord at least 65% against Pirate** (PLAN M5b target, not met; DECISIONS 2026-11-23). Measured 61.5% (123/200), flat in budget. Leads: tune the heuristic's weights by self-play on a larger sample than 200 games; give the opponent's turn in rollouts a policy that removes Characters and counters like a player; score defence decisions on shared samples. Use the parallel gate runner pattern (13 processes, about 13 minutes per 200 games) and always re-check on fresh seeds.
2. **M10 must close these M6 carries** (docs/reviews/m6-review.md; F17 states them as requirements): M6-3 arrow keys in the builder grid, Tab between panes, Enter/Backspace to add and remove, `A` to cycle art (F17 steps 1 and 6); N-2 the grid's 127 Tab stops (roving focus fixes it) and a skip link back from the deck pane; M6-14 colour and set filters, DON!! deck size, group by category; severity 1 items M6-11, 15, 17 to 21, N-4 (Setup's automation line beside an invalid deck; "Unknown card" for every card when loading fails).
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


## 5. OP-15 batch (2026-11-24)

- Engine: `play { from: 'self' }` plays the source card from wherever it now is, not from the zone the text names (found by the OP-15 group 2 scripter: OP15-080 Oars, paying the deck-bottom cost with Oars itself, would play it from the deck bottom). OP15-080 uses `from: 'trash'` with `isSelf`; OP17-015, OP16-014, ST30-008 pay hand costs and cannot hit it. Fix: the validator should reject `from: 'self'` play where a cost can move the source, or the runtime should check the source's zone.
- Engine (OP15-R2): `cannotBeRested` needs a source-card-type filter. OP15-024 Usopp "cannot be rested by your opponent's Leader and Character effects" over-protects against opposing Event and Stage effects (independent disagreement A-2, still an `it.fails`). `restrictionMod` and the derived `cannotBeRestedByOpp` boolean carry no source card type; the effect context knows the source card, so an `effectSource: ['Leader','Character']` qualifier on `by` is the fix. Accepted approximation until then.
- OP15-090 Perona (OP15-R5): with an empty hand the hand-trash replacement is offered and only "decline" is legal. The hand size is public, so it is only a needless prompt; left as is.
- ~~Engine/view (OP15-R7): skeleton versus view mismatch for a card being played at a "Character area is full, choose 1 to trash" prompt: `determinize.ts` `seenBy` treats a card on a `play` frame as known (CR 2-7-2) but `project.ts` `canSee` does not reveal it. Probe: review random games, life mode, seed 956, viewer p2, step 112, `projectForSearch(...).skeleton.state.cards.$k000009.card`. Tried adding the play-frame card to `canSee`: the skeleton mismatch disappears but `leaks.test.ts` "views and observed autoSkip are invariant under hidden permutations" fails. Either the view reveals it and the leak property exempts the card being played, or the skeleton stops treating it as known. No secret is shown today.~~ Fixed 2026-11-24: the view reveals a card past `pay` on a `play` frame (and hides its hand slot); see DECISIONS.
- Engine gap (not in the M6b-1 audit), for wave 4: `[DON!! xN] [On K.O.]` (OP14-051 Hatchan). A `donGiven` condition on an `onKO` auto reads the card after it is in the trash, where its DON!! have returned, so it never fires. `leaveField` already records `lki.don`; `runKo` passes only `{ cause }` to `fire`. Needed: `donGiven` on an `onKO` auto reads the last-known value (via `ev`, like G28 `koCause`). No scripted card uses the combination today (checked 2026-11-24).
