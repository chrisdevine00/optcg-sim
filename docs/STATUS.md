# Status

**Phase:** 5 Build, slice pass (ADR 0012), starting at M0. Phases 1–4 gated 2026-10-28.
**Milestone:** M3 Playable board (built; in review) and M4a Effects slice (built; independent tests to merge). M0, M1 and M2 done 2026-10-28.
**Run the app:** `npm install && npm run dev` then open http://localhost:5173/optcg-sim/ and go to `/cards` for the card browser
**Deployed:** https://chrisdevine00.github.io/optcg-sim/ (auto-deploys after green CI on `main`)

## Phase plan

| Phase | Gate deliverables | State |
| --- | --- | --- |
| 1 Research | docs/research/rules-digest.md, data-sources.md, competitive-teardown.md, meta-landscape.md, strategy-concepts.md | **Gated 2026-10-28** (all five deliverables) |
| 2 Plan | docs/PLAN.md, docs/ARCHITECTURE.md, docs/adr/ | **Gated 2026-10-28** (revision 2 after two reviews; see docs/plan-review-1.md) |
| 3 Deep research | docs/research/effect-dsl.md, rulings.md; docs/content/archetypes/, curriculum.md, glossary.md, sources.md | **Gated 2026-10-28** (competitive-player review: 20 findings, 0 severity-3 open; see docs/content/review-1.md) |
| 4 Design | docs/design/principles.md, board.md, flows.md, visual-system.md, learning-ui.md, wireframes/, review-1.md | **Gated 2026-10-28** (review 1: 50 findings plus 2 verification passes; 0 severity-3 or severity-4 open) |
| 5 Build | M0 through M10 per PROMPT.md | In progress: M0–M2 done; M3 built, in review |

## Done

- Monorepo scaffold: npm workspaces `engine`, `cards`, `ai`, `app`; TypeScript strict, Vite + React, Vitest, Playwright, ESLint (with package-boundary rules) and Prettier; CI workflow green; deploy workflow publishes to GitHub Pages after green CI (live placeholder).
- Track A (rules): `docs/research/rules-digest.md` from Comprehensive Rules v1.2.1 (2026-08-28). 137 cited items, test checklist, 13 open questions copied to OPEN-QUESTIONS.md, corrections to PROMPT.md logged in DECISIONS.md.
- Track D part 2 (strategy): `docs/research/strategy-concepts.md`, 16 concepts with AI evaluation features. Open questions copied.
- Track C (UX teardown): `docs/research/competitive-teardown.md`. Hands-on for Untap.in (to its login wall) and the Bandai browser app (to its terms); secondhand for SeaKing, OPTCGSim and TTS. DuelVoyager and SeaKing disallow Anthropic agents in robots.txt, so DuelVoyager material from the first attempt was removed and is not used (see Blockers).
- Track D part 1 (meta): `docs/research/meta-landscape.md` and `meta-lists.json`. 12 archetypes by leader ID, 36 tournament lists (every list checked at 50 cards, ≤4 copies, with a source link; 3 random lists re-verified card-for-card against the live Limitless API on 2026-10-28). Open questions M1 to M10 and two decisions logged.

- Track B (card data): `docs/research/data-sources.md`. The research recommended the official card list as primary. That was overruled because the official site's terms forbid reproducing its data. Decision (ADR 0007): optcgapi.com with mechanical repairs, hand-verified overrides for every scripted card, and a hand-kept, cited `standard.json` for blocks and bans. Images are hotlinked from optcgapi with a text-only fallback; all available art carries the SAMPLE watermark.
- Phase 2: `docs/ARCHITECTURE.md` and `docs/PLAN.md` revision 2, ADRs 0001–0013, `docs/plan-review-1.md`. A skeptical-engineer review and a UX-director review found 4 severity-4 and 11 severity-3 issues; all are fixed or partly accepted with reasons. Key changes:
  - a vertical slice first (Rocks and Kaido, Pirate, learning slice, owner session), then breadth;
  - replacement hooks, last-known information and scenario starts in the engine;
  - leak-proof projection;
  - a per-turn AI budget, with iteration budgets in CI;
  - an `Explanation` schema;
  - estimate re-baselined from 264 h to about 720 h.

- Phase 3:
  - **Track E:** `effect-dsl.md`. 97.7% of clauses are tagged. All 182 meta cards are covered by 28 effect primitives, 12 costs and 17 timings. There are 7 paper scripts, including Rosinante's replacement.
  - **Track F:** `rulings.md`. 49 official rulings, with engine tests, close R1–R12, R14, S3, S4 and B4. Three corrections went into the rules digest.
  - **Track G:** 12 archetype guides, a 27-lesson curriculum, a glossary and a sources list.
  - **Guide review:** a competitive-player review found 6 severity-3 errors (misread cards, a curriculum flag that would punish correct play). All are fixed and verified against card text (`docs/content/review-1.md`).
  - **onepiece.gg scrub:** that material was removed from `strategy-concepts.md` (it disallows Anthropic agents). About 26 claims were re-sourced from Shonen TCG and Bounty TCG; 7 heuristics are now listed as gaps.

- Phase 4 (`docs/design/`):
  - **Documents:** principles, board, visual system with `tokens.css`, card-face study, flows, learning UI, 20 example explanations, accessibility (keyboard spec), usability plan.
  - **Wireframes:** 31 clickable screens (`wireframes/index.html`; press the backtick key for states).
  - **Review:** 50 findings, 22 spec conflicts resolved, and two verification passes ending in PASS, with axe at 0 violations.
  - **Carried to M3** (severity 2): the defence card preview overlaps Character slots 1–2, and tablet button sizes need fixing.

- M0:
  - design tokens in `app/src/styles/tokens.css`, which is now the source of truth;
  - Inter (48 KB) and Fraunces (37 KB, wght-only) self-hosted;
  - `scripts/contrast.ts` runs in `npm run build` and in unit tests, with 72 pairs and 0 failing;
  - an e2e test proves the fonts load and numerals are tabular.

  Tests: 6 unit and 2 e2e, all green.

- **M1 Cards** (done 2026-10-28):
  - 2,799 cards (5,079 printings) through OP-17, from optcgapi.com with audited repairs;
  - all 182 meta cards verified (189 overrides);
  - `standard.json`;
  - the art module with a text-card fallback and a working image service worker;
  - the `/cards` browser, at 70.8 KB gzipped initial JS.

  Review `docs/reviews/m1-review.md`: PASS after two fix rounds (4 + 1 severity-3 fixed). Tests: 69 unit, 36 e2e runs (720p and 1080p).
  Carried to M3: M1-37 (the Banned/Rotated chip clips the counter value at 1280) and M1-38 (the inspector header can cover the first text line at 561–640 px).

- **M2 Engine core** (done 2026-10-28): the frozen public API is implemented. It covers every non-effect rule, scenarios, replacement hooks, last-known information, the CR 8-6 pending queue, leak-proof projection (handles re-keyed in hidden zones, damage decisions that reveal nothing), versioned records with per-turn snapshots, and a semantic hash.
  - Tests: 310 engine tests, including 132 independent tests written blind; 183 todos wait for M4 effects.
  - Benchmark: median `reduce` about 4 µs.
  - Nightly property run: 10,000 games with varying seeds.
  - Review `docs/reviews/m2-review.md`: PASS after one fix round (3 severity-4 hidden-information leaks fixed, each with a test that fails against the old code).
  - Carried: M2-19 (`autoSkip` must not skip forced picks among hidden cards) must be fixed before M4a; M2-17 and the severity-1 nits go with it.

## In progress

**M3 is built** (commits 757d2c3 to d044539) and its review is running. Verified by the orchestrator:
- 392 unit tests and 69 e2e tests pass (3 skipped);
- lint, typecheck and the build pass;
- initial JS is 71.0 KB gzipped, and the board route loads lazily at 56.7 KB;
- the AI worker receives only a `PlayerView`.

Builder decisions are logged in DECISIONS (2026-10-28, M3). Not done in M3, by the builder's own account:
- drag;
- hotseat rewind consent;
- save and resume;
- the "Why?" chip on AI log lines;
- the "you look away" line;
- the forced-colours double ring.

**Review 1 (`docs/reviews/m3-review.md`, 0cfa8cc): FAIL.** It had 26 findings: 4 hotseat leaks at severity 4 and 4 findings at severity 3. **Fix round 1 is done** (405751b, c379298; CI run 40815495263 green):
- the leaks are fixed at the root with a public view and log (see DECISIONS, 2026-10-29);
- every severity-3 finding and most severity-2 findings are fixed;
- carried: M3-18 (tablet lane chip size), M3-23 (the not-built list) and some severity-1 nits.

**Re-review 1 (dc494e8): FAIL.** The leaks are confirmed fixed, and each new test catches its bug. Three new severity-3 findings are open: M3-27 (the inspector pinned after R is released kills the shortcuts), M3-28 (game over is silent after a defence) and M3-32 (touch can't stage a Counter while revealing). **Fix round 2 is done** (54e4fe0; CI run 40818609741 green): M3-27, M3-28 and M3-32 are fixed, plus M3-29 to M3-31. **Re-review 2 (5d3f3a7): FAIL.** M3-27, M3-28 and M3-32 are verified, and no severity-4 finding is open. One new severity-3 finding: M3-35, where an effect decision the veiled defender owes is shown in the opponent's wording, so a hotseat game stalls. M4a's effects reaching the defence panel exposed it. **Fix round 3 is done** (64ddfb5; CI run 40822229184 green). Veiled effect decisions now name their seat and offer "Show my hand". The public view is built from an explicit list of fields. **Re-review 3 (1321736): FAIL.** One new severity-4 leak: M3-39, where whether "Use" is enabled under the veil reveals whether the defender's hand can pay a cost. The fixes for M3-35 to M3-38 are verified. The builder is on fix round 4, a structural fix: veiled rendering becomes a pure function of the public view, enforced by types, and a differential test requires identical veiled HTML across positions that differ only in hidden information. Then re-review 4. Carried items have target milestones (DECISIONS, 2026-10-29).

The screen-reader section of the review is a proxy. A real VoiceOver or NVDA pass is still owed: it goes with owner session S1, or to the owner sooner.

**M4a is built** (builder's report; awaiting the independent-test merge and review). Commits on `main`:
- 799dfcd carried M2 findings M2-17 to M2-23;
- b260938 DSL types, script schema (`validateScript`) and registry;
- 495e4b8 the DSL runtime in `engine/src/effects/`;
- cf2e304 all 37 Rocks and Kaido scripts, 134 per-card tests, effects in the board, an e2e test that resolves Kaido's [When Attacking] through the UI;
- then the benchmark and docs.

Notes:
- **Coverage:** Rocks (OP17-039) and Kaido (OP17-058) lists 100% scripted (37 cards, `cards/effects/`).
- **Benchmark:** median 5,588 two-turn simulations per second in a `worker_threads` worker (target 1,000; ADR 0008 confirmed, no fallback). Method in `docs/benchmarks.md`; run `npm run bench:two-turn`.
- **Tests:** 633 unit tests (164 todo), 79 e2e.
- **API additions:** `Decision.purpose/source/options`, `{ option }` picks, `CardView`/`ViewCard` effect flags, `ProjectedView.looking/known/attackLock/delayed` (DECISIONS 2026-10-29, M4a).

Since the builder's report:
- **Orchestrator check** on clean main: 633 unit tests, 37 scripts, and a benchmark median of 3,949 per second with other agents running.
- **Independent card tests:** merged to main (b05c19e). After the test author adapted the kit to the API additions (no expected outcome changed), 946 tests pass and 1 is an expected fail. B-1 (EB04-040's optional "you may rest 6" cost was auto-paid) was ruled for the test author under CR 8-3-1-4. It is fixed in 6d13ba9, and the full-game e2e timeouts went up in 354e2a8 (CI run 40820443987 green). All 314 independent card tests now pass. E-Q12 stays open: an Event playable when its optional cost can't be paid, and whether DON!! −X is optional.
- **M4a review (`docs/reviews/m4a-review.md`, 70c6aa8): FAIL.** The engine core is sound: all 37 scripts match their cards, the engine leaks nothing, M2-17 to M2-23 hold, and the benchmark measured 5,106 per second.
  - Severity 4: M4a-01, the M3-39 leak plus an OP07-077 case, added to M3 fix round 4. M4a-02 is already fixed by 64ddfb5.
  - Severity 3:
    - M4a-03: [Activate: Main] can't be used from the UI.
    - M4a-04: OP17-118's [On Play] order is decided by instance id.
    - M4a-05: the log records no effects, so screen-reader users hear nothing.
  - Severity 2:
    - M4a-06: the nightly leak property's false positive.
    - M4a-07: validator traps for M4b.
    - M4a-08: DON!! −X on Events is optional, which answers E-Q12 (attribution of the ST04-016 Q&A row to be checked by hand).
    - M4a-09: prompts deviate from flows F6/F8.
  - **The builder's phase A** (engine: M4a-04, 06, 07, 08, 11, 12) is running. **Phase B** (app: M4a-03, 05, 09, 15) starts after M3 fix round 4 lands, to avoid conflicts in `app/src/play/`. Then re-review.
- **Verification caveat:** a worktree that symlinks the main tree's `node_modules` resolves `@optcg/*` to the main tree, so local "clean worktree" runs may test the wrong code. Use `npm ci` in the worktree; CI is the ground truth.

If interrupted, check `git log` and the branch, and re-launch whichever of these stopped.

## Next (slice pass, PLAN.md §1)

1. **M3 Playable board** (estimate 50 h):
   - the board per `docs/design/board.md` at 1280×720 and 1920×1080, plus the adapted sizes;
   - hotseat, and play vs Rookie (random legal moves, always blocks or counters lethal, in a Web Worker);
   - every decision type from `flows.md`: the defence panel, multi-select, Trigger, order;
   - rewind by move, the inspector, the live region, and the keyboard path from `accessibility.md`.

   It also fixes the carried items: the Phase 4 severity-2 findings and M1-37/38.
2. **M4a:** fix M2-19 first; then the DSL runtime, the Rocks and Kaido archetypes, and a throughput benchmark.
3. **M5a** (Pirate), the learning slice L, and owner usability session S1.
4. **M4b entry items** (from the M4a review, M4a-10; not reachable with the Rocks and Kaido scripts, so fix before M4b scripts can reach them):
   - one removal event over several Characters gets **one** replacement offer (QA-OP15 OP15-069: one DON!! return keeps both);
   - at the End Phase, fire [End of Your Turn], delayed "at the end of this turn" and [End of Your Opponent's Turn] effects as **one batch per player**, so the turn player can order a delayed effect against their own (CR 6-6-1-1, 8-6-1);
   - skip the source-negation check for **delayed** effects in `drainPending` (a created delayed effect does not depend on its source).

## Blockers

Owner decisions needed (not blocking progress):
- The first Track C attempt captured 62 DuelVoyager screenshots (`docs/research/teardown-shots/dv-*.png`, gitignored, local only) against DuelVoyager's robots.txt. They are unused. Deleting them was blocked by the permission system; please delete them: `rm docs/research/teardown-shots/dv-*.png`.
- Commit 80357a0 (already pushed) contains a partial teardown with DuelVoyager observations; HEAD no longer has them. Rewriting public history needs a force-push, so it is the owner's call.
- Requested before the Phase 4 gate: about 90 minutes of hands-on time with SeaKing (Learn, Hint, Rewind, Game Review) and the Bandai tutorial (open question C1). It does not block the run; if it has not happened by then, Phase 4 marks every design claim that rests on unobserved competitor behaviour.
- Card-face sign-off (`docs/design/card-face-study.md` §5) and the board disclaimer form: owner confirmation requested; neither blocks.
- Optional: contact optcgapi.com's maintainer about image hotlinking and the text errors found (open question B2).
- Card data comes from optcgapi.com, not the official list, because of the official site's terms (B1, ADR 0007). Overrule if you disagree.
