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

---

## Re-review 1

**Date:** 2026-10-29
**Build reviewed:** `main` at `f1cebdc` (fixes `405751b` and `c379298`; CI run 40815495263 green).
- I served it from a clean detached worktree (`.cache/m3-rr1/head`, Vite on :5174), so the M4a builder's uncommitted `engine/` work played no part.
- Mutation runs used a second scratch worktree (`.cache/m3-rr1/mut`, Vite on :5175). Every mutation was reverted with `git checkout`, and the worktree ended clean.
- I changed nothing in the main tree.

**M3 re-review 1: FAIL.**
- No severity-4 finding remains open. All four hotseat leaks are fixed, and I could not break the public view.
- Three new severity-3 findings block the milestone:
  - M3-27: a keyboard dead end after inspecting a card during a reveal;
  - M3-28: game over is silent after any defence, a regression from the M3-08 fix;
  - M3-32: on touch, the defender can see their hand but cannot stage a Counter.

### Method

1. **Re-ran my round-1 probes against :5174.** All transcripts and screenshots are in `.cache/m3-review/` (the round-1 names) and `.cache/m3-review/rr1/`.
   - `leak.mjs`: the curtain, the veiled defence, R held, R released, then Blocker plus a short Counter.
   - `hotseat.mjs`: a full hotseat game, seed 202.
   - `ai-game.mjs`: a full game vs Rookie with Skip, a mid-battle rewind, resizing, game over and rematch.
   - `keyboard.mjs` and `insp.mjs`.
2. **New probes, written to break the public view:**
   - `rr-curtain.mjs`: curtain focus and the accessibility tree;
   - `rr-break.mjs`: the inspector pinned during a reveal, window `blur` while R is held, U / Shift+U / Ctrl+Z and the menu while veiled, the damage decision veiled and then revealed, the live regions after a reveal ends, and the attacker's resumed seat;
   - `rr-k.mjs`: recovery from M3-27;
   - `rr-m305.mjs`: staging Counters before and after a Blocker, unblocking, and Enter;
   - `rr-touch.mjs` and `rr-touch2.mjs`: CDP multi-touch on a 1024×690 touch context;
   - `rr-target.mjs`: target sizes and the WCAG 2.5.8 spacing test at the three adapted sizes.
3. **Read the code:**
   - the diffs of `session.ts` (`publicView`, `publicLog`, `pendingLifeCard`) and `controller.ts` (`revealed`, `actions`, `spoken`, `alert`, `finish`);
   - the veil and press-and-hold code in `Board.tsx` and `Game.tsx`, and the `Dock` change;
   - the engine's `ProjectedView` and `Decision` types, to check that nothing else passes through `{ ...own }`.
4. **Looked at the builder's regenerated screenshots in `.cache/m3/`** (taken at 00:12, after the fixes) for every severity-2 claim that only pixels can show.
5. **Mutation-tested the new tests** (step 2 of the brief).

### Do the new tests catch the old bugs?

Each mutation re-introduces one fix's bug in the scratch worktree; each was reverted before the next.

| Mutation | Test | Result |
| --- | --- | --- |
| `revealed()` always `true`, which undoes the public view (M3-01..03) | `hotseat-leaks.spec.ts` | **fails** at the first curtain: "Urashima" is exposed |
| The hotseat log uses `session.log`, not `publicLog` (M3-02) | `hotseat-leaks.spec.ts` | **fails** after the defence: "Vergo" is exposed |
| `publicView` returns the seat's own view | `hidden.test.ts` | **fails** (actions not empty) |
| `publicLog` returns the seat's own log | `hidden.test.ts` | **fails** |
| `aiInitCards` sends every card (M3-09) | `hidden.test.ts` | **fails** |
| Staged Counters keep the target they were staged with (M3-05) | `defence.spec` "Counters staged before a Blocker…" | **fails** (defender power) |
| No `onRevealStart` on the veil (M3-06) | `defence.spec` "press and hold…" | **fails** |
| No staging announcement (M3-08) | `defence.spec` "the attack and each staging change…" | **fails** (the polite region kept the attack line) |

The unmutated worktree passes the same specs. On the dev server the whole 720p suite gives 38 passed and 2 failed. The two failures, `sw.spec` and the "set fails to load" test in `cards.spec`, need the production build and are unrelated to M3. CI, which builds first, is green.

The tests are real: each one fails when its fix is removed. They do not cover the three new severity-3 findings below. M3-06's test uses a mouse, so it cannot see M3-32.

### Round-1 findings

| ID | Claim | Verdict | Evidence |
| --- | --- | --- | --- |
| M3-01 | Public view behind the curtain, which is `inert` | **Fixed** | `leak-01-curtain-p2.txt`: no hand names in any text, attribute or tree node. `rr-curtain.mjs`: the only `inert` wrapper is `.stage-wrap`, and the live regions stay outside it. |
| M3-02 | Public log and live regions in hotseat | **Fixed** | `hotseat-report.txt`: no "LEAK?" line in a full game. After "Add to hand" the polite line reads "Player 1: Life card to hand · Player 1's Life 3 → 2." with no name. Both regions are emptied when R is released (`rr-break.mjs`). On the attacker's resumed, click-veiled seat, the defender's hand is not in the DOM. The cost is that your own draws are no longer named in the hotseat log; it is recorded in DECISIONS and acceptable. |
| M3-03 | Staged Counters shown as a count | **Fixed** at every width: "Your Leader 5000 · 1 staged (hidden)", and the Counter lane reads "1 staged. Player 1: hold R, or press and hold your hand area…". While veiled, the numbers leave out the hidden Counters, so their values don't leak either. |
| M3-04 | Rewind off while veiled | **Fixed.** The menu shows Rewind list, Back to my last decision and Forward as disabled. The log's ⟲ buttons are gone (0), and U, Shift+U and Ctrl+Z do nothing (`rr-break.mjs`). |
| M3-05 | Counters follow the Blocker; Enter never wastes them | **Fixed** (`rr-m305.mjs`):<br>• 1 staged, then Franky: "Franky 5000 + 1000 staged (Marco) · 6000 · Need +2000". Enter is "Block with Franky · Franky K.O.'d · Life stays 3 · Counters kept", and the log reads "Block: Franky · Hit", with no Counter played. "Play anyway · Franky still K.O.'d" is a separate button.<br>• 3 staged, then Franky: "8000 · Attack fails"; Enter commits block plus three Counters on Franky.<br>• Unblocking re-aims all three at the Leader.<br>While veiled, the commit is "Commit defence · 1 staged · hidden", which has no Enter key. |
| M3-06 | Press and hold reveals the hand | **Partly.** A mouse or a single finger reveals it and releasing hides it. **A touch user cannot stage while holding** (M3-32). |
| M3-07 | The curtain traps focus | **Fixed.** Tab and Shift+Tab move only between the curtain button and `<body>`; nothing behind the curtain takes focus. |
| M3-08 | Attack and staging announced | **Fixed.**<br>• Assertive: "Kaido attacks your Leader. Kaido 7000, your Leader 5000. You need 3000 to stop it. Plan your defence." In hotseat it does not count the defender's Counters, which is right.<br>• Polite after each Space: "Staged Komachiyo, plus 1000. Your Leader 6000 against 7000: still hits. Need 2000 more."<br>It also introduced a regression (M3-28). |
| M3-09 | AI `init` carries only its own deck | **Fixed** (`aiInitCards`, and the unit test fails under mutation). |
| M3-10 | Attribution and jargon | **Partly** (M3-31). |
| M3-11 | Recap where Skip stopped | **Fixed.** It reads "Stopped here. While you skipped: Kaido: End of turn. You: Refresh · Draw: …", and it is cleared on the next action and on rewind. |
| M3-12 | The damage decision is never auto-skipped, and shows the card | **Fixed.** Against the AI the decision waits for the player, and the revealed panel renders the card face and "Life card: Komachiyo". |
| M3-13 | Reveal cleared on blur | **Fixed.** A `blur` event re-veils the hand. A later keydown from R still being held reveals it again, which is right. |
| M3-14 | Card aspect ratio | **Partly.** The mulligan fan is now about 97×135 and the art keeps 63:88 where it shows, but the docks drop the art (M3-29). |
| M3-15 | The dock avoids the plates | **Fixed** in `720p-` and `1080p-defend-preview.png`: the dock sits over empty opponent Character slots, and every count stays visible. |
| M3-16 | The arrow runs under the plates | **Fixed.** Franky's "5000" and the chips draw above the arrow, and the ⌖ is on top. |
| M3-17 | Forced colours | **Fixed** (`1080p-forced-colours.png`): a focused legal card shows two rings, and the cards and tokens have borders. |
| M3-19 | Step pace | **Fixed.** The primary is "Next move ." (with the sub-label "the AI is moving" while the AI is acting), and the secondary is Skip. |
| M3-20 | 1280×600 rise | **Partly.** The ⌖ now stays visible, but a staged card still covers most of the Leader's name (`1280x600-defend-tie.png`). This is severity 1 now. |
| M3-21 | Scrim and turn bar | **Fixed.** The notice stays readable over the trash scrim, and the game-over board has no turn bar. |
| M3-22 | Make-room context | **Fixed:** the panel reads "Make room for Sai", "Cancel the play" is offered, the order matches the board, and each candidate carries a "Trash · not a K.O." chip. |
| M3-24 | Hotseat rewind | **Fixed:** "Rewind for both players?" asks for consent, and rewind is off while veiled. |
| M3-25 | Dialog focus return | **Fixed.** `?` then Escape returns focus to the card. |
| M3-26 | Nits | Mostly fixed ("1 card", "can block"). See M3-31 and the nits below for what remains. |

### The carries

- **M3-18 (44 px lane chips on tablets): accepted as severity 2, but the stated reason is inaccurate.** `rr-target.mjs` measures the lane chips at exactly 24 px tall at 1024×690, 1180×740 and 1280×600. They meet WCAG 2.5.8's 24 × 24 minimum outright, not "through the spacing exception". The only two targets under 24 px pass the spacing test. So AA passes. The 44 px rule is the product's own (board.md §6.2, and WCAG 2.5.5 at AAA), and 24 px chips on a touch tablet are a real friction, made worse by M3-32. Keep it open with a target milestone, M10 at the latest, and fix the DECISIONS wording.
- **M3-23 (drag, save and resume, the "Why?" chip, the "you look away" line): acceptable to carry.** None of these is in PLAN's M3 exit criteria. Hotseat rewind consent and the forced-colours ring are now built. DECISIONS, however, records only M3-18; the rest have no target milestone (M3-33).

### New findings

| ID | Sev | Area | Problem | Evidence | Fix |
| --- | --- | --- | --- | --- | --- |
| M3-27 | 3 | Hotseat keyboard dead end | **If the defender inspects a card while holding R, then releases R, the keyboard goes dead.** The card's handle leaves the rendered (public) view, so `CardDock` renders nothing, but `dock.pinned` stays true. `onKey` returns early on `dock.pinned`, so R no longer reveals, and Escape, U, Q and every other shortcut do nothing. The log stays `inert` and focus falls to `<body>`. Tab still moves focus, but no key brings the hand back, so a keyboard-only defender cannot see or stage Counters for the rest of that defence. Only a pointer press-and-hold recovers, by re-showing the invisible inspector. Inspecting a Counter before playing it is exactly what a learner does. | `rr-break.mjs` (k): "after release: dock count 0 · focus BODY", "R again reveals? false", "keys after: polite=''". `rr-k.mjs`: after 4 Tabs R still doesn't reveal, "log inert? true", and the pointer reveal brings `.dock` back. `Game.tsx` `onKey` (`if (dialog \|\| dock.pinned) return`), `Dock.tsx` (`if (!c?.card) return null`). | When `dock.handle` is not in the current view, reset the dock state to closed (an effect keyed on `view`), and return focus to the hand veil. Better: key the early return on the dock being rendered, not on `dock.pinned`. Add an e2e: R down, I on a hand card, R up, R down again → the hand is visible. |
| M3-28 | 3 | Game over is silent (regression from M3-08) | `finish()` announces game over only when `this.assertive.text === ''`. The new defence alert (`ctl.alert`) sets that text, and nothing clears it against the AI. In any game where the human defended once, the game ends with **no "Game over. You win on turn N."**, no polite "Rematch, or New game.", no `focusDecision` (focus stays on `<body>` after the Confirm button unmounts), and no `stopSkipping('end')`. Round 1 got `A: Game over. You win on turn 11.` and focus on "Game over". Round 2, on the same seed and path, got neither. | `rr1/ai-announcements.txt` (six defence alerts, no game-over line) against `ai-announcements.txt` from round 1; `rr1/ai-notes.txt` ("focus at game over: <main>"); `rr1/ai-focus.txt`; `controller.ts:510–524` | Track "game over announced" with its own boolean instead of testing the region's text. Add an e2e that defends once, wins, and checks `#announce-assertive` and the focused element. |
| M3-29 | 2 | Docks lost their art; the 720 inspector clips its text | To fix M3-14, docks narrower than 300 px now drop the card art. That covers the 1080 hover preview (240 px) and every 720 dock, so the hover preview no longer shows "the card bigger" (board.md §3.12: preview art 168×235 / 240×335). At 720 the pinned inspector is about 200×190: Miss Buckingham Stussy's effect text and Kaido's "[Activate: Main] [Once…" are cut off with no scroll cue. The inspector must never be smaller than the preview and must show the full text (§3.12, C19). | `.cache/m3/1080p-defend-preview.png`, `720p-defend-preview.png`, `720p-inspector.png`, `720p-game-over.png`; `Dock.tsx` (`rect.w >= 300`) | Size the dock to the spec so it can hold the 63:88 art (at 720, dock over the log as the reveal tray does, if the board has no room). Give the pinned inspector the full text, with scrolling and a visible cue. |
| M3-30 | 2 | Focus lands in `aria-hidden` content | The unpinned hover dock (`aria-hidden="true"`) is a Tab stop: Chrome makes its scrollable text box keyboard-focusable. In round 2's Tab walk, focus went from the disclaimer to `div "Komachiyo OP01-010 · Character…" (IN aria-hidden)`, so a screen-reader user lands on silence. The preview appears whenever a card holds keyboard focus for 400 ms. | `rr-keyboard.mjs` output (`rr1/keyboard.txt`), Tab 16 | Give the unpinned dock `inert` (not only `aria-hidden`), or `tabIndex={-1}` with `overflow: hidden` on its text when unpinned. |
| M3-31 | 2 | M3-10 residue: attribution and jargon | • The Hit line belongs to the defender's move, so it is credited to the defender: your own attack landing is announced "Kaido: Hit · 8000 vs 7000." and logged with an "Opp" chip (`720p-game-over.png`: "Opp · Hit · 5000 vs 5000").<br>• "Opp" is still spoken at the rematch: "Kaido: Opp chose to go second."<br>• Other rough lines: "You: You chose to go first.", "Skipped 2 moves. Kaido: End of turn.. You: …" (a doubled full stop), and "You have 0 counter cards worth 0." | `rr1/ai-announcements.txt`; `text.ts` (`FirstPlayerChosen` uses `tag()`, and the actor of `DamageStep`) | Credit the battle-result line to the attacker ("You: Hit · 8000 vs 7000"). Use the `whose()`/name wording for `FirstPlayerChosen`. Strip a trailing full stop before joining. Say "You have no Counter cards" for 0. |
| M3-32 | 3 | Touch hotseat: the defender can look but not counter | Press-and-hold now reveals the hand, but a tap from a second finger while the first holds produces **no `click`**: browsers synthesize click only for the primary pointer. Staging a hand card or a Counter-lane button therefore does nothing while the hand is revealed. Lifting the holding finger re-veils the hand, which hides the Counter lane. On a tablet in hotseat the defender still cannot play a single Counter, which is what M3-06 was raised for. The M3-06 e2e uses a mouse, so it cannot see this. (Found in Chromium's touch emulation through CDP; iOS Safari also fires click only for single-finger taps.) | `rr-touch.mjs`: "finger 1 down → revealed: true", second-finger tap → "staged? false", "still revealed: true". `rr-touch2.mjs`: a single CDP tap on Franky stages it (the harness works), but a second-finger tap on the Counter lane's "Marco" → `aria-pressed=false`, and on a hand card → 0 clicks. | On touch, make the reveal a toggle: a tap shows the hand with a visible "Hide my hand" button, and the hand re-veils on hide, on commit, and on any seat change. Or make the lane buttons and hand cards act on `pointerup` for non-primary touch pointers. Add a touch e2e that uses CDP touch events (as in `rr-touch2.mjs`). |
| M3-33 | 2 | Carries not scheduled | DECISIONS gives a reason and a home only for M3-18. Drag (in the PROMPT M3 row), save and resume (F13b.6), the "Why?" chip and the "you look away" line (F13b.3) have no target milestone, so they can quietly drop out. The DECISIONS line for M3-18 also has the wrong reason (see the carries above). | `docs/DECISIONS.md` 2026-10-29 | Add one line per deferral with its target milestone, and correct the M3-18 wording. |
| M3-34 | 1 | Nits | • While the hand is veiled, or once a Blocker is chosen, the panel title stays "Defend your Leader · Kaido attacks" while the Defender row says Franky.<br>• M3-20's residue: at 1280×600 a staged card still covers the Leader's name.<br>• The rail-header icons are 32 px, under board.md §6.2's 44 px on tablets. | `rr-m305.mjs` output; `.cache/m3/1280x600-defend-tie.png`; `rr-target.mjs` | Fix in passing. |

### Hidden information: summary of this pass

- **Hotseat.** I found nothing hidden on the surfaces checked. That covers every text node, every attribute (aria names, titles, `alt`, `aria-valuetext`), both live regions, the aria snapshot, the menu, the rewind list, the trash viewer and the hover preview. It holds under the curtain, in a veiled defence, in the damage decision, after a reveal ends, after a blur, on the attacker's resumed seat, and at game over. (I did not re-probe the rewind-consent path myself; `hotseat-leaks.spec.ts` covers it.)
- **`publicView` and `publicLog`.** They intersect the two projections by position. `hidden.test.ts` checks that over 250 Rookie actions. `ProjectedView`'s other fields are public (`battle`, `resolving`, `don`, `turn`) or emptied (`actions`, `known`). `Decision` carries only `kind`, `player`, `prompt`, `min` and `max`, and the prompt is replaced by the other seat's wording.
- **The AI.** The worker receives its own deck's cards and `PlayerView`s only.

### Disposition

**Blocking:** M3-27, M3-28 and M3-32. Fix them, add the three tests described, then re-review.

Severity 2 (M3-29 to M3-31 and M3-33, plus M3-18 carried) can be fixed or scheduled in DECISIONS. The manual screen-reader pass in PLAN's M3 exit criteria is still owed; this review's screen-reader work is a proxy, not that pass.

---

## Re-review 2

**Date:** 2026-10-29
**Build reviewed:** `f162b87` (fix `54e4fe0`, plus the `Dock.tsx` part of `cf2e304`; CI run 40818609741 green).
- I served it from a clean detached worktree (`.cache/m3-rr2/head`, Vite on :5176).
- Mutations and a scratch Event [Counter] scenario ran in a second worktree (`.cache/m3-rr2/mut`, :5177).
- The main tree was not touched.
- `main` has since moved to `66e4b43`. Between the two, `app/src` is unchanged: only engine commits, including the B-1 Event-cost fix, and longer e2e timeouts.

**M3 re-review 2: FAIL.**
- **Open severity 3:** M3-35. Under the hotseat veil, a decision the screen's player owes (an effect's choose or optional) reads "Your opponent is choosing." This is new surface: M4a effects now reach the defence.
- **Severity 4:** none open. The sticky reveal did not leak to the other player before a game ended. It survives into game over after a concession (M3-36, severity 2).

### Method

1. **Sticky-reveal leak hunt** (`.cache/m3-review/rr2-sticky.mjs`, `rr2-rewind.mjs`; output in `rr2/sticky.txt`, screenshots `rr2/*.png`).
   - It ran on the `leak` scenario, whose private names are unique, at 1024×690 with `hasTouch` and at 1280×720 with a mouse and keyboard.
   - Paths tried:
     - stage, then take the hit; reveal again in the damage decision; Add to hand; the attacker's seat;
     - concede from the menu while revealed;
     - U and Shift+U with consent while revealed, then the curtain and its lift;
     - the inspector pinned on a hand card, then "Hide my hand";
     - window `blur`;
     - a mouse click on the veil (it must only hold);
     - Enter on the veil (sticky), an R tap during a sticky reveal, and a Blocker-only commit.
   - At each step I checked every text node and attribute, the rendered hand cards and the pixels.
2. **Severity-3 fixes on real input.**
   - `rr2-touch.mjs` drives real CDP `Input.dispatchTouchEvent` taps, not `.tap()`.
   - `rr2-k.mjs` checks M3-27.
   - `rr2g/ai-game.mjs` plays a full game vs Rookie, patched for M4a effect decisions, to check M3-28.
3. **Regression on the earlier probes.**
   - I re-ran `leak.mjs`.
   - `rr2-hotseat.mjs` plays a full hotseat game with the Rocks and Kaido scripted effects live; it has stall detection, and its output is in `rr2/hotseat-report.txt`.
   - `rr2-evc.mjs` used a scratch hotseat scenario in which Player 1 defends holding OP17-076 and OP07-076, both Event [Counter] cards. It went through veiled, R held, R released, activating an Event, and the cost and optional prompts.
4. **Mutation tests:** remove each fix, then run its test.

### Do the new tests catch the old bugs?

| Mutation | Test | Result |
| --- | --- | --- |
| No auto-close of a dock whose card left the view (M3-27) | `review-rr1` "inspecting a card while R is held…" | **fails** (the veil is not focused) |
| `finish()` back on `assertive.text === ''` (M3-28) | `review-rr1` "game over is announced…" | **fails** |
| The veil's tap does not make a sticky reveal (M3-32) | `touch-hotseat.spec.ts` | **fails** (no hand cards) |
| The unpinned dock is not `inert` (M3-30) | `review-rr1` "the hover preview is never a Tab stop" | **fails** |
| The defence commit does not end the reveal | `touch-hotseat.spec.ts` | **passes**: the seat change after the commit hides the hand anyway, so the "commit ends the reveal" rule is not tested on its own (M3-38) |

On the unmutated worktree, the 11 tests in `review-rr1`, `touch-hotseat`, `hotseat-leaks` and `defence` pass.

### Claims verified

| ID | Verdict | Evidence |
| --- | --- | --- |
| M3-27 | **Fixed.** The inspector closes when its card leaves the view, focus goes to the veil, and R reveals again. The log is no longer `inert`. With a sticky reveal, "Hide my hand" while the inspector is pinned also closes it and focuses the veil. | `rr2-k.mjs`; `rr2/sticky.txt` (S4) |
| M3-28 | **Fixed.** A full game vs Rookie with six defence alerts ends with `A: Game over. You win on turn 11.` and `P: Rematch, or New game.`, focus on the heading "Game over", and Enter starts the rematch. | `rr2g/ai-announcements.txt`, `rr2g/ai-focus.txt` |
| M3-32 | **Fixed** with real touch:<br>• one CDP tap reveals the hand, and three single taps stage "Counter +3000 · survive · 8000 vs 7000";<br>• "Hide my hand" re-veils with "3 staged";<br>• the commit lands with no hand cards left on screen.<br>A long press on touch reveals only when the finger lifts (it is a click), which is fine, but the copy says "press and hold" (M3-38). | `rr2-touch.mjs` |
| M3-29 | **Fixed.** The 720 inspector docks over the rail with the art at 63:88 and full, scrolling text (`.cache/m3/720p-inspector.png`, taken at 00:45). The hover preview shows 168×235 art at both sizes (`rr2/hover-1280.png`, `rr2/hover-1920.png`). At 1920 that is smaller than board.md's 240×335 (M3-38). | as cited |
| M3-30 | **Fixed:** the unpinned dock is `inert`. | mutation above |
| M3-31 | **Fixed.**<br>• Hits are credited to the attacker: "You: Hit · 8000 vs 5000.", "Kaido: Hit · 6000 vs 5000."<br>• "You have no Counter cards."<br>• There is no "Opp" and no doubled full stop in 83 announcements. | `rr2g/ai-announcements.txt` |
| M3-34 | **Fixed** for the title: it names the Blocker once one is chosen. | `rr2-m305`-style run |

### The sticky reveal as a leak surface

| Path | Result |
| --- | --- |
| Stage, then commit (Take the hit, or a Blocker only) | Reveal ends. The attacker's seat shows no hand of Player 1's; 0 names in the DOM. |
| Damage decision: reveal again, then Add to hand | Ends at the seat change. At 150 ms the screen already shows Player 2's seat with the click veil; 0 names. |
| `blur`, Hide my hand, the inspector | All end it; 0 names. |
| R tapped during a sticky reveal | Ends it (a release counts as a hold ending), which is the safe direction. |
| Mouse click on the veil | Holds only; it never goes sticky. |
| Rewind with consent while revealed (U) | The curtain goes to Player 2; under it, 0 names; after it, Player 2's own hand only. The reveal flags survive the seat change, though (M3-36). |
| **Concede while revealed** | **Player 1's hand stays on the game-over board** (Hajrudin, Shinobu, Jean Bart, Wire in the DOM and the pixels: `rr2/s2-concede-game-over.png`). This is M3-36. |
| Event [Counter] (scratch scenario) | Buttons render only while revealed, and none show while veiled. An activated Event goes to the trash, which is public. Nothing private appears after R is released. |

### New findings

| ID | Sev | Area | Problem | Evidence | Fix |
| --- | --- | --- | --- | --- | --- |
| M3-35 | 3 | Hotseat: effect decisions under the veil | **When the defender owes an effect decision while veiled, the panel says the opponent is deciding.** `publicView` gives the decision the *other* seat's prompt, so Player 1's own decision reads:<br>• "Choose · **Your opponent is choosing.** · 0 of 1 chosen", with no candidates (they are hidden hand cards) and Done disabled, plus the make-room footnote "Trashing to make room is not a K.O.", which is wrong for this choice;<br>• "Optional effect · **Your opponent is deciding whether to use an effect.**", with Skip and Use live.<br>Nothing in the panel says it is Player 1's move or that they must reveal their hand to answer. In a real hotseat game (seed 202, turn 8, Queen attacks) my script stalled exactly there, and two people at one device would too: each waits for the other. The scripted M4a effects ("on your opponent's attack" costs, the Kaido Leader's DON!! −1, Event [Counter] costs) reach this panel in ordinary play. | `rr2/hotseat-stall.png`; `rr2/hotseat-report.txt` (STALL line); `rr2-evc.mjs` output (states 1 and 7); `session.ts` `publicView` (`prompt: theirs.decision.prompt`); `Decision.tsx` `chooseContent` (footnote always shown) | When the veiled seat owes the decision, title the panel for that player, for example "Player 1: your choice. Reveal your hand to answer (tap, hold, or R)", and put a reveal button inside the panel. Keep the prompt generic only where it names hidden cards. The effect's source card is public, so it can be named. Show the make-room note only for `purpose: 'makeRoom'`. Add a hotseat e2e with a scripted effect that asks the veiled defender to choose. |
| M3-36 | 2 | The reveal outlives its owner | **Reveal flags survive game over and rewind.** `finish()` never calls `endReveal()`, so a concession made while revealed leaves the conceder's hand on the game-over board for whoever looks (it is still in the DOM and the pixels). `rewound()` switches the seat without going through `updateSeat`, so `revealHeld` and `revealSticky` survive, along with a stale `'hold'` veil. I saw no cross-seat exposure, because the new seat had just lifted its own curtain, but the state is wrong. `hotseat-leaks.spec` step 10 checks game over only when nothing was revealed. | `rr2/s2-concede-game-over.png`, `rr2/sticky.txt` (S2, S3); `controller.ts` `finish()`, `rewound()` | Call `endReveal()` in `finish()` and in `rewound()`/`restart()`, and set `handVeil` through `updateSeat` on every seat change. Extend the leak walk: reveal (sticky), then concede, then expect no private names. |
| M3-37 | 2 | Public view: a new field passes through | M4a added `ProjectedView.looking` (cards this player is looking at through an effect). `publicView` copies `own` with `...own` and clears only `actions` and `known`, so `looking` survives into the veiled view. `Game.tsx` then indexes `view.looking`, so `nameOf`/`cardOf` resolve those cards while veiled. Nothing renders them today, because veiled pick candidates are filtered by `actions()`, so this is not a leak yet. It is one render away, and `hidden.test.ts` does not cover it. | `session.ts` `publicView`; `Game.tsx:147–149`; `engine/src/project.ts:45` | Build `publicView` from an allow-list of fields, not a spread, with `looking: []`, `resolving` intersected like the zones, and `known: {}`. Extend `hidden.test.ts` to assert every hidden-bearing field. |
| M3-38 | 1 | Test gap and copy | • Removing "a commit ends the reveal" leaves `touch-hotseat.spec` green: assert the hand is veiled in a same-seat decision after the commit (Take the hit → damage decision).<br>• The Counter-lane and damage hints still say "hold R, or press and hold your hand area" and never mention tap. On touch a long press reveals only when the finger lifts, so make the veil read "Tap to show your hand".<br>• The 1920 hover preview art is 168×235, not board.md's 240×335, inside a 384×515 dock that is mostly empty. | mutation table; `rr2-touch.mjs`; `rr2/hover-1920.png` | Fix in passing. |

### Regression notes

- `leak.mjs`: every canary step is clean, with no page errors.
- Full hotseat game: no "LEAK?" line before the M3-35 stall. The curtains hold no names, and Tab from the curtain reaches only `<body>`.
- Full game vs Rookie: M4a effect decisions (optional, order, option picks) all resolve through the panel, with no page errors.

### Disposition

**Blocking:** M3-35. Fix it, add the hotseat effect-decision test, then re-review. M3-36 and M3-37 are small hardening steps and should go in the same change.

Still owed: the manual screen-reader pass in PLAN's M3 exit criteria, and the carries already scheduled in DECISIONS (M3-18, M3-23).

---

## Re-review 3

**Date:** 2026-10-29
**Build reviewed:** `main` at `fb516fc` (fix `64ddfb5`; CI run 40822229184 green).
- I served it from a clean detached worktree (`.cache/m3-rr3/head`, Vite on :5178).
- Mutations and two scratch hotseat scenarios ran in a second worktree (`.cache/m3-rr3/mut`, :5179).
  - `rocksA`: Player 1 has OP17-048 Shiki on the field and a Rocks Pirates card (OP17-054) in hand.
  - `rocksB`: the same position, with no Rocks Pirates card in hand.
- The main tree was not touched.

**M3 re-review 3: FAIL.** One new severity-4 finding is open: **M3-39**. Under the veil, whether "Use" is available shows the attacker what is in the defender's hand. The fixes for M3-35 to M3-38 hold.

### Method

1. **Answer-availability probe** (`.cache/m3-review/rr3-answer.mjs`). Player 2 attacks in `rocksA` and in `rocksB`, so Shiki's `onOpponentAttack` optional reaches the veiled defender. Its cost is "trash 1 Rocks Pirates card from your hand". I diffed the veiled `#decision` DOM and the pixels between the two (`rr3/answer-A.html`, `rr3/answer-B.html`, `rr3/answer-rocksA.png`, `rr3/answer-rocksB.png`).
2. **Code trace** of `veiledAnswerable()`, the veiled wrapper in `contentFor`, `publicView`'s neutral decision, and the engine's `noAccept` (`engine/src/actions.ts:452–455`: "use" is left out of the legal answers when its cost can't be paid).
3. **Regression.**
   - `leak.mjs`: all canaries clean.
   - `rr3-sticky.mjs` and `rr3-rewind.mjs`.
   - `rr3-hotseat.mjs`: a full hotseat game, seed 202, with scripted effects. It now presses "Show my hand" when a veiled decision needs it, and plays to game over with no leak line.
   - `rr3g/ai-game.mjs`: a full game vs Rookie with M3-28's announcements.
4. **Mutations:** remove each fix, then run its test.

### Claims verified

| ID | Verdict | Evidence |
| --- | --- | --- |
| M3-35 | **Fixed as specified.**<br>• The veiled seat sees "Player 1: your decision" and "Show my hand · R".<br>• The prompt is neutral ("Shiki: Give up to 1 of your opponent's Characters −3000 power", built from a public source).<br>• A decision whose answers name hidden cards shows "Show your hand to see this decision" and no buttons.<br>• The make-room note appears only for `characterLimit`.<br>The seed-202 game that stalled in round 2 now plays to the end through "Show my hand". However, the "answerable without revealing" rule reads the private legal answers (M3-39). | `rr3/hotseat-report.txt`; `hotseat-effects.spec.ts` |
| M3-36 | **Fixed.**<br>• Conceding while the hand is revealed now ends on a veiled board with 0 private names (`rr3/s2-concede-game-over.png`).<br>• U with consent during a sticky reveal sends the curtain to Player 2, with 0 names under it and only Player 2's own hand after it.<br>• Shift+U also ends the reveal. | `rr3-sticky.mjs`, `rr3-rewind.mjs` output |
| M3-37 | **Fixed.** `publicView` is built from an allow-list, with `looking: []` and `known: {}`; `resolving` and `attackLock` keep only public cards. | `session.ts`; mutation below |
| M3-38 | **Fixed:** the commit now ends a touch reveal before a decision by the same seat. | mutation below |

### Do the new tests catch the old bugs?

| Mutation | Test | Result |
| --- | --- | --- |
| The veiled wrapper turned off (`contentFor` returns the inner panel) | `hotseat-effects.spec.ts` | **fails** (title) |
| The public decision reverts to the other seat's prompt | `hotseat-effects.spec.ts` / `hidden.test.ts` | **both fail** ("Your opponent is choosing who goes first.") |
| `looking: own.looking` in `publicView` | `hidden.test.ts` | **fails**: the seeded game really does look at cards (OP17-118, OP17-049), so the assertion is not vacuous |
| The commit does not end the reveal | `touch-hotseat.spec` (the new M3-38 test) | **fails** |
| `finish()` does not clear the reveal | `hotseat-effects.spec.ts` | **passes**: the concession goes through `restart()`, which also clears the reveal. Behaviour is safe; the line is untested on its own (M3-40). |
| `restart()` does not clear the reveal on rewind | `hotseat-leaks`, `hotseat-effects`, `rewind` | **pass**: the post-rewind curtain sets `handVeil = 'none'`, which masks a stale flag. Safe, but untested (M3-40). |

On the unmutated worktree, the 7 tests in `hotseat-effects`, `touch-hotseat`, `hotseat-leaks` and `review-rr1` pass, and so do both tests in `hidden.test.ts`.

### Answer availability under the veil

The engine keeps its side of the bargain: the optional decision is asked whether or not the cost can be paid, and only the decider gets the legal answers. The UI breaks it under the veil.

| Position (Player 1 veiled, Player 2 looking) | Veiled panel |
| --- | --- |
| `rocksA`: a Rocks Pirates card in hand | "Player 1: your decision · You can answer without showing your hand… · Shiki: Give up to 1 of your opponent's Characters −3000 power · **Skip / Use**" |
| `rocksB`: no Rocks Pirates card in hand | the same text, but **"Use" is disabled and its sub-label reads "can't pay the cost"** |

The two DOMs differ only in that button (`<span>can't pay the cost</span>`), and the difference shows in the pixels. This is not a corner case. OP17-048 Shiki is in the Rocks list, its ability fires on every opponent attack, and the seed-202 hotseat game reached it (turn 8, "Shiki: Give up to 1…").

The other channels I checked do not leak today:
- **Timing:** a veiled decision has no AI beat, and both answers render at once.
- **Neutral prompt:** it is built from the source card's public label.
- **Done / count line:** only shown for picks among public cards.
- **Trigger "Activate":** it reads "reveal first" whatever the card.

One more channel is open in principle. The **"You can answer without showing your hand" versus "Show your hand to see this decision"** split is computed as `priv.length === pub.length`, which asks whether any *legal* answer names a hidden card. A choice whose legal answers may or may not include hand cards would switch between the two wordings depending on the hand. I found no scripted card that does this yet; it is the same root cause as M3-39.

### New findings

| ID | Sev | Area | Problem | Evidence | Fix |
| --- | --- | --- | --- | --- | --- |
| M3-39 | 4 | Hidden info: answer availability under the veil | **Under the veil, whether "Use" can be pressed reveals hand contents to the attacker.**<br>• `veiledAnswerable()` treats an optional decision as answerable without a reveal, because accept and decline name no card.<br>• `contentFor` then renders the inner footer from the seat's **private** legal answers. When the cost needs a hidden card the hand lacks, the engine drops "use" (`noAccept`), and the veiled footer shows "Use · can't pay the cost".<br>• With OP17-048 Shiki on the field, every opponent attack tells the attacker whether the defender holds a Rocks Pirates card. Other hand costs with a filter (EB04-032, OP17-042) leak the same way when they reach a veiled seat.<br>• More broadly, the answerable-or-not split itself is computed from private answers. | `rr3-answer.mjs` output ("DOM identical under the veil: false"); `rr3/answer-rocksA.png` against `rr3/answer-rocksB.png`; `rr3/answer-B.html`; `controller.ts` `veiledAnswerable()`; `Decision.tsx` `contentFor`; `engine/src/actions.ts:452–455` | **Nothing on a veiled panel may be computed from the private legal answers.**<br>• Decide whether a decision can be answered veiled from public facts only: the decision kind, and whether the ability's cost or condition reads a hidden zone (from the script, or a flag the engine sets on the decision). Any ability that reads a hidden zone always says "Show your hand to answer".<br>• For an optional answered while veiled, render "Use" and "Skip" both enabled. If "Use" turns out to be unpayable, say so only after the reveal.<br>• Add an e2e that renders the same veiled position with a payable and an unpayable hand (the `rocksA`/`rocksB` pair) and asserts that `#decision`'s HTML and the screenshot are identical.<br>• Add a unit property: the veiled panel's inputs (`veiledAnswerable`, the shown actions) are invariant under permuting the cards hidden from the other player. |
| M3-40 | 1 | Test gaps | The reveal resets in `finish()` and `restart()` have no test of their own; each is masked by another path (the concession goes through `restart()`; the rewind curtain sets `handVeil = 'none'`). The behaviour is correct today. | mutation table | Add a unit test on `GameController`: reveal (sticky), then end the game by an effect or deck-out, and expect `revealed() === false`; reveal, rewind to a same-seat decision, and expect the veil back. |

### Regression notes

- `leak.mjs`: every step clean.
- Full hotseat game (seed 202): no leak line, no page errors, game over on turn 9.
- Full game vs Rookie: game over is announced (`A: Game over. You win on turn 11.`, then `P: Rematch, or New game.`), focus goes to "Game over", and Enter rematches.

### Disposition

**Blocking:** M3-39, the hotseat answer-availability leak. Fix the root cause rather than special-casing the "Use" button, add the payable/unpayable twin test, then re-review. M3-40 is optional hardening.

Still owed: the manual screen-reader pass in PLAN's M3 exit criteria.

---

## Re-review 4

**Date:** 2026-10-29
**Build reviewed:** `main` at `3e9db4f` (fixes `97f5f4f` and `61dc040`; CI run 40827636985 green).
- I served it from a clean detached worktree (`.cache/m3-rr4/head`, Vite on :5180). That worktree ran its own `npm ci`, and I confirmed that `node_modules/@optcg/*` link to its own `engine`, `cards`, `ai` and `app`.
- Mutations ran in a second worktree with its own `npm ci` (`.cache/m3-rr4/mut`, :5181).
- The main tree was not touched.

**M3 re-review 4: PASS.**
- No severity 3 or 4 finding is open. M3-39 (and M4a-01) is fixed at the root.
- Three new findings, at severity 2, 2 and 1, are below.
- The milestone still needs the manual screen-reader pass in PLAN's M3 exit criteria, which this review cannot provide.

### Method

1. **Read the boundary and grepped every path from private data to the screen.**
   - `veiled.tsx`, `controller.actions()` and `veiledProps()`, `veiledUse()`/`veiledSkip()`, and the new `PublicView` brand.
   - Every `session.view(`, `.simulate(`, `counterOptions(`, `preview`, `whyNot` and `pendingLifeCard` call in `Game.tsx`, `Decision.tsx`, `Dock.tsx`, `Board.tsx`, `Dialogs.tsx` and `Rail.tsx`.
2. **Ran my own differential pairs** (`.cache/m3-review/rr4-diff.mjs`) for what the builder's pairs never vary. Each pair was driven to the defender's veiled optional, then the Counter step, the damage decision and the attacker's resumed seat, comparing HTML, the aria snapshot and both live regions:
   - an Event [Counter] in hand (OP17-076) against none;
   - two Event [Counter] cards against none;
   - a hand with no Counter values (EB01 vanilla-less Characters) against a hand of +1000 cards;
   - a hand of Stages only against Characters.
3. **Pressed "Use" under the veil** in a payable and an unpayable Shiki position (`rr4-use.mjs`).
4. **Fed the `scenario=json:` option** malformed, mode-less and markup-bearing input.
5. **Mutation tests** of the differential suite, the M4a-01 shape and M3-40.
6. **Regression:** `leak.mjs`, `rr4-sticky.mjs`, a full hotseat game (`rr4-hotseat.mjs`, seed 202) and a full game vs Rookie (`rr4g/ai-game.mjs`).

### 1. Does anything reach a veiled screen from private data outside `veiledContent`?

**No.** Path by path:

| Surface | What it reads while veiled | Verdict |
| --- | --- | --- |
| Effect decisions (optional, choose, order) | `veiledContent(ctl.veiledProps())`: the `PublicView`, the seat's name and callbacks. `actions()` returns `[]` for these kinds, so `legal` is empty. | Public only |
| Board lighting (`deco`) | `legal` (empty for effect decisions; for block and counter, only actions naming visible cards). Counter staging and lighting are guarded by `handHidden()`. `stagedPowers` is guarded by `revealed()`. | Public only |
| Footer and Enter | The veiled footer is the constant Use/Skip, or nothing. `primaryEnterId` finds no `#choose-done` or `#commit-defence` under the veil. Its "commit-hidden" button has no key. | Public only |
| Key handlers | They act on `legal`/`kind` (public), or reveal (R) or show (Space or R on the click veil). | Public only |
| Live regions | The hotseat log is public. The defence alert counts Counters only when `revealed()`. Staging sentences are cleared on release. Game-over text is public. | Public only |
| Hover and inspector | `index` is built from `ctl.view()` (the public view); the dock closes when its card leaves. | Public only |
| Defence panel | `counterOptions()` and `simulate()` read private actions, but every use is behind `hidden`: the Counter lane, the Event [Counter] buttons, `counterCards` and "No Counter cards". The `none` and per-Blocker simulations take default answers and yield public facts: Life counts, K.O., attacker and target power. | Public only |
| Damage panel | `pendingLifeCard()` is null unless revealed. Activate reads "reveal first", and `whyNot` is skipped when hidden. | Public only |
| Timing | In hotseat, auto-skip runs only on windows that follow from public information (engine M2-02 and M2-19). With `61dc040`, a decision is offered only once the loop settles. A veiled "Use" either reveals, or applies only when `readsHiddenZone` is false, so its timing follows from the public script. | Public only |

My four extra pairs are **identical** in every state:
- the event-counter pair;
- the two-events pair;
- the no-Counter hand pair;
- the Stage-only hand pair.

They pass through optional, counter and trigger, then the attacker's main.

Pressing "Use" under the veil behaves identically in the payable and unpayable Shiki positions. Before the press, both panels read the same, with Use enabled. After it, both reveal the hand. The unpayable side then says "You can't pay its cost" only once the hand is shown (`rr4/use-payable.png`, `rr4/use-unpayable.png`).

### 2. Do the differential pairs differ in what matters?

**Mostly yes.**
- **The fixed pair** differs exactly in Shiki's payability.
- **The 50 generated pairs** differ in every hidden zone of both seats (hands, Life and decks) at equal sizes, with the field and the seed fixed. Every other pair flips payability.
- **The OP07-077 pair** differs only in whether the deck's top 5 hold a match.

They reach optional, counter, trigger and choose. They never reach `order`. That kind is safe by construction: `actions()` returns `[]`, and `veiledContent` always says "Show your hand to answer".

The PLAIN pool has a Counter on every card, so no generated hand lacks Counters or holds an Event. My extra pairs cover that.

They never press "Use", which is a real test gap (M3-42).

**Mutation results:**

| Mutation | Result |
| --- | --- |
| The veiled optional renders the private footer again (the M3-39 shape) | **fails**: the fixed pair, pair 1, pair 6 and others |
| The public decision carries `max`, and `veiledContent` treats a `max: 0` choose as answerable (the M4a-01 shape) | **fails**: "OP07-077 take step differs" (plus `hidden.test.ts`) |
| `finish()` does not clear the reveal (M3-40) | `controller.test.ts` **fails** |
| `restart()` does not clear the reveal (M3-40) | `controller.test.ts` **fails** |
| `veiledUse()` skips the `readsHiddenZone` check | **all tests pass** (M3-42) |

The builder reports that 11 of the 12 differential tests fail against `64ddfb5`. That code has no `scenario=json:` route, so some of those failures may come from the missing route rather than from the leak. The mutations above are the stronger evidence, and they show the suite catches the leak on current code.

### 3. OP07-077's `max`

**Out of the DOM, and out of the data.** `publicView`'s decision carries only `kind`, `player` and a constant prompt. A veiled choose is never answerable, so it shows "Show your hand to answer" whether or not the top 5 held a match. The OP07-077 pair is identical, and re-adding `max` with a `max`-based answerable rule makes it fail.

### 4. The `scenario=json:` URL option

**Harmless.**
- Card ids resolve through the static `import.meta.glob` set map (`loadSet`), so a crafted id cannot fetch arbitrary paths.
- Every string renders through React as text. A hand entry `<img src=x onerror=alert(1)>` simply fails to load as a card and falls back to the setup page.
- Malformed base64 and incomplete specs also fall back to setup, without an error message.
- One rough edge is M3-43.

### Regression

| Probe | Result |
| --- | --- |
| `leak.mjs` | All 7 canary steps clean. |
| `rr4-sticky.mjs` | Every sticky-reveal path (commit, damage, Add to hand, concede, blur, Hide, inspector) shows no private names. The `s3-after-rewind` line is my script's no-op rewind (the button filter missed), and only the revealed seat's own hand is shown. |
| Full hotseat game, seed 202 | Plays to game over on turn 9. Five hidden-dependent decisions went through "Show my hand", with no leak lines and no page errors. |
| Full game vs Rookie | Game over is announced and takes focus; no page errors. |

### Claims verified

| Claim | Verdict |
| --- | --- |
| Type boundary (`veiledContent(VeiledProps)`, branded `PublicView`) | **Verified** (code; mutation A). |
| Public decision without `min`, `max`, `purpose`, `source` or options | **Verified** (`session.ts`; mutation B). |
| `actions()` returns nothing for veiled optional, choose and order | **Verified.** |
| Use and Skip always enabled; Use reveals on a hidden-reading script; choose and order always ask for the reveal | **Verified** (`rr4-use.mjs`). |
| The differential test | **Verified with gaps:** it catches the M3-39 and M4a-01 shapes, but never presses Use (M3-42). |
| M3-40 covered by `controller.test.ts` | **Verified** (both mutations fail). |
| `61dc040` (decision offered only once settled) | No regressions in either full game. |

### New findings

| ID | Sev | Area | Problem | Evidence | Fix |
| --- | --- | --- | --- | --- | --- |
| M3-41 | 2 | Veiled "Use" opens the hand unannounced | On an ability whose script reads a hidden zone, pressing "Use" under the veil shows the hand at once. This is correct for secrecy: it happens in both the payable and unpayable cases. But the panel says "Use or Skip, or show your hand first. Only you should look.", so a defender who presses Use is not told that it will show their hand to whoever is looking. | `rr4-use.mjs` output; `controller.ts` `veiledUse()` | Word the veiled Use as "Use (shows your hand)". Or have the first press turn the button into "Show my hand to use" without revealing. Either way the wording is the same for every ability, so it stays public. |
| M3-42 | 2 | Test gap: Use under the veil | No test presses "Use" under the veil. If the `readsHiddenZone` check is removed from `veiledUse()`, a payable Shiki goes on to its veiled cost choice while an unpayable one opens the hand with "can't pay": a behavioural replay of M3-39. All 13 hotseat e2e tests and all 30 unit tests still pass. | mutation C above | In `hidden-differential.spec.ts`, after the veiled optional snapshot, press `#use-btn` and compare the next veiled state (or assert the hand is revealed on both sides). Add a unit test that `veiledUse` reveals for a hidden-reading script whether or not "use" is legal. |
| M3-43 | 1 | `scenario=json:` input | `mode` is not validated. A spec without `mode` starts a game whose seats are human and AI but with no AI client, and it shows "Rookie AI · Thinking" forever. Malformed input falls back to the setup page with no message. Test-only surface. | `rr4-use.mjs` json cases; `PlayRoute.tsx` `scenarioFrom` | Accept only `mode` `'ai'` or `'hotseat'`, and show the setup error line when the spec fails to parse or validate. |

### Disposition

M3 review: **PASS** on code, with no severity 3 or 4 finding open. M3-41 and M3-42 should be fixed soon; M3-42 matters most, because it guards the M3-39 class. The carries remain as scheduled (M3-18, M3-23). The milestone's exit still needs the manual screen-reader pass.
