# Plan review 1 (Phase 2 gate)

**Date:** 2026-10-28
**Reviewed:** `docs/PLAN.md` and `docs/ARCHITECTURE.md` revision 1 (commit e55d0b1), plus ADRs 0001–0011.
**Reviewers:** two subagents, each given the documents and the evidence but not the author's reasoning:
- **ENG**, a skeptical senior engineer;
- **UX**, a demanding UX director.

**Result:** every severity 3–4 finding is accepted, and the fix is in revision 2 of both documents and in the ADRs. Two findings are only partly accepted because they need people this project cannot supply; the reasons are below.

Status key: **Accepted** means fixed in revision 2. **Partial** means part of the fix is in, with the rest explained.

## Severity 4

| # | Finding | Disposition | Where |
| --- | --- | --- | --- |
| ENG-1 | The 264-hour estimate is about half the real figure. M4 alone is 100–130 h (182 cards). There is no overhead line. | **Accepted.** Re-baselined to about 720 h, with an overhead line and the effect rules moved to M4a/b. | PLAN §1 |
| UX-1 | The learning layer starts about 70% of the way through and is what the time-box would cut. There is nothing to learn from early. | **Accepted.** A vertical slice comes first: play vs Rookie at M3; Rocks and Kaido with Pirate; then the learning slice; then an owner session. | PLAN §1, ADR 0012 |
| UX-2 | No testing with real people. A "moderated Playwright run" measures runtime, not understanding. | **Partial.** `usability-plan.md` is a Phase 4 deliverable. There are owner sessions at the wireframes, the slice checkpoint, M7 and M10, with think-aloud, teach-back and a local timing log. Other participants are at the owner's discretion: this project cannot recruit, and it must not add analytics. | PLAN §3 |

## Severity 3

| # | Finding | Disposition | Where |
| --- | --- | --- | --- |
| ENG-2 | No replacement-effect model, no last-known information, no way to follow a card across its ID change. | **Accepted.** Replacement hooks at every atomic-operation choke point, LKI snapshots on events, and `renames`. Rosinante is the reference test. | ARCH §2.2, §2.4; ADR 0013 |
| ENG-3 / UX-6 | Games can only start from a seed. The tutorial, drills, puzzles, "show me" and the tests need positions. | **Accepted.** `createFromScenario`, and records can start from a scenario. | ARCH §2.1, §2.9; ADR 0013 |
| UX-6 | The API has no `whyNot`, no `preview`, and no grouping of actions into player moves. | **Accepted.** `whyNot`, `preview` and `intentId` added. | ARCH §2.1, §2.3 |
| ENG-4 | Saved records desync when cards get scripted. The raw-state hash breaks on refactors. | **Accepted.** Versioned records, per-turn snapshots, read-only stale records, actions that name instance IDs, and a semantic `summaryHash`. | ARCH §2.9; ADR 0004 |
| ENG-5 / UX-5 | 1.5 s per decision means 30–60 s AI turns. Wall-clock budgets make CI non-deterministic and take hours. | **Accepted.** A per-turn plan with tree reuse, free forced moves, search during animations, a ≤8 s turn target, iteration budgets in CI, nightly full matches and a 20-game smoke per push. | ARCH §4.1; ADR 0008 |
| ENG-6 | The throughput gate is measured before effects exist. `derive` is recomputed for every state. | **Accepted.** The benchmark runs on scripted decks in M4a. `derive` is incremental. | ARCH §2.5; PLAN M4a |
| ENG-7 | Projection leaks through instance IDs, shuffles, hand order and stack locals. | **Accepted.** IDs drawn from the RNG, opaque handles re-keyed on shuffle, canonical opponent hand order, redacted locals, and a permutation-indistinguishability test. | ARCH §2.2, §2.7; ADR 0005 |
| UX-3 | The explanation pipeline is decorative: MCTS has no reasons, concept IDs don't exist yet, and a hint is a single action. | **Accepted.** A typed `Explanation` built from heuristic feature differences, with concept slugs defined in Phase 3, about 20 example explanations reviewed by the owner and used as snapshot tests, and hints that return a whole line. | ARCH §4.5 |
| UX-4 | Lethal is detected, not taught. "Puzzles from review flags" was dropped. There are no certainty labels. Full-information review conflicts with the hidden-counter search. | **Accepted.** A tiered detector (exists → number of hits → full line) with a guided count, "Practice this", puzzles drawn from flags, progress recommendations, and two lethal modes (`public`, `actual`) with certainty labels. | ARCH §4.4, §4.5; PLAN L, M8, M9 |
| UX-7 | Interaction consequences of the engine model: picks, staging counters, prompt fatigue, rewind granularity, hotseat vs open hands. | **Accepted.** The engine side is done: canonical picks, auto-skip with "always ask", rewind by move, rewinds excluded from statistics, and open hands as a separate setting. Counter staging, multi-select commit, and confirm vs undo are assigned to Phase 4 `flows.md`. | ARCH §2.3, §5 |
| UX-8 | SeaKing was never observed, and C1 contradicts STATUS ("optional"). | **Partial.** About 90 minutes of owner hands-on time is requested before the Phase 4 gate, and OPlayTCG and OPTCG Web Sim get robots and terms checks. Under CLAUDE.md, the owner's time cannot block the autonomous run. If the hands-on has not happened by the gate, Phase 4 marks every design claim that rests on unobserved competitor behaviour, and the slice checkpoint revisits them. | PLAN §1 row 6, risk 8 |

## Severity 2 and 1

| # | Finding | Disposition |
| --- | --- | --- |
| ENG-8 | Determinization samples from the human's real list and omits the AI's own hidden zones. | Accepted: archetype prior, the AI's own zones sampled too, knowledge per zone (ARCH §4.3). |
| ENG-9 | "Exact" lethal against unknown hands is almost never provable, and Triggers are hidden. | Accepted: proven / refuted / unknown, public and actual modes, Triggers as chance nodes, a transposition table (ARCH §4.4). |
| ENG-10 | Invariants hard-code 10 DON!! and 61 cards; OP15-058 Enel has a 6-card DON!! deck. | Accepted (confirmed in `meta-landscape.md`): invariants are computed from setup (ARCH §2.6). |
| ENG-11 | `legalActions(view)` cannot work, because `derive` needs state. Picks need lookahead and a canonical order. | Accepted (ARCH §2.1, §2.3). |
| ENG-12 | The CR lets the turn player order permanent effects, and effects may never reach a fixed point. | Accepted: canonical layers, an iteration cap that logs an anomaly, and OPEN-QUESTIONS R14 (ARCH §2.5). |
| ENG-13 | Rules tests in M2 need the DSL; independent tests need a frozen fixture API; card tests repeat the script author's reading. | Accepted: effect rules move to M4, the fixture API is frozen at the start of M2, card tests come from official Q&A, plus a property that every listed action reduces and unlisted ones throw. Property games run 500 per push and 10,000 nightly (PLAN §5). |
| ENG-14 | Data pipeline: optcgapi lags new sets, type splits are ambiguous, scripted searches depend on unscripted types, printings disagree, and opaque responses inflate cache quota. | Accepted: all 182 meta cards verified in M1, the run fails on ambiguous splits, printings reconciled, a bounded LRU image cache, and a lag warning in risk 4 (ARCH §3, §5). |
| ENG-15 | No test for "plays the game plan", no 60 fps test, no time cap on review, worker contention between the coach and the AI. | Accepted: playbook game-plan assertions, a 60 fps trace at M10, review of a 300-decision game in under 60 s with progress, and worker priority with a 300 ms blunder-warning cap (ARCH §4.6, §5; PLAN M8, M10). |
| ENG-16 | No loop detector and no action cap. | Accepted (ARCH §2.6). |
| UX-9 | Accessibility gaps: no keyboard spec, timed puzzles vs WCAG 2.2.1, target size, focus hidden by zoom, screen-reader detail for AI turns. | Accepted: `accessibility.md` in Phase 4 with the keyboard spec; manual screen-reader passes at M3, L and M7; drill timers adjustable and switchable off, and curriculum exit criteria that use timing only when it is enabled. |
| UX-10 | Every card image carries the SAMPLE watermark, which undercuts "card art is the hero". | Accepted: a card-face study in Phase 4, with early owner sign-off. |
| UX-11 | 18 h is too little for Phase 4. | Accepted: 40 h, with real explanation copy in the wireframes. |
| UX-12 | First launch should branch between "I know the rules" and a beginner; Progress should recommend what to work on next. | Accepted: the first-launch branch goes into Phase 4 `flows.md`; Progress's recommendation is in the M9 done criteria. |
