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

## The harness

`app/a11y/` walks a script step by step and records, per key: where focus landed, what the screen
reader said, and what the app wrote to its live regions. It is its own package (not an npm
workspace), so normal CI never installs Guidepup.

- `src/m3.ts` is the §11.3 script, on the `a11y-m3` scenario (`app/src/play/setup/a11y-scenarios.ts`).
  When the plain keyboard path does not reach the place a step needs, the harness moves focus itself
  and writes a **harness assist** into the record, so nothing is hidden.
- Output: `app/a11y/results/<project>/m3.md` (a table per step) and `m3.json`.
- Projects: `nvda-chrome`, `nvda-firefox` (Windows only), `voiceover-webkit` (macOS only), and `dry`
  (Playwright keys, no screen reader, for checking the harness).
- The script is deterministic: the scenario's seed and the script's own moves fix Rookie's moves.
  If you change either, re-check that step 10 still meets a 7000-power attack (see the scenario's
  comment).

### NVDA (Windows runner)

```sh
gh workflow run a11y-nvda.yml --ref main -f browsers=both   # or chrome, firefox
gh run watch <run id>
gh run download <run id>                                     # artifact a11y-nvda-<run id>
```

The workflow builds the app at that commit, serves it with `vite preview`, installs NVDA with
`npx @guidepup/setup install nvda`, and runs both browser projects. It runs only by hand (never on
push). Firefox is Playwright's Firefox build ("Nightly"), not a branded release.

### Dry run (any machine)

```sh
npm run build -w @optcg/app
(cd app && npx vite preview --port 4199 --strictPort) &
cd app/a11y && npm ci
A11Y_BASE_URL=http://localhost:4199/optcg-sim/ npx playwright test --project=dry
```

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
