# cards

The card database as static JSON, the hand-verified overrides and format data behind it, and (from M4) the effect scripts attached to card IDs.

**Owns:** the card schema (`src/schema.ts`), generated data (`data/`), overrides (`overrides/`), Standard format data (`format/standard.json`), legality and block computation (`src/format.ts`), record validation (`src/validate.ts`), and the `cards:update` pipeline (`scripts/`).

**Must not know about:** the engine, the AI, the browser or React. `src/` depends on nothing; only `scripts/` uses Node and the network. Card images are never stored here: each artwork records a path relative to its image source, and the app's art module owns the base URLs.

## Data flow

```
optcgapi.com bulk endpoints ──► .cache/cards/ (raw, re-fetched only with --refresh)
   allSetCards, allSTCards,           │
   promos/filtered/?set_id=P          ▼
                          scripts/normalize.ts   every defect class from the Track B diff
                          scripts/types-vocab.ts type splitting; fails on any ambiguous split
                          scripts/build.ts       printings reconciled by card number
                                    │
            overrides/<ID>.json ───►│  hand-verified corrections, printed keywords, verified flag
          format/standard.json ───►│  block and Standard/Extra legality per card number
                                    ▼
                          src/validate.ts        every record checked
                                    ▼
             data/manifest.json + data/sets/<SET>.json   (generated, never hand-edited)
                                    +
             diff report against the previous snapshot (scripts/diff.ts)
```

## Commands

- `npm run cards:update` fetches (or reads the cache), normalizes, applies overrides, writes `data/`, and prints repairs by class and the diff report. `-- --refresh` re-fetches upstream (3 s between requests, descriptive User-Agent); `-- --dry-run` writes nothing. A run fails on an ambiguous or unmatched type split, a card with no usable row and no override, a stale override (a text patch that no longer applies, or keyword lines that stop matching the verified keywords, effect-dsl E-D7), an invalid record, or changed text on a card that has an effect script.
- `npm run cards:verify-meta` compares every card in `docs/research/meta-lists.json` with its Limitless card page (cached in `.cache/m1/limitless/`; `-- --fetch` downloads missing pages about one per second). Disagreements are settled by a person on the official card list, one card at a time, and recorded as an override. `-- --write` marks cards with no disagreement as verified and records their printed keywords.

## Repairs (normalizer)

| Class | What it does |
| --- | --- |
| Sign repair | `DON!! 1:` → `DON!! −1:`; unsigned power or cost given to an **opponent's** card → `−N`. Recorded in `textFixes[]`. Self-directed values are flagged, never repaired (E-Q8). |
| Type splitting | Longest match against a vocabulary from delimited rows plus a cited addendum (`scripts/types-vocab.ts`). More than one valid split, or a piece that may hide an unknown type, fails the run. |
| Name suffixes | `(005)`, `(Alternate Art)`, `[Finalist]`, ` - P-117` removed; kept as the artwork label. |
| NULL and empty text | `NULL` becomes an empty effect (a vanilla card). |
| Reprint disclaimers | Appended `Disclaimer:` text and the "officially errata'd" note removed. |
| Shifted columns | Rows with types in the power or cost column, non-colours in the colour column, or a counter in the types column are rejected for game fields. If every printing is shifted, an override must supply the broken fields. |
| Trigger split | The card's own `[Trigger]` (at an ability start) becomes `triggerText`; a `[Trigger]` mentioned inside a sentence stays. |
| Printings | Game fields come from the base printing; other printings become artworks and any disagreement is reported. |

## Overrides

`overrides/<CARD-ID>.json`: `verified`, `sources[]` (URL, date, use), `keywords`, `fields` (each with the `upstream` value it replaced, so the run warns when upstream starts to agree or changes again), `textPatches` (find/replace with a source), `block`, `artFocus`, `note`. All 182 meta-list cards are verified against Limitless; where Limitless and optcgapi disagreed, that card's entry on the official card list settled it.

## Format data

`format/standard.json` is hand-kept and cited: allowed blocks, the block of each product (printed icons on the official card list), the Super Parallel Rare and fixed-block exception lists, numbers whose newest printing shows block X, banned cards and banned pairs. Known gaps are listed in its `gaps` array; cards without a cited block are `unknown`, never guessed.
