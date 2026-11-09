# L screen-reader pass, second run: NVDA + Firefox

**Kind of pass:** scripted (Guidepup), not a human listening pass (accessibility.md §11.2, risk R9). Second run of the §11.4 script after fix round 1 (commit `4054294`). First run: [l-nvda-firefox.md](l-nvda-firefox.md). Chrome: [l-nvda-chrome-r2.md](l-nvda-chrome-r2.md). Finding numbers are shared.
**Result:** **INCOMPLETE. No open severity 3 or 4 was found, but this is not a Firefox pass for L.** Coverage is **not sufficient**: only F3 (partly), 1, 2, F15, 2b and tier 1 of step 3 were heard. Steps 4 to 9 (the coach read, the guided count, the detector, the review, Study, Practice, the puzzle) were not heard in Firefox in either run. The round-1 harness guard that was meant to keep keys on the page does not work in Firefox, so the run reproduced r1's failure at a slightly later step. A third Firefox run is needed after the harness fix below.
**Date:** 2026-11-09.

## Versions

| Item | Version |
| --- | --- |
| NVDA | 2026.2 (Guidepup's portable build, default configuration; the log header says `NVDA_VERSION 2026.2`) |
| Browser | Firefox 157.0 (the harness reports "firefox 157.0"; Playwright's Firefox build, not a branded release; the tab is titled "JUGGLER …") |
| Guidepup | `guidepup 0.38.0, @guidepup/playwright 0.21.0` |
| Windows image | GitHub Actions `windows-2025` (`win25-vs2026 20261103.298.1`) |
| App commit | `4054294` on `main` (the log header) |
| Workflow run | GitHub run 42659930386, file `app/a11y/results/nvda-firefox/l.md` (and `l.json`). The log is not committed |
| Speech source | The NVDA Remote speech tap (timestamped); Guidepup's per-key capture is off |

## How it ran

- Same scenario, seed and script as Chrome. "HARNESS: did not reach" notes: step 2 (L-SR1), 2b (harness logic, as in Chrome), 3 (tier 3 with the coach tall), 4b (guided count), 7, 8, 9 (no review). Steps 4b, 4c and 6 ended in `locator.focus` timeouts (error).
- Step 2: Enter on the heading, no confirm, focus on `<body>`; the harness Tabbed (Cancel, then Confirm attack) and the rest of the step ran. F15 and 2b were heard through that path.
- **From step 3 on, keystrokes went to Firefox's own toolbar.** Step 3's loop to the board walked Tab past the last page control (rows 39 to 41: "Browser tabs, tool bar", "Open a new tab", "List all tabs"); the page's `document.activeElement` stayed on the same footer button the whole time (rows 39 to 44) and the round-1 guard printed no "keyboard focus left the page" note. The guard asks `document.hasFocus()`; Playwright's Firefox answers true regardless (it emulates focus), so it cannot see this. Steps 4 to 5 then spent 40 presses in the toolbar ("Sidebars", "Search or enter address", "Account"), with nine presses of Tab on "Skip to decision" that NVDA never spoke.
- Step 6 reloaded the page, "gave it keyboard focus" with a mouse click at (2, 2) (a Playwright click is synthesized inside the browser and does not move the Windows keyboard focus) and then sent Enter and ArrowDown ×8 to the Game menu: **zero speech, no menu**, so the keys were still not reaching the page. 7 to 9 then had nothing to start from.

## Steps

| # | Do | Result | What NVDA said (short) |
| --- | --- | --- | --- |
| F3 | Load; Control+Home; Tab; Enter on the link | **Note** (harness; same as Chrome) | Control+Home: "main landmark, same page, link, Skip to decision". Tab: "Your Main phase, region, Your Main phase, heading, clickable, level 2". The Enter-on-link check did not run. The skip link was never heard in Firefox (the nine Tabs onto it in step 4 were silent). |
| 1 | Attack with the Leader; `M`; read the panel | **Pass** (L-SR7) | Enter on the target: "Kaido 5000 against their Leader 5000. Result depends on When Attacking . Enter to attack, Escape to go back." `M`: "Attack Kaido right arrow their Leader, heading, clickable, level 2". Browse-next one cell at a time ("Attacker", "Kaido (your Leader)", "base", "5000", "Defender", "Their Leader", "no change"). The script read only seven lines, so "They need plus 1000" and "What they could have" were **not heard in Firefox**; the panel text carried them (the harness's own DOM check). |
| 2 | Enter to confirm; Use; pick; Done | **Fail** (L-SR1, FF-L1); the rest **Pass** via Tab | Enter on the heading: speech "Attack Kaido right arrow their Leader, heading, clickable, level 2" (NVDA re-reading the heading), **focus on `<body>`**, no live write, attack not confirmed. Tab: "Decision actions … Cancel, button"; Tab: "Confirm attack , 5000 vs 5000, button"; Enter: "You: Kaido attacks their Leader Your Kaido: Give up to 1 of your opponent's Characters minus 2000 power." Use, pick (X dot Drake, "pressed"), Done: "You: X dot Drake minus 2000. … Choose what resolves first, heading". |
| F15 | `.` after Done | **Pass** (not reproduced, as in Chrome) | Enter on the order option: "… Kaido attacks their Leader, heading … Rocks dot D dot Xebec: Counter: X dot Drake plus 2000." `.`: "Rocks dot D dot Xebec: Counter: Yamato plus 1000. ⏐ You: Attack fails 5000 vs 8000. ⏐ Your turn ⏐ Your Main phase". |
| 2b | AI defends | **Pass as built** (harness mislabelled "not reached"; same cause as Chrome) | Heard in F15's rows. Count sentence: **Note: not built**. |
| 3 | `L`, `L`, `L` | **Partial: tier 1 only** | First `l` from the board: "Coach, region, Lethal, grouping, Checking..., clickable, Detector … ⏐ Lethal: proven, works against any hand." (The coach was read while still saying "Checking...", then the line arrived: a small ordering oddity, L-SR15.) A second `l` from the coach: "no next list" (L-SR12). Tiers 2 and 3 **not heard**: the harness's Tab loop to the board left the page; the three later `l` presses went to the toolbar (silent). |
| 4 | `C`; read the coach | **Not reached** (harness) | `c` went to the toolbar ("Close, button, 4 of 4"). |
| 4b, 4c | Guided count | **Not reached** (harness) | `locator.focus` timeouts: the coach never held a "Count it with me" (coach not tall, and keys in the toolbar). |
| 5 | Detector | **Not reached** (harness) | "Detector off, 3 s idle: 0 live-region writes" is a DOM check, not heard silence. The select was set by script (assist); `+` "did not open the DON!! count dialog"; "Detector lines written since: []". |
| 6 to 9 | Review, Study, Practice, puzzle | **Not reached** (harness) | Step 6: no speech at all after the reload. 7, 8, 9: "did not reach the review/practice board". |

Pass: 4 (1, F15, 2b, and 2's Tab path). Fail: 1 (2: Enter). Note: 1 (F3). Partial: 1 (3). Not reached: 8 (4, 4b, 4c, 5, 6, 7, 8, 9).

## Verdicts on the carried findings

| ID | Old sev | New sev | Status | Evidence |
| --- | --- | --- | --- | --- |
| F3 | 1 | **1** | **Changed: unproven** | Same as Chrome. Firefox never spoke the skip link. |
| F15 | 2 | **1** | **Not reproduced; not closed** | `.` worked and was heard in Firefox; same lack of a counterfactual as in Chrome. |

## Findings

| ID | Sev | Status | Finding |
| --- | --- | --- | --- |
| L-SR1 | 2 | **Still open: fix did not work** | Enter on the heading does not confirm in Firefox either (see the Chrome record for the diagnosis). |
| FF-L1 | 2 | **Still open** | After Enter, `document.activeElement` is `<body>` (r1 and r2 identical), although the handler's first statement is `e.currentTarget.focus()` on a `tabindex=-1` heading. The next Tab did go to "Cancel", so Firefox keeps the sequential-focus start at the heading; a user relying on focus (not on Tab) is left with no focused element. This is also the best evidence that the heading's `onClick` is **not** the code that runs in Firefox (see the Chrome record's L-SR1 diagnosis). |
| L-SR2 | 2 | **Not reached** | Not exercised. |
| L-SR3, L-SR4, L-SR5, L-SR8, L-SR9 | 2, 2, 2, 1, 1 | **Not reached** | Firefox did not get to the review. Chrome shows L-SR3, L-SR4, L-SR5 fixed; the code is shared, so they probably are in Firefox, but not heard. |
| L-SR6 | 1 | **Does not apply** | Firefox reads the panel one cell at a time (heard). |
| L-SR7 | 1 | **Still open** | "Attack Kaido right arrow their Leader". |
| L-SR10 | 1 | **Not reached** | |
| L-SR11 | 2 | **Does not reproduce** | Firefox's Tab from the heading went to Cancel, then Confirm attack, as designed. Chrome's did not (see its record). |
| L-SR12 | 1 | **Confirmed** | `l` with focus in the coach: "no next list". |
| L-SR15 | 1 | **New** | On the first `L` NVDA read the coach as "Checking..." and only then the sentence "Lethal: proven …"; the panel is read before it has its result. Chrome read the result. |

**Firefox differences (no severity):** "button, sub Menu" for board cards where Chrome says "menu button, sub Menu"; the heading is spoken again after the failed Enter.

## Diagnosis of the "did not reach" notes

| Note | Harness or app | Evidence | Likely location |
| --- | --- | --- | --- |
| 2: Enter did not confirm (L-SR1) | **App**, cause undetermined | Focus went to `<body>` in Firefox although `onClick` focuses the heading first; so the click probably never reached that handler. The pointerdown hypothesis is contradicted here (details in the Chrome record). | `app/src/play/rail/Decision.tsx` ~108 to 119 |
| 2b | **Harness** | No key rows; the F15 step had already played the defence. | `app/a11y/src/l.ts` step 2b (`sawAi`) |
| 3: tier 3 with the coach tall | **Harness** | Rows 39 to 44: activeElement unchanged across Tabs, speech "Browser tabs, tool bar", "Open a new tab", "List all tabs"; no "keyboard focus left the page" note was written. `pageHasFocus()` uses `document.hasFocus()`, which Playwright's Firefox emulates as true. The Tab loop to the board (`toZone`) is what walked out. | `app/a11y/src/pass.ts` `pageHasFocus` / `until`; `l.ts` `pressL` and `toZone` |
| 4b: guided count with the coach tall | **Harness** (cascade of 3) | The coach was open at tier 1, with no "Count it with me", and keys were in the toolbar. | `l.ts` 4b/`toCoachControl`; `pass.ts` `until` |
| 7, 8, 9 | **Harness** (cascade of 6) | Step 6: after `page.goto`, Enter and ArrowDown ×8 with no speech and no menu, so the page did not have OS keyboard focus. `focusPage()` clicks with Playwright's `mouse.click`, which is not an OS click. 7 to 9 depend on 6's record. | `pass.ts` `focusPage`; `l.ts` `loadRecord` (~line 625) |

## Harness notes (not app findings)

1. **Replace `document.hasFocus()` as the "page has focus" test.** Use a keyboard canary: install a `keydown` listener on `window` before the step, press a harmless key (Shift), and check it arrived. Or stop a Tab loop when `document.activeElement` is unchanged after a press.
2. **Do not loop Tab out of the coach.** Use a recorded assist (`focus()` the control) instead of `toCoachControl`'s 16 Tab and 30 Shift+Tab presses; in Chrome those loops also left the page about ten times.
3. **Step 6's reload** needs real keyboard focus on the page in Firefox: for example press F6 until the canary fires, or navigate within the app (the Game menu's own route) instead of `goto`.
4. **Step 1** should read all of the panel lines in Firefox (it read seven; the gap and "What they could have" come after).
5. Step 2b and F3 as in the Chrome record.

## §11.4 coverage

| Step | Heard in Firefox? |
| --- | --- |
| F3 | Partly (Control+Home and Tab; the skip link not spoken) |
| 1 | Partly (power lines; not the gap or counters) |
| 2 | Yes (Enter-on-heading failed; rest via Tab) |
| F15 | Yes (no counterfactual) |
| 2b | Yes, as built |
| 3 | Tier 1 only |
| 4, 4b, 4c, 5, 6, 7, 8, 9 | **No** |

**Sufficient for the L pass: no.** Do not file this record as the Firefox L pass. Re-run after the harness fixes (notes 1 to 3); the app-side items that are still unverified in Firefox are L-SR2 to L-SR5, L-SR8 to L-SR10 and the whole of steps 4 to 9.
