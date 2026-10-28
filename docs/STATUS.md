# Status

**Phase:** 2 Plan (drafted; reviews next). Phase 1 gated 2026-10-28.
**Milestone:** M0 scaffold started (allowed before the Phase 4 gate)
**Run the app:** `npm install && npm run dev` then open http://localhost:5173/optcg-sim/ (placeholder page only)
**Deployed:** https://chrisdevine00.github.io/optcg-sim/ (auto-deploys after green CI on `main`)

## Phase plan

| Phase | Gate deliverables | State |
| --- | --- | --- |
| 1 Research | docs/research/rules-digest.md, data-sources.md, competitive-teardown.md, meta-landscape.md, strategy-concepts.md | **Gated 2026-10-28** (all five deliverables) |
| 2 Plan | docs/PLAN.md, docs/ARCHITECTURE.md, docs/adr/ | Drafted (PLAN, ARCHITECTURE, ADRs 0001–0011); two reviews not yet run |
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
- Phase 2 drafts: `docs/ARCHITECTURE.md`, `docs/PLAN.md` (264 h estimate, risk register, test strategy, layout, scripts, CI), ADRs 0001–0011.

## In progress

Nothing running.

## Next

1. Phase 2 gate: two reviewer subagents on PLAN.md and ARCHITECTURE.md, one as a skeptical senior engineer and one as a UX director. Fold in their notes, then gate.
2. Phase 3: Tracks E (effect DSL from the optcgapi dump), F (rulings), G (archetype guides, curriculum, glossary, sources) in parallel.

## Blockers

Owner decisions needed (not blocking progress):
- The first Track C attempt captured 62 DuelVoyager screenshots (`docs/research/teardown-shots/dv-*.png`, gitignored, local only) against DuelVoyager's robots.txt. They are unused. Deleting them was blocked by the permission system; please delete them: `rm docs/research/teardown-shots/dv-*.png`.
- Commit 80357a0 (already pushed) contains a partial teardown with DuelVoyager observations; HEAD no longer has them. Rewriting public history needs a force-push, so it is the owner's call.
- Optional: play one SeaKing game by hand with the checklist in `competitive-teardown.md` §2 (open question C1).
- Optional: contact optcgapi.com's maintainer about image hotlinking and the text errors found (open question B2).
- Card data comes from optcgapi.com, not the official list, because of the official site's terms (B1, ADR 0007). Overrule if you disagree.
