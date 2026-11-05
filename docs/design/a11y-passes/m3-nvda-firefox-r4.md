# M3 screen-reader pass, fourth run: NVDA + Firefox

**Kind of pass:** scripted (Guidepup), not a human listening pass (accessibility.md §11.2, risk R9). Follows [m3-nvda-firefox-r3.md](m3-nvda-firefox-r3.md).
**Result:** **PASS.** No open severity 3 or 4 finding. F21 (the rewind sentence) is now spoken in Firefox; so are the inspector's text (F7) and the DON!! paid (F8). Game over was spoken again, this time for a loss. Open at severity 2: F3, F15 (the fix did not reach the case that failed), and new FF5 (the loss is announced as "Kaido wins", which in a mirror does not say who won).
**Date:** 2026-11-05.

## Versions

| Item | Version |
| --- | --- |
| NVDA | 2026.2 (Guidepup's portable build `guidepup-nvda-0.2.1-2026.2`, default configuration) |
| Browser | Firefox 157.0 (harness string "firefox 157.0": Playwright's Firefox build, as before; headed, 1280 × 720) |
| Guidepup | `@guidepup/guidepup` 0.38.0, `@guidepup/playwright` 0.21.0 |
| Windows image | GitHub Actions `windows-2025` (`win25-vs2026` 20261030.294.1) |
| App commit | `23c06cb` on `main` (the log header; includes the F21, F7, F8, F15 fixes) |
| Workflow run | [42127510881](https://github.com/chrisdevine00/optcg-sim/actions/runs/42127510881) |
| Spoken log | [logs/m3-nvda-firefox-r4.md](logs/m3-nvda-firefox-r4.md) |

## How it ran

- Same scenario, seed and script as run 3. **Harness assists:** none in steps 1 to 17; five attacker-focus assists in step 18. The page was never lost.
- Steps 1 to 14 read as in run 3 except the lines called out below (I diffed the logs).
- **Step 18 took a different game from Chrome's and from run 3's.** The AI's timing-dependent plans differ per run, and this time Rookie won on turn 8: the scripted player ran out of Life ("Take the hit , Life 0 right arrow 0 you lose"). So game-over was heard as a **loss** here, a case no earlier run covered. The step's expectation (game end announced assertively) is met either way.
- The log's "Expect" lines still carry the old §11.3 wording for steps 8, 10, 13, 14; I judged against the updated §11.3.

## Steps

| # | Result | What NVDA said (Firefox) |
| --- | --- | --- |
| 1 | **Fail** (F3) | First Tab: "main landmark, Your Main phase, region, Your Main phase, heading, clickable, level 2"; the heading again; then "⟲ Rewind, button, unavailable, U". |
| 2 | **Pass** | Zones in order with counts. |
| 3 | **Pass** | Same summary. |
| 4 | **Pass** | `I`: "Inspector: X dot Drake, dialog, On Play DON minus 2: Trash 1 card from your opponent's hand. ⏐ Unpin and close (Escape), button". |
| 5 | **Pass** (F13) | "You: Played Black Maria, rested 3 DON . ⏐ Game board … Your hand, 4 cards … Your X. Drake …". |
| 6 | **Pass** | "3: your Leader 8000" → "You: Give 3 DON to Kaido." |
| 7 | **Pass** | "Black Maria can't attack: …" |
| 8 | **Pass** | One sentence per move; end-of-turn summary "Opponent's turn 4: played no cards; 2 attacks; you took 1 damage, Life 3 to 2. …". Heading then "urn, heading, clickable, level 2, You is in th" (F22). |
| 9 | **Pass** | Assertive line spoken; Tab from the heading → "Block, grouping, No block, toggle button, pressed". |
| 10 | **Pass** (note) | "King attacks your Leader. King 7000 …" spoken; staging; `.` ×4 (with F20 noise). |
| 11 | **Pass** | "Opponent: Hit 5000 vs 5000 ties go to the attacker. ⏐ Add to hand ⏐ Activate Trigger, button". |
| 12 | **Pass** (F15, FF3) | Confirm spoken; pick status "1 ⏐ pressed ⏐ Basil Hawkins 1000 check 1"; after Done, focus on "Kaido attacks their Leader, heading" and `.` did nothing. |
| 13 | **Pass** | "King cost 6 7000: can't be chosen for this effect, button, unavailable"; "You: Played Queen, rested 9 DON …"; "1 ⏐ pressed", "2 ⏐ pressed" (FF3). |
| 14 | **Pass** | "First: Kaido (DON returned): … (Character slot 3), button". |
| 15 | **Pass** | `U` spoke "Rewound. Back to: before Basil Hawkins cannot attack Yamato cannot attack. Same shuffle: …". List: "Play Queen 9 DON Your Queen: …, radio button, checked, 2 of 15", "3 of 15"; Tab "Cancel"; Tab "Rewind to before it, button"; **Enter: "Game board, turn 5, your battle phase … ⏐ You: Attack fails 5000 vs 7000. ⏐ Rewound. Back to: before attack fails 5000 vs 7000. ⏐ Your Basil Hawkins, Character, cost 3, … can be played"**. |
| 16 | **Pass** | Sheet read in full; Escape returns to the hand card; no stale alert. |
| 17 | **Not built** | No Settings screen. |
| 18 | **Pass** (note: FF5) | **"Game over. Kaido wins on turn 8. ⏐ Rematch, or New game. ⏐ Rematch ⏐ button, Review this game ⏐ Game over, heading, clickable, level 2"** (assertive). Tab: "Review this game, button". Every defence line was spoken (e.g. "Basil Hawkins attacks your Leader. Basil Hawkins 7000, your Leader 5000. …"). |

Pass: 16 (2 to 16, 18). Fail: 1 (step 1). Not built: 1 (17).

## Verdicts on the run-3 findings

| ID | Run-3 sev | Verdict | Evidence (what NVDA spoke) |
| --- | --- | --- | --- |
| F1 | 3 (fixed) | **Fixed** | After Play: "… Your hand, 4 cards … Your X. Drake …"; after Done: "Kaido attacks their Leader, heading"; after the rewind and the sheet: the hand card. No "Game OPTCG Sim, document". |
| F2 | 2 (changed) | **Changed** | `.` works from "Next move" (step 10) and from board cards (step 18). Still silent from the panel heading (F15). |
| F3 | 2 | **Still open** | Step 1: Tab from the top → "Your Main phase, region, Your Main phase, heading, clickable, level 2". |
| F4 | 2 | **Fixed** | "Kaido 5000 against their Leader 5000. Result depends on When Attacking . …" |
| F5 | 2 | **Fixed** | "Opponent's turn 6: played no cards; 2 attacks; you took no damage; your Kaido and your Black Maria were K dot O. d." |
| F6 | 2 | **Fixed** | "Opponent: Their Kaido: effect not used Your Kaido: …"; no "alert," anywhere in the log. |
| F7 | 2 | **Fixed** | "Inspector: X dot Drake, dialog, On Play DON minus 2: Trash 1 card from your opponent's hand." |
| F8 | 1 | **Fixed** | "You: Played Black Maria, rested 3 DON ." |
| F9 | 2 | **Fixed** | "King cost 6 7000: can't be chosen for this effect, button, unavailable". |
| F10 | 2 | **Fixed** | "First: Kaido (DON returned): … (Character slot 3), button". |
| F11 | 1 | **Changed** | Won't fix by decision. |
| F12 | 2 (fixed) | **Fixed** | Commit works again (step 15, as run 3), now with the rewind sentence. |
| F13 | 1 | **Changed** | Still spoken: "X dot Drake", "K dot O. d" (step 18 row 35: "Take the hit , Kaido K dot O. d"), a lone "unavailable". |
| F14 | 1 | **Changed** | Won't fix by decision. |
| F15 | 2 | **Still open** | Step 12: after Done, focus on "Kaido attacks their Leader, heading"; `.` → no speech, no move. In step 18 after a Skip on your own attack the focus landed on "⟲ Rewind" (waiting): "You: Your Kaido: effect not used. ⏐ ⟲ Rewind"; the script moved to the hand to press `.`. The "Next move" focus target did not appear in these states; in the AI's own turn the board card kept focus and `.` worked. Nothing was broken by the new target: when a decision was owed, focus went to "Use", the planner heading or "Activate Trigger", never "Next move". |
| F16 | 1 | **Still open** | "Kaido 12000 survives" twice. |
| F17 | 1 | **Still open** | Description still read as a run of "￼" marks; Shift+Tab containment unverified (the script stays inside). |
| F18 | 1 | **Still open** | "Game over, heading, clickable, level 2". |
| F19 | 1 | **Still open** | Page text only, unchanged. |
| F20 | 1 | **Still open** | "unavailable ⏐ Next move , the AI is moving ⏐ Opponent: Give 1 DON to Yamato. ⏐ Next move , the AI waits for you". |
| F21 | 3 | **Fixed** | Step 15 Enter: "… ⏐ You: Attack fails 5000 vs 7000. ⏐ Rewound. Back to: before attack fails 5000 vs 7000. ⏐ Your Basil Hawkins …". The sentence is spoken after focus lands (the page wrote it twice; spoken once). |
| FF1 | 3 (fixed) | **Fixed** | Game over is heard again: "Game over. Kaido wins on turn 8." Every defence line was spoken. |
| FF2 | 2 | **Fixed** | Enter on the planner heading, Tab: "Block, grouping, No block, toggle button, pressed". |
| FF3 | 1 | **Still open** | "1 ⏐ pressed ⏐ Basil Hawkins 1000 check 1"; "2 ⏐ pressed". |
| FF4 | 3 (fixed) | **Fixed** | Steps 15, 16 and 18 ran in the page; no assists beyond step 18's five attacker focuses. |

## New findings

| ID | Sev | Steps | Finding | Spoken-log excerpt | Suggested fix |
| --- | --- | --- | --- | --- | --- |
| FF5 | 2 | 18 | **The loss is announced as "Kaido wins", which does not say who won.** In a Kaido mirror both Leaders are Kaido, so the player cannot tell a win from a loss. The win is announced "You win on turn 7"; the loss uses the Leader's name. This is the F6a rule again (a name that could be yours must not stand for the opponent). The take-the-hit button did say "you lose" just before. Seen in Firefox only because only this run lost; Chrome has not run a loss. | "Game over. Kaido wins on turn 8. ⏐ Rematch, or New game." (assertive); page final panel: "Game over Kaido wins · Turn 8 Your Leader was hit at 0 Life (CR 9-2-1-1)." | Say "You lose on turn 8" (or "Opponent wins"), as the win says "You win". Check the panel heading too. |
| F22 | 1 | 8, 10, 18 | The "Your turn" heading is followed by "You is in th…" (the description is cut off in the log; the source has `${who} is in the Main Phase.` with "You"). Ungrammatical, and a waiting text for a turn that is yours. Same as Chrome. | "… Your turn 7. … ⏐ urn, heading, clickable, level 2, You is in th ⏐ Your Main phase" | Use "Your" for the player in `waitingWords`, or drop the description on the player's own heading. |

**Not built (no severity):** step 17's Settings → Single-key shortcuts; the coach panel's tab stop. Step 18's review link is now built ("Review this game, button").

**What worked well now:** the same as Chrome's, plus the rewind sentence after a list rewind and all assertive messages in Firefox, including game over after a loss.
