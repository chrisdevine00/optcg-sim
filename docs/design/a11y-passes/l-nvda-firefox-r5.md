# L screen-reader pass, fifth run: NVDA + Firefox

**Kind of pass:** scripted (Guidepup), not a human listening pass (accessibility.md §11.2, risk R9). The Firefox-only rerun of the §11.4 script (`app/a11y/src/l.ts`) after fix round 3 (DECISIONS "2026-11-09 — L screen-reader fix round 3", commit `26b5c99`, the same code as Chrome r4). This is the first **valid** Firefox record since r2: r3 heard nothing and r4 was invalid (speech tap dead). Earlier runs: [l-nvda-firefox.md](l-nvda-firefox.md), [l-nvda-firefox-r2.md](l-nvda-firefox-r2.md), [l-nvda-firefox-r3.md](l-nvda-firefox-r3.md), [l-nvda-firefox-r4.md](l-nvda-firefox-r4.md). Chrome: [l-nvda-chrome-r4.md](l-nvda-chrome-r4.md). Finding numbers are shared by both browsers and all runs.
**Result:** **PASS by the rule** (no severity 3 or 4, none open at severity 2). **Coverage: sufficient.** Every §11.4 step, F3 and F15 was heard in Firefox; 14 steps Pass, 2 Note (F15, step 9), 0 Fail, 0 not reached. The harness's one "did not reach" (step 10, L-SR4) is a **harness false negative**: the app did it and NVDA said it (diagnosis below). One finding **reproduced across browsers and needs a decision**: L-SR25 (the Concede's two announcements are not spoken; Chrome r4 said "make it 2 if the Firefox rerun shows it too"; it does; I keep it at 1 and say why).
**Date:** 2026-11-09.

## Versions

| Item | Version |
| --- | --- |
| NVDA | 2026.2 (Guidepup's portable build, default configuration; `NVDA_VERSION 2026.2`) |
| Browser | Firefox 157.0 (harness "firefox 157.0"; Playwright's Firefox build, not a branded release) |
| Guidepup | `guidepup 0.38.0, @guidepup/playwright 0.21.0` |
| Windows image | GitHub Actions `windows-2025` (`win25-vs2026 20261103.298.1`) |
| App commit | `26b5c99` on `main` (the log header) |
| Workflow run | GitHub run 42678583126 (Firefox only), `app/a11y/results/nvda-firefox/l.md` and `l.json`. Not committed |
| Speech source | The NVDA Remote speech tap. It **passed the speech probe** and heard 349 phrases (232 key presses, 206 with speech). Per-key capture is off. **The JSON has a timestamp on every phrase** (the `heard` array of each step), so write-to-speech delay can be measured (below) |

Tap question left by r4 ("tap works in Chrome, dead in Firefox in the same job"): in a Firefox-only job the tap works. So the r3/r4 failure was run-order or process related (Firefox after Chrome in one job), not a Firefox limit. Inferred from two runs, not proven; a combined job should keep its probe.

## How it ran

- Scenario `a11y-l` for F3 to 5b (Rookie as the AI); steps 6 to 10 reload on `lethalDemo`, concede, open the review. The header `url` shows `lethalDemo`: the last page loaded.
- `unreached` has one entry: step 10, "Playing from turn 9 announced with focus on the decision heading (L-SR4)". Diagnosed below: harness.
- **Harness assists:** step 1 one; step 2 two (the heading probe; back to the board); step 3 two; step 4 two; 4b one ("Hits needed" field); 4c three ("Next", "Next", "Check my count": Tab did not reach it quickly); step 5 one; 5b two; step 6 two (Game menu, timeline); step 7 one; none in 8 to 10. Same set as Chrome r4. Assessed in the last section.
- Judged against §11.4 as amended by rounds 2 and 3.

## What the event traces show

- Enter on the focused heading `h2#decision-title` (step 2 note): `mousedown`, `mouseup`, `click (detail=1)`. **No `keydown`, and in Firefox no `pointerdown` either** (Chrome r4 had one, `pointerType=mouse`). NVDA's Enter on a "clickable" heading is a synthesized mouse click, as in Chrome (L-SR17 unchanged). The attack confirm stays open: the click does not commit.
- **Focus after that Enter is the heading itself**, not `<body>`. FF-L1 (r1, r2) does not reproduce (below).
- Tab from the heading: `keydown Tab`, `focusout`, `focusin` on Cancel. L-SR11 not reproduced (third run in a row).
- Enter on Confirm attack: `keydown Enter` then `click (detail=0)`.

## Steps

| # | Do | Result | What NVDA said (short) |
| --- | --- | --- | --- |
| F3 | Load; Control+Home; Enter on the skip link | **Pass** | Row 1: "main landmark, same page, link, Skip to decision". Enter: "Your Main phase, region, Your Main phase, heading, clickable, level 2". Focus on the heading, inside the decision panel. (The script reads the skip link from Control+Home in browse mode; it does not press a Tab. Same as Chrome.) |
| 1 | Attack with the Leader; `M`; read the panel | **Pass** (the description); **Note** (browse silent, L-SR19) | Enter on the target: "Decision actions, decision actions. Confirm attack, button, Kaido 5000 against their Leader 5000. Result depends on When Attacking. Level: ties go to the attacker. They need plus 1000 to survive, 2 cards in hand. Enter to attack, Escape to go back." No " ," in the name (L-SR23). `M` repeats it. **14 `Browse:Next` silent** (rows 10 to 23): the footer is `role="application"`, so L-SR19 is the same in Firefox. In r2 Firefox read the panel cell by cell; with the footer as an application region it no longer does. |
| 2 | Confirm; Use; pick; Done | **Pass** | Enter on the heading: **silent**, focus stays on the heading (FF-L2, FF-L1 closed). Tab: "Decision actions ... Cancel, button". `M` back: the description again. Enter on Confirm: "You: Kaido attacks their Leader Your Kaido: Give up to 1 of your opponent's Characters minus 2000 power. Kaido: pay DON minus 1 to use this effect (...)? Use it, or skip. **Use**" (L-SR21 heard; **"Use" is spoken here**, which Chrome r4 did not). Use: "You: Return 1 DON to the DON deck. Choose none, 0 of 1, heading, clickable, level 2, Choose". Pick: "Candidates, grouping, X dot Drake 2000, toggle button, not pressed"; Enter: "1, pressed, X dot Drake 2000 check 1". Done, 1 of 1; Enter: "You: X dot Drake minus 2000. ... Your effects triggered together (CR 8-6-1). Pick the one to resolve first. Choose what resolves first, heading ... Order, grouping, First: Kaido (DON returned): ...". |
| F15 | `.` after Done | **Note** (not reproduced; no counterfactual) | Same as Chrome: the AI's Counter came on its timer ("Rocks dot D dot Xebec: Counter: X dot Drake plus 2000."); focus on "Kaido attacks their Leader" heading (waiting). `.`: "Counter: Yamato plus 1000. You: Attack fails 5000 vs 8000. Your turn. Your Main phase", focus on the new heading. The script's "F15 STILL OPEN" would be a false positive (the waiting panel holds focus until the new decision arrives); the open item is §3.13 (`.` does not advance a paused AI at non-Step pace). |
| 2b | AI defends | **Pass as built** | Counters and result heard ("Counter: X dot Drake plus 2000", "Attack fails 5000 vs 7000" per the panel; the totals are in the panel, not in the sentence). The §11.4 sentence "Opponent countered +2000; Leader now 7000 vs your 7000. Tied: the attacker wins ties." is **not built** (carried). |
| 3 | `L`, `L`, `L`, then a fourth | **Pass** (L-SR16, L-SR15) | `L` 1: "Lethal: proven, works against any hand." (**the result, not "Checking..."**: L-SR15 not reproduced); focus stayed on "Your Kaido" (board). `L` 2: "You need 1 hit. You have 2 attackers." focus on the board, no assist before it. `L` 3: "You have lethal: 1 hit, and they can't stop any of them. Wins the game this turn." then the heading and the whole coach ("Coach, region, Lethal, grouping, Proven, region, You have lethal: ..., heading, level 3, Works against any hand, The line, list ... Detector, combo box ... DON math on the board, check box"). Fourth `L` (after an assist to the board): "That is everything the coach has for this turn. ..." |
| 4 | `C`; read the coach by browse | **Pass** | `C`: "Coach closed."; `C`: "Coach open." then, after the assist into the coach, "Coach sections, grouping ... Lethal, toggle button, pressed, The L key works from the board. Here, press Enter." Browse: "Collapse the coach, expanded", "region, heading, level 3, You have lethal ...", `Browse:Heading` twice "no next heading" (cursor already past the only heading), `Browse:List`: "The line, list, with 1 item, Attack their Leader with Kaido (12000)." |
| 4b | Count it with me, Q1 | **Pass** | Enter: "Count it with me. Question 1: how many hits do you need?" then the panel. Hits field: "Hits needed, spin button, has auto complete, editable". Tab order: **Next, then Check my count** (L-SR18). Wrong (3): "Hits: not quite. They have 0 Life, so you need 0 plus 1 equals 1 hit." (`1 hit`, L-SR13b). Right (1): "Hits: right. 0 Life, plus 1." |
| 4c | Q2 to Q4, Close | **Pass** (L-SR13c heard); **Note** (Move buttons; Close) | Q2: "Question 2: ..." (live), "Kaido 12000, toggle button, not pressed" then "pressed" (twice), "Attackers: right. ..." Q3: "What they can stop with, list, with 3 items, bullet No active Blockers." and two more bullets. Q4: "Question 4: Split your DON", the table with rows, "Fewer DON for Kaido, button", "More DON for Kaido, button"; **More: "Kaido: 1 DON , attack 1." then "Kaido: 2 DON , attack 1."** "Split: right. Each attack beats what they can have by then." The Move earlier/later buttons were tabbed but **not pressed** (harness note 3, carried), so their line was not heard. **Close: focus on the "Lethal" group and what NVDA read is the current coach ("Proven, region, You have lethal: ... The line, list ... DON math on the board"), not the closed guided count.** L-SR28 does not reproduce in Firefox. |
| 5 | Detector silent, then on | **Pass** (note: not built) | "Detector off, 3 s idle: 0 live-region writes". `ArrowDown` ×2: "Tier 1 always on", "Tier 2 always on". `+`: "Give DON to Kaido, dialog ... 1: Kaido 13000". Enter: "You: Give 1 DON to Kaido." and, after the board and focus lines, "You need 1 hit. You have 2 attackers." (the two writes are in the live record, in this order). |
| 5b | `C` and `L` with the battle panel up (L-SR2) | **Pass** | `C`: "The coach opens when this decision is done. Finish or cancel it, then press C." `L`: "You have lethal ... The numbered line is in the coach, which opens when this decision is done." `L` 2: "That is everything the coach has ... The numbered line is in the coach ..." **`L` 3 and `L` 4 are spoken in Firefox** (the same sentence again) although the harness records "(nothing written)". In Chrome r4 they were silent. See "Cross-browser differences". Escape twice: position unchanged ("Your Kaido ... 13000", decision "main"). |
| 6 | Reload; Concede; review; timeline; `N` | **Pass** (L-SR3 heard); **L-SR25 confirmed** | Menu "Rewind list..., 1 of 6" ... "Concede..., 5 of 6"; dialog "Concede this game?, dialog, It counts as a loss. You can still read the log."; Shift+Tab "Concede, button". Enter: heard "Game menu, button, collapsed" then "Game over, region, Game over, heading, clickable, level 2". **Neither "Rematch, or New game." nor the assertive "Game over. You lose on turn 9." was spoken** (both written, 36 ms after the key; see the timing below). Next key: "Review this game, button". Enter: "Game review, main landmark ... 1 flag 1 severe ... Turn timeline. Left and Right arrows move between turns, N between flags., turn timeline ... T 9 You Severe dot Turn 9, your turn: missed lethal, severe, holds whatever they held., button, current". ArrowRight ×4 and 6 `Browse:Next`: silent (the timeline is an application region, L-SR3). `n`: "Flag 1 of 1 selected. ..." One turn, one flag. |
| 7 | Enter on the flag; Study; `Q` | **Pass** | Enter: "Flag 1 of 1 selected. ..." Study: "Study this moment, region, Overview, Esc, button". Board: "Game board, turn 9, your main phase, read-only, game board". `Q`: "Turn 9, your main phase, read-only. You: 3 Life, 0 cards in hand, 4 of 4 DON active, 1 Characters. Opponent: 1 Life, 2 cards in hand, ... Read-only: nothing here is played." Focus lands on "Overview", not the explanation (not built as written). |
| 8 | Practice this | **Pass** | "Practice: turn 9 as it stood. Nothing is timed. Find the win you missed." then "main landmark, Your Main phase, region ... heading". |
| 9 | Play the line | **Note** (L-SR9 open; L-SR26; L-SR27) | `+`: "Give DON to your Leader, dialog ... 1: your Leader 6000"; ArrowUp: "7000", "your Leader: 5000 to 7000..." style lines as in Chrome ("2: your Leader 7000"). Enter: "You: Give 4 DON to Kaido." Confirm: "Kaido 9000 against their Leader 5000. Result depends on When Attacking. Gap: ahead by 4000. They need plus 5000 to survive, 2 cards in hand. ..." Use: prompt spoken, then "Use" (heard here). Tab: left the panel to "Game log" (L-SR27 confirmed: the Tab order puts Skip before Use). Shift+Tab, Shift+Tab: "Skip, button, Kaido: pay DON minus 1 to use this effect (...)?". Enter: "You: Your Kaido: effect not used." `.`: "You: Hit 9000 vs 5000. Rocks dot D dot Xebec: Life card to hand their Life 1 to 0." Second attack, one key, eight utterances, **in a sensible order in Firefox**: "You: Kaido attacks their Leader." / "You Hit 9000 vs 5000" (the Event log) / "Kaido attacks their Leader, region ... heading" / "You: Hit 12000 vs 5000. Game over You win." / "Game over. You win on turn 9." / "Game over" (heading) / "Solved: you found lethal." / "Rematch, or New game." The explanation is still not announced (L-SR9). |
| 10 | Play from here | **Pass** (L-SR4 heard) | Enter on "Play from here": **"Playing from turn 9, as it stood."**, then "main landmark, Your Main phase, region, Your Main phase, heading, clickable, level 2", then 2 s later "You need 2 hits. You have 2 attackers." Focus on the heading `#decision-title`. The harness note is wrong (next section). |

Counts: Pass 14 (F3, 1, 2, 2b, 3, 4, 4b, 4c, 5, 5b, 6, 7, 8, 10; steps 1, 4c and 6 carry notes or a finding), Note 2 (F15, 9), Fail 0, Not reached 0.

## Diagnosis of "did not reach 'Playing from turn 9' announced with focus on the decision heading (L-SR4)": harness, not the app

The check (`l.ts` 1063 to 1066) is `/Playing from turn/.test(await polite(p)) && f.id === 'decision-title'`. `polite(p)` (`l.ts` 54 to 58) reads **the current `textContent` of `#announce-polite`**, i.e. only the *last* polite line, read after `waitFor` plus an 800 ms sleep.

Evidence from `l.json`, step 10, key row 9 (Enter on "Play from here", `t = 1794251171998`):

| Time after the key | Event |
| --- | --- |
| +223 ms | live write, polite: "Playing from turn 9, as it stood." |
| +241 ms | NVDA spoke "Playing from turn 9, as it stood." (18 ms later) |
| +341 ms | NVDA spoke "main landmark, Your Main phase, region, Your Main phase, heading, clickable, level 2" |
| +2158 ms | live write, polite: "You need 2 hits. You have 2 attackers." (the detector's line, written after the search finished) |
| +2190 ms | NVDA spoke it |
| after the 800 ms wait | the harness reads `#announce-polite`: it now holds "You need 2 hits. You have 2 attackers." |

- **Focus** was correct: `focus after = heading "Your Main phase" [level=2]`, and the same note prints it; the `f.id === 'decision-title'` half of the test passes.
- **The announcement** was written and spoken. The test failed only because the detector's later line overwrote the region before the harness looked. Only the second line of the pair was in the element when read; the harness note itself shows it: `polite: "You need 2 hits. You have 2 attackers."`.
- **Why Chrome r4 "passed" the same check:** there the order was reversed ("You need 2 hits" first, "Playing from turn 9, as it stood." last, L-SR26), so the last polite line happened to be the one the regex wants. The check depends on line order, not on the announcement. Firefox's order (context line first, then the heading, then the detector's line) is the better one for a listener; the harness punished it.
- **What would settle it from the app side too:** both lines are in `live` for the step, the key row's `heard` has all three utterances. Nothing is missing.

Verdict: **harness** (a false negative). L-SR4 is **Fixed (heard)** in Firefox. Fix to the harness: test the step's recorded `live` list (any polite write matching `/Playing from turn/`) and `heard`, not the region's last text. The same `polite(p)` pattern is used elsewhere (steps 2, 3, 5b); it only reports "the last line", and each of those happened to be single-line.

## Every live write against the speech tap (L-SR20, L-SR25, L-SR26)

Method: each live-region write in `l.json` (45: polite and assertive), matched to the phrases NVDA spoke in the same step at or after the write (text normalised: `!!` and `·` dropped, `.` between letters read as "dot", `+` as "plus", `−` as "minus", `=` as "equals"), then the unmatched read by hand.

| Result | Count | Detail |
| --- | --- | --- |
| Written and spoken | 43 | including "Solved: you found lethal." and "You need 2 hits. You have 2 attackers." (both r3 losses), the optional-effect lines, and the pairs that arrive together |
| Written and **not** spoken | **2** | Step 6 row 8, the Concede: polite "Rematch, or New game." and assertive "Game over. You lose on turn 9." Identical to Chrome r4. **L-SR25 reproduces in Firefox.** |
| Spoken with no write | 2 | Step 5b rows 6 and 7 (`L` 3 and `L` 4): see the recorder note below |

**Write-to-speech delay (now measurable: per-phrase timestamps).** For the 43 matched writes the speech began **7 to 87 ms after the DOM write** (median 24 ms). Nothing is spoken late. The longest are the Counter and the hit lines (65 to 87 ms). The step 9 burst (one key, eight utterances) spans 1.9 s from the key to "Rematch, or New game."; the queue spacing is the cause (writes at +12, +1279, +1282, +1588, +1904 ms), not NVDA lag.

**The Concede loss, with timing (L-SR25).** Step 6 row 8: key at t0; both live writes at **t0 + 36 ms**; NVDA spoke "Game menu, button, collapsed" at +152 ms (focus returned to the menu button as the dialog unmounted) and "Game over, region, Game over, heading" at +287 ms (focus moved to the heading). Neither live line was spoken afterwards. The order is **write, then two focus changes**. NVDA cancels pending speech when focus changes, so a live line written before the focus lands is dropped. In step 9 (the win) the lines were written at +1279 to +1904 ms, **after** the heading received focus (+276 ms), and all were spoken. That is the cause in both browsers, and it is specific to the Concede path where the announcement and the focus move happen in the same tick. It is deterministic (r4 Chrome, r5 Firefox), where r3 Chrome happened to hear them. Fix: on the Concede, write the announcements after focus has moved (about 400 ms), or make the result part of what the heading says (`aria-describedby`).

**Severity of L-SR25, and the rule in r4.** Chrome r4 said "make it 2 if the Firefox rerun shows it too". It does. I still rate it **1** and put the decision to the owner of the pass: (a) the player pressed Concede, so "You lose" is not news, and the heading "Game over" is spoken; (b) the pointer to Rematch and New game is lost, but the buttons are the next Tab stop and "Review this game" is spoken on the next key; (c) the loss path *by play* (the AI wins) was not run and shares the mechanism only if it moves focus in the same tick, which it may not; (d) the win path, which does move focus to the same heading, is heard in full in both browsers. If the owner reads r4's trigger literally, L-SR25 is **2 and open** and this record is a Firefox pass with one open severity 2: say so before closing the criterion.

**Recorder blind spot.** `LIVE_SCRIPT` (`pass.ts` 65 to 82) records a write only if its text differs from the previous text of that region. A line re-announced with identical text is invisible to the log. That is how 5b `L` 3 and `L` 4 are "spoken (same sentence), nothing written": the app (or Firefox) re-announces the identical sentence and NVDA speaks it again, and the cross-check cannot count it. In Chrome r4 the same presses were silent, so this is a real difference in how the two browsers treat a repeat, not only a recorder artefact. The harness note "(nothing written)" is therefore wrong for Firefox. (Also: the Event log, `role="log"`, speaks its own entries ("You Hit 9000 vs 5000", step 9 row 25); they are not in the polite-write list and are a second live source the cross-check does not cover.)

## Cross-browser differences (Firefox against Chrome r4, same commit)

| Item | Chrome r4 | Firefox r5 |
| --- | --- | --- |
| Enter on the decision heading | `pointerdown` (mouse), `mousedown`, `mouseup`, `click`; focus on the heading | `mousedown`, `mouseup`, `click` (no `pointerdown`); focus on the heading; **silent** |
| "Use, button" on arrival at the optional effect | not spoken (L-SR27) | **spoken** ("... Use it, or skip. Use") |
| Close in the guided count | NVDA reads the whole closed count again (L-SR28) | reads the current coach; **not reproduced** |
| 5b `L` 3 and `L` 4 | silent | **spoken** (repeat of the same sentence) |
| Step 9 end burst | assertive "Game over" **before** the polite hit line; one utterance cut off ("se, game board, region ...") | polite hit line, then assertive, then heading, then "Solved", "Rematch"; **no cut-off**; "Game over" still said three times |
| Step 10 order | "You need 2 hits" first, "Playing from turn 9" last | "Playing from turn 9" first, heading, "You need 2 hits" 2 s later |
| Panel by browse after `M` | 14 silent (L-SR19) | 14 silent (L-SR19); r2 Firefox had read the panel cell by cell |
| Speech tap | passed | passed (in a Firefox-only job) |

## Verdicts on the carried findings

| ID | Old sev | New sev | Status (Firefox) | Evidence |
| --- | --- | --- | --- | --- |
| F3 | 1 | closed | **Fixed (heard)** | Step F3: the skip link is the first stop, Enter lands on the decision heading. |
| F15 | 1 | 1 | **Still open (unresolved)** | As Chrome: `.` works and is heard; no counterfactual (the AI answers on timers). §3.13 is the open item. |

## Findings

| ID | Sev | Status (Firefox) | Browsers | Finding |
| --- | --- | --- | --- | --- |
| L-SR1 | 2 | **Fixed (heard)** | both | Focus on Confirm attack with the maths as its description, spoken in steps 1, 5b and 9; Enter attacks (keydown and click in the trace). |
| FF-L1 | 2 | **Fixed (not reproduced, heard)** | Firefox | After NVDA's Enter on the heading, focus is the heading `h2#decision-title` (step 2 row 1: `heading "Attack · Kaido to their Leader" [level=2]`), **not `<body>`**; r1 and r2 had `<body>`. The next Tab goes to Cancel with the `keydown` in the trace, so a Firefox user keeps their place. What changed between r2 and r5 is not recorded here (the handler was reworked in fix rounds 2 and 3). Residual: the Enter is silent (FF-L2). |
| L-SR2 | 2 | **Fixed (heard)** | both | `C` and `L` with the confirm up are heard (step 5b). `L` 3 and 4 are spoken in Firefox, silent in Chrome. |
| L-SR3 | 2 | **Fixed (heard)** | both | Timeline application region and the `N` line heard. Caveat unchanged: one turn, one flag; movement between turns not exercised. |
| L-SR4 | 2 | **Fixed (heard)** | both | Step 8, step 10: "Playing from turn 9, as it stood." spoken 18 ms after its write, focus on the heading; the harness's "did not reach" is a false negative (above). |
| L-SR5 | 2 | **Fixed (heard)** | both | "Game board, turn 9, your main phase, read-only, game board"; `Q` ends "Read-only: nothing here is played." |
| L-SR6 | 1 | **Not reached** | both | Run-on cells of the panel in browse mode: silent after `M` (L-SR19), so still never heard. |
| L-SR7 | 1 | **Fixed (heard)** | both | r2's "Attack Kaido right arrow their Leader" is gone ("Kaido attacks their Leader", "Back to the board, button", no "left arrow"). |
| L-SR8 | 1 | **Still open** | both | "T 9 You Severe dot Turn 9, your turn: missed lethal, severe, holds whatever they held., button, current": spoken "dot", and the name repeats the description (heard in step 6 and step 10). |
| L-SR9 | 1 | **Still open** | both | On-screen "Solved: you won on the turn it was cut from." against the spoken "Solved: you found lethal."; the explanation is not announced. The line is heard. |
| L-SR10 | 1 | **Fixed (heard)** | both | Fourth `L`: "That is everything the coach has for this turn. ..." |
| L-SR11 | 1 | **Closed (not reproduced)** | both | Tab from the heading reaches Cancel; third run in a row. |
| L-SR12 | 1 | **Fixed (heard)** | both | "The L key works from the board. Here, press Enter." heard on the Lethal toggle. |
| L-SR13 | 1 | **Fixed (a, b, c heard)** | both | (a) one question graded; (b) "1 hit"; (c) "Kaido: 1 DON , attack 1." / "Kaido: 2 DON , attack 1." **Not heard:** the Move earlier/later announcement (buttons not pressed); and the spoken "attack 1" without "number" and the space-comma after "DON". |
| L-SR14 | 1 | **Not measured** | both | The way back from tier 3 to the board is still done by an assist (steps 3, 4, 5). |
| L-SR15 | 1 | **Fixed (not reproduced)** | Firefox | r2: the coach read "Checking..." before its result. Here `L` 1 said "Lethal: proven, works against any hand." and tier 3 was read in full. |
| L-SR16 | 2 | **Fixed (heard)** | both | `L` 1 and `L` 2 left focus on the board with no assist; `L` 3 moved into the coach and read it. Residual by design as in Chrome: at tier 3 the next `L` is NVDA's "next list". |
| L-SR17 | 1 | **Still open** | both | Enter on a heading is a mouse click under NVDA (no keydown). In Firefox it is also silent (FF-L2). |
| L-SR18 | 1 | **Still open** | both | Next is before Check my count in the tab order (4b rows 8 and 9, 19 and 20, 33 and 34; three harness assists in 4c). A user who finishes a question and presses Tab goes on to Show the line, Close and out of the coach to the Game menu (4b rows 22 to 26). Next is not marked unavailable before the answer is checked. |
| L-SR19 | 1 | **Still open** | both | 14 silent `Browse:Next` after `M`; the footer is an application region (cause identified in Chrome r4 from `Decision.tsx`). "What they could have" (up to +4000 ...) and CR 7-1-4-1 are not reachable from the focused button. |
| L-SR20 | 2 | **Fixed (heard)** | both | 43 of 45 writes spoken; the 2 are the Concede (L-SR25). Delay 7 to 87 ms. |
| L-SR21 | 2 | **Fixed (heard); residual at 1 (L-SR27)** | both | Prompt and cost spoken on arrival at Use and on Skip, in steps 2 and 9. |
| L-SR22 | 1 | **Fixed (heard)** | both | "Coach closed." / "Coach open." |
| L-SR23 | 1 | **Fixed (heard)** | both | No " ," in the name; no bracket pause in "When Attacking." |
| L-SR24 | 1 | **Fixed (harness)** | both | The probe passed in the Firefox-only job; 349 phrases, per-phrase timestamps present. |
| L-SR25 | 1 | **Still open, reproduces in Firefox** | both | The Concede's "Rematch, or New game." and assertive "Game over. You lose on turn 9." are written 36 ms after the key, before two focus changes (+152 and +287 ms), and never spoken. In step 9 the same lines are written after focus lands and are heard. Chrome r4's trigger for severity 2 is met; I hold it at 1 and give reasons above. Fix: write after focus moves, or put the result on the heading. |
| L-SR26 | 1 | **Changed** | both | In Firefox the end-of-game burst is in a sensible order with nothing cut off; "Game over" is still said three times (polite line, assertive line, heading). Step 10's order is also better. Chrome unchanged. 5b `L` 3 and `L` 4 are spoken in Firefox (a repeat of the same sentence); the "no cue that nothing more will come" half is Chrome-only. |
| L-SR27 | 1 | **Still open, changed** | both | In Firefox "Use" **is** spoken on arrival (Chrome: not). Not spoken: the heading "Optional effect" on arrival (it is read only on Tab, row 15). The Tab order is still Skip before Use, so "Use it, or skip" does not say how to skip: Tab left the panel to the Game log; Shift+Tab ×2 reached Skip (step 9 rows 15 to 17). |
| L-SR28 | 1 | **Not reproduced in Firefox** | Chrome | After Close in Firefox, NVDA read the current coach, not the closed count. Chrome r4's report stays unverified. |
| FF-L2 | 0 | **New** | Firefox | Enter on the focused decision heading is silent: no speech, no state change (the confirm stays open), focus stays. r2 re-read the heading. Consistent with L-SR17; not on any path a user is asked to take (the footer button holds focus after `M`). Audit note. |

**Not built (no severity), carried:** the Counter sentence with totals and the tie rule; "Coach alerts" and "Lethal available"; the timeline as a toolbar; focus to the explanation when Study opens; "Declare no lethal"; the guided count's board sandbox; Hint, DON!! math and Tempo sections.

**No finding at severity 3 or 4.** Nothing open at severity 2 on the evidence (L-SR25 is the one to watch).

## Do the "Harness assist" notes hide a real problem?

| Assist | Hides a real problem? |
| --- | --- |
| Step 1: back to the target | No. A user presses `M` from the board. |
| Step 2: probe on the heading; back to the target | No. The probe now shows focus staying on the heading (FF-L1). |
| Step 3, twice: focus moved to the board | Less than r3: `L` 1 and 2 need no assist. The return from the coach to the board (L-SR14) is unmeasured, and the "fourth `L`" is the harness's, not a user's. |
| Step 4: `C` from the board; into the coach | Not measured. |
| Step 4b: "Hits needed" field | Partly: after browse-reading the question the cursor sits past the field; one Shift+Tab. |
| Step 4c, three: "Tab did not reach it quickly" | **The finding is L-SR18**, not a harness quirk: Tab after a question leaves the count. Hides a navigation cost, not a blocker. |
| Step 5, 5b | L-SR14; no. |
| Step 6: Game menu; timeline | No; the Concede path itself is not assisted. |
| Step 7: restored board | No (Shift+Tab ×2). |

As in Chrome: the assists hide navigation costs, not blockers.

## Harness notes (not app findings)

1. **Step 10's L-SR4 check is order dependent and false-negatives here** (diagnosis above). Test the step's `live` and `heard` lists, not the region's last text; the same `polite()` helper is used in steps 2, 3 and 5b.
2. **`LIVE_SCRIPT` drops a write whose text equals the previous text of its region**, so a repeated identical announcement is invisible (5b `L` 3 and 4). Record every mutation that re-sets the text, or count `heard` phrases with no write as a finding.
3. Per-phrase timestamps **exist** (`heard[].t` in `l.json`), so Chrome r4's request for lateness measurement can be met by re-running the cross-check on `nvda-chrome/l.json`: 7 to 87 ms here.
4. Steps 4c: press Move Kaido earlier and later once each; check the DOM after Close (the Firefox speech suggests the count is gone; the Chrome case is unsettled).
5. Step 1: record that the browse silence is focus mode (application role), as in Chrome.
6. Step 3: end after `L` 3; the "fourth `L`" is the harness's.
7. A combined Chrome and Firefox job killed the Firefox tap in r3 and r4; run them as separate jobs, or keep the probe per browser.

## §11.4 coverage

| Step | Heard in Firefox? |
| --- | --- |
| F3 | Yes |
| 1 | Yes (the description); the browse-mode read is silent by design (L-SR19) |
| 2 | Yes, including the optional-effect prompt and "Use" |
| F15 | Yes (no counterfactual; not closable by this script) |
| 2b | Yes, as built |
| 3 | Yes. Tiers 1 and 2 without an assist; tier 3 and the fourth `L` heard (the fourth after an assist) |
| 4 | Yes |
| 4b, 4c | Yes, except the Move earlier/later announcement (not pressed) |
| 5 | Yes |
| 5b | Yes |
| 6 | Yes except the Concede's two announcements (L-SR25); one turn, one flag |
| 7 | Yes |
| 8 | Yes |
| 9 | Yes; "Solved" heard; the explanation is not announced (L-SR9) |
| 10 | Yes (the harness flag is a false negative) |

**Sufficient for the L pass decision: yes for Firefox.** Residuals for a later run: movement between turns (needs a second turn on the record), F15's counterfactual (§3.13), L-SR6 and L-SR19 (the panel body and the hand estimate by browse), the tier 3 return and the guided-count walks as real counts (L-SR14, L-SR18), the Move buttons, and the Concede lost by play (L-SR25's severity).

## Does the L screen-reader criterion hold?

Chrome r4 (PASS, no open severity 2 or above) plus this record (PASS, no open severity 2 or above): **both browsers heard every §11.4 step, F3 and F15; no severity 3 or 4 exists**; the headline fixes of rounds 1 to 3 (L-SR1 to L-SR5, L-SR10, L-SR16, L-SR20, L-SR21) are heard in both. **The exit criterion is met on the scripted evidence**, with two honest conditions: (1) L-SR25 now reproduces in both browsers and Chrome r4's own rule would raise it to 2; I rate it 1 (reasons above), but the owner should confirm that, or fix it (a one-line reorder) before closing; (2) this is a scripted pass, not a human listening pass (§11.2, R9), and VoiceOver stays the owner's.

## Recommended fixes (in order)

1. L-SR25 and L-SR26 together: on the Concede, write the result after focus has moved (or put it on the heading); say "Game over" once.
2. L-SR19: put "What they could have" and the CR citation in Confirm attack's description.
3. L-SR18: Check my count before Next in the DOM; Next unavailable until checked.
4. L-SR27: the optional-effect description says how to skip, or Skip after Use.
5. L-SR8: replace the dot in the timeline button's name; drop the repeated description.
6. Harness items 1 and 2 (step 10's check; the recorder's dedupe), then 4.
