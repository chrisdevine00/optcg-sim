# Decisions

Newest first. One dated paragraph per decision: context, decision, alternatives rejected.

## 2026-10-28 — Tablet defence panel compacts instead of scrolling

Context: at 1024×690, the defence panel body had only 19 px of free height on macOS. Linux fonts wrap more text, so the panel scrolled on CI, and it would scroll for Linux and Windows users too.

Decision: on rails 280 px and narrower:
- the Attacker and Defender labels sit above the names, not in a 62 px column;
- the defender breakdown reads "+N staged", with the card names listed only in the Counter lane;
- the lane labels shrink to 52 px;
- the staging hint drops "ties go to the attacker", which the result line already states.

The e2e check now also requires at least 24 px of free height in every tall state at the adapted sizes. Rejected:
- letting the body scroll, which `board.md` forbids for decision panels;
- relaxing the test, which would hide a cross-platform failure.

## 2026-10-28 — M3 board implementation decisions

Context: the M3 builder made these choices while building the playable board.
1. **No coach strip yet.** The coach arrives with the learning slice, and an empty strip would be dead UI. The decision panel keeps its `board.md` coordinates, and the strip's 48 px go to the log (and to the ticker when the panel is tall). Rejected: a placeholder strip of disabled buttons.
2. **Hotseat seat.** The screen always belongs to whoever owes the decision. A defence flips the board to the defender, whose hand stays hidden until they hold R. When play returns to the attacker, their hand stays hidden until they click or press Space. Rejected: keeping the attacker's view throughout, which leaves the attacker's hand on screen while the defender looks.
3. **Accessible names from content.** Cards and zones take their accessible name from visually hidden text instead of `aria-label`, because axe's label-in-name rule (WCAG 2.5.3) failed on the card art. Rejected: suppressing the rule.
4. **Tablet footer.** Rails of 280 px and narrower get an 80 px footer, so the primary button keeps its 136 px minimum and its labels fit (UX-V12). Rejected: shortening labels or dropping key hints.
5. **Test-only setup parameters.** Setup reads URL parameters (`scenario`, `seed`, `speed`, `skip`, `paused`, `start`), and three named scenarios ship in the app so the e2e tests are deterministic. Rejected: a separate test build, which would test a different bundle from the one users get.

## 2026-10-28 — M2 engine implementation decisions

Context: the M2 engine author made these choices while implementing the frozen API.
1. **View handles.** A view handle is a hash of the viewer, the instance id and a hidden per-card key. The key is re-rolled when the card enters a hidden zone and on every shuffle. Instance ids stay stable except under the new-object rule (CR 3-1-6). Rejected: re-keying the instance ids themselves (breaks ARCHITECTURE §2.2 and the tests).
2. **Concession.** `legalActions` lists only the decider's actions, their own concede included. `reduce` accepts a concede from either player (CR 1-2-3).
3. **Unscripted Events cannot be played** (E-D8), rather than playing as a no-op.
4. **Deck-out** is checked when an operation draws from or touches an empty deck (CR 9-2-1-2 via rule processing), so scenarios may start with empty decks. Rejected: an immediate state check, which ends every minimal scenario.
5. **Choices** complete automatically at `max` picks; `done` is only for stopping early.
6. **State internals.**
   - DON!! are counts by location class, not instances.
   - Card definitions are copied into state, because `reduce` takes no lookup.
   - Instance ids use a separate RNG stream.
   - `summaryHash` hashes board positions, so internal refactors keep golden hashes.
7. **Additions to the API** (no frozen shape changed): `autoSkip`, `projectEvents`, `actionFromView`, `ProjectedView`, `startRecord`/`appendAction`, `ENGINE_VERSION`, `validateDeck`, plus the root scripts `test:nightly` and `bench`.
8. **Ordering and preview.** When the turn player has two or more replacement effects, they resolve in canonical order until M4 adds the `order` decision. `preview` is keyed by instance ids; M3 adds a handle-keyed preview for the app as an addition.

Alternatives rejected are noted per item.

## 2026-10-28 — Frozen engine API amended after the independent test author's report

Context: the independent test author (branch `m2-independent-tests`: 132 tests and 183 todos, written without seeing engine source) found three gaps in the API frozen earlier today. First, `Omit<Action, …>` does not distribute over the `Action` union, so the fixtures' documented `g.act({ type: 'attack', … })` did not typecheck. Second, `PlayerView` exposed only the decision and actions, so visibility rules (CR 3-1-4 public zone counts, CR 3-3-2 DON!! deck) could not be tested. Third, event names were not frozen. It also found a data gap: OP05-022, a Leader with printed [Blocker], had no keywords, because only meta cards had verified overrides.

Decision:
- **Types.** Add `DistributiveOmit` and use it for `Intent` and in the fixtures.
- **PlayerView.** Add `turn`, `result`, `zones` (both players, `ViewCard` with `card: null` when hidden and handles re-keyed per ARCHITECTURE §2.7) and `don` counts.
- **Events.** Export a frozen `GameEventType` union. A trash that is not a K.O. never emits `KO`.
- **Data.** Add a verified override for OP05-022 (Limitless cross-check). Non-meta cards get keyword overrides when a test or a script needs them.

The engine author applies the API changes in its next commit. Alternatives rejected: leaving the bug and making the tests work around it; letting the tests read internal state.

## 2026-10-28 — Engine public API and test fixtures frozen for M2

Context: PLAN §5 requires the fixture API to be frozen before M2. The engine author and an independent test author can then work in parallel, and the tests encode the rules rather than the implementation. Decision:
- **Frozen API.** `engine/src/api.ts` fixes the public types: `GameSetup`, `ScenarioSpec` with `PlayerSpec` and `CardPlacement`, `Action`, `Decision`, `DonClass`, `PlayerView`, `Preview`, `GameRecord`, `Queries` and `IllegalAction`.
- **Stubs.** `engine/src/game.ts` holds stub entry points that throw until implemented.
- **Card lookup.** Card data is injected as a `CardLookup`, so the engine never loads JSON.
- **Read-only access.** Tests observe the game only through `queries` (zone, card, decision, turn, DON!!, result). `GameState` is opaque to them.
- **Fixtures.** `engine/test/fixtures/` offers `scenario()` with defaults (seed 1, turn 3, p1 active, Main Phase) and a `TestGame` with `act`, `legal`, `find`, `leader`, `power` and `life`. Every action is checked against `legalActions`, and the invariants are checked after every step.
- **Change rule.** Changing any frozen shape needs an entry here and an update to the independent tests.

Alternatives rejected: letting tests read `GameState` fields (it couples tests to internals); a fluent builder DSL for scenarios (plain objects are easier to read and to diff).

## 2026-10-28 — M1 card data decisions

Context: building `cards:update` and verifying the 182 meta cards raised five choices.

1. **Blocks follow the printed icons, not a formula.** topics/013.php implies four boosters per block, but official pages and Limitless show OP-13 to OP-15 as block 4 and OP-16 and OP-17 as block 5. `standard.json` uses the printed icons and lists the 9 cards printed with block X. No source gives a block for 9 starter products or for most promos, so 185 cards show legality "unknown" in the browser. The deck builder will say so rather than guess.
2. **Type vocabulary addendum.** 73 type names never appear alone in optcgapi, so they cannot be learned from it. They live in a cited addendum (official series page entries or Limitless pages). It is a list of names, not card data.
3. **Disagreement reads.** Disagreements between optcgapi and Limitless were settled one card at a time: 14 meta cards and 7 non-meta cards that blocked the run. Where a cached copy of the official page existed from the Track B or Track F research fetch, it was used instead of a fresh fetch. Only two fresh official pages were read (OP-01, OP-11). Each correction is an override with its source URL. This keeps to ADR 0007: the pipeline itself never fetches the official site.
4. **Set data loads lazily.** Set JSON is bundled as lazy chunks through `import.meta.glob` (`@optcg/cards/browser` entry), instead of copying the files and fetching them at runtime.
5. **Browser-only keyword filter.** The card browser's keyword filter matches card text for browsing only. Gameplay keywords come only from verified overrides (E-D7).

Alternatives rejected: a block formula (wrong for OP-16); failing the run on about 90 multi-type strings; fresh bulk fetches of the official list.

## 2026-10-28 — M0: tokens in the app, fonts self-hosted, contrast enforced in CI

Context: M0 needs the design tokens in the app, self-hosted fonts within the visual-system budget (about 70 KB Inter, about 40 KB Fraunces, Latin), and a contrast check that fails CI. Decision:
- `app/src/styles/tokens.css` is the source of truth from now on; `docs/design/tokens.css` stays as the Phase 4 snapshot.
- `scripts/contrast.ts` checks all 72 declared pairs in both themes. It runs in `npm run build` (`check:contrast`) and in `app/test/tokens.test.ts`.
- Fonts come from `@fontsource-variable/inter` 5.3.0 (wght, 48 KB Latin) and `@fontsource-variable/fraunces` 5.3.0 using the **wght-only** file (37 KB Latin). The opsz file is 67 KB; Fraunces is used only for headings at 24–40 px, where the default display cut is right, so the optical-size axis is not worth 30 KB.
- An e2e test proves both fonts load and that numerals are tabular.

Alternatives rejected: the Fraunces opsz file (over budget); a CDN (the product is local-first and offline-capable).

## 2026-10-28 — Phase 4 gated; on-board disclaimer form

Context: PROMPT.md requires the unofficial-fan-tool disclaimer in every page footer, but the full-height game board has no footer (`board.md` OQ-6). The verification pass in `docs/design/review-1.md` §6.7 found no open severity-3 or severity-4 finding.

Decision: Phase 4 is gated.
- **Disclaimer.** Every non-board page carries the full disclaimer in its footer. The board carries it as a visible two-line notice under the rail header, at 12 px. Its accessible name is the full disclaimer text, and Settings → About carries the full text with all sources. The owner may change the form; that is a one-component change.
- **Carried to M3** (severity 2): the defence card preview covers both players' Character slots 1–2; on tablet rails two button labels overflow by 6–11 px, and one button is 115 px wide against a 136 px minimum. Screenshots at the adapted sizes (1280×600, 1024×690, 1180×740) are also taken in M3.

Alternatives rejected: a disclaimer only in Settings (it would not be on every page); hiding it on the board behind an info icon (the reviewer showed the hover text was incomplete and easy to miss).

## 2026-10-28 — Design review 1 fixes; AI-turn target stays at 8 s

Context: review 1 found 11 severity-3 problems, among them a defence panel that overflowed at 1280 and an Enter key that committed counters too small to stop the hit. A fixer applied all 22 conflict rulings and fixed every severity-3 problem, with measurements recorded in `review-1.md`. The review's longer dwell times on attacks and results put a typical Warlord turn at about 9.2 s at 1× speed.

Decision:
- **Defence panel.** It grows over the log at both resolutions, and its footer keeps the same position.
- **Defence commits.** Every defence offers "Take the hit" and a separate commit. Enter only commits a counter that actually stops the hit.
- **Skip.** "Skip to my decision" stops at the player's own defensive decisions.
- **Review.** It has an Overview mode and a full-size Study mode, with no text under 12 px.
- **Keyboard.** One tab stop per zone, with shortcuts.
- **Disclaimer.** The board shows a visible two-line disclaimer whose accessible name is the full text. The owner may still change its form.
- **New screens.** Learn, Progress, History, Study and error screens.
- **AI-turn target.** It stays at 8 s or less at 1× speed (the PLAN M5a criterion). Dwell times get tuned against real AI turns in M5a, and Step and 0.5× remain available for anyone who wants a slower pace.

Alternatives rejected: relaxing the target to 10 s (waiting is the most common complaint about AI opponents); dropping the review's dwell increases outright (the reviewer showed that attacks were hard to follow).

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
