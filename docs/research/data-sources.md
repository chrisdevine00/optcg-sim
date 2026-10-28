# Card data and art sources (Phase 1, Track B)

As of: 2026-10-28. Work in progress; sections are filled in as the research completes.

## Findings so far (draft)

- optcgapi.com: free, keyless, `Access-Control-Allow-Origin: *` on JSON; covers OP-01..OP-17 and ST-01..ST-36 (no ST-29); no EB-05/OP-18; alt arts share `card_set_id`, differ by `card_image_id` (`_p1`, `_p2`); trigger text concatenated into `card_text`; images are byte-identical copies of the official SAMPLE-watermarked PNGs, served without CORS headers or Cache-Control.
- Official card list: has block icon, separate effect/trigger, EB-05 already listed; images carry SAMPLE and are served with `Cross-Origin-Resource-Policy: same-site` (cannot be hotlinked from another site); footer: "All images, text and data on this website may not be reproduced without permission."
- Scrydex: paid ($29/month minimum), keyed; images public, CORS `*`, 1-year immutable cache; images checked are SAMPLE-watermarked; no counter field documented.
- arjunkai/optcg-api: hosted worker is key-gated and origin-gated; `/images/*` is public with CORS `*` but serves the official SAMPLE image; README says do not reuse its D1 data.
- apitcg.com: keyed (free 1,000 requests/month), TCGplayer-derived, no terms page found.
- Limitless: no documented card API; images SAMPLE-watermarked, no CORS header.
