# M8 plan: review breadth

2026-11-25. PLAN row 19 (30 h); done criteria (PLAN §2): planted missed-lethal and wasted-counter games flagged with sensible text and certainty labels; review of a 300-decision game finishes within 60 s with progress shown. Planned from PROMPT.md (Learning layer §3, Analysis mode), learning-ui §2.3/§4/§6/§9, flows F16 and G8, accessibility §3.16, explanations E01–E11 and E19, and the L-slice review code; decisions in DECISIONS 2026-11-25 "M8 plan".

## Reuse

`reviewMissedLethal` and `lethal` (`ai/src/search/lethal/`), `threat` (M7 WP3), `donLedger` / `explainUnused` / `explainHeld` (`ai/src/coach/tempo.ts`, M7 WP2), `valueActions` / `givesUpLethal` (`ai/src/search/score.ts`), Pirate's mulligan rule and `playbookFor`, `certaintyLabel`, `LESSON`; engine records (`RecordWithSnapshots`, `replayable`, `replayWith`, per-game `cardsVersionOf` / `scriptsVersionOf`); the L review UI (`app/src/play/review/ReviewFlow.tsx`, Overview / Study / Play from here / Practice this) and worker (`review-worker.ts`, `analyse.ts`).

## Flags

| Kind | Detection | Certainty | Lesson |
| --- | --- | --- | --- |
| Missed lethal | existing exact check, ported to per-turn items | public proof `any-hand` (severe); actual-only Hindsight; cap → marker | L15 |
| Lethal given away | on a turn their board won: `threat()` at their Main; branch your previous turn without a Blocker's attack; flag if their board alone no longer wins | `any-hand` when both checks are board-only | L15 |
| DON!! left unused | `donLedger` at each `endTurn`, flagged when the DON!! had a use; held DON!! give the E07 note | `any-hand` | L09 |
| Counter wasted | (a) the battle was lost anyway (exact); (b) Life ≥ 3, power-only counters, and a public bound shows they could not win this turn | `any-hand` under the stated conditions, else Hindsight | L10 |
| Hit that should have been countered | on the lost turn, `lethal` actual mode at each attacker Main: refuted before battle i, proven after | `any-hand` only if the attacker's hand was empty | L10 |
| Poor attack ordering (board vs face) | `valueActions` gap over the attacker's legal targets, corpus-tuned threshold | `any-hand` (guessed hands from the prior) | L14 |
| Mulligan | the sourced guide's rule (`mulliganVerdict`); default playbooks never flag | guide label | L12 |

## Pipeline

A pure planner emits per-turn items (cheap, search, value phases); a runner with checkpointed replay runs each; a scheduler with a 55 s deadline turns unrun items into "Not fully checked" markers (≤ 10% allowed by the bench); the worker loop reports progress and incremental results and accepts cancel, prioritise (Analyse now) and deeper (one turn ×10); a small pool of workers. Unfinished records are refused; the review never runs or speaks during a live board.

## UI and storage

Review screen decoupled from the live controller (`/reviews/:id`), two-row timeline (you, and their notable moves), Life sparkline with a table alternative, flag listbox, Study / Play from here / Practice this with per-kind judges, "Practised" mark, History (`/reviews`), minimal lesson pages (`/learn/:id`). IndexedDB `optcg-sim` (games, reviews, resume slot, timing, progress) with migration from localStorage, in-memory fallback, quota handling, staleness via per-game versions plus `verifyReplay` (replay hashes match → still live), export and import (validated, no network), Settings → Data.

## Work packages

| WP | Scope | Size |
| --- | --- | --- |
| WP0 | Contracts: flag/item/message types, detector registry with one stub per kind, `ReviewStore` interface, routes and nav, PlayRoute save seam, mulligan label row in explanations.md | 2 h |
| WP1 | Pipeline: planner, runner, missed lethal as items, scheduler and deadline, async worker loop, pool, 300-decision fixture and bench | 6 h |
| WP2 | Exact flags: DON!! unused, counter wasted, mulligan; E04/E06/E07/E10/E11/E19 snapshots; differential | 5 h |
| WP3 | Search flags: should-have-countered, lethal given away; E05 snapshot, E21 written | 5 h |
| WP4 | Attack target: value gap, `explain-target`, corpus threshold, E08/E09 | 4 h |
| WP5 | Local save: IndexedDB, migration, fallback, quota, `verifyReplay`, resume slot, export/import, Settings → Data | 7 h |
| WP6 | Review UI, History, Practised, lesson pages | 8 h |
| WP7 | e2e (planted games, keyboard-only, axe, 60 s gate, no-announce-while-live), NVDA step, docs, independent review | 3 h |

After WP0, WP1–WP5 touch disjoint files; WP6 starts on WP0 types and wires to WP1 and WP5; WP7 last. Cut order: resume slot, `/learn/:id`, counter-kind Practice, lethal given away (to M9), the opponent row, the worker pool (if one worker meets 60 s), `verifyReplay` (records then go read-only on every engine bump). Never cut: missed lethal, counter wasted, DON!! unused, the planted e2e, the 60 s gate.

## Owner

Review the copy of the new templates (E21 and the attack-target wording); dispatch the NVDA run; VoiceOver.

## Scope limits of the shipped flags (M8 review R10, 2026-11-26)

These are by design and are not bugs; the app copy and the BACKLOG name them so a player is not told more than was checked.

- **Lethal given away** (`given-away.ts`) covers one shape only: the game was lost by damage on their turn, their board alone won, and your previous turn had a Blocker attack that rested the Blocker. It does not look at a Character attack that left you open, a Blocker you chose not to use, a counter you did not play, or a game lost any other way (decking, a Leader effect, a concession). A game given away in those ways gets no flag, so the absence of this flag does not mean the game was not given away. Extending it means a branch per kind of earlier turn (attack, no block, no counter); each needs its own `threat()` comparison and its own corpus rate. BACKLOG §11.
- **Mulligan** (`mulligan.ts`) flags only when the Leader's guide has a sourced rule (an `SH-` tag). OP05-098 and OP08-098 say "no sourced rule" and never flag; a Leader with a default playbook never flags. The label is the guide's ("From the <Leader> guide (sourced)"), which is advice, not a proof. M8-WP2-2 in OPEN-QUESTIONS keeps this until the owner writes those rules from a source.
- **Counter wasted (b)** is `any-hand` only when a bound over every hidden hand holds (draws, granted Rush or Double Attack, re-activation, DON!! adds, effects already on their board; a Leader without a sourced list narrows nothing). Where it does not, the flag is Hindsight or absent (M8 review R6).
- **Attack target** is judged one declaration at a time; the order of a turn's attacks is not (see `target.ts`). It is `any-hand` because its words rest on public facts and its search asks six guessed hands to agree (M8 review R7).
