# ADR 0015: Card data from Limitless card pages for a set optcgapi.com does not have yet

**Status:** Accepted, 2026-11-27 (owner decision, plan M11 Track B) · **Amends:** ADR 0007, ADR 0014

## Context
OP-18 "The Dominance of God" was released in English on 2026-11-20. On 2026-11-27 optcgapi.com, our only card-data source (ADR 0007), had no OP-18 row (`/api/allSetCards/` 3,750 rows up to OP-17 and EB-05; `/api/sets/OP-18/` 404). The meta has moved: in the cached Limitless standings the OP-18 Leaders Gunko (OP18-060), Spandam (OP18-079), Franky (OP18-021) and Ms. All Sunday (OP18-041) already place, and 88 OP-18 card numbers appear in decklists. `meta:update` skips every event that uses a set the snapshot lacks, so the meta cannot be refreshed until OP-18 is in. Limitless (onepiece.limitlesstcg.com) lists the full set, one HTML page per card, and ADR 0007 already used those pages as a cross-check for every meta-list card (`cards:verify-meta`). The owner chose to import OP-18 from Limitless now and switch back to optcgapi when it catches up.

Checked 2026-11-27: Limitless's `robots.txt` is `User-agent: * / Disallow:` (everything allowed); its legal notice (limitlesstcg.com/legal) names the operator and links a privacy policy, and states no terms of use and no restriction on automated reading; the Limitless developer documentation already relied on by ADR 0014 asks for no key for public reads and sets no attribution rule. Limitless is credited on About anyway.

## Decision
- **A per-product secondary source.** `cards/scripts/sources.ts` `LIMITLESS_PRODUCTS` lists products read from Limitless (OP-18 only). For each, `cards:update` reads the set page (`/cards/<slug>`) for the product's card numbers, then each card page (`/cards/<ID>`), one request every 1.5 s, cached in `.cache/cards/limitless/` and re-fetched only with `--refresh` (about 120 requests per product). The `update.yml` cards job may make these requests; no other workflow does.
- **Same normalizer, same schema.** Each page is parsed (`parseLimitless`) and turned into an optcgapi-shaped row (`limitlessRow`): printed rarity codes (an unknown rarity name stops the run), slash-delimited types and attributes, the [Trigger] rejoined to the text. The row then goes through the same normalizer, overrides, legality and validation as any other card. Nothing is parsed into behaviour (ADR 0006).
- **The source is recorded per card.** A Limitless card has `dataSource: "limitless"` and its Limitless page as `sourceUrl`; the manifest's `source` names the products taken from Limitless. A card with no `dataSource` comes from optcgapi. The inspector's "not verified" line names the host the text came from.
- **optcgapi wins as soon as it has a card.** Per card number: a set or starter row in optcgapi means the card comes from optcgapi (a promo row alone does not count, since promos reprint cards before their booster lands). For such a card `cards:update` prints its differences from the cached Limitless page (`compareWithLimitless`, after overrides), and once a product is complete in optcgapi it says to remove the product from `LIMITLESS_PRODUCTS` after the differences are settled. A changed text on a scripted card fails as before (the diff report), so a switch can never silently change a script's card.
- **No new image host.** A Limitless card's one artwork has `source: "none"` and no path, so the app draws its text face. Limitless's image CDN is not used. When optcgapi has the set, its images arrive with its rows.
- **Verification and block stay hand-cited.** Limitless is the input, so it cannot also be the verification source for these cards: overrides for OP-18 cite the official card list, read by hand once (the OP-18 series page, `?series=569118`, kept in `.cache/cards/official/`, never committed, never fetched by a script). The OP-18 block (5) is cited from that page in `standard.json`; OP18-031 and OP18-065 print X and carry it in their overrides.

## Alternatives rejected
- **Waiting for optcgapi.** Leaves the meta frozen (every event uses OP-18) and the newest Leaders unplayable for an unknown time.
- **Parsing the official card list** for OP-18. Its terms forbid reproducing its text and data (ADR 0007); a person-scale read to verify is the most it is used for.
- **Hand-writing OP-18 JSON.** PROMPT.md: new sets enter only through `cards:update`, and hand-typed text is the error class the overrides exist to catch.
- **Using Limitless images.** A new image host for a week or two of art; the text face already works everywhere.
- **Recording `dataSource` on every card.** Rewrites every set file for no information; absent means the primary source.

## Consequences
- OP-18 is playable and scriptable before optcgapi has it, and `meta:update` can count OP-18 events.
- A weekly `--refresh` makes about 120 more requests (about 3 minutes) while a product is listed.
- When optcgapi adds OP-18: the run reports each card's differences; settle them (an override, or accept optcgapi's text after checking the official list), then remove OP-18 from `LIMITLESS_PRODUCTS`. Expect optcgapi's usual defects (dropped minus signs, merged types), which the normalizer repairs, and OP-18 images.
- If Limitless asks us to stop, removing the product from the list is the whole change; the committed data stays until optcgapi has the set.
