# Meta landscape: English format

**As of:** 2026-10-28
**Window studied:** 2026-07-30 to 2026-10-28 (90 days)
**Scope:** English game (Bandai's "English - NA / EU / OC / LATAM / ME" region), Standard Regulation.
**Companion data:** `docs/research/meta-lists.json` (12 archetypes, 36 decklists as card IDs, each main deck checked at 50 cards).

> **Headline caveats, read first**
> 1. **The top deck of the window is now banned.** OP14-020 Dracule Mihawk had the most top-8 finishes (47) and the largest share (15.1%), but it has been banned since 2026-10-12. It is listed here for context and left out of the archetype set.
> 2. **The counted data is online play only.** The Limitless tournament database (onepiece.limitlesstcg.com) has no events after 2026-07-26. It has not yet added the Season 2 Regionals or the Season 1 Finals held in the window. Complete in-person standings were not available from any source I could use (see "Sources not used"). The counts below therefore come from Limitless-platform online events (simulator play, Swiss, mostly best-of-one). In-person results are used only to cross-check.
> 3. **The post-ban sample is small:** 7 events, 342 decklists, 56 top-8 slots.

---

## Pages opened

Every URL below was fetched during this research. Search-engine queries are listed separately because their result pages were not opened as sources.

**Official site (en.onepiece-cardgame.com)**
- https://en.onepiece-cardgame.com/robots.txt (returned 404)
- https://en.onepiece-cardgame.com/ (home: product banners and news)
- https://en.onepiece-cardgame.com/news/restriction-261001.html (notice announced 2026-09-24, effective 2026-10-12)
- https://en.onepiece-cardgame.com/news/restriction.html (the current master banned/restricted list)
- https://en.onepiece-cardgame.com/news/restriction-archive.html (history of the list)
- https://en.onepiece-cardgame.com/topics/029.php (changes effective 2026-04-01)
- https://en.onepiece-cardgame.com/topics/019.php (changes effective 2025-08-30, which introduced banned pairs)
- https://en.onepiece-cardgame.com/topics/013.php (introduction of the Block Number System)
- https://en.onepiece-cardgame.com/topics/025.php (development team letter; fetched, but no block text was extracted)
- https://en.onepiece-cardgame.com/rules/
- https://en.onepiece-cardgame.com/rules/blockicon-card/ (cards whose block number was updated)
- https://en.onepiece-cardgame.com/events/
- https://en.onepiece-cardgame.com/events/2026/championship/
- https://en.onepiece-cardgame.com/events/26-27_Finals_Season_1.html
- https://en.onepiece-cardgame.com/events/regional-season2-26-27.html
- https://en.onepiece-cardgame.com/events/bcgfest26-27.html
- https://en.onepiece-cardgame.com/events/bcgfest25-26-orlando.html
- https://en.onepiece-cardgame.com/events/bcgfest26-27-london.html
- https://en.onepiece-cardgame.com/products/boosters/op17/
- https://en.onepiece-cardgame.com/products/st31.html
- https://en.onepiece-cardgame.com/products/st37.html
- https://en.onepiece-cardgame.com/products/st38.html
- https://en.onepiece-cardgame.com/products/eb05.html
- https://en.onepiece-cardgame.com/products/op18.html

**Limitless**
- https://onepiece.limitlesstcg.com/robots.txt (`User-agent: * / Disallow:` with nothing disallowed, so all pages are allowed)
- https://play.limitlesstcg.com/robots.txt (returned 404)
- https://onepiece.limitlesstcg.com/
- https://onepiece.limitlesstcg.com/tournaments
- https://onepiece.limitlesstcg.com/tournaments?time=3months&show=100 (empty)
- https://onepiece.limitlesstcg.com/tournaments?time=6months&show=100
- https://onepiece.limitlesstcg.com/tournaments?type=unofficial&show=100
- https://onepiece.limitlesstcg.com/tournaments?type=championship&show=50
- https://onepiece.limitlesstcg.com/tournaments/upcoming
- https://onepiece.limitlesstcg.com/decks?format=OP17 (empty)
- https://docs.limitlesstcg.com/developer.html and https://docs.limitlesstcg.com/developer/tournaments (the documented public API: no key needed, rate limit "50-in-5min")
- https://play.limitlesstcg.com/api/games
- https://play.limitlesstcg.com/api/tournaments?game=OP&limit=500
- https://play.limitlesstcg.com/api/tournaments/{id}/standings for these 57 tournament IDs, fetched one at a time with 7-second spacing: `6ad889ac115c12b73a5a8de9`, `6ad8884b8a8383117e3f0953`, `6adc5e8691617679e849fa55`, `6adb579391617679e849ed4a`, `6ad1e9418a8383117e3ecdc7`, `6acc90ea115c12b73a5a1e5f`, `6ada02c78a8383117e3f14b6`, `6ad092d98a8383117e3ec310`, `6ad092328a8383117e3ec30c`, `6ad09157115c12b73a5a4654`, `6ac7892d245696afb3518d6b`, `6ac7880385920e4d25366a20`, `6ac7870a85920e4d253669db`, `6abeef48783097f8dcb758f9`, `6abf4a4d783097f8dcb75d5e`, `6abcff56783097f8dcb74097`, `6abcfe1c783097f8dcb74092`, `6abcfca9783097f8dcb7408b`, `6ab613e7880ed327106dc30c`, `6ab4e72af127b1b52c28101d`, `6ab4e651e905c1db687493fe`, `6ab4e5b8f127b1b52c28101c`, `6aacd8c4f127b1b52c27bd0e`, `6aab0f7138886b36383c1e14`, `6aab0e3ff1243e65f9802fec`, `6aab0d6338886b36383c1e09`, `6aa39894ab080c8c95800dcd`, `6aa266d3a4272c53be64cba2`, `6aa26598a4272c53be64cb9e`, `6aa26394a4272c53be64cb9a`, `6a9a5e57ab080c8c957f9663`, `6a981389ab080c8c957f7cbd`, `6a98104da4272c53be644c83`, `6a980df4ab080c8c957f7c63`, `6a8847835a30714095575f05`, `6a8f06390580a332c84204b0`, `6a8f03677a62de813013f933`, `6a8f02a77a62de813013f92f`, `6a438fca83fd320299bd49ef`, `6a74d089cdc0391d7fa5e7de`, `6a85a27278baaa6d1c2237c8`, `6a85a15c5a30714095574481`, `6a859fd478baaa6d1c2237a9`, `6a7d7ed32b308b6067b529d0`, `6a7d7b64cdc0391d7fa65402`, `6a7d793c2b308b6067b529c9`, `6a808f185a307140955713c4`, `6a72f170cdc0391d7fa5d226`, `6a72f07a2b308b6067b4a76f`, `6a72eef32b308b6067b4a76b`, `6a75d5912b308b6067b4c83b`, `6a69f434937230b102d48242`, `6a69f30e52c24ac2da64f096`, `6a69f18b52c24ac2da64f093`, `6a6a829052c24ac2da64f789`, `6a4eaec865724db9ded40826`, `6a636d15937230b102d43035`
- https://play.limitlesstcg.com/api/tournaments/6abcfca9783097f8dcb7408b/details
- https://play.limitlesstcg.com/tournament/6acc90ea115c12b73a5a1e5f/player/vasilispatralis/decklist (to confirm the format of decklist URLs)
- Card pages at https://onepiece.limitlesstcg.com/cards/{ID}, used for leader color, text, block and legality: OP17-039, OP09-062, ST30-001, OP13-004, OP17-058, OP13-001, OP15-058, OP17-079, OP14-041, OP12-061, OP05-098, OP08-098, OP14-020, OP17-020, OP08-058, OP16-001, OP17-001, OP11-001. Also used to check Standard legality: EB01-056, EB01-059, OP01-016, OP01-055, OP04-016, P-088, P-093, ST01-011, ST10-010, ST14-017.

**opmetagame.com** (a fan aggregator; its robots.txt allows all crawling)
- https://opmetagame.com/robots.txt, https://opmetagame.com/sitemap-index.xml, https://opmetagame.com/sitemap-0.xml
- https://opmetagame.com/tournaments/ (embedded data covers 300 of the site's 4,944 events, dated 2026-09-05 to 2026-10-04)
- https://opmetagame.com/tier-list/ ("OP-17 Meta (October 2026)")
- https://opmetagame.com/decks/
- https://opmetagame.com/decks/leader/purple-yellow-nico-robin/
- https://opmetagame.com/tournaments/topdecks-eu-final-2026-09-05/

**TCGplayer**
- https://www.tcgplayer.com/content/article/The-Top-Decks-from-the-Dallas-Finals-and-Flame-Flame-Coliseum/44f2543e-fc30-432f-b4e2-f2bd5c1697f9/ (the HTML shell, plus one WebFetch of it; the body is rendered client-side). The article body was read through the content endpoint the page itself calls: https://infinite-api.tcgplayer.com/content/article/44f2543e-fc30-432f-b4e2-f2bd5c1697f9/?source=tcgplayer (by Hayden "The Egman" Kaustinen, published 2026-09-23).
- https://infinite-api.tcgplayer.com/deck/one%20piece/550315/... (one deck embedded in that article) and https://infinite-api.tcgplayer.com/content/event/14364/ (event metadata: "Championship 26-27 Finals Dallas", 2026-09-19, 1,095 players). Two more probes returned 404: `/event/14364/` and `/content/events/14364/`.
- https://www.tcgplayer.com/robots.txt (`Crawl-Delay: 10`, `Disallow: /content/*/deck/`), and https://infinite-api.tcgplayer.com/robots.txt (returned 404).
- I stopped fetching from TCGplayer at this point. The local permission system blocked further requests to its content API, and its robots.txt disallows deck pages. Only the Dallas article was read.

**robots.txt checked; site content not opened (the file names Claude or Anthropic crawlers)**
- https://onepiece.gg/robots.txt: `Disallow: /` for `anthropic-ai` and `Claude-Web`. **No onepiece.gg pages were opened**, so every onepiece.gg tier is recorded as `null`.
- https://deckbuilder.egmanevents.com/robots.txt and https://onepiecedb.io/robots.txt: `Disallow: /` for `ClaudeBot`, `anthropic-ai` and `Claude-Web`, plus `ai-train=no`. Not opened.

**Web searches run (result pages not opened as sources):** "One Piece Card Game block rotation English format standard regulation 2026"; "en.onepiece-cardgame.com Standard Regulation block icon announcement"; "One Piece Card Game Championship 26-27 Finals Season 1 September 2026 ... results"; "\"Finals\" One Piece Card Game Dallas September 2026 top 8 decklists"; "tcgplayer One Piece Card Game best decks October 2026 Mihawk ban"; "onepiece.gg tier list OP17 October 2026".

---

## Format (English, as of 2026-10-28)

### Newest released products
| Product | English release | Status today | Source |
|---|---|---|---|
| OP-17 *The World's Strongest Warriors* (booster) | Pre-release 2026-08-21, release 2026-08-28 | **Newest legal booster.** The product page says its cards "are legal from the pre-release date in your LGS". | /products/boosters/op17/, home page |
| ST-31 to ST-36 (starter decks) | 2026-07-31 | Legal. ST-31 is a mono-red aggro deck, ST-32 mono-green, ST-33 mono-blue control, ST-34 mono-purple, ST-35 red/black midrange and ST-36 a midrange deck (descriptions from the home-page banners). | home page, /products/st31.html |
| Tournament Pack 2026 Vol.4; Premium Card Collection *Flame-Flame Fruit Coliseum*; Premium Card Collection *6 assort vol.2* | Oct 2026 / Sep 2026 / Sep 2026 | Listed as the newest releases on the Limitless home page | onepiece.limitlesstcg.com |
| EB-05 *ONE PIECE Heroines Edition vol.2* | **2026-10-30** (2 days away) | Not yet released. An errata apology was posted 2026-10-23. | /products/eb05.html, home page |
| OP-18 *The Dominance of God* | **2026-11-20** | Not yet released. Product pages state that cards become "tournament legal starting 7 days after the release date in your region". | /products/op18.html |
| ST-37, ST-38 | 2026-12-18 | Not yet released | /products/st37.html, /products/st38.html |

The prompt said Limitless showed OP17 and ST31 to ST36 as the latest. **That is confirmed**, with one addition: EB05 releases in English on 2026-10-30. Limitless lists upcoming Regionals from 2026-11-07 as "OP17" format and from 2026-11-28 as "OP18" format.

### Banned and restricted list (official, effective 2026-10-12)
Source: https://en.onepiece-cardgame.com/news/restriction.html (page dated October 12, 2026). Announced 2026-09-24 at https://en.onepiece-cardgame.com/news/restriction-261001.html.

| Card ID | Name | Status | Effective date (from the official notice pages opened) |
|---|---|---|---|
| OP14-020 | Dracule Mihawk (Leader) | **Banned**, including parallel (alt-art) printings | 2026-10-12. The replacement leader P-163 Dracule Mihawk is "planned" for distribution at future events. |
| OP06-047 | Charlotte Pudding | Banned | 2026-04-01 (topics/029.php) |
| OP03-040 | Nami (Leader) | Banned | 2025-08-30 (topics/019.php). The replacement leader is P-117 Nami. |
| OP06-086 | Gecko Moria | Banned | 2025-04-01 (the archive gives "Banned Card effective from April 1, 2025") |
| ST10-001 | Trafalgar Law (Leader) | Banned | 2024-09-06 (archive) |
| OP06-116 | Reject | Banned | 2024-06-21 (archive) |
| OP07-115 + EB04-058 | I Re-Quasar Helllp!! + Borsalino | **Banned pair**: cannot be in the same deck | No effective date appears on the pages opened (see Open questions) |
| OP11-040 + OP11-067 | Monkey.D.Luffy + Charlotte Katakuri | Banned pair | 2025-08-30 |
| OP11-040 + OP08-069 | Monkey.D.Luffy + Charlotte Linlin | Banned pair | 2025-08-30 |
| (none) | | **Restricted:** "There are currently no cards in this category." | |

Cards that were banned earlier and are now legal again:
- Unbanned 2026-04-01: OP07-045 Jinbe, EB01-059 Kingdom Come, ST06-015 Great Eruption, OP02-024 Moby Dick, OP03-098 Enies Lobby, OP02-117 Ice Age.
- Unbanned 2025-08-30: OP05-041 Sakazuki, OP02-052 Cabaji.

Bandai's stated policy is that revisions normally come "once after the conclusion of Championship Season 1 in Japan, and once after the World Championship", with emergency changes possible at any time.

### Rotation (block) status: in force for the English game
- **The Block Number System and Standard Regulation have applied since 2026-04-01.** The Regionals Season 2 page says: "Standard Regulation was applied on April 1, 2026." (https://en.onepiece-cardgame.com/topics/013.php, /events/regional-season2-26-27.html)
- **Legal blocks now (April 2026 to March 2027):** "cards ② to ⑤ will be allowed, while cards ① will not be allowed." Block 1 is booster sets 1 to 4 plus the matching block-1 starters. Each card's block number is printed in its lower-right corner.
- **Next rotation (April 2027 to March 2028):** blocks ③ to ⑥ allowed, ① and ② not.
- **Exceptions** (https://en.onepiece-cardgame.com/rules/blockicon-card/, updated 2026-07-17 and 2026-08-21):
  - Super Parallel Rare cards, and cards sharing their card number, stay Standard-legal. From April 2026 new ones carry block "X". The list of 37 includes OP01-016 Nami, OP01-120 Shanks, EB04-044 Koby and OP17-118 Rocks.D.Xebec.
  - 15 older cards are treated as block ④ (legal until 2029-03-31). Examples are OP01-039 Killer, OP01-055 You Can Be My Samurai!!, OP04-016 Bad Manners Kick Course and ST01-011 Brook.
  - Some reprints carry updated block numbers.
- **Extra Regulation** allows blocks ① through the newest. Bandai runs separate Extra Grand Battle events under it. I excluded those from the meta count.

---

## Events in the window (what exists versus what has data)

**In-person events that took place in the window** (from the official event pages; complete standings were **not** obtained):
- Season 1 Finals: Latin America, Santiago, 2026-08-15/16. Europe (CS-International), Utrecht, 2026-09-05/06. North America (Play!TCG), Dallas, 2026-09-18/19. Flame-Flame Fruit Coliseum side events were held in Utrecht and Dallas.
- Season 2 Regionals:
  - North America: Indianapolis (Gen Con) 08-01; Oklahoma City 08-08/09; Calgary 08-15; Kissimmee 08-29; Hampton VA 09-12/13; Gatineau 09-26/27.
  - Europe: Zagreb 08-15/16; Malmö 08-22/23; Utrecht 09-05/06; Athens 09-12; Prague 09-26/27; London 10-03/04.
  - Oceania: Auckland 08-29/30.
- Treasure Cup August 2026 and Store Championships (official event pages).

**Partial in-person results (cross-check only):**
- *Dallas Finals, 2026-09-19, 1,095 players* (per TCGplayer event metadata):
  - 1st Nicky Goldman, OP14-020 Mihawk (TCGplayer deck metadata "eventRank 1st").
  - 2nd Yonas, Purple Enel (opmetagame). TCGplayer covers "Yonas's Enel".
  - Seven07 finished top 4 with Rocks, and Justin T finished top 8 with Sabo (TCGplayer article).
  - TCGplayer says Nico Robin "was the 2nd most popular Leader during the weekend".
- *EU Finals, Utrecht, 2026-09-05* (opmetagame; 10 finishes recorded, only the top 3 with placings): 1st Frle Purple Enel; 2nd KDZ Millan Purple/Yellow Robin; 3rd Zyrios Green Mihawk. The other seven finishers had no placing: four Mihawk, two Enel, one B/Y Hancock and one Rocks.
- *Flame-Flame Fruit Coliseum NA blocks, 2026-09-20* (opmetagame). Block winners: Purple/Yellow Robin in blocks A, B and C, and Mihawk in block D. Runners-up: R/B Sabo in A and C, Mihawk in B, Blue Rocks in D.

---

## Methodology

1. **Source of the counts.** I used the documented Limitless public API at `https://play.limitlesstcg.com/api` and listed the 500 most recent One Piece tournaments. Of those, 186 fall in the window; I kept the 57 with 24 or more players. For each I pulled `/standings`, which gives the final placing, the W-L-T record, the full decklist and Limitless's automatic deck label. That label is the leader card ID, so archetype = leader ID.
2. **English-legal filter.** I removed:
   - Extra Regulation events (API `format: "EXTRA"` or an `[EGB]` tag): 8 events.
   - Events with no decklists: 6.
   - Events whose decklists contain cards not yet released in English on the event date: EB05 before 2026-10-30 (6 events, all tagged `[EB05]`); OP17 before its 2026-08-21 pre-release (3 events, 08-17 to 08-19); ST31 to ST36 before 2026-07-31 (1 event).
   - Any event on or after 2026-10-12 that still had an OP14-020 leader (none found).

   That leaves **33 eligible events, 2,089 categorized decklists and 264 top-8 slots**.
3. **Eras.**
   - **OP16** (07-30 to 08-20): 7 events.
   - **OP17 pre-ban** (08-21 to 10-11): 19 events.
   - **OP17 post-ban or ban-adopting** (10-01 to 10-28): 7 events. These include events from 10-01 to 10-08 tagged `[OP17 NEW BANNED]` or `[OP17.5]` that had no OP14-020 leaders, i.e. organizers applying the announced ban early. "OP17.5" is the organizers' label, and my reading of it is an inference.
4. **Top-8 count.** The number of final placings 1 to 8 for each leader ID, summed over the eligible events. Most of these events are Swiss-only with no top cut, so "top 8" means the final Swiss standings.
5. **Meta share.** The leader's percentage of all categorized decklists in the eligible events, given for the whole window and for the post-ban era.
6. **Archetype selection.** The 12 leaders with the most top-8s, excluding the banned OP14-020. Ties are broken by placing.
7. **Lists.** For each archetype, I took three top-8 lists from different events: the most recent first, then the better placing. Each list was checked mechanically:
   - the main deck totals 50;
   - no card above 4 copies;
   - no banned card and no banned pair;
   - no block-1 card (OP01 to OP04) that is missing from Bandai's exemption list.

   The 10 older-set cards that appear (EB01-056, EB01-059, OP01-016, OP01-055, OP04-016, P-088, P-093, ST01-011, ST10-010, ST14-017) were each confirmed "Standard: legal" on their Limitless card page. **All 36 lists passed.**
8. **Cross-check sources** (for "top tier"): the opmetagame.com tier list and meta-share chart (OP-17, October 2026; mixes regions, including Japan, and is pre-ban weighted), the TCGplayer Dallas article, and the partial in-person results above. I mark an archetype **top tier** only where at least two independent sources agree.

### Eligible events

| Date | Event | Players | Era | Link |
|---|---|---|---|---|
| 2026-08-03 | ChinoizeCup #91 Monday | 64 | OP16 | [standings](https://play.limitlesstcg.com/tournament/6a69f18b52c24ac2da64f093/standings) |
| 2026-08-04 | ChinoizeCup #92 Tuesday | 61 | OP16 | [standings](https://play.limitlesstcg.com/tournament/6a69f30e52c24ac2da64f096/standings) |
| 2026-08-05 | ChinoizeCup #93 Wednesday | 61 | OP16 | [standings](https://play.limitlesstcg.com/tournament/6a69f434937230b102d48242/standings) |
| 2026-08-09 | MINIATURE METROPOLIS BOX TOURNAMENT | 24 | OP16 | [standings](https://play.limitlesstcg.com/tournament/6a75d5912b308b6067b4c83b/standings) |
| 2026-08-10 | ChinoizeCup #94 Monday | 61 | OP16 | [standings](https://play.limitlesstcg.com/tournament/6a72eef32b308b6067b4a76b/standings) |
| 2026-08-11 | ChinoizeCup #95 Tuesday | 58 | OP16 | [standings](https://play.limitlesstcg.com/tournament/6a72f07a2b308b6067b4a76f/standings) |
| 2026-08-12 | ChinoizeCup #96 Wednesday | 57 | OP16 | [standings](https://play.limitlesstcg.com/tournament/6a72f170cdc0391d7fa5d226/standings) |
| 2026-08-24 | [OP17] ChinoizeCup #100 Monday | 64 | OP17 pre-ban | [standings](https://play.limitlesstcg.com/tournament/6a859fd478baaa6d1c2237a9/standings) |
| 2026-08-25 | [OP17] ChinoizeCup #101 Tuesday | 64 | OP17 pre-ban | [standings](https://play.limitlesstcg.com/tournament/6a85a15c5a30714095574481/standings) |
| 2026-08-26 | [OP17] ChinoizeCup #102 Wednesday | 58 | OP17 pre-ban | [standings](https://play.limitlesstcg.com/tournament/6a85a27278baaa6d1c2237c8/standings) |
| 2026-08-30 | ROAD TO FINALS UTRECHT - WIN A CASE | 240 | OP17 pre-ban | [standings](https://play.limitlesstcg.com/tournament/6a438fca83fd320299bd49ef/standings) |
| 2026-08-31 | [OP17] ChinoizeCup #103 Monday | 64 | OP17 pre-ban | [standings](https://play.limitlesstcg.com/tournament/6a8f02a77a62de813013f92f/standings) |
| 2026-09-01 | [OP17] ChinoizeCup #104 Tuesday | 64 | OP17 pre-ban | [standings](https://play.limitlesstcg.com/tournament/6a8f03677a62de813013f933/standings) |
| 2026-09-02 | [OP17] ChinoizeCup #105 Wednesday | 64 | OP17 pre-ban | [standings](https://play.limitlesstcg.com/tournament/6a8f06390580a332c84204b0/standings) |
| 2026-09-03 | Win a box OP17 \| Rumble league #7 \| OP17 | 32 | OP17 pre-ban | [standings](https://play.limitlesstcg.com/tournament/6a8847835a30714095575f05/standings) |
| 2026-09-07 | [OP17] ChinoizeCup #106 Monday | 64 | OP17 pre-ban | [standings](https://play.limitlesstcg.com/tournament/6a980df4ab080c8c957f7c63/standings) |
| 2026-09-08 | [OP17] ChinoizeCup #107 Tuesday | 64 | OP17 pre-ban | [standings](https://play.limitlesstcg.com/tournament/6a98104da4272c53be644c83/standings) |
| 2026-09-10 | [OP17] Win a box \| Rumble league #8 | 27 | OP17 pre-ban | [standings](https://play.limitlesstcg.com/tournament/6a9a5e57ab080c8c957f9663/standings) |
| 2026-09-14 | [OP17] ChinoizeCup #109 Monday | 64 | OP17 pre-ban | [standings](https://play.limitlesstcg.com/tournament/6aa26394a4272c53be64cb9a/standings) |
| 2026-09-15 | [OP17] ChinoizeCup #110 Tuesday | 60 | OP17 pre-ban | [standings](https://play.limitlesstcg.com/tournament/6aa26598a4272c53be64cb9e/standings) |
| 2026-09-17 | [OP17] Win a box \| Rumble league #9 | 32 | OP17 pre-ban | [standings](https://play.limitlesstcg.com/tournament/6aa39894ab080c8c95800dcd/standings) |
| 2026-09-21 | [OP17] ChinoizeCup #112 Monday | 64 | OP17 pre-ban | [standings](https://play.limitlesstcg.com/tournament/6aab0d6338886b36383c1e09/standings) |
| 2026-09-22 | [OP17] ChinoizeCup #113 Tuesday | 64 | OP17 pre-ban | [standings](https://play.limitlesstcg.com/tournament/6aab0e3ff1243e65f9802fec/standings) |
| 2026-09-24 | [OP17] Win a box \| Rumble league #10 | 25 | OP17 pre-ban | [standings](https://play.limitlesstcg.com/tournament/6aacd8c4f127b1b52c27bd0e/standings) |
| 2026-09-28 | [OP17] ChinoizeCup #115 Monday | 128 | OP17 pre-ban | [standings](https://play.limitlesstcg.com/tournament/6ab4e5b8f127b1b52c28101c/standings) |
| 2026-09-29 | [OP17] ChinoizeCup #116 Tuesday | 119 | OP17 pre-ban | [standings](https://play.limitlesstcg.com/tournament/6ab4e651e905c1db687493fe/standings) |
| 2026-10-01 | [OP17 NEW BANNED] Win a box \| Rumble league #11 | 27 | OP17 post-ban/ban-adopting | [standings](https://play.limitlesstcg.com/tournament/6ab613e7880ed327106dc30c/standings) |
| 2026-10-05 | [OP17.5] ChinoizeCup #118 Monday | 64 | OP17 post-ban/ban-adopting | [standings](https://play.limitlesstcg.com/tournament/6abcfca9783097f8dcb7408b/standings) |
| 2026-10-06 | [OP17.5] ChinoizeCup #119 Tuesday | 64 | OP17 post-ban/ban-adopting | [standings](https://play.limitlesstcg.com/tournament/6abcfe1c783097f8dcb74092/standings) |
| 2026-10-08 | [OP17.5] Win a box \| Rumble league #12 | 26 | OP17 post-ban/ban-adopting | [standings](https://play.limitlesstcg.com/tournament/6abf4a4d783097f8dcb75d5e/standings) |
| 2026-10-12 | [OP17.5] ChinoizeCup #121 Monday | 64 | OP17 post-ban/ban-adopting | [standings](https://play.limitlesstcg.com/tournament/6ac7870a85920e4d253669db/standings) |
| 2026-10-13 | [OP17.5] ChinoizeCup #122 Tuesday | 64 | OP17 post-ban/ban-adopting | [standings](https://play.limitlesstcg.com/tournament/6ac7880385920e4d25366a20/standings) |
| 2026-10-22 | [OP17]Win a Box - Aegean Pirate Cup #6 | 33 | OP17 post-ban/ban-adopting | [standings](https://play.limitlesstcg.com/tournament/6acc90ea115c12b73a5a1e5f/standings) |

---

## Ranked archetypes

Counts are from the 33 eligible Limitless-platform events. "Tier (opmetagame)" comes from https://opmetagame.com/tier-list/ and is matched to my rows by leader name and color, because that page does not print card IDs. Every onepiece.gg tier is `null` (not opened; see above).

| # | Leader ID | Name | Colors | Top-8 (window) | OP16 / OP17 pre-ban / post-ban | Meta share (window) | Meta share (post-ban) | onepiece.gg tier | opmetagame tier | Top tier (2+ sources)? | Sources |
|---|---|---|---|---|---|---|---|---|---|---|---|
| (banned) | OP14-020 | Dracule Mihawk | Green | **47** | 9 / 38 / 0 | 15.1% | 0% | null | S (pre-ban data) | Yes, pre-ban: Limitless #1, opmetagame #1 at 23.3% top-cut share, won the Dallas Finals | Limitless API; opmetagame; TCGplayer |
| 1 | OP17-039 | Rocks.D.Xebec | Blue | **32** | 0 / 22 / 10 | 11.2% | 16.1% | null | S | **Yes**: Limitless #1 legal deck; opmetagame S; Dallas top 4 (TCGplayer) | Limitless API; opmetagame; TCGplayer |
| 2 | OP09-062 | Nico Robin | Purple/Yellow | **23** | 0 / 21 / 2 | 7.8% | 2.6% | null | S | **Yes, pre-ban**: EU Finals 2nd, three NA Coliseum block wins, "2nd most popular" at Dallas. Post-ban online data is weak (see Disagreements). | Limitless API; opmetagame; TCGplayer |
| 3 | ST30-001 | Luffy & Ace | Red/Green | **20** | 2 / 10 / 8 | 6.2% | 12.3% | null | S | **Yes**: Limitless #2 post-ban; opmetagame S | Limitless API; opmetagame |
| 4 | OP13-004 | Sabo | Red/Black | **16** | 0 / 11 / 5 | 9.8% | 7.3% | null | S (A on /decks/) | **Yes**: opmetagame #2 top-cut share at 11.7%; Dallas top 8 (TCGplayer) | Limitless API; opmetagame; TCGplayer |
| 5 | OP17-058 | Kaido | Purple | **15** | 0 / 11 / 4 | 6.1% | 7.9% | null | A | Strong but not top tier; opmetagame has it at 5.9% top-cut share | Limitless API; opmetagame |
| 6 | OP13-001 | Monkey.D.Luffy | Red/Green | **15** | 12 / 1 / 2 | 3.3% | 1.5% | null | S ("Red/Green Luffy", 1.5% share) | No: 12 of its 15 top-8s came in the OP16 era | Limitless API; opmetagame |
| 7 | OP15-058 | Enel | Purple | **14** | 5 / 8 / 1 | 5.3% | 4.1% | null | S (B on /decks/) | **Yes, in person**: won the EU Finals, 2nd at the Dallas Finals | Limitless API; opmetagame; TCGplayer |
| 8 | OP17-079 | Monkey.D.Luffy | Black | **14** | 0 / 9 / 5 | 6.8% | 10.2% | null | S | Rising: 10.2% post-ban share; won the Utrecht Regionals (opmetagame) | Limitless API; opmetagame |
| 9 | OP14-041 | Boa Hancock | Blue/Yellow | **10** | 5 / 3 / 2 | 2.5% | 5.6% | null | A | No | Limitless API; opmetagame |
| 10 | OP12-061 | Donquixote Rosinante | Purple/Yellow | **10** | 5 / 2 / 3 | 2.2% | 4.4% | null | A | No | Limitless API; opmetagame |
| 11 | OP05-098 | Enel | Yellow | **8** | 1 / 4 / 3 | 1.1% | 2.0% | null | A | No | Limitless API; opmetagame |
| 12 | OP08-098 | Kalgara | Yellow | **5** | 0 / 1 / 4 | 0.6% | 2.9% | null | S (2 decklists tracked) | No: tiny sample, though 4 of its 5 top-8s are post-ban | Limitless API; opmetagame |

Just below the cut (window top-8s): OP17-020 Shanks (Green) 3, with 3 of 3 post-ban and one win on 2026-10-22; OP09-081 Teach, OP12-040 Kuzan and OP16-080 Teach with 3 each.

---

## What each deck does (sourced summaries)

Each summary combines the leader's text, taken from its Limitless card page (https://onepiece.limitlesstcg.com/cards/{ID}), with the cards that appear in at least 75% of that archetype's top-8 lists in my data. A sentence marked *(inference)* is my reading, not a quoted source.

- **OP17-039 Rocks.D.Xebec (Blue).**
  - *Leader:* a 5-life Slash leader. When it attacks, you may trash a card to reveal the top card of your deck, and you draw 2 if that card is "Rocks Pirates".
  - *Core cards in all 32 top-8 lists:* OP17-118 Rocks.D.Xebec, OP17-049 Charlotte Linlin, OP17-040 Edward.Newgate, OP17-048 Shiki, OP17-054 Miss Buckingham Stussy, OP17-046 Gloriosa, OP17-045 Kyo, and the events OP17-055 and OP17-056 Rocks Pirates. The deck is almost entirely OP17 Rocks Pirates.
  - *TCGplayer:* it has "a really unique and restrictive archetype". Its weakness was "an abysmal matchup into the most popular Leader", Mihawk, and the Dallas top-4 list cost "under $100".
  - *(inference)* With Mihawk banned, Rocks' worst matchup is gone, which fits its post-ban share rising to 16.1%.
- **OP09-062 Nico Robin (Purple/Yellow).**
  - *Leader:* a 4-life leader with Banish. When attacking, it can trash a [Trigger] card to add a rested DON!!.
  - *Core cards:* the yellow OP17 Big Mom Pirates package of OP17-112 Charlotte Linlin, OP17-107 Daifuku, OP17-109 Pudding, OP17-102 Oven and OP17-106 Smoothie, plus OP17-114 Sweet 3 Generals, OP09-078 Gum-Gum Giant, OP17-074 Yamato and OP16-119 Marshall.D.Teach.
  - *TCGplayer:* the build leans on cards with a "play trigger, like the rest of the cards in the OP17 Big Mom Pirates archetype", and OP16-119 Teach's Trigger "can win you the game on the spot".
- **ST30-001 Luffy & Ace (Red/Green).**
  - *Leader:* 4 life, 6000 power. It gets −2000 power if you have a 7000+ base-power Character, and on the opponent's turn all of your [Portgas.D.Ace] and [Monkey.D.Luffy] cards get +3000.
  - *Core cards:* OP12-015 and ST21-014 Monkey.D.Luffy, ST30-012 Monkey.D.Luffy, OP01-016 and EB02-017 Nami, ST31-001 Sanji, the ST31-005 Thousand Sunny stage, EB04-002 Jewelry Bonney and OP04-016 Bad Manners Kick Course.
  - *(inference)* It is a Straw Hat aggro deck whose defense comes from the leader's opponent-turn buff.
- **OP13-004 Sabo (Red/Black).**
  - *Leader:* −1000 power while you have 4 or more Life. With [DON!! x1], if you have a Character costing 8 or more, your Leader and all your Characters get +1000.
  - *Core cards:* the OP17 Elbaph Straw Hats (OP17-080 Usopp, OP17-095 Zoro, OP17-089 Jaguar.D.Saul, OP17-082 Sanji, OP17-087 Robin, OP17-093 Luffy, OP17-119 Loki) and OP15-088 Pirates Docking Six.
  - *TCGplayer:* Sabo "has been given a new life with OP17's Elbaph archetype", and Docking Six is "a pretty mandatory four-of".
- **OP17-058 Kaido (Purple).**
  - *Leader:* once per turn, on your attack or the opponent's, DON!! −1 gives an opposing Character −2000.
  - *Core cards:* EB04-031 King, EB04-032 Queen, OP17-073 Basil Hawkins, OP17-074 Yamato, OP17-062 and OP17-063 Kaido, OP07-077 We're Going to Claim the One Piece!!!, ST34-004 Charlotte Linlin and OP15-078 Mamaragan.
  - *(inference)* A DON!!-minus Animal Kingdom Pirates deck that uses the leader to shrink attackers and blockers.
- **OP13-001 Monkey.D.Luffy (Red/Green).**
  - *Leader:* on the opponent's attack, with 5 or fewer active DON!!, rest any number of DON!! to give +2000 per DON!! to the Leader or a Straw Hat Crew Character.
  - *Core cards:* OP14-022 Usopp, OP13-027 Sanji, EB04-007 Zoro, OP14-031 Nami, OP05-038 Charlestone, ST31-004 Luffy, OP13-118 Luffy and ST31-005 Thousand Sunny.
  - *Data note:* 12 of its 15 top-8s came in the OP16 era. It faded once OP17 arrived.
- **OP15-058 Enel (Purple).**
  - *Leader:* its DON!! deck is 6 cards. Once per turn from your second turn, it ramps DON!! and puts up to 4 rested DON!! onto one Character.
  - *Core cards:* OP15-061 Ohm, OP15-067 Shura, OP15-074 Varie, OP15-075 to OP15-078 (El Thor, Lightning Beast Kiten, Lightning Dragon, Mamaragan), OP12-071 Pudding and OP15-118 Enel.
  - *TCGplayer:* Enel "returned with a vengeance" before Dallas and has "a whole toolbox of tech cards". It won the EU Finals (opmetagame).
- **OP17-079 Monkey.D.Luffy (Black).**
  - *Leader:* all your Characters costing 12 or more gain [Blocker].
  - *Core cards:* the Elbaph big-cost package of OP17-094 Rodo, OP17-081 Gerd, OP17-119 Loki and OP17-089 Saul, plus OP17-080 Usopp, OP17-095 Zoro, OP17-087 Robin, OP17-093 Luffy and OP15-088 Pirates Docking Six.
  - *(inference)* A black Elbaph ramp-to-giants deck. It shares much of Sabo's card pool.
- **OP14-041 Boa Hancock (Blue/Yellow).**
  - *Leader:* draws when you play a Character on the opponent's turn. When one of your Amazon Lily or Kuja Pirates Characters with 5000+ base power is K.O.'d, it adds the top card of the opponent's Life to their hand.
  - *Core cards:* OP14-112 Boa Hancock, OP14-105 Gorgon Sisters, OP14-107 Shakuyaku, OP14-114 Ran, OP16-113 Boa Marigold and EB04-058 Borsalino.
- **OP12-061 Donquixote Rosinante (Purple/Yellow).**
  - *Leader:* protects [Trafalgar Law] from K.O. by taking a Life card instead, and DON!! −1 reduces the next Law with cost 4 or more by 2.
  - *Core cards:* P-088, P-093 and ST10-010 Trafalgar Law, EB04-038 Rosinante & Law, OP16-064 Koby, OP16-065 Sakazuki, OP16-078 Marineford, OP12-115 I Love You!!, OP15-078 Mamaragan and EB04-058 Borsalino.
- **OP05-098 Enel (Yellow).**
  - *Leader:* once per turn on the opponent's turn, when your Life hits 0, add the top card of your deck to Life, then trash a card.
  - *Core cards:* OP11-106 Zeus, EB04-058 Borsalino, OP16-119 Teach, the yellow OP17 Big Mom package (OP17-102, -107, -109, -112, -114), OP06-115 and OP15-113 Zoro. Six of the eight lists also run EB01-059 Kingdom Come, which was unbanned 2026-04-01.
- **OP08-098 Kalgara (Yellow).**
  - *Leader:* 5 life, Slash. With [DON!! x1], when attacking it plays a Shandian Warrior from hand with cost up to the DON!! on your field, then adds the top Life card to hand.
  - *Core cards:* OP15-101 and OP12-099 Kalgara, OP08-110, OP12-114 and OP15-114 Wyper, OP08-109 Mont Blanc Noland, the OP05-117 Upper Yard stage, EB03-053 and OP15-108 Nami, and EB04-058 Borsalino.
- **(Banned) OP14-020 Dracule Mihawk (Green).**
  - *Leader:* +1000 power against Slash leaders. Once per turn it can rest a card to set 3 DON!! active if you have a cost-5+ Character, after which you can't play Characters that turn.
  - *Why it was banned:* Bandai said it "significantly restricts the viability of Leader cards with the {Slash} attribute". TCGplayer called it "the best deck in the OP17 format by default".

---

## Collected lists (36; each main deck = 50, all legality checks passed)

Full card-ID lists are in `docs/research/meta-lists.json`. All links go to Limitless decklist pages. Players are named as published.

**OP17-039 Rocks.D.Xebec**

| Event | Date | Players | Placing | Record | Player | List |
|---|---|---|---|---|---|---|
| [OP17.5] ChinoizeCup #122 Tuesday | 2026-10-13 | 64 | 6th | 5-1-0 | Gefen H | [decklist](https://play.limitlesstcg.com/tournament/6ac7880385920e4d25366a20/player/gefen1/decklist) |
| [OP17.5] ChinoizeCup #121 Monday | 2026-10-12 | 64 | 2nd | 5-1-0 | Frodon | [decklist](https://play.limitlesstcg.com/tournament/6ac7870a85920e4d253669db/player/frodon/decklist) |
| [OP17.5] Win a box \| Rumble league #12 | 2026-10-08 | 26 | 5th | 4-1-0 | Pacio23 | [decklist](https://play.limitlesstcg.com/tournament/6abf4a4d783097f8dcb75d5e/player/pacio23/decklist) |

**OP09-062 Nico Robin**

| Event | Date | Players | Placing | Record | Player | List |
|---|---|---|---|---|---|---|
| [OP17.5] ChinoizeCup #118 Monday | 2026-10-05 | 64 | 6th | 5-1-0 | Halox | [decklist](https://play.limitlesstcg.com/tournament/6abcfca9783097f8dcb7408b/player/halox/decklist) |
| [OP17 NEW BANNED] Win a box \| Rumble league #11 | 2026-10-01 | 27 | 2nd | 4-1-0 | 0xDVS | [decklist](https://play.limitlesstcg.com/tournament/6ab613e7880ed327106dc30c/player/0xdvs/decklist) |
| [OP17] Win a box \| Rumble league #10 | 2026-09-24 | 25 | 5th | 3-2-0 | Meid | [decklist](https://play.limitlesstcg.com/tournament/6aacd8c4f127b1b52c27bd0e/player/meid/decklist) |

**ST30-001 Luffy & Ace**

| Event | Date | Players | Placing | Record | Player | List |
|---|---|---|---|---|---|---|
| [OP17]Win a Box - Aegean Pirate Cup #6 | 2026-10-22 | 33 | 6th | 4-1-0 | kakopaiktis | [decklist](https://play.limitlesstcg.com/tournament/6acc90ea115c12b73a5a1e5f/player/kakopaiktis/decklist) |
| [OP17.5] ChinoizeCup #122 Tuesday | 2026-10-13 | 64 | 2nd | 5-1-0 | not_dev | [decklist](https://play.limitlesstcg.com/tournament/6ac7880385920e4d25366a20/player/not_dev/decklist) |
| [OP17.5] ChinoizeCup #121 Monday | 2026-10-12 | 64 | 4th | 5-1-0 | Spartacus2224 | [decklist](https://play.limitlesstcg.com/tournament/6ac7870a85920e4d253669db/player/spartacus2224/decklist) |

**OP13-004 Sabo**

| Event | Date | Players | Placing | Record | Player | List |
|---|---|---|---|---|---|---|
| [OP17]Win a Box - Aegean Pirate Cup #6 | 2026-10-22 | 33 | 3rd | 4-1-0 | cardboardlover | [decklist](https://play.limitlesstcg.com/tournament/6acc90ea115c12b73a5a1e5f/player/cardboardlover/decklist) |
| [OP17.5] ChinoizeCup #122 Tuesday | 2026-10-13 | 64 | 3rd | 5-1-0 | cicciopal | [decklist](https://play.limitlesstcg.com/tournament/6ac7880385920e4d25366a20/player/cicciopal/decklist) |
| [OP17.5] Win a box \| Rumble league #12 | 2026-10-08 | 26 | 8th | 3-2-0 | 0xDVS | [decklist](https://play.limitlesstcg.com/tournament/6abf4a4d783097f8dcb75d5e/player/0xdvs/decklist) |

**OP17-058 Kaido**

| Event | Date | Players | Placing | Record | Player | List |
|---|---|---|---|---|---|---|
| [OP17]Win a Box - Aegean Pirate Cup #6 | 2026-10-22 | 33 | 2nd | 4-1-0 | xkalliger | [decklist](https://play.limitlesstcg.com/tournament/6acc90ea115c12b73a5a1e5f/player/xkalliger/decklist) |
| [OP17.5] ChinoizeCup #122 Tuesday | 2026-10-13 | 64 | 7th | 4-2-0 | BarrocaTCG | [decklist](https://play.limitlesstcg.com/tournament/6ac7880385920e4d25366a20/player/barrocatcg/decklist) |
| [OP17.5] Win a box \| Rumble league #12 | 2026-10-08 | 26 | 4th | 4-1-0 | Nitrossor | [decklist](https://play.limitlesstcg.com/tournament/6abf4a4d783097f8dcb75d5e/player/nitrossor/decklist) |

**OP13-001 Monkey.D.Luffy**

| Event | Date | Players | Placing | Record | Player | List |
|---|---|---|---|---|---|---|
| [OP17]Win a Box - Aegean Pirate Cup #6 | 2026-10-22 | 33 | 4th | 4-1-0 | HotSince96 | [decklist](https://play.limitlesstcg.com/tournament/6acc90ea115c12b73a5a1e5f/player/hotsince96/decklist) |
| [OP17.5] ChinoizeCup #121 Monday | 2026-10-12 | 64 | 1st | 6-0-0 | snorlax1cynda | [decklist](https://play.limitlesstcg.com/tournament/6ac7870a85920e4d253669db/player/snorlax1cynda/decklist) |
| [OP17] ChinoizeCup #103 Monday | 2026-08-31 | 64 | 5th | 5-1-0 | Frodon | [decklist](https://play.limitlesstcg.com/tournament/6a8f02a77a62de813013f92f/player/frodon/decklist) |

**OP15-058 Enel**

| Event | Date | Players | Placing | Record | Player | List |
|---|---|---|---|---|---|---|
| [OP17]Win a Box - Aegean Pirate Cup #6 | 2026-10-22 | 33 | 7th | 4-1-0 | Mavros | [decklist](https://play.limitlesstcg.com/tournament/6acc90ea115c12b73a5a1e5f/player/mavros/decklist) |
| [OP17] ChinoizeCup #116 Tuesday | 2026-09-29 | 119 | 6th | 6-1-0 | Martix | [decklist](https://play.limitlesstcg.com/tournament/6ab4e651e905c1db687493fe/player/martix/decklist) |
| [OP17] ChinoizeCup #112 Monday | 2026-09-21 | 64 | 1st | 6-0-0 | Roko Zoric | [decklist](https://play.limitlesstcg.com/tournament/6aab0d6338886b36383c1e09/player/morow/decklist) |

**OP17-079 Monkey.D.Luffy**

| Event | Date | Players | Placing | Record | Player | List |
|---|---|---|---|---|---|---|
| [OP17.5] ChinoizeCup #119 Tuesday | 2026-10-06 | 64 | 7th | 5-1-0 | trocheesy | [decklist](https://play.limitlesstcg.com/tournament/6abcfe1c783097f8dcb74092/player/trocheesy/decklist) |
| [OP17.5] ChinoizeCup #118 Monday | 2026-10-05 | 64 | 1st | 6-0-0 | trocheesy | [decklist](https://play.limitlesstcg.com/tournament/6abcfca9783097f8dcb7408b/player/trocheesy/decklist) |
| [OP17 NEW BANNED] Win a box \| Rumble league #11 | 2026-10-01 | 27 | 7th | 3-2-0 | frastrawhat | [decklist](https://play.limitlesstcg.com/tournament/6ab613e7880ed327106dc30c/player/frastrawhat/decklist) |

**OP14-041 Boa Hancock**

| Event | Date | Players | Placing | Record | Player | List |
|---|---|---|---|---|---|---|
| [OP17.5] Win a box \| Rumble league #12 | 2026-10-08 | 26 | 7th | 3-2-0 | KevinPaillex | [decklist](https://play.limitlesstcg.com/tournament/6abf4a4d783097f8dcb75d5e/player/kevinpaillex/decklist) |
| [OP17 NEW BANNED] Win a box \| Rumble league #11 | 2026-10-01 | 27 | 5th | 4-1-0 | KevinPaillex | [decklist](https://play.limitlesstcg.com/tournament/6ab613e7880ed327106dc30c/player/kevinpaillex/decklist) |
| [OP17] ChinoizeCup #109 Monday | 2026-09-14 | 64 | 3rd | 5-1-0 | niederstrecken | [decklist](https://play.limitlesstcg.com/tournament/6aa26394a4272c53be64cb9a/player/niederstrecken/decklist) |

**OP12-061 Donquixote Rosinante**

| Event | Date | Players | Placing | Record | Player | List |
|---|---|---|---|---|---|---|
| [OP17.5] ChinoizeCup #119 Tuesday | 2026-10-06 | 64 | 6th | 5-1-0 | MaGe | [decklist](https://play.limitlesstcg.com/tournament/6abcfe1c783097f8dcb74092/player/mage/decklist) |
| [OP17.5] ChinoizeCup #118 Monday | 2026-10-05 | 64 | 2nd | 5-1-0 | lukas123 | [decklist](https://play.limitlesstcg.com/tournament/6abcfca9783097f8dcb7408b/player/lukas123/decklist) |
| [OP17 NEW BANNED] Win a box \| Rumble league #11 | 2026-10-01 | 27 | 1st | 5-0-0 | ryanellice | [decklist](https://play.limitlesstcg.com/tournament/6ab613e7880ed327106dc30c/player/ryanellice/decklist) |

**OP05-098 Enel**

| Event | Date | Players | Placing | Record | Player | List |
|---|---|---|---|---|---|---|
| [OP17]Win a Box - Aegean Pirate Cup #6 | 2026-10-22 | 33 | 5th | 4-1-0 | Clyde michael Macaraig | [decklist](https://play.limitlesstcg.com/tournament/6acc90ea115c12b73a5a1e5f/player/castiel1992/decklist) |
| [OP17.5] ChinoizeCup #121 Monday | 2026-10-12 | 64 | 7th | 5-1-0 | Slodea | [decklist](https://play.limitlesstcg.com/tournament/6ac7870a85920e4d253669db/player/slodea/decklist) |
| [OP17.5] ChinoizeCup #118 Monday | 2026-10-05 | 64 | 8th | 4-2-0 | UPS_Employee | [decklist](https://play.limitlesstcg.com/tournament/6abcfca9783097f8dcb7408b/player/ups_employee/decklist) |

**OP08-098 Kalgara**

| Event | Date | Players | Placing | Record | Player | List |
|---|---|---|---|---|---|---|
| [OP17.5] ChinoizeCup #122 Tuesday | 2026-10-13 | 64 | 1st | 6-0-0 | BMKid | [decklist](https://play.limitlesstcg.com/tournament/6ac7880385920e4d25366a20/player/bmkid/decklist) |
| [OP17.5] ChinoizeCup #121 Monday | 2026-10-12 | 64 | 8th | 4-2-0 | Nightingale | [decklist](https://play.limitlesstcg.com/tournament/6ac7870a85920e4d253669db/player/nightingale/decklist) |
| [OP17.5] Win a box \| Rumble league #12 | 2026-10-08 | 26 | 3rd | 4-1-0 | Ace88 | [decklist](https://play.limitlesstcg.com/tournament/6abf4a4d783097f8dcb75d5e/player/ace88/decklist) |

---

## Disagreements between sources

1. **Where Nico Robin stands.**
   - Pre-ban, in person, it was a top deck: EU Finals 2nd, three NA Coliseum block wins, and TCGplayer's "2nd most popular Leader" at Dallas.
   - In the post-ban online data it collapsed to 2 top-8s and 2.6% share.
   - opmetagame's Robin page reports 14.4% popularity, while its /decks/ chart reports 11.3%.
   - The post-ban sample is small, and these online events are mostly best-of-one.
2. **opmetagame contradicts itself on tiers.**
   - Its /tier-list/ page puts Sabo, Rocks, Robin, Enel and Black Luffy all in S.
   - Its /decks/ page badges show Sabo as A and Robin, Rocks, Enel and Kaido as B.
   - I report the /tier-list/ values in the JSON (`tierOpmetagame`).
3. **Order of the top legal decks.**
   - Limitless online top-8s: Rocks > Robin > Luffy & Ace > Sabo.
   - opmetagame top-cut share: Sabo 11.7% > Robin 11.3% > Rocks 8.2% > Enel 6.3%.
   - TCGplayer's five "strongest Leaders" at Dallas: Mihawk, Enel, Robin, Rocks and Sabo. Luffy & Ace is not among them.
   - In-person Finals favored Enel, which won the EU Finals and placed 2nd in Dallas. Online, Enel's numbers are moderate.
4. **Data quality in the opmetagame event data.**
   - Region tags are wrong for European events sourced from Egman: London, Prague, Athens and Utrecht are all tagged "NA United States".
   - Many finishes carry placeholder placing 99.
   - The same event appears twice under different sources.
   - I used it only for cross-checks.
5. **Limitless database home page versus today.** The home page still shows "Top Decks (OP16)", led by Blue/Yellow Nami, Green/Blue Luffy and Purple Enel. That is the previous format, because the database has no OP17 events yet.

---

## Gaps and open questions

1. **No complete in-person top-8 data for the window.** This covers the Season 1 Finals (Santiago, Utrecht, Dallas) and about 13 Season 2 Regionals (listed above).
   - The Limitless database's newest event is 2026-07-26.
   - Egman Events and onepiecedb.io block Claude crawlers in robots.txt.
   - TCGplayer fetching was stopped (permission system, and robots.txt disallows deck pages).
   - **Action:** re-run once Limitless adds these events. The Limitless page's tournament IDs 480 and up are upcoming events, so older IDs may be backfilled.
2. **onepiece.gg tiers are missing.** Its robots.txt disallows Anthropic agents. A search snippet suggested that its tier-list page is still the OP16 + ST30 version, but that is not verified.
3. **Do online simulator results stand in for paper English results?** The counted events are Limitless-platform online events, mostly 6-round best-of-one Swiss without a top cut. Organizer tags like `[OP17.5]` are not documented. I treated them as "OP17 with the announced ban" because no OP14-020 leaders appear.
4. **Effective date of the OP07-115 / EB04-058 banned pair.** It does not appear on the 2025-08-30 or 2026-04-01 notices I opened. The master page's link titled "effective from April 10, 2026" points back to the current page.
5. **When does P-163 Dracule Mihawk enter play?** It is "planned" for future events, and no results with it were found. When it is distributed, a new Mihawk archetype may return.
6. **The window spans three formats** (OP16, OP17 with Mihawk, OP17 without Mihawk), so whole-window counts favor decks that were strong before the ban. Use the post-ban columns for "today". Rocks, Luffy & Ace, Black Luffy, Sabo and Kaido lead post-ban.
7. **Legality-date nuance.** The OP17 page says its cards are "legal from the pre-release date in your LGS" (2026-08-21). The ST/EB/OP18 pages say cards are "tournament legal starting 7 days after the release date in your region". I counted OP17 from 2026-08-21.
8. **Block-1 legality was checked only for cards from OP01 to OP04, ST01 to ST14, EB01 and promos** that appear in the chosen lists (10 cards, all legal on Limitless). The rest rely on Limitless and Bandai's own legality.
9. **What's coming:** EB05 (2026-10-30) and OP18 (2026-11-20) will change the format before the next Regionals. Limitless tags Regionals from 2026-11-28 as OP18. These lists will go stale quickly: `npm run meta:update` should flag them after 60 days, per PROMPT.md.
10. **Decision to log** (for the main thread to record in DECISIONS.md): archetypes are keyed by leader card ID; banned leaders are excluded from the archetype set but kept in an `excluded` array; counts come from the Limitless public API until in-person data is available.
