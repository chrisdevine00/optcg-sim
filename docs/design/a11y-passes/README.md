# Screen-reader pass records

Manual screen-reader passes (accessibility.md §11.2). One record per milestone, reader and browser:
`<milestone>-<reader>-<browser>.md`. Each holds the versions, every step's result (pass, fail or
note), the spoken-log excerpt for each failure, and findings with severity 0–4. Severity 3 and 4
block the milestone.

| Record | Reader | How it was run |
| --- | --- | --- |
| [m3-nvda-chrome.md](m3-nvda-chrome.md) | NVDA + Chrome | Scripted (Guidepup), run 40866547375: **FAIL** (1 severity 3) |
| [m3-nvda-firefox.md](m3-nvda-firefox.md) | NVDA + Firefox | Scripted (Guidepup), run 40866547375: **FAIL** (2 severity 3) |
| m3-voiceover-safari.md | VoiceOver + Safari | Owed: the owner's passes, below |
| [l-nvda-chrome.md](l-nvda-chrome.md) | NVDA + Chrome | Scripted (Guidepup), run 42649621521: **PASS** by the rule (no severity 3 or 4; 5 at severity 2), but steps 4b, 4c, 5 and the AI defence were not reached (harness) |
| [l-nvda-firefox.md](l-nvda-firefox.md) | NVDA + Firefox | Scripted (Guidepup), run 42649621521: **PASS** by the rule, but only steps F3, 1 and 3 were heard; steps 6 to 9 not reached (harness). Re-run needed |
| [l-nvda-chrome-r2.md](l-nvda-chrome-r2.md) | NVDA + Chrome | Scripted (Guidepup), run 42659930386, after fix round 1: **PASS** by the rule (no severity 3 or 4; L-SR1 not fixed, L-SR11 new); every step heard; coverage sufficient, with L-SR2 and L-SR10 unverified |
| [l-nvda-firefox-r2.md](l-nvda-firefox-r2.md) | NVDA + Firefox | Scripted (Guidepup), run 42659930386: **INCOMPLETE** (no severity 3 or 4, but steps 4 to 9 not heard; the focus guard does not work in Firefox, harness). Re-run needed |
| [l-nvda-chrome-r3.md](l-nvda-chrome-r3.md) | NVDA + Chrome | Scripted (Guidepup), run 42668723191, after fix round 2: **PASS** by the rule (no severity 3 or 4; L-SR1, L-SR2, L-SR10, F3 fixed and heard; new at severity 2: L-SR16, L-SR20, L-SR21); every step heard, coverage sufficient |
| [l-nvda-firefox-r3.md](l-nvda-firefox-r3.md) | NVDA + Firefox | Scripted (Guidepup), run 42668723191: **INCOMPLETE** (the speech tap heard nothing at all, so no step was heard; step 6 harness error, 7 to 10 not run). Re-run needed after the harness fixes |
| [l-nvda-chrome-r4.md](l-nvda-chrome-r4.md) | NVDA + Chrome | Scripted (Guidepup), run 42676731643, after fix round 3: **PASS** by the rule (no severity 3 or 4, none open at 2); L-SR16, L-SR20, L-SR21, L-SR22, L-SR23 fixed and heard; three new at severity 1 (L-SR25 to L-SR27); every step heard, coverage sufficient |
| [l-nvda-firefox-r4.md](l-nvda-firefox-r4.md) | NVDA + Firefox | Run 42676731643: **INVALID** (speech tap dead, caught by the new probe; no step judged). Record follows from the Firefox-only run 42678583126 |
| [l-nvda-firefox-r5.md](l-nvda-firefox-r5.md) | NVDA + Firefox | Scripted (Guidepup), Firefox-only run 42678583126, after fix round 3: **PASS** by the rule (no severity 3 or 4, none open at 2); every step heard, coverage sufficient; FF-L1 not reproduced, L-SR15 fixed; L-SR25 (Concede lines unspoken) reproduces in Firefox, held at 1; step 10's "did not reach" is a harness false negative; the speech tap works in a Firefox-only job |
| m10-nvda-chrome.md | NVDA + Chrome | Owed: a dispatched Guidepup run with `script=all` (every script, M10 included); records are written from its logs |
| m10-nvda-firefox.md | NVDA + Firefox | Owed: the same run (one job per browser) |
| m10-voiceover-safari.md | VoiceOver + Safari | Owed: the owner, by hand, from [M10-listening-pass.md](M10-listening-pass.md) (all six scripts and the keyboard game) |
| [m10-wcag-audit.md](m10-wcag-audit.md) | Every criterion | The WCAG 2.2 A and AA audit: one row per criterion, how it was checked and by whom, with the automated evidence in [m10-automated.md](m10-automated.md) |

## The harness

`app/a11y/` walks a script step by step and records, per key: where focus landed, what the screen
reader said, and what the app wrote to its live regions. It is its own package (not an npm
workspace), so normal CI never installs Guidepup.

- `src/m3.ts` is the §11.3 script, on the `a11y-m3` scenario (`app/src/play/setup/a11y-scenarios.ts`).
  `src/l.ts` is the §11.4 script (the learning slice), described below. `src/m7.ts` is the §11.5
  script (the tutorial and the coach), described after it.
  When the plain keyboard path does not reach the place a step needs, the harness moves focus itself
  and writes a **harness assist** into the record, so nothing is hidden.
- Output: `app/a11y/results/<project>/<script>.md` (a table per step) and `<script>.json`, where
  `<script>` is `m3`, `l` or `m7`.
- Projects: `nvda-chrome`, `nvda-firefox` (Windows only), `voiceover-webkit` (macOS only), and `dry`
  (Playwright keys, no screen reader, for checking the harness).
- The script is deterministic: the scenario's seed and the script's own moves fix Rookie's moves.
  If you change either, re-check that step 10 still meets a 7000-power attack (see the scenario's
  comment).

### NVDA (Windows runner)

```sh
gh workflow run a11y-nvda.yml --ref main -f browsers=both   # or chrome, firefox
gh run watch <run id>
gh run download <run id>                                     # artifacts a11y-nvda-<run id>-<browser>, one job per browser
```

The workflow builds the app at that commit, serves it with `vite preview`, installs NVDA with
`npx @guidepup/setup install nvda`, and runs the chosen script (`-f script=l|m3|m7|both|all`;
default `l`; `both` is M3 and L, `all` is M3, L and M7) in the chosen browser projects. The M7 pass:
`gh workflow run a11y-nvda.yml --ref <branch> -f browsers=both -f script=m7`. It runs only by hand (never on
push). Firefox is Playwright's Firefox build ("Nightly"), not a branded release.

### Dry run (any machine)

```sh
npm run build -w @optcg/app
(cd app && npx vite preview --port 4199 --strictPort) &
cd app/a11y && npm ci
A11Y_BASE_URL=http://localhost:4199/optcg-sim/ npx playwright test --project=dry              # both scripts
A11Y_BASE_URL=http://localhost:4199/optcg-sim/ npx playwright test --project=dry l.dry.spec.ts # the L script only
A11Y_BASE_URL=http://localhost:4199/optcg-sim/ npx playwright test --project=dry m7.dry.spec.ts # the M7 script only
```

The L script takes about five minutes, the M7 script about two (dry).

### The L script (§11.4)

`src/l.ts`, run by `l.nvda.spec.ts`, `l.voiceover.spec.ts` and `l.dry.spec.ts`. Steps, in order:

| Step | What it does |
| --- | --- |
| F3 | Re-check of M3 finding F3: load, Control+Home, Tab: expect the skip link "Skip to decision". |
| 1 | Declare an attack with the Leader; `M`; read the battle panel line by line. |
| 2 | Confirm; use the Leader's [When Attacking] and pick Rocks' Character, Done. |
| F15 | Re-check of M3 finding F15: resolve the `order` decision, then `.` right after Done: it must move the game, or focus must not sit on the decision heading. |
| 2b | `.` for each AI move: Rocks counters (X.Drake +2000, Yamato +1000); the sentences and the battle panel totals. |
| 3 | `L`, `L`, `L`: coach tiers 1, 2 and 3. |
| 4 | `C`; read the coach with the virtual cursor (browse mode: next line, heading, list). |
| 4b, 4c | "Count it with me": its four questions, a wrong then a right answer, Check my count, Next, Close. |
| 5 | The detector: silent by default, then "Tier 2 always on", then a move. |
| 6 to 9 | The planted missed-lethal record: review, flag, Study, Practice this, play the line. |

Scenario and record:

- Steps 1 to 5 run on `a11y-l` (`/play?scenario=a11y-l&speed=step&opp=rookie&aibudget=iterations&start=1`):
  Kaido against Rocks, turn 9, with lethal on the board; the seed and its comment are in
  `app/src/play/setup/a11y-scenarios.ts`. The AI opponent is Rookie, because it always counters a
  lethal attack, so step 2 has a defence to read; the Pirate AI sees the game is lost and does not.
- Steps 6 to 9 reload the page on `lethalDemo` (the planted missed-lethal game that
  `app/e2e/learning.spec.ts` plays), concede it through the Game menu and open "Review this game".
  That is the same record the e2e test flags (turn 9, severe, "holds whatever they held"). There is
  no URL for a finished game, so the script reaches it this way.
- Where §11.4 expects something that was not built, the step writes "Note: not built" into the
  record: the AI Counter sentence with totals and the tie rule; the "Coach alerts" setting and
  "Lethal available" line (the Detector levels are the equivalent); the timeline as a toolbar;
  focus moving to the explanation when Study opens; "Declare no lethal". The board sandbox for the
  guided count, and the Hint, DON!! math and Tempo sections, are not built either (STATUS.md).
- Judge each step against the spoken log, as for M3; the "Expect" column in the record holds the
  built behaviour where §11.4 has none.

### The M7 script (§11.5)

`src/m7.ts`, run by `m7.nvda.spec.ts`, `m7.voiceover.spec.ts` and `m7.dry.spec.ts`. One browser
context, four parts, each loading its own page (so the tutorial's progress and timing log carry from
part T to Settings):

| Step | What it does |
| --- | --- |
| T0 | The tutorial's first step loads: focus is on the step text (a group named "Step 1 of 8: The zones"), which is read. |
| T1 to T3 | Steps `t1-zones`, `t2-first-turn`, `t3-don-and-power` by the keys the step text names (`G` then `L` or `H`, the arrows, Enter, `P`, `+`); each is done when the done line is spoken and **focus is on Next**; Enter on Next starts the next step. T3 also checks `P` (focus to the step text) and Read again. |
| T4 | Leave tutorial, Home's "Continue the tutorial (step 4 of 8)", Enter: step 4 reopens with focus on its step text. |
| H1, H2 | `ub-hint-1`: `H` from the board moves focus to the hint region and the polite "Hint: thinking." then "Hint ready: ..." are written; the region is read in browse mode; Down and Up walk the "Show step N" buttons; Enter plays nothing. |
| S1, S2 | Settings: the Blunder warning checkbox (Space; its polite status line) and the Tutorial timing list with its Export and Delete buttons (nothing is exported or deleted). |
| B1, B2 | `ub-blunder-1`, with the warning switched on in S1: End turn is held, a polite "Warning: ..." is written, the button reads "Commit anyway" and is described by the note, focus stays, and there is no dialog and no assertive line; a second Enter commits. |

Letter keys (`G`, `H`, `P`) may be taken by NVDA's browse mode when focus is on the step text; the
step then records what happened and moves focus itself (a harness assist), like the L script. The
steps' Expect text is in accessibility.md §11.5. Where something §11.5 once named was not built (a
"Show me" control, Settings → Opponent moves) the section says so.

## VoiceOver passes (the owner's Mac)

Two passes are owed for each milestone: a scripted run with Guidepup and a 30-minute listening pass
by hand. Both use VoiceOver with the default settings, Quick Nav **off** (press Left Arrow and Right
Arrow together until VoiceOver says "Quick Nav off") and Single-Key Quick Nav off.

### 1. Scripted run (Guidepup), about 20 minutes

Guidepup's setup changes macOS settings, so running it is your choice. It:

- turns on "Allow VoiceOver to be controlled with AppleScript";
- turns off the VoiceOver welcome (splash) screen;
- stops Dictation from turning itself on, and turns on Do Not Disturb;
- tries to grant Terminal the automation and accessibility permissions in the TCC database. The
  system database needs System Integrity Protection off; don't turn SIP off for this. Use
  `--macos-ignore-tcc-db` and grant the permissions by hand when macOS asks instead.

Every change can be undone in System Settings (VoiceOver Utility → General for the AppleScript
option; Focus for Do Not Disturb; Privacy & Security for the permissions).

Steps:

1. In the repo: `git pull`, then `npm ci` and `npm run build -w @optcg/app`.
2. Serve the build: `(cd app && npx vite preview --port 4199 --strictPort) &`.
3. Install the harness: `cd app/a11y && npm ci && npx playwright install webkit`.
4. If you choose to: `npx @guidepup/setup setup --macos-ignore-tcc-db`. When macOS asks, allow
   Terminal (or your terminal app) to control VoiceOver and System Events, and add it under Privacy &
   Security → Accessibility.
5. Install the VoiceOver assets for this Guidepup version: `npx @guidepup/setup install voiceover`.
6. Close other windows, don't touch the keyboard or mouse during the run, and start it:
   `A11Y_BASE_URL=http://localhost:4199/optcg-sim/ npx playwright test --project=voiceover-webkit`.
   VoiceOver starts and stops by itself.
7. The log is `app/a11y/results/voiceover-webkit/m3.md`. Send it to the agent (or commit it under
   `docs/design/a11y-passes/logs/`), and it writes `m3-voiceover-safari.md` from it.

Notes: the scripted VoiceOver run uses Playwright's WebKit, not Safari itself, and it has not been
run by the agent (it never runs VoiceOver or changes macOS settings on your machine). The first run
may need a fix to the harness; the dry and NVDA projects share the same script.

### 2. Listening pass by hand, about 30 minutes

1. Safari, a private window, at the deployed app:
   https://chrisdevine00.github.io/optcg-sim/play?scenario=a11y-m3&speed=step&start=1
   (or `http://localhost:4199/optcg-sim/play?...` from step 2 above).
2. Turn VoiceOver on (Command-F5) and Quick Nav off.
3. Follow the 18 steps of accessibility.md §11.3 by keyboard only. Where the script says Tab, use
   Tab (not VO-Right). The scenario starts on turn 3, not turn 1.
4. For each step, note pass, fail or note, and for each failure what VoiceOver said (a phone
   recording of the speech is enough). Also note anything that was confusing even if it passed.
5. Write the notes into `docs/design/a11y-passes/m3-voiceover-safari.md` with the macOS, Safari and
   VoiceOver versions, or hand them to the agent to write up.

The pass is met when every step's expectation is heard with no pointer and no sighted help.

## The M10 listening sheet (the owner's VoiceOver pass, one document)

`M10-listening-pass.md` is generated, never edited: `npm run a11y:sheet` (`scripts/a11y-sheet.ts`) reads every
script's step table (`app/a11y/src/index-steps.ts`: M3, L, M7, M8, M9, M10) and writes one sheet with the Do and
Expect text of each step, blank Result and Heard columns, and the by-hand keyboard game as its last item.
`app/test/a11y-sheet.test.ts` fails if the sheet is out of date, so a step added to a script reaches the sheet
(regenerate, commit). The set-up block between the markers below is copied into the sheet's top, so it is
written once.

<!-- sheet:setup -->
1. Safari, a private window, at the deployed app: https://chrisdevine00.github.io/optcg-sim/ (the start address of each script is given with it).
2. Turn VoiceOver on (Command-F5). **VO** is Control+Option. Turn Quick Nav **off** (press Left Arrow and Right Arrow together until VoiceOver says "Quick Nav off") and Single-Key Quick Nav off. Leave VoiceOver's other settings as they are.
3. Where a step says Tab, use Tab (not VO-Right). To read around a page use VO-Right and VO-Left (next and previous item), VO-Command-H (next heading), VO-Command-L (next link), VO-Command-X (next list) and VO-Command-T (next table).
4. For each step write pass, fail or note in Result, and in Heard what VoiceOver said when it was not what Expect says (a phone recording of the speech is enough). Also note anything confusing even if it passed.
5. Never stop a step for time. If a step cannot be done, write why in Result and carry on.
<!-- /sheet:setup -->

The sheet is about 90 minutes: do it in two sittings, M3 to M8 first, then M9, M10 and the keyboard game. The matching
records are `<script>-voiceover-safari.md`, written from the filled sheet. The scripted NVDA passes run from
`gh workflow run a11y-nvda.yml --ref main -f browsers=both -f script=all` (`script=m10` for the release shell alone).
`m10-wcag-audit.md` holds one row per WCAG 2.2 A and AA success criterion with how it was checked, who judged it and the
result.
