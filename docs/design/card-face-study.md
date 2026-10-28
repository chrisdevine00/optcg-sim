# Card-face study: showing cards under the SAMPLE watermark

**As of:** 2026-10-28 (Phase 4, revision 2: review-1 fixes)
**Why this exists:** plan review finding UX-10. Every available card image carries a SAMPLE watermark, which works against principle 6 ("Real card art is the hero"). This study compares ways to draw a card on the board and in the hand at the minimum legible size, recommends one, and asks the owner to sign off early.
**Inputs:** `docs/research/data-sources.md` (image sources and terms), `board.md` §2 (sizes, badges), `visual-system.md`, `principles.md`.
**No images are committed.** The sketches below use placeholder rectangles labelled "art". The watermark position was measured on the scans that Track B already cached locally under `.cache/track-b/img/`, which is gitignored and never published.

## 1. The constraint

**What we have.** Every source serves the same official scan: 600 × 838 PNG with SAMPLE (data-sources.md: official, optcgapi byte-identical, Scrydex, the arjunkai proxy, Limitless, the TCGplayer CDN). There is no clean source. The primary image host is optcgapi, loaded with `<img>`. Its images are opaque to CORS, so they cannot be drawn to a canvas or processed. Anything we do to the image has to be done with CSS: crop, scale, cover.

**Where things sit on the scan.** Measured on cached OP17 scans, as fractions of width × height:

| Region | Position | Note |
|---|---|---|
| Printed cost | top-left disc, x 0–15%, y 0–11% | covered by our cost badge |
| Printed power and attribute | top-right, x 67–100%, y 1–9% | covered by our power plate |
| **Art, clean** | about y 4–38%, full width | faces usually sit in the upper third for Characters and Leaders; Events vary |
| **SAMPLE watermark** | **a horizontal band at y ≈ 40–60%, about 90% of the width**, white, semi-transparent, outlined | it is not diagonal; it crosses the lower part of the art |
| Printed Counter | left edge, vertical, y ≈ 35–55% | covered by our Counter plate (hand only) |
| Printed effect and Trigger text | y ≈ 62–82% | about 4 px tall at board size, so unreadable whatever we do |
| Printed name, category, type | y ≈ 84–95% | about 5 px at board size |

**What this means.** At board size (84 × 117 at 1280; 76 × 106 minimum), the only parts of a scan that work are the art and the colour of the frame. The printed numbers are wrong as soon as a modifier applies, and the printed text is unreadable. The watermark is the single largest high-contrast shape on the card. With 10 to 20 cards on screen, the board reads as a page of SAMPLE stamps.

**One useful fact:** the clean art band (y 4–38%) sits **above** the watermark. A crop can show the card's most recognisable region, usually a face, with no watermark at all.

## 2. Treatments

All four treatments use the same badge positions and plates from `board.md` §2.3, so live values are identical in each. They differ only in what sits under the badges. Each sketch is a board card at 84 × 117.

### A. Full scan with overlaid live stats

```
┌──────────────────────┐
│(3)        [ 7000 ▲]  │  plates cover the printed cost and power
│        art           │
│░░░░░ S A M P L E ░░░░│  watermark band, 40–60%
│ ┌──────────────────┐ │
│ │ printed text box │ │  unreadable at this size
│ └──────────────────┘ │
│[◆2]  printed name [⛨]│
└──────────────────────┘
```

The whole scan fills the card, and our plates cover the printed cost and power.
- **For:** the most "real card" look. It matches paper and every other sim. There is no cropping risk. Card colour comes through the printed frame. It is the cheapest to build.
- **Against:**
  - The **watermark is the loudest thing on every card.** In the mock-up at 76–84 px, SAMPLE was legible on every card from across the room, and rested cards show it as a vertical stripe.
  - About half the face is printed text and frame that cannot be read at this size, so the visible clean art is only about a third of the face.
  - It cannot be the image-failure fallback, so a second "text card" component is needed. Swapping between the two shifts content when images fail or arrive late.

### B. Text-first frame with cropped art

```
┌──────────────────────┐
│(3)        [ 7000 ▲]  │
│                      │
│ ┌──────────────────┐ │  art crop: band y 4–38%, ~26% of the face
│ │       art        │ │
│ └──────────────────┘ │
│ Charlotte Pudding    │  name 12/14 semibold, 2 lines max
│ Big Mom Pirates      │  type 12/14 muted
│[◆2]              [⛨] │
│▀▀▀▀▀▀▀▀ colour band ▀│
└──────────────────────┘
```

Our own frame on a plate background. The name and type are the primary content, the art is a small crop from the clean band, and the card colour is a band at the bottom.
- **For:**
  - **The best legibility at the minimum size.** Names are readable at 76 px, which helps newcomers most, because they don't yet know the art.
  - Typography is consistent across all cards and both themes, and there is no watermark.
  - It is the same component as the image-failure fallback: art missing just means an empty art box. So there is no layout shift.
- **Against:**
  - The art is small (about a quarter of the face), which works against "art is the hero".
  - The board looks like a spreadsheet of cards, so paper players lose recognition by art.
  - The crop band can miss a face on some Events and Leaders.
  - Rested cards show the name sideways (seen in the mock-up).

### C. Art window: the clean band, large, with our own name footer (recommended)

```
┌──────────────────────┐
│(3)        [ 7000 ▲]  │
│                      │
│         art          │  art window, ~58% of the face: the scan's clean band
│     (crop 1.43×)     │  (x 15–85%, y 4–38%) scaled up; no watermark
│[◆2]              [⛨] │  DON!! and keywords sit at the window's bottom edge
├──────────────────────┤
│ Charlotte Pudding    │  footer on a plate: name 12/14 semibold, 2 lines
│▀▀▀▀▀▀▀▀ colour band ▀│  colour band (initials at roomy density, 12 px or larger)
└──────────────────────┘
```

The top 58% of the card is an art window showing the scan's clean band, scaled about 1.43× so it fills the window: `object-fit: cover` with an `object-position` focus. The bottom 42% is our own footer on a plate: the name (up to 2 lines) and a colour band.
- **For:**
  - **The largest clean art we can give.** The window is about 58% of the face, and the crop is 1.43× larger than the same region in treatment A. Faces read better than on the full scan at the same card size.
  - **No watermark on the board or in the hand.**
  - The name is readable at 76 px.
  - It is one component with the fallback, as in B: no layout shift when art arrives or fails (PROMPT Performance).
  - Card colour carries through the band, and in words in accessible names.
  - It looks like a well-made tool, not a mock-up.
- **Against:**
  - The crop can miss the subject on some cards (Events with speech-bubble art, wide Leader compositions). This needs a per-card focus override.
  - Paper players lose the printed frame and its layout as a cue.
  - At 76 px the four corner plates cover about 40% of the window, which leaves roughly a third of the face as clear art. That is the same clear area as A, but without the watermark and at a larger scale.
  - Rested cards show the footer name sideways (seen in the mock-up). We accept this: the rested state is about the art and the plates, and the name stays in the preview and the accessible name.
  - On rested cards, the DON!! and keyword badges move to the bounding box's art-side corners so they don't cover the rotated name.

### D. Full scan with a name sash over the watermark

```
┌──────────────────────┐
│(3)        [ 7000 ▲]  │
│        art           │
│██ Charlotte Pudding ██│  opaque sash at 40–60% hides SAMPLE
│ printed text box     │
│[◆2]  printed name [⛨]│
└──────────────────────┘
```

The full scan, with an opaque 20%-high sash across 40–60% that carries the name and keywords and hides SAMPLE.
- **For:** the full-card look of A without the watermark; it also shows the printed frame and colour; it is simple.
- **Against:**
  - The sash cuts the art through its middle, usually across a character's torso, and reads like a censor bar.
  - The printed name and text box below are still unreadable noise, and the name appears twice.
  - The art above the sash is smaller than C's window, because it is not scaled up.

**Rejected:** D keeps the cost of A (half the face is unreadable print) and adds a bar across the art.

## 3. Comparison at the minimum size (76 × 106)

Estimates are from the HTML mock-up (`.cache/design/cards/cards.html`, placeholder art, not committed) and the measured scan regions above.

| Criterion | A Full scan | B Text-first | C Art window | D Scan + sash |
|---|---|---|---|---|
| Watermark visible on board and hand | **Yes**, every card | No | No | No |
| Clean art, share of face | ~33% | ~26% | ~58% window, ~35% clear of plates | ~33% |
| Art scale versus the scan | 1.0× | ~1.0× | **1.43×** | 1.0× |
| Name readable on board | No (5 px print) | Yes | Yes | Yes |
| Live stats correct | Yes (plates) | Yes | Yes | Yes |
| Same component as the image-failure fallback | No | Yes | Yes | No |
| Layout shift when art arrives | Risk (two components) | None | None | Risk |
| Card colour visible | Printed frame | Band | Band | Printed frame |
| "Looks like the real card" | **Best** | Weakest | Good: real art, our frame | Fair |
| Crop risk (subject missed) | None | Medium | Medium; mitigated by focus overrides | None |
| Build cost | Lowest | Low | Low, plus a focus override field | Low |
| Terms posture | Same for all: display at runtime, never redistributed; CSS crop changes no file | | | |

## 4. Recommendation

**Use treatment C (art window) on the board and in the hand. Use the full scan (treatment A, watermark included) in the preview dock. Offer a setting for anyone who prefers the full scan on the board.**

1. **Board and hand: C.** Its frame doubles as the image-failure card (treatment B is simply C with an empty art window), so there is one component and no layout shift.
2. **Preview dock: the full scan, with the watermark.** At preview size (168 × 235 at 1280, 240 × 335 at 1920) the scan is a reference image, and the player wants the real card there. The preview always prints the effect text in our own type beside it, so the scan never has to be legible.
3. **Setting "Card faces on the board":** "Art window (recommended)", "Full card scan", or "Text first". Full card scan uses treatment A. Text first uses treatment B and suits learning names or low-bandwidth use. The setting is stored locally (`localStorage`) and is purely cosmetic.
4. **Crop focus.** By default the window shows scan rows 4–38% and columns 15–85%. `cards/overrides/<ID>.json` may carry an optional `artFocus: { x, y }` (percentages) where the default misses the subject. All 182 meta-list cards are checked by eye in M1, when their stats are already being verified (ARCH §3). That adds about 30 minutes with a small crop-preview page. Other cards use the default until someone reports one.
5. **If clean art ever becomes available** (a licensed source, or Scrydex on a paid plan, `data-sources.md`), the default can switch to the full scan with one setting change and no layout work, because A uses the same plates and geometry.

**Why not the full scan by default.** Principle 6 says the art is the hero. On our sources the full scan makes the **watermark** the hero: it is the most prominent shape on every card. It also spends half of each card on print nobody can read at this size. C shows more of the actual illustration, larger and cleaner, and keeps the real card one hover away.

## 5. Question for the owner (sign-off)

> **Card faces.** All card images we can use carry a "SAMPLE" watermark across the lower middle of the art. On the board and in your hand, I propose showing each card as an *art window*: the clean upper part of the official art, enlarged, with the card's name in our type below it and our live cost and power on top. The full official scan, watermark included, appears whenever you hover, long-press or focus a card. You can switch the board to full scans in Settings.
>
> Do you sign off on the art window as the default? Please answer from two screenshots of the same mid-game board at 1280×720, one with each treatment (produced in the wireframe pass and stored under `docs/design/wireframes/shots/`, which is gitignored).
>
> Placeholder art cannot show crop failures, so the sign-off happens on a **local page that uses real cached scans** (fetched from the image source at runtime into the browser cache, never committed), at 1280×720, 1280×600 and 1024×690, for the 20 most-played cards in the slice decks (review-1 UX-R17).
>
> If you prefer the full scan as the default, the cost is the watermark on every card in view. The rest of the design is unchanged.

Until the owner answers, the wireframes and M3 build C. Switching the default later is one setting value, not a redesign.
