# L screen-reader pass, second run: NVDA + Chrome

**Kind of pass:** scripted (Guidepup), not a human listening pass (accessibility.md §11.2, risk R9). Second run of the §11.4 script (`app/a11y/src/l.ts`) after fix round 1 (DECISIONS "2026-11-09 — L screen-reader fix round 1", commit `4054294`). First run: [l-nvda-chrome.md](l-nvda-chrome.md). Firefox: [l-nvda-firefox-r2.md](l-nvda-firefox-r2.md). Finding numbers are shared by both browsers and both runs.
**Result:** **PASS by the rule** (no open severity 3 or 4; three open at severity 2: L-SR1, L-SR11, and L-SR2 unverified). **Coverage: sufficient for the L pass decision, not for closing every fix.** Every §11.4 step was heard at least in its as-built form (table at the end). Not heard, so the fix is still unverified: L-SR2 (the "coach opens when this decision is done" lines), L-SR10 (the "everything the coach has" line), "Play from here", and the browse-mode keys inside an open coach (step 4). **L-SR1, the headline fix, did not work** (Enter on the attack heading still does nothing), and fix round 1's verdict in DECISIONS ("fixed in code") is wrong for it.
**Date:** 2026-11-09.

## Versions

| Item | Version |
| --- | --- |
| NVDA | 2026.2 (Guidepup's portable build, default configuration; the log header says `NVDA_VERSION 2026.2`) |
| Browser | Google Chrome, harness-reported "chromium 156.0.8078.80" (Playwright `channel: 'chrome'`, headed) |
| Guidepup | `guidepup 0.38.0, @guidepup/playwright 0.21.0` |
| Windows image | GitHub Actions `windows-2025` (`win25-vs2026 20261103.298.1`) |
| App commit | `4054294` on `main` (the log header) |
| Workflow run | GitHub run 42659930386, file `app/a11y/results/nvda-chrome/l.md` (and `l.json`). The log is not committed |
| Speech source | The NVDA Remote speech tap (every phrase NVDA spoke, timestamped). Guidepup's per-key capture is off, so that column is empty by design |

## How it ran

- Steps F3 to 5 on `a11y-l` (Rookie as the AI); steps 6 to 9 reload on `lethalDemo`, concede, and open the review.
- The harness wrote two "HARNESS: did not reach" notes in Chrome: step 2 (the attack confirmed by Enter, **an app failure the script correctly labelled, see L-SR1**) and step 2b (a **harness** logic error, see the table below). The lead's list also named "Chrome step 3, tier 3 with the coach tall": that note is **Firefox's**; in Chrome step 3 did reach tier 3 with the coach `tall`.
- Step 2: Enter on the heading did nothing, so the harness Tabbed to "Confirm attack" (the fallback) and the rest of the step ran: Use, pick, Done, the `order` decision. The attack therefore *was* confirmed this time, which r1's Chrome run never managed, and F15, 2b, 3, 4b, 4c, 5 and 9's flow were heard.
- **Harness assists** (all recorded in the log): the three `L` presses in step 3 and the Tab loops to the coach controls and back to the board went through the browser toolbar and the harness re-clicked the page ("Keyboard focus left the page", about 10 times in 4b to 5); step 6: focus put on the Game menu and on the timeline by script; step 7: on the board by script. The guard added in round 1 (`pageHasFocus`) worked in Chrome.
- Judged against §11.4 as amended by DECISIONS "2026-11-09 — L screen-reader script built" and STATUS "Not done" (what was not built is a Note, not a Fail).

## Steps

| # | Do | Result | What NVDA said (short) |
| --- | --- | --- | --- |
| F3 | Load; Control+Home; Tab; Enter on the link | **Note** (harness; severity 1 carried) | Control+Home: "main landmark, same page, link, Skip to decision". Tab: "Your Main phase, region, Your Main phase, heading, clickable, level 2". The script marks this "FAILED" again and **never reached its new Enter-on-the-link check** (it runs only if Tab lands on the link). Skip link is heard first when Tab enters the page from the toolbar (step 4b row 3: "Skip to decision, same page, link"). |
| 1 | Attack with the Leader; `M`; read the battle panel | **Pass** (L-SR6, L-SR7) | Enter on the target: "Kaido 5000 against their Leader 5000. Result depends on When Attacking . Enter to attack, Escape to go back." `M`: "Attack Kaido right arrow their Leader, heading, clickable, level 2". Browse-next: "Attacker Kaido (your Leader)base 5000Defender Their Leaderno change 5000Result depends on When", "They need plus 1000 to survive 2 cards in hand", "What they could have, region, heading, level 3", a two-item list, "Ties go to the attacker (CR 7-1-4-1)." All four facts heard. |
| 2 | Enter to confirm; Use; pick; Done | **Fail** (L-SR1, L-SR11); the rest **Pass** via Tab | Enter on the heading: no speech, no live write, focus still the heading, decision "main", panel unchanged. Tab: "Event log, region, Game log, grouping" (it skipped Cancel and Confirm attack, L-SR11); Shift+Tab: "Decision actions … Confirm attack , 5000 vs 5000, button". Enter: "You: Kaido attacks their Leader Your Kaido: Give up to 1 of your opponent's Characters minus 2000 power." Use prompt, pick ("1 of up to 1 chosen, pressed"), Done: "You: X dot Drake minus 2000." then "Choose what resolves first, heading … Order, grouping, First: Kaido (DON returned): …". |
| F15 | `.` after Done | **Pass** (not reproduced; see F15 verdict) | Enter on the `order` option: "You: Your Kaido: Add up to 1 active DON … Kaido attacks their Leader, heading … Rocks dot D dot Xebec: Counter: X dot Drake plus 2000." (the AI's first Counter, on a timer). `.`: "Rocks dot D dot Xebec: Counter: Yamato plus 1000. ⏐ You: Attack fails 5000 vs 8000." Focus went to "Your Main phase, heading". |
| 2b | AI defends, Main again | **Pass as built** (harness mislabelled it "not reached"); count sentence **Note: not built** | The two Counters and "Attack fails 5000 vs 8000" were heard in F15's rows. 2b itself pressed no key: the game was already in Main. The panel-totals half ("5000 + 2000 7000") was not read after the counters (the panel closed first). |
| 3 | `L`, `L`, `L` | **Pass** (L-SR12; L-SR10 not reached) | First `l` from the board: "Lethal: proven, works against any hand." and focus moves into the coach, which NVDA reads whole ("Coach, region, Lethal, grouping, Lethal is on the board., heading, level 3, Proven, Works against any hand, How many hits?, L, button, Detector …"). A second `l` with focus in the coach: **"no next list"** (NVDA's own L; L-SR12). The harness went back to the board: `l`: "You need 1 hit. You have 2 attackers." Again: "You have lethal: 1 hit, and they can't stop any of them. Wins the game this turn." and the coach read out its tier-3 form: "Proven, region, You have lethal: 1 hit, and they can't stop any of them., heading, level 3 … The line, list, Attack their Leader with Kaido (12000)., Show step 1 on the board …, More: why it works, button, collapsed". Coach mode "tall"; one ordered list, one heading. |
| 4 | `C`; read the coach with the virtual cursor | **Note** (partial) | `c` with focus in the coach: **"Detector, combo box, collapsed, Ask me"** (NVDA's C, L-SR12), so `C` was not exercised. Browse-next walked Detector, "DON math on the board", "out of grouping, out of region, Your turn", Game menu, Fullscreen, Leave. `Browse:Heading` ×2 "no next heading", `Browse:List` "no next list": the cursor started below the coach's heading and list, so this proves nothing about them. Their presence was heard in step 3's tier-3 readout (heading level 3, a list "The line"). |
| 4b | Count it with me: question 1, wrong then right, Check my count | **Pass** (L-SR13) | Enter: "Count it with me. Question 1: how many hits do you need?" (polite) then the whole panel: "Count it with me, heading, level 3, Question 1 of 4 nothing is played, How many hits do you need?, heading, level 4, Hits needed, spin button, editable … Back, button, unavailable, Next, Check my count, Show the line, Close". Wrong (3), Check my count: "Hits: not quite. They have 0 Life, so you need 0 plus 1 equals 1 hits. Attackers: not quite. 2 attackers missing. Split: not quite. Stage your DON and the order of attacks first." Right (1): "Hits: right. 0 Life, plus 1. Attackers: not quite …". |
| 4c | Questions 2 to 4, Close | **Pass** | Next → "Question 2: Which of your cards can attack their Leader this turn?"; cards "Kaido 12000, toggle button, not pressed" then "pressed"; Check: "Attackers: right. Those are the cards that can attack their Leader." "Question 3: How much can they stop?" with a three-item list. "Question 4: Split your DON": a table ("table, with 3 rows and 4 columns, row 2 … Fewer DON for Kaido, button … Move Kaido earlier, button"). Check: "Split: right. Each attack beats what they can have by then." Close: focus on the "Lethal" group in the coach, not the decision heading. The two `Enter` presses on "More DON for Kaido" were **silent** (rows 42, 43); the new value is heard only on the next read (L-SR13). |
| 5 | Detector silent, then on | **Pass** (note: not built) | "Detector off, 3 s idle: 0 live-region writes (silent)". Select: ArrowDown "Tier 1 always on", "Tier 2 always on" (the select says its value, nothing else). After `+`, Enter (a DON!! given): "You: Give 1 DON to Kaido. ⏐ You need 1 hit. You have 2 attackers." (polite, once). Button renamed "Lethal 1 hits" (badge). **Not built:** "Coach alerts", "Lethal available". |
| 6 | Reload on the planted record; concede; review; timeline; `N` | **Pass** (L-SR3 fixed; L-SR8) | Concede dialog read. "Game over. You lose on turn 9." (assertive), "Rematch, or New game." Tab: "Review this game, button". Enter: **focus on the "Game review" heading**: "Game review, main landmark, Game review, heading, level 1 ⏐ 1 flag 1 severe ⏐ Turn timeline. Left and Right arrows move between turns, N between flags., turn timeline ⏐ Turns, left to right, list … T 9 You Severe dot Turn 9, your turn: missed lethal, severe, holds whatever they held., button, current". ArrowRight ×4: silent (no longer read by character). `n`: **"Flag 1 of 1 selected. Turn 9, your turn: missed lethal, severe, holds whatever they held."** Flag text with certainty heard in the same sentence and the table row. **Note (not built):** timeline as a toolbar. With one turn and one flag, movement between turns is still unproven. |
| 7 | Enter on the flag; Study; `Q` | **Pass** (L-SR5 fixed; note) | Enter on the flag: the "Flag 1 of 1 selected" line. Tab ×3: "Selected flag turn 9, region, You had lethal this turn., region, Sources, button, collapsed", "Study this moment, button". Enter: "main landmark, Study this moment, region, Overview, Esc, button" (no more "left arrow"). Board (harness-focused, then Shift+Tab): **"Game board, turn 9, your main phase, read-only, game board"**. `Q`: "Turn 9, your main phase, read-only. You: 3 Life, 0 cards in hand … Read-only: nothing here is played." **Note (not built):** focus moves to "Overview", not the explanation. |
| 8 | Practice this | **Pass** (L-SR4 fixed) | Enter: **"Practice: turn 9 as it stood. Nothing is timed. Find the win you missed."** (polite) then "main landmark, Your Main phase, region, Your Main phase, heading, clickable, level 2"; focus on that heading. DOM: chip "Practice", no timer, same board zones. |
| 9 | Play the line | **Pass** (L-SR9) | `+` dialog: "Give DON to your Leader, dialog … DON to give, 1 of 4 active, spin button, 1: your Leader 6000", ArrowUp: "your Leader: 5000 right arrow 7000 this turn". Enter: "You: Give 4 DON to Kaido." Attack, Use, Skip: "You: Your Kaido: effect not used." `.`: "You: Hit 9000 vs 5000. ⏐ Rocks dot D dot Xebec: Life card to hand their Life 1 right arrow 0." Second attack, `.`: "Solved: you found lethal. ⏐ Rematch, or New game. ⏐ (assertive) Game over. You win on turn 9." Explanation not announced. **Note (not built):** "Declare no lethal". |

Pass: 11 (1, F15, 2b, 3, 4b, 4c, 5, 6, 7, 8, 9). Fail: 1 (2). Note: 2 (F3, 4). Not reached by speech: none entirely; see the coverage table.

## Verdicts on the carried findings

| ID | Old sev | New sev | Status | Evidence |
| --- | --- | --- | --- | --- |
| F3 | 1 | **1** | **Changed: unproven, harness still wrong** | The skip link is the first stop from the toolbar (4b row 3). The script's Control+Home then Tab path leaves NVDA's cursor on the link, so the next Tab skips it, and the new Enter-on-the-link check never ran. Fix the script (see "Harness"). |
| F15 | 2 | **1** | **Not reproduced; downgraded, not closed** | `.` after Done moved the game and was heard. But the first AI Counter arrived on a timer, and the second came within 800 ms of `.`, so there is no counterfactual (AI timers would have moved it anyway; the step-pace note in the log says as much). Focus sits on the decision heading while the game is "waiting", which the script itself prints as "F15 STILL OPEN" even though its expectation ("`.` moves the game on, **or** focus is not stranded") is met. Close it only with a run that presses `.` before any timer can fire. |

## Findings

| ID | Sev | Status | Browsers | Finding |
| --- | --- | --- | --- | --- |
| L-SR1 | 2 | **Still open: fix did not work** | Chrome, Firefox | Enter on the attack panel's heading does not confirm. Chrome: no speech, no live write, focus still on the heading. Not caused (as far as the log can show) by the `pointerdown` guard; see "Diagnosis". Step 2's rows 1 to 3. |
| FF-L1 | 2 | **Still open** | Firefox | See the Firefox record (focus on `<body>` after the same Enter, as in r1). |
| L-SR2 | 2 | **Not reached** | Chrome, Firefox | The tall-decision messages ("The coach opens when this decision is done…") were never exercised: the coach was already tall by the time `C` and `L` were pressed from the board, and in the coach NVDA takes both keys (L-SR12). Fix unverified. |
| L-SR3 | 2 | **Fixed (heard)** | Chrome | The timeline is an application region ("turn timeline"); arrows are silent instead of spelling the button's text; `N` says "Flag 1 of 1 selected. …". Caveat: one turn, one flag. |
| L-SR4 | 2 | **Fixed (heard)** | Chrome | Review: focus on the "Game review" heading with the screen read. Practice: spoken line and focus on the board's heading. "Play from here" not exercised. |
| L-SR5 | 2 | **Fixed (heard)** | Chrome | "Game board, turn 9, your main phase, read-only"; `Q` ends "Read-only: nothing here is played." |
| L-SR6 | 1 | **Still open** | Chrome | "Attacker Kaido (your Leader)base 5000Defender Their Leaderno change 5000Result depends on When". |
| L-SR7 | 1 | **Still open (partly fixed)** | Chrome, Firefox | "Attack Kaido right arrow their Leader", "their Life 1 right arrow 0", "5000 right arrow 7000 this turn". The Study button no longer says "left arrow" (fixed). |
| L-SR8 | 1 | **Still open** | Chrome | "T 9 You Severe dot Turn 9, your turn: missed lethal, severe, holds whatever they held., button, current": text and description both spoken. |
| L-SR9 | 1 | **Still open** | Chrome | Puzzle end speaks "Rematch, or New game." and the assertive "Game over. You win on turn 9."; the on-screen panel says "Solved: you won on the turn it was cut from." while the live line says "Solved: you found lethal." (two wordings). Explanation unannounced. |
| L-SR10 | 1 | **Not reached** | Chrome | No `L` was pressed after tier 3. |
| L-SR11 | 2 | **New** | Chrome | After the (failed) Enter, Tab from the focused heading went to "Event log, region, Game log", **skipping Cancel and Confirm attack**; Shift+Tab then found Confirm. Firefox's Tab went to Cancel, then Confirm. `Decision.tsx`'s heading `onKeyDown` is meant to send Tab to the panel's first button; here it did not. Cause unexplained. Investigate with the same event trace as L-SR1. |
| L-SR12 | 1 | **New** | Chrome, Firefox | Once focus is in the coach (outside the board's application region) NVDA takes `L` ("no next list") and `C` ("Detector, combo box"), though the coach's own buttons advertise "L" and "C". Only works from the board. A user is not told. Workaround: Enter on the buttons. |
| L-SR13 | 1 | **New** | Chrome | Guided count: (a) Check my count grades parts the user has not answered ("Attackers: not quite. 2 attackers missing. Split: not quite.") as soon as question 1 is checked; (b) "1 hits" (badge "Lethal 1 hits", "= 1 hits"); (c) the DON!! "More/Fewer" buttons say nothing when pressed. |
| L-SR14 | 1 | **New (observation)** | Chrome | From the coach, the board is about 17 Shift+Tab presses away (through every log entry's Rewind and Why buttons) or a trip out through the browser toolbar. I did not find a board-focus shortcut in `Game.tsx`. Landmark navigation (D) is the mitigation. |

**Not built (no severity):** the Counter sentence with totals and the tie rule; "Coach alerts" and "Lethal available" (Detector levels instead); the timeline as a toolbar; focus to the explanation when Study opens; "Declare no lethal"; the guided count's board sandbox; Hint, DON!! math and Tempo sections.

## Diagnosis of the "did not reach" notes

| Note | Harness or app | Evidence | Likely location |
| --- | --- | --- | --- |
| 2: Enter did not confirm (L-SR1) | **App**, cause undetermined (the lead's pointerdown hypothesis is not shown) | See "Diagnosis" below. | `app/src/play/rail/Decision.tsx` ~lines 108 to 119 (heading `onPointerDown`/`onClick`) |
| 2b: AI having defended | **Harness** | The log has no key rows for 2b. "Before `.` 1: decision "main"" and the loop broke at once; `sawAi` is only set inside 2b, but F15's `answerPlainly(order)` and one `.` had already played the whole defence (Counters heard in F15's rows). | `app/a11y/src/l.ts` step 2b (the `sawAi` loop and the final `p.reached`); merge 2b into F15 or seed `sawAi` from the live-region history |
| "Chrome step 3, tier 3 with coach tall" | **Not in this log** | Chrome step 3 recorded `Tier 3 (coach mode "tall"): lists: OL "The line"`. The note belongs to Firefox. | n/a |

## Diagnosis of L-SR1 (the lead's hypothesis, tested)

Hypothesis: NVDA's Enter sends a click that also fires `pointerdown`, so the guard `Date.now() - pointerAt.current < 1000` rejects it.

- **What the log proves:** Enter on the focused heading did not commit; no speech, no live write, decision "main", focus unchanged on the heading. It cannot tell "the click arrived and was rejected" from "no click reached the heading's `onClick`". The harness records no DOM events, so nothing in the log says a `pointerdown` happened.
- **For:** a click that arrives with a `pointerdown` within a second would behave exactly like this in Chrome.
- **Against, from the Firefox record:** Firefox's focus went to `<body>` after the same Enter, in r1 and again in r2. The first statement of the click handler is `e.currentTarget.focus()` (and has been since the M3 fix), and the heading has `tabindex=-1`. If the click had reached `onClick`, activeElement would be the heading, not body. So in Firefox the click almost certainly did not reach that handler as a click on that element, and the guard is not what stopped it.
- **Against, from how NVDA activates:** NVDA's browse-mode Enter calls `accDoDefaultAction` on the object. As I understand Blink's accessibility click path it dispatches a click without pointer events (so no `pointerdown`), but I have not verified that against Blink or Gecko source; treat it as unverified.
- **What was never validated:** the fix was tested only against `el.click()` (e2e `l-sr-fixes.spec.ts`) and a dry reader that does `el.click()`; the DECISIONS entry's premise "no pointer event" came from r1's silence, not from a measurement. A green dry run says nothing about NVDA here.
- **Verdict:** hypothesis not established; in Firefox it is contradicted. Next step is measurement, not another guess: add a capture-phase listener (via `page.addInitScript`) that records `pointerdown`, `mousedown`, `click` (with `isTrusted`, `detail`, `pointerType`, target id), `keydown` and `focus`/`blur` on `#decision-title`, and dump it into the step-2 record after the Enter.

## Harness notes (not app findings)

1. **Step 2b** is a logic error (above). F15 and 2b should be one step.
2. **F3** should press Enter on the link after Control+Home (the cursor is already on it), not Tab.
3. **Step 3** presses `L` with focus in the coach (NVDA takes it). The script already works around this by moving to the board; do that first, every time.
4. **Tab loops** (steps 3 to 5, 4b, 4c) walk out of the page, through the browser toolbar and back about 10 times. Chrome tolerates it; they should be replaced by a recorded assist (focus the control) rather than a loop.
5. **Step 6** reload plus the timeline and Study: the harness focused the timeline and the board by script (assists). Shift+N and movement between turns need a second turn on the record.

**What worked well:** the review and Practice focus and announcements; the "Flag 1 of 1 selected" line; the guided count end to end (questions, answers, the split as a table, Close returning inside the coach); the coach reading itself out on tier 3; the detector silent by default and one line after a move; the read-only board; the DON!! dialog's live "your Leader 9000".

## §11.4 coverage

| Step | Heard in Chrome? |
| --- | --- |
| F3 | Yes, as the Tab shape; the Enter-on-link check not run |
| 1 | Yes |
| 2 | Yes, but Enter-on-heading failed; rest via Tab |
| F15 | Yes (no counterfactual) |
| 2b | Yes, as built (inside F15's rows) |
| 3 | Yes (tier 3 heard; L after tier 3 not) |
| 4 | Partly: tier-3 structure heard; `C` and browse-mode navigation inside the coach not |
| 4b, 4c | Yes |
| 5 | Yes (silent half and the post-move line) |
| 6 | Yes (one turn, one flag) |
| 7 | Yes |
| 8 | Yes |
| 9 | Yes |

**Sufficient for the L pass decision: yes for Chrome.** Residuals to close in the next run: L-SR1 (needs the event trace), L-SR2 and L-SR10 (press `C` and `L` from the board while the battle panel is up), "Play from here", step 4's `C` and browse keys from the board side.
