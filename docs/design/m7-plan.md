# M7 plan: the tutorial and the rest of the coach

2026-11-25. PLAN row 18 (40 h); done criteria (PLAN §2): owner usability session 2 with the tutorial finished in under 20 minutes from the local timing log and the teach-back answered; the coach never interrupts unprompted (test); hint returns a line. Planned by a planning agent from PROMPT.md, PLAN, `learning-ui.md`, `flows.md`, `accessibility.md`, `usability-plan.md`, `curriculum.md` and the L-slice code; decisions in DECISIONS 2026-11-25 "M7 plan".

## Reuse

- **ai/**: the worker protocol and priority queue (`protocol.ts`, `worker.ts`), `AiSession`, Pirate/Warlord `planTurn` and `decide`, the public-only "Why?" builder (`search/why.ts`, guarded by `why-differential`), `explain.ts`, the `Explanation` types and `certaintyLabel`, the lethal solver (`search/lethal/*`), `knowledge.ts`, `playbookFor`.
- **app/**: `Coach` / `CoachHost` (tiered detector, always-on, position-keyed results, second worker holding only the player's data), `ExplanationView`, `BattleExtras`, `CoachProfile`, "DON!! math on the board", `GameController` (`aiPort` / `coachPort` injection, `restore`, `act`, `announce`, `whyAt`), `politeQueue`, focus rescue, `Decision.tsx`, the scenario loader and S1 `ub-*` starts, the review routes.
- **engine/**: `createFromScenario`, `legalActions`, `whyNot`, `preview`, `projectForSearch`, `determinize`, `queries`, `projectEvents`.

## Work packages

| WP | Scope | Area | Size | Depends on |
| --- | --- | --- | --- | --- |
| WP0 | Contracts and seams: `hint` / `score` / `threat` worker requests and result types (`ai/src/coach/types.ts`), worker dispatch stubs and priorities, `CoachPort`, profile fields, controller seams (`tutorial.allow`, `commitGate`, `stage`), `Decision.tsx` `noteSlot` and `commitLabel`, tutorial types (`TutorialStep`, `TutorialTimingLog` per usability-plan §7.1) | ai, app | 3 h | — |
| WP1 | Hint as a line: Warlord plan in the coach worker with a public-fingerprint seed, second-person E15 explanation, alternatives; "hint returns a line" test over ~50 seeded positions; hidden-information differential; budget | ai | 8 h | WP0 |
| WP2 | Blunder scoring (missed lethal, unused DON!!, value gap with a corpus-tuned threshold) and the DON!! tempo ledger shared with M8 | ai | 6 h | WP0 |
| WP3 | Opponent's-turn threat check: a foreign `main` decision keeps a public skeleton (engine, leak and skeleton-diff properties), threat search that ignores their hand and says so | engine, ai | 6 h | WP0 |
| WP4 | Coach panel: Hint / Why / Lethal / Math / Tempo strip, hint states, Do step 1, threat wiring, hotseat line; unit and e2e (keyboard, axe, hidden-information pair, screenshots) | app | 10 h | WP0 (WP1–3 for real-worker wiring) |
| WP5 | Blunder gate (300 ms, Commit anyway, mute), minimal Settings (coach, tutorial timing export), the interruption-contract tests (unit and e2e) | app | 6 h | WP4 |
| WP6 | Tutorial: 8 scripted steps on the real engine, scripted opponent, allowed-action filter (never adds a legal action), leave and resume, local timing log with JSON/CSV export, Home welcome question, first-game preset; unit and e2e (pointer and keyboard-only runs, axe, no network) | app, content | 14 h | WP0 |
| WP7 | S2 kit and scenarios (`ub-hint-1`, `ub-why-1`, `ub-blunder-1`), NVDA harness script, doc fixes, independent review `docs/reviews/m7-review.md` | docs, app | 4 h | all |

Parallel after WP0: WP1, WP2, WP3 and WP6 touch disjoint files; WP4 then WP5 run in sequence (both touch `coach.ts` and `Decision.tsx`); WP7 last. Cut order if time runs short: "Other lines" under a hint, tier 3 of the threat check, the Math tab, mute-by-kind, the CSV export.

## Tutorial

Steps `t1-zones`, `t2-first-turn`, `t3-don-and-power`, `t4-attack`, `t5-defend`, `t6-trigger`, `t7-leader`, `t8-winning`: one fixed-seed `ScenarioSpec` each, a scripted Rookie opponent through `config.aiPort`, an allowed-action filter over the engine's own legal actions (no rules logic in the app), step back only, coach hidden. Decks (lead decision, DECISIONS "M7 plan"): **ST-21** (Monkey.D.Luffy, a true `[DON!! x1] [Activate: Main]` Leader for t7) for the player and **ST-22** for the opponent, both fully playable since M6b. The scenarios name exact cards; the complete 50-card product decklists are an owner check on the official product page (OPEN-QUESTIONS). Timing log in `localStorage` (`optcg.tutorial.timing.v1`, last 20 runs; IndexedDB is M8), exported as JSON and CSV with no network.

## Doc conflicts settled in M7

`H` moves focus to the hint result (DECISIONS L-11; fix accessibility.md §3.12's `H` row); the coach keeps its own worker (fix ARCHITECTURE §5); the tutorial copy in flows.md F2 is rewritten around ST-21 / ST-22; learning-ui.md gets the step IDs.

## Owner

Session 2 (usability-plan §5.3, §7): fresh browser profile, task cards 2.1–2.5, teach-back sheet, timing log exported locally. Run S1 first if possible. Read the ST-21 and ST-22 product decklists on the official site. Say whether a beginner can be invited.
