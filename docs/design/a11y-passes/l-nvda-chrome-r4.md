# L screen-reader pass, fourth run: NVDA + Chrome

**Kind of pass:** scripted (Guidepup), not a human listening pass (accessibility.md §11.2, risk R9). Fourth run of the §11.4 script (`app/a11y/src/l.ts`) after fix round 3 (DECISIONS "2026-11-09 — L screen-reader fix round 3", commit `26b5c99`). Earlier runs: [l-nvda-chrome.md](l-nvda-chrome.md), [l-nvda-chrome-r2.md](l-nvda-chrome-r2.md), [l-nvda-chrome-r3.md](l-nvda-chrome-r3.md). Firefox: [l-nvda-firefox-r4.md](l-nvda-firefox-r4.md) (invalid run). Finding numbers are shared by both browsers and all runs.
**Result:** **PASS by the rule** (no open severity 3 or 4, and for the first time none open at severity 2). **Coverage: sufficient.** Every §11.4 step, F3 and F15 was heard in Chrome. Round 3 worked for its headline fixes: `L`, `L`, `L` no longer moves focus until tier 3 (L-SR16), every polite write but two was spoken (L-SR20: the two losses in r3 are gone; two other lines were lost at the Concede, a different cause, L-SR25), the optional-effect prompt and cost are spoken (L-SR21, with a residual), and L-SR22, L-SR23, L-SR13b and L-SR13c are heard fixed. The round did not touch L-SR19, L-SR18, L-SR8 or L-SR9, and they are all still there; L-SR19's cause is now identified from the code (below). New at severity 1: L-SR25, L-SR26, L-SR27.
**Date:** 2026-11-09.

## Versions

| Item | Version |
| --- | --- |
| NVDA | 2026.2 (Guidepup's portable build, default configuration; the log header says `NVDA_VERSION 2026.2`) |
| Browser | Google Chrome, harness-reported "chromium 156.0.8078.80" (Playwright `channel: 'chrome'`, headed) |
| Guidepup | `guidepup 0.38.0, @guidepup/playwright 0.21.0` |
| Windows image | GitHub Actions `windows-2025` (`win25-vs2026 20261103.298.1`) |
| App commit | `26b5c99` on `main` (the log header) |
| Workflow run | GitHub run 42676731643, file `app/a11y/results/nvda-chrome/l.md` (and `l.json`). The log is not committed |
| Speech source | The NVDA Remote speech tap. It **passed the new speech probe** (round 3's harness check; the Firefox job's did not). 332 phrases; 203 of 231 key presses have speech. Per-key capture is off by design. The JSON stores the speech per key press, with one timestamp per key, **not per phrase**, so lateness inside a key press cannot be measured from the record (see L-SR20) |

## How it ran

- Steps F3 to 5b on `a11y-l` (Rookie as the AI); steps 6 to 10 reload on `lethalDemo`, concede, and open the review. The `unreached` list is empty. The header's `url` shows `lethalDemo`: that is the last page loaded, not a fault.
- **Harness assists** (all recorded): step 1 one, step 2 two (the heading probe; back to the board), step 3 two (down from four in r3), step 4 two, steps 4b and 4c three ("Tab did not reach it quickly"), step 5 one, step 5b two, step 6 two (the Game menu, the timeline; the Concede key and "keys were not reaching the page" assists of r3 are gone). Assessed below.
- Judged against §11.4 as amended by rounds 2 and 3 (step 3: tiers 1 and 2 keep focus on the board; step 1: focus on Confirm attack).
- The Concede path no longer hits the r3 "Tab left the page" canary: the script now presses Shift+Tab to "Concede" (row 7).

## What the event traces show

Same probe as r3. Enter on the focused heading `h2#decision-title`: `pointerdown (pointerType=mouse)`, `mousedown`, `mouseup`, `click (detail=1)`, **no `keydown`**: NVDA's Enter on a "clickable" heading is a synthesized mouse click, as in r3 (L-SR17 unchanged). Tab from the heading: `keydown Tab`, then focus on Cancel (L-SR11 not reproduced a second time). Enter on Confirm attack: `keydown Enter` then `click (detail=0)`. Round 2's structure still holds.

## Steps

| # | Do | Result | What NVDA said (short) |
| --- | --- | --- | --- |
| F3 | Load; Control+Home; Enter on the skip link | **Pass** | "main landmark, same page, link, Skip to decision"; Enter: "Your Main phase, region, Your Main phase, heading, clickable, level 2". |
| 1 | Attack with the Leader; `M`; read the panel | **Pass** (the description); **Note** (browse silent, L-SR19) | Enter on the target: "Decision actions, decision actions. Confirm attack, button, Kaido 5000 against their Leader 5000. Result depends on When Attacking. Level: ties go to the attacker. They need plus 1000 to survive, 2 cards in hand. Enter to attack, Escape to go back." **L-SR23 fixed: no " ," in the name and no stray pause before the full stop** (r3: "Confirm attack , 5000 vs 5000 ... When Attacking ."). `M` repeats it. **14 `Browse:Next` after it: silent again** (rows 10 to 23). |
| 2 | Enter to confirm; Use; pick; Done | **Pass** (L-SR21 fixed, with a residual) | Enter on Confirm: "You: Kaido attacks their Leader Your Kaido: Give up to 1 of your opponent's Characters minus 2000 power." then **"Kaido: pay DON minus 1 to use this effect (Give up to 1 of your opponent's Characters minus 2000 power)? Use it, or skip."** (r3: silent). **Not spoken: "Use, button", the heading "Optional effect"**; the user hears the question but not what has focus (L-SR27). Use: "You: Return 1 DON to the DON deck. Choose, heading". Pick: "Candidates, grouping, X dot Drake 2000, toggle button, not pressed"; Enter "1 of up to 1 chosen, pressed"; Done "1 of 1"; Enter: "You: X dot Drake minus 2000 ... Choose what resolves first, heading ... Order, grouping, First: Kaido (DON returned): ...". |
| F15 | `.` after Done | **Note** (not reproduced; no counterfactual) | As r3: the AI's Counter arrived on its timer before `.` ("Rocks dot D dot Xebec: Counter: X dot Drake plus 2000."); `.`: "Counter: Yamato plus 1000. You: Attack fails 5000 vs 8000."; focus on the new "Your Main phase" heading. |
| 2b | AI defends | **Pass as built** | Counters and result heard (F15's rows). The §11.4 Counter-with-totals sentence is **not built** (carried). |
| 3 | `L`, `L`, `L`, then a fourth | **Pass** (L-SR16 fixed, heard) | `L` 1: "Lethal: proven, works against any hand." **focus stayed on "Your Kaido" (board)**. `L` 2: "You need 1 hit. You have 2 attackers." focus still on the board, with **no assist before it** (r3 needed four). `L` 3: "You have lethal: 1 hit, and they can't stop any of them. Wins the game this turn." then focus moves and the whole coach is read ("Coach, region, Lethal, grouping, Proven, ... The line, list, Attack their Leader with Kaido (12000)., ..., Detector, combo box ... DON math on the board, check box"). Fourth `L`: "That is everything the coach has for this turn. ..." (heard only after the harness moved focus back to the board; see "Do the assists hide a problem"). |
| 4 | `C`; read the coach with the virtual cursor | **Pass** (L-SR22 fixed, heard) | `C` from the board: **"Coach closed."**, `C` again: **"Coach open."** (r3: silent both). Browse reading inside the open coach as r3: "Coach sections, grouping ...", "Lethal, toggle button, pressed, The L key works from the board. Here, press Enter.", "region, heading, level 3, You have lethal ...", `Browse:List`: "The line, list, with 1 item, Attack their Leader with Kaido (12000)." `Browse:Heading` twice "no next heading" (cursor already past the only heading). |
| 4b | Count it with me, question 1 | **Pass** (L-SR13a, b heard) | "Count it with me. Question 1: how many hits do you need?" then the panel. Wrong (3): "Hits: not quite. They have 0 Life, so you need 0 plus 1 equals **1 hit**." (r3 said "1 hits"). Right: "Hits: right. 0 Life, plus 1." Tab order: Back, **Next, Check my count**, Show the line, Close (L-SR18). |
| 4c | Questions 2 to 4, Close | **Pass** (L-SR13c fixed, heard); **Note** (Close, L-SR28) | Q2 cards "Kaido 12000, toggle button, not pressed" then "pressed"; "Attackers: right. ..." Q3 list of three bullets. Q4 table. **Enter on "More DON for Kaido": "Kaido: 1 DON , attack 1." then "Kaido: 2 DON , attack 1."** (r3: silent). "Split: right. Each attack beats what they can have by then." The "Move Kaido earlier or later" buttons were tabbed to but **not pressed**, so their new line ("now attack N of M") was not heard. **Close: focus on the "Lethal" group and NVDA read the entire guided count again** ("Count it with me, heading, level 3, Question 4 of 4 ... table ... Check Each attack beats what they can have by then. ...", row 55): either the count had not left the DOM yet or the group announces its old contents; see L-SR28. |
| 5 | Detector silent, then on | **Pass** (note: not built) | "Detector off, 3 s idle: 0 live-region writes (silent)". "Tier 1 always on", "Tier 2 always on". `+`: "Give DON to Kaido, dialog ... 1: Kaido 13000". Enter: "You: Give 1 DON to Kaido." then, after the board and focus announcements, **"You need 1 hit. You have 2 attackers."** Both polite lines heard (r3 hid this pair only in other places). |
| 5b | `C` and `L` while the battle panel is up (L-SR2) | **Pass** | `C`: "The coach opens when this decision is done. Finish or cancel it, then press C." `L`: "You have lethal ... The numbered line is in the coach, which opens when this decision is done." `L` again: "That is everything the coach has ..." Third and fourth `L`: silent (unchanged from r3, see L-SR26's note). Escape twice: position unchanged. |
| 6 | Reload on the planted record; concede; review; timeline; `N` | **Pass** (L-SR3 fixed; **L-SR25 new**) | Menu, Concede dialog ("Concede this game?, dialog, It counts as a loss. You can still read the log."). Enter on Concede: heard "Game over, region, Game over, heading, clickable, level 2" and **neither "Rematch, or New game." (polite) nor the assertive "Game over. You lose on turn 9." was spoken** (both written to the live regions, row 8; r3 heard the assertive line). Next key: "Review this game, button". Enter: "Game review, main landmark, ... 1 flag 1 severe ... Turn timeline. Left and Right arrows move between turns, N between flags., turn timeline ... T 9 You Severe dot Turn 9, your turn: missed lethal, severe, holds whatever they held., button, current". ArrowRight ×4 and 6 `Browse:Next` silent (focus is inside the timeline's `role="application"`, by design, L-SR3). `n`: "Flag 1 of 1 selected. ..." Still one turn, one flag. |
| 7 | Enter on the flag; Study; `Q` | **Pass** | As r3: "Study this moment, region, Overview, Esc, button"; "Game board, turn 9, your main phase, read-only"; `Q`: "... Read-only: nothing here is played." Focus on "Overview", not the explanation (not built as written). |
| 8 | Practice this | **Pass** | "Practice: turn 9 as it stood. Nothing is timed. Find the win you missed." then "main landmark, Your Main phase, region ... heading". |
| 9 | Play the line | **Note** (L-SR20 fixed; L-SR9 open; L-SR26) | `+`: "Give DON to your Leader, dialog ... 1: your Leader 6000"; ArrowUp: "your Leader: 5000 to 7000 this turn". Enter: "You: Give 4 DON to Kaido." Confirm: "Kaido 9000 against their Leader 5000. Result depends on When Attacking. Gap: ahead by 4000. They need plus 5000 to survive, 2 cards in hand. ..." Use: the prompt and cost spoken (L-SR21), Shift+Tab to Skip: "Skip, button, Kaido: pay DON minus 1 to use this effect ...?" Enter: "You: Your Kaido: effect not used." `.`: "You: Hit 9000 vs 5000. Rocks dot D dot Xebec: Life card to hand their Life 1 to 0." Second attack, one key, seven utterances: "You: Kaido attacks their Leader." / "You, Hit 9000 vs 5000" / "se, game board, region, Kaido attacks their Lead" (cut off) / **"Game over. You win on turn 9."** / "You: Hit 12000 vs 5000. Game over You win." / **"Solved: you found lethal."** (r3: lost) / "Rematch, or New game." The explanation is still not announced. |
| 10 | Play from here | **Pass** (L-SR4, L-SR20) | Enter: **"You need 2 hits. You have 2 attackers."** (r3: lost), the heading ("main landmark, Your Main phase, region ... heading"), then **"Playing from turn 9, as it stood."**. Both heard. The order is odd (L-SR26). "Back to the board, button" and "Back to the review, button" without "left arrow" (L-SR7 fixed). |

Pass: 12 (F3, 1, 2, 2b, 3, 4, 4b, 4c, 5, 5b, 7, 8) plus step 6 and 10 as Pass with a new finding noted = 14. Note: 2 (F15, 9). Fail: 0. Not reached: none.

## Every polite live write against the speech tap (L-SR20)

Method: for every key press in `l.json`, each live-region write (polite and assertive, 44 in all) was matched to that key's speech; the unmatched were then read by hand.

| Result | Count | Detail |
| --- | --- | --- |
| Written and spoken | 42 | including both r3 losses: "Solved: you found lethal." (step 9 row 25, spoken between the hit line and "Rematch, or New game.") and "You need 2 hits. You have 2 attackers." (step 10 row 9, spoken first). Also the pairs that arrive together: "You: Give 1 DON to Kaido." + "You need 1 hit. You have 2 attackers." (step 5), "Kaido attacks their Leader" + the Counter (F15). |
| Written and **not** spoken | **2** | Step 6 row 8, the Concede: polite "Rematch, or New game." and assertive "Game over. You lose on turn 9." Neither appears anywhere in the tap, in that row or the next. They were written at the same moment as the focus moved to the "Game over" heading, which NVDA did speak. L-SR25. |
| Spoken but cut off | 1 | Step 9 row 25: "se, game board, region, Kaido attacks their Lead": NVDA's own speech was interrupted. It is the same row as the seven-utterance burst. |

**Is anything spoken late enough to confuse?** The record cannot say in milliseconds (no per-phrase time). By construction the queue spaces lines 300 ms apart and merges past three waiting, so the worst case is the Counter and result bursts and step 9's end: four polite lines (the hit, "Solved", "Rematch", plus the first) means the last is at least 900 ms after the first, and NVDA also needs time to speak each. What the record does show is **order, not delay**: (a) the assertive "Game over. You win on turn 9." is spoken *before* the polite "You: Hit 12000 vs 5000. Game over You win." that explains it, because assertive lines bypass the queue; (b) in step 10 "You need 2 hits" comes first and "Playing from turn 9, as it stood." last, after the heading is read; (c) "Game over" is spoken three times in step 9 (assertive, the log line, the heading). The text is all there and none is dangerously late, but a listener has to piece it together. L-SR26.

## Verdicts on the carried findings

| ID | Old sev | New sev | Status | Evidence |
| --- | --- | --- | --- | --- |
| F3 | 1 | closed | **Fixed (heard)** | Step F3 again. |
| F15 | 1 | 1 | **Still open (unresolved)** | Same as r3: no counterfactual; the AI answers on timers; the open item is §3.13's `.` on a paused AI (DECISIONS). The "F15 STILL OPEN" line in the script is a false positive (the waiting panel's heading holds focus until the new decision arrives). |

## Findings

| ID | Sev | Status | Browsers | Finding |
| --- | --- | --- | --- | --- |
| L-SR1 | 2 | **Fixed (heard)** | Chrome | Focus on Confirm attack with the maths as its description; Enter attacks (key delivered). Heard twice more (steps 1, 9). |
| FF-L1 | 2 | **Not reached** | Firefox | The Firefox run was invalid ([l-nvda-firefox-r4.md](l-nvda-firefox-r4.md)). |
| L-SR2 | 2 | **Fixed (heard)** | Chrome | Step 5b lines heard. Third and fourth `L` with the panel up are silent (L-SR26 note). |
| L-SR3 | 2 | **Fixed (heard)** | Chrome | Timeline application region, `N` line. Caveat unchanged: one turn, one flag. |
| L-SR4 | 2 | **Fixed (heard)** | Chrome | Review heading, Practice and Play from here spoken, focus on the board heading. |
| L-SR5 | 2 | **Fixed (heard)** | Chrome | Read-only board label and `Q`. |
| L-SR6 | 1 | **Not reached** | Chrome | The run-on cells of the panel in browse mode: still never heard, for the L-SR19 reason below. |
| L-SR7 | 1 | **Fixed (heard)** | Chrome | "Back to the board, button" and "Back to the review, button" have no "left arrow"; "to" in titles and totals. |
| L-SR8 | 1 | **Still open** | Chrome | "T 9 You Severe dot Turn 9, your turn: missed lethal, severe, holds whatever they held., button, current": the separator is spoken "dot" and the name repeats the description. |
| L-SR9 | 1 | **Still open** | Chrome | On-screen "Solved: you won on the turn it was cut from." against the spoken "Solved: you found lethal."; the explanation is not announced. The line is now at least heard (L-SR20). |
| L-SR10 | 1 | **Fixed (heard)** | Chrome | Fourth `L`: "That is everything the coach has for this turn. ..." |
| L-SR11 | 1 | **Closed (not reproduced twice)** | Chrome | Tab from the heading reaches Cancel in r3 and r4, with the keydown in the trace. |
| L-SR12 | 1 | **Fixed (heard)** | Chrome | "The L key works from the board. Here, press Enter." is accurate, and `L` tiers 1 and 2 no longer put the user in the coach, so the hint is no longer the only mitigation. |
| L-SR13 | 1 | **Fixed (a, b, c heard)** | Chrome | (a) one question graded; (b) "1 hit" in the reason text as well as the badge; (c) More/Fewer announce ("Kaido: 1 DON , attack 1."). Not heard: the Move earlier/later announcement (buttons not pressed); and "attack 1" with no "number" and a space-comma after "DON" (a trailing `!!` is spoken as a pause). |
| L-SR14 | 1 | **Not measured** | Chrome | The coach-to-board return after tier 3 is still bypassed by an assist (step 3 after `L` 3, step 4, step 5). With tier 3 the only way into the coach by `L`, the cost is now paid once per game rather than every `L`, but a user at tier 3 who wants to press `L` again (the 4th `L`, L-SR10) must still walk back. Needs a count of the Shift+Tab stops. |
| L-SR15 | 1 | **Not reached** | Firefox | Run invalid. |
| L-SR16 | 2 | **Fixed (heard)** | Chrome | `L` 1 and `L` 2 left focus on the board with no assist and were heard; `L` 3 moved into the coach and read it. **Residual, by design:** at tier 3 focus is in the coach, where NVDA's `L` is "next list". The press after it is NVDA's, not the app's. The record's "fourth `L`" was only reached because the harness moved focus to the board first (it should record that this is the user's situation, not a pass of "four `L` in a row"). The tier 3 read is also very long (the coach in full, including the Detector and DON math controls, about 600 characters) and is preceded by "heading, clickable, level 2, Your Main phase" and the board's own label, which is noise. Not worth a higher severity: it is user-initiated and the line itself is spoken first. |
| L-SR17 | 1 | **Still open** | Chrome | Enter on a heading is a mouse click under NVDA (trace repeated). Unchanged, audit only. |
| L-SR18 | 1 | **Still open** (confirmed three times) | Chrome | Next sits before Check my count in the tab order. In 4b and twice in 4c the harness's Tab went Show the line, Close, Detector, DON math, Game menu (out of the coach) and then five Shift+Tab back: the "Tab did not reach it quickly" assists. A user finishing a question and pressing Tab to go on **leaves the guided count** without a cue; Next is one Shift+Tab back. Also "Next" is not marked unavailable before the answer is checked. Fix: put Check my count before Next in the DOM, or make Next the result of a correct check. |
| L-SR19 | 1 | **Still open (cause identified from code, not from this run)** | Chrome | 14 silent `Browse:Next` after `M`. Confirm attack is inside the decision footer, which is `role="application"` with label "Decision actions" (`Decision.tsx` 148 to 160; the M3 F2 fix so `.`, `E`, `S` reach the page). NVDA is in focus mode there; ArrowDown is passed to the page, so the browse read is silent by design. The speech confirms it ("Decision actions, decision actions" before the button). **Consequence:** the "What they could have" paragraph ("up to +4000 if each is one of their deck's +2000 Counters") and the rule citation (CR 7-1-4-1) are **not reachable from the focused button**: the user has to Shift+Tab out of the footer and browse the body. The sentence on the button omits them. Severity stays 1 because the four facts that decide the attack are in the description; it becomes 2 if a user is expected to learn the hand estimate (it is the only place that says "if each is one of their deck's +2000 Counters"). Fix: put the estimate in the description, or move `M`'s read to the body paragraph. |
| L-SR20 | 2 | **Fixed (heard)** | Chrome | Both r3 losses are heard; 42 of 44 live writes spoken, the 2 unspoken are the Concede (L-SR25). Residual: ordering (L-SR26). |
| L-SR21 | 2 | **Fixed (heard); residual at 1 (L-SR27)** | Chrome | The prompt and its cost are now spoken on arrival at Use and on Skip; in step 9 too. |
| L-SR22 | 1 | **Fixed (heard)** | Chrome | "Coach closed." / "Coach open." |
| L-SR23 | 1 | **Fixed (heard)** | Chrome | No " ," in the name, no bracket pause in "When Attacking." |
| L-SR24 | 1 | **Fixed (harness)** | Chrome | The probe worked: it passed in Chrome and invalidated the Firefox job in a minute rather than after the whole script. |
| L-SR25 | 1 | **New** | Chrome (Firefox unknown) | **The Concede's "Rematch, or New game." and the assertive "Game over. You lose on turn 9." were not spoken** (step 6 row 8; both were heard in r3). Focus moved to the "Game over" heading at the same time and NVDA spoke that instead. The heading says "Game over" so the player is not lost, but "You lose on turn 9" and the pointer to Rematch are the only place the outcome and the next step are stated. The same lines were heard in step 9 (a win), so this is intermittent or specific to the focus move on Concede. Could be the new queue (the polite line waits 300 ms and the focus change flushes NVDA's speech first) or a race that r3 happened to win. Severity 1 on one run; make it 2 if the Firefox rerun shows it too. Fix: announce the result on the heading (aria-describedby), or let focus land on the result line. |
| L-SR26 | 1 | **New (observation)** | Chrome | **One key press can say seven things, out of order, with one cut off** (step 9 row 25: attack, hit, a truncated "se, game board, region, Kaido attacks their Lead", then the assertive "Game over. You win on turn 9." *before* the polite hit line that caused it, "Game over You win" again, "Solved", "Rematch"). Cause: assertive lines bypass the new polite queue, and the log line also says "Game over". Step 10: "You need 2 hits" before "Playing from turn 9, as it stood.". In step 5b the third and fourth `L` are silent with the panel up (r3 too): after "That is everything ..." there is no cue that nothing more will come. Fix: have the polite line for a game over carry "Game over" only once (drop it from the assertive, or the log line); put the context line ("Playing from ...") before the detector's line. |
| L-SR27 | 1 | **New (residual of L-SR21)** | Chrome | On arrival at the optional-effect decision the name "Use, button" and the heading "Optional effect" are still not spoken (the description alone is). Focus starts on Use, which is **after** Skip in the Tab order, so "Use it, or skip" does not tell a keyboard user how to skip: Tab leaves the panel (step 9 row 15: Tab went to the Game log), Shift+Tab reaches Skip (rows 16 and 17). The description should say "Shift+Tab or Skip to decline" or the order should put Skip after Use. |
| L-SR28 | 1 | **New (unverified)** | Chrome | After Close in the guided count, NVDA spoke the whole of the closed count again (step 4c row 55, about 700 characters, ending "check Each attack beats what they can have by then. ...") while focus is on the "Lethal" group. Either Close did not remove the count before focus moved, or the group name is announced with its previous contents. The record does not say which. |

**Not built (no severity):** the Counter sentence with totals and the tie rule; "Coach alerts" and "Lethal available"; the timeline as a toolbar; focus to the explanation when Study opens; "Declare no lethal"; the guided count's board sandbox; Hint, DON!! math and Tempo sections.

## Do the "Harness assist" notes hide a real problem?

| Assist | What it replaced | Hides a real problem? |
| --- | --- | --- |
| Step 1: back to the target on the board | The board path after reading the panel | No. A user presses `M` from the board. |
| Step 2: probe on the heading; back to the target | The heading's Enter and Tab; returning | No problem hidden (the probe records the click). |
| Step 3, twice: "focus moved to the board: L is pressed from the board" | After `L` 3 (and the end of the step): the way back from the coach | **Yes, less than r3, but yes.** `L` 1 and 2 now need no assist, so L-SR16 is closed for tiers 1 and 2. The return from tier 3 to the board is a long Shift+Tab walk (L-SR14, unmeasured), and the script's "fourth `L`" is then a different experience from the user's (who would press NVDA's `L` in the coach). |
| Step 4: `C` from the board; into the coach | Board to coach | Not measured. `C` now says "Coach open." but does not move focus. |
| Step 4b: "Hits needed" field (Tab did not reach it quickly) | Shift+Tab from the Close end of the coach back to the field | **Partly.** After browse-reading the question the cursor sits after the field, so Tab went to Next. Ordinary for NVDA: one Shift+Tab, or Enter on the field in browse mode. The Tab walk of the harness is an artefact of `until('Tab', field)`. |
| Step 4c, twice: "focus moved to Next / Check my count (Tab did not reach it quickly)" | The harness's 5 Tab out of the coach and 5 Shift+Tab back to Next | **The real finding is L-SR18, not a harness quirk.** A user following the flow (Check my count, then on) presses Tab and leaves the count. One Shift+Tab fixes it, but nothing says so. The assists hid that it is the same trap at every question. They are **not** hiding a blocker. |
| Step 5: focus moved to the board | After setting the Detector | L-SR14. |
| Step 5b: back to the target | `C`/`L` and Escape from the board | No. |
| Step 6: the Game menu; the timeline | Reaching the menu; Tab past the header | The Concede path itself (menu, Enter, Shift+Tab to Concede) is no longer assisted. No problem hidden. |
| Step 7: restored board | Board after Study | Two Shift+Tab from "Overview": short. |

Reading the assists as a group: they again hide **navigation costs, not blockers**. As in r3, I would not call them clean: the guided-count assists and the tier 3 return are real paths a user takes, and the record's "Pass" for 4b and 4c depends on the harness walking five stops each time. The cost a user pays per question in the guided count is: one Shift+Tab after each Check my count to reach Next, plus the knowledge to do it.

## Harness notes (not app findings)

1. Step 3 should end after `L` 3 and record "focus is in the coach; NVDA owns `L`" rather than moving focus and pressing a fourth `L` as if it were the user's.
2. The JSON should store a timestamp per phrase, not per key, so "late" can be measured (L-SR20, L-SR26). The log header says the tap's phrases are timestamped.
3. Step 4c should press "Move Kaido earlier" and "Move Kaido later" once each (the round 3 line was never heard).
4. Step 4c should check what the DOM holds after Close (L-SR28).
5. Step 1 should record whether the key silence is focus mode (L-SR19): the footer's role is `application`.
6. Step 5b's third and fourth `L` should be recorded as "silent, by design" or fixed.
7. Step 6's assertive and polite lines after Concede should be checked against the tap in the record (the cross-check in this record was done by a script run over `l.json` after the fact; make it part of the harness's output).

**What worked well:** `L` tiers 1 and 2 on the board, the optional-effect prompt, the confirm description without stray punctuation, "Coach open/closed", the one-question grading, the DON!! announcements in the guided count, every polite write but the Concede pair, the probe that told the two browsers apart.

## §11.4 coverage

| Step | Heard in Chrome? |
| --- | --- |
| F3 | Yes |
| 1 | Yes (the description); the browse-mode read is silent by design (L-SR19) |
| 2 | Yes, with the optional-effect prompt now spoken |
| F15 | Yes (no counterfactual; not closable by this script) |
| 2b | Yes, as built |
| 3 | Yes. Tiers 1 and 2 without an assist (L-SR16); tier 3 and the fourth `L` heard (the fourth after an assist) |
| 4 | Yes (`C` now speaks; browse mode, heading, list) |
| 4b, 4c | Yes, except the Move earlier/later announcement (not pressed) |
| 5 | Yes |
| 5b | Yes |
| 6 | Yes except the Concede's two announcements (L-SR25); one turn, one flag |
| 7 | Yes |
| 8 | Yes |
| 9 | Yes; the "Solved" line is now heard; the explanation is not announced (L-SR9) |
| 10 | Yes |

**Sufficient for the L pass decision: yes for Chrome.** Residuals for the next run: movement between turns (needs a second turn on the record), F15's counterfactual (needs §3.13 or a paused-AI position), L-SR6 and L-SR19 (the panel body and the hand estimate by browse), the tier 3 return and the guided-count walks as real counts (L-SR14, L-SR18), the Move buttons, the Concede in Firefox (L-SR25), and a per-phrase timestamp so lateness can be measured.

## Recommended fixes (in order)

1. L-SR25 and L-SR26 together: make the game-over announcement one line, spoken once, ahead of the Rematch line; give the Concede path the result on the heading (or its description).
2. L-SR19: put "What they could have" (the hand estimate and the CR citation) in Confirm attack's description, or an `M` that reads the body.
3. L-SR18: Check my count before Next in the DOM; mark Next unavailable until the question is checked.
4. L-SR27: the optional-effect description says how to skip; or put Skip after Use.
5. L-SR8: replace the dot in the timeline button's name; the description repeats it.
6. L-SR28 and harness items 2 to 4: verify before fixing.
