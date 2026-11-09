# L screen-reader pass, first run: NVDA + Firefox

**Kind of pass:** scripted (Guidepup), not a human listening pass (accessibility.md §11.2, risk R9). First run of the §11.4 script (`app/a11y/src/l.ts`). The Chrome record is [l-nvda-chrome.md](l-nvda-chrome.md); finding numbers (L-SR) are shared by both, and FF-prefixed findings are Firefox-only.
**Result:** **PASS by the rule, but this run is mostly unusable as evidence.** No open severity 3 or 4 finding was found, but only F3, step 1, the spoken part of step 3 and half of step 5 were heard. Steps 2 to 2b and 4 to 4c were lost to the Enter problem (L-SR1, FF-L1), and **steps 6 to 9 (the whole review, Study, Practice) were not reached at all**: the keyboard focus had left the page, so the harness's keys went to Firefox's own toolbar. Nothing about the missed-lethal review has been heard in Firefox. Re-run after the harness fixes below.
**Date:** 2026-11-09.

## Versions

| Item | Version |
| --- | --- |
| NVDA | 2026.2 (Guidepup's portable build, default configuration; the log header says `NVDA_VERSION 2026.2`) |
| Browser | Firefox 157.0 (the harness reports "firefox 157.0"; Playwright's Firefox build, not a branded release) |
| Guidepup | `guidepup 0.38.0, @guidepup/playwright 0.21.0` |
| Windows image | GitHub Actions `windows-2025` (`win25-vs2026 20261103.298.1`) |
| App commit | `01c7e66` on `main` (the log header) |
| Workflow run | GitHub run 42649621521, artifact `a11y-nvda-42649621521`, file `app/a11y/results/nvda-firefox/l.md` (and `l.json`). The log is not committed |
| Speech source | The NVDA Remote speech tap (timestamped); Guidepup's per-key capture is off |

## How it ran

- Same scenario, seed and script as the Chrome run.
- **Harness assists:** step 3 pressed `L` again from the board three times (a false alarm: the coach was a strip, the keys were heard). Step 4b, 4c, 5: errors ("Tab did not reach"). Step 6: the harness focused the Game menu button, then "the Concede item was not reached".
- **Harness did not reach the intended state, from step 2 on:** Enter on the battle panel's heading did not commit the attack (L-SR1), and in Firefox it also dropped focus to the body (FF-L1). Steps 2 to 5 then ran with the attack unconfirmed, as in Chrome.
- **Steps 6 to 9 were lost to the harness.** At the end of step 5, 40 or so Tab and Shift+Tab presses had walked the keyboard focus out of the page into Firefox's own toolbar (the speech shows "Browser tabs, tool bar", "Sidebars, button", "Search or enter address, combo box"), while the page's `document.activeElement` still reported the same button. Step 6 then reloaded the page and pressed Enter and ArrowDown ×8 with focus on the Game menu button by script, not by the browser: no menu opened, no speech was heard, nothing moved. That is the harness (its reload does not give the page keyboard focus in Firefox), not the app: the same keys worked in Chrome. Steps 7, 8 and 9 are recorded "not reached".

## Steps

| # | Do | Result | What NVDA said (short) |
| --- | --- | --- | --- |
| F3 | Load; Control+Home; Tab | **Note** (F3 re-graded, see below) | Control+Home: "main landmark, same page, link, Skip to decision". Tab: "Your Main phase, region, Your Main phase, heading, clickable, level 2". Tab: "Decision actions … ⟲ Rewind, button, unavailable, U". Same as Chrome. |
| 1 | Attack with the Leader; `M`; read the battle panel | **Pass** (L-SR7) | Enter on the target: "Kaido 5000 against their Leader 5000. Result depends on When Attacking . Enter to attack, Escape to go back." `M`: "Attack Kaido right arrow their Leader, heading, clickable, level 2". Browse-next reads one cell at a time: "Attacker", "Kaido (your Leader)", "base", "5000", "Defender", "Their Leader", "no change" (Chrome runs these together, L-SR6). The panel's text carried power, defender, the gap and counters (the harness's own check). |
| 2 | Enter to confirm; Use; pick; Done | **Fail** (L-SR1, FF-L1) | Enter with focus on the heading: no speech, no live write, and focus moved to the body. Excerpt: `Enter` → Focus: body (no accessible node); Heard: (nothing); decision "main". The prompt, pick and Done were never reached (harness). |
| F15 | `.` after Done on your own effect | **Not reached** (harness) | "Before `.`: decision "main", focus body (no accessible node)"; "nothing to re-check". |
| 2b | `.` per AI move: Counter sentence, totals | **Not reached** (harness) | No AI move happened. **Note (not built):** the Counter sentence with new totals and the tie rule (DECISIONS 2026-11-09). |
| 3 | `L`, `L`, `L` | **Pass** (note, L-SR2) | `l`: "Lethal: proven, works against any hand." `l`: "You need 1 hit. You have 3 attackers." `l`: "You have lethal: 1 hit, and they can't stop any of them. Wins the game this turn." Further `L` presses repeat the third sentence (no live-region write recorded; the speech was heard). The ordered line was not reachable: coach strip (0 headings, 0 lists), because the decision panel was tall. |
| 4 | `C`; read the coach in browse mode | **Fail** (L-SR2) | `c` ×3: no speech, coach still "strip". Tab to the coach: "Coach, region, Coach sections, grouping, Lethal, toggle button, not pressed, L"; browse-next "button, collapsed, C, Open the coach (C)", "Your turn", "Game menu", "Fullscreen"; `Browse:Heading` "no next heading" ×2; `Browse:List` "no next list". Browse mode in an open coach was not exercised. |
| 4b | Count it with me | **Not reached** (harness) | "Tab did not reach "Count it with me"". |
| 4c | Count it with me: questions 2 to 4, Close | **Not reached** (harness) | "Tab did not reach Next". |
| 5 | Detector silent, then on | **Note** (half reached) | "Detector off, 3 s idle: 0 live-region writes (silent)": the silent half passes. The select was never reached. The Tab loop then left the page (see "How it ran"). **Note (not built):** "Coach alerts" and "Lethal available". |
| 6 | Reload on the planted record; concede; review; timeline; `N` | **Not reached** (harness) | The Game menu never opened; no speech. **Note (not built):** the timeline as a toolbar. |
| 7 | Enter on the flag; Study; `Q` | **Not reached** (harness) | **Note (not built):** focus to the explanation. |
| 8 | Practice this | **Not reached** (harness) | |
| 9 | Play the line | **Not reached** (harness) | **Note (not built):** "Declare no lethal". |

Pass: 2 (1, 3). Fail: 2 (2, 4). Note: 2 (F3, 5). Not reached: 8 (F15, 2b, 4b, 4c, 6, 7, 8, 9).

## Verdicts on the carried findings

| ID | Old sev | New sev | Verdict | Evidence |
| --- | --- | --- | --- | --- |
| F3 | 2 | **1** | **Re-graded: it is the test, not the skip link** | Control+Home speaks "main landmark, same page, link, Skip to decision": the browse cursor is on the link, so the next Tab goes past it to the heading. Firefox's Tab from the top of the page in step 5 shows the same shape (focus in the toolbar, then the page). Direct proof that the skip link is the first tab stop comes from the Chrome record (Tab from the toolbar reaches "Skip to decision, same page, link" first); the Firefox log does not show it speaking in the page, because keyboard focus was outside the page there. Not shown: Enter on the link moving focus. |
| F15 | 2 | **2 (unverified)** | **Still open, not re-checked** | Not reached (the game was never waiting on the AI; focus was on the body). No Firefox evidence either way. |

## New findings

L-SR1 to L-SR7 apply as stated in the Chrome record; this table lists only what this browser showed and the Firefox-only item.

| ID | Sev | Browsers | Steps | Finding | Spoken-log excerpt | App-side cause / suggested fix |
| --- | --- | --- | --- | --- | --- | --- |
| L-SR1 | 2 | Chrome, Firefox | 2 | Enter on the battle panel's heading, after the panel says "Enter to attack", does nothing and says nothing. | `Enter` (focus: heading "Attack · Kaido → their Leader") Heard: (nothing); live regions: (nothing); decision "main". | `Decision.tsx` heading `onClick` (NVDA's Enter clicks the heading; `Game.tsx`'s key handler never runs). See the Chrome record. |
| FF-L1 | 2 | Firefox only | 2 | In Firefox the same Enter also moves focus off the heading to the body, undoing the M3 FF2 fix described in `Decision.tsx` ("A click keeps focus on the heading"). The user has no focus, no speech and an unconfirmed attack; Tab from the body starts at the top of the page. In Chrome focus stayed on the heading. | `Enter` → Focus after: "body (no accessible node)"; Heard: (nothing). Next harness step: "Before `.`: decision "main", focus body (no accessible node)". | `app/src/play/rail/Decision.tsx` heading `onClick={(e) => e.currentTarget.focus()}`. In Firefox the focus() did not hold (the commit path or a re-render blurred it). Check after the L-SR1 fix: a heading click that commits or re-renders the panel must restore focus to the panel's first control. |
| L-SR2 | 2 | Chrome, Firefox | 3, 4 | `C` silent and the coach stuck as a strip while the battle panel is tall; `L` speaks only the one-line summary. | `c` ×3: Heard: (nothing); coach "strip". `l` ×3: tiers 1 to 3 sentences, no steps. Browse: "no next heading", "no next list". | `Game.tsx`, the coach key branch and `coachRoom` / `tall`. See the Chrome record. |
| L-SR3, L-SR4, L-SR5, L-SR8, L-SR9 | 2, 2, 2, 1, 1 | Firefox **not reached** | 6 to 9 | The review, Study and Practice findings were seen in Chrome only. They sit in browser-independent code (`ReviewFlow.tsx`, `Game.tsx`), so they probably affect Firefox, but this run neither shows nor rules that out. | | |
| L-SR7 | 1 | Chrome, Firefox | 1 | The heading and log speak "→" as "right arrow". | "Attack Kaido right arrow their Leader, heading, clickable, level 2". | See the Chrome record. |
| F3 | 1 | Chrome, Firefox | F3 | Re-graded, see above. | | |
| F15 | 2 | not re-checked | F15 | Carried, unverified. | | |

**Firefox differences seen (no severity):** Firefox reads the battle panel one cell per Browse:Next (better than Chrome's run-on lines); it says "button, sub Menu" for the board cards where Chrome says "menu button, sub Menu"; `L` after tier 3 repeats the sentence where Chrome is silent.

**Not built (no severity, from DECISIONS "2026-11-09 — L screen-reader script built …" and STATUS "Not done"):** the Counter sentence with totals and the tie rule; "Coach alerts" and "Lethal available"; the timeline as a toolbar; focus to the explanation when Study opens; "Declare no lethal"; the guided count's board sandbox; the Hint, DON!! math and Tempo sections.

## Harness notes (not app findings)

1. **Enter on the panel heading** (as in the Chrome record): the script should Tab to "Confirm attack", or press Enter on the target card.
2. **Tab loops that run out of the page.** 4b, 4c and 5 each walk Tab ×16 and Shift+Tab ×30 looking for a coach control that is not there. In Firefox this ended with keyboard focus in the browser's own toolbar while the page's activeElement was stale. The loop should stop when the page's skip link is passed twice, and each step should `page.bringToFront()` and click the document body before it starts.
3. **Step 6 reload.** After `page.goto` the harness's `focus()` call moves the DOM focus but not the keyboard focus in Firefox. Press a key on the page (or click the body) after the reload before the first Enter.
4. Because of 2 and 3, Firefox has no heard evidence for the review, Study, Practice or the puzzle. The guided count and the detector's "on" half have not been heard in either browser.
