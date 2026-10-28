# Plan

**As of:** 2026-10-28 (Phase 2 draft; awaiting Track B for the card source, Track C for UX inputs, and two reviews)
**Companion:** `docs/ARCHITECTURE.md` (how it is built), `docs/adr/` (why).

## 1. Order of work

Phases 3 and 4 come before any engine or UI code beyond scaffolding (PROMPT.md "Working rhythm"). Within Phase 5 the order is the PROMPT.md milestone order, with one change: M1 (cards) and the first half of M2 (engine core without effects) can run in parallel because neither depends on the other's code, only on the schema that already exists.

| Order | Work | Depends on | Estimate (h) |
| --- | --- | --- | --- |
| 1 | Phase 2 gate: reviews folded in | Tracks B, C | 3 |
| 2 | Phase 3 Track E: effect tokenizer over the full dump, action frequency tables, `effect-dsl.md`, five paper-scripted cards | B (card dump) | 10 |
| 3 | Phase 3 Track F: `rulings.md` (12+ topics, open questions R1–R13, S3, S4) | A | 6 |
| 4 | Phase 3 Track G: 12 archetype guides, curriculum, glossary, sources; competitive-player review | D1, D2 | 14 |
| 5 | Phase 4: principles, board, flows, visual system, learning UI, HTML wireframes, screenshots, UX-director review to zero sev-3/4 | C, E | 18 |
| 6 | M0 Scaffold (remaining: tokens file from Phase 4, README principles already in) | 5 | 1 |
| 7 | M1 Cards | B, E | 10 |
| 8 | M2 Engine core | F | 28 |
| 9 | M3 Playable board (hotseat) | 5, 8 | 26 |
| 10 | M4 Effects (DSL runtime, all meta-list cards scripted with a test each) | E, 8 | 40 |
| 11 | M5 AI (worker, four tiers, playbooks, explanations, strength tests) | 10 | 30 |
| 12 | M6 Deck builder | 7, 10 | 10 |
| 13 | M7 Tutorial and coach | 9, 11 | 20 |
| 14 | M8 Review | 11 | 16 |
| 15 | M9 Meta explorer and drills | G, 11, 12 | 20 |
| 16 | M10 Polish and release | all | 12 |
| | **Total** | | **264** |

Time-box rule: a milestone over 3× its estimate stops, writes the blocker in STATUS.md, ships the smallest working slice, and moves on.

## 2. Milestones and done criteria

Each ends with `npm test` and `npm run test:e2e` green, screenshots reviewed by a subagent against `docs/design/principles.md` (from M1 on), STATUS.md updated, commit and push.

| Milestone | Scope | Done when |
| --- | --- | --- |
| M0 Scaffold | Done except the design tokens file, which Phase 4 produces | `npm run dev` serves a page; CI runs lint, typecheck, unit and e2e; deploy after green CI |
| M1 Cards | `cards:update`, per-set JSON, manifest, diff report, format data, image module with fallbacks and service-worker cache, card browser with search and filters | Every English-release card browsable with art; diff report demonstrated against a doctored snapshot; screenshot reviewed |
| M2 Engine core | State, zones, setup and mulligan, phases, DON!!, play, give DON!!, battle steps, damage, Life and Trigger window, keywords, rule processing, legal actions, projection, replay, hash, invariants | One test per digest rule; 10,000 random games clean; golden replay hashes stable; reduce median under 20 µs for non-effect actions |
| M3 Playable board | Playmat per Phase 4, hotseat, click and drag, phase stepper, confirm and rewind, inspector, live region | Playwright plays a full hotseat game; keyboard-only run passes; screenshots at both resolutions reviewed |
| M4 Effects | DSL runtime; scripts for every card in the 36 meta lists, then by meta frequency; coverage report | 100% of meta-list cards scripted, each with a test; coverage shown in the browser |
| M5 AI | Worker protocol, Rookie, Pirate, Warlord, Emperor, 12 playbooks, reasons, lethal search | Warlord ≥95% vs Rookie, Pirate ≥75% vs Rookie, Warlord ≥65% vs Pirate over 200 seeded games; budgets within +20% on CI |
| M6 Deck builder | Build, validate (Standard: blocks, bans, pairs, colours, 4-copy by card number), import/export text and Limitless formats, alt-art choice, coverage, load into game | All 36 meta lists round-trip without loss; validator tests match the rules |
| M7 Tutorial and coach | Scripted tutorial on the real engine, hint, why, lethal detector, DON!! overlay, blunder warning, tempo meter | Moderated Playwright run finishes the tutorial in under 20 minutes; coach never interrupts unprompted (test) |
| M8 Review | Analysis in the worker, flags, timeline, restore and replay from a flag, local save | Planted missed-lethal and wasted-counter games flagged with sensible text |
| M9 Meta and drills | Explorer grid, guides, matchup grid, `meta:update`, four drills (≥20 items each), rules reference, progress with export/import | Guides render with as-of dates and sources; drill flows pass in Playwright |
| M10 Polish and release | Performance, accessibility audit, reduced motion, offline, About page, deploy | Lighthouse performance and accessibility ≥90; WCAG 2.2 AA; deployed URL in STATUS.md |

## 3. Risk register

| # | Risk | Likelihood / impact | Mitigation | Early warning |
| --- | --- | --- | --- | --- |
| 1 | **Card-text parsing.** Effect text is natural language with many one-off wordings; automatic parsing will misread cards. | High / high | Do not parse text into scripts. Track E tokenizes text only to measure the vocabulary; every script is hand-written against the DSL with a test, and the diff report fails CI when a scripted card's text changes. | Tokenizer leaves more than 10% of meta-card clauses untagged |
| 2 | **Effect coverage.** 36 lists across 12 archetypes mean several hundred distinct cards, each a script plus a test. | High / high | Implement DSL actions in meta-frequency order; script whole archetypes at a time so each becomes fully playable early; unscripted cards still play for stats with a badge. Track coverage per archetype in STATUS.md. | M4 velocity under 6 cards/hour after the first 50 |
| 3 | **AI strength versus speed.** ISMCTS in a browser worker within 1.5 s may be too shallow in a game with long turns and hidden hands. | Medium / high | Keep reduce allocation-light (copy on write, memoized derive); action abstraction (one pick at a time); playbook priors for move ordering; turn-scoped search with a heuristic at end of turn; fallback to expectimax over the current turn. Benchmark in M2 before writing the AI. | Fewer than 2,000 simulations per second in the M2 benchmark |
| 4 | **Art-source terms change** or the source goes down. | Medium / medium | One image module with one base URL per source, a fallback source, a text-only card that keeps the game playable, and a service-worker cache. Terms and the date checked are recorded in ADR 0007. | Image error rate in the card browser smoke test |
| 5 | **Scope creep in the learning layer.** Coach, review, drills and guides can absorb unlimited time. | High / medium | The learning layer ships in the PROMPT.md order (coach M7, review M8, drills M9) with fixed done criteria; every additional idea goes to `docs/BACKLOG.md`. Content claims need a source or an *(inference)* mark, which caps writing effort. | Any M7–M9 milestone passing 2× its estimate |
| 6 | **Meta drift.** EB05 (2026-10-30) and OP18 (2026-11-20) change the format during the build. | Certain / medium | Guides and playbooks key on leader ID with an as-of date; `meta:update` flags lists older than 60 days; card data updates only through `cards:update`. Do not chase the meta mid-milestone; refresh at M9. | n/a (scheduled) |

## 4. Test strategy per package

**cards**
- Schema validation of every generated record (required fields, enums, numeric ranges).
- `cards:update` normalizer unit tests against recorded fixtures (no network in CI).
- Diff report test against a doctored snapshot (added, changed, removed card; changed text on a scripted card fails).
- Format data tests: every banned card and pair exists; block exceptions resolve to real IDs.

**engine** (the best-tested package)
- One test per rule in the digest's "Engine test checklist", named by CR number (`CR 6-5-6-1 neither player battles on their first turn`).
- One test per ruling in `docs/research/rulings.md`.
- One test per scripted card: minimal board, activate, assert state and events.
- Property tests (fast-check): 10,000 random legal games to completion; `checkInvariants` after every action; `replay(record)` hash equals the live hash; `project` never leaks a hidden card ID (fuzz the view for any card ID not visible to that player).
- Golden replays: a set of committed `GameRecord`s with expected final hashes; a hash change fails until reviewed.
- Benchmarks (Vitest bench, not gating): reduce, legalActions and derive throughput.
- Tests are written by a subagent that has not seen the implementation, from the digest and rulings alone (PROMPT.md "writing tests against the engine independently of the engine's author").

**ai**
- Strength matches as Vitest tests with seeded games: thresholds from PROMPT.md, run nightly at 200 games and on every push at 40 games with a wider tolerance.
- Budget test per tier: p95 decision time within budget +20% on CI.
- The AI only consumes `PlayerView` (type-level) and only returns actions present in `legalActions(view)` (runtime check over every decision in the strength matches).
- Every decision has a non-empty `reason` that references a known concept ID.
- Lethal search: hand-built positions with known answers (forced win, no win, win only with correct DON!! allocation).
- Review: the planted missed-lethal and wasted-counter records are flagged with the right category.

**app**
- Component tests only where logic lives in the app (session store, checkpoint cache, persistence import/export).
- Playwright flows: tutorial, full game vs AI, keyboard-only game, deck import and load, review of a planted game, each drill, meta explorer.
- Visual regression at 1280×720 and 1920×1080: board, inspector, coach panel, review timeline, meta explorer.
- axe-core checks in every Playwright flow; contrast verified from the tokens file at build time.

**content**
- Build-time check: every content file has `sources` and `asOf`; every card ID mentioned exists; every explorer archetype has a playbook.

## 5. Folder layout

```
.github/workflows/ci.yml, deploy.yml
cards/
  src/            schema.ts, dsl.ts (effect DSL types), index.ts (lookup, coverage)
  data/           manifest.json, sets/<SET>.json          (generated)
  effects/        <SET>/<CARD-ID>.ts                       (hand-written, one per card)
  format/         standard.json                            (blocks, bans, pairs, dates, sources)
  scripts/        update.ts, normalize.ts, diff.ts
  test/
engine/
  src/            state.ts, setup.ts, phases.ts, battle.ts, damage.ts, don.ts, effects/ (interpreter),
                  derive.ts, legal.ts, project.ts, replay.ts, hash.ts, invariants.ts, rng.ts, index.ts
  test/           rules/ (by CR section), rulings/, cards/, property/, golden/
ai/
  src/            worker.ts, protocol.ts, tiers/ (rookie, pirate, ismcts), heuristic.ts, determinize.ts,
                  lethal.ts, analyze.ts, explain.ts, index.ts
  playbooks/      <leader-id>.json
  test/
app/
  src/            routes/, board/, inspector/, coach/, review/, deckbuilder/, meta/, drills/, tutorial/,
                  rules/, settings/, art/ (image module), store/, sw.ts, styles/tokens.css
  e2e/
docs/             STATUS, DECISIONS, OPEN-QUESTIONS, PLAN, ARCHITECTURE, adr/, research/, design/, content/
scripts/          meta-update.ts
```

## 6. Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server for `app/` at `/optcg-sim/` |
| `npm run build` | Typecheck, then production build to `app/dist` |
| `npm test` | Vitest across all packages |
| `npm run test:e2e` | Playwright against a production build |
| `npm run lint` | ESLint (including boundary rules) and Prettier check |
| `npm run cards:update` | Fetch from the Track B source, normalize, write JSON, print the diff, fail on changed text of scripted cards |
| `npm run meta:update` | Fetch tournament data from the Limitless API, refresh `meta-lists.json`, flag guides with lists older than 60 days |

## 7. CI

`ci.yml` on every push and PR: `npm ci` → lint → typecheck → unit tests (including 40-game AI strength smoke and the 10,000-game property test from M2) → Playwright install → e2e against a production build. `deploy.yml` runs after CI succeeds on `main` and publishes `app/dist` to GitHub Pages. A nightly scheduled job (added in M5) runs the full 200-game strength matches and uploads the results as an artifact. CI never calls a card or tournament API; data updates are local, reviewed, and committed.
