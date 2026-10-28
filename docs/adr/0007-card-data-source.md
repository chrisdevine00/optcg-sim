# ADR 0007: Card data from optcgapi.com with mechanical repair and hand-verified overrides; art hotlinked with a text fallback

**Status:** Accepted, 2026-10-28 · **Evidence:** `docs/research/data-sources.md`

## Context
We need complete English coverage through OP-17 and ST-31 to ST-36, accurate effect text, block numbers for Standard legality, and art that may be displayed. Track B scored six candidates and diffed optcgapi.com against the official card list (OP-17 in full, plus 20 random cards). The official list is the most accurate, but its terms say its "text and data … may not be reproduced without permission". optcgapi.com is "open for anyone to use" but has systematic defects: minus signs dropped on 13 OP-17 card numbers, type delimiters lost, one shifted row, "NULL" text and appended reprint disclaimers. Scrydex forbids mirroring; the arjunkai API is private; apitcg has no terms; Limitless has no API or grant. Every image source serves the same SAMPLE-watermarked scans, and official image URLs are blocked cross-site by `Cross-Origin-Resource-Policy`.

## Decision
- `cards:update` fetches optcgapi.com bulk endpoints only, then normalizes: sign repair recorded as `textFixes[]`, vocabulary-based type splitting that fails rather than guesses, cleanup of junk values, and a trigger split.
- `cards/overrides/<CARD-ID>.json` holds hand-verified corrections with the source URL and date. They are written when a card is scripted, from a person-scale read of the official card-list entry. CI requires every scripted card to be verified.
- Block, ban and exception data lives in the hand-kept, cited `cards/format/standard.json` (ADR 0011).
- The pipeline never fetches the official site.
- Images: optcgapi `card_image` → arjunkai `/images/{printingId}` (disabled until its maintainer approves) → text-only card. A service worker caches images. One module holds the base URLs.

## Alternatives rejected
Parsing the official card list in bulk (its terms forbid reproduction; PROMPT.md requires choosing another source in that case). Using optcgapi raw with no repair (sign loss changes card meaning). Scrydex (paid, and committing derived JSON would be mirroring). The arjunkai hosted data (private) or self-hosting its scraper (equivalent to scraping the official site).

## Consequences
- Unscripted cards may carry upstream text errors. The inspector labels them "not verified", and the diff report surfaces upstream fixes.
- If Bandai grants permission, the official parser documented in the research becomes the primary in one module.
- Hotlinking optcgapi images sends our players' image traffic to a hobbyist's paid server. The service-worker cache keeps repeat traffic low, and the owner may contact the maintainer as a courtesy.
- The card schema gains `block`, `verified`, `textFixes` and printing-level `artworkId`s (`OP17-005_p1`). That schema change lands in M1.
