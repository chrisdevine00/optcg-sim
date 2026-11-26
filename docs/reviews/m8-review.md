# M8 review: review breadth

**Date:** 2026-11-26
**Reviewer:** an independent review by a subagent with no stake in the work. The brief was to find what is wrong.

**Build reviewed:** local `main` (head `889115ea`, all of M8, WP0 to WP7) merged into a clean worktree with its own `npm ci`. E2E ran on port 4848 against the production build.

**Rule:** any severity 3 or 4 finding fails the milestone. 4 = hidden-information leak or wrong game result; 3 = blocks a done criterion, a wrong or mislabelled flag, data loss, broken keyboard path or WCAG AA failure; 2 = notable defect; 1 = nit.

**M8 review: FAIL** (five severity 3 findings: M8-R1 to M8-R5). No severity 4 was found: no leak into the coach or a live board, no wrong game result, and the engine change moves no hash.

## What ran

| Check | Result |
| --- | --- |
| `npx vitest run engine ai app cards/test` | 3,019 files passed, 34 skipped; 31,928 tests passed, 26 expected fail, 13 skipped, 164 todo; 0 failed |
| `ENGINE_GAMES=3000 npx vitest run engine/test/property engine/test/golden` | 10 files, 32 tests passed (no hash or replay change from `verifyReplay`) |
| `REVIEW_GATE=1 npx vitest run ai/test/review-gate.test.ts` | 2 passed (84 s) |
| `E2E_PORT=4848 npx playwright test` | 357 passed, 41 skipped, **2 failed** (`local-save.spec.ts:148`, both projects; fails alone too, 3 of 3 runs) |
| 300-decision gate in the browser (production build, worker pool) | 303 decisions analysed in 16.7 s, progress lines shown (11 and 14 distinct); final status "1 flag · 4 not fully checked" |
| `npm run typecheck`; `npx eslint .`; `npx prettier --check .` | clean; clean; clean (apart from my own scratch file, since deleted) |

Not run: NVDA and VoiceOver (owner's).

## Findings

### M8-R1 (severity 3): a mulligan flag's detail says "Holds whatever they held"

`certaintyOf` (`app/src/play/review/model.ts:94`) gives a mulligan flag the guide label in the list and its screen-reader name. But the detail panel and Study render `ExplanationView` with `context="review"` (`ReviewFlow.tsx:797`, `:737`, `:954`). `certaintyLabel` only uses the archetype in the `guide` context, so the chip reads **"Holds whatever they held"**. A mulligan flag is the guide's advice, not a proof. explanations.md (line 71) requires "From the <Leader> guide (sourced)". The archetype prop is passed and then ignored. No test renders a mulligan flag's detail (`review-m8*.spec.ts` has no mulligan game).
**Fix:** pass `context={flag.kind === 'mulligan' ? 'guide' : 'review'}` at the three call sites. Add a planted mulligan game to the e2e and assert the label in the list, the detail and Study.

### M8-R2 (severity 3): the attack-target flag calls a Blocker "a Character that does nothing on the board"

`textFacts` (`explain-target.ts:74`) treats a Character as `nothingOnBoard` when its script has no ongoing ability. It ignores printed keywords. I replaced Hawkins in E09 with Blueno (EB01-017, a vanilla Blocker, no script). The detector flagged it: "Shiki should have attacked their Leader", with evidence "Blueno has no effect text. On the board it is a 2000-power Character." That is wrong. A Blocker is the card that stops the next lethal, and the `worthFlagging` gate exists to pass only cards whose text "does nothing". The same hole applies to any keyword-only Character (Rush, Double Attack, Banish). EB01-006 and EB01-054 (Blockers with the same shape) were not flagged, so the gate is also inconsistent. The flag is labelled `any-hand` and moderate.
**Fix:** `nothingOnBoard` also requires no Blocker, Rush, Double Attack or Banish keyword on the card. Add near-miss tests with a Blocker as the chosen target. Say "no effect text" only when the card has none and no keyword.

### M8-R3 (severity 3): a finished game is dropped when the save hits the quota or the 200-game cap

`GameSaver.observe` (`app/src/play/save-game.ts:77-82`) calls `unstashGame` in the failure branch as well as the success one, and never retries (`saved` is set before the write). I confirmed with a probe: a store that rejects `StoreQuotaError('max-games')` gives `id = null`, zero stash keys left, one reported error. The player sees "Saved games are full. Delete old reviews?" and "Open saved games", which implies deleting will make room. But the game they just finished, the one they want reviewed, is gone for good. That is data loss, on the one path the notice invites them to fix.
**Fix:** keep the stash on a quota failure. After a delete or successful save, flush stashed games (`flushStashed` already exists). Offer "Save this game" in the full notice. Alternatively evict the oldest unflagged game automatically, with consent. The e2e `storage full` test should then assert that the game appears after a delete.

### M8-R4 (severity 3): the e2e suite fails, and the cause is a real durability race

`local-save.spec.ts:148` ("the two M7 logs move ... still there after") fails in both projects, alone and in the full run: after "Delete for good" and a reload, "No tutorial runs are stored." is not shown, so the deleted run is back. With `waitForTimeout(1500)` before the reload it passes, so it is a race: `SyncKv` (`store/sync.ts`) writes memory first and IndexedDB behind a promise chain, and there is no `pagehide` or `visibilitychange` flush. A delete followed quickly by a reload or tab close resurrects the data, and a write to the tutorial or lethal-progress log can be lost the same way. A red suite also fails the verification ritual.
**Fix:** issue the IndexedDB write synchronously in `set` and `delete` (the chain only needs to preserve order). Flush on `pagehide`. Keep the spec as written.

### M8-R5 (severity 3): Study does not show the board where the player can see it

At 1280×720 and 1920×1080 on the production build (direct load of `/reviews/<id>`, then Study), the page is the explanation rail filling the first viewport. The board is below it, at y≈616 and 1,850 px tall, with its styling missing: grey boxes, unclipped, text overlapping ("Unofficial fan tool" over the zones), zones stacked in one column. DOM: 30 `[data-zone]` elements, page height 1,662 px (720p) and 2,460 px (1080p). `learning-ui.md` §4.1 says the board is the evidence and Study is the board page. The existing screenshots (`.cache/m8wp7/*-study.png`) show only the rail, which is how it passed: the keyboard walk and axe do not look at it. I did not check whether arriving through `/play` first (so the board CSS has loaded) renders it correctly. If it does, the cause is board CSS missing from the lazy review chunk. Either way a reloaded review page is broken. Practice and Play from here use the same board, so the same check applies to them.
**Fix:** import the board stylesheet from the review route chunk, and lay Study out as board plus rail. Add a screenshot assertion: the Leader zone is inside the viewport and the board is no taller than it.

### M8-R6 (severity 2): counter-wasted (b) is `any-hand` on a bound that rests on the sourced lists (OPEN-QUESTIONS M8-WP2-1)

The public bound counts board attackers and one Rush per hand card, priced at the cheapest Rush in `priorCardIds`. Nothing in the Rocks prior is a Rush Character, so the hand term is 0. It does not count draw-into-Rush, an Event that grants Rush, an in-play effect that re-activates, a Double Attack or Banish granted at attack time, or any off-list card. The label "Holds whatever they held" is therefore weaker than it says. The flag needs Life ≥ 3, so three further hits are needed to be wrong, which keeps it narrow. I rate it 2 rather than 3 for that reason.
**Fix:** drop to Hindsight unless the bound has slack of at least one hit, or reword the line to say "from their usual lists".

### M8-R7 (severity 2): the target flag is `any-hand` on four sampled hands

`judgeTarget` values both targets over K = 4 hands guessed from the prior and requires the better one to win in 3 of 4. That is a statistical claim, but it is labelled "Holds whatever they held". The gate (`worthFlagging`) was fitted to E08 and E09: board over face fires only when the better Character lifts their Leader's power, and face over board only for a text-less Character. E09 needs two spare active DON!! that the doc does not mention, and its evidence lines are a generic template. I checked E08 at their Life 1, 2 and 3: unflagged, so there is no false positive at low Life, but it is also silent in the cases a player most needs. See also M8-R2.
**Fix:** label it Hindsight, or "Likely", or prove dominance (the better target wins in every sampled hand).

### M8-R8 (severity 2): `verifyReplay` leaves the last turn and the result unchecked

Snapshots exist only at turn starts. The hash is not compared after the last one, and the final result is not compared with `meta.result`. A probe: the planted E19 record has one snapshot (index 0). The same record with its actions truncated verifies `ok: true`, and one with snapshots trimmed to index 0 and a different engine string verifies `ok: true, engineDiffers: true`. The last turn is exactly where missed lethal, should-counter and given-away live. An engine change in the final turn, or a hand-edited import, keeps a record "live" with a replay that no longer ends as recorded. (The engine property and golden runs at 3,000 games are unchanged; this is a gap in the check, not a regression.)
**Fix:** also store and compare a final-state hash and the result. The validator should require one snapshot per turn.

### M8-R9 (severity 2): "Not fully checked" copy promises what the search cannot give

The marker says "The analysis ran out of time on this turn" and offers "Analyse deeper". M8-2 measured that the three public-lethal markers do not settle even at 10× nodes (1.5M nodes, about 30 s). So the button mostly cannot help, and the cause is the search, not time. The gate was reworded to count only `deadline` markers, which is defensible against the PLAN done criterion (60 s with progress; passed at 16.7 s). But 4 of 9 reviewed turns (44%) say nothing about missed lethal on exactly the late-game boards where it matters, and the headline reads "1 flag · 4 not fully checked".
**Fix:** reword to "The search could not settle this turn", and show "Analyse deeper" once per turn, labelled with the cost. Track the sharper bound in BACKLOG §10 as the M9 priority.

### M8-R10 (severity 2): given-away covers only Blocker attacks and only a lost-by-damage last game

By design (DECISIONS "M8 plan"), but a player who gave a game away by a Character attack, or by not blocking, gets nothing. Mulligan flags only for sourced guides (OP05-098 and OP08-098 never).
**Fix:** document it in the in-app copy ("checked: Blocker attacks").

### M8-R11 (severity 2): stash dropped when saving is off; stash loss in private windows

With no IndexedDB (memory store, `durable` false), a finished game is only in memory: a reload loses it. The localStorage stash would still work. The notice does say "Export keeps a copy".
**Fix:** stash in memory mode too, and flush it on the next start.

### M8-R12 (severity 1): copy and nits

- Study note reads "as it stood at when your Main Phase began".
- Study has about 76 px of empty band at the top (the header is hidden).
- Opening a review replays the whole record on the main thread (`liveness` in `ReviewFlow.tsx:94`); an imported 20,000-action record would freeze the tab.
- `m8-plan` says the target flag's evidence uses Newgate's and Hawkins's own sentences; they are a template.

## What I tried that held

- **Hidden information:** the coach and live game never import the review store or worker (grep). No review announcement during Play from here or Practice (e2e passes, and the live-silence specs). Imports are validated with key and size limits and no network use.
- **Missed lethal:** the planted game is flagged `any-hand`, severe, with a replayable line. Wasted counter (a) and (b), should-counter and don-unused planted games are flagged with the doc's numbers.
- **Counter-wasted (b)** with the opponent at Life 3: correctly refuses when the bound reaches the needed hits.
- **Keyboard path** (History, review, Study, Practice, Practised) and axe on all review states pass in both viewports.
- **Gate:** 16.7 s for 303 decisions with progress shown. The scheduler deadline (55 s) bounds it on slower machines.
- **Engine change:** no hash, golden or replay change.

## Verdict

FAIL. Fix R1 to R5, re-run the e2e suite and take a screenshot of Study on a direct load.

## Fix round (ai and engine)

Date 2026-11-26. Part 1 of the fix round: R2, R6, R7, R8 and R10. The app findings (R1, R3, R4, R5, R9, R11, R12) are fixed in app/ in parallel and are not covered here. Each test below was run against the old code and failed; the fix was then restored.

| Finding | Fix | Fails on revert |
| --- | --- | --- |
| R2 (3) | `textFacts(cardId, cards)` (`explain-target.ts`): `nothingOnBoard` and `noText` also require no printed keyword (all six of the card data's keywords, read from the card and its script); keywords are listed in `labels` (`[Blocker]`). The face-over-board gate in `worthFlagging` therefore never fires on a keyword-only Character. | `ai/test/review/target-keywords.test.ts`: E09 with EB01-017 (vanilla Blocker) as the chosen target gives no flag (the old code flagged it with "no effect text"); keyword-only Characters for Blocker, Rush, Double Attack, Banish, Unblockable and Rush: Character are not "nothing on the board"; Hawkins still flags. Old code: 2 of 3 fail. |
| R6 (2, treated as must-fix) | The public bound of counter-wasted (b) (`hitBound`, `counter-wasted.ts`) now covers every hidden hand or the flag is not `any-hand`: a knapsack over the cards in hand within their active DON!! (not a greedy pick); each card's possible adds (Rush, re-activation, a granted Rush or Double Attack, a played Character); the cards their draws could bring in (every list card that draws or looks multiplies the hand); the DON!! their cards could add; effects already on their board (counted once, costs ignored); a Leader with no sourced list narrows nothing (every card in hand is two free hits). The Hindsight (actual) bound reads the real hand and the real top of their deck for what their draws would bring (to a fixed point), and DON!! adds. A [Trigger] ability is not read (it fires from Life). Where the bound fails and the real hand cannot prove it either, there is no flag; where only the real hand proves it, the flag is Hindsight (`needed-hidden-info`, never severe), as before. | `ai/test/review/counter-wasted-bound.test.ts` (7 tests): draw-into-more (one card in hand, 8 DON!!: bound 3, not 2), an in-play Zoro, an unsourced Leader, the Hindsight fall-back, real draws in hindsight, a granted Rush or Double Attack. Old code: 6 of 7 fail. The Luffy Hindsight position of `wp2-positions-more.ts` had Zoro (OP13-037) on the board; that re-activator is now counted, so the position uses vanilla Characters (the old test pinned the very gap). |
| R7 (2) | The target flag stays `any-hand` (its words are built from public facts only: the arithmetic, their hand size, the lists' biggest Counter; "Hindsight: needed their hidden cards" would be false for it), but the search behind it now asks more: K = 6 guessed hands (was 4) and the better target must win in **all** of them (`MIN_WINS = K`, was 3 of 4). Rationale in DECISIONS. Corpus rate: 1 of 948 attacks flagged (0.1%, 40 games), limit 2%. | `target.test.ts` "every condition of a flag is needed": K at least 6, `MIN_WINS === K`, `wins: states - 1` is not flagged. With K = 4 and MIN_WINS = 3 it fails. |
| R8 (2) | `RecordWithSnapshots` gets an optional `final: { actionIndex, hash, result }` (`finalOf`, written by `startRecord` and every `appendAction`). `verifyReplay` requires `final.actionIndex === actions.length` (a cut or extended record fails, `reason: 'hash'`, `at: 'length'`) and compares the summary hash and the result after the last action (`at: 'final'`). A record without `final` (older) is verified on its snapshots only and the result says so (`finalChecked: false`). The `reason` stays `'hash'` so `staleness.ts` needs no change. No hash, replay or `ENGINE_VERSION` change; the property and golden runs at 2,000 games pass unchanged. | `engine/test/records/records.test.ts` (3 new tests, 1 updated for `finalChecked`): final carried with the right hash and result; truncated actions, trimmed snapshots, a length edited to fit (the hash then differs), a forged hash and a forged result are each refused; trimmed snapshots alone still verify (the final covers the end); an older record is `finalChecked: false`. Old code: 4 of 23 fail. |
| R10 (2) | Scope limits recorded in `docs/design/m8-plan.md` ("Scope limits of the shipped flags") and BACKLOG §11. No code: a Character-attack or no-block extension of given-away needs its own comparison and corpus rate. The in-app copy line ("checked: Blocker attacks") belongs to the app part. | docs only |

### Needs the app part of the round

`sanitizeRecord` (`app/src/store/validate.ts`) rebuilds a record field by field and drops `final`, so a stored or imported record is verified on its snapshots only until it copies `final` through. `Session.restore` (rewind, `session.ts`) cuts `actions` and `snapshots` but keeps the old `final`: it must recompute it with `finalOf(state, index)` at the same time, or a rewound record would fail its length check once `final` is stored. Neither is needed for this part to be correct, and neither is made here (app/ belongs to the other agent). Logged in BACKLOG §11.

### Checks

| Check | Result |
| --- | --- |
| `npx vitest run engine ai cards/test` | 2,982 files passed, 34 skipped; 31,596 tests passed, 26 expected fail, 13 skipped, 164 todo; 0 failed |
| `ENGINE_GAMES=2000 npx vitest run engine/test/property engine/test/golden` | 10 files, 32 tests passed |
| `REVIEW_GATE=1 npx vitest run ai/test/review-gate.test.ts` | 2 passed (run beside the 40-game corpus) |
| target corpus, 40 games, Warlord vs Warlord | 948 attacks, 581 with more than one target, 1 flagged (0.1%, face over board); gap p95 3.5. The first test timed out at 30 min only because the corpus ran beside the full suite; the second test reused its result and passed |
| differentials (`target-differential`, `exact-differential`) | pass |
| `npm run typecheck`; `npx eslint .`; `npx prettier --check .` | clean |
