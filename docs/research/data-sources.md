# Card data and art sources (Phase 1, Track B)

**As of:** 2026-10-28. Every claim below comes from a page or response fetched on that date (see "Pages opened"). Where something could not be checked, the text says so.

**Format context** (from `docs/research/meta-landscape.md`): the newest English booster is OP-17; the newest starters are ST-31 to ST-36. EB-05 releases 2026-10-30 and OP-18 on 2026-11-20. Standard allows blocks 2 to 5.

## Decision (orchestrator, 2026-10-28; supersedes the research recommendation in "Chosen sources")

The research below recommended parsing the official card list as the primary source. That is **not adopted**. The official site's terms say its "text and data … may not be reproduced without permission", and PROMPT.md says: "where terms forbid an intended use, choose another source and record why". Bulk-parsing those pages into committed JSON is exactly that use. optcgapi.com says it is "open for anyone to use". The research also shows that most of optcgapi's defects are systematic and can be repaired mechanically, and that every card whose text drives the engine will be read by a person anyway when it is scripted.

- **Card data, primary: optcgapi.com bulk endpoints** (`allSetCards`, `allSTCards`, promos), normalized by `cards:update`:
  - **Sign repair.** `DON!! N:` → `DON!! −N:`, and an unsigned "N power" or "N cost" given to an opponent's card → `−N`. Every repair is recorded on the card as `textFixes[]` so it can be audited.
  - **Type splitting** by longest match against a type vocabulary built from optcgapi's single-type and "/"-delimited rows, plus a small hand-kept addendum for names that only occur in combinations. A card whose types cannot be fully matched fails the run, so no card gets a guess.
  - **Cleanup.** Drop "NULL" text and appended reprint disclaimers. Reject rows with non-numeric power or non-color colors, which catches shifted columns such as OP17-099.
  - **Trigger split** at the last `[Trigger]`.
- **Verified overrides:** `cards/overrides/<CARD-ID>.json`, written by hand when a card is scripted. The author reads that card's official card-list entry (a person-scale read, not a bulk fetch) and records any corrected field with the source URL and date. `cards:update` applies overrides and warns when the upstream value starts to agree or changes again. **Every scripted card must be `verified: true`** (CI check). Unscripted cards show "text from optcgapi.com, not verified" in the inspector.
- **Format data:** `cards/format/standard.json` (the ADR 0011 name; this replaces the `legality.json` proposed below) is hand-kept and cited. It holds the block per product (topics/013.php), the 53 block-icon exceptions and per-reprint block changes (rules/blockicon-card/), and bans and banned pairs (news/restriction.html), each with a source URL and the date checked. This is a factual digest of rules pages, like `rules-digest.md`. `block` is computed per card from it. Where it is unknown, legality is "unknown" and the deck builder says so.
- **Official card list:** used only as the human reference for overrides and diffs. The pipeline never fetches it. If Bandai grants permission, switching to the official parser documented below is a one-module change.
- **Images:** as recommended below. optcgapi `card_image`, then the arjunkai proxy (off until its maintainer approves), then a text-only card. All art carries the SAMPLE watermark; no clean source exists.
- **Upstream courtesy:** report the diff's content errors to optcgapi's maintainer, and tell them we hotlink images, with the service-worker cache limiting repeat loads. This is outward-facing contact, so it is left to the owner.

## Research summary (Track B agent)


- **Card data primary: the official card list** at `https://en.onepiece-cardgame.com/cardlist/?series={id}`, fetched by `npm run cards:update` from Node (61 series pages, polite delay). It is the reference the other sources are judged against. It is the only source that exposes the **block icon**, keeps **trigger text separate** from effect text, keeps the **"/" delimiter** in types and attributes, and already lists **EB-05** (61 cards).
- **Card data fallback: optcgapi.com** bulk endpoints. They are free, need no key, send `Access-Control-Allow-Origin: *` and cover OP-17 and ST-31 to ST-36. The diff found the text **not accurate enough to drive the engine on its own**. It drops minus signs on 13 cards in the OP-17 list ("DON!! 1" where the card says "DON!! −1"). It strips the "/" between types: only 54 of 4,280 rows keep it, and every multi-type card in the OP-17 diff had lost it. It also has shifted columns on the OP-17 Big Mom leader.
- **Images: no candidate has clean art.** Every source checked serves the same official **SAMPLE-watermarked** scan: official, optcgapi (byte-identical), Scrydex, the arjunkai proxy, Limitless and the TCGplayer CDN. Official image URLs **cannot be hotlinked**: they send `Cross-Origin-Resource-Policy: same-site`, and headless Chromium blocked them with `ERR_BLOCKED_BY_RESPONSE.NotSameSite`. Image order: **optcgapi `card_image` → arjunkai `/images/{printingId}`, off by default until its maintainer agrees → text-only card.**
- **Terms risk:** the official site footer says "All images, text and data on this website may not be reproduced without permission." Every other source repackages that same text, so the risk does not go away by choosing an intermediary. See "Terms risk" below.

## Pages opened

All fetched with `curl` (User-Agent `optcg-sim-research/0.1 (+https://github.com/chrisdevine00/optcg-sim)`), 1 to 4 s apart. Bulk endpoints were preferred. I made no account and used no API key. Raw responses are in `.cache/track-b/` (gitignored).

robots.txt checks (done before any other fetch on each host):
- https://optcgapi.com/robots.txt: 404, none
- https://en.onepiece-cardgame.com/robots.txt: 404, none
- https://scrydex.com/robots.txt: `Allow: /`
- https://images.scrydex.com/robots.txt: `Allow: /`
- https://api.scrydex.com/robots.txt: 401 (keyed host)
- https://apitcg.com/robots.txt and https://www.apitcg.com/robots.txt: `Disallow: /platform`, `/api/`, `/recuperar`. I did not touch `/api/`.
- https://docs.apitcg.com/robots.txt: 404
- https://onepiece.limitlesstcg.com/robots.txt: `Disallow:` (empty, so everything is allowed)
- https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/robots.txt: 403
- https://tcgplayer-cdn.tcgplayer.com/robots.txt: 403
- https://optcg-api.arjunkai.workers.dev/robots.txt: no response (host does not exist)
- https://optcg-api.arjunbansal-ai.workers.dev/robots.txt: 401 `api key required`

optcgapi.com:
- https://optcgapi.com/ ; /documentation ; /about/general ; /about/updates/
- https://optcgapi.com/api/allSets/ ; /api/allDecks/ ; /api/sets/OP-17/ ; /api/sets/card/OP17-001/
- https://optcgapi.com/api/allSetCards/ (3,654 rows, 2.48 MB) ; /api/allSTCards/ (626 rows) ; /api/allDonCards/ (187 rows)
- https://optcgapi.com/api/allPromoCards/: **404**, although it is documented
- https://optcgapi.com/api/promos/filtered/: 400 "Need to pass in some type of param" ; /api/promos/filtered/?card_name=Luffy ; /api/promos/filtered/?set_id=P (832 rows) ; /api/promos/card/P-117/
- Images: https://optcgapi.com/media/static/Card_Images/OP17-109_brUDWS0.jpg ; OP17-055_gAXVxvh.jpg ; OP17-021_WkA32g8.jpg ; OP17-037_9tYgBFD.jpg ; OP15-096_AlG6gfK.jpg

Official site (en.onepiece-cardgame.com):
- https://en.onepiece-cardgame.com/cardlist/ (redirects to `?series=569117`, OP-17)
- https://en.onepiece-cardgame.com/cardlist/?series= for 569001, 569005, 569010, 569012, 569016, 569029, 569034, 569103, 569106, 569107, 569114, 569115, 569116, 569201, 569202, 569203, 569205, 569301, 569302, 569801, 569901. With 569117 that makes 22 series pages.
- https://en.onepiece-cardgame.com/images/cardlist/card/OP17-109.png?261016
- https://en.onepiece-cardgame.com/news/restriction.html ; https://en.onepiece-cardgame.com/rules/blockicon-card/

Scrydex:
- https://scrydex.com/docs/onepiece/cards ; /pricing ; /terms ; /docs/getting-started/best-practices ; /docs/getting-started/rate-limits ; /onepiece/expansions
- https://images.scrydex.com/onepiece/OP17-109/large

arjunkai/optcg-api:
- https://api.github.com/repos/arjunkai/optcg-api ; https://raw.githubusercontent.com/arjunkai/optcg-api/main/README.md ; …/main/LICENSE
- https://optcg-api.arjunbansal-ai.workers.dev/ ; /docs ; /cards/OP17-109 (401) ; /images/OP17-109 ; /images/OP17-005_p1

apitcg.com:
- https://www.apitcg.com/ ; https://www.apitcg.com/sitemap.xml ; https://docs.apitcg.com/ ; https://docs.apitcg.com/openapi.json

Limitless:
- https://onepiece.limitlesstcg.com/cards/OP17-109 ; https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/one-piece/OP17/OP17-109_EN.webp ; https://limitlesstcg.com/legal

Other:
- https://tcgplayer-cdn.tcgplayer.com/product/708074_in_1000x1000.jpg. This is a single image, fetched to see what image apitcg-style (TCGplayer-derived) sources would serve.

Browser check: a page served from `http://localhost:8765` in headless Chromium (Playwright 1.64) loaded each image with `<img>` and with `fetch(mode:'cors')`. Script: `.cache/track-b/scripts/cors_check.mjs`.

## Candidates

### Official card list (en.onepiece-cardgame.com)
- **What it is.** An HTML card database. Each series page (`/cardlist/?series={id}`) contains every printing in one response; OP-17 has 169 printings for 130 card numbers, with no pagination. Each printing is a `<dl class="modalCol" id="{printingId}">` element. Its fields are: number, rarity and category (`.infoCol`), name, Cost or Life, Attribute, Power, Counter, Color, **Block icon**, Type, Effect, **Trigger** (separate), and Card Set(s). Parallels are `_pN` and reprints are `_rN`, both under the same card number.
- **Coverage.** All 61 series in the selector, including OP-17, ST-31 to ST-36, and **EB-05** (series 569205, 61 printings, listed two days before release). **There is no OP-18 series yet.**
- **Quirks found.** The text view shows **0 as "-"**: OP17-055 has cost "-" and the image shows 0; OP17-021 has power "-" and the image shows 0. Counter "-" means no counter. Leaders put Life in the cost slot (`<h3>Life</h3>`). One printing has **no block value**: OP15-096 shows "-" on the site, but its card image shows block 4. The minus character is inconsistent: usually U+2212 "−", but U+FF0D "－" on ST10-010_p2. Attribute references sometimes use full-width brackets, as in "＜Strike＞" on ST05-010. Block is set per printing: reprints inside a newer series can carry a newer block (EB04-007_p2 has "X" inside OP-17).
- **Images.** PNG, 600×838, **SAMPLE watermark**. Headers: `cross-origin-resource-policy: same-site`, no `Access-Control-Allow-Origin`, no `Cache-Control`. **The browser blocks cross-site `<img>` loads** (verified).
- **Terms.** Footer of every page (https://en.onepiece-cardgame.com/cardlist/): "©Eiichiro Oda/Shueisha ©Eiichiro Oda/Shueisha, Toei Animation **All images, text and data on this website may not be reproduced without permission.** Please note that the images used on this website may differ from the actual product as it is still under development." There is no robots.txt and no published API or rate limit. Other policy links are a privacy policy and a cookie policy only.

### optcgapi.com
- **What it is.** A Django REST API run by one person ("DomoSlime"/Dom) on a VPS. It needs no authentication. JSON responses carry `Access-Control-Allow-Origin: *`.
- **Coverage.** OP-01 to OP-17. EB-01 to EB-03. EB-04 cards are filed under set ids `OP14-EB04` and `OP15-EB04`. PRB-01 and PRB-02. ST-01 to ST-36: ST-29 is in `allSTCards` but missing from `allDecks`. Promos P-001 to P-148 plus P-700/800/900; 111 promo rows have no image. DON!! cards. **No EB-05, no OP-18.** The About page is stale: it says "OP01 - OP12" and "ST01 - ST28".
- **Bulk.** `/api/allSetCards/`, `/api/allSTCards/`, `/api/allDonCards/`. Promos come only from `/api/promos/filtered/?set_id=P`, because `/api/allPromoCards/` returns 404.
- **Fields.** `card_set_id, card_image_id, card_name, card_type, card_color (space-separated), card_cost, card_power, counter_amount, life, attribute, sub_types, card_text, rarity, set_id, set_name, card_image, date_scraped, market_price, inventory_price`. There is **no block field and no trigger field**: the trigger is appended to `card_text`.
- **Alt arts.** Same `card_set_id`, with `card_image_id` suffixed `_pN`/`_rN`. However, TR and "Super Alternate Art" rows reuse the base `card_image_id`: 8 OP-17 parallels have no distinct id. One reprint id differs from the official one: optcgapi ST10-010_p7 is official ST10-010_r1.
- **Data quality outside the diff sample.** `sub_types` keeps the "/" delimiter on only 54 of 4,280 rows. Many rows are single-type, but the OP-17 list has no "/" at all, so its multi-type cards cannot be split. `attribute` contains "NULL", "N/A", "?", "", and on OP09-033's reprint the value "Straw Hat Crew ODYSSEY". OP04-095_r1 has `card_color` "Character". OP13-079 (Imu) has attribute and types "?". Some texts have "Disclaimer:" notes appended. Across the whole dump, 61 rows contain "DON!! N:" without the minus, and 98 contain "Characters N power" without the minus.
- **Images.** Byte-identical copies of the official PNGs (served with a `.jpg` name), so they carry **SAMPLE**. There is no CORP and no ACAO header, so `<img>` loads cross-site but CORS `fetch()` fails. Responses have `ETag` and `Last-Modified` but no `Cache-Control`.
- **Cadence.** "a data pipeline … which automatically updated every day" (About). `date_scraped` is 2026-10-28 on many rows. The OP-17 image is Last-Modified 2026-08-29, the day after release. The updates log stops at 2026-03-15.
- **Rate limits.** No number is published and no rate-limit headers were seen. Documentation: "please try not to do an insane amount of API calls each day!" About: "For now, the API will have some limits on how much data can be pulled each day".
- **Terms.** There is no terms page. Documentation (https://optcgapi.com/documentation): "The API doesn't require authentication, and it is open for anyone to use. However, the API is run by me on my VPS that I pay for monthly, so please try not to hurt my wallet too much." Footer: "One Piece and the One Piece Trading Card Game data are trademarks of Eiichiro Oda, Bandai, Shonen Jump, and Viz Media. Please support the official release…"

### Scrydex (scrydex.com)
- **What it is.** A commercial multi-game API with keys (`X-Api-Key` and `X-Team-ID`). Card object fields (https://scrydex.com/docs/onepiece/cards): `id, name, number, printed_number, cost, power, attribute (string), type, colors[], subtypes[], printings[], tags[], rarity, rarity_code, rules[] (effects by paragraph), images[] {small, medium, large}, expansion{…}, variants[] {name, printings, images, prices}`. **No counter, life or block field is documented**, and the trigger is not a separate field.
- **Coverage** (public https://scrydex.com/onepiece/expansions): OP01 to OP17 (OP17 has 129 cards), ST01 to ST36, EB01 to EB04, PRB01 and PRB02, and promos. **No EB05 and no OP18.** I could not check text accuracy, because that needs a paid key.
- **Price.** Starter is $29/month for 5,000 credits; the next tier is Growth at $99/month. There is no free tier. Limit is 100 requests per second.
- **Images.** `images.scrydex.com/onepiece/{id}/{small|medium|large}`. Large is 640×894 PNG with **SAMPLE**. Headers: `access-control-allow-origin: *`, `cache-control: public, max-age=31536000, immutable`. The docs say "Never assume the urls … Always reference the urls as returned by the API", so the URLs require a subscription.
- **Terms** (https://scrydex.com/terms, §4): "You agree that you will not: … Resell, sublicense, redistribute, mirror, or commercially exploit the Services without prior written authorization from Scrydex." From the best-practices page: "you are free to include the provided card images in your applications … Scrydex does not claim ownership of the images … you are responsible for compliance with applicable copyright laws and permissions." Committing Scrydex-derived JSON to a public repository is arguably "redistribute/mirror".

### arjunkai/optcg-api (github.com/arjunkai/optcg-api)
- **What it is.** MIT-licensed Hono code on Cloudflare Workers; the hosted instance is at `https://optcg-api.arjunbansal-ai.workers.dev`. Its data is scraped from the official site with Python and Playwright. The README claims coverage of OP-01 to OP-15 and ST-01 to ST-29. That may be out of date, and I could not check it because the data needs a key.
- **Access.** "The deployed API … isn't open to the public … is gated to opbindr.com and opcanvs.com origins." The `/docs` page says: "A private REST API … Access is granted on a per-project basis after a short review." A standard key allows 60 requests per minute and 2,000 per day. `/cards/all` is a single-shot dump.
- **Data terms** (README): "The MIT license on the code does not grant any rights to the data itself. If you need a card-data API for your own service, run the scrape pipeline in `scraper.py` and `scripts/` against the same upstream sources rather than reusing this project's D1 contents." That makes self-hosting equivalent to scraping the official site ourselves, with a Playwright and Cloudflare D1 dependency added.
- **Images.** `/images/{printingId}` is public. It returned 200 for OP17-109 and OP17-005_p1: 600×838 PNG, **SAMPLE**, re-encoded from the official image. Headers: `access-control-allow-origin: *`, `cache-control: public, max-age=86400`. The README says it is kept open "so … binder thumbnails shared on Discord or Twitter still render". That is not an invitation for third-party apps.

### apitcg.com
- **What it is.** It still exists: a multi-game API covering 19 games, built from TCGplayer data ("Updated every night from TCGplayer"). It needs a key; the free plan allows 1,000 requests per month, with a 300 per minute per-IP cap. Card fields are a per-game `attributes` map with rules text in `attributes.Description`, `images[] {small, medium, large}`, and TCGplayer prices. It has cursor sync (`afterId`, `updatedSince`) at 100 per page.
- **Not verified** (needs a key): coverage, text accuracy and image source. It probably uses TCGplayer CDN images; the one TCGplayer CDN image I fetched (708074, OP17-109) was 600×838 with **SAMPLE** and ACAO `*`.
- **Terms.** I found no terms page: the sitemap lists only `/`, `/login` and `/register`. The docs footer says "This website is not created, sponsored, nor is it an official product of any of the publishers of the games it covers." robots.txt disallows `/api/` for crawlers.

### Limitless (onepiece.limitlesstcg.com)
- **What it is.** Card pages show the text, **block**, **"Standard legal / Extra legal"**, the artist, prints and prices. The header banner reads "Latest Updates: EB05". There is **no documented card API**; the documented Limitless API covers tournaments only.
- **Images.** DigitalOcean CDN, 600×838 WebP with **SAMPLE**. ACAO is inconsistent: it was echoed for `Origin: http://localhost:8765` but absent for `Origin: https://chrisdevine00.github.io`. `max-age=86400`.
- **Terms.** Footer: "The literal and graphical information presented on this website about the One Piece Card Game, including card images and text, is copyright Eiichiro Oda/Shueisha, Toei Animation and/or Bandai." https://limitlesstcg.com/legal is an imprint (Robin Schulz, Gdańsk) with no usage grant. The site is ad- and Patreon-funded. Use: **cross-check only, by a human**.

## Scoring table

Scale: 0 = fails or unusable, 1 = poor, 2 = adequate, 3 = good. "?" = could not be verified without a paid key or sign-up.

| Criterion | Official list | optcgapi.com | Scrydex | arjunkai (hosted / self-host) | apitcg.com | Limitless |
|---|---|---|---|---|---|---|
| Coverage to OP-17, ST-31..36 | 3 (yes) | 3 (yes) | 3 (yes) | ? (README says OP-15/ST-29) / 3 (scrapes official) | ? | 3 (yes) |
| EB-05 / OP-18 present | EB-05 yes, OP-18 no | no / no | no / no | ? | ? | EB-05 yes, OP-18 not checked |
| Effect-text accuracy | 3 (reference; quirks above) | **1** (see diff) | ? | ? / 3 | ? | 2 (spot check of 1 card matched) |
| Image quality / watermark | 2 (600×838, SAMPLE) | 2 (identical copy, SAMPLE) | 2 (up to 640×894, SAMPLE) | 2 (SAMPLE) | ? (TCGplayer CDN: SAMPLE) | 2 (SAMPLE) |
| Licensing / terms | 0 ("may not be reproduced without permission") | 2 ("open for anyone to use"; no formal terms) | 1 (paid; no redistribute/mirror) | 0 hosted (private; don't reuse data) / 0 self-host (same as official) | 1 (no terms found) | 0 (no grant, no API) |
| CORS: JSON | n/a (scraped server-side) | 3 (`*`) | ? (keyed) | 0 (origin-gated) | ? | n/a |
| CORS: images | **0** (CORP same-site blocks `<img>`) | 2 (`<img>` OK; no ACAO, no Cache-Control) | 3 (`*`, 1-year immutable), but URLs need API | 3 (`*`, 1 day) | ? | 1 (inconsistent) |
| Rate limits | 2 (none published; be polite) | 2 (none published; "don't hurt my wallet") | 1 (credit-metered) | 1 (2,000/day with key) | 1 (1,000/month free) | n/a |
| Bulk endpoint | 2 (one page per series, 61 pages) | 3 (`allSetCards`, `allSTCards`) | 1 (250 per page) | 3 (`/cards/all`) | 1 (100 per page) | 0 |
| Update cadence | 3 (lists products pre-release) | 2 (daily scrape; EB-05 not yet) | ? | 2 (weekly cron) | 2 (nightly from TCGplayer) | 3 |
| Alt arts as variants of one card ID | 3 (`_pN`/`_rN`) | 2 (yes, but TR/SAA rows reuse the base id) | 3 (`variants[]`) | 3 (`base_id`) | ? | 3 |
| Block / legality | block yes, legality no | no / no | no / no | ? | ? | block yes, legality yes |
| Trigger separate from effect | yes | **no** (appended) | no (`rules[]`) | yes (`trigger`) | ? | no |
| Counter | yes ("-" = none) | yes (0 = none) | not documented | yes | ? | yes |
| Attributes | yes, "/" list | string; junk values | single string | array | ? | yes |
| Types | yes, "/" list | **space-joined; delimiter lost** | `subtypes[]` | array | ? | yes |
I give no totals: the rows are not equally important. Two rows decide the choice. **Accuracy** rules out optcgapi as the single source of truth. **CORS on images** rules out the official site as the image host.

## Chosen sources (research recommendation; superseded by "Decision" above)

**Card data, primary: the official card list.** A rules engine is only as correct as its card text, and the official list is the reference every other source copies. The diff shows the copy we could use for free changes card meaning: "give … 3000 power" where the card says −3000, a dropped "or Character card" clause in OP17-007, and shifted columns on a leader. The official list is also the only source with the block icon, which Standard legality needs, and with separately delimited types and trigger text, which the engine and the effect DSL need. Its terms are restrictive, but so are the terms behind every alternative, because they all repackage this text. See "Terms risk".

**Card data, fallback: optcgapi.com.** It is used only when the official site cannot be reached or its markup changes so the parser fails. Fallback rows get `source: "optcgapi"` and `verified: false`. Their `types` hold a single unsplit string, and CI must refuse to auto-trust a scripted card whose text came from the fallback. optcgapi also supplies image URLs.

**Images:** optcgapi `card_image` (primary) → arjunkai `/images/{printingId}` (secondary, behind a config flag that stays off until the maintainer approves) → text-only card. The official image URL is recorded for attribution only, never loaded: CORP blocks it. Scrydex is a ready upgrade path if the owner ever pays; it has the best headers (CORS `*`, immutable caching, three sizes). All art is SAMPLE-watermarked whichever source is used.

## Endpoints (research recommendation; see "Decision": steps 1–3 are not used, step 4 is the primary)

User-Agent: `optcg-sim cards:update (+https://github.com/chrisdevine00/optcg-sim)`. There is a 3 s delay between requests to the same host. Raw responses are cached in `.cache/cards/` and the script re-fetches only with `--refresh`. A normal run makes about 66 requests and takes about 4 minutes.

1. `GET https://en.onepiece-cardgame.com/cardlist/`. Follow the 302, then read every `<select name="series"> <option value="NNNNNN">`. That gives 61 series today: 5690NN starters, 5691NN boosters, 5692NN extra boosters, 5693NN premium boosters, 569801 "Other Product Card" and 569901 "Promotion card".
2. For each series: `GET https://en.onepiece-cardgame.com/cardlist/?series={id}`. Parse each `dl.modalCol`. Key printings by `printingId` (the `dl` id). The same printing can appear on several series pages; keep one.
3. `GET https://en.onepiece-cardgame.com/news/restriction.html` (banned cards and banned pairs) and `GET https://en.onepiece-cardgame.com/rules/blockicon-card/` (block exceptions; the page lists 53 card numbers). From these the script writes `cards/data/legality.json` with the source URLs and the page dates. If parsing fails, the run fails; it never guesses.
4. `GET https://optcgapi.com/api/allSetCards/`, `GET https://optcgapi.com/api/allSTCards/` and `GET https://optcgapi.com/api/promos/filtered/?set_id=P`. These provide image URLs keyed by `card_image_id`, using only ids that occur once, and the fallback data.
5. No build-time call goes to arjunkai. The secondary image URL `https://optcg-api.arjunbansal-ai.workers.dev/images/{printingId}` is built at runtime from a template, and only if that source has been enabled.

### Official HTML → internal schema (reference only; used if permission is obtained)

| Internal field | Official source | Rule |
|---|---|---|
| `id` | `.infoCol span[0]` | Card number, e.g. `OP17-005`. Shared by all of its printings. |
| `name` | `.cardName` | Verbatim (e.g. "Crone Oli", which is correct; optcgapi has "Crone Oil"). |
| `category` | `.infoCol span[2]` | `LEADER/CHARACTER/EVENT/STAGE` → title case. |
| `colors[]` | `.color` | Split on "/". |
| `cost` | `.cost` when `h3`="Cost" | "-" → 0 (verified on images of OP17-055 and OP17-021); `null` for Leaders. |
| `life` | `.cost` when `h3`="Life" | Leaders only. |
| `power` | `.power` | Character: "-" → 0 (verified on OP17-021). Event/Stage: `null`. |
| `counter` | `.counter` | "-" → `null`. |
| `attributes[]` | `.attribute i` | Split on "/"; "" → `[]`. |
| `types[]` | `.feature` | Split on "/". |
| `rarity` | `.infoCol span[1]` of the base printing | Parallel rarities ("SP CARD", "TR") go on the artwork. |
| `set` | prefix of `id` | `OP17` → `OP-17`. The series page is a source location, not the set (EB04 cards live on OP14/OP15 pages). |
| `effectText` | `.text` | `<br>` → `\n`; "-" → ""; HTML entities decoded; otherwise verbatim (keeps U+2212). |
| `triggerText` | `.trigger` | Leading "[Trigger] " removed; `null` if absent. |
| `block` *(new field, proposed)* | `.block` | Per printing; "-" → `null` and logged. |
| `artworks[]` | one per `dl.modalCol` | `artworkId` = printingId (`OP17-005_p1`); `imageUrls` = `{ full: <optcgapi card_image if card_image_id === printingId and unique> }`; `source` = "optcgapi"; `officialImageUrl` kept for attribution only; `rarity` from `span[1]`. |
| `legality` | computed | From `block` (newest block among the card number's printings), the block-icon exception list and restriction.html: `{ standard: "legal"|"banned"|"rotated", extra: "legal"|"banned", bannedWith: [ids] }`. |
| `sourceUrl` | — | `https://en.onepiece-cardgame.com/cardlist/?series={seriesId}#{printingId}` |
| `fetchedAt` | — | ISO time of the run. |

### optcgapi → internal schema (primary, plus the normalizers in "Decision")

| Internal | optcgapi | Rule |
|---|---|---|
| `id` | `card_set_id` | |
| `name` | `card_name` | Strip suffixes such as "(005)", "(Alternate Art)", "(Manga)", "(TR)" and " - P-117". |
| `category` | `card_type` | |
| `colors[]` | `card_color` | Split on spaces. Reject values that are not colors (one row says "Character"). |
| `cost` / `life` | `card_cost` / `life` | Strings → int. |
| `power` | `card_power` | Non-numeric → reject the row (OP17-099 has types in this column). |
| `counter` | `counter_amount` | 0 → `null`. |
| `attributes[]` | `attribute` | Split on " " and "/"; drop "NULL", "N/A", "?" and "". |
| `types[]` | `sub_types` | **A single unsplit element, flagged `typesUnsplit: true`.** |
| `effectText` / `triggerText` | `card_text` | Split at the last "\n[Trigger] " when present. Flag `verified: false`. |
| `artworks[]` | `card_image_id`, `card_image` | |
| `block`, `legality` | — | Not available. Legality is "unknown". |

## Image fallback order

1. **Primary:** optcgapi `card_image` URL stored in `artworks[].imageUrls.full` (600×838). Loads with `<img>`. It cannot be read through CORS, so the service worker caches it as an opaque response. That is allowed, but opaque responses count against quota with padding. It must never be drawn to a canvas.
2. **Secondary:** `https://optcg-api.arjunbansal-ai.workers.dev/images/{printingId}` (CORS `*`, 1-day cache). **Disabled until the maintainer approves** through the access form linked in its README.
3. **Text-only card**, rendered from the stored fields.

Not used: official image URLs (CORP `same-site`, blocked in the browser); Scrydex (URLs only from the paid API); Limitless CDN (no permission; ad-funded site); TCGplayer CDN (no terms checked; a commercial marketplace).

## Verification: diff of optcgapi against the official card list

Method: `.cache/track-b/scripts/parse_official.py` parsed the official series pages. `.cache/track-b/scripts/diff_optcgapi.py` compared every optcgapi printing to the official printing with the same id. It checked effect plus trigger text, cost or life, power, counter, colors, types, attribute, name, rarity and category. Whitespace and U+2212 were normalized only to classify each difference.

I then read every difference by hand and classed it:
- **content:** the meaning or value differs.
- **punctuation / whitespace:** cosmetic.
- **order/delimiter:** types match as words but the "/" is lost.
- **official-renders-0-as-dash:** optcgapi is right; checked against card images.
- **modeling:** parallel rarity.

Four disputed values were settled from the card images: OP17-037's name ends "?!!"; OP17-021 is named "Crone Oli" with power 0; OP17-055 has cost 0; OP15-096 has block 4.

### Full set: OP-17 (optcgapi `/api/sets/OP-17/`, 169 rows, against official series 569117, 169 printings, 130 card numbers)

Matching: 161 of 169 rows matched an official printing id. **8 official parallels have no distinct optcgapi id:** OP17-006_p1, OP17-025_p1, OP17-040_p1, OP17-045_p1, OP17-062_p3, OP17-070_p1, OP17-088_p1 and OP17-107_p1. optcgapi gives those rows the base id instead (TR or Super Alternate Art), so their image cannot be attached by id. For text, the base printing was compared.

Results by distinct card number:
- **Effect text, content: 19.** 13 of them have a missing minus sign: OP17-011, -017, -042, -061, -066, -067, -069, -075, -076, -077, -097, -101 and ST31-004_p1.
- Types: delimiter lost on 21 (every multi-type card); content wrong on 2.
- Name: 2.
- Power: 1 wrong, plus 3 where optcgapi is right.
- Cost: 4 where optcgapi is right.
- Colors: 1.
- Attributes: 2.
- Rarity: 1 wrong, plus 10 modeling differences.
- Punctuation: 4. Whitespace only: 11.

| # | Printing(s) | Field | Class | optcgapi.com | Official card list |
|---|---|---|---|---|---|
| 1 | OP17-112, _p1, _p2 | text | whitespace | …then choose one: •Add up to 1 … | …then choose one: • Add up to 1 … |
| 2 | OP17-093, OP17-079, OP17-093_p1, OP17-079_p1, OP17-079_p2 | types | order/delimiter | Straw Hat Crew The Four Emperors Elbaph | Elbaph/The Four Emperors/Straw Hat Crew |
| 3 | OP17-080, OP17-087, OP17-095, OP17-082, OP17-080_p1, OP17-087_p1 | types | order/delimiter | Straw Hat Crew Elbaph | Elbaph/Straw Hat Crew |
| 4 | OP17-062 (2 rows), OP17-063, OP17-058, OP17-062_p1, _p2, OP17-063_p1, OP17-058_p1 | types | order/delimiter | Animal Kingdom Pirates The Four Emperors | The Four Emperors/Animal Kingdom Pirates |
| 5 | OP17-054, _p1 | text | whitespace | …[Activate:Main]… | …[Activate: Main]… |
| 6 | OP17-089 | types | order/delimiter | Giant Former Navy Elbaph | Giant/Elbaph/Former Navy |
| 7 | OP17-087, _p1 | text | **content** | …Characters -3000 poser during… | …Characters −3000 power during… |
| 8 | OP17-048, _p1 | text | **content** | …trash 1 cards with a type… | …trash 1 card with a type… |
| 9 | OP17-055, -056, -076, -038 | cost | official-renders-0-as-dash | 0 | "-" (image shows 0) |
| 10 | OP17-042 | text | **content** | …opponent's Characters 3000 power… | …opponent's Characters −3000 power… |
| 11 | OP17-061, _p1 | text | **content** | …[On Play] DON!! 1: If your Leader… | …[On Play] DON!! −1: If your Leader… |
| 12 | OP17-104 | text | **content** | …top of your Life Cards. Trigger Play this card. | …top of your Life cards. [Trigger] Play this card. |
| 13 | OP17-076 | text | **content** | …[Trigger] DON!! 1: Draw 2 cards. | …[Trigger] DON!! −1: Draw 2 cards. |
| 14 | OP17-084 | types | order/delimiter | Animal Straw Hat Crew Elbaph | Animal/Elbaph/Straw Hat Crew |
| 15 | OP17-027, _p1 | text | punctuation | [Rush Character] …played.)[On Play]… | [Rush: Character] …played.) [On Play]… |
| 16 | OP17-037, _p1 | name | **content** | Are You That Afraid of the New Era?! | Are You That Afraid of the New Era?!! (image agrees) |
| 17 | OP17-017 | text | **content** | …opponent's Leader or Characters 2000 power… | …opponent's Leader or Characters −2000 power… |
| 18 | OP17-083 | types | order/delimiter | Fish-Man Straw Hat Crew Elbaph | Fish-Man/Elbaph/Straw Hat Crew |
| 19 | OP17-077 | text | **content** | …[Counter] DON!! 1: Your Leader… | …[Counter] DON!! −1: Your Leader… |
| 20 | OP17-041 | text | punctuation | …of the owner's choosing | …of the owner's choosing. |
| 21 | OP17-021 | name | **content** | Crone Oil | Crone Oli (image agrees) |
| 22 | OP17-021, -105, -066 | power | official-renders-0-as-dash | 0 | "-" (image of OP17-021 shows 0) |
| 23 | OP17-053 | text | punctuation | …during this turn | …during this turn. |
| 24 | OP17-069 | text | **content** | …DON!! 1: … Characters 2000 power… | …DON!! −1: … Characters −2000 power… |
| 25 | OP17-007 | text | **content** | …play up to 1 {Land of Wano} type Character card with a type including "Whitebeard Pirates"… | …play up to 1 {Land of Wano} type Character card **or Character card** with a type including "Whitebeard Pirates"… |
| 26 | OP17-079, _p1, _p2 | text | whitespace | …[Blocker].(After… | …[Blocker]. (After… |
| 27 | OP17-075 | text | **content** | …[On Play] DON!! 2: Trash 1 card… | …[On Play] DON!! −2: Trash 1 card… |
| 28 | OP17-097 | text | **content** | …opponent's Characters 1 cost during… | …opponent's Characters −1 cost during… |
| 29 | OP17-059 | types | order/delimiter | Navy Admiral | Admiral/Navy |
| 30 | OP17-067 | text | **content** | …[On Play] DON!! 1: If you have… | …[On Play] DON!! −1: If you have… |
| 31 | OP17-058, _p1 | text | whitespace | [When Attacking]/ [On Your Opponent's Attack] | [When Attacking]/[On Your Opponent's Attack] |
| 32 | OP17-005_p2 | text | whitespace | …−4 cost.[On Play]… | …−4 cost. [On Play]… |
| 33 | OP17-099, _p1 | power | **content** | "The Four Emperors Big Mom Pirates" | 5000 |
| 34 | OP17-099, _p1 | attributes | **content** | (none) | Special |
| 35 | OP17-099, _p1 | types | **content** | "Special" | The Four Emperors/Big Mom Pirates |
| 36 | OP17-011 | text | **content** | …opponent's Characters 4000 power… | …opponent's Characters −4000 power… |
| 37 | OP17-088 | types | order/delimiter | Giant New Giant Pirates Elbaph | Giant/Elbaph/New Giant Pirates |
| 38 | OP17-101 | text | **content** | …opponent's Characters 3000 power… | …opponent's Characters −3000 power… |
| 39 | OP17-066 | text | **content** | …[On Play] DON!! 1: If you have… | …[On Play] DON!! −1: If you have… |
| 40 | OP17-070 | types | order/delimiter | Animal Kingdom Pirates On-Air Pirates | On-Air Pirates/Animal Kingdom Pirates |
| 41 | OP17-040 (TR row) | rarity | **content** | TR on a row with base id OP17-040 | R on OP17-040; the TR printing is OP17-040_p1 |
| 42 | OP12-056_p2, ST32-002_p1, EB04-007_p2, OP16-098_p2, ST31-004_p1, ST27-005_p1, OP13-028_p2 | rarity | modeling | SR (base rarity) | SP CARD |
| 43 | OP12-056_p2 | text | **content** | …blue "Navy" type Character… | …blue {Navy} type Character… |
| 44 | ST32-002_p1 | text | punctuation | Draw 1 card and up to 1… | Draw 1 card, and up to 1… |
| 45 | OP14-108_p3 | rarity | modeling | R | SP CARD |
| 46 | OP14-108_p3 | text | whitespace | …or less.[Trigger]… | …or less. [Trigger]… |
| 47 | EB04-007_p2 | types | order/delimiter | Straw Hat Crew Egghead | Egghead/Straw Hat Crew |
| 48 | EB04-007_p2 | text | whitespace | …End Phase.[Activate: Main]… | …End Phase. [Activate: Main]… |
| 49 | OP16-098_p2 | text | whitespace | …hand.[Activate:Main]… | …hand. [Activate: Main]… |
| 50 | OP17-022_p2 | text | whitespace | …played.)[On Play]… | …played.) [On Play]… |
| 51 | P-084_p1, P-107_p1 | rarity | modeling | PR | SP CARD |
| 52 | P-084_p1 | attributes | **content** | (none) | Slash |
| 53 | P-084_p1 | types | **content** | (empty) | The Four Emperors/Cross Guild |
| 54 | P-084_p1 | text | **content** | …"Cross Guild" type… plus an appended "DISCLAIMER: This card is a reprint of the pre-existing card in the OP09 set…" | …{Cross Guild} type…; no disclaimer |
| 55 | ST31-004_p1 | types | order/delimiter | Straw Hat Crew The Four Emperors | The Four Emperors/Straw Hat Crew |
| 56 | ST31-004_p1 | text | **content** | …give up to 1 of your opponent's Characters 1000 power… | …give up to 1 of your opponent's Characters −1000 power… |
| 57 | ST27-005_p1 | types | order/delimiter | Blackbeard Pirates The Four Emperors | The Four Emperors/Blackbeard Pirates |
| 58 | ST27-005_p1 | text | whitespace | [Activate:Main] … less.[On K.O.] | [Activate: Main] … less. [On K.O.] |
| 59 | P-107_p1 | types | order/delimiter | Roger Pirates King of the Pirates | King of the Pirates/Roger Pirates |
| 60 | OP17-062_p2 | text | whitespace | [Blocker][Your Turn] | [Blocker] [Your Turn] |
| 61 | OP17-004 | types | order/delimiter | Land of Wano Minks Whitebeard Pirates | Minks/Land of Wano/Whitebeard Pirates |
| 62 | EB04-061_p2 | types | order/delimiter | Straw Hat Crew The Four Emperors Egghead | Egghead/The Four Emperors/Straw Hat Crew |
| 63 | OP17-118_p2 | colors | **content** | Black | Blue |
| 64 | the 8 printings listed above | printing id | **content** | base id reused | `_pN` id |

### 20 random cards

The sample was drawn from every non-OP-17 card number in optcgapi with `random.seed(20261028)`. It was checked against all 22 parsed official series pages; the relevant ones were 569001, 569005, 569010, 569012, 569016, 569029, 569034, 569103, 569106, 569107, 569114, 569115, 569116, 569201, 569202, 569203, 569301 and 569302. That covers 31 printings of EB01-006, EB01-030, EB03-015, EB03-032, EB04-003, OP03-095, OP06-021, OP06-039, OP06-108, OP07-110, OP14-081, OP16-005, ST01-005, ST05-010, ST10-010, ST12-010, ST12-015, ST12-016, ST16-005 and ST29-004.

- **No discrepancy at all:** 6 of 20 (EB03-032, OP03-095, OP06-039, OP07-110, OP14-081, ST01-005).
- **Content errors:** 5 of 20 (OP06-021, OP06-108, ST12-015, ST16-005, ST10-010).
- The rest differ only in whitespace, punctuation, type delimiters, or "0 vs -".

| # | Printing(s) | Field | Class | optcgapi.com | Official card list |
|---|---|---|---|---|---|
| 1 | ST10-010_p2 | rarity | **content** | SR | TR |
| 2 | ST10-010_p2 | text | character variant | DON!! -1 | DON!! －1 (official uses full-width U+FF0D here) |
| 3 | OP06-021, _p1 | text | **content** | …give up to 1 of your opponent's Characters -1 cost tot your opponent's during this turn. | …give up to 1 of your opponent's Characters −1 cost during this turn. |
| 4 | OP06-108 | text | **content** | …your [Land of Wano] type Leader… | …your {Land of Wano} type Leader… (brackets mean card name, braces mean type) |
| 5 | OP06-021_p2 | text | **content** | …Choose one:• Rest… Characters 1 cost during… | …Choose one: • Rest… Characters −1 cost during… |
| 6 | EB01-006, _p1, _p2 | text | whitespace | [DON!! x2][When Attacking] | [DON!! x2] [When Attacking] |
| 7 | EB01-030 | text | whitespace | [Activate:Main] … cards.[Trigger] | [Activate: Main] … cards. [Trigger] |
| 8 | ST10-010_p7 | printing id | **content** | ST10-010_p7 (PRB-01 reprint) | ST10-010_r1 |
| 9 | ST10-010_p4 | text | whitespace | …attack.)[On Play]… | …attack.) [On Play]… |
| 10 | ST16-005, _p1, _r1 | types | order/delimiter | FILM Straw Hat Crew Supernovas | FILM/Supernovas/Straw Hat Crew |
| 11 | ST16-005_r1 | text | **content** | …gains +1000 power.Disclaimer: This card was reprinted from the original set with changes to the copyright information… | …gains +1000 power. |
| 12 | EB03-015 | power | official-renders-0-as-dash | 0 | "-" |
| 13 | EB04-003, _p1 | types | order/delimiter | Navy Punk Hazard | Punk Hazard/Navy |
| 14 | EB04-003_p1 | rarity | modeling | R | SP CARD |
| 15 | EB04-003_p1 | text | whitespace | …played.)[Opponent's Turn] | …played.) [Opponent's Turn] |
| 16 | OP16-005 | text | punctuation | …"Whitebeard Pirates" give this card… | …"Whitebeard Pirates", give this card… |
| 17 | ST05-010 | types | case/delimiter | Film Neo Navy | FILM/Neo Navy |
| 18 | ST05-010 | text | notation | battles "Strike" attribute Characters … [Activate:Main] | battles ＜Strike＞ attribute Characters … [Activate: Main] |
| 19 | ST12-010 | types | order/delimiter | Revolutionary Army Impel Down | Impel Down/Revolutionary Army |
| 20 | ST12-010 | text | whitespace | [When Attacking][Once Per Turn] | [When Attacking] [Once Per Turn] |
| 21 | ST12-016 | text | whitespace | [Main] / [Counter] | [Main]/[Counter] |
| 22 | ST12-015 | text | **content** | the literal string "NULL" | "-" (vanilla card, no effect) |
| 23 | ST29-004, _p1 | types | order/delimiter | Straw Hat Crew Egghead | Egghead/Straw Hat Crew |

**Conclusion of the diff.** optcgapi is fine for names, colors, cost, power and counter, with isolated errors. Its effect text is **not safe** for an engine: sign loss alone changes 13 cards in the OP-17 list. Its types cannot be split. So it is the fallback and image host, not the primary source. Running the official parser on 2,834 printings across 22 pages produced no parse failures: every printing had an id, category, color and type. The only gap is OP15-096's missing block value.

## Terms risk

- **The official site forbids reproduction without permission.** It says so for images, text and data. Committing `cards.json` reproduces the text, and this is true whichever intermediary supplies it: optcgapi, arjunkai and apitcg all copy the official text or TCGplayer's copy of it. PROMPT.md already treats card text as "factual game data; store it, cite its source". This research does not change that position, but it is a judgment the owner owns.
- Mitigations:
  - store only game-functional fields, with no flavor text, art or official logos;
  - cite `sourceUrl` on every card;
  - keep the footer disclaimer;
  - fetch only through `cards:update`, never from users' browsers;
  - be ready to delete `cards/data/` on request.
- **optcgapi hotlinking puts our players' image traffic on a hobbyist's paid VPS.** The service worker cache limits repeat traffic. A courtesy message to the maintainer is advised; his Discord is "domothebot".
- **arjunkai's hosted API describes itself as private.** Using its public image route from our app without asking would go against that.
- **Scrydex terms forbid redistributing or mirroring**, so it is out unless the owner pays and accepts that JSON derived from it cannot be committed publicly.

## Open questions

1. The official footer forbids reproducing its "text and data" without permission. Do we still commit card text as "factual game data"? Best answer: yes; cited, no art, takedown-ready. The owner decides.
2. Notify optcgapi's maintainer before hotlinking his images? Best answer: yes, as a courtesy.
3. arjunkai image proxy: request access. Best answer: keep it disabled until approved.
4. OP15-096 has no block on the site (the image shows 4), and block varies by printing. Best answer: use the newest printing's block plus the exceptions page; if none, legality is "unknown". Track F should confirm.
5. EB-05 is listed before its release. Best answer: import it, with legality gated on 2026-10-30.

## Proposed decisions (research agent; the first is superseded by "Decision" above)

**Card data: official card list, with optcgapi.com as fallback.** Context: optcgapi drops minus signs (13 cards in the OP-17 list), strips type delimiters and shifts columns. Decision: `cards:update` parses `/cardlist/?series={id}` (61 pages, 3 s apart); on parse failure it falls back to optcgapi bulk data marked unverified. Rejected: Scrydex (paid; mirroring forbidden), arjunkai (private), apitcg (keyed, no terms), Limitless (no API).

**Images: optcgapi, then the arjunkai proxy (off until approved), then a text-only card.** Context: every source serves official SAMPLE-watermarked scans, and official URLs are blocked by `Cross-Origin-Resource-Policy: same-site`. Decision: use one swappable image module. Rejected: official URLs, Scrydex, and the Limitless and TCGplayer CDNs.

**Schema adds `block`; artworks use official printing ids.** Context: Standard depends on block icons. Decision: compute `legality` from block, `rules/blockicon-card/` and `news/restriction.html`. Rejected: hand-kept lists.
