# M3 screen-reader pass: NVDA + Firefox

**Kind of pass:** scripted (Guidepup), not a human listening pass (accessibility.md §11.2, risk R9).
**Result:** **FAIL.** Two severity 3 findings: F1 (as in Chrome) and FF1 (assertive messages after the first are not spoken). Eight severity 2 findings.
**Date:** 2026-10-29.

## Versions

| Item | Version |
| --- | --- |
| NVDA | 2026.2 (Guidepup's portable build `guidepup-nvda-0.2.1-2026.2`, default configuration) |
| Browser | Firefox 157.0: Playwright's Firefox build (window title "Nightly"), not a branded Mozilla release; headed, 1280 × 720 |
| Guidepup | `@guidepup/guidepup` 0.38.0, `@guidepup/playwright` 0.21.0, `@guidepup/setup` 0.29.3; `@playwright/test` 1.64.1 |
| Windows image | GitHub Actions `windows-2025` (`win25-vs2026` 20261021.278.1) |
| App commit | `6f826f2` on `main` (includes M4a Phase B, `d3ed657`) |
| Workflow run | [40866547375](https://github.com/chrisdevine00/optcg-sim/actions/runs/40866547375), artifact `a11y-nvda-40866547375` |
| Spoken log | [logs/m3-nvda-firefox.md](logs/m3-nvda-firefox.md) |

How it ran is the same as [m3-nvda-chrome.md](m3-nvda-chrome.md#how-it-ran): same script, scenario, seed and AI moves. Step 11 ran before step 10, and step 14 came up during step 12. In step 18 only, the harness put focus on an attacker five times.

## Steps

The speech matches Chrome's except where this table says otherwise (see the log). Firefox reads cards as "button, sub Menu" where Chrome says "menu button".

| # | Result | Firefox-specific notes |
| --- | --- | --- |
| 1 | **Fail** (F3) | Same as Chrome: the first Tab reaches "Your Main phase, heading". |
| 2 | **Pass** | Same order and names. The log is announced as "Event log, region, Game log", with no "grouping". |
| 3 | **Pass** | Same status summary. |
| 4 | **Fail** (F7) | The inspector reads only its name and close button. |
| 5 | **Fail** (F1, F8) | The menu adds "Actions for Black Maria, menu". After Play: "You: Play Black Maria. ⏐ Game OPTCG Sim, document". |
| 6 | **Pass** | Count changes read shorter: "7000 ⏐ 2: your Leader 7000 ⏐ DON to give, 2 of 3 active". |
| 7 | **Pass** | Same. |
| 8 | **Fail** (F5, F6) | Same. Firefox also re-reads the focused card after `E`. |
| 9 | **Pass** (FF2) | The assertive line is spoken once, as "alert, Kaido attacks your Leader …". After Enter on the planner heading, Tab goes to "Skip to decision" and then through the whole board (9 presses) before reaching "No block" (FF2). |
| 10 | **Fail** (FF1) | The 7000 attack's assertive line ("King attacks your Leader. King 7000 …") is written to the region but **not spoken**. NVDA says only "unavailable ⏐ Counter Stage a lit hand card ⏐ Defend your Leader King attacks, heading, level 2". The staging sentences, footer and result are spoken as in Chrome ("Play anyway, still hits" is read with its pause). |
| 11 | **Pass** | "Kaido: Hit 5000 vs 5000 ties go to the attacker. ⏐ Add to hand Enter ⏐ Activate Trigger, button"; result spoken. |
| 12 | **Fail** (F4) | Same silent confirm and wrong verdict. After a pick, the status reads only "1 ⏐ pressed", not "1 of up to 1 chosen". |
| 13 | **Fail** (F9) | Same. |
| 14 | **Fail** (F10, F1) | Same. |
| 15 | **Fail** (F12, F6) | Same: no rewind from the list. The stale alert is re-read after Escape. |
| 16 | **Pass** (F6) | Same. |
| 17 | **Not built** | Same. |
| 18 | **Fail** (FF1) | The game ends ("Game over, heading, level 2", "Rematch, or New game."), but the assertive "Game over. You win on turn 7." is **not spoken**. Later defences' assertive lines are not spoken either. |

Pass: 7 (2, 3, 6, 7, 9, 11, 16). Fail: 10 (1, 4, 5, 8, 10, 12, 13, 14, 15, 18). Not built: 1 (17).

## Findings

Findings F1 to F14 in [m3-nvda-chrome.md](m3-nvda-chrome.md#findings) all hold in Firefox too. F1 (focus lost to the page body) is **severity 3** here as well. Firefox-only findings:

| ID | Sev | Steps | Finding | Spoken-log excerpt | Suggested fix |
| --- | --- | --- | --- | --- | --- |
| FF1 | **3** | 10, 18 | **Only the first assertive message on the page is spoken.** The defence opening line is spoken for the first attack only. Later attacks (step 10's 7000 attack, and three in step 18) are silent. So is "Game over. You win on turn 7." The texts are written to `#announce-assertive` (the live-region log has them) and NVDA re-reads the stale one after a dialog closes (F6). Firefox and NVDA announce `role="alert"` when it first appears, not when its text changes. That loses the WCAG 4.1.3 status messages §9.3 marks assertive: the battle maths when focus does not move, and the game result. | Step 10: "You: Kaido: effect not used. ⏐ unavailable ⏐ Counter Stage a lit hand card ⏐ Defend your Leader King attacks, heading, level 2" (the live region holds "King attacks your Leader. King 7000 …"). Step 18: "Rematch, or New game. ⏐ button, New game ⏐ Game over, heading, level 2". | Use `aria-live="assertive"` with `aria-atomic="true"` and clear-then-write, or insert a fresh child element per message (the pattern NVDA announces in Firefox). Clear after a second (F6b). Add an e2e check that each assertive write replaces a child node. |
| FF2 | 2 | 9 | **After Enter on the planner heading, Tab goes to the top of the page.** It takes 9 presses through the board to reach "No block". In Chrome, Tab goes from the heading into the panel. | Enter on "Defend your Leader Kaido attacks, heading" → Tab: "Skip to decision, same page, link" → "Opponent: Kaido" → … → "No block". | Don't treat Enter on the heading as a page action; or keep the heading out of NVDA's activation (no click handler); check Firefox's sequential focus starting point after a programmatic focus on a `tabindex="-1"` heading. |
| FF3 | 1 | 12 | The pick status is read as "1" after a pick, not "1 of up to 1 chosen" (Chrome reads the whole line). | "1 ⏐ pressed ⏐ ⌖ Basil Hawkins 1000 check 1" | Use `aria-atomic="true"` on the status. |
