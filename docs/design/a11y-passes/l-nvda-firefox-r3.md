# L screen-reader pass, third run: NVDA + Firefox

**Kind of pass:** scripted (Guidepup), not a human listening pass (accessibility.md §11.2, risk R9). Third run of the §11.4 script after fix round 2 (commit `cd54d0c`). Earlier runs: [l-nvda-firefox.md](l-nvda-firefox.md), [l-nvda-firefox-r2.md](l-nvda-firefox-r2.md). Chrome: [l-nvda-chrome-r3.md](l-nvda-chrome-r3.md). Finding numbers are shared.
**Result:** **INCOMPLETE, and not a screen-reader result at all.** **The speech tap recorded zero NVDA phrases in the whole run** (0 of 167 key presses; Chrome's run on the same code has 201 of 232). The log header still says the tap "joined the NVDA Remote relay", so nothing flagged it. Every "Heard" cell is empty; what the record holds is the page's side (focus, DOM, live-region writes), which is valid app evidence but says nothing about what NVDA said or did. No severity 3 or 4 was found at DOM level, but **no §11.4 step, F3 or F15 was heard in Firefox**. Step 6 ended in an error (a harness fault), so steps 7 to 10 did not run. Coverage: **none heard**. A fourth Firefox run is needed after the harness fixes below.
**Date:** 2026-11-09.

## Versions

| Item | Version |
| --- | --- |
| NVDA | 2026.2 (Guidepup's portable build, default configuration; the log header says `NVDA_VERSION 2026.2`) |
| Browser | Firefox 157.0 (the harness reports "firefox 157.0"; Playwright's Firefox build) |
| Guidepup | `guidepup 0.38.0, @guidepup/playwright 0.21.0` |
| Windows image | GitHub Actions `windows-2025` (`win25-vs2026 20261103.298.1`) |
| App commit | `cd54d0c` on `main` (the log header) |
| Workflow run | GitHub run 42668723191, file `app/a11y/results/nvda-firefox/l.md` (and `l.json`). The log is not committed |
| Speech source | The NVDA Remote speech tap, which **heard nothing** this run. Guidepup's per-key capture is off whenever the tap joins (`reader.ts` 65: `capture = !this.tapOk`), so there is no second source either |

## How it ran, and why it is not an NVDA run

- Keys did reach the page (focus, DOM and live regions respond), so OS key injection worked. But **NVDA said nothing for any of them**, from the very first: Control+Home (r2 and Chrome r3: "main landmark, same page, link, Skip to decision") produced no speech and left focus on `<body>`. Enter on the page then did nothing.
- The key behaviour matches **no screen reader intercepting the keys**: Enter on the heading arrived as a real `keydown` (in Chrome, NVDA turns it into a mouse click and no `keydown` exists); `C` and `L` from the board acted as plain page keys. The most likely cause is that NVDA never attached to the Firefox document (Firefox starts its accessibility engine only when a client asks; r2 had it, this run did not), or NVDA was muted. The log cannot tell which, and that is a harness gap: `tap.ts` registers no `close` or `end` handler (lines 34 to 36 only `error`), `tapOk` stays true, and nothing checks that any phrase arrived.
- Treat every row below as "page state", not "heard". The §11.4 coverage table at the end says "not heard" for every step.

## What the event traces show

| Probe | Firefox r3 | Reading |
| --- | --- | --- |
| Enter on the focused heading | `keydown Enter` on `h2#decision-title`, then `click` on `button#confirm-attack` ("script-made", `detail=0`), `focusout` from the heading, `focusin` on `button#use-btn`. | A plain key reaching the page, which the app's own handler turns into the confirm (`Game.tsx` 723 to 728: Enter off a button and outside the board clicks the primary, here `confirm-attack`). It **is not what NVDA delivers**: NVDA was silent. It does show, without a screen reader, that Enter on the heading confirms, so the probe's "the heading does not commit" assumption (`l.ts` 235 to 250) is true only where NVDA converts Enter into a click (Chrome). The best evidence for NVDA + Firefox remains r2: speech re-reading the heading, focus on `<body>`, no commit (a click that never reached the app's handler). |
| Tab "from the heading" | `keydown Tab` on `button#use-btn`, then `focusout` to a `div`. | Not a test of L-SR11: the probe's Enter had already committed the attack, so Tab started from "Use". |
| Enter on "Confirm attack" (script step) | `keydown Enter` on `h2#decision-title`, then a script-made `click` on `button#use-btn`. | Again the page's own Enter handler, from a heading (after `M` focused "Optional effect"). Not NVDA. |

**Settled by r3 for Firefox: nothing about NVDA.** What r3 does settle at the page level in Firefox: after Enter on a board target, focus lands on `button#confirm-attack` with the sentence as its description ("Confirm attack , 5000 vs 5000" and "Kaido 5000 against their Leader 5000 ... Enter to attack, Escape to go back."), not on `<body>`: the structural L-SR1 fix works in Firefox's DOM. Whether NVDA speaks it in Firefox is unknown.

## Steps

All "Heard" values are empty. Results are therefore **Not heard**, with the page-level observation beside them.

| # | Do | Result | Page-level observation (not speech) |
| --- | --- | --- | --- |
| F3 | Load; Control+Home; Enter on the skip link | **Not heard** (harness: "did not reach the decision panel", `l.ts` 169) | Control+Home: focus `<body>`; Enter: focus still `<body>`, not in the decision panel. No NVDA virtual cursor, so there was no link under it. Chrome's run of the same code reached the panel. |
| 1 | Attack; `M`; read the panel | **Not heard** | Enter on the target: focus `Confirm attack , 5000 vs 5000`, description present. The panel text carries all four facts. 14 `Browse:Next` presses changed nothing and said nothing. The Shift+Tab walk (11 rows) from `<body>` ran the whole page backwards from the disclaimer: the sequential-focus start was the page end because the skip link was never activated. |
| 2 | Confirm; Use; pick; Done | **Not heard** (harness: "did not reach the Use prompt and the pick", L-SR11 note) | The probe's Enter committed the attack (see the trace); the rest ran by the page's own Enter handling: Use, "Choose", X.Drake "pressed", "Done , 1 of 1", the order decision. Live regions: "You: Kaido attacks their Leader ...", "You: Return 1 DON!! to the DON!! deck.", "You: X.Drake −2000." |
| F15 | `.` after Done | **Not heard** | `.` moved the game: "Rocks.D.Xebec: Counter: Yamato +1000. You: Attack fails · 5000 vs 8000." Focus after: the new "Your turn" heading. Same missing counterfactual as Chrome. |
| 2b | AI defends | **Not heard** (no longer mislabelled) | Counters and result in the live regions. |
| 3 | `L` ×3, then a fourth | **Not heard** | Live writes: tier 1, tier 2, tier 3, "That is everything the coach has for this turn. ...". Coach mode "tall"; one ordered list, one heading. Focus in the coach after each `l`; four board-return assists as in Chrome. |
| 4 | `C`; browse the coach | **Not heard** | Coach strip, then tall; `C` does not move focus. All browse rows silent. |
| 4b, 4c | Guided count | **Not heard** | Live writes: "Count it with me. Question 1 ...", "Hits: not quite. ...", "Hits: right. 0 Life, plus 1.", "Question 2 ... 3 ... 4", the three "right" lines. Close returns to "group Lethal", not the decision heading. Four "Tab did not reach it quickly" assists (same order problem as Chrome, L-SR18). |
| 5 | Detector | **Not heard** | 0 live writes at rest; after `+` and Enter: "You: Give 1 DON!! to Kaido. You need 1 hit. You have 2 attackers." |
| 5b | `C` and `L` with the battle panel up | **Not heard** | Live writes as designed ("The coach opens when this decision is done. ...", the `L` lines with the numbered-line sentence, then silent). |
| 6 | Reload; concede; review | **Not heard; Error** | `locator.waitFor` timeout on `#decision[data-kind="over"]` (`l.ts` 791). Diagnosis below. |
| 7, 8, 9, 10 | Study; Practice; the puzzle; Play from here | **Not reached** | Cascade from step 6. |

Not heard: 15 (F3 to 5b, 6 as error). Not reached: 4 (7 to 10).

## Findings

Findings from the Chrome record apply where the code is shared; **none could be heard in Firefox**.

| ID | Sev | Status | Note |
| --- | --- | --- | --- |
| L-SR1 | 2 | **Changed (DOM only)** | Focus lands on Confirm attack in Firefox's DOM. Whether NVDA + Firefox speaks it is unknown. |
| FF-L1 | 2 | **Not reached** | Focus on `<body>` after NVDA's Enter on the heading was r1 and r2's finding; the trace here is a no-NVDA key and shows nothing about it. Structurally moot now (no step needs Enter on the heading), but a user who presses Enter on a heading in Firefox is unmeasured. |
| L-SR2 | 2 | **Not reached** | The lines were written (live regions) but not heard. |
| L-SR3, L-SR4, L-SR5, L-SR8, L-SR9, L-SR10 | 2, 2, 2, 1, 1, 1 | **Not reached** | L-SR10's line was written; the review and puzzle steps did not run. |
| L-SR6 | 1 | **Does not apply** (r2) | Firefox read the panel cell by cell in r2. |
| L-SR7 | 1 | **Not reached** | The arrow text is shared code; not heard. |
| L-SR11 | 2 | **Not reached** | The probe never tested it (the Enter had committed the attack). |
| L-SR12 | 1 | **Not reached** | |
| L-SR13 | 1 | **Not reached** | The grading text is the same code as Chrome; not heard. |
| L-SR14, L-SR16 to L-SR23 | | **Not reached** | Same code; see the Chrome record. L-SR16 (focus into the coach on every `L`) is visible in the page state: focus is "group Lethal" after each `l`. |
| L-SR15 | 1 | **Not reached** | The "Checking..." read-before-result (r2) was not heard. |
| F3 | 1 | **Not reached** | Chrome: fixed (heard). |
| F15 | 1 | **Not reached** | Not heard; the page state is the same as Chrome's. |
| L-SR24 | 1 | **New (harness)** | The speech tap can report "joined" and then hear nothing, and the run carries on (see "Harness"). Not an app finding; recorded here so the next run cannot repeat it. |

## Diagnosis of the "did not reach" notes

| Note | Harness or app | Evidence | Location |
| --- | --- | --- | --- |
| F3: the decision panel after Enter on the skip link | **Harness / environment** (NVDA silent) | No speech for Control+Home, focus `<body>`, Enter did nothing. The same code reached the panel in Chrome (focus on "Your Main phase"), so the skip link and its target work. The step has no check that the NVDA cursor is on the link before pressing Enter. | `app/a11y/src/l.ts` 150 to 169 (F3); cause upstream (no NVDA speech) |
| L-SR11: Tab from the attack heading landing on Cancel or Confirm attack | **Harness** | The probe's Enter on the heading committed the attack (trace: `keydown Enter` on `h2`, then a script-made click on `#confirm-attack`, focus to `#use-btn`). The following Tab therefore started from "Use". The probe assumes Enter on the heading never commits, which is true only when NVDA converts it into a click (Chrome) and is not true for a plain key (`Game.tsx` 723 to 728, by design: Enter commits a safe primary). | `l.ts` 235 to 256 |
| The Use prompt and the pick (an [When Attacking] decision) | **Harness** (cascade of the one above) | `picked` is set only when the decision is "optional" at that moment (`l.ts` 272 to 276). After the probe the Use prompt had passed: `M` focused the "Optional effect" heading and the next Enter (the page's Enter handler on a heading, trace) clicked Use, so the decision was already "choose". The pick and Done did happen (Pick note, rows 4 to 9). | `l.ts` 262 to 282 |
| 7, 8, 9, 10 | **Harness** (cascade of 6) | Step 6 timed out waiting for the game-over panel: the Concede button was never pressed. | below |
| Step 6 (error) | **Harness** | `loadRecord` sends `until('Tab', name === 'Concede', 6)` (`l.ts` 785) from "Keep playing". In the dialog "Concede" comes **before** "Keep playing" (`Dialogs.tsx` 52 to 66), and the dialog is a native modal (`showModal`, `Dialogs.tsx` 114), so Tab from the last control leaves the page for the browser (also in Chrome, which recovered). The canary was silent after the Tab, F6 ×4 did not bring the keys back (`pass.ts` `focusPage`, 327 to 338; "Keyboard focus could not be given to the page"), the assist focused the Concede button by script and the Enter went to the toolbar. No NVDA speech was available to notice. Rows 1 to 6 show the menu worked (Game menu, "Concede…", the dialog). | `l.ts` 785 to 791; `pass.ts` 327 to 338 |

## Harness fixes before a fourth run

1. **Fail fast when the tap hears nothing.** After the first key of the first step, if the tap has recorded no phrase (and again at the end of each step), abort with a clear error and re-enable Guidepup's per-key capture as a fallback (`reader.ts` 63 to 66). Add `close` and `end` handlers to `tap.ts` and a reconnect, and write the phrase count in the record's header.
2. **Find out why NVDA was mute in Firefox.** Log NVDA's own state at the start (browse mode on, speech mode, whether Firefox exposed its accessibility tree: for example `nvda.lastSpokenPhrase()` after Control+Home), and keep `nvda.spokenPhraseLog()` in the record. Check the Firefox profile or `accessibility.force_disabled` in the Playwright launch, and that the workflow starts NVDA before Firefox, as in r2.
3. **Probe (l.ts 235 to 256):** record what happened but do not assume the Enter leaves the attack open; if it committed, rewind (or reload the scenario) before the user path.
4. **Step 6 (l.ts 785):** Shift+Tab, not Tab, from "Keep playing"; or press Enter on the Concede item's dialog by moving to the first control.
5. F3 (l.ts 169): require the NVDA cursor on the skip link (speech heard) before Enter, or mark the step "not heard".

## §11.4 coverage

| Step | Heard in Firefox? |
| --- | --- |
| F3 | No |
| 1 | No |
| 2 | No |
| F15 | No |
| 2b | No |
| 3 | No |
| 4, 4b, 4c | No |
| 5, 5b | No |
| 6, 7, 8, 9, 10 | No (6 ended in an error; 7 to 10 did not run) |

**Sufficient for the L pass: no.** Heard Firefox evidence still on file is r2's (F3, 1, 2, F15, 2b and tier 1 of 3). The page-level data here is useful (the structural L-SR1 fix works in Firefox's DOM; the app's shared code behaves the same as in Chrome), but the Firefox-specific questions (FF-L1, L-SR15, NVDA's Enter on a heading, the review and Practice focus in Firefox) are open.
