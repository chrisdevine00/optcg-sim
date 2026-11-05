# M3 screen-reader pass, fourth run: NVDA + Chrome

**Kind of pass:** scripted (Guidepup), not a human listening pass (accessibility.md §11.2, risk R9). Follows [m3-nvda-chrome-r2.md](m3-nvda-chrome-r2.md) (Chrome has not run since; Firefox's third run is [m3-nvda-firefox-r3.md](m3-nvda-firefox-r3.md)).
**Result:** **PASS.** No open severity 3 or 4 finding. F21 (the rewind sentence), F7 (the inspector's text) and F8 (the DON!! paid) are now spoken. Open at severity 2: F3 and F15 (the F15 fix did not reach the case that failed). F12's list commit, unproven in Chrome until now, works.
**Date:** 2026-11-05.

## Versions

| Item | Version |
| --- | --- |
| NVDA | 2026.2 (Guidepup's portable build `guidepup-nvda-0.2.1-2026.2`, default configuration) |
| Browser | Google Chrome 156.0.8078.80 (the harness reports "chromium 156.0.8078.80"; Playwright `channel: 'chrome'`, headed, 1280 × 720) |
| Guidepup | `@guidepup/guidepup` 0.38.0, `@guidepup/playwright` 0.21.0 |
| Windows image | GitHub Actions `windows-2025` (`win25-vs2026` 20261030.294.1) |
| App commit | `23c06cb` on `main` (the log header; the run's head SHA matches). It includes the F21, F7, F8 and F15 fixes |
| Workflow run | [42127510881](https://github.com/chrisdevine00/optcg-sim/actions/runs/42127510881) |
| Spoken log | [logs/m3-nvda-chrome-r4.md](logs/m3-nvda-chrome-r4.md) |

## How it ran

- Same scenario, seed and script as run 2, with step 15 rewritten for the radio group (ArrowDown ×2, Tab to "Cancel", Tab to "Rewind to before it", Enter). The script stays in the dialog.
- **Harness assists:** none in steps 1 to 17. Step 18: the harness put focus on an attacker five times; keys after that were NVDA's.
- Step 2 starts from the skip link by Shift+Tab (F3). The log's "Expect" lines still carry the old §11.3 wording for steps 8, 10, 13, 14; I judged against the updated §11.3.
- **The game path matched run 2** in Chrome (a win on turn 7), so steps 1 to 14 and 16 read as in run 2 except where noted below.

## Steps

| # | Do | Result | What NVDA said (short) |
| --- | --- | --- | --- |
| 1 | Load; Tab from the page top | **Fail** (F3) | "main landmark, Your Main phase, region, Your Main phase, heading, clickable, level 2"; Control+Home "out of region, same page, link, Skip to decision"; Tab: the heading again; Tab: "⟲ Rewind, button, unavailable, U". |
| 2 | Tab through every zone | **Pass** | Zones in §3.1 order with counts; the decision panel straight after the hand. |
| 3 | `Q` | **Pass** | "Turn 3, your main phase. You: 3 Life, 5 cards in hand, 6 of 8 DON active, 2 Characters. Opponent: 2 Life, 1 card in hand, …" |
| 4 | Hand; `I`; Escape | **Pass** | `I`: "Inspector: X dot Drake, dialog, On Play DON minus 2: Trash 1 card from your opponent's hand. ⏐ Unpin and close (Escape), button". The card's text is spoken on open. Escape returns to the card. |
| 5 | Enter on a playable Character; Play | **Pass** (F13) | "You: Played Black Maria, rested 3 DON . ⏐ Game board, turn 3, your main phase … Your hand, 4 cards … Your X. Drake …". Cost heard; focus on the hand. |
| 6 | `+` on the Leader; Up twice; Enter | **Pass** (note) | "3: your Leader 8000" → "You: Give 3 DON to Kaido." |
| 7 | `A` on a Character played this turn | **Pass** | "Black Maria can't attack: A Character can't attack on the turn it is played." |
| 8 | `E`; Rookie at Step pace with `.` | **Pass** | `E`: "You: End of turn. Opponent's turn 4. Opponent: Refresh Draw 1 DON plus 2." Focus stays on the hand card, and `.` there speaks each move. End of turn: "Opponent's turn 4: played no cards; 2 attacks; you took 1 damage, Life 3 to 2. Opponent: End of turn. Your turn 5." The heading then reads "urn, heading, clickable, level 2, You is in th" (cut off; F22). |
| 9 | Attacked: the defence planner | **Pass** (note) | Assertive line spoken; Enter on the heading does not commit; Tab → "Block, grouping, No block, toggle button, pressed". Two Blockers read "Kaido 12000 survives" (F16). |
| 10 | No block; stage a tie; footer; second; Enter | **Pass** (note) | "King attacks your Leader. King 7000 …", "Staged X dot Drake, plus 2000. Your Leader 7000 against 7000: tied: the attacker wins ties. Need 1000 more.", "Play anyway , still hits", result "Opponent: Attack fails 7000 vs 8000." Focus on "Next move , the AI waits for you"; `.` ×4 each moved the AI. |
| 11 | A hit reveals a [Trigger] | **Pass** | "Opponent: Hit 5000 vs 5000 ties go to the attacker. ⏐ Activate Trigger, button". |
| 12 | `A` on the Leader; arrows; Enter; Enter | **Pass** (F15) | Confirm spoken: "Kaido 5000 against their Leader 5000. Result depends on When Attacking . Enter to attack, Escape to go back." After Done: focus on "Kaido attacks their Leader, heading"; `.` there did nothing. |
| 13 | Two-target pick | **Pass** | "King cost 6 7000: can't be chosen for this effect, button, unavailable"; "1 of up to 2 chosen", "2 of up to 2 chosen". "You: Played Queen, rested 9 DON" on the way in. |
| 14 | `order` decision | **Pass** | "First: Kaido (DON returned): … (Character slot 3), button"; focus on the heading after the choice. |
| 15 | `U`; `R`; choose a move; confirm | **Pass** | `U`: "Rewound. Back to: before Basil Hawkins cannot attack Yamato cannot attack. Same shuffle: …". `R`: dialog and 15 moves; ArrowDown "Play Queen 9 DON Your Queen: …, radio button, checked, 2 of 15", "3 of 15"; Tab "Cancel"; Tab "Rewind to before it, button". **Enter: "Game board, turn 5, your battle phase, game board ⏐ Your hand, 3 cards, grouping ⏐ Your Basil Hawkins … ⏐ You: Attack fails 5000 vs 7000. ⏐ Rewound. Back to: before attack fails 5000 vs 7000."** Focus on the hand card; the sentence is spoken last, after focus settles. |
| 16 | `?`, Escape | **Pass** | The whole sheet read, including "With NVDA, the buttons at the foot of the decision panel are in focus mode …". Escape: focus on the hand card, no stale alert. |
| 17 | Settings → Single-key shortcuts off | **Not built** | No Settings screen and no "Single-key shortcuts" setting. |
| 18 | Play to the end | **Pass** | "Game over. You win on turn 7. ⏐ Rematch, or New game." Focus "Game over, heading". Tab: "New game", "Rematch", and the review link is now built: Tab reaches "Review this game, button". Three defence lines were spoken ("Kaido attacks your Leader. Kaido 6000 …", "Basil Hawkins attacks Black Maria. …", "King attacks your Leader. King 7000 …"). |

Pass: 16 (2 to 16, 18). Fail: 1 (step 1). Not built: 1 (17).

## Verdicts on the old findings

| ID | Old sev | Verdict | Evidence (what NVDA spoke) |
| --- | --- | --- | --- |
| F1 | 3 (fixed) | **Fixed** | After Play: "… ⏐ Your hand, 4 cards, grouping ⏐ Your X. Drake …"; after Done and the order choice: "Kaido attacks their Leader, heading"; after the rewind: the hand card. No focus fell to the body. |
| F2 | 2 (changed) | **Changed** | `.` works from the footer's "Next move" (step 10 rows 26 to 29) and from board cards during the AI's turn (step 8, step 18). Still silent from the panel heading (F15). |
| F3 | 2 | **Still open** | Step 1: "main landmark, Your Main phase, region, Your Main phase, heading, clickable, level 2", not "Skip to decision". |
| F4 | 2 | **Fixed** | "Kaido 5000 against their Leader 5000. Result depends on When Attacking . …"; "Kaido 12000 against their Leader 5000: hits unless they counter." |
| F5 | 2 | **Fixed** | "Opponent's turn 4: played no cards; 2 attacks; you took 1 damage, Life 3 to 2." |
| F6 | 2 | **Fixed** | "Opponent: Their Kaido: effect not used Your Kaido: …". No "alert," is spoken in the log; Cancel, Escape and the rewind close dialogs without a stale re-read. |
| F7 | 2 | **Fixed** | "Inspector: X dot Drake, dialog, On Play DON minus 2: Trash 1 card from your opponent's hand. ⏐ Unpin and close (Escape), button". The description now carries the text. |
| F8 | 1 | **Fixed** | "You: Played Black Maria, rested 3 DON ." and "You: Played Queen, rested 9 DON". The rewind list shows it too ("Play Queen 9 DON …"). |
| F9 | 2 | **Fixed** | "King cost 6 7000: can't be chosen for this effect, button, unavailable". |
| F10 | 2 | **Fixed** | "First: Kaido (DON returned): … (Character slot 3), button". |
| F11 | 1 | **Changed** | Won't fix by decision; step text removed from §11.3. |
| F12 | 2 (changed) | **Fixed** | The commit is now proven in Chrome: arrows, Tab, Tab, Enter → "Game board, turn 5, your battle phase … You: Attack fails 5000 vs 7000. ⏐ Rewound. Back to: before attack fails 5000 vs 7000." |
| F13 | 1 | **Changed** | Still spoken: "X dot Drake" ("Counter, grouping, X dot Drake plus 2000"), "K dot O. d" ("Take the hit , Black Maria K dot O. d"), "K dot O. Their Yamato", a lone "unavailable" when "Next move" disables; the rewind sentence's "before attack fails" starts lower-case. Everything else on the old list stays fixed. |
| F14 | 1 | **Changed** | Won't fix by decision. "You: End of turn. Opponent's turn 4. …" |
| F15 | 2 | **Still open** | Step 12, after Done on Kaido's own [When Attacking] pick: focus on "Kaido attacks their Leader, heading"; `.` → no speech, no move. After Shift+Tab to the hand, `.` → "Opponent: Their Kaido: effect not used. ⏐ … Choose what resolves first". The fix (focus "Next move" during the AI's Step-paced turn) is not visible here: after `E` focus stays on the hand card (`.` works there as a board key), and after a commit it lands on "Next move" as before. The waiting state in your own attack still lands on the heading. |
| F16 | 1 | **Still open** | "Kaido 12000 survives, toggle button, not pressed" twice in a row. |
| F17 | 1 | **Still open** | Description still lists all 15 moves on open ("Rewind to before a move, dialog, … ￼Return 1 DON to the DON deck Draw 1 ￼Play Queen 9 DON …"). Containment of Shift+Tab was not re-tried (the script stays inside), so it is unverified. |
| F18 | 1 | **Still open** | "Choose, heading, clickable, level 2"; "Game over, heading, clickable, level 2". |
| F19 | 1 | **Still open** | Page text only: "Result depends on [When Attacking] · ties go to the attacker They need +1000 to survive" (the log's step 12 note). |
| F20 | 1 | **Not seen in Chrome** | Firefox-only wording ("Next move , the AI is moving"); Chrome speaks only a lone "unavailable" (F13). |
| F21 | 3 | **Fixed** | "… ⏐ You: Attack fails 5000 vs 7000. ⏐ Rewound. Back to: before attack fails 5000 vs 7000." The sentence is spoken after focus lands (it was written twice to the live region; spoken once). Chrome's first test of this path. |

## New findings

| ID | Sev | Steps | Finding | Spoken-log excerpt | Suggested fix |
| --- | --- | --- | --- | --- | --- |
| F22 | 1 | 8, 10 | The "Your turn" heading is followed by a description that reads "You is in the Main Phase." (`waitingWords` is given "You" as the name). NVDA's speech is cut off by the next key in the log, so I cannot see the whole sentence. It reads as ungrammatical and as a waiting text for a turn that is already yours. | "Opponent's turn 4: … Your turn 5. … ⏐ urn, heading, clickable, level 2, You is in th ⏐ Your Main phase" | Use "Your" / "Your turn" in `waitingWords` for the player, or do not describe a heading whose decision is yours. Check the full spoken text with a longer wait. |

Nothing the new focus target broke: whenever the player owed a decision the focus went to the decision ("Use", the planner heading, "Activate Trigger"), never to "Next move". "Next move" took focus only in waiting states, as before.

**Not built (no severity):** step 17's Settings → Single-key shortcuts; the coach panel's tab stop (§3.1 stop 9). Step 18's review link is now built.

**What worked well now:** the rewind sentence after a list rewind; the inspector reading its text; the DON!! cost in the play line and in the rewind list; the review link; `.` from every board and footer position in the AI's turn.
