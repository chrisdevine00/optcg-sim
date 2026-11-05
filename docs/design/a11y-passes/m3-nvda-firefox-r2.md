# M3 screen-reader pass, re-run: NVDA + Firefox

**Kind of pass:** scripted (Guidepup), not a human listening pass (accessibility.md §11.2, risk R9). A re-run of [m3-nvda-firefox.md](m3-nvda-firefox.md) after the "M3 NVDA pass fixes" (DECISIONS 2026-11-05).
**Result:** **FAIL.** One open severity 3 finding, FF4: steps 16 and 18 were not run, so "Game over. You win on turn 7." (the case FF1 was filed for) has no spoken evidence in Firefox. The cause is the script, not a defect found in the app (see "How it ran"); the speech that did run shows FF1 and F1 fixed. Open at severity 2: F2 (narrowed), F3, F7, F15.
**Date:** 2026-11-05.

## Versions

| Item | Version |
| --- | --- |
| NVDA | 2026.2 (Guidepup's portable build `guidepup-nvda-0.2.1-2026.2`, default configuration) |
| Browser | Firefox 157.0 (the harness reports "firefox 157.0": Playwright's Firefox build, as in run 1, not a branded release; headed, 1280 × 720) |
| Guidepup | `@guidepup/guidepup` 0.38.0, `@guidepup/playwright` 0.21.0 (as the previous run; the log header lists these two) |
| Windows image | GitHub Actions `windows-2025` (`win25-vs2026` 20261030.294.1) |
| App commit | `41c752a` on `main` (includes the fixes `0d5ab88` and `81ba6df`) |
| Workflow run | [42117696167](https://github.com/chrisdevine00/optcg-sim/actions/runs/42117696167), artifact `a11y-nvda-42117696167` |
| Spoken log | [logs/m3-nvda-firefox-r2.md](logs/m3-nvda-firefox-r2.md) (about 2,500 lines of table; most of step 16 and 18 is the script pressing keys in Firefox's toolbar) |

## How it ran

Same script, scenario, seed and AI moves as [m3-nvda-chrome-r2.md](m3-nvda-chrome-r2.md#how-it-ran); the speech in steps 1 to 14 matches Chrome's except where this record says so. Step 11 ran before step 10, and step 14 came up during step 12. Step 2 started from the skip link by Shift+Tab (F3).

- **The run lost the page in step 15, and never got it back.** The script chose a move with a Shift+Tab loop written for the old list. The radio group had moved its checked item, so the loop never matched, and focus walked "Close (Escape)" → Firefox's toolbar ("Navigation, tool bar", "Search or enter address, combo box", "Pick a search engine", then the engine menu with Enter). Escape there closes the browser menu or the address bar, not the dialog. Every later key went to the toolbar, the "Rewind to before a move" dialog stayed open, and the page was inert.
- **Harness assists:** step 16: "Tab did not reach the hand zone" (one). Step 18: 120 assists ("focus was outside the board and the decision panel", "Tab did not reach Done / Choose none in the decision panel"), with no game progress; the harness gave up and marked step 18 "not reached". All came from the lost page, not from a new app state.
- Steps 16 and 18 are therefore not evidence for or against the app. They are recorded as Fail because nothing was heard, not because something was heard wrong.

## Steps

The speech matches Chrome's except where this table says otherwise. Firefox reads cards as "button, sub Menu" where Chrome says "menu button".

| # | Result | Firefox notes |
| --- | --- | --- |
| 1 | **Fail** (F3) | Same as Chrome: first Tab "main landmark, Your Main phase, region, Your Main phase, heading, clickable, level 2"; the next Tab the heading again; then "⟲ Rewind, button, unavailable, U". |
| 2 | **Pass** | Same order and names. "Event log, region, Game log" (no "grouping"). |
| 3 | **Pass** | Same summary, "1 card in hand". |
| 4 | **Fail** (F7) | "Inspector: X dot Drake, dialog, Card text ⏐ Unpin and close (Escape), button". Text not read. |
| 5 | **Pass** (F8, F13) | Menu adds "Actions for Black Maria, menu". After Play: "You: Played Black Maria. ⏐ Game board … Your hand, 4 cards … Your X. Drake …". Focus on the hand. |
| 6 | **Pass** | "7000 ⏐ 2: your Leader 7000 ⏐ DON to give, 2 of 3 active" (shorter count reads, as before). |
| 7 | **Pass** | Same. |
| 8 | **Pass** | Same sentences and the same end-of-turn summary: "Opponent's turn 4: played no cards; 2 attacks; you took 1 damage, Life 3 to 2." Firefox also re-reads the focused card after `E` ("Your Black Maria, active, 2000 power, cost 3"). |
| 9 | **Pass** (FF2 fixed) | The assertive line is spoken: "Kaido attacks your Leader. Kaido 5000, your Leader 5000. You need 1000 to stop it …". Enter on the heading, then Tab: "Block, grouping, No block, toggle button, pressed" (was 9 presses through the board). |
| 10 | **Pass** (note) | **The 7000 attack's assertive line is spoken**: "King attacks your Leader. King 7000, your Leader 5000. You need 3000 to stop it. You have 3 Counter cards worth 5000. Plan your defence." Staging, footer and result as in Chrome. `.` moved the AI four times, but Firefox adds noise: "unavailable ⏐ Next move , the AI is moving ⏐ Opponent: Give 1 DON to Yamato. ⏐ Next move , the AI waits for you" (F20). |
| 11 | **Pass** | "Opponent: Hit 5000 vs 5000 ties go to the attacker. ⏐ Add to hand ⏐ Activate Trigger, button". Result spoken. |
| 12 | **Pass** (F15, FF3) | Confirm spoken: "Kaido 5000 against their Leader 5000. Result depends on When Attacking . Enter to attack, Escape to go back." After a pick the status is "1 ⏐ pressed ⏐ Basil Hawkins 1000 check 1" (FF3). After Done, `.` on "Kaido attacks their Leader, heading" did nothing (F15). |
| 13 | **Pass** | "King cost 6 7000: can't be chosen for this effect, button, unavailable". After picks: "1 ⏐ pressed", "2 ⏐ pressed" (FF3; the page's status says "1 of up to 2 chosen"). Commit: "You: Basil Hawkins cannot attack Yamato cannot attack." |
| 14 | **Pass** | "First: Kaido (DON returned): … (Character slot 3), button". Focus on "Kaido attacks their Leader, heading". |
| 15 | **Pass** (note: list read; commit not exercised; FF4, F17) | `U` as Chrome. `R`: the dialog is read with the list's items as object-replacement marks ("￼￼ ￼￼ ￼￼ …", no move text) and then "Return 1 DON to the DON deck Draw 1, radio button, not checked, 1 of 15". ArrowDown: "Play Queen … radio button, checked, 2 of 15", "Attack fails 5000 vs 7000, radio button, checked, 3 of 15". Then the script left the page (see "How it ran"). |
| 16 | **Fail** (FF4) | Not run: the keys went to Firefox's toolbar. `?` produced no speech. |
| 17 | **Not built** | Same. |
| 18 | **Fail** (FF4) | Not reached; no game progress. |

Pass: 13 (2, 3, 5 to 15). Fail: 4 (1, 4, 16, 18). Not built: 1 (17).

## Verdicts on the old findings

F1 to F14 held in Firefox too. Each verdict is for Firefox; evidence is Firefox's own speech.

| ID | Old sev | Verdict | Evidence (what NVDA spoke) |
| --- | --- | --- | --- |
| F1 | 3 | **Fixed** | Step 5: "You: Played Black Maria. ⏐ Game board, turn 3, your main phase, game board ⏐ Your hand, 4 cards, grouping ⏐ Your X. Drake …". Step 12, Done: "… ⏐ Kaido is deciding. ⏐ Choose, heading, clickable, level 2" with focus on "Kaido attacks their Leader, heading". Step 14: heading. End of Rookie's turn: "… ⏐ Opponent's turn, heading, clickable, level 2 ⏐ Your Main phase". No "Game OPTCG Sim, document" anywhere in the log. |
| F2 | 2 | **Changed** | Fixed from the footer: step 10 `.` ×4 each moved the AI ("Opponent: Give 2 DON to Yamato." …). Still open from the heading: step 12 `.` with focus on "Kaido attacks their Leader, heading" → no speech (F15). |
| F3 | 2 | **Still open** | Step 1: Tab from the top → "Your Main phase, region, Your Main phase, heading, clickable, level 2", not "Skip to decision". |
| F4 | 2 | **Fixed** | "Kaido 5000 against their Leader 5000. Result depends on When Attacking . Enter to attack, Escape to go back." |
| F5 | 2 | **Fixed** | "Opponent's turn 4: played no cards; 2 attacks; you took 1 damage, Life 3 to 2. Opponent: End of turn. Your turn 5." |
| F6 | 2 | **Fixed** | (a) "Opponent: Kaido attacks your Leader Their Kaido: …", "Opponent: Their Kaido: effect not used Your Kaido: …". (b) No "alert," is spoken anywhere in the log. The dialog-close case after an assertive write was not reached in Firefox (the page was lost first), so (b) rests on Chrome's run and on the 14 refocuses after the assertive lines here. |
| F7 | 2 | **Still open** | "Inspector: X dot Drake, dialog, Card text ⏐ Unpin and close (Escape), button". Same cause as Chrome (`aria-label="Card text"` on the described element). |
| F8 | 1 | **Still open** | "You: Played Black Maria." |
| F9 | 2 | **Fixed** | "King cost 6 7000: can't be chosen for this effect, button, unavailable". |
| F10 | 2 | **Fixed** | "First: Kaido (DON returned): Add up to 1 active DON ; then set up to 1 of your DON active (Character slot 3), button". |
| F11 | 1 | **Changed** | Won't fix by decision; step text removed from §11.3. |
| F12 | 2 | **Changed** | Arrows read every move ("Play Queen …, radio button, checked, 2 of 15", "3 of 15"). The commit was not exercised (FF4's script defect). The dialog is also described by an unreadable run of "￼" marks (F17). |
| F13 | 1 | **Changed** | Fixed: "1 card", "Play anyway , still hits", no "play button", no "⌖". Still spoken: "X dot Drake" ("Counter, grouping, X dot Drake plus 2000, toggle button"), "K dot O." forms, a lone "unavailable". |
| F14 | 1 | **Changed** | Won't fix by decision. "You: End of turn. Opponent's turn 4." |
| FF1 | 3 | **Fixed** (battle lines); game-over **unverified** | The 7000 attack, silent before, is spoken in step 10: "You: Your Kaido: effect not used. ⏐ King attacks your Leader. King 7000, your Leader 5000. You need 3000 to stop it. You have 3 Counter cards worth 5000. Plan your defence." Two distinct assertive messages were spoken in one run (steps 9 and 10), which the old pattern could not do. "Game over. You win on turn 7." was not reached (FF4). |
| FF2 | 2 | **Fixed** | Enter on "Defend your Leader Kaido attacks, heading", then Tab: "Block, grouping, No block, toggle button, pressed". Not reproduced here, as in Chrome. |
| FF3 | 1 | **Still open** | "1 ⏐ pressed ⏐ Basil Hawkins 1000 check 1"; "2 ⏐ pressed ⏐ Basil Hawkins minus 1000 check 2". |

## New findings

Findings F15 to F19 in [m3-nvda-chrome-r2.md](m3-nvda-chrome-r2.md#new-findings) hold in Firefox as well (F15, F16 and F18 confirmed in the speech; F17's description reads as "￼" marks here; F19 is page text). Firefox-specific:

| ID | Sev | Steps | Finding | Spoken-log excerpt | Suggested fix |
| --- | --- | --- | --- | --- | --- |
| FF4 | **3** | 15, 16, 18 | **Steps 16 and 18 are unverified in Firefox.** After the script's Shift+Tab loop left the page in step 15, no key reached the app again, so the shortcut sheet and "Game over. You win on turn 7." (assertive; the exact message FF1 was about) were never spoken or checked. Cause: the script (a loop written for the old list) plus the rewind dialog letting Shift+Tab leave the page (F17); in Firefox, Escape from the toolbar does not close it. Not an app defect found, but severity 3 rule applies: an unheard status message is not a pass. | Step 15 row 11 on: "Close (Escape), button" → "Navigation, tool bar ⏐ Account, button, 1 of 3" → "Search or enter address, combo box …". Step 18: 120 key presses, no speech from the page. | Fix the script (Tab to "Rewind to before it" after the arrows; on losing the page, click the document). Also wrap focus in the dialog (F17). Re-run Firefox only. |
| F20 | 1 | 10 | Firefox speaks the "Next move" button's label flicker while the AI moves. | "unavailable ⏐ Next move , the AI is moving ⏐ Opponent: Give 1 DON to Yamato. ⏐ Next move , the AI waits for you" | Keep the label fixed; put "the AI is moving" in a status line. |

**Not built (no severity):** step 17's Settings → Single-key shortcuts; step 18's review link; the coach panel's tab stop.

**What worked well now:** the same as Chrome's, and in Firefox in particular the second and later assertive messages (FF1) and the Tab out of the planner heading (FF2).
