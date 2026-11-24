# Runbook: a new set, from data PR to "Scripts: <SET>" PR

ADR 0014, ARCHITECTURE §3 "Update pipeline", PLAN §2a. Agents run this locally, after the weekly card-data PR that brings the set in has been reviewed and merged. Scripting never runs in CI. The method is the one M4b used (`docs/research/m4b-runtime-audit.md`, `docs/research/m4b-wave2/`, `docs/reviews/m4b-review.md`).

## Before you start

- The set is on `main` as data: `cards/data/sets/<SET>.json` exists, from `update.yml`'s `cards` PR or from `npm run cards:update -- --refresh` run locally (then commit the data on its own, stats only).
- `npm run cards:measure` is current, and `cards/data/play-frequency.json` is recent (`npm run meta:update -- --write` if older than a month). Together they give the order inside the set.
- The time-box rule applies per batch (PROMPT.md): a batch that runs late goes to `docs/BACKLOG.md`, and its unfinished cards stay stats-only with the "effect not automated" badge.

## a. The cited block

Add the product to `cards/format/standard.json` `blocksByProduct`, with the official source that gives its block (the printed block icon on the official product page, or an official announcement), then re-run `npm run cards:update` so legality is no longer `unknown`. Never infer a block from the release date (ADR 0011). Without a citation, list the product in `gaps` with the reason and carry on: unknown legality is a warning, not a blocker.

## b. Audit

`npm run cards:report` for the set's coverage. Then, for every unscripted card in the set, list the DSL shapes it needs and whether the runtime has them: `docs/research/m6b-audit/<SET>.md`, in the format of the M6b-1 audit (a card table, then gaps `<SET>-G<n>` with the file each belongs in and a size). The tagger's tags in `cards/data/coverage-report.json` are a hint, not the audit. Card readings that need a ruling go to `docs/OPEN-QUESTIONS.md`.

## c. Engine wave (only if the audit found gaps)

One branch for the set's gaps, at most 8 to 10 primitives. Each new shape:

1. is added to `cards/src/dsl.ts`, `cards/src/dsl-validate.ts` (`IMPLEMENTED`) and the runtime (`engine/src/effects/`, `engine/src/ops/`);
2. has a planted test in `engine/test/cards/<wave>/`: a minimal script on a vanilla test card, which fails when the implementation is reverted (try it).

Bump `ENGINE_VERSION` once per wave if any recorded game could play out differently, and re-record the goldens (`engine/test/golden/golden.test.ts` has the command). Merge before step d starts.

## d. Scripting, in parallel

Order inside the set: Leaders first, then by play weight (`coverage-report.json` `backlog` order). Split the cards into groups of about 15 to 25 and give each to an agent in its own worktree. For each card:

1. **Verify the text.** Compare the card with the official card list by hand (never fetched by a script, ADR 0007) and write `cards/overrides/<ID>.json` with `verified: true`, the source and the printed keywords (`npm run cards:verify-meta` shows the format).
2. **Script it.** `cards/effects/<SET>/<ID>.ts`, exporting `<SET>_<NUM>` (for example `OP18_001`), with `textHash` from `textHash(effectText, triggerText)`. Read existing scripts with similar wording first. Text is never parsed into behaviour (ADR 0006).
3. **Test it.** `engine/test/cards/<ID>.test.ts`, about 5 author tests: the effect, the edge the text names ("up to", "if", "then", once per turn), and a case where it must not fire.
4. **A prompt must not be gated on a hidden-zone condition** (an `exists` or count over your hand, deck top or Life gating a pick, `may` or choice): gate on public facts (a hand size, a field state) and let the pick be asked at max 0. `cards/test/hidden-gate.test.ts` (`cards/src/hidden-gate.ts`) enforces it; an allowlist entry needs a one-line reason.
5. Run `npm run cards:effects-index`, then `npx vitest run engine/test/cards/<ID>.test.ts cards/test`.

Readings and ambiguities go in `docs/research/<SET>-scripting.md`, one line each, with the card text.

## e. Independent tests

A different agent, which has not seen the scripts, writes about 9 black-box tests per card from the card text and the rules only: `engine/test/independent/cards/<ID>.test.ts`. A disagreement with the script stays as an `it.fails` with a line in `engine/test/independent/cards/DISAGREEMENTS-<SET>.md`, for the review to settle.

## f. Review

An adversarial reviewer (a fresh agent with no stake in the scripts) writes `docs/reviews/m6b-<SET>.md`. It compares scripts with card text and the official Q&A, settles each disagreement, and plays random games with the set's cards against the leak, skeleton and invariant properties. Severities as in earlier reviews. **A severity-3 finding blocks the merge.**

## g. Fix round

Fix every severity 3 and 4 with a test that fails on the old code. Re-review the fixes only. One fix round. Whatever is still open goes to `docs/BACKLOG.md`, and its cards are taken out of the batch, so they stay stats-only.

## h. "Scripts: <SET>" PR

One PR from the batch branch. It contains the overrides, scripts, regenerated `cards/effects/registry.ts` and set `index.ts`, tests, the review, `cards/data/coverage-report.json` (`npm run cards:measure`), and the STATUS coverage line. Per-push CI runs the changed cards' tests (`npm run test:ci`); the nightly runs every card. Record any non-trivial decision in `docs/DECISIONS.md`.
