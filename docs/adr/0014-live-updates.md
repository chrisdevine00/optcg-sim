# ADR 0014: Live updates: scheduled data PRs, agent-run scripting

**Status:** Accepted, 2026-11-17 (owner decisions; PROMPT.md amendment A1) · **Planned for M6b; none of it is built yet**

## Context
Only 180 of the 2,799 cards have scripted effects (the 182 meta-list cards), the card snapshot ends at OP-17, and `cards:update` is a manual local command. `meta:update` was planned for M9 and does not exist yet. PLAN section 8 said CI never calls a card or tournament API. The owner wants access to all cards, new cards as sets release, and a way to keep the app and the meta current. Every new script also makes saved records read-only today, because `SCRIPTS_VERSION` is one global hash, and the deployed app has no update prompt.

## Decision
- **Scope.** Every Standard-legal card is fully scripted, each with a test. Rotated cards stay browsable and play for their stats with the "effect not automated" badge.
- **Scheduled data PRs.** `.github/workflows/update.yml` runs weekly and on manual dispatch, as two jobs, `cards` and `meta`. Each opens or updates its own PR on a fixed branch; nothing reaches `main` without review. The `cards` job runs `cards:update --refresh` and `cards:measure`; the `meta` job runs `meta:update` against the Limitless API. ARCHITECTURE section 3, "Update pipeline", has the PR contents. This reverses PLAN section 8's "CI never calls a card or tournament API": only `update.yml` may call an external data API, and the official site is never fetched.
- **Scripting is agent-run, locally.** New cards are scripted by agents following `docs/runbooks/new-set.md`, with tests and an adversarial review per batch, then a "Scripts: <SET>" PR. There is no `script-set.yml` for now. Running it in CI with an API key is a later decision.
- **Order.** M5b, then M6, then M6b, then M7 to M10. Within M6b, scripting goes block 5, then 4, then 3, and within each set leaders first, then cards by Limitless play frequency (from `meta:update` data). That is why `meta:update` moves from M9 to M6b-0.
- **Block 2 is held** until the rotation after 2027-03-31 is announced, since it may rotate out. M6b's "100% of Standard" excludes it while it is held, and the cards are listed in `standard.json` `gaps` and in STATUS.
- **Supporting changes.** Per-card script hashes so unrelated scripting does not invalidate records; lazy per-set script chunks; a service-worker app shell with an update prompt; a default playbook so any leader can be played against.

## Alternatives rejected
- Scripting only meta decks (the owner wants the full pool).
- Auto-merging the update PRs (card text changes can break scripts; review stays).
- Scripting new cards in a scheduled CI job (an API key and unattended output in CI; deferred).
- Scripting all blocks including block 2 now (likely wasted work if it rotates out).
- Hand-run updates only (the app goes stale between sessions).

## Consequences
- Fetching is at most weekly with a 3 s delay between requests. Scripting stays human-reviewed, and ADR 0006 is unchanged: text is never parsed into behaviour.
- Regulation and block changes stay hand-cited `standard.json` edits (ADR 0011 addendum); the update PR flags them, including a rotation warning within 60 days of `regulation.to`.
- The PLAN estimate grows (row 17b) and the risk register gains rotation (risk 9) and test time and bundle size (risk 10).
- **Open check before building `update.yml` and `meta:update`:** read the Limitless API terms (whether a key or attribution is required) and the robots.txt of both optcgapi.com and Limitless. If either forbids scheduled automated access, that part is not built and the owner decides. Record the result in DECISIONS.md.

## Addendum, 2026-11-27 (ADR 0015)
The `update.yml` cards job may also read the Limitless card pages of a product optcgapi lacks (about 120 requests 1.5 s apart, cached). Limitless's robots.txt allows all agents and its legal notice sets no terms of use (checked 2026-11-27); recorded in DECISIONS.
