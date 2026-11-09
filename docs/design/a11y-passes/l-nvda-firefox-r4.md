# L screen-reader pass, fourth run: NVDA + Firefox

**Kind of pass:** scripted (Guidepup). Fourth run of the §11.4 script after fix round 3 (commit `26b5c99`). Earlier runs: [l-nvda-firefox.md](l-nvda-firefox.md), [l-nvda-firefox-r2.md](l-nvda-firefox-r2.md), [l-nvda-firefox-r3.md](l-nvda-firefox-r3.md). Chrome: [l-nvda-chrome-r4.md](l-nvda-chrome-r4.md).
**Result:** **INVALID RUN. Not a screen-reader result, and no step is judged from it.** The Firefox record for this round follows from the Firefox-only rerun, GitHub run 42678583126, (recorded separately).
**Date:** 2026-11-09.

## Why it is invalid

Run 42676731643, app commit `26b5c99`, NVDA 2026.2, `firefox 157.0`, Guidepup 0.38.0 / @guidepup/playwright 0.21.0, `windows-2025` image `win25-vs2026 20261103.298.1`. The log (`app/a11y/results/nvda-firefox/l.md`, not committed) opens with the harness's own verdict (the speech probe added in round 3 doing its job):

> **INVALID RUN.** SPEECH TAP DEAD: a known phrase ("Speech probe ...") was written to a live region three times and the speech tap heard no NVDA speech. NVDA is mute, not attached to this browser, or the tap is not delivering. This record is INVALID as a screen-reader result: its focus and live-region rows are page state only.

The JSON notes add: "Speech tap: joined the NVDA Remote relay but did NOT pass the speech probe: Guidepup per-key capture stayed on." and "Speech tap phrases heard: 4." Nothing was heard for any step. This is the same failure as r3 (the tap joins, then hears nothing in Firefox), now caught at the start instead of after the whole run, which is what the round 3 harness change was for. It is a harness or environment fault; it says nothing about the app.

## What this run does and does not give

- Nothing about what NVDA said in Firefox: FF-L1, L-SR15 and every Firefox half of the fixes in round 3 are **Not reached** here.
- Chrome, on the same commit and the same job, passed its probe and has a full record: see [l-nvda-chrome-r4.md](l-nvda-chrome-r4.md).
- Unresolved harness question for the rerun's analyst: the tap works in Chrome and is dead in Firefox in the same job, in r3 and r4. If run 42678583126 hears speech, the cause was run-order or process related; if not, Firefox needs a different speech source.
