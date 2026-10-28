# Wireframe notes

**As of:** 2026-10-28 (Phase 4 wireframe pass, revised after review 1)

## How to use

- Open `index.html`. Every screen links from there, and each state has its own URL hash (for example `05-defend.html#tie`).
- On any screen, press <kbd>`</kbd> (backtick) to show the wireframe state switcher. It is not product UI.
- Board geometry is copied from `board.md` §3.1 (1280×720, compact) and §3.2 (1920×1080, roomy) in `wf.js`.
- No card image or Bandai art is used anywhere. Card art is a labelled "art" placeholder inside the art-window frame (`card-face-study.md`, treatment C). The full-scan look (treatment A) is a CSS placeholder with a drawn "SAMPLE" band: see `03-main.html#scan` and the preview dock.
- Card names, costs, powers and counters come from optcgapi for cards in the Rocks (OP17-039) and Kaido (OP17-058) lists. Minus signs are restored. Coach, review and drill copy is verbatim from `explanations.md` (E01, E02, E05, E06, E09, E11, E12, E15, E19, E20).
- Screenshots: `node .cache/wireframes/shoot.mjs [filter] [--no-axe] [--only=1280]` writes `shots/<screen>--<state>-<width>.png` (gitignored) and runs axe-core (WCAG 2.0 to 2.2 A and AA tags) on every state, plus `17-phone` at 390×844, 844×390 and 820×1180. After review 1: 201 runs, 0 violations.
- Measurements for review 1: `node .cache/wireframes/measure.mjs` (decision and coach body fit, minimum rendered text, Tab stops to End turn, focus never obscured, DON!! numeral sizes, the rail notice). Results go to `.cache/wireframes/measure.json`.
- Keyboard (board screens): one Tab stop per zone with arrow keys inside it; the first stop is "Skip to decision". `P` jumps to the decision, `G` then a letter goes to a zone (Shift = opponent's), `A` attacks with the focused card, `+` opens Give DON!!, `E` ends the turn, `U` rewinds, `S` skips. Actions that would change state show a toast instead, because the wireframes have no engine.
- The rail has three states, set per screen: normal, `decisionTall` (defence, Trigger, attack confirm) and coach `tall` (lethal tier 3, guided count). Every board screen carries the rail notice (disclaimer) under the rail header.
- Review: `11b-review.html` is Overview, `11c-study.html` is Study, and both read `review-data.js`.

## Spec conflicts: all 22 resolved

`review-1.md` §3 ruled on all 22 conflicts the first pass found. Each ruling is applied in the losing document, and the wireframes follow it. The Disposition column in `review-1.md` gives the files and sections.

| # | Conflict | Resolved as |
|---|---|---|
| 1 | Decision bar vs decision panel | Decision panel (`board.md` §3.9) everywhere; turn and phase in the midline band |
| 2 | Choice tray vs decision panel | Decision panel, with candidates lit on the board; hidden-zone candidates use a reveal tray docked over the log |
| 3 | Tab-order table | `accessibility.md` §3.1 rewritten to the `board.md` arrangement, with the decision panel straight after the hand. Wired in `wf.js`: 11 Tabs to End turn |
| 4 | Coach reflow | Docked in the rail; never resizes the board |
| 5 | Log height when the coach is open | `board.md` §3.13 states; "tall" only on a player request |
| 6 | Legal ring: solid or dashed | Solid ring plus glyph; forced-colours rule added |
| 7 | Focus offset | 4 px, outside the legal ring; stacked values in `visual-system.md` §4 |
| 8 | Take the hit key | No single key |
| 9 | Trigger keys | Arrows and Enter, focus on Activate |
| 10 | Rewind keys | U and Shift+U; Ctrl/Cmd+Z as an alias only |
| 11 | Speed options | Step · 0.5× · 1× · 2× · 4×, plus "Always skip to my decisions" |
| 12 | AI pacing | `board.md` §5.2: dwell ≥ 400 ms on plays, ≥ 600 ms on attacks and results. Warlord runs about 1.2 s over 8 s (owner, OQ-4) |
| 13 | Drill timer | Untimed · 50% · 100% · 200% · 400% · 1000% |
| 14 | Phones | Phones keep the honest screen; portrait tablets get a stacked board (specified, not wireframed) |
| 15 | Disclaimer on the board | Visible two-line rail notice whose name is the full disclaimer. **The owner confirms the form** (`board.md` OQ-6) |
| 16 | Defence planner vs body height | "Decision tall": body 420 px at 1280 and 748 px at 1920; never scrolls. The old note that the body scrolls is withdrawn |
| 17 | Counter commit label | "Counter +3000 · survive"; two commit buttons in every defence |
| 18 | Battle stepper | Midline only; Refresh, Draw, DON!! and End hidden during a battle |
| 19 | Inspector | The pinned, focusable preview dock |
| 20 | Mulligan placement | `board.md` §3.14 |
| 21 | Review board size | Overview plus Study at native size (`11b`, `11c`); no text under 12 px |
| 22 | RPS keys | Decision-scoped keys rule and context-key table (`accessibility.md` §3.15) |

## Placeholders and gaps

- Automation counts ("50 of 50 cards automated", "46 of 51") and AI turn times on the setup screen are illustrative; no engine exists yet.
- These are not wireframed:
  - the tablet layouts (1180×740, 1024×690, and the portrait stacked variant). `wf.js` renders only the two fixed geometries, and M3 ports the layout script for the others (UX-R17, deferred);
  - short-height mode (1280×600);
  - tutorial step T8 (specified in `flows.md` F2);
  - the light theme;
  - hotseat curtains;
  - the concede dialog;
  - the shortcut sheet;
  - the rules reference content.
- Card-face sign-off: the placeholder pair is `shots/03-main--idle-1280.png` (art window) and `shots/03-main--scan-1280.png` (full scan). Placeholder art can't show crop failures, so `card-face-study.md` §5 now asks for the sign-off on a local page using cached real scans, which are never committed.
