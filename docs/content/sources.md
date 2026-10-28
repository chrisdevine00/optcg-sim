---
title: "Sources for the learning content"
asOf: 2026-10-28
confidence: high
sources:
  - docs/research/meta-landscape.md
  - docs/research/strategy-concepts.md
  - docs/research/data-sources.md
---

# Sources

Every article, page and data set used by `docs/content/` (Phase 3, Track G), with the date and what it was used for. Tags in square brackets are how the content files cite each source.

**Rules for using a source** (DECISIONS.md, 2026-10-28):
- Only freely readable pages that were read in full. No paywalled guides, no search snippets.
- robots.txt was checked on each host before any fetch (copies in `.cache/track-g/robots/`, gitignored). Hosts that disallow Anthropic agents are not used, even where earlier research collected their material.
- Fetches used `curl` with the user agent `optcg-sim-research/0.1 (+https://github.com/chrisdevine00/optcg-sim)`, 2–3 seconds apart. Saved copies are in `.cache/track-g/` (gitignored).

## Rules (official)

| Tag | Source | Date | Used for |
|---|---|---|---|
| [CR x-y-z] | Bandai, Comprehensive Rules v1.2.1 — https://en.onepiece-cardgame.com/pdf/rule_comprehensive.pdf?20260828, digested in `docs/research/rules-digest.md` | 2026-08-28 | Every rule number in the glossary, curriculum and guides |
| [BANDAI-EXP] | Bandai, "For experienced TCG players" — https://en.onepiece-cardgame.com/experienced-tcg-players/ (no robots.txt; returns 404) | undated (mentions OP-17); read 2026-10-28 | Official framing: Life as a resource, DON!! in reserve for Counter Events, the Leader as the deck's direction (curriculum L06, L09, L11, L14, L19) |
| — | Bandai, banned and restricted list — https://en.onepiece-cardgame.com/news/restriction.html | effective 2026-10-12 | Glossary format terms (via meta-landscape.md) |
| — | Bandai, Block Number System — https://en.onepiece-cardgame.com/topics/013.php | 2026 | Glossary "Standard Regulation" (via meta-landscape.md) |

## Meta data and card text

| Tag | Source | Date | Used for |
|---|---|---|---|
| [ML] | `docs/research/meta-lists.json` and `docs/research/meta-landscape.md` (Track D): Limitless Play public API, 33 English Standard online events, 36 decklists | window 2026-07-30 to 2026-10-28; as of 2026-10-28 | Archetype set, top-8 counts, meta share, card copies per list, the three sourced lists in every guide |
| [CARD] | Limitless TCG card pages — https://onepiece.limitlesstcg.com/cards/{ID} (robots.txt: `User-agent: * / Disallow:` — all allowed) | fetched 2026-10-28 (146 card pages, 2 s apart) | Exact card text for every leader and every "defining card"; repairs optcgapi's dropped minus signs and missing second paragraphs |
| — | optcgapi.com bulk dumps (`.cache/track-b/raw/optcgapi-allSetCards.json`, `optcgapi-allSTCards.json`, `optcgapi-promos-P.json`) | scraped up to 2026-10-28 | First pass of card text, cost, power and counter for every card in the 36 lists (`.cache/track-g/arch/`); cross-checked against [CARD] where quoted |
| [OPM] | opmetagame.com tier list — https://opmetagame.com/tier-list/ (as recorded in meta-landscape.md) | "OP-17 Meta (October 2026)" | Tier labels in guide headers |
| [TCGP-DAL] | Hayden "The Egman" Kaustinen, "The Top Decks from the Dallas Finals and Flame-Flame Coliseum", TCGplayer — https://www.tcgplayer.com/content/article/The-Top-Decks-from-the-Dallas-Finals-and-Flame-Flame-Coliseum/44f2543e-fc30-432f-b4e2-f2bd5c1697f9/ | 2026-09-23 | Quotes recorded by Track D in meta-landscape.md only (Dallas placings, Rocks's pre-ban Mihawk matchup, Robin and Sabo notes). Not re-fetched: TCGplayer's deck pages are disallowed by robots.txt and its content API was blocked by the permission system |

## Archetype guides (Shonen TCG)

Shonen TCG (https://www.shonentcg.com) writes under house pen names ("Kai Tanaka", "Alex Chen", "Ryu Nakamura"). Its robots.txt explicitly allows `ClaudeBot` and `anthropic-ai`. Its deck guides average Limitless Play decklists, state their sample, and give matchup records from Limitless Play pairings; those records come from the same online platform as [ML] but a different window and method, so they are an independent analysis, not an independent data source. Reddit quotes inside these articles are not reused.

| Tag | Article | Published / updated | Used for |
|---|---|---|---|
| [SH-XEB] | "OP-17 Xebec Deck Guide: Blue Rocks Pirates Build 2026" — https://www.shonentcg.com/blog/op-17-xebec-deck-guide | 2026-09-05 / 2026-10-13 | OP17-039 guide: plan, curve simulation, card roles, Buckin trap, mulligan baseline, matchup records |
| [SH-ROB] | "Nico Robin Deck Guide: OP-17 Purple Yellow Build for 2026" — https://www.shonentcg.com/blog/op-17-nico-robin-deck-guide | 2026-10-01 / 2026-10-15 | OP09-062 guide |
| [SH-LA] | "Luffy Ace Deck Guide: Red Green ST30 Build for 2026" — https://www.shonentcg.com/blog/op-17-luffy-ace-deck-guide | 2026-10-02 / 2026-10-15 | ST30-001 guide |
| [SH-SAB] | "Sabo deck guide: OP17 Red/Black Elbaph Build Plan 2026" — https://www.shonentcg.com/blog/op17-red-black-sabo-deck-guide | 2026-09-24 / 2026-10-19 | OP13-004 guide |
| [SH-KAI] | "OP-17 Kaido Deck Guide: Purple Removal, Not Ramp 2026" — https://www.shonentcg.com/blog/op-17-kaido-deck-guide | 2026-09-07 / 2026-10-12 | OP17-058 guide |
| [SH-RGL] | "Red Green Luffy Deck Guide: OP-17 Decklist and DON!! Plan" — https://www.shonentcg.com/blog/op-17-red-green-luffy-deck-guide | 2026-10-16 | OP13-001 guide |
| [SH-PEN] | "Purple Enel Deck Guide: OP-17 Sky Island Build 2026" — https://www.shonentcg.com/blog/op-17-purple-enel-deck-guide | 2026-10-01 / 2026-10-15 | OP15-058 guide |
| [SH-ENC] | "OP-17 Enel Tech Cards: 3 Verified Picks by Color (2026)" — https://www.shonentcg.com/blog/op-17-enel-counter-guide | 2026-09-15 / 2026-10-12 | Playing against OP15-058 |
| [SH-BLU] | "OP-17 Luffy Deck Guide: Black's New Cost-12 Blocker Plan" — https://www.shonentcg.com/blog/op-17-luffy-black-deck-guide | 2026-09-06 / 2026-10-27 | OP17-079 guide |
| [SH-HAN] | "Blue Yellow Hancock Deck Guide: OP-17 Decklist (2026)" — https://www.shonentcg.com/blog/op-17-blue-yellow-hancock-deck-guide | 2026-10-13 / 2026-10-17 | OP14-041 guide |
| [SH-ROS] | "OP-16 Rosinante Deck Guide: Purple-Yellow Law 2026" — https://www.shonentcg.com/blog/op-16-purple-yellow-rosinante-deck-guide | 2026-06-18 / 2026-09-16 | OP12-061 guide (OP16-era; dated where noted) |
| [SH-YEN] | "Yellow Enel Deck for OP-17: Two Winning Big Mom Lists" — https://www.shonentcg.com/blog/op-17-yellow-enel-deck-guide | 2026-10-18 | OP05-098 guide |
| [SH-KAL] | "Kalgara Deck List for OP-17: Two Yellow Lists Compared" — https://www.shonentcg.com/blog/op-17-yellow-kalgara-deck-guide | 2026-10-18 | OP08-098 guide |
| [SH-BEST] | "Best One Piece TCG Decks Right Now: Current OP-17 Meta" — https://www.shonentcg.com/blog/best-one-piece-tcg-decks-right-now-2026 | 2026-09-29 / 2026-10-28 | Post-ban records and standings cross-check |
| [SH-TIER] | "OP-17 Meta Tier List (October 2026): After the Mihawk Ban" — https://www.shonentcg.com/blog/op-17-meta-tier-list | 2026-09-09 / 2026-10-21 | Tier and win-rate cross-check |
| [SH-MUC] | "OP-17 matchup chart" — https://www.shonentcg.com/blog/op-17-matchup-chart | 2026-10-22 (reviewed 2026-10-21) | Post-ban overall records and best/worst pairings, Limitless Play 2026-10-05 to 10-15; the only per-opponent records for Rosinante, Yellow Enel and Kalgara |
| [SH-1M] | "OP-17 One-Month Meta Report: Leaders After Release" — https://www.shonentcg.com/blog/op-17-one-month-meta-report | 2026-09-28 / 2026-10-21 | Pre-ban context cross-check |

## Strategy fundamentals (curriculum)

| Tag | Article | Published / updated | Used for |
|---|---|---|---|
| [SH-CTR] | Alex Chen, "One Piece TCG Counter Rules: Counter Step and Values" — https://www.shonentcg.com/blog/one-piece-tcg-counter-mechanic-explained | 2026-06-05 / 2026-10-13 | Ties go to the attacker; when to counter; Blocker vs Counter; over-countering (L04, L05, L10, L15) |
| [SH-MUL] | Alex Chen, "One Piece TCG Mulligan Guide" — https://www.shonentcg.com/blog/one-piece-tcg-mulligan-guide | 2026-06-06 / 2026-10-21 | Three keep questions, odds table, first vs second keeps, "name two things by turn three" (L12, L19; OP13-001 mulligan odds) |
| [SH-DON] | Alex Chen, "One Piece TCG DON Cards: 10 Per Deck, Rest or Attach" — https://www.shonentcg.com/blog/one-piece-tcg-don-system-explained | 2026-06-07 / 2026-10-16 | DON!! table by seat, rest vs give, given DON!! returns, one job per turn, later swings must be bigger (L02, L03, L09, L13, L15, L16) |
| [SH-MIS] | Alex Chen, "One Piece TCG Common Beginner Mistakes: 9 to Avoid" — https://www.shonentcg.com/blog/one-piece-tcg-common-beginner-mistakes | 2026-06-10 / 2026-09-18 | Keep 1–3 counters; take Life high, defend low; count their DON!!; misreading lethal; fix order (Stage 2 order, L10, L11, L14–L18, L20) |
| [SH-DB] | Alex Chen, "One Piece TCG Deck Building Guide" — https://www.shonentcg.com/blog/one-piece-tcg-deck-building-guide | 2026-06-02 / 2026-10-16 | Counter counts and cost curve from 149 post-ban lists; Leader Life 5 vs 4 (L11, L18) |
| [SH-KEY] | Alex Chen, "One Piece TCG keywords explained" — https://www.shonentcg.com/blog/one-piece-tcg-keywords-explained | 2026-06-08 / 2026-09-18 | Downloaded and skimmed only; not cited |
| [HAKI] | Julian (Haki TCG), "How to Play One Piece TCG: 2026 Rules, Turns, Combat & Counters" — https://hakitcg.com/blog/how-one-piece-tcg-works-rules-guide-2026 | 2026-03-02 / 2026-10-24 | Battle math example, "no universal smallest attacker first rule", read the timing label (L04, L07, L15, L16) |
| [BOUNTY] | Bounty team, "Should you go first or second in One Piece TCG?" — https://www.bountytcg.app/en/blog/one-piece-tcg-going-first-or-second | 2026-08-21 | Turn-order defaults, deck fit, Banish flips the choice, beginners go second (L11, L13, L17, L20) |

## robots.txt checked on 2026-10-28

| Host | Result |
|---|---|
| www.shonentcg.com | `User-Agent: *` Allow `/`; `ClaudeBot` and `anthropic-ai` Allow `/` |
| hakitcg.com | `User-agent: *` Allow `/`; `ClaudeBot`, `anthropic-ai` Allow `/` |
| tcgtalk.com | Allow `/` for `*`, `ClaudeBot`, `anthropic-ai` (not used in the end) |
| www.bountytcg.app | Allow `/` for `*`, `ClaudeBot`, `Claude-User`, `Claude-SearchBot` |
| geekydomain.com, tcgprotectors.com | Shopify defaults; `/blogs/` allowed (not used in the end) |
| onepiece.limitlesstcg.com | `User-agent: * / Disallow:` (all allowed) |
| opmetagame.com | Allow `/` (not re-fetched; Track D record used) |
| www.tcgplayer.com | `Crawl-Delay: 10`, `Disallow: /content/*/deck/` (not re-fetched) |
| en.onepiece-cardgame.com | 404, no robots.txt |

## Not used

| Source | Why |
|---|---|
| onepiece.gg (strategy-concepts.md S1–S6, tier lists) | robots.txt disallows `anthropic-ai` and `Claude-Web`. Under the 2026-10-28 decision, material collected from it earlier is not used here, even though strategy-concepts.md still cites it |
| SeaKing, DuelVoyager, Egman Events (deckbuilder.egmanevents.com), onepiecedb.io | robots.txt disallows Anthropic agents |
| Metafy guides, Patreon posts | Paywalled or not readable in full |
| Reddit (including Reddit quotes inside Shonen TCG articles) | Not fetched; secondhand quotes are not cited |
| YouTube videos (iKailaKai, Car D. Kaizoku, others) | Not watched; titles only |
| TCGplayer articles other than the Dallas article | Body not readable (client-rendered) |
