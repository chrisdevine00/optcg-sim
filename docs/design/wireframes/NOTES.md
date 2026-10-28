# Wireframe notes

**As of:** 2026-10-28 (Phase 4 wireframe pass)

## How to use

- Open `index.html`. Every screen links from there, and each state has its own URL hash (for example `05-defend.html#tie`).
- On any screen, press <kbd>`</kbd> (backtick) to show the wireframe state switcher. It is not product UI.
- Board geometry is copied from `board.md` §3.1 (1280×720, compact) and §3.2 (1920×1080, roomy) in `wf.js`.
- No card image or Bandai art is used anywhere. Card art is a labelled "art" placeholder inside the art-window frame (`card-face-study.md`, treatment C). The full-scan look (treatment A) is a CSS placeholder with a drawn "SAMPLE" band: see `03-main.html#scan` and the preview dock.
- Card names, costs, powers and counters come from optcgapi for cards in the Rocks (OP17-039) and Kaido (OP17-058) lists. Minus signs are restored. Coach, review and drill copy is verbatim from `explanations.md` (E01, E02, E05, E06, E09, E11, E12, E15, E19, E20).
- Screenshots: `node .cache/wireframes/shoot.mjs [filter] [--no-axe] [--only=1280]` writes `shots/<screen>--<state>-<width>.png` (gitignored) and runs axe-core (WCAG 2.0 to 2.2 A and AA tags) on every state.

## Spec conflicts found

Layout follows `board.md` and behaviour follows `flows.md`, as briefed. Keyboard follows `accessibility.md` where that file claims keyboard authority. Each of these needs a fix in the losing document.

1. **Decision bar vs decision panel.** `flows.md` G1, F3 and F4 describe a "decision bar", a fixed strip holding the commit button. `board.md` §3.9 puts the decision and its primary button in the rail's decision panel. *Built:* the decision panel.
2. **Choice tray vs decision panel.** In `flows.md` F8, effect choices use a "choice tray" anchored to the card. In `board.md` §3.9, effect choice lives in the decision panel. *Built:* candidates are lit on the board and the count and commit are in the decision panel (`07-effect-choice`).
3. **Board arrangement in the accessibility tab order.** `accessibility.md` §3.1 assumes the opponent is rotated 180°, a top "game status bar" and a "centre lane" holding the prompt bar and battle panel. `board.md` mirrors vertically, uses the midline band and docks the battle panel in the rail. *Built:* `board.md`. The §3.1 tab table needs redoing.
4. **Coach reflow.** `accessibility.md` §4.2 says the coach column "resizes the board". `board.md` §3.13 says the board never reflows. *Built:* no reflow; the coach takes height from the log.
5. **Log height when the coach is open.** `learning-ui.md` §2.1 says the log collapses to 3 lines. `board.md` §3.13 gives the log 148 px (5 or more lines) in the "open" state and a 3-line ticker only in "tall". *Built:* both states per `board.md` (`09-coach#tier1` is open, `#tier3` is tall).
6. **Legal-target ring.** `board.md` §2.5 and `visual-system.md` specify a solid 3 px ring. `accessibility.md` §4.1 and §6.1 specify a dashed outline. *Built:* solid ring plus the corner glyph. Focus is a separate two-tone ring outside it.
7. **Focus ring offset.** `accessibility.md` §4.1 says 2 px; `board.md` and `visual-system.md` say 4 px. *Built:* 4 px.
8. **Take the hit key.** `flows.md` F6 binds T to "take the hit". `accessibility.md` §3.10 forbids it. *Built:* no key on Take the hit.
9. **Trigger keys.** `flows.md` F6.8 uses A and H; H is also Hint (`flows.md` Q6 and `accessibility.md`). *Built:* two buttons with no single-key hints.
10. **Rewind keys.** `flows.md` F11 uses Ctrl/Cmd+Z and Alt+Z; `accessibility.md` §3.12 uses U and Shift+U. *Built:* U.
11. **Speed options.**
    - `board.md` §5.3: 0.5×, 1×, 2×, 4×, plus a step mode.
    - `flows.md` G6 and F20 add "Instant".
    - `accessibility.md` §3.13: Step, 0.5×, 1×, 2×, Instant (no 4×).

    *Built:* `board.md`.
12. **AI pacing numbers.** `flows.md` F21 sets 500 + 300 ms per play and shows "thinking" after 400 ms idle. `board.md` §5.2 sets 600 ms per move and 300 ms. *Built:* `board.md`'s 300 ms in the copy.
13. **Drill timer range.** `learning-ui.md` §7.2 gives 50%–300% of base time; `accessibility.md` §8 gives 1×, 2×, 4× or 10×. *Built:* the `learning-ui.md` copy.
14. **Phones.** `accessibility.md` PD-5/R5 wants "Continue in portrait" with a scaled board (WCAG 1.3.4). `board.md` §6.4/PD-5 gives phones an honest "The board needs a bigger screen" and no board. *Built:* `board.md` (`17-phone`, `17-narrow`). The WCAG 1.3.4 risk stays open.
15. **Disclaimer on every page vs the board budget.** PROMPT requires the disclaimer in every page footer. `board.md` uses the full 720 px height with no footer. *Built:* every non-board page has the full footer. Board screens carry "Unofficial fan tool ⓘ" in the rail header, with the full text as its tooltip and accessible name. **Needs an owner decision.**
16. **Defence planner vs decision-panel height.** `flows.md` F6 wants the battle maths plus three lanes. `board.md` gives the body 148 px at 1280. They do not fit. *Built:*
    - At 1280: attacker and defender rows, the result line, and the "When attacked" and Block lanes. The Counter lane is carried by the lit and staged hand cards and the defender breakdown, and the body scrolls.
    - At 1920: all three lanes fit.

    This is a layout risk for the owner review.
17. **Primary label for a counter commit.** `board.md`: "Counter +2000 · survive". `flows.md`: "Stop it: play Rocks Pirates + Buckin". `accessibility.md`: "Play 2 counters". *Built:* the `board.md` label, with the `flows.md` consequence as the sub-label.
18. **Battle stepper width.** `board.md` §3.8 expands Main into the battle sub-steps inside the 520 px centre. The full Refresh…End stepper plus the sub-steps does not fit at 14 px. *Built:* "Main › Battle: Attack › Block › Counter › Damage" during battles.
19. **Inspector placement.**
    - `flows.md` G1: an "Inspector" large view.
    - `accessibility.md` §4.2: a side panel.
    - `board.md`: defines only the preview dock and the trash viewer.

    *Built:* a dialog over the rail with a rail-only scrim, matching the trash viewer (`10-inspector#inspect`).
20. **Mulligan placement.** `flows.md` F3c says the cards "fan out large in the centre"; `board.md` is silent. *Built:* the cards fan over your empty Character row, with Keep and Redraw in the decision panel.
21. **Review board size.** `learning-ui.md` §4.1 calls the restored board "large". At 1280 it fits only at about 0.53 scale, below the 12 px text floor. *Built:* a scaled viewer with a "Full size" button.
22. **RPS keys.** R, P and S (`flows.md` F3b) collide with the board keys R (rewind list), P (current decision) and S (skip) in `accessibility.md`. They are tray-scoped, but this should be stated.

## Placeholders and gaps

- Automation counts ("50 of 50 cards automated", "46 of 51") and AI turn times on the setup screen are illustrative; no engine exists yet.
- These are not wireframed:
  - the tablet layouts (1180×740 and 1024×690);
  - short-height mode (1280×600);
  - the light theme;
  - hotseat curtains;
  - the concede dialog;
  - the shortcut sheet;
  - the rules reference content.
- The card-face sign-off pair asked for in `card-face-study.md` §5 is `shots/03-main--idle-1280.png` (art window) and `shots/03-main--scan-1280.png` (full scan).
