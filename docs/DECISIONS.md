# Decisions

Newest first. One dated paragraph per decision: context, decision, alternatives rejected.

## 2026-10-28 — Phase 4 design decisions (board, flows, accessibility)

Context: three design agents wrote the Phase 4 documents in parallel. Their proposed decisions are accepted as written in each file; the full paragraphs, with the alternatives rejected, are there.
- **`board.md` PD-1 to PD-6:**
  - a fixed board column plus a fixed right rail (log, coach, decision panel), 320/400 px wide;
  - the opponent mirrored vertically with the same columns;
  - click primary, drag as accelerator, and a keyboard path for everything;
  - AI turns paced as highlight → move → dwell (600 ms per move at 1×), with "thinking" shown only when it is real;
  - an honest phone screen;
  - a minimum card of 76×106, below which the layout changes mode instead of shrinking.
- **`flows.md` decisions 1 to 9:**
  - commit rather than confirm;
  - one defence panel with Blocker, Counter and Trigger lanes and a single commit;
  - multi-select with a running count, sent to the engine one pick at a time;
  - auto-skip only when no human could learn hidden information from it, and a constant visible AI "considering" time;
  - rewind by move with the same shuffle, marked and excluded from stats;
  - "skip to my decision" never skips the player's own decisions;
  - hotseat privacy via a handoff screen plus hold-to-reveal in battles;
  - one welcome question and no account;
  - AI explanations cite public information only.
- **`accessibility.md`:**
  - staged picks are validated by replaying them through `reduce` on a scratch state, with an engine helper added only if that exceeds 16 ms;
  - screen-reader passes use Guidepup automation plus a human VoiceOver pass;
  - the owner's tutorial runs are labelled "expert proxy".

Reconciled across the documents:
- the coach uses the rail's full width (`board.md` is the source of truth for layout);
- `accessibility.md` owns the keyboard map, which resolves the shortcut collision in `flows.md` question 6;
- the `Evidence` and `Move` shapes from `explanations.md` are added to ARCHITECTURE §4.5.

## 2026-10-28 — Phase 3 gated after the competitive-player review

Context: PROMPT.md gates Phase 3 on a competitive-player review of the archetype guides. The review found 20 issues: 6 severity-3, including misread leader texts (OP17-058, OP05-098), targets out of a card's cost range, a curriculum flag that would penalize correct OP13-001 play, and missing fundamentals. Decision: a separate agent checked every finding against card text, the rulings and the lists. It accepted 18 and partly accepted 2 (`docs/content/review-1.md`), fixed nine further errors found along the way, added lessons L25–L27 (base vs current values, Leader vs Character targeting, opponent-turn timing), marked every unsourced claim individually, and added the EB05 format note. Lesson IDs are stable, so teaching order follows section order rather than ID. Alternative rejected: gating with the guides marked "low confidence" (they would teach false facts).

## 2026-10-28 — Rulings adopted from Track F

Context: Track F read all 46 official Q&A PDFs, CR v1.2.1 (still the newest), the Rule Manual, the tournament manual and the floor rules, and wrote 49 rulings (`docs/research/rulings.md`). Decision:
- The open questions are closed as in its section J.
- Permanent effects apply in the layer order shown by the OP10-042 Q&As (D-3; ARCHITECTURE §2.5).
- "Until the end of your opponent's next End Phase" is a duration, and every modifier records its creation turn (D-2; merged with Track E's E-D2 names).
- "Cannot be K.O.'d" Characters stay legal targets for K.O. effects and costs (D-4).
- Each ruling becomes `engine/test/rulings/RL-xx.test.ts` (D-5).

The rules digest is corrected on three points:
- OP05-022 is a Leader with [Blocker];
- an effect that trashes a Character is not a K.O.;
- the CR and the OP13-079 Q&A conflict on the order of start-of-game effects.

Alternative rejected: an `order` decision for permanent effects (the Q&As fix the order).

## 2026-10-28 — Effect DSL accepted as specified by Track E

Context: Track E tokenized 2,516 cards with text. 97.7% of clauses were tagged, and every one of the 182 meta cards maps to a vocabulary of 28 effect primitives, 12 costs, 17 timings, 10 condition forms and one replacement shape. Its proposed decisions E-D1 to E-D11 (`docs/research/effect-dsl.md` §8) are accepted:
- scripts are typed TS data with a CI schema;
- two new durations: until the end of the opponent's next turn, and until the start of your next turn;
- one `leaveField` choke point with a cause;
- DON!! picks by location class;
- one `move` verb over whitelisted zone pairs;
- full cost lookahead with exact cost picks;
- printed keywords come from verified overrides;
- unscripted Events and [Trigger]s are not offered;
- Once Per Turn is keyed by instance and ability;
- the tagger is kept as a per-set measurement tool;
- scripting order is leaders first, then meta weight.

ARCHITECTURE.md §2.2, §2.3, §2.4 and §3 are updated. Alternatives rejected are recorded per decision in §8.

## 2026-10-28 — Content conventions from Track G

Context: Track G wrote 12 archetype guides, a 24-lesson curriculum, a glossary and a sources list, and it needed shared conventions for turn numbers, matchup data and lesson tags. Decision:
- Turn numbers in guides and playbook assertions count the deck's own turns: T1 is that player's first turn.
- Matchup cells show the newest post-ban sample with at least 8 games, with older samples as secondary.
- Rules-only lessons (L01–L07) carry CR numbers instead of concept slugs.
- Drill thresholds and playbook-seed percentages are marked as inference until calibrated in self-play (M5).

Alternatives rejected: game-turn numbering, which is ambiguous between first and second player; pooling matchup records across formats, which mixes pre-ban and post-ban data.

## 2026-10-28 — onepiece.gg material removed from Phase 1 research

Context: `strategy-concepts.md` (Track D part 2) cited six onepiece.gg articles read in full and several onepiece.gg snippets, and `rules-digest.md` listed one onepiece.gg page as a cross-check. onepiece.gg's robots.txt disallows Anthropic agents. Decision: under the robots decision below, that material is removed. The rules-digest entry is withdrawn; CR 6-5-6-1 stands on its own. `strategy-concepts.md` is being scrubbed, with heuristics re-sourced from allowed sources where possible and otherwise listed as gaps. The Track G content never used onepiece.gg. Alternative rejected: keeping already-collected material (launders the violation).

## 2026-10-28 — Phase 2 reviews folded in; plan re-baselined to about 720 hours with a vertical slice first

Context: two adversarial reviews (`docs/plan-review-1.md`) found the 264-hour estimate about half of reality, and found that the strict M0–M10 order would start the learning layer about 70% of the way in. They also found engine-model gaps: replacement effects, last-known information, scenario starts, record versioning, projection linkage leaks, and invariants hard-coded to 10 DON!!. Decision:
- Accept every severity 3–4 finding.
- Build a vertical slice before breadth (ADR 0012): Rocks and Kaido, Pirate, and the learning slice, then an owner usability session.
- Add replacement hooks, last-known information and scenarios as engine primitives (ADR 0013).
- Revise ADRs 0003, 0004, 0005 and 0008.
- Re-baseline to about 720 hours.

Two findings are only partly accepted. Usability sessions use the owner, plus others at the owner's discretion, because the project cannot recruit participants. Owner hands-on time on SeaKing is requested but does not block the autonomous run. Alternatives rejected: keeping the PROMPT.md milestone order literally (the time-box would cut the learning layer); deferring the engine-model fixes to M2 (they change the data model and the record format).

## 2026-10-28 — Card data from optcgapi.com, not the official card list

Context: Track B recommended parsing the official card list (the most accurate source, and the only one with block icons), with optcgapi.com as fallback. But the official site's terms say its "text and data … may not be reproduced without permission", and PROMPT.md says to choose another source where terms forbid an intended use. optcgapi.com says it is "open for anyone to use", but it drops minus signs, loses type delimiters, and has a few corrupt rows. Decision: optcgapi.com is the only source `cards:update` fetches. Mechanical repairs are recorded per card. Hand-verified overrides, from a person-scale read of the official entry, are written for every scripted card, and CI requires them. Block, ban and exception data is a hand-kept, cited `cards/format/standard.json`. Full reasoning in ADR 0007. Alternatives rejected: bulk-parsing the official site (terms); optcgapi raw (sign loss changes meaning); Scrydex (paid, no mirroring); arjunkai (private data).

## 2026-10-28 — Images: optcgapi, then arjunkai (off until approved), then text-only

Context: no candidate offers clean art; every source serves the official SAMPLE-watermarked scans, and official image URLs are blocked cross-site. Decision: hotlink optcgapi images through one image module and cache them in a service worker. The arjunkai proxy is wired in but disabled until its maintainer approves. A text-only card keeps the game playable. Alternatives rejected: official URLs (blocked by CORP); Scrydex (paid); Limitless and TCGplayer CDNs (no permission).

## 2026-10-28 — Research automation obeys robots.txt; material gathered against it is not used

Context: SeaKing and DuelVoyager disallow `ClaudeBot`, `anthropic-ai` and `Claude-Web` in robots.txt, and SeaKing also reserves text-and-data-mining rights. The first Track C attempt browsed DuelVoyager and took 62 screenshots before checking. Bandai's Teaching App terms prohibit unapproved external tools. Decision: agents check robots.txt and terms before any automated access and do not automate sites that disallow them; material already gathered against a site's policy is not used (the DuelVoyager observations were removed from `competitive-teardown.md`). Where first-hand observation is needed, the owner does it by hand, and documents mark each section as hands-on or secondhand. Alternatives rejected: generic browser user agents (evades the block); keeping the DuelVoyager material because it was already collected (launders the violation).

## 2026-10-28 — Rules are always enforced; no manual sandbox in v1

Context: Untap.in and Tabletop Simulator are free-form tables that enforce nothing, so a learner's mistakes go unnoticed and become habit (`competitive-teardown.md` §4, §5). Decision: the UI offers only actions from `legalActions`; any manual "fix the board" tool waits for a later debug or puzzle editor. Alternatives rejected: a manual override menu; a toggle between enforced and free play.

## 2026-10-28 — Battle panel and deterministic rewind are MVP features

Context: none of the products studied shows live battle maths, and Untap's rewind needs a vote and reshuffles. Decision: every attack opens a panel with live attacker and defender power, the gap, and the Counters available, updating as Blockers and Counters are chosen. Rewind restores the exact prior state, RNG included, so it cannot be used to fish for a better draw. Alternatives rejected: power shown only on hover; rewind that re-randomizes the deck.

## 2026-10-28 — Meta archetypes keyed by leader ID, counted from Limitless online events

Context: Track D part 1 needed the 10 to 12 archetypes with the most top-8s in the last 90 days, English format. The Limitless tournament database has no events after 2026-07-26, complete in-person standings for the Season 1 Finals and Season 2 Regionals were not available from any source we may crawl, and onepiece.gg disallows Anthropic agents in robots.txt. Decision: an archetype is identified by its leader card ID. Top-8 counts come from the documented Limitless play API (33 English-legal Standard online events with 24+ players, 2026-07-30 to 2026-10-28), with eras split at the OP17 pre-release and the 2026-10-12 ban. In-person results and opmetagame.com are used only as cross-checks, and "top tier" requires two independent sources. Banned leaders (OP14-020 Mihawk) are kept in an `excluded` array rather than in the archetype set. The 12 archetypes and 36 lists are in `docs/research/meta-lists.json`. Alternatives rejected: scraping blocked sites (violates robots.txt); waiting for Limitless to backfill in-person events (blocks Phase 1 with no date); counting by name or colour (ambiguous: two Enels and three Luffys are in the field).

## 2026-10-28 — Standard Regulation (blocks 2 to 5) is the v1 format

Context: Bandai has applied the Block Number System and Standard Regulation to the English game since 2026-04-01; blocks 2 to 5 are legal until 2027-03-31, with listed exceptions. Decision: the deck validator and meta data target Standard Regulation, with block number and exception lists in the card data so the next rotation (blocks 3 to 6 from 2027-04-01) is a data change. Extra Regulation is not supported in v1. Alternative rejected: no format restriction (would let the player build decks that are illegal at any English event).

## 2026-10-28 — Learning content cites only freely readable sources

Context: some of the most-cited community frameworks are behind Metafy and Patreon paywalls, and some public pages (Reddit, TCGplayer Infinite) could not be read by the research agents. Decision: coach and curriculum content cite only sources that were read in full and are freely accessible, plus the official rules; claims seen only in search snippets are not used. Alternatives rejected: purchasing guides (licensing to quote them is unclear, and a reader of the app could not check the source); paraphrasing snippets (violates "never invent").

## 2026-10-28 — Engine spec corrected to Comprehensive Rules v1.2.1

Context: Track A read CR v1.2.1 (8/28/2026) and found places where PROMPT.md's engine specification is imprecise. Decision: the engine follows the CR; details and rule numbers are in `docs/research/rules-digest.md` "Corrections to PROMPT.md assumptions". In brief: neither player attacks on their own first turn (CR 6-5-6-1); deck-out is a defeat when the deck reaches 0, checked in rule processing, not "failing to draw"; with five Characters out the player trashes one before the new one is placed, and that trash is not a K.O.; power may be negative; the per-player card-count invariant includes a transient "resolving" location for Trigger cards; Refresh and End phases follow the CR's ordered sub-steps with separate expiry for "until end of turn" and "during this turn"; Character counters are free from hand and Event counters cost DON!!; Double Attack against 1 Life does not win; simultaneous loss and unbreakable loops produce a draw result; the keyword set includes [Rush: Character], [Unblockable], [On Your Opponent's Attack], [End of Your Opponent's Turn], [Main], [Your Turn], [Opponent's Turn], DON!! −X and Trash; start-of-game leader effects run before hands are drawn and Life is set after the mulligan; the four-copy limit is per card number across alt arts; DON!! power applies only on its owner's turn, though [DON!! xX] still counts on the opponent's turn. Alternative rejected: implementing PROMPT.md's wording literally.

## 2026-10-28 — Toolchain versions and workspace layout

Context: scaffold needs a type checker that ESLint understands. TypeScript 7.0 (native port) is current, but typescript-eslint 8.72 supports only `<6.1`. Decision: TypeScript 6.0.3, Vite 8, Vitest 4.1 (Vitest 5 does not list Node 25 in its engines), Playwright 1.64, ESLint 10 flat config. Packages are npm workspaces consumed as TypeScript source through `exports` (no per-package build), so Vite and Vitest compile everything once. Package boundaries are enforced with `no-restricted-imports`, and the engine additionally bans `Date`, `Math.random`, and DOM globals. Alternatives rejected: TS 7 without type-aware lint; project references with per-package builds (slower, no benefit for a static app).

## 2026-10-28 — Third-party screenshots are not committed

Context: the UX teardown and wireframe reviews need screenshots, and screenshots of other simulators show Bandai card art. Decision: such screenshots live in `docs/research/teardown-shots/` and `docs/design/wireframes/shots/`, both gitignored; documents describe them in text and refer to filenames. Alternative rejected: committing cropped or blurred screenshots (still risky and low value).

## 2026-10-28 — GitHub Pages via the Actions artifact flow, deploy after green CI

Context: PROMPT.md default hosting named a gh-pages branch, but the owner made the repo public and enabled Pages with the "GitHub Actions" source. Decision: `deploy.yml` builds `app/dist`, uploads it with `actions/upload-pages-artifact`, and publishes with `actions/deploy-pages` after CI succeeds on `main`; Vite `base` is `/optcg-sim/`; `404.html` is a copy of `index.html`. URL: https://chrisdevine00.github.io/optcg-sim/. Alternative rejected: pushing to a gh-pages branch (would require changing the owner's Pages setting). The stale `gh-pages` branch from the first run is deleted.

## 2026-10-23 — Defaults accepted from PROMPT.md

Product name `OPTCG Sim` (cosmetic, swappable). Stack: TypeScript strict + Vite + React, Vitest, Playwright. Hosting: GitHub Pages via GitHub Actions. Alternatives (Svelte, Vercel, Netlify) remain open and are one-file changes.
