# Visual system

**As of:** 2026-10-28 (Phase 4, revision 2: review-1 fixes)
**Tokens:** `docs/design/tokens.css`. That file is the source of truth for every value below. M0 copies it to `app/src/styles/tokens.css`.
**Contrast check:** `.cache/design/contrast.mjs` parses `tokens.css` and checks every declared pair. M0 moves it into the build, where any failing pair fails CI (PLAN, M0 done criteria).
**Related:** `principles.md` (6: art is the hero), `board.md` (geometry, badges, pacing), `card-face-study.md`.

## 1. Stance

The product should feel like a well-made instrument: a quiet slate surface, precise numbers, and colour reserved for the cards and for state. It must not look like the official One Piece Card Game. That brand uses red, black and gold, heavy condensed italic display type, and rope, compass and pirate motifs, and we use none of them. There are no textures, no gloss, and no gradients on chrome. Our card backs and DON!! tokens are our own geometric designs and never imitate the printed ones.

Four rules follow from that stance:
1. **Chrome is close to the mat.** Surfaces step 1–3% in lightness from the playmat. Separation comes from spacing and thin lines, not contrast blocks.
2. **Saturation is a signal.** The only saturated colours outside the card art are the state colours (§2.3), and each is on screen only while its state is true.
3. **Numbers are the interface.** Every number is in Inter with tabular figures, sits on a solid plate or a flat surface, and never sits on art without a plate.
4. **Colour never carries meaning alone** (§2.5).

## 2. Colour

### 2.1 Themes

- **Dark playmat** is the default (`:root`).
- **Light** is opt-in with `<html data-theme="light">`. The Settings options are "Dark (default)", "Light" and "Match system", and "Match system" sets the attribute from `prefers-color-scheme`.
- Card badge plates are **theme-invariant** (dark plate, light numerals). A card looks the same in either theme, and its contrast never depends on the art behind it.

### 2.2 Neutrals

| Token | Dark | Light | Use |
|---|---|---|---|
| `--color-bg` | `#0b0e12` | `#f2f4f7` | App background, behind the rail |
| `--color-mat` | `#11161d` | `#e4e8ed` | Playmat |
| `--color-mat-zone` | `#18202a` | `#d8dee5` | Empty zone slot fill |
| `--color-mat-line` | `#2a3441` | `#b9c2cc` | Zone outline (decorative; a legal drop target gets the accent ring instead) |
| `--color-surface-1` | `#141920` | `#ffffff` | Rail panels (log, coach) |
| `--color-surface-2` | `#1b212a` | `#ffffff` | Decision panel, popovers, preview dock (raised; light theme uses shadow) |
| `--color-surface-3` | `#242b36` | `#edf1f5` | Hover rows, pressed, selected list item |
| `--color-line` | `#2a323d` | `#d3d9e0` | Dividers (decorative) |
| `--color-line-strong` | `#6e7a8a` | `#6b7684` | Boundaries of controls: secondary buttons, inputs, segmented controls (≥ 3:1) |
| `--color-text` | `#e8ecf1` | `#11161c` | Primary text |
| `--color-text-muted` | `#aeb7c3` | `#46505d` | Secondary text, labels |
| `--color-text-subtle` | `#96a0ad` | `#56606c` | Tertiary text: timestamps, zone labels. Still ≥ 4.5:1 everywhere. |
| `--color-plate` | `#06080b` | same | Card badge plates |
| `--color-plate-text` / `-base` / `-buff` / `-debuff` | `#ffffff` / `#b4bcc8` / `#7fe0ae` / `#ff9ca6` | same | Badge numerals: live, base, raised, lowered |

### 2.3 Signal colours

| Meaning | Token (dark / light) | Paired non-colour cue |
|---|---|---|
| **You, and your legal options** | `--color-accent` `#6cc4ff` / `#0a69ae`; text `--color-accent-text` | Legal ring **plus** a corner glyph naming the action (▶ ⚔ ◆ ⌖ ⚡); "You" written in the tag |
| **The opponent and their actions** | `--color-opponent` `#f5a35c` / `#b45309`; text `--color-opponent-text` | "Opponent" / "Opp" written in the tag; a word chip on the acting card ("playing", "attacking"). Orange is **only ever** the opponent: your own resolving or triggered card wears the accent ring and an accent "resolving" chip, never the orange ring (UX-R18) |
| **Attack, hit lands, lethal, danger** | `--color-attack` `#ff6b7a` / `#c8283e`; text `--color-danger-text` | Arrow shape, ⌖ glyph, ✕ icon, the words "Hit lands" or "K.O." |
| **Survives, attack fails** | `--color-success` `#5fd49a` / `#1c7a4c`; text `--color-success-text` | ✓ icon, the words "Attack fails" or "Survives" |

**Battle results are styled from the player's side** (UX-R19). Success and danger mean "good for you" and "bad for you", not "the attack worked":

| Result | Your attack | Their attack on you |
|---|---|---|
| Hit lands on the Leader | "✓ Hit lands · their Life 3 → 2", success | "✕ Hit lands · your Life 3 → 2", danger |
| Character K.O.'d | "✓ K.O.s King", success | "✕ K.O. · Gloriosa", danger |
| Attack stopped | "✕ Attack fails", danger text (no fill) | "✓ Attack fails", success |
| Tie | "✓ Ties go to you", success | "✕ Ties go to the attacker", danger |

The words are the same in both columns where the fact is the same, so the meaning never depends on the colour.
| **Warning** (0 Life, low deck, effect not automated) | `--color-warning` `#f2c94c`; text `--color-warning-text` | ⚠ icon plus the words |
| **DON!!** | `--color-don` `#b7a3ff` / `#6a4fd6`; rested `--color-don-rested` | ◆ glyph; rested tokens are rotated, in a separate row, labelled "⟳ Rested N" |
| **Raised / lowered stat** | `--color-plate-buff` / `--color-plate-debuff` | ▲ / ▼ glyph beside the number |
| **Focus** | `--color-focus` with `--color-focus-gap` | Shape: a two-tone ring outside the element, distinct in shape from the legal ring |

**Blue means you and orange means the opponent.** Blue lights your options, your tag and your primary button, so "blue = mine to act on" is one rule. Orange marks what the opponent is doing. Red is kept for attacks and danger only, so an orange opponent highlight never reads as an attack. Hues were picked to stay apart for common colour-vision deficiencies where possible, but the design never relies on that (§2.5).

### 2.4 Translucent layers

- `--color-scrim`: behind dialogs. Dialogs cover only the rail; the board stays visible.
- `--color-dim`: over cards that are not candidates during a targeting mode, and only then.
- `--color-legal-glow` / `--color-opponent-glow`: decorative glows behind rings. The rings alone meet 3:1, so the glows carry no meaning.

### 2.5 Colour never carries meaning alone

Every coloured meaning on screen has at least one non-colour cue, listed in §2.3. The specific checks:
- **Active vs rested:** rotation plus the "⟳ Rested" chip (`board.md` §2.4). The DON!! rows add position and a label.
- **Whose turn:** the words "Your turn" or "Opponent's turn" in the midline band **and** as a chip in the rail header, plus a 4 px bar along the acting player's half of the mat's left edge (accent for you, opponent colour for them; UX-R12). The bar is a second, non-text cue; the words stay.
- **Battle result:** an icon plus a phrase.
- **Raised or lowered numbers:** ▲ or ▼.
- **Card colour** (red, green, blue, purple, black, yellow) is a game attribute, not a UI meaning. Even so:
  - the frame's colour band carries the colour initials at roomy density, at 12 px or larger (UX-R17);
  - every preview names the colours in words;
  - accessible names include them;
  - the deck builder filters by name.
- **Review:** run the board screenshots through a deuteranopia and a protanopia simulation and through greyscale at each milestone. Every state must still be identifiable.

## 3. Typography

### 3.1 Typefaces

| Role | Face | Licence | Package | Weights shipped |
|---|---|---|---|---|
| **UI and numerals** | **Inter** (variable), by Rasmus Andersson | SIL Open Font License 1.1 | `@fontsource-variable/inter` | variable `wght` 400–700, Latin subset |
| **Display** | **Fraunces** (variable), by Undercase Type | SIL Open Font License 1.1 | `@fontsource-variable/fraunces` | variable `wght` 600 only in use, `opsz` on, Latin subset |

Both are self-hosted from npm through @fontsource. No request goes to a font CDN, which fits "static, local-first" and the offline service worker. Exact package versions are pinned at M0. **M0 also verifies** the OpenType features used below (`tnum`, `ss01`) and the `opsz` axis in the shipped files, by rendering a test string. If either is missing in the @fontsource build, the fallback is the static @fontsource build that has them.

**Why Inter for the UI and the numbers**
- **Tabular figures** (`tnum`), which PROMPT requires for numerals. Power, cost, Life and counts change in place, and proportional digits would make every number jitter when it changes.
- **Large x-height and open apertures.** It is built for screens at 12–16 px, which is where the log, badges and chips live.
- **Open digits** (`ss01`). The 6, 9 and 4 are more distinct, which matters when "6000" vs "8000" decides a battle on a 76 px card. It is applied to badges and battle numbers only.
- **A variable font** keeps one file for every weight, which matters for the first-playable budget (PROMPT Performance).
- **Widely hinted and tested,** with metrics close to system-ui. That makes a metric-adjusted fallback easy (§3.4), so font loading causes no layout shift.

*Rejected UI faces:*
- **Atkinson Hyperlegible Next:** excellent letterforms, but tabular figures could not be confirmed. Kept as a candidate for a future "high legibility" setting once verified.
- **IBM Plex Sans:** wider, so it fits fewer characters in the 84 px card footer and the 320 px rail.
- **Source Sans 3:** smaller x-height at 12–13 px.

**Why Fraunces for display**
- It makes a deliberate contrast with Inter. The teaching side of the product (lesson titles, archetype guides, the game result, review headings) gets an editorial, "considered" voice, while play stays instrument-like.
- It is about as far from the official brand's condensed italics as a heading face can be. That is the clearest way to "not imitate the brand".
- The optical-size axis keeps it crisp from 24 px to 40 px.
- It is used sparingly: never on the board during play, and never for numbers, so its quirks never touch a decision.

*Rejected display faces:*
- **Space Grotesk:** too close to generic developer tooling, and too similar to Inter to be worth a second file.
- **Bricolage Grotesque:** its expressive ink traps date quickly and compete with card art.
- **Any condensed or italic sports face** (Barlow Condensed and similar): it moves toward the official brand.

### 3.2 Scale

Compact density is designed at 1280×720. Roomy density applies at viewports of at least 1600 × 900 and is designed at 1920×1080. **12 px is the floor for any text.**

| Token | Compact | Roomy | Face, weight | Use |
|---|---|---|---|---|
| `--text-xs` | 12/16 | 13/18 | Inter 500 | Captions, zone labels, chip words, DON!! row labels |
| `--text-sm` | 13/18 | 14/20 | Inter 400 | Log lines, secondary labels, breakdown lines |
| `--text-md` | 14/20 | 15/22 | Inter 400–600 | Default UI, buttons, preview effect text |
| `--text-lg` | 16/24 | 17/26 | Inter 400 | Coach and explanation prose (reading length) |
| `--text-xl` | 20/28 | 22/30 | Inter 600 | Panel titles, the decision header at roomy density |
| `--text-2xl` | 24/32 | same | Fraunces 600 | Page sections, archetype names |
| `--text-3xl` | 32/40 | same | Fraunces 600 | Page titles, lesson titles |
| `--text-4xl` | 40/48 | same | Fraunces 600 | Game result, tutorial chapter |
| `--num-battle` | 28/32 | 36/40 | Inter 700, `tnum ss01` | Attacker and defender power in the battle panel |
| `--num-don` | 20/24 | 28/32 | Inter 700, `tnum ss01` | The active DON!! count in each cost area's header ("2 active"). It is the largest DON!! number on each side; the rested count is `--text-md` 600 and the DON!! deck count is caption weight (`board.md` §3.4; UX-R4) |
| `--num-hero` | 40 | same | Inter 700, `tnum` | Drill score, final Life totals |
| `--badge-power-size` | 13–15 (`clamp`, 0.17 × card width) | 21 | Inter 700, `tnum ss01` | Live power plate |
| `--badge-num-size` | 12–13 (0.15 × card width) | 19 | Inter 700, `tnum ss01` | Cost, DON!!, Counter, counts |

Prose (coach, guides, rules) is set at `--text-lg` with a 60–72 character measure. The rail at 1280 gives about 40–45 characters per line at 16 px, which is acceptable for short coach notes. Long explanations use the "tall" coach state or the review screen.

### 3.3 Numerals

- `--font-ui-features: 'tnum' 1` on the body, so every number aligns: log columns, counts, timers.
- `--font-num-features: 'tnum' 1, 'ss01' 1` on badges, the battle panel and counts on plates.
- Numbers right-align wherever they stack (battle panel, review tables). Thousands are not separated with commas, because the printed cards write "5000", and matching the card prevents a "5,000 vs 5000" moment.
- Negative values use the true minus sign U+2212 ("−1000"), which has the same width as the digits in Inter.

### 3.4 Loading

- `font-display: swap` for Inter, with the fallback stack `system-ui, -apple-system, 'Segoe UI', Roboto`. An `@font-face` fallback metric override (`size-adjust`, `ascent-override`) is tuned at M0 so the swap causes no measurable layout shift. Inter is preloaded.
- `font-display: optional` for Fraunces. If it is not ready on the first visit, headings render in the Georgia fallback and Fraunces is used once cached. That keeps the display face off the critical path.
- Budget: about 70 KB for Inter (Latin, variable) and 40 KB for Fraunces (Latin, `wght` 600 range), woff2. Fonts are not part of the 300 KB JS budget, but they count toward the 3 s first-playable target.

## 4. Space, radius, size

**Spacing** sits on a 4 px base: `--space-0-5` (2), `-1` (4), `-2` (8), `-3` (12), `-4` (16), `-5` (20), `-6` (24), `-8` (32), `-10` (40), `-12` (48), `-16` (64). The board uses its own gap tokens (`--board-gap` 8 / 12, `--board-margin` 16 / 24), because its geometry comes from the layout calculation, not from component padding (`board.md` §2.1).

**Radius:**
- `--radius-1` (4): badges and chips
- `--radius-2` (6): buttons and inputs
- `--radius-3` (8): panels and popovers
- `--radius-4` (12): dialogs and the preview dock
- `--radius-pill`
- `--card-radius` = 4.5% of card width

**Targets:**
- `--target-min` is 24 px (WCAG 2.5.8): nothing interactive is smaller.
- `--target-comfort` is 44 px for buttons and anything on touch.
- `--control-h` is 36 / 40 for compact and roomy buttons.
- `--control-h-primary` is 48 / 56 for End turn, Confirm and Skip.

**Rings** (review-1 C7). The focus ring keeps a 4 px offset, and on a card that is also legal or selected it stacks **outside** the legal ring, so the two never merge:

| Ring | Width | Distance out from the card edge |
|---|---|---|
| Legal (`--legal-ring`, solid, `--color-accent`, plus the corner glyph) | 3 px | 3–6 px (3 px offset) |
| Selection (`--select-ring`) | 3 px | 3–6 px, card raised 6 px |
| Focus gap (`--color-focus-gap`), on a plain card | 2 px | 4–6 px |
| Focus ring (`--color-focus`), on a plain card | 2 px | 6–8 px |
| Focus gap, on a legal or selected card | 2 px | 6–8 px |
| Focus ring, on a legal or selected card | 2 px | 8–10 px |

- **Hand neighbours.** At compact density the hand's legal ring uses a **2 px offset** (2–5 px out), so two lit neighbours 8 px apart keep a visible gap between their rings instead of reading as one band (UX-R48). A focused hand card is raised, so its outer focus ring never collides with a neighbour's ring.
- **Forced colours:** legal ring `ButtonText`, focus ring `Highlight`; both must stay distinguishable (`accessibility.md` §4.1).
- The cost area's active row, when it is a legal DON!! source, shows the same ring **plus the ◆ glyph** like every other legal element (UX-R45).

## 5. Elevation

Dark surfaces show elevation mostly by surface step, with shadows as support. Light surfaces rely on shadows.

| Token | Use |
|---|---|
| `--elev-0` | Flat chrome |
| `--elev-1` | Cards resting on the mat |
| `--elev-2` | Raised hand card, selected card, popovers |
| `--elev-3` | Preview dock, dialogs |
| `--elev-drag` | Card being dragged |

The z-order tokens run `--z-board` < `--z-card-raised` < `--z-arrow` < `--z-plate` < `--z-popover` < `--z-dock` < `--z-drag` < `--z-dialog` < `--z-toast`. The attack arrow sits above card faces but **below the plates and chips** (power, cost, Life and deck counts, status chips), so the arrow never crosses the number a decision depends on, and it ends at the ⌖ marker below the defender's power plate (UX-R13). It stays below popovers, so a popover on the target is never crossed by the arrow.

## 6. Motion

### 6.1 Durations and easings

| Token | 1× value | Use |
|---|---|---|
| `--dur-fast` | 120 ms | Hover, press, focus ring, number tick, chip fades |
| `--dur-base` | 200 ms | Popovers, rest/untap rotation, panel content swaps |
| `--dur-slow` | 320 ms | Coach expand, dock open |
| `--dur-highlight` | 120 ms | Pacing: a source lights up before it acts |
| `--dur-move` | 240 ms | Pacing: a card or token travels between zones |
| `--dur-dwell` | 400 ms | Pacing: the hold after a play, give or activate so a person can read it (C12) |
| `--dur-dwell-attack` | 600 ms | Pacing: the hold after an attack or battle result that needs no decision from you |
| `--dur-damage` | 360 ms | Pacing: Life card flip and travel |

| Easing | Curve | Use |
|---|---|---|
| `--ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | Most UI transitions; rotation |
| `--ease-enter` | `cubic-bezier(0, 0, 0.2, 1)` | Things appearing: popovers, the dock, a new log line |
| `--ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Things leaving: K.O. to trash, dismissals |
| `--ease-move` | `cubic-bezier(0.3, 0, 0.2, 1)` | Card travel: a short, decisive start and a soft landing |
| `--ease-linear` | `linear` | Progress bars only |

The pacing tokens are multiplied by 1/speed at runtime (Step, 0.5×, 1×, 2×, 4×; `board.md` §5.3). UI feedback durations never scale with game speed.

### 6.2 Reduced motion

`prefers-reduced-motion: reduce` is honoured by default. Settings offers "Motion: Match system / Reduced / Full", which sets `data-motion`. Under reduced motion:
- there is no travel, rotation, scaling or parallax: `--dur-move`, `--dur-damage`, `--dur-base` and `--dur-slow` are 0;
- cards appear in place with an opacity fade of up to `--dur-fast`;
- the rest state changes instantly, with the "Rested" chip fading in;
- **The dwells double, to 800 ms (`--dur-dwell`) and 1,200 ms (`--dur-dwell-attack`).** Without travel the eye has no motion to follow, so the board holds still longer instead. The opponent stays as easy to follow as it was (principle 10);
- the attack arrow appears whole, with no draw-on, and the thinking indicator becomes a static label;
- no motion is ever the only carrier of information: every move is also logged and announced.

## 7. Contrast (WCAG 2.2)

**Method.** `.cache/design/contrast.mjs` reads both colour blocks of `tokens.css`. It computes the WCAG 2.x contrast ratio, (L1 + 0.05) / (L2 + 0.05) using sRGB relative luminance, for every pair below, and exits non-zero on any failure. These rules apply:
- Every **text** pair must reach 4.5:1 (AA normal text), even where the text is large. That leaves headroom for the 12–13 px badge numerals.
- **Non-text** pairs (rings, arrows, tokens, control boundaries) must reach 3:1 (SC 1.4.11).
- Icons use the `-text` tokens, so they meet text contrast.
- Light-theme values fall back to dark where a token is theme-invariant (the plates).

**Result (2026-10-28):** 72 pairs checked, **0 failing**. The lowest text pair is 4.72:1: `--color-text-subtle` on `--color-mat-zone`, light theme. The lowest non-text pair is 3.34:1: rested DON!! on the zone fill, light theme.

**Not covered by this table, by design:**
- **Text on card art.** It never happens: all text on a card sits on an opaque plate.
- **Decorative lines** (`--color-mat-line`, `--color-line`).
- **The translucent glows.**
- **Disabled controls.** WCAG exempts them, but ours still use `--color-text-subtle`, which passes.
- **Text on scrims.** Dialogs sit on `--color-surface-2`, not on the scrim.

| Foreground | Background | Use | Min | Dark | Light |
|---|---|---|---:|---:|---:|
| `--color-text` | `--color-bg` | text on surface | 4.5:1 | 16.30 | 16.50 |
| `--color-text` | `--color-mat` | text on surface | 4.5:1 | 15.31 | 14.77 |
| `--color-text` | `--color-surface-1` | text on surface | 4.5:1 | 14.88 | 18.18 |
| `--color-text` | `--color-surface-2` | text on surface | 4.5:1 | 13.64 | 18.18 |
| `--color-text` | `--color-surface-3` | text on surface | 4.5:1 | 12.01 | 16.01 |
| `--color-text-muted` | `--color-bg` | text on surface | 4.5:1 | 9.54 | 7.43 |
| `--color-text-muted` | `--color-mat` | text on surface | 4.5:1 | 8.96 | 6.65 |
| `--color-text-muted` | `--color-surface-1` | text on surface | 4.5:1 | 8.71 | 8.18 |
| `--color-text-muted` | `--color-surface-2` | text on surface | 4.5:1 | 7.98 | 8.18 |
| `--color-text-muted` | `--color-surface-3` | text on surface | 4.5:1 | 7.03 | 7.21 |
| `--color-text-subtle` | `--color-bg` | text on surface | 4.5:1 | 7.30 | 5.80 |
| `--color-text-subtle` | `--color-mat` | text on surface | 4.5:1 | 6.86 | 5.19 |
| `--color-text-subtle` | `--color-surface-1` | text on surface | 4.5:1 | 6.66 | 6.39 |
| `--color-text-subtle` | `--color-surface-2` | text on surface | 4.5:1 | 6.11 | 6.39 |
| `--color-text-subtle` | `--color-surface-3` | text on surface | 4.5:1 | 5.38 | 5.63 |
| `--color-accent-text` | `--color-bg` | text on surface | 4.5:1 | 11.47 | 6.16 |
| `--color-accent-text` | `--color-mat` | text on surface | 4.5:1 | 10.77 | 5.52 |
| `--color-accent-text` | `--color-surface-1` | text on surface | 4.5:1 | 10.47 | 6.79 |
| `--color-accent-text` | `--color-surface-2` | text on surface | 4.5:1 | 9.59 | 6.79 |
| `--color-accent-text` | `--color-surface-3` | text on surface | 4.5:1 | 8.45 | 5.98 |
| `--color-opponent-text` | `--color-bg` | text on surface | 4.5:1 | 10.67 | 5.90 |
| `--color-opponent-text` | `--color-mat` | text on surface | 4.5:1 | 10.02 | 5.29 |
| `--color-opponent-text` | `--color-surface-1` | text on surface | 4.5:1 | 9.74 | 6.50 |
| `--color-opponent-text` | `--color-surface-2` | text on surface | 4.5:1 | 8.93 | 6.50 |
| `--color-opponent-text` | `--color-surface-3` | text on surface | 4.5:1 | 7.86 | 5.73 |
| `--color-danger-text` | `--color-bg` | text on surface | 4.5:1 | 8.89 | 6.15 |
| `--color-danger-text` | `--color-mat` | text on surface | 4.5:1 | 8.34 | 5.51 |
| `--color-danger-text` | `--color-surface-1` | text on surface | 4.5:1 | 8.11 | 6.78 |
| `--color-danger-text` | `--color-surface-2` | text on surface | 4.5:1 | 7.44 | 6.78 |
| `--color-danger-text` | `--color-surface-3` | text on surface | 4.5:1 | 6.55 | 5.97 |
| `--color-success-text` | `--color-bg` | text on surface | 4.5:1 | 11.47 | 6.17 |
| `--color-success-text` | `--color-mat` | text on surface | 4.5:1 | 10.77 | 5.53 |
| `--color-success-text` | `--color-surface-1` | text on surface | 4.5:1 | 10.47 | 6.80 |
| `--color-success-text` | `--color-surface-2` | text on surface | 4.5:1 | 9.60 | 6.80 |
| `--color-success-text` | `--color-surface-3` | text on surface | 4.5:1 | 8.45 | 5.99 |
| `--color-warning-text` | `--color-bg` | text on surface | 4.5:1 | 12.96 | 6.22 |
| `--color-warning-text` | `--color-mat` | text on surface | 4.5:1 | 12.17 | 5.57 |
| `--color-warning-text` | `--color-surface-1` | text on surface | 4.5:1 | 11.83 | 6.85 |
| `--color-warning-text` | `--color-surface-2` | text on surface | 4.5:1 | 10.85 | 6.85 |
| `--color-warning-text` | `--color-surface-3` | text on surface | 4.5:1 | 9.55 | 6.04 |
| `--color-text-muted` | `--color-mat-zone` | empty-zone label | 4.5:1 | 8.10 | 6.04 |
| `--color-text-subtle` | `--color-mat-zone` | empty-zone label | 4.5:1 | 6.20 | 4.72 |
| `--color-on-accent` | `--color-accent` | primary button, "You" tag, legal badge | 4.5:1 | 9.89 | 5.76 |
| `--color-on-accent` | `--color-accent-hover` | primary button hover | 4.5:1 | 11.81 | 7.58 |
| `--color-on-opponent` | `--color-opponent` | "Opponent" tag | 4.5:1 | 9.07 | 5.02 |
| `--color-on-attack` | `--color-attack` | "Attacking" chip, lethal banner | 4.5:1 | 7.13 | 5.48 |
| `--color-on-success` | `--color-success` | "Survives" chip | 4.5:1 | 10.03 | 5.33 |
| `--color-on-warning` | `--color-warning` | warning chip (low deck, 0 Life, not automated) | 4.5:1 | 11.58 | 11.58 |
| `--color-on-don` | `--color-don` | DON!! token count | 4.5:1 | 8.65 | 5.67 |
| `--color-plate-text` | `--color-plate` | card badge | 4.5:1 | 20.05 | 20.05 |
| `--color-plate-base` | `--color-plate` | card badge | 4.5:1 | 10.47 | 10.47 |
| `--color-plate-buff` | `--color-plate` | card badge | 4.5:1 | 12.58 | 12.58 |
| `--color-plate-debuff` | `--color-plate` | card badge | 4.5:1 | 10.08 | 10.08 |
| `--color-accent` | `--color-mat` | legal-move ring on the mat | 3:1 | 9.49 | 4.68 |
| `--color-accent` | `--color-surface-2` | legal ring / selected row in panels | 3:1 | 8.46 | 5.76 |
| `--color-opponent` | `--color-mat` | opponent action highlight | 3:1 | 8.89 | 4.08 |
| `--color-attack` | `--color-mat` | attack arrow | 3:1 | 6.60 | 4.46 |
| `--color-focus` | `--color-mat` | focus ring on the mat | 3:1 | 16.90 | 15.72 |
| `--color-focus` | `--color-surface-1` | focus ring in the rail | 3:1 | 16.43 | 19.34 |
| `--color-focus` | `--color-surface-2` | focus ring in the decision panel | 3:1 | 15.06 | 19.34 |
| `--color-focus` | `--color-focus-gap` | focus ring against its own gap (on card art) | 3:1 | 18.66 | 19.34 |
| `--color-line-strong` | `--color-surface-1` | secondary button / input boundary | 3:1 | 4.05 | 4.62 |
| `--color-line-strong` | `--color-surface-2` | secondary button / input boundary | 3:1 | 3.71 | 4.62 |
| `--color-line-strong` | `--color-mat` | control boundary on the mat | 3:1 | 4.16 | 3.75 |
| `--color-don` | `--color-mat` | DON!! token on the mat | 3:1 | 8.39 | 4.61 |
| `--color-don-rested` | `--color-mat` | rested DON!! token on the mat | 3:1 | 4.77 | 3.68 |
| `--color-don` | `--color-mat-zone` | DON!! token in the cost-area zone | 3:1 | 7.58 | 4.19 |
| `--color-don-rested` | `--color-mat-zone` | rested DON!! token in the cost-area zone | 3:1 | 4.31 | 3.34 |
| `--color-accent` | `--color-mat-zone` | legal drop target ring on an empty slot | 3:1 | 8.58 | 4.25 |
| `--color-success-text` | `--color-surface-2` | result icon (icons use the -text tokens) | 3:1 | 9.60 | 6.80 |
| `--color-warning-text` | `--color-surface-2` | warning icon (icons use the -text tokens) | 3:1 | 10.85 | 6.85 |
| `--color-danger-text` | `--color-surface-2` | danger icon | 3:1 | 7.44 | 6.78 |

72 pairs checked; 0 failing. Lowest text pair 4.72:1; lowest non-text pair 3.34:1.

## 8. Tokens file

`tokens.css` is grouped as follows:
- colour, dark (default `:root`) and light (`:root[data-theme='light']`);
- type;
- space, radius and size;
- elevation and z-order;
- motion, with the reduced-motion overrides;
- roomy density (`@media (min-width: 1600px) and (min-height: 900px)`);
- a `--color-surface` alias for the M0 placeholder `base.css`.

`--card-w` has a default per density. The board overrides it at runtime with the size from the layout algorithm (`board.md` §2.1), and every badge size derives from it.

## 9. Checks for reviewers

1. **Contrast:** `node .cache/design/contrast.mjs` exits 0 (after M0, `npm run build` does).
2. **Colour-blind and greyscale:** screenshots in deuteranopia, protanopia and greyscale simulation keep every state distinguishable (§2.5).
3. **Numbers:** every number on the board is tabular, at least 12 px (colour-band initials included), and on a plate or flat surface. Numbers are never truncated: log lines and panel breakdowns wrap rather than ellipsise a numeral (UX-R20).
4. **Brand:** no red-black-gold scheme, condensed italic display, pirate motif or printed DON!! or card-back imagery.
5. **Motion:** with reduced motion on, nothing travels, rotates or scales, and dwell is at least 800 ms (1,200 ms on attacks and results).
6. **Hierarchy:** on each side the active DON!! count is the largest DON!! number; the DON!! deck count is caption weight.
7. **Perspective:** battle results are styled by whose side the player is on (§2.3), and orange appears only on the opponent's cards and tags.
