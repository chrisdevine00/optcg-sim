# L screen-reader pass, third run: NVDA + Chrome

**Kind of pass:** scripted (Guidepup), not a human listening pass (accessibility.md §11.2, risk R9). Third run of the §11.4 script (`app/a11y/src/l.ts`) after fix round 2 (DECISIONS "2026-11-09 — L screen-reader fix round 2", commit `cd54d0c`). Earlier runs: [l-nvda-chrome.md](l-nvda-chrome.md), [l-nvda-chrome-r2.md](l-nvda-chrome-r2.md). Firefox: [l-nvda-firefox-r3.md](l-nvda-firefox-r3.md). Finding numbers are shared by both browsers and all runs.
**Result:** **PASS by the rule** (no open severity 3 or 4). Open at severity 2: L-SR16 (new), L-SR20 (new), L-SR21 (new). **Coverage: sufficient.** Every §11.4 step, F3 and F15 was heard in Chrome (table at the end). Fix round 2 worked for its headline: L-SR1 (focus lands on "Confirm attack", which speaks the battle maths, and Enter attacks), and L-SR2, L-SR10, F3 and "Play from here" were heard for the first time. Two things now stand out that the earlier runs hid: a polite line is lost when another is written within about 100 ms (the puzzle's "Solved" line was never spoken), and the Optional-effect decision's focus on "Use" is silent.
**Date:** 2026-11-09.

## Versions

| Item | Version |
| --- | --- |
| NVDA | 2026.2 (Guidepup's portable build, default configuration; the log header says `NVDA_VERSION 2026.2`) |
| Browser | Google Chrome, harness-reported "chromium 156.0.8078.80" (Playwright `channel: 'chrome'`, headed) |
| Guidepup | `guidepup 0.38.0, @guidepup/playwright 0.21.0` |
| Windows image | GitHub Actions `windows-2025` (`win25-vs2026 20261103.298.1`) |
| App commit | `cd54d0c` on `main` (the log header) |
| Workflow run | GitHub run 42668723191, file `app/a11y/results/nvda-chrome/l.md` (and `l.json`). The log is not committed |
| Speech source | The NVDA Remote speech tap (every phrase NVDA spoke, timestamped): 201 of 232 key presses have speech. Guidepup's per-key capture is off, so that column is empty by design |

## How it ran

- Steps F3 to 5b on `a11y-l` (Rookie as the AI); steps 6 to 10 reload on `lethalDemo`, concede, and open the review. The log's `unreached` list is empty: no "HARNESS: did not reach" note anywhere in Chrome.
- **Harness assists** (all recorded): step 1 and step 2 one each (back to the board; the heading probe); step 3 four (focus back to the board before each `L`); step 4 two (`C` from the board; a move into the coach); steps 4b and 4c four ("Tab did not reach it quickly"); step 5 one; step 5b two; step 6 four (Game menu, "keys were not reaching the page", the Concede button, the timeline); step 7 one. Assessed under "Do the assists hide a real problem?" below.
- Step 6 again met "Keyboard focus left the page after Tab (canary silent)" at the Concede dialog. This is the harness pressing Tab where Shift+Tab is right, not an app fault (diagnosis below).
- Judged against §11.4 as amended by DECISIONS round 2 (§3.5, §3.12 `M` row, §11.4 step 1: focus is on Confirm attack, not the heading).

## What the event traces show

The harness now records pointer, mouse, click, keydown and focus events on the decision panel after Enter on the heading (the probe), after Tab from it, and after Enter on Confirm attack.

| Probe | What reached the page in Chrome | Reading |
| --- | --- | --- |
| Enter on the focused heading `h2#decision-title` | `pointerdown (pointerType=mouse)`, `mousedown`, `mouseup`, `click (detail=1, pointerType=mouse)` on the heading. **No `keydown`.** | NVDA's browse-mode Enter on a "clickable" heading is a **synthesized mouse click**, not a key. This **confirms the lead's round-1 hypothesis for Chrome**: round 1's guard (`pointerdown` within 1000 ms means "a real mouse, do not commit") rejected exactly this click, so L-SR1's first fix could not work. It also means the app's "Enter commits the primary" handler (`Game.tsx` 723 to 728, which listens for `keydown`) never fires while focus is on a heading: see L-SR17. Round 2 removed the dependency, correctly: the heading's `onClick` now only focuses it, and the trace shows nothing was committed (the probe's own note says "yes (the heading does not commit)"). |
| Tab from the heading | `keydown Tab` on the heading, then `focusout` and `focusin` on a button (Cancel). | The Tab **is** delivered as a key and the heading's own handler (`Decision.tsx` 115 to 124) sends it to the first control. Speech: "Decision actions, Cancel, button". **L-SR11 did not reproduce** (r2: Tab went to the Game log, skipping Cancel and Confirm attack). One run cannot say why r2 differed; the path no longer matters because focus lands on Confirm attack. |
| Enter on "Confirm attack" | `keydown Enter` on `button#confirm-attack`, then `click (detail=0, pointerType="")`. | On a native button NVDA passes the real key through and the browser's own activation makes the click. So **Enter on a button is a key; Enter on a clickable non-button (heading) is a mouse click.** This is why round 2's structural fix works. |

## Steps

| # | Do | Result | What NVDA said (short) |
| --- | --- | --- | --- |
| F3 | Load; Control+Home; Enter on the skip link | **Pass** (F3 fixed, heard) | Control+Home: "main landmark, same page, link, Skip to decision". Enter: focus on the decision heading, "Your Main phase, region, Your Main phase, heading, clickable, level 2". The skip link is the first stop and works. |
| 1 | Attack with the Leader; `M`; read the panel | **Pass** (via the description); **Note** (browse silent) | Enter on the target: focus on Confirm attack, "Decision actions, decision actions. Confirm attack , 5000 vs 5000, button, Kaido 5000 against their Leader 5000. Result depends on When Attacking . Level: ties go to the attacker. They need plus 1000 to survive, 2 cards in hand. Enter to attack, Escape to go back." All four facts (attacker power, defender power, the gap, counters needed) are heard. `M` re-reads the same. **14 `Browse:Next` presses afterwards were silent** (rows 10 to 23, no speech at all); in r2 the same keys read the panel cell by cell. See L-SR19. |
| 2 | Enter to confirm; Use; pick; Done | **Pass** (L-SR1 fixed, heard); **Note** (L-SR21) | Enter on Confirm attack: the live line "You: Kaido attacks their Leader Your Kaido: Give up to 1 of your opponent's Characters minus 2000 power." Focus is on Use; **"Use, button" and the prompt "Kaido: pay DON minus 1 to use this effect" were not spoken** (L-SR21). Use: "You: Return 1 DON to the DON deck. Choose, heading". Pick: "Candidates, grouping, X dot Drake 2000, toggle button, not pressed", Enter: "1 of up to 1 chosen, pressed". Done: "You: X dot Drake minus 2000 ... Choose what resolves first, heading ... Order, grouping, First: Kaido (DON returned): ...". Probe: see the trace table. |
| F15 | `.` after Done | **Note** (not reproduced; no counterfactual) | Enter on the order option: "Rocks dot D dot Xebec: Counter: X dot Drake plus 2000." (on a timer). `.`: "Rocks dot D dot Xebec: Counter: Yamato plus 1000. You: Attack fails 5000 vs 8000." Focus after: the new "Your Main phase" heading. |
| 2b | AI defends | **Pass as built** (no longer mislabelled; seeded from the live history) | Counters and "Attack fails 5000 vs 8000" heard in F15's rows. The Counter-sentence-with-totals half is **not built** (carried note). |
| 3 | `L`, `L`, `L`, then a fourth | **Pass** (L-SR10 fixed, heard; but see L-SR16) | Tier 1: "Lethal: proven, works against any hand." then the whole coach read aloud (focus moved into it). Tier 2: "You need 1 hit. You have 2 attackers." Tier 3: "You have lethal: 1 hit, and they can't stop any of them. Wins the game this turn." and the coach read as "Proven, region, You have lethal ... heading, level 3 ... The line, list, Attack their Leader with Kaido (12000)., Show step 1 on the board ... More: why it works, button, collapsed". **Fourth `L`: "That is everything the coach has for this turn. You have lethal: 1 hit, and they can't stop any of them. Wins the game this turn."** Coach mode "tall"; one ordered list, one heading. Every `L` left focus in the coach ("group Lethal"); the harness moved it back to the board four times. |
| 4 | `C`; read the coach with the virtual cursor | **Note** | `C` from the board said **nothing** both times (rows 1, 2; focus stays on the board, the coach strip then tall). Reading the coach by browse: "Coach sections, grouping, The C key works from the board. Here, press Enter."; "Lethal, toggle button, pressed, The L key works from the board. Here, press Enter."; "Collapse the coach"; "Lethal, grouping, Proven"; "region, heading, level 3, You have lethal ...". `Browse:Heading` "no next heading" twice (the cursor was already past the only heading), `Browse:List`: "The line, list, with 1 item, Attack their Leader with Kaido (12000)." Browse mode, the heading and the list all work inside the open coach, which closes the r2 gap. |
| 4b | Count it with me: question 1, wrong then right | **Pass** (L-SR13a fixed) | Enter: "Count it with me. Question 1: how many hits do you need?" then the panel ("Hits needed, spin button, editable ... Back, button, unavailable, Next, Check my count ..."). Wrong (3): "Hits: not quite. They have 0 Life, so you need 0 plus 1 equals 1 hits." **Only the question asked is graded now** (r2 also said "Attackers: not quite ... Split: not quite"). Right: "Hits: right. 0 Life, plus 1." |
| 4c | Questions 2 to 4, Close | **Pass** | "Question 2: Which of your cards can attack their Leader this turn?"; cards "Kaido 12000, toggle button, not pressed" then "pressed"; "Attackers: right. Those are the cards that can attack their Leader." "Question 3: How much can they stop?" with a three-item list. "Question 4: Split your DON": a table ("table, with 3 rows and 4 columns ... Fewer DON for Kaido, button, 0, More DON for Kaido, button ..."). "Split: right. Each attack beats what they can have by then." Close: focus on the "Lethal" group in the coach. Enter on "More DON for Kaido" is **still silent** (rows 40, 41: L-SR13c). |
| 5 | Detector silent, then on | **Pass** (note: not built) | "Detector off, 3 s idle: 0 live-region writes (silent)". Select: "Tier 1 always on", "Tier 2 always on". `+`: "Give DON to Kaido, dialog ... 1: Kaido 13000"; Enter: "You: Give 1 DON to Kaido. You need 1 hit. You have 2 attackers." (badge "1 hit", L-SR13b fixed in the badge). **Not built:** "Coach alerts", "Lethal available". |
| 5b | `C` and `L` from the board while the battle panel is up (L-SR2) | **Pass** (L-SR2 fixed, heard) | Confirm attack: "Kaido 13000 against their Leader 5000: hits unless they counter. Gap: ahead by 8000. They need plus 9000 to survive, 0 cards in hand." `C`: **"The coach opens when this decision is done. Finish or cancel it, then press C."** `L`: "You have lethal: 1 hit, and they can't stop any of them. Wins the game this turn. The numbered line is in the coach, which opens when this decision is done." `L` again: "That is everything the coach has for this turn ..." plus the same sentence. Third and fourth `L`: silent. Escape twice: the position is unchanged. |
| 6 | Reload on the planted record; concede; review; timeline; `N` | **Pass** (L-SR3 fixed, heard; L-SR8 open) | Menu, Concede, dialog read. "Rematch, or New game." and the assertive "Game over. You lose on turn 9." "Review this game, button". Enter: focus on "Game review", "main landmark, Game review, heading, level 1 ... 1 flag 1 severe ... Turn timeline. Left and Right arrows move between turns, N between flags., turn timeline ... T 9 You Severe dot Turn 9, your turn: missed lethal, severe, holds whatever they held., button, current". ArrowRight ×4 silent. `n`: "Flag 1 of 1 selected. Turn 9, your turn: missed lethal, severe, holds whatever they held." One turn, one flag: movement between turns is still unproven. |
| 7 | Enter on the flag; Study; `Q` | **Pass** (L-SR5 fixed, heard) | Enter: "Flag 1 of 1 selected ...". Tab ×3: "Selected flag turn 9, region, You had lethal this turn., region, Sources, button, collapsed", "Study this moment, button". Enter: "main landmark, Study this moment, region, Overview, Esc, button". Board: "Game board, turn 9, your main phase, read-only, game board". `Q`: "... Read-only: nothing here is played." Focus moves to "Overview", not the explanation (not built as written). |
| 8 | Practice this | **Pass** (L-SR4 fixed, heard) | Enter: "Practice: turn 9 as it stood. Nothing is timed. Find the win you missed." then "main landmark, Your Main phase, region, Your Main phase, heading". Chip "Practice"; no timer; same board zones. |
| 9 | Play the line | **Fail** (L-SR20, L-SR9) | `+`: "Give DON to your Leader, dialog ... 1: your Leader 6000"; ArrowUp: "your Leader: 5000 to 7000 this turn" (arrows now say "to"). Enter: "You: Give 4 DON to Kaido." Confirm: "Kaido 9000 against their Leader 5000. Result depends on When Attacking . Gap: ahead by 4000. They need plus 5000 to survive, 2 cards in hand." Use is silent as in step 2. Skip: "You: Your Kaido: effect not used." `.`: "You: Hit 9000 vs 5000. Rocks dot D dot Xebec: Life card to hand their Life 1 to 0." Second attack: "You: Kaido attacks their Leader." then **"Game over. You win on turn 9." and "Rematch, or New game."** The live log shows a polite **"Solved: you found lethal."** written 2 ms before "Rematch, or New game." and **never spoken** (r2 spoke it). The explanation is not announced. |
| 10 | Play from here | **Pass** (L-SR4 fixed, heard) | Enter: **"Playing from turn 9, as it stood."** then "main landmark, Your Main phase, region, Your Main phase, heading"; focus on that heading. The detector's "You need 2 hits. You have 2 attackers." was written 49 ms earlier and **not spoken** (L-SR20). |

Pass: 13 (F3, 1, 2, 2b, 3, 4b, 4c, 5, 5b, 6, 7, 8, 10). Note: 2 (F15, 4). Fail: 1 (9). Not reached: none.

## Verdicts on the carried findings

| ID | Old sev | New sev | Status | Evidence |
| --- | --- | --- | --- | --- |
| F3 | 1 | **closed** | **Fixed (heard)** | Control+Home: "same page, link, Skip to decision"; Enter lands in the decision panel (focus on the heading). |
| F15 | 1 | **1** | **Still open (unresolved)** | `.` after Done moved the game and was heard, but the AI answers on timers that start at once (the Counter arrived before `.`), so there is no counterfactual. The script's "F15 STILL OPEN: focus is stranded on the decision heading" is a false positive: the waiting panel's own heading holds focus until the new decision arrives, and focus then moved to the new heading. The real open item is in DECISIONS: `.` does not advance a paused AI although §3.13 says it should (`nextMove` acts only at Step pace). That is an app or spec discrepancy, not an NVDA one. |

## Findings

| ID | Sev | Status | Browsers | Finding |
| --- | --- | --- | --- | --- |
| L-SR1 | 2 | **Fixed (heard)** | Chrome | Focus lands on "Confirm attack" with the maths as its description; Enter attacks (key delivered, trace). Enter on the heading is a mouse click and only focuses it, by design. |
| FF-L1 | 2 | **Not reached** | Firefox | Firefox-specific (focus on `<body>` after Enter on the heading); see the Firefox r3 record (NVDA silent there). |
| L-SR2 | 2 | **Fixed (heard)** | Chrome | "The coach opens when this decision is done. Finish or cancel it, then press C." and "The numbered line is in the coach, which opens when this decision is done." (5b). |
| L-SR3 | 2 | **Fixed (heard)** | Chrome | "turn timeline" application region; `N`: "Flag 1 of 1 selected. ..." Caveat: one turn, one flag. |
| L-SR4 | 2 | **Fixed (heard)** | Chrome | Review heading focused and read; Practice and **Play from here** both spoken and focus on the board's heading. |
| L-SR5 | 2 | **Fixed (heard)** | Chrome | "Game board, turn 9, your main phase, read-only"; `Q` ends "Read-only: nothing here is played." |
| L-SR6 | 1 | **Not reached** | Chrome | The browse-mode read of the panel (the run-on "Attacker Kaido (your Leader)base 5000...") was silent in r3 (L-SR19), so the cells were not heard. The description carries the facts. |
| L-SR7 | 1 | **Changed (mostly fixed)** | Chrome | Now heard as "to": "Attack Kaido to their Leader", "their Life 1 to 0", "5000 to 7000 this turn". One left: the review's "← Back to the board" is still spoken "left arrow Back to the board" (step 10, rows 3 and 5). |
| L-SR8 | 1 | **Still open** | Chrome | "T 9 You Severe dot Turn 9, your turn: missed lethal, severe, holds whatever they held., button, current": text and description both spoken. |
| L-SR9 | 1 | **Still open** | Chrome | On-screen "Solved: you won on the turn it was cut from." against the live "Solved: you found lethal."; the puzzle end also speaks "Rematch, or New game."; the explanation is not announced. Worse in r3: the live line was lost (L-SR20). |
| L-SR10 | 1 | **Fixed (heard)** | Chrome | Fourth `L`: "That is everything the coach has for this turn. You have lethal ...". |
| L-SR11 | 2 | **Not reproduced** (downgraded to 1) | Chrome | Tab from the heading went to Cancel; the keydown reached the heading handler (trace). Moot with focus on Confirm attack. Reopen if it recurs. |
| L-SR12 | 1 | **Changed** | Chrome | The coach buttons now say "The L key works from the board. Here, press Enter." and "The C key works from the board. Here, press Enter." (heard, step 4). The underlying behaviour (NVDA owns `L` and `C` once focus is in the coach) remains and is now the root of L-SR16. |
| L-SR13 | 1 | **Changed (a fixed, b partly, c open)** | Chrome | (a) Only the question asked is graded: fixed, heard. (b) "1 hit" in the badge: fixed; the reason text still says "0 plus 1 equals 1 hits" (`ai/explain.ts`, not touched: "Not done" in DECISIONS). (c) Enter on "More/Fewer DON for Kaido" is still silent. |
| L-SR14 | 1 | **Not measured** | Chrome | r3's assists bypass every coach-to-board return (below). The path grows with the log, so the short game here under-states it. |
| L-SR15 | 1 | **Not reached** | Firefox | Firefox-only ("Checking..." read before the result). |
| L-SR16 | 2 | **New** | Chrome (Firefox likely) | **`L`, `L`, `L` cannot be pressed in a row under NVDA.** Every `L` from the board moves focus into the coach (`Coach.tsx` 45 to 54, by §2.1's "focus goes to the result when the player pressed a coach key"; log: focus "group Lethal" after each `l`). The next `L` is then NVDA's own "next list" ("no next list", r2 evidence). The harness hid it with four "focus moved to the board" assists in step 3. The L-SR12 fix only added a hint on the coach buttons, which a user meets only after the failure. A user can reach tier 3 by Enter on "How many hits?" or Show the line, but §11.4 step 3 ("L, L, L") is not achievable as written. Fix options: leave focus on the board on `L` and announce the tier (the coach is already a live read), or move focus only on tier 3. |
| L-SR17 | 1 | **New** | Chrome | Enter on a focused heading is a mouse click under NVDA (no `keydown`), but a real key for everyone else (the app's "Enter commits the primary" handler, `Game.tsx` 723 to 728, listens for keydown; Firefox's no-NVDA trace shows it firing). Decisions whose focus lands on a heading ("Choose", the waiting panel, "Your Main phase") therefore behave differently by reader. Harmless now for the attack; audit panels whose text says "Enter". |
| L-SR18 | 1 | **New (observation)** | Chrome | In the guided count the tab order is Back, **Next, Check my count**, Show the line, Close (4c rows 17 to 19). After "Check my count" the next step, "Next", is one Shift+Tab back with no cue; Tab goes to "Show the line", "Close", then out of the coach. The harness walked forward five stops and back (the "Tab did not reach it quickly" assists). |
| L-SR19 | 1 | **New (cause unverified)** | Chrome | After `M` (focus on Confirm attack), 14 `Browse:Next` presses produced **no speech**; in r2 the same keys read the panel. Likely NVDA entered focus mode on the button (ArrowDown then goes to the page), but nothing in the log shows the mode. The description covers attacker, defender, gap, counters needed; the "What they could have" line ("up to +4000 if each is one of their deck's +2000 Counters") and the rule citation reach a user only through that silent read. May be sev 2 if a user presses Down to read the panel and hears nothing. Needs a manual NVDA check or a harness probe of the browse/focus mode. |
| L-SR20 | 2 | **New** | Chrome | **Two polite lines were lost**: "Solved: you found lethal." (written 2 ms before "Rematch, or New game.") and "You need 2 hits. You have 2 attackers." (49 ms before "Playing from turn 9, as it stood."). Cross-checking every live write against the speech tap, these are the only two lost, but both are on the slice's key moments (the puzzle result, the restored position's lethal count). The announcer replaces or races the text in one polite region (`Game.tsx`, the `announce-polite` pair of spans), so a second write inside about 100 ms wins. Fix: queue lines (150 to 300 ms apart) or merge into one sentence. |
| L-SR21 | 2 | **New** | Chrome | **The Optional-effect decision is silent.** After Enter on Confirm attack, focus moves to "Use" but NVDA says only the live line "You: Kaido attacks their Leader Your Kaido: Give up to 1 ... minus 2000 power." Not spoken: "Use, button", the heading "Optional effect", the cost ("pay DON minus 1") and "Skip". Same in step 9. The choose decision after it is spoken. Probably the removed Confirm button leaves NVDA with no object to announce a focus change from. Fix: a short live line that names the choice and the cost, or focus the heading first. |
| L-SR22 | 1 | **New** | Chrome | `C` from the board opens or closes the coach with no speech and no focus change (step 4 rows 1 and 2). A user does not learn it opened. |
| L-SR23 | 1 | **New (observation)** | Chrome | Confirm attack's name and description repeat the maths and carry stray punctuation: "Confirm attack , 5000 vs 5000, button, Kaido 5000 against their Leader 5000. Result depends on When Attacking ." (space-comma in the name; space before the full stop after the bracketed keyword). |

**Not built (no severity):** the Counter sentence with totals and the tie rule; "Coach alerts" and "Lethal available"; the timeline as a toolbar; focus to the explanation when Study opens; "Declare no lethal"; the guided count's board sandbox; Hint, DON!! math and Tempo sections.

## Do the "Harness assist" notes hide a real problem?

| Assist | What it replaced | Hides a real problem? |
| --- | --- | --- |
| Step 3, four times: "focus moved to the board: L is pressed from the board" | The return from the coach to the board after each `L` | **Yes: L-SR16** (the user cannot press `L` repeatedly) and L-SR14 (the way back is a long Shift+Tab walk through the log's Rewind and Why buttons, which grows with the game; here the log had two entries). |
| Step 4: "focus moved into the coach to read it (Tab out of the board)" | The board-to-coach path | Not measured. `L` itself moves focus in, so the coach is reachable in one key; `C` does not (L-SR22). |
| Steps 4b and 4c: "Tab did not reach it quickly" (3 assists) | In 4b, the spin button after reading the question by arrows; in 4c, "Next" after "Check my count" | **Partly.** In 4b the Browse reading moved NVDA's position past the field, so Tab went on to "Next": normal screen-reader behaviour, one Shift+Tab. In 4c the harness walked Tab forward ×5 out of the coach and Shift+Tab ×5 back because "Next" precedes "Check my count": **L-SR18** is the real finding; the path for a user who knows it is a single Shift+Tab. |
| Step 5: "focus moved to the board" | The return after setting the Detector | L-SR14 again. |
| Step 6: Game menu, "keys were not reaching the page", the Concede button, the timeline | Reaching the menu; the Concede dialog; the timeline | The dialog is a native `<dialog>.showModal()` (`Dialogs.tsx` 114); "Concede" precedes "Keep playing" (lines 52 to 66) and "Keep playing" is focused first, so Tab from it leaves the page for the browser (platform behaviour for modal dialogs) and the right key is Shift+Tab. Harness error (`l.ts` 785), no app fault. The timeline assist skips one Tab stop after the header: the review's Tab order is Back, timeline, table, Sources, Study (step 10 rows 3 to 8), 4 stops, fine. |
| Step 7: "focus moved to the restored board" | Board after Study | Two Shift+Tab from "Overview" to the board: short. No problem. |

So the Tab-speed assists mostly hide **navigation costs, not blockers**; the one that matters is the coach-to-board return that every `L` forces.

## Harness notes (not app findings)

1. **Step 6** `until('Tab', Concede)` (`l.ts` 785): use Shift+Tab, or `Tab` ×1 from the dialog's first control.
2. **F15's verdict line** prints "STILL OPEN" when focus is on the waiting panel's heading; test for "focus on a removed or stale element" instead.
3. **Step 3** should press `L` from the board twice without an assist and record the second as the failure it is (L-SR16).
4. **Step 1** should record whether NVDA is in browse or focus mode when the browse keys are silent (L-SR19).
5. A new check: every live write should be matched against the speech tap and the unmatched ones listed (this is how L-SR20 was found); worth keeping as a table in the record.

**What worked well:** the Confirm attack description (all four facts in one focus), the L-SR2 and L-SR10 lines, the review and Play from here focus and announcements, the coach read in browse mode with a heading and a list, the guided count end to end with one-question grading, the read-only board, the DON!! dialog's live total.

## §11.4 coverage

| Step | Heard in Chrome? |
| --- | --- |
| F3 | Yes, including Enter on the skip link |
| 1 | Yes (the description); the browse-mode read of the panel was silent (L-SR19) |
| 2 | Yes; the Optional-effect focus is silent (L-SR21) |
| F15 | Yes (no counterfactual; not closable by this script) |
| 2b | Yes, as built |
| 3 | Yes, with the focus workaround assist (L-SR16); L after tier 3 heard (L-SR10) |
| 4 | Yes for browse mode, the heading and the list inside the open coach; `C` from the board is silent |
| 4b, 4c | Yes |
| 5 | Yes |
| 5b | Yes (L-SR2) |
| 6 | Yes (one turn, one flag) |
| 7 | Yes |
| 8 | Yes |
| 9 | Heard, but the "Solved" line and the explanation were not (L-SR20, L-SR9) |
| 10 | Yes (Play from here) |

**Sufficient for the L pass decision: yes for Chrome.** Residuals for the next run: movement between turns (needs a second turn on the record), F15's counterfactual (needs the §3.13 behaviour or a paused-AI position), L-SR6 and L-SR19 (the panel body by browse), and every L-SR16 to L-SR22 fix.
