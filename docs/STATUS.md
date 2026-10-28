# Status

**Phase:** 3 Deep research (next). Phases 1 and 2 gated 2026-10-28.
**Milestone:** M0 scaffold started (allowed before the Phase 4 gate)
**Run the app:** `npm install && npm run dev` then open http://localhost:5173/optcg-sim/ (placeholder page only)
**Deployed:** https://chrisdevine00.github.io/optcg-sim/ (auto-deploys after green CI on `main`)

## Phase plan

| Phase | Gate deliverables | State |
| --- | --- | --- |
| 1 Research | docs/research/rules-digest.md, data-sources.md, competitive-teardown.md, meta-landscape.md, strategy-concepts.md | **Gated 2026-10-28** (all five deliverables) |
| 2 Plan | docs/PLAN.md, docs/ARCHITECTURE.md, docs/adr/ | **Gated 2026-10-28** (revision 2 after two reviews; see docs/plan-review-1.md) |
| 3 Deep research | docs/research/effect-dsl.md, rulings.md; docs/content/archetypes/, curriculum.md, glossary.md, sources.md | Not started |
| 4 Design | docs/design/principles.md, board.md, flows.md, visual-system.md, learning-ui.md, wireframes/, review-1.md | Not started |
| 5 Build | M0 through M10 per PROMPT.md | Not started |

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

## In progress

Nothing running.

## Next

1. Phase 3, in parallel:
   - **Track E:** tokenize the optcgapi dump, build action frequency tables (pool and the 12 archetypes), write `effect-dsl.md`, and five paper scripts (one replacement effect).
   - **Track F:** `rulings.md`, covering open questions R1–R14, S3, S4 and B4.
   - **Track G:** 12 archetype guides, the curriculum with stable concept slugs, the glossary and sources, then a competitive-player review.
2. Phase 4 (40 h), including `accessibility.md`, `usability-plan.md`, about 20 example explanations, and the card-face study.

## Blockers

Owner decisions needed (not blocking progress):
- The first Track C attempt captured 62 DuelVoyager screenshots (`docs/research/teardown-shots/dv-*.png`, gitignored, local only) against DuelVoyager's robots.txt. They are unused. Deleting them was blocked by the permission system; please delete them: `rm docs/research/teardown-shots/dv-*.png`.
- Commit 80357a0 (already pushed) contains a partial teardown with DuelVoyager observations; HEAD no longer has them. Rewriting public history needs a force-push, so it is the owner's call.
- Requested before the Phase 4 gate: about 90 minutes of hands-on time with SeaKing (Learn, Hint, Rewind, Game Review) and the Bandai tutorial (open question C1). It does not block the run; if it has not happened by then, Phase 4 marks every design claim that rests on unobserved competitor behaviour.
- Optional: contact optcgapi.com's maintainer about image hotlinking and the text errors found (open question B2).
- Card data comes from optcgapi.com, not the official list, because of the official site's terms (B1, ADR 0007). Overrule if you disagree.
