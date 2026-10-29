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

### M3 Playable board: code passes review; the screen-reader pass is outstanding
- **Review:** `docs/reviews/m3-review.md` went through 4 fix rounds and 4 re-reviews. Re-review 4 (2c203ce) is a PASS, with no severity 3 or 4 open.
  - The hotseat hidden-information leaks were fixed structurally: veiled screens render only from a branded `PublicView`, and a differential test requires identical veiled screens across hidden-card variations (DECISIONS, 2026-10-29).
  - M3-41 to M3-43 were fixed in d3ed657.
- **Carried, with targets:** M3-18 (M10), M3-23 (DECISIONS, 2026-10-29).
- **Last exit criterion, the screen-reader pass** (PLAN M3; accessibility.md §11.2):
  - An agent is running the scripted NVDA pass with Guidepup on a Windows GitHub Actions runner (`workflow_dispatch`), recording to `docs/design/a11y-passes/`.
  - M3 is marked done when that record has no open severity 3 or 4 finding.
  - The VoiceOver pass is the owner's (see Blockers).

### M4a Effects slice: fixed, in re-review
- **Built:** 37 Rocks and Kaido scripts, the DSL runtime, and a benchmark of about 4,000 to 5,600 two-turn simulations per second in a worker (target 1,000; ADR 0008 confirmed).
- **Independent card tests:** 314 black-box tests, merged in b05c19e. One rules disagreement (B-1, optional Event costs) was ruled under CR 8-3-1-4 and fixed.
- **Review** `docs/reviews/m4a-review.md` (70c6aa8): FAIL, then fixed in two phases:
  - **Phase A, engine** (292f730): ordered [On Play]s, the nightly false positive, the validator, DON!! −X optional (E-Q12 closed, RL-52), the hash.
  - **Phase B, app** (d3ed657): [Activate: Main] in the UI, effect log lines and announcements, prompts matching flows F6 and F8, setup copy.

  ENGINE_VERSION is 0.5.2.
- **CI:** 2 min 35 s, with Playwright in 3 shards and per-push full games starting from a late-game scenario. The turn-1 full games run nightly (`E2E_FULL=1`).
- **Re-review 1 is running.** When it passes, M4a is done.

### Verification caveats
- A worktree that symlinks the main tree's `node_modules` resolves `@optcg/*` to the main tree. Use `npm ci` in the worktree.
- Set `E2E_PORT`, so you don't reuse another copy's preview server.
- CI is the ground truth.

## Next (slice pass, PLAN.md §1)

1. **M5a AI slice** (estimate 40 h): per-turn planning (ADR 0008), the **Pirate** tier, the `Explanation` builder, and game-plan assertions for the Rocks and Kaido playbooks. It also takes the carried "Why?" chip on AI log lines (M3-23).
2. **L Learning slice:** the battle panel and DON!! overlay (`preview`), the tiered lethal detector, lethal search, the missed-lethal review flag end to end, and "Practice this". Then a manual screen-reader pass.
3. **Owner usability session S1** on the real game (`usability-plan.md`).
4. **M4b entry items** (from the M4a review, M4a-10; not reachable with the Rocks and Kaido scripts, so fix before M4b scripts can reach them):
   - one removal event over several Characters gets **one** replacement offer (QA-OP15 OP15-069: one DON!! return keeps both);
   - at the End Phase, fire [End of Your Turn], delayed "at the end of this turn" and [End of Your Opponent's Turn] effects as **one batch per player**, so the turn player can order a delayed effect against their own (CR 6-6-1-1, 8-6-1);
   - skip the source-negation check for **delayed** effects in `drainPending` (a created delayed effect does not depend on its source).

## Blockers

Owner decisions needed (not blocking progress):
- **M3 VoiceOver pass:** please run the VoiceOver passes in `docs/design/a11y-passes/README.md` when convenient. That's either a 30-minute listening pass by hand with the §11.3 script, or the scripted Guidepup run, whose setup step changes macOS settings, so it's your choice to run it.
- The first Track C attempt captured 62 DuelVoyager screenshots (`docs/research/teardown-shots/dv-*.png`, gitignored, local only) against DuelVoyager's robots.txt. They are unused. Deleting them was blocked by the permission system; please delete them: `rm docs/research/teardown-shots/dv-*.png`.
- Commit 80357a0 (already pushed) contains a partial teardown with DuelVoyager observations; HEAD no longer has them. Rewriting public history needs a force-push, so it is the owner's call.
- Requested before the Phase 4 gate: about 90 minutes of hands-on time with SeaKing (Learn, Hint, Rewind, Game Review) and the Bandai tutorial (open question C1). It does not block the run; if it has not happened by then, Phase 4 marks every design claim that rests on unobserved competitor behaviour.
- Card-face sign-off (`docs/design/card-face-study.md` §5) and the board disclaimer form: owner confirmation requested; neither blocks.
- Optional: contact optcgapi.com's maintainer about image hotlinking and the text errors found (open question B2).
- Card data comes from optcgapi.com, not the official list, because of the official site's terms (B1, ADR 0007). Overrule if you disagree.
