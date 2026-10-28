# Plan

**As of:** 2026-10-28 (revision 2, after the Phase 2 reviews in `docs/plan-review-1.md`)
**Companions:** `docs/ARCHITECTURE.md` (how it is built), `docs/adr/` (why).

## 1. Shape of the build: a vertical slice first, then breadth

PROMPT.md lists M0 to M10 in order, and every milestone keeps its PROMPT.md done criteria. Both Phase 2 reviewers showed that building them strictly horizontally fails the product. The learning layer, which is "the reason the product exists", would start about 70% of the way through the budget, and the time-box rule would cut it first. The engine's real throughput would also be unknown until the AI milestone.

So the milestones run in **two passes** (ADR 0012):

1. **Slice pass.** One complete, playable, teachable experience for two archetypes. Then the owner plays it.
2. **Breadth pass.** The remaining archetypes, the full AI tiers, and the rest of the learning layer.

Phases 3 and 4 still come before any engine or UI code beyond scaffolding.

| # | Work | Pass | Depends on | Estimate (h) |
| --- | --- | --- | --- | --- |
| 1 | Phase 2 gate (reviews folded in) | | | 4 |
| 2 | Phase 3 Track E: tokenizer, frequency tables, `effect-dsl.md`, five paper scripts (one is a replacement effect) | | B data | 14 |
| 3 | Phase 3 Track F: `rulings.md` | | A | 8 |
| 4 | Phase 3 Track G: 12 guides, curriculum with concept slugs, glossary, sources, competitive-player review | | D | 20 |
| 5 | Phase 4: principles, board, flows, visual system, learning UI, `accessibility.md`, `usability-plan.md`, about 20 example explanations, card-face study under the SAMPLE watermark, wireframes, review rounds | | C, E, owner hands-on (6) | 40 |
| 6 | Owner hands-on, requested before the Phase 4 gate: about 90 minutes on SeaKing (Learn, Hint, Rewind, Game Review) and the Bandai tutorial | | | (owner) |
| 7 | M0: design tokens file | slice | 5 | 1 |
| 8 | M1 Cards: pipeline, normalizers, stats and types verified for all 182 meta-list cards, `standard.json`, image module, card browser | slice | B | 16 |
| 9 | M2 Engine core: base rules, scenarios, replacement hooks, last-known information, projection hardening, versioned records, semantic hash | slice | F | 70 |
| 10 | M3 Board: hotseat, play vs **Rookie**, every decision type in the UI, rewind by move, inspector, live region, keyboard path | slice | 5, 9 | 50 |
| 11 | M4a Effects slice: DSL runtime, then **Rocks (OP17-039)** and **Kaido (OP17-058)**, about 35 cards, each with a test. Throughput benchmark on these scripted decks | slice | E, 9 | 60 |
| 12 | M5a AI slice: worker protocol, per-turn planning, Pirate, `Explanation` builder, game-plan assertions for the two playbooks | slice | 11 | 40 |
| 13 | L Learning slice: battle panel and DON!! overlay (`preview`), tiered lethal detector, lethal search (`public` and `actual`), missed-lethal review flag end to end with real copy, "Practice this" | slice | 12 | 45 |
| 14 | **Slice checkpoint:** owner usability session 1 on the real game (`usability-plan.md`); fold findings in | slice | 13 | 6 |
| 15 | M4b Effects breadth: the other 10 archetypes (about 147 cards), DSL additions | breadth | 14 | 85 |
| 16 | M5b AI breadth: Warlord, Emperor, 12 playbooks with assertions, nightly strength CI | breadth | 15 | 60 |
| 17 | M6 Deck builder | breadth | 8, 15 | 14 |
| 18 | M7 Tutorial and the rest of the coach (hint as a line, why, blunder warning, tempo meter); owner usability session 2 | breadth | 16 | 40 |
| 19 | M8 Review breadth: every flag category, timeline, restore and replay, local save, analysis time cap | breadth | 16 | 30 |
| 20 | M9 Meta explorer, matchup grid, `meta:update`, four drills (puzzles drawn from real review flags), rules reference, progress with "what to work on next" | breadth | G, 16, 17 | 40 |
| 21 | M10 Polish and release; owner usability session 3 | breadth | all | 20 |
| 22 | Overhead: the verification ritual, screenshot reviews, STATUS and DECISIONS upkeep (about 10% of the build) | | | 55 |
| | **Total** | | | **718** |

The first draft estimated 264 hours. Both reviewers called that roughly half the real figure. The new baseline is about 720 hours.

The time-box rule still applies: a milestone at 3× its estimate stops, writes the blocker in STATUS.md, ships the smallest working slice, and moves on. The slice pass exists so that this rule cuts breadth, not the learning layer.

## 2. Done criteria

Every milestone ends with:
- `npm test` and `npm run test:e2e` green;
- from M1 on, screenshots reviewed by a subagent against `docs/design/principles.md`;
- STATUS.md updated;
- a commit and a push.

| Milestone | Done when |
| --- | --- |
| M0 | Tokens file imported by the app; contrast of every token pair checked at build time |
| M1 | Every English-release card browsable with art or a text card; the diff report demonstrated against a doctored snapshot; all 182 meta-list cards `verified` for stats and types; no ambiguous type split; screenshot reviewed |
| M2 | One test per non-effect rule in the digest checklist (effect rules move to M4a/b), built from scenarios; replacement-hook test (Rosinante pattern); last-known-information tests; projection-linkage leak test; 500 random games per push and 10,000 nightly, invariants clean; golden records stable |
| M3 | Playwright plays a full hotseat game **and a full game vs Rookie**; keyboard-only run passes; manual screen-reader pass recorded; screenshots at both resolutions reviewed |
| M4a | Rocks and Kaido 100% scripted, each card with a test from official Q&A where available; benchmark recorded for scripted decks (target ≥1,000 two-turn simulations per second in a worker, or ADR 0008's fallback is triggered) |
| M5a | Pirate ≥75% vs Rookie over 200 iteration-budgeted games with Rocks and Kaido and swapped seats; AI turn ≤8 s at 1× speed; game-plan assertions pass; explanation snapshots pass |
| L | Planted missed-lethal is flagged with certainty `any-hand` and a correct line; the tiered lethal detector works; "Practice this" opens the moment as a puzzle; manual screen-reader pass recorded |
| M4b | 100% of the 182 meta-list cards scripted, each with a test; coverage shown in the browser |
| M5b | Warlord ≥95% vs Rookie, Pirate ≥75% vs Rookie, Warlord ≥65% vs Pirate over 200 games per pairing (nightly, iteration budgets, fixed deck pairs, swapped seats); every tier within budget +20%; game-plan assertions for all 12 playbooks |
| M6 | All 36 meta lists round-trip without loss; validator tests match the rules and `standard.json` |
| M7 | Owner usability session 2: tutorial finished in under 20 minutes from the local timing log, with the teach-back questions answered; coach never interrupts unprompted (test); hint returns a line |
| M8 | Planted missed-lethal and wasted-counter games flagged with sensible text and certainty labels; review of a 300-decision game finishes within 60 s with progress shown |
| M9 | Guides render with as-of dates and sources; each drill ≥20 items; puzzles include items generated from review flags; progress persists, exports, and recommends a next lesson |
| M10 | Lighthouse performance and accessibility ≥90; WCAG 2.2 AA audit with manual NVDA and VoiceOver passes; 60 fps trace during card animations on a throttled profile; deployed URL in STATUS.md |

## 3. Usability validation

`docs/design/usability-plan.md` (Phase 4) defines the sessions:
- **Who:** the owner, plus any other players the owner chooses to invite. This project cannot recruit participants, so the plan does not depend on them.
- **When:** wireframes (Phase 4), the slice checkpoint, M7, and M10.
- **Method:** think-aloud on fixed tasks, measuring completion, time and errors, plus teach-back questions such as "How many hits did you need, and why?".
- **Tutorial timing:** a local, exportable per-step log is the measure for "under 20 minutes". The Bandai tutorial is the comparison point.

Playwright measures that the flows work. It does not stand in for these sessions.

## 4. Risk register

| # | Risk | Likelihood / impact | Mitigation | Early warning |
| --- | --- | --- | --- | --- |
| 1 | **Card-text parsing and upstream errors.** | High / high | Scripts are hand-written against the DSL, never parsed from text. Sign repair is audited. Type splits are unambiguous or the run fails. All 182 meta cards are verified in M1. Changed text on a scripted card fails CI. | New `textFixes` or ambiguous splits in the diff report |
| 2 | **Effect coverage.** 182 cards, each with a script, a test and verification. | High / high | Scripting follows meta frequency, one whole archetype at a time. The slice pass proves the DSL on two archetypes first. Unscripted cards still play for their stats, with a badge. Coverage per archetype is tracked in STATUS.md. | Fewer than 3 cards per hour after the first 30 |
| 3 | **AI strength, speed and wait time.** | Medium / high | Plan per turn and reuse the tree. Incremental `derive`. Canonical picks and progressive widening over DON!! allocation. The benchmark runs on **scripted** decks in M4a, before Warlord is built. ADR 0008 names a fallback. | Under 1,000 simulations per second on scripted decks; AI turn over 8 s |
| 4 | **Data or art source** terms change, the source goes down, or it lags behind new sets. | Medium / medium | One image module with swappable sources, a text card fallback, and a bounded cache. The official parser stays documented for the day permission is granted. | Image error rate; optcgapi missing a released set for more than 14 days |
| 5 | **Scope creep in the learning layer.** | High / medium | The slice defines the learning core early. Breadth milestones have fixed done criteria. Extra ideas go to `docs/BACKLOG.md`. | Any learning milestone past 2× its estimate |
| 6 | **Meta drift.** EB05 lands 2026-10-30 and OP18 2026-11-20. | Certain / medium | Guides and playbooks are keyed by leader ID and carry an as-of date. `meta:update` flags anything older than 60 days. Refresh before M4b and at M9; do not chase the meta mid-milestone. | n/a (scheduled) |
| 7 | **Saved records invalidated by engine or card changes.** | Certain / low | Records carry versions and per-turn snapshots, and stale ones open read-only (ARCHITECTURE §2.9). | n/a |
| 8 | **Design built on unobserved competitors.** | Medium / medium | Owner hands-on time before the Phase 4 gate. Design claims that rest on unobserved behaviour are marked as such. | The owner's notes contradict a design assumption |

## 5. Test strategy per package

**cards**
- Schema validation of every generated record.
- Normalizer tests on recorded fixtures for every defect class in the Track B diff: sign loss, lost delimiters, shifted columns, NULL text, reprint disclaimers, ambiguous splits.
- Diff-report test against a doctored snapshot.
- Format-data tests: banned cards, banned pairs and block exceptions resolve to real IDs.
- A CI check that every scripted card and every meta-list card is `verified`.

**engine** (the best-tested package)
- **Fixture API frozen at the start of M2.** `createFromScenario` and assertion helpers. Independent tests are written against it by a subagent that has not seen the implementation.
- **Rules tests by CR number.** Non-effect rules land in M2; rules that need the DSL (CR 8-x, 10-2-x, 4-9, 4-12) land in M4a/b.
- **Ruling tests.** One per entry in `rulings.md`.
- **Card tests.** One per scripted card. Expected outcomes come from the official per-card Q&A where it exists, not from the script author's own reading.
- **Property tests (fast-check).**
  - random legal games with an action cap and invariants after every action;
  - `replay(record)` equals the live `summaryHash`;
  - every action in `legalActions` reduces, and sampled unlisted actions throw;
  - projection-linkage indistinguishability.
- **Property-test cadence.** 500 games per push with whatever decks are scripted; 10,000 nightly with meta decks.
- **Golden records** with expected summary hashes.
- **Benchmarks** with Vitest bench, run on scripted decks.

**ai**
- **Strength tests.** Iteration budgets, sequential seeded games, fixed deck pairs, swapped seats, thresholds from PROMPT.md. Full runs are nightly; a 20-game smoke runs per push with a wide tolerance.
- **Game-plan assertions** per playbook, checked statistically over the strength games.
- **Budgets.** p95 per decision and per turn within budget +20%.
- **AI only sees views.** Enforced by types, plus a runtime check that every chosen action appears in the view's action list.
- **Explanation snapshots** for the planted positions. Evidence numbers must match the position.
- **Lethal positions** with known answers: proven, refuted, needs a DON!! split, depends on a Trigger, cap reached.
- **Review:** the planted missed-lethal and wasted-counter records.

**app**
- Unit tests where app logic lives: session store, checkpoints, rewind by move, persistence import and export.
- **Playwright flows:**
  - tutorial;
  - hotseat game;
  - game vs Rookie and vs Pirate;
  - keyboard-only game;
  - deck import and load;
  - planted review;
  - every drill;
  - meta explorer.
- **Visual regression** at 1280×720 and 1920×1080.
- **Accessibility:** axe in every flow; manual screen-reader passes at M3, L and M7; a 60 fps performance trace at M10.

**content**
- Build-time check: every content file has `sources` and `asOf`; every card ID mentioned exists; every explorer archetype has a playbook; every `conceptId` and `lessonId` exists in the curriculum.

## 6. Folder layout

```
.github/workflows/ci.yml, deploy.yml, nightly.yml
cards/
  src/            schema.ts, dsl.ts, index.ts (lookup, coverage)
  data/           manifest.json, sets/<SET>.json          (generated)
  overrides/      <CARD-ID>.json                          (hand-verified, cited)
  effects/        <SET>/<CARD-ID>.ts                      (hand-written)
  format/         standard.json                           (hand-kept, cited)
  scripts/        update.ts, normalize.ts, types-vocab.ts, diff.ts
  test/
engine/
  src/            state.ts, setup.ts, scenario.ts, phases.ts, battle.ts, damage.ts, don.ts,
                  ops/ (atomic operations + replacement hooks), effects/ (interpreter),
                  derive.ts, legal.ts, whynot.ts, preview.ts, project.ts, replay.ts, hash.ts,
                  invariants.ts, rng.ts, index.ts
  test/           fixtures/ (frozen API), rules/, rulings/, cards/, property/, golden/, bench/
ai/
  src/            worker.ts, protocol.ts, plan.ts, tiers/, heuristic.ts, determinize.ts, prior.ts,
                  lethal.ts, analyze.ts, explain.ts, index.ts
  playbooks/      <leader-id>.json
  test/
app/
  src/            routes/, board/, battle-panel/, inspector/, coach/, review/, deckbuilder/, meta/,
                  drills/, tutorial/, rules/, progress/, settings/, art/, store/, sw.ts, styles/tokens.css
  e2e/
docs/             STATUS, DECISIONS, OPEN-QUESTIONS, PLAN, ARCHITECTURE, plan-review-1, adr/, research/,
                  design/, content/
scripts/          meta-update.ts
```

## 7. Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server for `app/` at `/optcg-sim/` |
| `npm run build` | Typecheck, then production build to `app/dist` |
| `npm test` | Vitest across all packages (per-push sizes) |
| `npm run test:nightly` | 10,000 property games and the full strength matches |
| `npm run test:e2e` | Playwright against a production build |
| `npm run lint` | ESLint (including boundary rules) and Prettier check |
| `npm run cards:update` | Fetch optcgapi.com bulk endpoints, normalize, apply overrides, write JSON, print the diff, fail on changed text of scripted cards or ambiguous type splits |
| `npm run meta:update` | Fetch tournament data from the Limitless API, refresh `meta-lists.json`, flag guides with lists older than 60 days |

## 8. CI

- **`ci.yml`** runs on every push and PR: `npm ci` → lint → typecheck → unit tests → Playwright install → e2e against a production build. Unit tests include the 500-game property test and the 20-game strength smoke.
- **`deploy.yml`** runs after CI succeeds on `main` and publishes `app/dist` to GitHub Pages.
- **`nightly.yml`** (added in M2) runs `test:nightly` and uploads the results as an artifact.

CI never calls a card or tournament API. Data updates are run locally, reviewed, and committed.
