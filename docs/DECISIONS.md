# Decisions

Newest first. One dated paragraph per decision: context, decision, alternatives rejected.

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
