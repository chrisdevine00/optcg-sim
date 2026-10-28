# Status

**Phase:** 1 Research (in progress)
**Milestone:** M0 scaffold started (allowed before the Phase 4 gate)
**Run the app:** `npm install && npm run dev` then open http://localhost:5173/optcg-sim/ (placeholder page only)
**Deployed:** https://chrisdevine00.github.io/optcg-sim/ (auto-deploys after green CI on `main`)

## Phase plan

| Phase | Gate deliverables | State |
| --- | --- | --- |
| 1 Research | docs/research/rules-digest.md, data-sources.md, competitive-teardown.md, meta-landscape.md, strategy-concepts.md | In progress: 2 of 5 deliverables done (A, D2) |
| 2 Plan | docs/PLAN.md, docs/ARCHITECTURE.md, docs/adr/ | Not started |
| 3 Deep research | docs/research/effect-dsl.md, rulings.md; docs/content/archetypes/, curriculum.md, glossary.md, sources.md | Not started |
| 4 Design | docs/design/principles.md, board.md, flows.md, visual-system.md, learning-ui.md, wireframes/, review-1.md | Not started |
| 5 Build | M0 through M10 per PROMPT.md | Not started |

## Done

- Monorepo scaffold: npm workspaces `engine`, `cards`, `ai`, `app`; TypeScript strict, Vite + React, Vitest, Playwright, ESLint (with package-boundary rules) and Prettier; CI workflow green; deploy workflow publishes to GitHub Pages after green CI (live placeholder).
- Track A (rules): `docs/research/rules-digest.md` from Comprehensive Rules v1.2.1 (2026-08-28). 137 cited items, test checklist, 13 open questions copied to OPEN-QUESTIONS.md, corrections to PROMPT.md logged in DECISIONS.md.
- Track D part 2 (strategy): `docs/research/strategy-concepts.md`, 16 concepts with AI evaluation features. Open questions copied.

## In progress (interrupted 2026-10-28 ~09:40 by a machine restart)

The three research subagents below were killed by the restart. Their partial outputs are uncommitted on disk:

- Track B (card data and art sources) → `docs/research/data-sources.md`: not written yet. Raw dumps were going to the session scratchpad (lost). **Re-run from scratch.**
- Track C (simulator UX teardown) → `docs/research/competitive-teardown.md`: not written yet. 62 screenshots exist in `docs/research/teardown-shots/` (gitignored, local only). **Re-run; reuse the existing screenshots where they cover a step.**
- Track D part 1 (meta landscape) → `docs/research/meta-landscape.md`: not written yet. `docs/research/meta-lists.json` (80 KB, uncommitted) is a partial list collection: **verify each list sums to 50 and has a source before keeping it; then finish the archetype ranking and write meta-landscape.md.**

## Next

1. Re-launch Tracks B, C, D1 as parallel subagents with the briefs described in PROMPT.md Phase 1 (each writes only its own file; orchestrator copies open questions and proposed decisions into OPEN-QUESTIONS.md / DECISIONS.md).
2. Gate Phase 1 when all five deliverables exist; then Phase 2 (PLAN.md, ARCHITECTURE.md, ADRs, two reviewer subagents).

## Blockers

(none)
