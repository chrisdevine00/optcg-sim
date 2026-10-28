# Status

**Phase:** 1 Research (in progress)
**Milestone:** M0 scaffold started (allowed before the Phase 4 gate)
**Run the app:** `npm install && npm run dev` then open http://localhost:5173/optcg-sim/ (placeholder page only)
**Deployed:** https://chrisdevine00.github.io/optcg-sim/ (auto-deploys after green CI on `main`)

## Phase plan

| Phase | Gate deliverables | State |
| --- | --- | --- |
| 1 Research | docs/research/rules-digest.md, data-sources.md, competitive-teardown.md, meta-landscape.md, strategy-concepts.md | In progress: 4 of 5 deliverables done (A, C, D1, D2); B running |
| 2 Plan | docs/PLAN.md, docs/ARCHITECTURE.md, docs/adr/ | Drafted while B and C run (ADR 0007 waits on B); reviews not yet run |
| 3 Deep research | docs/research/effect-dsl.md, rulings.md; docs/content/archetypes/, curriculum.md, glossary.md, sources.md | Not started |
| 4 Design | docs/design/principles.md, board.md, flows.md, visual-system.md, learning-ui.md, wireframes/, review-1.md | Not started |
| 5 Build | M0 through M10 per PROMPT.md | Not started |

## Done

- Monorepo scaffold: npm workspaces `engine`, `cards`, `ai`, `app`; TypeScript strict, Vite + React, Vitest, Playwright, ESLint (with package-boundary rules) and Prettier; CI workflow green; deploy workflow publishes to GitHub Pages after green CI (live placeholder).
- Track A (rules): `docs/research/rules-digest.md` from Comprehensive Rules v1.2.1 (2026-08-28). 137 cited items, test checklist, 13 open questions copied to OPEN-QUESTIONS.md, corrections to PROMPT.md logged in DECISIONS.md.
- Track D part 2 (strategy): `docs/research/strategy-concepts.md`, 16 concepts with AI evaluation features. Open questions copied.
- Track C (UX teardown): `docs/research/competitive-teardown.md`. Hands-on for Untap.in (to its login wall) and the Bandai browser app (to its terms); secondhand for SeaKing, OPTCGSim and TTS. DuelVoyager and SeaKing disallow Anthropic agents in robots.txt, so DuelVoyager material from the first attempt was removed and is not used (see Blockers).
- Track D part 1 (meta): `docs/research/meta-landscape.md` and `meta-lists.json`. 12 archetypes by leader ID, 36 tournament lists (every list checked at 50 cards, ≤4 copies, with a source link; 3 random lists re-verified card-for-card against the live Limitless API on 2026-10-28). Open questions M1 to M10 and two decisions logged.

## In progress (resumed 2026-10-28 after a machine restart)

One research subagent is running:

- Track B (card data and art sources) → `docs/research/data-sources.md`. Raw downloads go to `.cache/track-b/` (gitignored, survives restarts).

If they are interrupted again, re-launch them with the same briefs; check whether the target file already has finished sections first.

## Next

1. When B and C report: review both documents, copy their open questions and proposed decisions into OPEN-QUESTIONS.md / DECISIONS.md, and gate Phase 1.
2. Phase 2: finish ADR 0007 from Track B, fold Track C into PLAN.md, then two reviewer subagents (skeptical senior engineer, UX director) and fold in their notes.

## Blockers

Owner decisions needed (not blocking progress):
- The first Track C attempt captured 62 DuelVoyager screenshots (`docs/research/teardown-shots/dv-*.png`, gitignored, local only) against DuelVoyager's robots.txt. They are unused. Deleting them was blocked by the permission system; please delete them: `rm docs/research/teardown-shots/dv-*.png`.
- Commit 80357a0 (already pushed) contains a partial teardown with DuelVoyager observations; HEAD no longer has them. Rewriting public history needs a force-push, so it is the owner's call.
- Optional: play one SeaKing game by hand with the checklist in `competitive-teardown.md` §2 (open question C1).
