# M3 screen-reader pass, third run: NVDA + Firefox

**Kind of pass:** scripted (Guidepup), not a human listening pass (accessibility.md §11.2, risk R9). A re-run of [m3-nvda-firefox-r2.md](m3-nvda-firefox-r2.md) with one change: the script's step 15 was rewritten for the radio-group rewind list. The app is the same code as run 2 plus docs (`001bbfa`).
**Result:** **FAIL.** One open severity 3 finding, new F21: after a rewind chosen from the list, the page writes "Rewound. Back to: before attack fails · 5000 vs 7000." but NVDA does not speak it (a status message lost). FF4 (the harness fault) is fixed: steps 16 and 18 ran, and "Game over. You win on turn 7." **was spoken**. Open at severity 2: F2 (narrowed), F3, F7, F15.
**Date:** 2026-11-05.

## Versions

| Item | Version |
| --- | --- |
| NVDA | 2026.2 (Guidepup's portable build `guidepup-nvda-0.2.1-2026.2`, default configuration) |
| Browser | Firefox 157.0 (harness string "firefox 157.0"; Playwright's Firefox build as in runs 1 and 2; headed, 1280 × 720) |
| Guidepup | `@guidepup/guidepup` 0.38.0, `@guidepup/playwright` 0.21.0 |
| Windows image | GitHub Actions `windows-2025` (`win25-vs2026` 20261030.294.1) |
| App commit | `001bbfa` on `main` |
| Workflow run | [42125614507](https://github.com/chrisdevine00/optcg-sim/actions/runs/42125614507) |
| Spoken log | [logs/m3-nvda-firefox-r3.md](logs/m3-nvda-firefox-r3.md) |

## How it ran

- Same scenario, seed and script as run 2 (see [m3-nvda-chrome-r2.md](m3-nvda-chrome-r2.md#how-it-ran)) except step 15. Steps 1 to 14 are word for word the same speech as run 2 (I diffed the two logs: the only differences are the order of two phrases in step 8 and step 10's heading entry, and where "8000" falls in step 6's count line).
- **Step 15 (the only script change):** `U`, `R`, ArrowDown ×2 (third move checked), Tab → "Cancel", Tab → "Rewind to before it", Enter. The script no longer leaves the dialog, so no key goes to the browser toolbar.
- **Harness assists:** none in steps 1 to 17. Step 18: the harness put focus on an attacker five times, as in earlier runs; keys after that were NVDA's. The page was never lost.
- Step 2 starts from the skip link by Shift+Tab (F3). The log's "Expect" lines still carry the old §11.3 wording for steps 8, 10, 13, 14; I judged against the updated §11.3.

## Steps

| # | Result | What NVDA said (Firefox) |
| --- | --- | --- |
| 1 | **Fail** (F3) | First Tab: "main landmark, Your Main phase, region, Your Main phase, heading, clickable, level 2". Then the heading again, then "⟲ Rewind, button, unavailable, U". |
| 2 | **Pass** | Zones in §3.1 order with counts; decision panel straight after the hand. |
| 3 | **Pass** | "Turn 3, your main phase. You: 3 Life, 5 cards in hand, 6 of 8 DON active, 2 Characters. Opponent: 2 Life, 1 card in hand, …" |
| 4 | **Fail** (F7) | "Inspector: X dot Drake, dialog, Card text ⏐ Unpin and close (Escape), button". |
| 5 | **Pass** (F8, F13) | "You: Played Black Maria. ⏐ Game board … Your hand, 4 cards … Your X. Drake …". |
| 6 | **Pass** | "3: your Leader 8000" → "You: Give 3 DON to Kaido." |
| 7 | **Pass** | "Black Maria can't attack: A Character can't attack on the turn it is played." |
| 8 | **Pass** | One sentence per move; "Opponent's turn 4: played no cards; 2 attacks; you took 1 damage, Life 3 to 2. Opponent: End of turn. Your turn 5." |
| 9 | **Pass** | Assertive line spoken; Enter on the heading, Tab → "Block, grouping, No block, toggle button, pressed". Two Blockers read "Kaido 12000 survives" (F16). |
| 10 | **Pass** (note) | "King attacks your Leader. King 7000 …" spoken; staging sentences, "Play anyway , still hits"; `.` ×4 moved the AI (F20 noise). |
| 11 | **Pass** | "Opponent: Hit 5000 vs 5000 ties go to the attacker. ⏐ Add to hand ⏐ Activate Trigger, button". |
| 12 | **Pass** (F15, FF3) | Confirm spoken ("Result depends on When Attacking"); pick status "1 ⏐ pressed ⏐ Basil Hawkins 1000 check 1"; `.` on the panel heading silent. |
| 13 | **Pass** | "King cost 6 7000: can't be chosen for this effect, button, unavailable"; picks read "1 ⏐ pressed", "2 ⏐ pressed". |
| 14 | **Pass** | "First: Kaido (DON returned): … (Character slot 3), button"; focus on the heading. |
| 15 | **Fail** (F21) | `U`: "Rewound. Back to: before Basil Hawkins cannot attack Yamato cannot attack. Same shuffle: rewinding won't change your draws." `R`: dialog read, items as "￼￼ ￼￼ …" (F17), then "Return 1 DON to the DON deck Draw 1, radio button, not checked, 1 of 15". Arrows: "Play Queen …, radio button, checked, 2 of 15", "Attack fails 5000 vs 7000, radio button, checked, 3 of 15". Tab: "Cancel, button"; Tab: "Rewind to before it, button". **Enter: the rewind happened** (state is back at the attack; focus on the hand's Basil Hawkins) **but NVDA said only "Game board, turn 5, your battle phase, game board ⏐ Your hand, 3 cards, grouping ⏐ Your Basil Hawkins … ⏐ You: Attack fails 5000 vs 7000."** The page's "Rewound. Back to: before attack fails · 5000 vs 7000." was not spoken. |
| 16 | **Pass** | "Keyboard shortcuts, dialog, Single-key shortcuts work while focus is on the board or the decision panel. … With NVDA, the buttons at the foot of the decision panel are in focus mode, so these keys work there; in the panel's text, press NVDA plus Space first. …" Escape: "Game board, turn 5, your main phase … Your Basil Hawkins, Character, cost 3, … can be played". No stale alert. |
| 17 | **Not built** | No Settings screen and no "Single-key shortcuts" setting. |
| 18 | **Pass** (note) | **"Game over. You win on turn 7. ⏐ Rematch, or New game. ⏐ Their Leader was hit at 0 Life (CR 9-2-1-1). ⏐ Game over, heading, clickable, level 2."** Focus on "Game over" heading. Every later defence's assertive line was spoken ("Kaido attacks your Leader. Kaido 6000 …", "Basil Hawkins attacks Black Maria. …", "King attacks your Leader. King 7000 …"). Tab: "New game", "Rematch". No review link ("Game Review arrives in a later milestone"). |

Pass: 14 (2, 3, 5 to 14, 16, 18). Fail: 3 (1, 4, 15). Not built: 1 (17).

## Verdicts on the run-2 findings

Run 2's Firefox record held F1 to F14, FF1 to FF4, F15 to F20 (the last six at severity 1 or 2). Each verdict is for this run.

| ID | Run-2 sev | Verdict | Evidence (what NVDA spoke) |
| --- | --- | --- | --- |
| F1 | 3 (fixed) | **Fixed** | Focus never reached the body in the page: after Play "… ⏐ Your hand, 4 cards, grouping ⏐ Your X. Drake …"; after Done and the order choice, the heading; after the rewind, the hand card. No "Game OPTCG Sim, document". |
| F2 | 2 | **Changed** | Fixed from the footer: step 10 `.` ×4 each moved the AI ("Opponent: Give 2 DON to Yamato."); step 18 from the board: "Opponent: Give 3 DON to Basil Hawkins." Still open from the panel heading (F15). |
| F3 | 2 | **Still open** | Tab from the top: "Your Main phase, region, Your Main phase, heading, clickable, level 2", not "Skip to decision". |
| F4 | 2 | **Fixed** | "Kaido 12000 against their Leader 5000: hits unless they counter. Enter to attack, Escape to go back."; step 12 "Result depends on When Attacking". |
| F5 | 2 | **Fixed** | "Opponent's turn 4: played no cards; 2 attacks; you took 1 damage, Life 3 to 2." |
| F6 | 2 | **Fixed** | "Opponent: Their Kaido: effect not used Your Kaido: …". The dialog-close case is now reached and clean: after the rewind and after Escape in step 16, no "alert," is spoken (the log has none). |
| F7 | 2 | **Still open** | "Inspector: X dot Drake, dialog, Card text ⏐ Unpin and close (Escape), button". |
| F8 | 1 | **Still open** | "You: Played Black Maria." (no DON!! cost). |
| F9 | 2 | **Fixed** | "King cost 6 7000: can't be chosen for this effect, button, unavailable". |
| F10 | 2 | **Fixed** | "First: Kaido (DON returned): … (Character slot 3), button". |
| F11 | 1 | **Changed** | Won't fix by decision; removed from §11.3. |
| F12 | 2 (changed) | **Fixed** (pick and commit); the announcement is F21 | The commit works under NVDA: arrows "2 of 15", "3 of 15"; Tab "Cancel"; Tab "Rewind to before it, button"; Enter → "Game board, turn 5, your battle phase … You: Attack fails 5000 vs 7000." The state changed and focus returned to the hand card. |
| F13 | 1 | **Changed** | Fixed: "1 card", "Play anyway , still hits", no "play button". Still spoken: "X dot Drake", "K dot O. d" ("Take the hit , Black Maria K dot O. d"), lone "unavailable"; new: "Rewound. Back to: before attack fails" starts lower-case (page text). |
| F14 | 1 | **Changed** | Won't fix by decision. "You: End of turn. Opponent's turn 4. …" |
| FF1 | 3 (fixed for battle lines) | **Fixed** (now including game over) | Step 18: "Game over. You win on turn 7. ⏐ Rematch, or New game." Defences: "Kaido attacks your Leader. Kaido 6000, your Leader 5000. You need 2000 to stop it …", "Basil Hawkins attacks Black Maria. Basil Hawkins 6000, Black Maria 2000. …", "King attacks your Leader. King 7000, your Leader 5000. …". |
| FF2 | 2 | **Fixed** | Enter on the planner heading, Tab: "Block, grouping, No block, toggle button, pressed". |
| FF3 | 1 | **Still open** | "1 ⏐ pressed ⏐ Basil Hawkins 1000 check 1"; "2 ⏐ pressed ⏐ Basil Hawkins minus 1000 check 2". |
| FF4 | 3 | **Fixed** | The harness fault is gone: step 15 stays in the dialog and ends on the page; step 16 and step 18 ran with no page loss (5 attacker-focus assists in step 18, as in Chrome's run). |
| F15 | 2 | **Still open** | Step 12: `.` with focus on "Kaido attacks their Leader, heading": no speech, no move. |
| F16 | 1 | **Still open** | "Kaido 12000 survives, toggle button, not pressed" twice in a row. |
| F17 | 1 | **Still open** (half re-tested) | The dialog is still described by its whole list: "Rewind to before a move, dialog, … ￼￼ ￼￼ ￼￼ …" (15 marks, no move text), repeated. The Shift+Tab escape was not re-tried: the new script never leaves the dialog, so containment is unverified, not fixed. |
| F18 | 1 | **Still open** | "Choose, heading, clickable, level 2"; "Game over, heading, clickable, level 2". |
| F19 | 1 | **Still open** | Page text only (not spoken); unchanged in the log's note. |
| F20 | 1 | **Still open** | "unavailable ⏐ Next move , the AI is moving ⏐ Opponent: Give 1 DON to Yamato. ⏐ Next move , the AI waits for you". |

## New findings

| ID | Sev | Steps | Finding | Spoken-log excerpt | Suggested fix |
| --- | --- | --- | --- | --- | --- |
| F21 | **3** | 15 | **A rewind chosen from the list is not announced.** The page writes the sentence (live-region column) when "Rewind to before it" is pressed, but NVDA speaks only the focus move and the replayed last line. The `U` shortcut speaks the same sentence ("Rewound. Back to: before Basil Hawkins cannot attack Yamato cannot attack. Same shuffle: …"), so the loss is specific to the list path: the dialog unmounts and focus moves in the same tick, and NVDA's focus speech cuts the polite message. The player is not told which move was rewound, or that the shuffle is unchanged. Mitigated, not excused: the board name ("turn 5, your battle phase") and "You: Attack fails 5000 vs 7000." tell them where they are. Chrome did not run this path (its script never committed from the list), so it is unchecked there. | Live region: "Rewound. Back to: before attack fails · 5000 vs 7000." Heard: "Game board, turn 5, your battle phase, game board ⏐ Your hand, 3 cards, grouping ⏐ Your Basil Hawkins, Character, cost 3, Counter plus 2000, 1000 power, button, sub Menu ⏐ You: Attack fails 5000 vs 7000. ⏐ Your Basil Hawkins …" | Write the message after focus has settled (a short delay, or write it from the dialog's close handler after the focus call), or make it assertive. Add an e2e check that the live-region write happens after `document.activeElement` is restored. |

**Not built (no severity):** step 17's Settings → Single-key shortcuts; step 18's review link; the coach panel's tab stop.

**What worked well now:** everything in Firefox's step 18, including "Game over. You win on turn 7." and three assertive defence lines in a row; the radio-group rewind list under NVDA (arrows, Tab, Enter, focus back on the hand card); the shortcut sheet and its clean Escape.
