# M3 review: playable board (`/play`)

**Date:** 2026-10-28
**Reviewer:** independent milestone review (subagent). I did not write this code, and the brief was to find real problems, not to confirm the builder's report.
**Build reviewed:** `main` at `2d26fa1`, which includes `d4701b7` (the tablet defence panel change). I used the Vite dev server (http://localhost:5173/optcg-sim/), which serves the working tree. No repository code was changed.
**Specs:**
- `PROMPT.md` (the M3 row and the quality bar);
- `docs/PLAN.md` (the M3 row and its exit criteria);
- `docs/design/principles.md`, `board.md`, `flows.md` (F6, F11, F13b, F15 and F21), `accessibility.md`, `visual-system.md` and `explanations.md`;
- `docs/design/review-1.md` (UX-V11 and UX-V12);
- M1-37 and M1-38 in `docs/reviews/m1-review.md`;
- ARCHITECTURE §2.7 and §4.1–4.3.

**Severity:**
- 4: a leak of hidden information, a crash, or a wrong rule or rules number;
- 3: blocks or seriously misleads a user, or fails WCAG 2.2 AA;
- 2: a clear spec deviation or friction;
- 1: a nit.

Any severity 3 or 4 finding fails the milestone.

**M3 review: FAIL.** The blocking findings are M3-01 to M3-04 (severity 4, hotseat hidden information) and M3-05 to M3-08 (severity 3).

## Method

1. **Read the specs and code.** I read the specs above, then all of `app/src/play/**`, `app/src/session/**` and `ai/src/**`, and the e2e specs (`defence`, `game`, `keyboard`, `board-states`, `rewind`).
2. **Screenshots.** A helper subagent reviewed all 58 builder PNGs in `.cache/m3/` against `board.md`, `visual-system.md`, `accessibility.md`, UX-V11/V12 and M1-37/38. It recorded zoomed crops in `.cache/m3-review/shots/`. I folded its findings in (M3-14 to M3-22) and spot-checked the ones I cite. After `d4701b7` landed, I re-took the tablet defence states myself: `.cache/m3-review/tab-{1024x690,1180x740,1280x720}-*.png`, with measurements in `tablet-defend.txt`.
3. **Drove the real app with Playwright** (Chromium from the repo's install). The scripts are in `.cache/m3-review/`, which is gitignored; each writes its own transcript there.
   - **`ai-game.mjs`:** a full game vs Rookie at 1280×720, seed 101. It covers Skip during an AI turn, U (rewind) during a Block window, resizing mid-game (1024×690, 1920×1080, 968×590, 900×590, then back to 1280×720), game over and rematch by Enter. It records the live-region transcript (a MutationObserver on both regions), the focus trail, every change of `data-kind` and title, and an `ariaSnapshot()` per state (`aria-*.yml`).
   - **`hotseat.mjs`:** a full hotseat game at 1280×720, seed 202, to game over. At every defence and damage window it records what is readable while the defender's hand is veiled.
   - **`leak.mjs`:** the `defend` hotseat scenario. It dumps `innerText`, `textContent`, every `aria-label`/`title`/`aria-valuetext`/`alt`, both live regions and the aria snapshot at the curtain, the attacker's main phase, the veiled defence, R held, R released after staging, and Blocker plus a short Counter. Then it presses Enter.
   - **`hotseat-rewindlist.mjs`:** opens the game menu's Rewind list during a veiled defence.
   - **`keyboard.mjs`:** Tab order, a keyboard-only start and Main Phase, and a keyboard defence (`scenario=skip`).
   - **`insp.mjs`:** inspector and dialog focus return.
   - **`m1.mjs`:** M1-37 and M1-38 spot checks.
4. **Hidden information.** I traced every path from the session to the DOM and to the worker:
   - `GameSession.view` and `log`;
   - `controller.logLines`, `afterApply` and `say`;
   - the curtain and the veil;
   - `simulate`, `translate` and `AiClient`.

   For each path I checked whether projected data for one seat can be rendered while the other player is the one looking.

## What held up (no finding)

- **The AI receives views only.**
  - `aiStep` sends `session.view(d)`, which is `project(state, d)`.
  - Rookie picks only from `view.actions`, using the seeded `nextInt`.
  - Its lethal check follows CR 7-1-4-1: a tie goes to the attacker, so the check is `attackerPower >= leaderPower` at 0 Life.
  - In the game, Rookie countered the lethal attack with its largest Counter: "Kaido: Counter: Basil Hawkins +2000 · Hit · 8000 vs 7000 · Game over" (`ai-announcements.txt`).
  - The one exception is the `init` payload (M3-09).
- **Rules numbers on the board and in the panels agree with the engine** in every state I checked:
  - "Need +N" is always attacker − defender + 1000. That gives 7000 vs 5000 → +3000, 7000 vs 7000 → "Ties go to the attacker · Need +1000 more", and 9000 vs 1000 → +9000.
  - The log says "· ties go to the attacker" on an equal hit.
  - Life arrows match the Life counts. DON!! active + rested + given + deck = 10.
  - The confirm panel says "Wins the game if it is not stopped" at 0 Life.
  - Defender DON!! show "(no bonus on the opponent's turn)".
  - The one wrong number is the breakdown in M3-05.
- **Defence commits for an attack on the Leader:**
  - Nothing staged: Enter does nothing, and "Take the hit" needs focus, then Enter.
  - Short or tied: Enter does nothing, and the footer is "Play anyway · still hits" plus "Take the hit · staging discarded".
  - Enough: "Counter +3000 · survive · 8000 vs 7000" on Enter, with "Take the hit" beside it.
  - These hold by mouse (`defence.spec.ts`) and by keyboard (`keyboard.txt`). The exception is the Blocker case (M3-05).
- **The hotseat veil works where it was built.**
  - The board's hand is replaced by "…press and hold R".
  - The Counter lane and the Trigger body are generic while veiled.
  - The opponent's hand is always shown as backs.
  - Game over shows no hand.
  - The engine-level checks hold: the opponent sees "Your opponent is taking damage", and the Counter window is not auto-skipped while the defender holds cards.
- **AI pacing.**
  - The "considering" beat is uniform.
  - Skip stops at the next human decision and never decides for the player.
  - U during an AI attack's Block window rewound cleanly ("Back to: before end of turn. Same shuffle…"), and the pump restarted with no error.
  - There were no page errors or console errors in about 250 decisions across both full games.
- **Resizing mid-game** re-lays out at 1024×690, 1920×1080 and 968×590 with no scroll. At 900×590 it shows "The board needs a bigger screen", and the game resumes intact at 1280×720.
- **Game over and rematch.**
  - Assertive "Game over. You win on turn 11."
  - The banner reads "You win · Turn 11".
  - The panel carries the reason and "Rewound: not counted in your win rate".
  - Enter starts the rematch, in which the loser (the AI) chose to go second.
- **Keyboard.**
  - There is one tab stop per zone, in board reading order: opponent identity, opponent row, opponent Characters, midline, your Characters, your row, hand, decision, log, rail.
  - The skip link comes first. G-then-letter navigation, arrows, Space staging ("staged 1 of 2" in the card's name), U/Shift+U and R all work.
  - Focus moves to the decision heading when a defence opens.
  - The inspector returns focus to its card on Escape.
- **UX-V12 is fixed** at 1280×600, 1024×690 and 1180×740. No footer label overflows, and no tall body scrolls. After `d4701b7` the tightest state (1024×690 tie) has 101 px of slack (`tablet-defend.txt`).
- **The tablet defence panel after `d4701b7`** (the coordinator asked for this check):
  - The tie rule is still clear: the result line reads "✕ Ties go to the attacker · Need +1000 more", and the warning line reads "7000 vs 7000 still hits".
  - The staged sources are clear while R is held: the Counter lane marks each with ✓, and the breakdown reads "5000 + 2000 staged".
  - With the names dropped from the breakdown, the tablet no longer has the M3-03 leak; 1280 and 1920 still do.
  - Losing "· ties go to the attacker" from the staging hint loses nothing, because the rule appears wherever it applies.
- **M1-37 holds:** at 1280 on OP-14, no status chip intersects a plate (0 overlaps). **M1-38** is covered by `cards.spec.ts` "inspector reflows"; I did not re-measure it independently.

## Findings

| ID | Sev | Area | Problem | Evidence | Fix |
| --- | --- | --- | --- | --- | --- |
| M3-01 | 4 | Hidden info: hotseat curtain | **Under the handoff curtain, the DOM and the accessibility tree hold the incoming player's hand, and Tab reaches it.** `updateSeat` switches `seat` before the curtain lifts, and `Game` renders `ctl.view()` for the new seat behind the curtain. The board is neither `inert` nor `aria-hidden`. While the curtain says "Both hands are hidden", the aria tree contains `group "Player 2's hand, 1 cards": button "Player 2's Komachiyo, Character, cost 1, Counter +1000, 3000 power"`. Pixels hide it (the overlay is at 0.96 opacity with a blur), but the outgoing player's screen reader reads it, and Tab from the curtain button moves focus onto board and rail controls behind it (M3-07). The event log behind the curtain is also already the incoming player's projection. | `.cache/m3-review/leak-01-curtain-p2.txt` (the aria section); `hotseat-report.txt` ("Tab from curtain focuses …"); `Game.tsx:875–934, 1075–1098`; `controller.ts:449–462` | While `curtainFor` is set, render the board and rail from a **neutral view**: both hands as backs, and the log only up to the handoff, projected for the outgoing seat or empty. Mark everything except the curtain `inert`. Swap to the incoming seat's view only in `liftCurtain`. Add an e2e check: under the curtain, no hand card's name appears in `textContent`, any `aria-*` attribute or the aria snapshot. |
| M3-02 | 4 | Hidden info: log and live region during a veiled defence | **While the defender's hand is veiled and the attacker is looking, the screen shows the defender's private log, and the live region speaks it.** On a defence the seat flips to the defender (`updateSeat`), so `logLines()` re-projects the whole log for the defender. After "Add to hand" the polite region says, and the ticker shows, "Life card to hand: Basil Hawkins · Player 2's Life 5 → 4". That line stays visible in the ticker for the next attack's veiled defence. The reverse happens too: after the defence the attacker's seat returns with the "click" veil, the panel is no longer tall, and the full log shows the attacker's own "Refresh · Draw: X" lines to the defender who is still at the screen. Seen 7 times in one game. | `hotseat-report.txt`: "after Add to hand (veil=1): polite=…", and "[defend t11] LEAK? private log lines readable while veiled"; `controller.ts:180–198, 391–405`; `Game.tsx:948–957` | While `handHidden()` is true, build the log and the announcements from the **public** projection: a third, observer view with neither hand, or the line text with card names stripped for hidden-zone moves ("Life card to hand"). Announce a private line only once the owner's own view is unveiled, or not at all in hotseat. Add a hotseat e2e that checks the log and both live regions for private names whenever `.hand-veil` is present. |
| M3-03 | 4 | Hidden info: staged Counters after R is released | **Releasing R leaves the staged Counter names on screen.** flows F13b says "Releasing R hides the hand again but keeps staged items (shown as face-down '2 staged')". At rails of 320 px and wider (1280×720, 1920×1080), the Defender breakdown reads "5000 + 2000 staged (Marco, Karoo)" while veiled. With the Blocker staged the button also reads "Block with Franky · +1000". `d4701b7` removed the names on rails narrower than 320 px for layout reasons, which fixes the tablets by accident. | `leak-05-defend-staged-R-released.txt`; `tablet-defend.txt` (1280x720 "released-tie": "5000 + 2000 staged (Marco, Karoo)"); `tab-1280x720-released-tie.png`; `Decision.tsx` `breakdownDef` (about line 956) | When `ctl.handHidden()` is true, render the count only ("2 staged") at every rail width. Add an e2e assertion that no staged card name is in `#decision` after `keyboard.up('r')`. |
| M3-04 | 4 | Hidden info: rewind list and menu during a veil | **The game menu's Rewind list is open to whoever is looking during a veiled defence, and it lists the defender's draws by name.** It showed "Refresh · Draw: Charlotte Linlin · DON!! +2" while Player 2's hand was veiled. `RewindList` lists every line whose actor is `g.me`, which is now the defender. "Back to my last decision" and U in that state also undo moves for a seat that has not shown itself (see M3-24). | `hotseat-report2.txt` ("REWIND LIST while veiled: …"); `hotseat-rewindlist-veiled.png`; `Dialogs.tsx:193–240`, `GameMenu` | Disable the Rewind list (and U, Shift+U and the log's ⟲ buttons) while `handHidden()` is true or a curtain is up. Or build its lines from the public projection, as in M3-02. |
| M3-05 | 3 | Defence planner: Blocker plus Counters | **Staging Counters before choosing a Blocker leaves them aimed at the Leader. The panel shows a false breakdown, and Enter commits the wasted Counters.** `toggleCounter` fixes each Counter's target when it is staged (`defendingTarget` is the Leader then). Choosing Franky afterwards does not retarget them. flows F6.5 says "The player can stage counters first and then pick a Blocker". With 3 staged and then Franky, the panel reads "Defender Franky **2000 + 3000 staged** · 5000", which is wrong: Franky is 5000 base, and his power gets none of the 3000. It also reads "✕ K.O. · Franky · Need +3000 more", and the primary is "**Block with Franky · +3000** (Enter)". The board meanwhile shows the Leader at 8000. Pressing Enter sends block plus three Counters on the Leader: the log reads "Block: Franky · Counter: Marco +1000 · Hit · 7000 vs 5000 · K.O. Franky". This breaks "Enter never commits a counter that the preview shows as useless" (flows F6.3, C17, UX-R2), which the builder claimed. The `s.blocker` branch of the footer has no short or "Play anyway" state at all. | `tab-1024x690-block-plus-counters.png`; `tablet-defend.txt` (all three sizes, "block-plus-counters"); `leak.mjs` output (Enter committed and the Counter was wasted); `Decision.tsx:895–908, 954–960, 1071–1083` | Store staged Counters without a target and resolve the target at commit (and in `stagedActions` for the preview) as `defendingTarget(g, s)`. Or retarget every staged Counter when the Blocker changes. Apply the same short / enough / Play-anyway footer logic in the Blocker branch: with a Blocker and staged Counters that still lose, the primary must not have Enter. Compute the breakdown from the defender's own base power. Add a test: stage, then block, then check the numbers and that Enter does nothing. |
| M3-06 | 3 | Hotseat on tablets | **On a touch device, the defender can never see their hand.** The only reveal is a keyboard R keydown/keyup (`Game.tsx:430–434, 713–724`). flows F13b specifies "R (or a long press on the hand)", but the `.hand-veil` button has no pointer handlers in the "hold" state (`Board.tsx:517–528`). On the 1024×690 and 1180×740 targets in hotseat, Counters and Triggers cannot be staged or seen, so the defender can only take the hit or block blind. The veil text also tells a touch user to "press and hold R". | `Board.tsx:517–528`; `tab-1024x690-hidden.png` | Add `onPointerDown`/`onPointerUp`/`onPointerCancel`/`onPointerLeave` on the veil to set and clear `setReveal`. Word the veil for the input in use ("Press and hold here or R"). Clear the reveal on `blur` and `visibilitychange` (M3-13). |
| M3-07 | 3 | Accessibility: curtain focus (WCAG 2.4.11, 2.4.3) | **The handoff curtain is `aria-modal` but does not trap focus.** One Tab from "I'm Player 2 · show my side" moves focus to "⟲ Rewind U" or to `<main>` behind the opaque overlay. The focused element is then fully obscured, which fails 2.4.11 Focus Not Obscured (Minimum), an AA criterion. The keydown handler swallows Space and Enter, so the user is stuck with no visible focus until Space. | `hotseat-report.txt` (every "CURTAIN: … Tab from curtain focuses …" line); `Game.tsx:1075–1098` | Make the rest of `main` `inert` while the curtain is up (this also fixes the tree part of M3-01), or render the curtain as a native `<dialog>` with `showModal()`, as the other modals already are. |
| M3-08 | 3 | Accessibility: battle maths not announced (WCAG 4.1.3) | **Nothing announces the defence numbers.** flows F6.1 specifies an assertive line: "Kaido attacks your Leader. Kaido 7000, your Leader 5000. You need 3000… You have 3 counter cards worth 5000. Plan your defence." The build says only "Kaido: Kaido attacks your Leader" (polite). F6.3 specifies a polite line after each staging change ("Staged Sai, plus 1000. … still hits. Need 1000 more"), but staging by Space changes the result line silently: `polite` stayed "Kaido: Kaido attacks your Leader" through two stagings. The result line is not a status region. A screen-reader user hears no "still hits" or "survive" status as they stage, and that is a status message under 4.1.3. | `keyboard.txt` ("stage a counter by keyboard" block); `ai-announcements.txt`; `Decision.tsx:1071–1083` (no announcement), `controller.ts:422–431` (`announceDecision` changes focus only) | On a defence decision, announce the F6.1 line assertively, built from the panel's own numbers. In `toggleCounter` and on a Blocker change, call `ctl.announce` with the F6.3 sentence. Also announce F6.7 ("Attack stopped. Your Leader 8000.") after commit. |
| M3-09 | 2 | Hidden info: AI worker input | **The worker's `init` carries the card data for every card in the human's deck.** `AiClient` is built with `[...cards.values()]`, which is `loadCards` of both decklists. That is more than a `PlayerView`, and it gives the AI the human's card pool, which ARCHITECTURE §4.3 forbids ("The AI never samples from the human's actual decklist"). Rookie reads only its own hand's Counter values, so play is unaffected now. Pirate and Warlord will read whatever is in that map. | `controller.ts:111`; `ai-client.ts:32`; `ai/src/worker.ts:15–17` | Send only the AI's own decklist's cards at `init`, and look up any other card when it first appears in a view: the face-up card id is in the view, and the public card data can come from a static per-set import inside the worker. Add a test that `init` contains no card id unique to the human's deck. |
| M3-10 | 2 | Live region and log wording | **Announcements credit lines to the wrong player and use jargon.**<br>• Prefixing with the move's actor turns your own draw into "Kaido: End of turn. Turn 3 · You. Refresh · Draw: Gloriosa".<br>• Your own hit reads "Kaido: Hit · 8000 vs 7000" (the AI's endCounter is the move).<br>• "Opp" is read aloud ("Turn 2 · Opp", "Kaido: Opp chose to go second").<br>• There is no explicit "Your turn" at the handoff.<br>• F15's polite "Review this game, Rematch, New game, Home" after game over is missing. | `ai-announcements.txt`; `controller.ts:390–405`; `text.ts` `tag()` | Announce per log line with that line's own actor, not the move's. Say "Opponent" or the Leader name, never "Opp". Add "Your turn" on `TurnStarted` for the screen's player. |
| M3-11 | 2 | Skip recap | **The "While you skipped" recap appears in the wrong place and goes stale.**<br>• `recap` renders only in `waitingContent`, so it shows on the **next** AI turn, not when the player arrives at their decision (flows F21 step 4).<br>• Nothing clears it: `dismissRecap` has no caller. One Skip on turn 4 was still showing on turn 6, after a rewind.<br>• Its lines have no actor ("End of turn", "Refresh · Draw: Miss Buckingham Stussy" is the player's own draw).<br>The polite "Skipped 2 moves…" line is correct. | `ai-game.mjs` diagnostic in an earlier run (the decision HTML on turn 6); `controller.ts:586–600`; `Decision.tsx:351–360` | Show the recap in the decision panel where Skip stopped. Clear it on the next action and on rewind. Prefix each line with its actor. |
| M3-12 | 2 | Damage decision vs the AI | **The Life-card decision flashes and resolves itself.** Against Rookie, `autoSkip(observedByOtherHuman: false)` adds a Life card with no [Trigger] to hand. The panel "Damage · your top Life card" still renders for under 100 ms first (`data-kind` went block → trigger → waiting, 38 ms and then 89 ms, with no input). One run's script found `data-kind="trigger"` with no `#trigger-hand` button. The player never sees which Life card they gained except in the log. Separately, when the decision does show (hotseat), it has text only and no card face (board.md §3.12, F6.8), and focus starts on "Add to hand", not Activate (C9). | `ai-kinds.txt` (10330→10368→10457 ms); `.cache/m3/*-trigger.png`; `controller.ts` pump autoSkip; `engine/src/game.ts:105–124` | Either never auto-skip the damage decision (F6.8 says "never auto-skipped"; it is cheap and teaches what you drew), or skip it before any render, with a toast or announcement "Life card to hand: X". Render the card face in the tall body, as specified. |
| M3-13 | 2 | Hotseat reveal can stick | `setReveal(false)` runs only on `keyup` of R. If the window loses focus while R is held (alt-tab, a click outside the window, a system dialog), the defender's hand stays revealed with no key held. | `Game.tsx:713–724` (code read; not reproduced in headless) | Clear `revealHeld` on `window` `blur`, on `visibilitychange`, and when `handVeil` changes. |
| M3-14 | 2 | Card face aspect ratio | The preview dock and inspector card renders about 240×176 at 1080 and 104×116 at 720. At 720 that is *smaller* than the 84×117 board card. The mulligan fan is 145×175 and 97×117, so the width is scaled but not the height. With real art and `object-fit: cover`, about half the scan is cropped. | `.cache/m3/1080p-defend-preview.png`, `720p-inspector.png`, `720p-mulligan.png`; crops in `.cache/m3-review/shots/` | Keep 63:88 everywhere (board.md §2.1). Preview art is 168×235 / 240×335 (§3.12); the mulligan fan is 97×135 / 145×202 (§3.14). |
| M3-15 | 2 | UX-V11 only partly fixed | The defence preview no longer covers your Character slots 1–2, but:<br>• at 720 it covers the opponent's Character slot 1 and their whole cost area, a plate accessibility §4.2 says must never be covered;<br>• at 1080 it moved right and now covers slot 5 on both sides and the opponent's Deck and Trash counts, and clips the stepper to "Counter › Damag";<br>• at 720 the attack confirm covers your slot 1 and your cost-area count. | `.cache/m3/720p-defend-preview.png`, `1080p-defend-preview.png`, `720p-attack-confirm.png` | Add every count plate and the midline to the `avoid` set in `placeDock`. If nothing fits, dock over the log, as the reveal tray does (board.md §3.12). |
| M3-16 | 2 | Attack arrow stacking | The confirm arrow draws over the attacker's power plate and its "✓ Selected" chip. The defence arrow covers the first digit of Franky's "5000" and his "✓ Blocking" chip, and Franky's plate does not grow 1.25×. Spec: board.md §2.3 (plates and chips above `--z-arrow`, UX-R13) and §3.10. | `.cache/m3/*-attack-confirm.png`, `*-defend-block.png`; `tab-1024x690-R-tie.png` | Raise `.bp` and `.cchip` above `.arrow` (z-index). End the arrow at a ⌖ that avoids the name band. Scale both battle cards' plates. |
| M3-17 | 2 | Forced colours (known) | The focused legal card loses its legal ring (only the Highlight ring shows). Cards without a ring have no border, and the DON!! tokens lose their shapes. The builder lists the double ring as not done. | `.cache/m3/1080p-forced-colours.png`, `720p-forced-colours.png` | The `forced-colors` rules in visual-system.md §4: a ButtonText legal outline plus a Highlight focus outline with an offset, a CanvasText card border, and token borders. |
| M3-18 | 2 | Tablet target size | At 1024×690 and 1180×740, the Block/Counter lane chips are about 23 px tall and "Clear Esc" is about 27 px. The rail icons are small glyphs. board.md §6.2 says "every button is at least 44 × 44" on tablets. They pass WCAG 2.5.8 only through the spacing exception. | `.cache/m3/1024x690-defend-plan.png`, `tab-1024x690-R-tie.png` | Make the lane chips at least 44 px tall on `narrow-rail`. The slack measured in `tablet-defend.txt` (101–163 px at 1024) leaves room. |
| M3-19 | 2 | Step pace | During an AI turn at Step pace, "Next move ." is the secondary and looks disabled. Skip is the primary, and no Pause button shows. board.md §5.3 says "the primary button reads 'Next move'". | `.cache/m3/720p-ai-turn.png`; `Decision.tsx:381–405` | At Step pace: primary "Next move (.)", secondary "Skip to my decision"; keep K. |
| M3-20 | 2 | 1280×600 hand overlap | A hovered or staged hand card rises over the defending Leader's name and ⌖ crosshair. | `.cache/m3/1280x600-defend-tie.png`, `1280x600-defend-stop.png` | At the peek density, raise staged cards by the peek amount only. |
| M3-21 | 2 | Trash scrim and game-over turn bar | The trash viewer's scrim dims the rail disclaimer to 1.70:1 (board.md §3.1 and §3.12 say it stays visible). The game-over board still shows the turn bar (UX-V9). | `.cache/m3/720p-trash.png`, `720p-game-over.png` | Exclude `.rail-notice` from the scrim. Hide `.turnbar` when `view.result` is set. |
| M3-22 | 2 | Full-area choice context | When the Character area is full, the choice panel never names the card being played. It has no Cancel (flows F4b step 3: "Esc cancels the whole play"), its order differs from the board, and the candidates lack the "not a K.O." label on the card. | `.cache/m3/720p-choose.png` | Title it "Make room for X". Add Cancel (Esc), which drops the play. Use board order. |
| M3-23 | 2 | Not built (builder's own list) | These are spec items the builder did not build. They are listed so they stay tracked; none blocks alone:<br>• drag (PROMPT's M3 row: "click and drag interactions"; board.md §4);<br>• hotseat rewind consent (F11);<br>• save and resume (F13b.6);<br>• the "Why?" chip on AI log lines;<br>• the "you look away" line (F13b.3);<br>• the forced-colours double ring (M3-17). | builder report; flows F11, F13b | Schedule them in PLAN before M3 is marked done, or record each deferral in DECISIONS with the milestone that takes it. |
| M3-24 | 2 | Hotseat rewind | In hotseat, `humans()` is both seats, so U from the defender's veiled seat undoes the **attacker's** attack with no consent. The defender can also rewind into a position whose hidden state belongs to the other seat (the curtain then appears, so the earlier leak is not repeated). This is part of the "consent" gap above, but it is reachable by one key during every defence. | `controller.ts:622–654` | Until consent is built, limit U, Shift+U and R in hotseat to moves of the seat that is currently unveiled, and disable them during a veil (M3-04). |
| M3-25 | 2 | Dialog focus return | After `?` and then Escape, focus lands on `<main>`, not on the card that was focused (accessibility §4.3). The inspector returns focus correctly. | `insp.mjs` output ("after closing sheet: Skip to decision…"); `Dialogs.tsx` `Modal` (likely: the native `dialog.close()` in the effect cleanup runs after `onClose` has focused the card and moves focus again) | Focus the remembered element after the dialog unmounts (`requestAnimationFrame`, or in the cleanup after `close()`). |
| M3-26 | 1 | Nits | • "1 cards" ("Player 2's hand, 1 cards", "trash, 1 cards").<br>• A Blocker candidate's name says "can be targeted" (it should say "can block").<br>• The midline activity button's name repeats itself ("Kaido attacks your Leader Kaido attacks your Leader", `aria-defend.yml`).<br>• Under the curtain, the panel title is "Your turn" with "Player 2 is in its Main Phase" ("its" for a human).<br>• A tablet footer's sub-label touches the viewport bottom ("Life stays 3", `tab-1024x690-block-plus-counters.png`).<br>• The ⌖ and arrowhead sit on the target's name.<br>• The tablet hint says "Click lit hand cards".<br>• The subagent's other sev-1 notes (hand glyph overhang, stepper future-phase outline, Life plate position, ⟳ glyph size, cut-off pinned inspector and shortcut sheet at 720) are in `.cache/m3-review/shots/`. | as cited | Fix in passing. |

## Builder claims: what I verified

| Claim | Verdict |
| --- | --- |
| The board follows board.md | **Mostly.** Zones, counts, the stepper, the rail, the 1024/1180 adaptations and the peek hand match. The deviations are M3-14, M3-15, M3-16, M3-20 and M3-21. |
| Every decision type in flows.md has a panel | **Yes:** chooseFirst, mulligan, main, target, confirm, DON!!, Count, block/counter, trigger, choose, optional and order. The optional and order panels are generic (no effects until M4). |
| The defence planner commits once, "Take the hit" is always available, and Enter never commits a short Counter | **Partly.** One commit and an always-visible Take the hit: **yes**. Enter never commits a short Counter: **false** when a Blocker is staged (M3-05). |
| AI pacing, a thinking state, Step and Skip | **Yes.** Skip stops at a decision; the recap is misplaced (M3-11). "Thinking…" appears only past 300 ms, which Rookie never reaches, so I saw only the "considering" beat. Step pace works, but the button roles are swapped (M3-19). |
| Hotseat handoff curtains; the defender holds R to see the hand | **Built, but leaks:** M3-01 to M3-04. There is no touch path (M3-06), and the curtain does not trap focus (M3-07). |
| Rewind on U, Shift+U and R | **Yes vs the AI**, including mid-battle. In hotseat it is unrestricted (M3-24), and R is overloaded (the reveal during a veil, the rewind list otherwise). |
| The inspector returns focus | **Yes.** Dialogs do not (M3-25). |
| Live regions, one tab stop per zone, the shortcut set | **Yes for the structure:** two regions present from load, alternating polite nodes, one stop per zone, and the shortcut sheet matches the keys. The content falls short (M3-08, M3-10). |
| UX-V11 fixed | **Partly** (M3-15). |
| UX-V12 fixed | **Yes**, including after `d4701b7`. |
| M1-37, M1-38 fixed | M1-37: **yes** (0 chip/plate overlaps). M1-38: covered by the e2e test, not re-measured. |
| Not done (drag, hotseat rewind consent, save/resume, the "Why?" chip, the look-away line, the forced-colours double ring) | Confirmed not done (M3-23). |
| Hidden information is safe | **No** in hotseat (M3-01 to M3-04). **Yes** vs the AI, except the `init` payload (M3-09). |

## Screen-reader proxy

**This is a proxy, not a real VoiceOver or NVDA pass.** I read Playwright `ariaSnapshot()` output for each state (`.cache/m3-review/aria-*.yml`, `kbd-defend.yml`, `leak-*.txt`). I logged both live regions with a MutationObserver over a whole game (`ai-announcements.txt`, 69 announcements). I recorded the focus trail (`ai-focus.txt`) and walked a keyboard-only start, Main Phase and defence (`keyboard.txt`). The manual screen-reader pass that PLAN's M3 exit requires is still owed.

**What a screen-reader user would get.**

- **Structure is good.**
  - The page has an h1 ("OPTCG Sim game: You vs Kaido"), an `application` board named with turn and phase, and named groups per zone ("Your Characters, 1 of 5").
  - Each card's name carries owner, name, state, power, DON!! with "(no bonus on the opponent's turn)", cost, keywords and the legal verb ("can attack", "can be played", "staged 2 of 2").
  - Hidden zones say "face down" and give a count. The decision is a region named by its heading, and the log is a list.
- **Turn flow is followable but noisy and sometimes mis-attributed.**
  - Each move is announced once, politely, and there is no spam: one line per move, and skipped moves collapse into "Skipped 2 moves. …".
  - Your own moves are echoed ("Play Gloriosa", "Give 1 DON!! to Rocks.D.Xebec"), which is acceptable.
  - Attribution is wrong in places, for example "Kaido: … Draw: Gloriosa" (M3-10). "Opp" is spoken as a word, and there is no "Your turn" cue.
- **Defence is the gap.**
  - When attacked, the user hears only "Kaido: Kaido attacks your Leader", and focus moves to the heading "Defend your Leader · Kaido attacks". They must read the panel to learn "Need +3000".
  - Staging with Space changes the card's name to "staged 1 of 2", but the result ("still hits", "Ties go to the attacker", "survive") is never spoken (M3-08).
  - Enter correctly refuses a short commit, but silently: nothing says why.
- **Game end works:** an assertive "Game over. You win on turn 11.", and focus moves to the panel heading. The follow-up list of options (F15) is missing.
- **Focus.**
  - Tab order matches the reading order, and Tab moves between zones while arrows move within one.
  - Focus never lands on `aria-hidden` content.
  - It does land on obscured content behind the hotseat curtain (M3-07).
  - It is lost to `<main>` after closing the shortcut sheet (M3-25).
  - After Keep at the mulligan, it rests on "⟲ Rewind" in the next panel, which is acceptable.
- **Hidden information in the tree.** In hotseat the tree holds the other seat's hand under the curtain (M3-01), and the live region speaks the defender's Life card while the veil is down (M3-02). Neither happens against the AI: every name I found in the tree or the regions in AI games was public or the human's own.

## Disposition

**Blocking (fix, then re-review):**
- M3-01 to M3-04 (hotseat hidden information). Most of these share one fix: never render a seat's private projection while that seat is veiled or curtained.
- M3-05 (Blocker plus Counters).
- M3-06 (touch reveal).
- M3-07 (curtain focus).
- M3-08 (battle maths announcements).

The rest (severity 2 and 1) should be fixed or deferred with a DECISIONS entry. The manual screen-reader pass is still required by PLAN's M3 exit criteria.
