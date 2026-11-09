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

## The harness

`app/a11y/` walks a script step by step and records, per key: where focus landed, what the screen
reader said, and what the app wrote to its live regions. It is its own package (not an npm
workspace), so normal CI never installs Guidepup.

- `src/m3.ts` is the §11.3 script, on the `a11y-m3` scenario (`app/src/play/setup/a11y-scenarios.ts`).
  `src/l.ts` is the §11.4 script (the learning slice), described below.
  When the plain keyboard path does not reach the place a step needs, the harness moves focus itself
  and writes a **harness assist** into the record, so nothing is hidden.
- Output: `app/a11y/results/<project>/<script>.md` (a table per step) and `<script>.json`, where
  `<script>` is `m3` or `l`.
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
`npx @guidepup/setup install nvda`, and runs the chosen script (default `l`; `m3` and `both` are
kept) in the chosen browser projects. It runs only by hand (never on
push). Firefox is Playwright's Firefox build ("Nightly"), not a branded release.

### Dry run (any machine)

```sh
npm run build -w @optcg/app
(cd app && npx vite preview --port 4199 --strictPort) &
cd app/a11y && npm ci
A11Y_BASE_URL=http://localhost:4199/optcg-sim/ npx playwright test --project=dry              # both scripts
A11Y_BASE_URL=http://localhost:4199/optcg-sim/ npx playwright test --project=dry l.dry.spec.ts # the L script only
```

The L script takes about five minutes.

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
