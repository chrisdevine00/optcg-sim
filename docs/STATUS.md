# Status

**Phase:** 1 Research (in progress)
**Milestone:** M0 scaffold started (allowed before the Phase 4 gate)
**Run the app:** `npm install && npm run dev` then open http://localhost:5173/optcg-sim/ (placeholder page only)

## Phase plan

| Phase | Gate deliverables | State |
| --- | --- | --- |
| 1 Research | docs/research/rules-digest.md, data-sources.md, competitive-teardown.md, meta-landscape.md, strategy-concepts.md | In progress |
| 2 Plan | docs/PLAN.md, docs/ARCHITECTURE.md, docs/adr/ | Not started |
| 3 Deep research | docs/research/effect-dsl.md, rulings.md; docs/content/archetypes/, curriculum.md, glossary.md, sources.md | Not started |
| 4 Design | docs/design/principles.md, board.md, flows.md, visual-system.md, learning-ui.md, wireframes/, review-1.md | Not started |
| 5 Build | M0 through M10 per PROMPT.md | Not started |

## Done

- Monorepo scaffold: npm workspaces `engine`, `cards`, `ai`, `app`; TypeScript strict, Vite + React, Vitest, Playwright, ESLint (with package-boundary rules) and Prettier; CI workflow; deploy workflow (manual until M10).

## In progress

- Phase 1 Tracks A (rules), B (data sources), C (teardown), D (meta landscape, strategy concepts) running in parallel.

## Next

Phase 1, Tracks A through D, in parallel.

## Blockers

(none)
