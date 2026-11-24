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
| 13 | L Learning slice: battle panel and DON!! overlay (`preview`), tiered lethal detector, lethal search (`public` and `actual`), missed-lethal review flag end to end with real copy, "Practice this" | *(Not in row 13, owned elsewhere, DECISIONS 2026-11-05 "L fix round": opponent's-turn threat check M7; "Practised" mark and "lethal given away" M8; hindsight-puzzle label and harder any-hand hand M9.)* slice | 12 | 45 |
| 14 | **Slice checkpoint:** owner usability session 1 on the real game (`usability-plan.md`); fold findings in | slice | 13 | 6 |
| 15 | M4b Effects breadth: the other 10 archetypes (about 147 cards), DSL additions | breadth | 14 | 85 |
| 16 | M5b AI breadth: Warlord, Emperor, 12 playbooks with assertions, nightly strength CI | breadth | 15 | 60 |
| 17 | M6 Deck builder | breadth | 8, 15 | 14 |
| 17b | **M6b Card pool and live updates:** every Standard-legal card scripted and tested in set batches, `meta:update`, a scheduled update workflow that opens PRs, app update prompt, AI default playbook for any leader | breadth | 16, 17 | 1,000–1,100 |
| 18 | M7 Tutorial and the rest of the coach (hint as a line, why, blunder warning, tempo meter); owner usability session 2 | breadth | 16 | 40 |
| 19 | M8 Review breadth: every flag category, timeline, restore and replay, local save, analysis time cap | breadth | 16 | 30 |
| 20 | M9 Meta explorer, matchup grid, four drills (puzzles drawn from real review flags), rules reference, progress with "what to work on next" | breadth | G, 16, 17 | 40 |
| 21 | M10 Polish and release; owner usability session 3; findings carried to M10 (listed in STATUS.md) | breadth | all | 20 |
| 22 | Overhead: the verification ritual, screenshot reviews, STATUS and DECISIONS upkeep (about 10% of the build) | | | 55 |
| | **Total** | | | **1,718–1,818** |

The first draft estimated 264 hours. Both reviewers called that roughly half the real figure. The new baseline was about 720 hours.

**Amendment A1 (2026-11-17, owner-approved; ADR 0014).** Row 17b adds 1,000–1,100 agent-hours. Arithmetic: rows 1–22 other than 17b sum to 718 (4 + 14 + 8 + 20 + 40 + 0 + 1 + 16 + 70 + 50 + 60 + 40 + 45 + 6 + 85 + 60 + 14 + 40 + 30 + 40 + 20 + 55). Low: 718 + 1,000 = 1,718. High: 718 + 1,100 = 1,818. M6b breaks down as M6b-0 about 40 h, M6b-1 about 30 h, M6b-2 about 120 h, M6b-3 about 650–750 h, M6b-4 (review and fix rounds, about 15% of scripting) about 100–110 h, M6b-5 (update pipeline) about 25 h, M6b-6 (app updates) about 20 h, M6b-7 (AI for any leader) about 20 h: 1,005–1,115 h, rounded to 1,000–1,100. The plan as first drafted said 650–1,000; its own itemised steps exceeded that, so the estimate was reconciled when the docs were written (DECISIONS 2026-11-17). Re-baseline at the end of M6b-0, when the backlog is measured; deferring block 2 (on hold for rotation) reduces the figure if block 2 rotates out. The overhead row stays at 55 h; the M6b batches carry their own review and upkeep. `meta:update` moved from M9 (row 20) to M6b-0; row 20's 40 h is unchanged (a conservative margin). Row 17b keeps the existing row numbers stable, so references to "row 17" still mean M6.

**Re-baseline at the end of M6b-0 (2026-11-23; DECISIONS "M6b-0 re-baseline").** `cards:measure` counts 1,660 unscripted Standard cards: block 5 180, block 4 422, block 3 510, block X and the block 1 exceptions 8, block 2 (held) 540. In scope while block 2 is held: those 1,120, plus EB-05 and OP-18 (about 180, the first batch) and up to about 100 cards whose legality is not yet cited: about 1,300 to 1,400 cards. At the plan's own rate (650–750 h for about 1,815 cards, about 2.6 cards an hour with tests and verification), M6b-3 is **about 500–540 h** and M6b-4 (15%) about 75–80 h. **M6b becomes about 830–880 h** (M6b-0 40, M6b-1 30, M6b-2 120, M6b-3 500–540, M6b-4 75–80, M6b-5 25, M6b-6 20, M6b-7 20), **plus about 240 h** (210 scripting, 30 review) **if block 2 survives the rotation after 2027-03-31**. The project total becomes about 1,550–1,600 h without block 2. The risk trigger is unchanged: fewer than 3 cards an hour in a batch means re-planning, and the first batch (OP-18, EB-05) measures the real rate.

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
| M6 | All 36 meta lists round-trip without loss; validator tests match the rules and `standard.json`; any Standard-legal card can be added and saved; a non-meta-leader deck can be played against the AI |
| M6b | 100% of Standard-legal cards play fully, **excluding block 2 while it is on hold** for the rotation announcement (listed in `standard.json` `gaps` and in STATUS); coverage is shown restricted to Standard. Every scripted card is verified, with author and independent tests. No Standard card has `unknown` legality, or each one is listed in `gaps` with a reason. The scheduled `cards` job has opened a real update PR for **the next set released after OP-18 and EB-05**, and that set has gone through the runbook end to end; OP-18 and EB-05 are scripted through runbook steps b–h. An old record stays live after an unrelated card is scripted. An e2e test passes for the update prompt. 10,000 nightly random-Standard-deck games are invariant-clean. The bundle budget holds. |
| M7 | Owner usability session 2: tutorial finished in under 20 minutes from the local timing log, with the teach-back questions answered; coach never interrupts unprompted (test); hint returns a line |
| M8 | Planted missed-lethal and wasted-counter games flagged with sensible text and certainty labels; review of a 300-decision game finishes within 60 s with progress shown |
| M9 | Guides render with as-of dates and sources; each drill ≥20 items; puzzles include items generated from review flags; progress persists, exports, and recommends a next lesson |
| M10 | Lighthouse performance and accessibility ≥90; WCAG 2.2 AA audit with manual NVDA and VoiceOver passes; 60 fps trace during card animations on a throttled profile; deployed URL in STATUS.md |

## 2a. M6b Card pool and live updates (amendment A1, 2026-11-17)

Context: only 180 of the 2,799 cards have scripts (the 182 meta-list cards), the snapshot ends at OP-17, and `cards:update` and `meta:update` are manual (and `meta:update` does not exist yet). The owner decided to script every Standard-legal card, keep the app current through scheduled PRs, and build in the order M5b, M6, M6b, then M7 to M10. Depends on M5b and M6. Done criteria are in §2. OP-18 and EB-05 are imported stats-only by a separate data commit before M6b starts; they become the first scripting batch.

Steps, in order:

1. **M6b-0, infrastructure (about 40 h).**
   - Port the tagger to `cards/scripts/measure-effects.ts` (E-D10). Its output is the pool backlog and gap list in `cards/data/coverage-report.json`.
   - Per-card script hashes in `engine/src/record.ts`, with the golden guard fixed at the same time (closes M4b-17).
   - Lazy per-set script chunks (`cards/effects/<SET>/index.ts` plus a registry of IDs).
   - Per-push card tests cover changed cards only; the full card suite runs nightly.
   - Pin the strength-test decks to `ai/test/fixtures/strength-decks.json`, so a meta refresh never moves the gates. (Built as `ai/test/fixtures/meta-lists.pinned.json`, the whole meta file, which every test and the e2e build import instead of the live one; DECISIONS 2026-11-23.)
   - Build `scripts/meta-update.ts` (Limitless API to a candidate `meta-lists.json` plus a per-card play-frequency table). M6b-3's ordering needs it, so it lands here, before any scripting; M6b-5 only wires it into `update.yml`.
2. **M6b-1, runtime audit of the Standard pool (about 30 h).** `docs/research/m6b-runtime-audit.md`, using the method of `m4b-runtime-audit.md`. It lists the gap IDs, including the known long tail: redirectAttack, activate from hand, deck and loss rules clauses, and Life reorder.
3. **M6b-2, DSL and engine waves (about 120 h).** 8 to 10 primitives per wave, ordered by pool weight. Each primitive gets a planted test that fails when its implementation is reverted. Bump `ENGINE_VERSION` once per wave.
4. **M6b-3, scripting in set batches (about 650–750 agent-hours).**
   - Order: block 5, then 4, then 3. **Block 2 does not start until the post-2027-03-31 rotation is announced** (it may rotate out). Within each set: leaders first, then cards by Limitless play frequency (from `meta:update` data).
   - A batch starts only once its gaps are closed.
   - Per card: a verified override, the script, about 5 author tests and about 9 independent tests.
5. **M6b-4, review per batch.** An adversarial review in `docs/reviews/m6b-<SET>.md`, with one fix round. A severity-3 finding blocks the merge.
6. **M6b-5, update pipeline.** `.github/workflows/update.yml` (using the M6b-0 `meta-update.ts`) and `docs/runbooks/new-set.md` (ARCHITECTURE §3 "Update pipeline"). Build this first among M6b-5 to M6b-7. OP-18 and EB-05 are the first scripting batch, run through runbook steps b–h (step a, the cited block, is part of their stats-only import; EB-05 was imported 2026-11-17, OP-18 is pending upstream, see STATUS). The runbook runs locally; there is no `script-set.yml` (ADR 0014).
7. **M6b-6, app updates.** Service-worker app shell, update prompt and `version.json` (built 2026-11-23). IndexedDB records moved to M8 "local save", their first reader (DECISIONS 2026-11-23).
8. **M6b-7, AI for any leader.**
   - Add `ai/playbooks/default.json` and make `playbookFor` and `priorFor` never null (`ai/src/playbook.ts`, `ai/src/knowledge.ts`).
   - Each new archetype the meta PR flags becomes a content task: guide, playbook and assertions.

M6b-5 to M6b-7 run in parallel with M6b-3 and M6b-4. The time-box rule applies per batch: a late batch slips to the backlog, with its cards stats-only. Before M6b-5 is built, check the Limitless API terms and both sites' robots.txt (ADR 0014).

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
| 2 | **Effect coverage.** The scope is the Standard pool: the 182 meta-list cards (done in M4a/M4b) plus about 1,815 more, each with a script, a test and verification (M6b). | High / high | Scripting follows meta frequency, one whole archetype at a time for the meta cards, then set batches ordered by play frequency with leaders first. The slice pass proved the DSL on two archetypes. Unscripted cards still play for their stats, with a badge. Coverage per archetype and per set is tracked in STATUS.md. The time-box rule applies per batch: a late batch slips to the backlog, with its cards stats-only. | Fewer than 3 cards per hour in a batch, or more than 2 severity-3 findings per 100 cards |
| 3 | **AI strength, speed and wait time.** | Medium / high | Plan per turn and reuse the tree. Incremental `derive`. Canonical picks and progressive widening over DON!! allocation. The benchmark runs on **scripted** decks in M4a, before Warlord is built. ADR 0008 names a fallback. | Under 1,000 simulations per second on scripted decks; AI turn over 8 s |
| 4 | **Data or art source** terms change, the source goes down, or it lags behind new sets. | Medium / medium | One image module with swappable sources, a text card fallback, and a bounded cache. The official parser stays documented for the day permission is granted. | Image error rate; optcgapi missing a released set for more than 14 days |
| 5 | **Scope creep in the learning layer.** | High / medium | The slice defines the learning core early. Breadth milestones have fixed done criteria. Extra ideas go to `docs/BACKLOG.md`. | Any learning milestone past 2× its estimate |
| 6 | **Meta drift.** EB05 lands 2026-10-30 and OP18 2026-11-20. | Certain / medium | Guides and playbooks are keyed by leader ID and carry an as-of date. `meta:update` flags anything older than 60 days. The meta PR is weekly (`update.yml`, M6b); playbook changes are batched, not chased mid-milestone. | A meta PR flags a new archetype or a leader with no playbook |
| 7 | **Saved records invalidated by engine or card changes.** | Certain / low | Records carry versions and per-turn snapshots, and stale ones open read-only (ARCHITECTURE §2.9). From M6b the scripts version is a per-card hash, so a record goes read-only only when a card in that game changed. | n/a |
| 8 | **Design built on unobserved competitors.** | Medium / medium | Owner hands-on time before the Phase 4 gate. Design claims that rest on unobserved behaviour are marked as such. | The owner's notes contradict a design assumption |
| 9 | **Rotation.** The regulation ends 2027-03-31, and block 2 may rotate out, which would make scripting it wasted work. | Likely / medium | Script the newest blocks first (5, then 4, then 3). Block 2 does not start until the post-2027-03-31 rotation is announced. The `cards` job warns within 60 days of `regulation.to`. Rotated cards stay browsable and play for their stats. | The rotation announcement; a rotation warning in an update PR |
| 10 | **Test time and bundle size.** About 2,000 more scripts and about 25,000 more tests. | High / medium | Scripts load lazily per set. Per-push card tests cover changed cards only; the full card suite runs nightly. The strength-test decks are pinned in a fixture so a meta refresh never moves the gates. | `npm test` over 4 minutes locally; initial JS over 300 KB gzipped |

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
.github/workflows/ci.yml, deploy.yml, nightly.yml, update.yml (M6b)
cards/
  src/            schema.ts, dsl.ts, index.ts (lookup, coverage)
  data/           manifest.json, sets/<SET>.json          (generated)
  overrides/      <CARD-ID>.json                          (hand-verified, cited)
  effects/        <SET>/<CARD-ID>.ts                      (hand-written)
  format/         standard.json                           (hand-kept, cited)
  scripts/        update.ts, normalize.ts, types-vocab.ts, diff.ts, measure-effects.ts (M6b)
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
scripts/          meta-update.ts (M6b)
docs/runbooks/    new-set.md (M6b)
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
| `npm run meta:update` | **(M6b-0; not built yet)** Fetch tournament data from the Limitless API, write a candidate `meta-lists.json` and a per-card play-frequency table, flag guides with lists older than 60 days |
| `npm run cards:measure` | **(M6b-0)** Tag every card's effect text with the DSL tagger and write the backlog and gap list to `cards/data/coverage-report.json` |
| `npm run cards:report` | **(M6b-0)** Print Standard coverage, overall and per set |
| `npm run cards:audit -- --set <SET>` | **(M6b, runbook step b)** Check one set's cards against overrides, scripts and `standard.json` before scripting starts |

## 8. CI

- **`ci.yml`** runs on every push and PR: `npm ci` → lint → typecheck → unit tests → Playwright install → e2e against a production build. Unit tests include the 500-game property test and the 20-game strength smoke.
- **`deploy.yml`** runs after CI succeeds on `main` and publishes `app/dist` to GitHub Pages.
- **`nightly.yml`** (added in M2) runs `test:nightly` and uploads the results as an artifact. From M6b-0 it also runs the full card suite.
- **`update.yml`** (planned for M6b-5, not built) has two jobs, `cards` and `meta`, each opening or updating its own PR on a fixed branch. See ARCHITECTURE §3 "Update pipeline".

`update.yml` (scheduled, weekly, and on manual dispatch; built in M6b-5, ADR 0014) calls the optcgapi bulk endpoints and the Limitless API and opens a PR; no other workflow calls an external data API; the official site is never fetched. Nothing reaches `main` without review. Scripting new cards stays a local agent-run job (`docs/runbooks/new-set.md`); there is no `script-set.yml` for now.
