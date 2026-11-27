# M10 review: polish and release

**Date:** 2026-11-27
**Reviewer:** an independent review by a subagent with no stake in the work. The brief was to find what is wrong.

**Build reviewed:** local `main` at `fa71911f` (WP0 to WP4 and WP6 to WP9), merged into a clean worktree with its own `npm ci`. WP5 (the audit document and the screen-reader kit) was not on `main` and is not reviewed; `docs/design/a11y-passes/m10-automated.md` (WP4's generated report) is. E2E ran on port 5290 against the production build (CSP included).

**Rule:** any severity 3 or 4 finding fails the milestone. 4 = data loss, security or privacy defect, or a done criterion claimed but false; 3 = done criterion not met, a WCAG 2.2 AA failure, a crash or blank page, a regression; 2 = notable; 1 = nit.

**M10 review: FAIL on one severity 3 (M10-R1), no severity 4.** R1 is a one-line workflow fix and is not a done-criterion miss: every done criterion that can be measured by an agent is met on my own runs (below). I found no hidden-information leak in the AI warm-up, no XSS sink, no request to an undisclosed origin, and no card art in the visual baselines.

## What ran

| Check | Result |
| --- | --- |
| `npm run typecheck`, `npm run lint` (eslint and prettier) | clean |
| `npm run build` (typecheck, contrast, build, bundle) | passes. Initial JS 85.9 KB gzipped in 1 file (cap 100). Play 196.9 KB (cap 215). Both workers 118 KB, uncapped. |
| `npx vitest run engine ai app cards/test` | 3,075 files passed, 34 skipped; 32,742 tests passed, 26 expected fail, 0 failed (647 s, run at a load average over 100 beside other agents) |
| `E2E_PORT=5290 npx playwright test` | 557 passed, 97 skipped, 2 failed at a load average of 100 to 200: `review-rr1.spec.ts` (M3-27, 720p) and `first-paint.spec.ts:82` (1080p, a 5 s `toHaveText` on the Settings count). Both passed alone, 12 of 12 (M10-R14). |
| `npm run perf:lighthouse -- --runs 3` (load 4, desktop, 4x CPU, 40 ms RTT, 10 Mbit/s) | six routes, all **100 performance, 100 accessibility, 100 best practices**. LCP 201 (home, cards, learn), 312 (meta), 515 (rules), 725 (play); TBT 0; CLS at most 0.043. Same as `docs/benchmarks.md` to within 2 ms. |
| My own Lighthouse run of the board, not the Setup page the harness measures (`play?scenario=late&opp=pirate&speed=step&start=1&aibudget=iterations`, 3 runs, temporary edit of `scripts/perf-routes.ts`, reverted) | 100 / 100 / 100, LCP 728 ms, TBT 19 ms. The criterion holds for the board too. |
| `PERF=1 npx playwright test app/e2e/perf-frames.spec.ts --project=720p` | 9 passed. 4x: p95 16.8, p99 16.8 in all four scenarios, at most 0.2% over 25 ms, no long task. Matches the benchmark. The Warlord wait: turns 2, 4, 6, 8 take 5,303 / 6,559 / 9,198 / 7,091 ms, of which 2.3 to 4.3 s is the wait. |
| Frame states from the saved Chromium traces (my analysis, not the spec's) | see M10-R6 |
| Live site | `version.json` reports release 1.0.0, build `3f4b16022bec`, built 18:18 UTC today; `/cards` answers 404 with the app, as accepted. |
| Probes I wrote and removed: a late-opening store (M10-R5), axe `color-contrast` incompletes per route, `sanitizeJsonDeck` edge cases | see findings |

## Done criteria

| Criterion | Verdict |
| --- | --- |
| Lighthouse performance and accessibility at least 90 | **Met**, 100 and 100 on the six routes and on the board, on my run. The runs are against `serve-dist` on a Mac, not the deployed URL or a Linux runner: `perf.yml` has never run (M10-R4). |
| WCAG 2.2 AA audit with manual NVDA and VoiceOver passes | **Automated half met**: 39 states at both sizes, zero axe violations, the zoom, spacing, forced-colour and reduced-motion layers, the nine-item nav at 200% and 400% with nothing clipped. **Manual half not yet done**: WP5's document and kit are not on `main` and the owner's VoiceOver pass is pending. The claim text is too strong for what exists (M10-R2). |
| 60 fps trace on a throttled profile | **Met by the stated metric** (requestAnimationFrame deltas at 4x, p99 16.8 ms). The metric does not see compositor frames and the traces say more than the number (M10-R6). |
| Deployed URL in STATUS.md | STATUS.md names the URL on line 6 and the site is live, but STATUS is still the M9-era checkpoint and the deploy that made it live shipped an untested commit (M10-R1, M10-R13). |

## Findings

### M10-R1 (severity 3): the deploy builds `origin/main`, not the commit whose CI passed

`.github/workflows/deploy.yml` runs on `workflow_run` of CI and its `build` job calls `actions/checkout@v4` with no `ref`. For a `workflow_run` event that checks out the default branch's current head.

Evidence: Deploy run 46048343650 has `headSha` `ec514e81` (the CI-green push, run 46044164957). Its log reads `git checkout --progress --force -B main refs/remotes/origin/main`. The build id it deployed and verified, `3f4b16022bec`, is live now, built at 18:18 UTC from `fa71911f`, the merge whose own CI (run 46048365657) was still `in_progress`. Of the previous 8 CI runs on `main`, 6 failed. So "auto-deploys after green CI on `main`" (STATUS line 6, README, DECISIONS) is false: a green run releases whatever is newest, red or not, and `build` runs typecheck and the bundle check but no tests. The `verify` job passes because it compares the live build with the one it just built.

Judgement: severity 3 for a release. It was the same before M10, but M10 is the milestone that adds the release check and tags 1.0.0, and the failure mode (CI red for 5 pushes unnoticed, then a deploy of the red head) has just happened.

**Fix:** `with: ref: ${{ github.event.workflow_run.head_sha || github.sha }}` on the checkout in `build`; print the sha in the job summary and add it to `version.json` (or the verify output) so the live site says which commit it is. Reword STATUS line 6 only after that.

### M10-R2 (severity 2): the accessibility claim in the CHANGELOG is stronger than what was done

`CHANGELOG.md` (1.0.0, Added): "Built to WCAG 2.2 AA: keyboard-complete, 24 px targets, reduced motion, and no meaning carried by colour alone." The plan's own wording for what STATUS may claim is "automated axe on every route, scripted NVDA in Chrome and Firefox, the owner's VoiceOver pass", with "no screen-reader user outside the project has used it". What exists today:

- axe finds zero violations on 39 states, but the audit blocks all card art (`noArt`), so text over art (1.4.3, 1.4.11) is judged only by a manual row that WP5 has not written;
- one known finding is reported rather than fixed: under the 1.4.12 override the board's primary button wraps to three lines and ends 4 px past the rail on `board-target` and `board-defend` at 720p (the label is whole, a border is cut). The report calls it severity 1, which is fair, and "Known limits" does not mention it;
- NVDA was scripted for M3 to M9; the M10 surfaces (About, Page not found, update prompt, offline line) have not been heard, and VoiceOver has not been run at all.

**Fix:** until WP5 and the owner's pass are in, say "audited with axe on every route at both sizes, with the known limits listed", name the 1.4.12 finding and the art gap under Known limits, and use the plan's sentence in STATUS. Revisit after the owner's pass.

### M10-R3 (severity 2): the Warlord nightly bound fails by construction, and the 2,700 ms wait bound is asserted only where it cannot be checked

`app/e2e/warlord.spec.ts:176` (millisecond budgets, `E2E_FULL`) asserts a Warlord turn of at most 8,500 ms for up to 7 moves. The turn is 9,198 ms on my machine (turn 6, 6 moves; WP3 saw 9,188 to 9,201) and the same assertion failed on CI in the nightly of 2026-11-27 (run 45998251728, "Warlord turn 6, expected at most 8500"), before WP3. The number is repeatable because the search runs to its budget, so it is not noise.

`docs/runbooks/testing.md` section 2 says a nightly bound is about 1.5 times the requirement, "chosen so noise passes and a search twice as slow still fails", and that a measured miss is "reported, not accommodated". 8,500 is 1.06 times board.md section 5.2's 8 s; it was set from an earlier observation, not from the requirement. Separately, the 2,700 ms (1,800 x 1.5) wait bound lives in `checkTurns`, which only the iteration-budget tests call; in millisecond mode, the mode players get, the wait is 2.3 to 4.3 s and no test states a bound on it.

**Should happen (runbook):** keep §5.2's 8 s as the requirement and say in board.md and BACKLOG §14 that in millisecond mode a turn that waits on decision searches takes 9 to 9.5 s and waits 2.3 to 4.3 s. Set the nightly bound for a typical turn at 12 s (1.5 x 8) and add one wait bound on the millisecond test at the measured figure plus headroom (for example 6,000 ms), printing requirement and observation. Do not raise 8,500 to 9,500 only to make the run green. List it under Known limits in the CHANGELOG, which today names the Warlord's strength but not its wait.

### M10-R4 (severity 2): nothing M10 added to the nightly has ever run, and the nightly is already red

- `Nightly` failed on 6 consecutive days (runs 45017372844 to 45998251728). On 2026-11-27 the `property` job failed at the Warlord assertion above and `strength-m5b (emperor)` was cancelled at the 6 h limit. A permanently red nightly is how the 5 red pushes went unnoticed: the next failure, in the new `visual` job, the keyboard game or the Warlord timing, will look the same.
- `Perf` (`perf.yml`, the Lighthouse and frame bounds on a Linux runner, and the `release: true` gate at 90) has never run. The bounds `p95 30 ms, p99 50 ms` for a software compositor on a shared runner are a guess until it does.
- `Visual baselines` ran once (46038814533, to make the images). The `visual` job that compares them has never run, so the claim that a second Linux render is byte-stable is untested (the Mac check in the DECISIONS entry proves nothing about Linux).

**Fix:** before the tag, dispatch `perf.yml` with `release: true` and the nightly's `visual` job (or `visual-baseline.yml` without `commit`, then compare), put the numbers in `docs/benchmarks.md`, and get the nightly to a state where a red run means something (fix R3, give the Emperor series a timeout it can meet or move it out of the gate).

### M10-R5 (severity 2): a database that opens a second after the 3 s cap leaves the session in memory, saying "No saved games yet" beside a saved game

Probe (temporary e2e, removed): one game saved; then a load with `indexedDB.open` held for 4 s. Result: the gate lifts at 3 s with the notice "Saving is off in this browser; Export keeps a copy." Three seconds after the real database opened, Settings still says "No saved games yet."; a reload says "1 saved game in this browser." The cap and the fallback predate M10, but WP1's gate makes the page usable during the wait and so makes the state reachable on a slow disk or a busy tab. Anything played in that session goes to the memory store and is lost at close; the notice says saving is off, which is not the cause.

**Fix:** when the late open succeeds and nothing was written to the memory store, adopt it (`setStore`, hydrate, re-render); or keep the gate until the open settles but show Home and the static pages meanwhile; at minimum change the notice to "Your saved games did not load in time. Reload to try again." so a player does not play a game that will not be kept.

### M10-R6 (severity 2): the 60 fps figure is main-thread cadence; the traces it saves show missed main-thread updates the figure cannot see

`perf-frames.spec.ts` records requestAnimationFrame deltas and long tasks. That sees the main thread only. The Chromium traces the spec saves contain the compositor's frame states, and nothing reads them. From the saved traces of my 4x run (counting `PipelineReporter` frames that produced output):

| Scenario | Presented in full | Presented partial (main-thread update missed) | Dropped |
| --- | --- | --- | --- |
| AI turn, 13 moves | 209 | 19 (8%) | 5 (2.1%) |
| Human turn with a counter | 411 | 182 (30%) | 7 (1.2%) |
| Review scroll | 97 | 4 | 1 |
| Hand fan | 186 | 2 | 0 |

The rAF table says p99 16.8 ms for all of them. The software compositor on a Mac under load will exaggerate this and a GPU will hide it, so I do not claim the human turn is below 60 fps; I claim the pass line does not test what "60 fps trace" says, and that nobody has looked at what the trace holds.

**Fix:** word the claim as "main-thread frame cadence, 4x CPU, software compositing" and add a `frameStates` figure from the trace (partial and dropped shares) to `frames-*.json` and the benchmark, reported with a bound at 1.5 times what is measured. If the owner's headed run (`npm run perf:frames -- --headed`) shows the same shares on a GPU, the human turn needs the `BoardCard` memoisation WP3 deferred.

### M10-R7 (severity 2): the AI warm-up buys nothing measured and adds a worker, a timer and an unproven determinism claim

WP3's own result: setup under 1 ms either way, first-plan rollouts 160,452 / 162,074 / 154,818 cold against 160,640 / 163,158 / 159,011 warm, wait identical to 10 ms. What it costs: a third worker (118 KB gz script) spawned 300 ms after Setup settles for every Pirate, Warlord or Emperor setup that is merely looked at; a module-level `warmed` singleton with a 20 s idle timer; an `adoptWarm` branch in `controller.ts`, the file with the pacing logic; about 220 lines with tests.

Hidden information: I found no leak. The init message holds the AI's own deck and the public prior for the player's Leader (what the game's worker receives), the position is the AI's deck against itself, and the differential in `ai-warmup.test.ts` (same Leader, disjoint main decks, identical messages) is real. What is missing is a decision-level differential: that a game played on an adopted worker (after a 1-iteration plan and `reset`) makes the same AI decisions for the same seed as a game on a cold one. `AiSession.reset` clears the plan and the defence memory; whether the search keeps anything else module-level is not tested, and the effect would depend on how long the player lingered on Setup.

**Fix:** remove it (the plan says it may be cut), or keep it and add that differential test. I recommend removal: no measured benefit, a timing-dependent code path in the one place where games must be reproducible.

### M10-R8 (severity 2): the privacy statement understates what the art host learns, and the page sends a referrer

About and README say: after the app has loaded "the only network requests are for card images, from the hosts named under Credits. Their operators see your address, as any website would." Also true: every card image URL names the card (`.../Card_Images/OP17-087.jpg`), so optcgapi.com sees which cards you look at, your deck included, and each request carries `Referer: https://chrisdevine00.github.io/` (no `referrerpolicy` anywhere in `index.html` or the images). The page itself loads lazy chunks and polls `version.json` from GitHub Pages, which the sentence does not say ("after the app has loaded" and "the only"). The privacy e2e (`m10-privacy.spec.ts`) is sound: it records every origin including the service worker's and fails on any outside the app and the art hosts. No undisclosed origin exists.

**Fix:** add `<meta name="referrer" content="no-referrer">` (a one-line change in `index.html`; the CSP test and `head.test.ts` need no edit), and add to the statement: "An image address names the card, so the image host can tell which cards you look at. The app's own files come from GitHub Pages."

### M10-R9 (severity 1): the shell error page's "no game data" is a promise about an error message

`detailsText` puts the first 300 characters of `error.message` on the clipboard and the README says it "never includes games or decks". An engine error such as "Unknown card ..." or a validation message names card ids, which can be a hidden hand. Fix: cut the message to its first 120 characters and strip anything matching a card id pattern, or reword the promise to "no saved data".

### M10-R10 (severity 1): `sanitizeJsonDeck` passes an entry with no `count` and a numeric `id` without a word

Probe: `{ id: 'OP17-039', qty: 4 }` and `{ id: 7, count: 2 }` are kept; the parser then defaults the count or reports an unknown card. M6-11's class (a silent change) in a smaller form. Fix: report "Entry n: no count, read as 1" for a missing count.

### M10-R11 (severity 1): focus after the store gate

`Waiting` focuses the page `<h1>`; when the store is ready the gate unmounts, that heading is removed and focus drops to `<body>`. `RouteFocus` skips the first load (`booted`), so a deep link to `/play` or `/decks` leaves a keyboard user's focus on the body once the page appears (WCAG 2.4.3). The `role="status"` also sits inside `main aria-busy="true"`, which some readers treat as "do not announce". Fix: let `RouteFocus` run once after a gate, or have the page's own heading take focus when the gate released; drop `aria-busy` from the gate's `main`.

### M10-R12 (severity 1): About caches a failed version load for the page's life

`loadVersion` does `cached ??= fetch(...).catch(() => null)`: a first call while offline stores `null` until a reload, and About then says the details could not be loaded after the connection is back. The offline gap itself is documented and accepted. Fix: do not cache a null; retry on the `online` event.

### M10-R13 (severity 1): STATUS.md and BACKLOG are stale for M10

STATUS line 2 still says "M6b in progress", the checkpoint is the M9 one, and BACKLOG section 12 (first paint) is not struck through though WP1 built it. WP10 owns this; listed so it is not forgotten. BACKLOG section 2 says M10 "must close" M6-14; the plan's reasoning for deferring it is recorded in DECISIONS and BACKLOG section 14 and is reasonable, but the owner should say yes to it, since section 2 is his instruction.

### M10-R14 (severity 1): two 5 s hang guards fail under extreme load

`first-paint.spec.ts:124` (Settings count after a release) failed at load 100 to 200 and passed in 4.0 s alone; `review-rr1` likewise. The runbook says hang guards have room for a loaded runner; 5 s is the default expect timeout. Fix: `{ timeout: 20_000 }` on that assertion.

### M10-R15 (severity 1): the audit's account of its `color-contrast` incompletes is imprecise

`m10-automated.md` says the 2,491 incomplete nodes "sit over card art or gradients axe cannot sample". I ran axe on `/learn`, `/progress` and `/rules` with art blocked: the incompletes are `aria-hidden` "○" status glyphs (`nonBmp`) and two partly obscured links, benign. On `/cards`, which draws text faces with art blocked, 62 nodes are `bgGradient`: the text-face body text over its gradient is what is unverified, and `scripts/contrast.ts` checks token pairs, not that. Both belong in WP5's manual rows. No fix to the app.

## Checks that found nothing (so the next reader does not repeat them)

- **WP1 first paint.** `StoreGate` wraps exactly the routes `storeWanted` lists; the ungated pages read only localStorage or wait on `useStoreReady` (the Learn hub). `getStore()` is a memory store until `setStore`, so a write before ready would be lost, but I found no ungated writer: the Show-me board does not save, and `recordLethalProgress` falls back to localStorage, which the open migrates. The first-paint spec holds the real `indexedDB.open` and checks that no game starts and that a game saved earlier survives. The 3 s fallback works (M10-R5 is its late-open edge).
- **WP6 error boundary and 404.** A thrown route chunk shows the failure page, keeps the header, leaves the saved deck, resets on a route change (spec passes). The chunk-removed case says "The app was updated". Page not found focuses its heading.
- **CSP.** The meta tag is first in `<head>` of the built `index.html`; `default-src 'self'`, `script-src 'self'` with no inline script, `worker-src 'self' blob:`, `connect-src 'self'`; `img-src` holds only the enabled host. optcgapi.com answers an image with 200 and no redirect, so the policy does not block art on a redirect. `style-src` has `'unsafe-inline'` (React style attributes, the boot style), and a meta policy cannot carry `frame-ancestors`; both are known and recorded. The whole e2e suite ran under the policy, 557 passed.
- **The review specs' CSP bypass (`ec514e81`) was honest.** The two specs read IndexedDB through `new Function`, which `script-src 'self'` correctly blocks; the app was unaffected. The bypass is on those two files only, and `m10-release.spec.ts` now concedes a planted game and runs the review worker under the real policy ("1 flag · 1 severe") with a violation recorder. The cost: those two specs no longer run their axe checks under the production policy.
- **WP4.** Route manifest complete (`route-coverage.test.ts`); `RouteFocus` moves focus only when it is on `<body>` or outside `#main` and does not run on the first load; the exemptions (`.face` truncation, inline links, closed `details`, `noFocus` for boards and dialogs) are stated with reasons. The nine-item nav is one row at 1280 and 1920 and 200%, three rows at 400%, nothing clipped. Axe also ran against the dark theme only; there is no light theme to run (nothing sets `data-theme`).
- **WP7.** The builder grid and deck list are one roving stop each, no wrap, clamped on a short last row (`moveFocus`); single keys act only on the focused tile or row; `sanitizeJsonDeck` handles strings, negatives, fractions, 1e308, nulls and `__proto__` ids (the last passes to the parser, which reports an unknown card). No `dangerouslySetInnerHTML`, `innerHTML`, `eval` or `new Function` in `app/src`; the `href`s from data are reviewed-PR content and `javascript:` would be blocked by the policy.
- **WP8.** 30 baselines, all text faces (I read the inspector at 1080p and the board at 720p; the inspector shows its "Couldn't load the card image" state), each under 600 KB and spec-named; the specs skip off Linux and without a baseline with the reason printed (97 skipped in my run); `nightly.yml` has the `visual` job. Not proven: a second Linux render matches (M10-R4).
- **WP2.** `route-chunks.test.ts` runs a real `vite build` into a temp directory in 1.3 s; it does not touch `app/dist`. Caps are deterministic byte counts, so they are fine per push.
- **Licences and credits.** `third-party.txt` lists the 5 packages that the sourcemaps show in the bundle (react, react-dom, scheduler, two font packages) with their licence texts; nothing else third-party is bundled.
- **Deploy verify job.** Sound for what it checks (home, `version.json` build id, a deep link, `third-party.txt`) apart from R1.
- **Docs.** README, CHANGELOG and the S3 kit match the product apart from R2 and R13; the repository is public with Issues on, as README says; the licence line "to be chosen by the owner" matches `licenseInfo: null`.

## Owner-facing summary

Fix R1 (one line) and re-run CI for the release candidate; then R3, R4 and R5 before the tag. R2 and R8 are wording and a one-line `meta`. R6 and R7 are for the owner to decide: R6 is whether a trace-based frame check is wanted, R7 whether the warm-up stays.

## Fix round (2026-11-27)

Every finding below is fixed or answered; "revert" is the mutation that was applied, seen to fail, and undone (or, where marked "by construction", the test is a parse or a string comparison that fails on any removal). The fix round also took the four findings of WP5's audit (W5-1 to W5-4).

| Finding | Change | Test | Fail-on-revert |
| --- | --- | --- | --- |
| **R1** | `deploy.yml`: checkout `ref` is the CI run's `head_sha`; the build passes it as `BUILD_COMMIT` (`version.json` has `commit`); the build refuses a `HEAD` that differs; the sha is in both job summaries; `verify` compares the live `commit` | `app/test/workflows.test.ts` parses the YAML | removing `ref:` fails "checks out that run's head_sha" (seen) |
| **R2** | one sentence, `ACCESSIBILITY_CLAIM`, on About (new Accessibility section), README and CHANGELOG, with three Known limits (art contrast, 1.4.12 button, NVDA/VoiceOver pending); the Warlord wait and the frame-cadence wording are Known limits too | `app/test/about.test.ts` compares the three places | rewording any one fails it (by construction) |
| **R3** | nightly bounds: typical Warlord turn 12,000 ms (was 8,500), wait 6,000 ms (new), Emperor turn 19,500 / 26,000 (was 15,000 / 17,000, which failed at 15,241 on this round's first local run); each prints requirement, observation, bound; board.md 5.2 and BACKLOG 14 state the miss | `app/e2e/warlord.spec.ts` (nightly) | an observed 9,189 ms passes; a search twice as slow fails by arithmetic (not mutated) |
| **R4** | the cause of the Emperor cancellation: `-t "Emperor"` matched the describe title and ran the whole file (see DECISIONS "M10 fix round"). Filter now `'Emperor against Warlord'`, the job has its own 120-minute limit, its test a 100-minute guard; 16 games and the interval check kept. The other causes of the six red nights are listed in DECISIONS | `workflows.test.ts` applies every matrix filter to the file's test titles: exactly one match each | filter back to `'Emperor'` fails "selects exactly one test" (seen) |
| **R5** | `open.ts` `lateOpen`: adopt when `MemoryStore.written === 0`, re-key the gated pages (`epoch`), "Your saved games have loaded."; else keep memory and say "did not load in time ... after a reload" | `store-idb.test.ts` (3 unit tests on a held `IdbStore.open`); `first-paint.spec.ts` (a 4 s held open: saved game appears, notice; a game played meanwhile: not adopted, 2 saved games after a reload) | `written === 0` replaced by `true` fails the "not adopted" unit test (seen); deleting `lateOpen` fails the adopt test |
| **R6** | wording "main-thread frame cadence at 4x CPU on a software compositor" in perf-frames.spec, benchmarks.md, board.md 5.3, CHANGELOG; `frameStates` from the trace in every `frames-*.json` and the console line | `perf-stats.test.ts` (`frameStates`); the spec writes it | counting no-update frames fails the exact-count test (by construction) |
| **R7** | removed `useAiWarmUp`, `warm-position`, `aiWarm`, `adoptWarm`, the `WorkerPort` seam, `ai-warmup.test.ts`, `ai-warmup.spec.ts`, the `PERF_AI_WARM` branch; the timing split and M5a-20 stay (`ai-pacing.test.ts` passes) | typecheck and the suites | n/a (removal) |
| **R8** | `<meta name="referrer" content="no-referrer">`; privacy statement: image addresses name the card, app files come from GitHub Pages, no referrer | `head.test.ts`; `m10-privacy.spec.ts` records every art request's Referer (at least one seen, none non-empty); `about.test.ts` | deleting the tag fails `head.test.ts` |
| **R9** | "Copy details": message cut at 120 characters, card numbers replaced by `[card]`; the failure page and About say what is copied | `error-boundary.test.ts` | removing the replace or raising the cut fails it |
| **R10** | JSON import: numeric or non-text id and `qty`/`quantity`/`copies`/`amount`/`n`/`num` are skipped with a named reason; no count says "read as 1" | `decks-keyboard.test.tsx` (table) | removing the checks passes the four bad entries through (the table fails) |
| **R11** | `RouteFocus` runs on a first load when the store gate was shown; the gate's `main` has no `aria-busy` | `first-paint.spec.ts` (held 1.5 s deep link: heading focused, no `aria-busy`); `store-gate.test.tsx` | removing the `gateWasShown` branch leaves focus on the body (the e2e fails) |
| **R12** | `loadVersion` forgets a failed load; About asks again on `online` | `version.test.ts` | the old `??=` caching fails "does not keep a failed load" |
| **R13** | STATUS left to the lead. BACKLOG 12 struck through as done; BACKLOG 2 says M6-14 is deferred by the M10 plan and waits on the owner's yes | n/a | n/a |
| **R14** | the two 5 s guards (`first-paint.spec.ts` count, `review-rr1.spec.ts` dock/veil) are 20 s | specs | n/a |
| **R15** | `scripts/a11y-audit-report.ts` and `m10-automated.md` say what the `color-contrast` incompletes are | n/a | n/a |
| **W5-1** (1.4.13) | the hover dock loses `inert` and stays open while the pointer is inside its box (window `pointermove`); it keeps `pointer-events: none` | `review-rr1.spec.ts` (card to dock, rest 700 ms, leave); the M3-30 test now checks "no focusable child" | `inert` back on: the new test fails (seen). A first version with `pointerenter` on the dock made the log's "Why?" buttons unclickable and failed `pirate.spec.ts`; that is why the box test is geometric |
| **W5-2** (2.1.4) | accessibility.md 3.15 item 2, R4 and the script table corrected; no switch built | document only | n/a |
| **W5-3** (2.4.3) | `<RouteFocus>` beside `<NotFound />` | `app/a11y/m10.dry.spec.ts` step E1 | see the dry-run line in the report |
| **W5-4** (4.1.2) | the rail notice's `<p>` has no `aria-label` | axe in the audit spec | n/a |

**Local nightly-mode runs** (quiet machine, load 2.6 to 4, Apple M4 Pro; the lead dispatches the hosted run): the Playwright line of `nightly.yml` with `E2E_FULL=1` passes except where noted in the report; `npm run test:timing`: 44 passed in 126 s; the Emperor report with the workflow's exact command: 16 games, 14.4 minutes, passed, Emperor won 10 of 16 (62.5%, 95% interval 38.6 to 81.5%; the check is at least 35%). Warlord turns 2, 4, 6, 8 in millisecond mode: 5,298 / 6,556 / 9,189 / 7,094 ms; waits 3,237 / 2,271 / 4,256 / 2,838 ms; Emperor turns 10,274 / 11,336 / 15,235 ms.
