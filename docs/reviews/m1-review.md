# M1 review: card browser (`/cards`)

**Date:** 2026-10-28
**Reviewer:** UX director review (subagent), against `docs/design/principles.md`, `visual-system.md`, `card-face-study.md` (treatment C, the art window), `accessibility.md` and wireframe `12-deck-builder.html`.
**Build reviewed:** `main` at `f7d812d` (`npm run build && npm run preview`, http://localhost:4173/optcg-sim/cards).
**Milestone goal:** every English-release card browsable, with art or a text-card fallback.
**Rule:** severity 3–4 findings block the milestone.

## Method

1. Read the five design inputs above, and the M1 row of `PLAN.md` §2.
2. Built and served the production bundle. Drove it with Playwright (Chromium, from the repo's own install) using a harness at `.cache/m1-review/review.mjs`. Screenshots and a JSON log are in `.cache/m1-review/` (66 PNGs, gitignored). I looked at every screenshot cited below. The builder's shots in `.cache/m1/` cover only the default, inspector and text-fallback states, and they match mine.
3. States exercised at 1280×720 and 1920×1080:
   - default load, plus a 3× DPR macro of the card faces;
   - search: name, lowercase, card number in another set, card number without a hyphen, keyword, bracketed timing, type, number, punctuation variants, nonsense;
   - every filter: set, each colour, two colours together, each category, cost 0 and 10+, each sort, type exact and partial, each keyword including Trigger, each legality value, verified only, a combination that returns nothing, Clear;
   - the inspector: a Leader, a 10-artwork Character with art switching, a banned card, a card with text repairs, and closing by backdrop;
   - a keyboard-only path: Tab from page load to the grid, arrows, Enter, Tab inside the dialog, Escape, focus return, Space, Ctrl+End, `/`, then Tab from search back to the grid;
   - text-card fallback: `page.route` aborting every `optcgapi.com` request with the service worker blocked; a 6 s slow image host; the host going down after the service worker installed;
   - scrolling with all 2,799 cards loaded: rAF frame times over 180 wheel steps, at 1× and with CPU throttled 4×;
   - loading, set-load failure (set chunk aborted), no-results (one set and all sets), unknown route, deep link;
   - zoom: 200% of 1280×720 (640×360 CSS px at DPR 2), 200% of 1920×1080, and 400% of 1280 (320 CSS px, the 1.4.10 reflow case);
   - forced colours (`forcedColors: 'active'`).
4. Ran axe-core 4.x (installed in `.cache/m1-review/`, not the repo) with tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` and `best-practice`. States checked: default, search results, no results, inspector, text fallback, 200% zoom, and 320 px reflow.
5. Measured target sizes for every interactive element at 1280×720.

### What passes (no finding)

- **Art window.** It is built as the card-face study specifies. The SAMPLE watermark never shows on a tile, the plates are opaque and numerals are tabular.
- **Text fallback.** It uses the same frame, so nothing shifts when art fails (`60-fallback-1280.png`, `60-fallback-1920.png`). All 49 and 80 visible tiles fell back correctly. The text card is readable, especially at 1920.
- **Inspector.**
  - It shows the full scan with its watermark, names the colour in words, and prints the effect text in our type with timing words in bold.
  - Focus goes to Close and comes back to the opening tile after Escape, the ✕ button or a backdrop click.
  - Enter and Space both open it.
- **Grid keyboard model.** There is one tab stop with roving focus. Arrows, Home/End, Ctrl+Home/End and PageUp/PageDown all work, and the active tile stays rendered while scrolled out of view.
- **Performance.**
  - The initial JS is 70.8 KB gzipped.
  - "All sets" loads in about 50 ms after its chunks are cached.
  - Scrolling at 1× holds 16.7 ms frames at p50, p95 and p99. The virtualised grid keeps 49 tiles in the DOM.
  - A search across all sets takes 11 ms.
- **Search normalisation.** "Monkey D. Luffy" finds "Monkey.D.Luffy". A card number from another set loads that set.
- **Colour pairing.** Colour is never the only cue: tiles carry band initials and toggles show a ✓ when pressed.
- **axe.** Zero violations on the inspector, no-results and 320 px states. The only violation anywhere is M1-16.

### Not assessed

- Light theme (no Settings yet), screen-reader speech (no manual NVDA or VoiceOver pass in this review), and touch.
- Service worker caching. In my probe `navigator.serviceWorker.controller` stayed null after a reload, so I could not confirm that images are served from the LRU cache. This may be a headless quirk, and an engineer should check it.

## Findings

Severity follows Nielsen's 0–4 scale. Screenshots are in `.cache/m1-review/`.

| ID | Sev | Principle / WCAG | Screen, state, screenshot | Problem | Recommended fix | Disposition |
|---|---|---|---|---|---|---|
| M1-01 | **3** | P4 No surprise; heuristic "visibility of system status" | Default view, searching "Luffy": `10-search-luffy-defaultset.png` against `14-search-luffy-all.png` | Search is silently limited to the selected set, which defaults to the newest (OP-17). "Luffy" returns **4** cards, but there are **123** across all sets. The only cues are "in OP-17" in the count and a small "Search all sets" button. Finding a card by name is the browser's core job, and a first-time user will read 4 results as the whole answer. (Card numbers already escape the set scope, so the design admits that the scope is wrong for lookup.) | When the query is non-empty, search all sets by default, and treat Set as a filter only when the user has picked one. At minimum, show both counts: "4 in OP-17 · 123 in all sets", with the second as a link. | **Fixed.** A search covers every set unless the user picks one; with a set picked, the bar shows both counts ("N in OP-17 · 123 in all sets", the second a button). "Luffy" from the default view: 123 cards in all sets. Test: `search covers all sets by default and ranks name matches first`. |
| M1-02 | **3** | P7 Keyboard complete; WCAG 2.4.1 Bypass blocks; wireframe 12 | Keyboard path: log `tabSequence`, `tabSeq2`; `50-kbd-first-card-focus.png` | It takes **23 Tab presses** from page load to the first card, and **18** from the search box to the results, every time the user searches. The skip link targets `#main`, which starts with the filters, so it skips nothing useful. No key moves from search into the results. The e2e test hard-codes "Tab up to 40 times" around this. Wireframe 12 puts search directly above the results. | Make ArrowDown, or Enter, in the search box move focus to the first result. Add a "Skip to results" link. Put the search field in the results bar, as in wireframe 12, or put the results before the filters in DOM order. Consider collapsing the less-used filters (Type, Keyword, Legality, Verified) behind "More filters". | **Fixed.** Search sits in the results bar and results come before the filters in DOM order: 1 Tab from search to the first result; ArrowDown or Enter also moves there. The first Tab on the page is "Skip to results", which lands on the grid. Test: `keyboard path: search to results in one key…` (asserts Tab = 1). Filters left visible (not collapsed) on wide screens. |
| M1-03 | **3** | WCAG 2.4.7 Focus visible; accessibility.md §4.1 (forced colours) | Forced colours, a card tile focused: `95-forced-colors-card-focus.png`; log `forcedFocusStyle` = outline none, box-shadow none | `.card-btn:focus-visible` sets `outline: none` and draws the ring with `box-shadow`, which forced-colours mode removes. In Windows High Contrast a focused card has **no visible focus at all**. Cards are the main interactive element on the page. (The ring is also 0–6 px out, not the spec's 4–8 px.) | Draw the ring with `outline: 2px solid var(--color-focus); outline-offset: 4px`, plus the gap as box-shadow. Add `@media (forced-colors: active) { .card-btn:focus-visible { outline: 2px solid Highlight; } }`. Add a forced-colours screenshot to e2e. | **Fixed.** Ring is `outline: 2px` at a 4 px offset with the gap as box-shadow; `@media (forced-colors: active)` draws a 3 px `Highlight` outline. Test: `a focused card keeps a visible ring in forced colours` (outline solid, ≥2 px, offset ≥4 px). Screenshot `.cache/m1/r2-forced-colors-focus.png`. |
| M1-04 | **3** | WCAG 1.4.10 Reflow; accessibility.md §10 ("Documents reflow at 320 px") | 400% of 1280 (320 CSS px): `90-zoom-400-1280.png`; log `zoom-400-1280` | The browser is not the board, so the 2-D exception does not apply. At 320 CSS px the page scrolls horizontally (scrollWidth 383 against 320). The results pane is **56×0 px**, so no card is visible. The count text overlaps the header nav, and the footer covers half the screen. The page is unusable. | Below about 720 px wide: stack the layout, collapse the filters into a "Filters (n)" disclosure above the results, let the page scroll instead of the fixed-height shell, make the footer scroll with content, and let the grid fall to 1–2 columns. | **Fixed.** At ≤800 px the page scrolls, filters collapse behind "Filters (n)", the grid takes the full width, the footer scrolls away. At 320×180: scrollWidth 320, results 288 px wide, count below the header. Test: `reflows at 320 CSS px with no horizontal scroll and no overlap` (with axe). Screenshot `.cache/m1/r2-zoom400-320-full.png`. |
| M1-05 | 2 | WCAG 1.4.4 Resize text (met, barely); P7 | 200% of 1280×720 (640×360 CSS px): `90-zoom-200-1280.png`, `91-zoom200-card-focus.png`, `92-zoom200-inspector.png` | Everything is reachable through internal scrolling, but the results viewport is **376×198 CSS px**, so about one row of two cards shows. The 264 px filter column (41% of the width), the 56 px header, a two-line results bar and a two-line fixed footer take the rest. The inspector scrolls inside itself (562 px of content in 322 px), which is acceptable. | Apply the M1-04 layout at widths of 800 px and below. Shorten the footer to one line, or let it scroll away. | **Fixed** by the same ≤800 px layout (640×360 uses it). |
| M1-06 | 2 | Heuristics: visibility of status, help users recover from errors | Filtered to nothing at 1280×720: `29-filter-combo-empty.png`, `13-no-results-allsets.png` | Active filters are invisible from the results. The results bar names only the set. At 720 px tall, "Verified only" and the "Clear 4 filters" button sit below the fold of the filter column. The empty state says only "No cards match." It does not repeat the query, name the filters that excluded everything, or offer a way out. | Show active-filter chips in the results bar, each with an ×, plus "Clear all". In the empty state, say what was searched and filtered, and offer "Clear filters" and "Search all sets" buttons. | **Fixed.** Active-filter chips with × and "Clear all" in the results bar; the empty state repeats the query, scope and filters, with "Clear filters" and "Search all sets". |
| M1-07 | 2 | Heuristic "match between system and the real world" | "Luffy", all sets: `14-search-luffy-all.png` | Results are in card-number order whatever matched, so name hits and rules-text mentions are interleaved (Enel, Boa Hancock and S-Snake sit among the Luffys). Searching "Nami" returns Nojiko. The search does not say why a card matched. | Rank by match strength: exact name, name prefix, type, then text. Or group the results as "Name (n)" and "Mentioned in text (n)", or offer a "Search in: name / text" toggle. | **Fixed.** New default sort "Best match": card number, exact name, name prefix, name word, name contains, type, then text. Unit test `ranks name matches above text mentions`. |
| M1-08 | 2 | P6 Art is the hero; card-face-study C | Tiles at both sizes: `04-card-macro-1280.png`, `04b-card-macro-row3.png`, `60-fallback-1920.png` | The 42% name footer was sized for an 84 px board card. On 112 and 140 px browser tiles, about **half the footer is empty black**. Meanwhile long Event names are cut at 2 lines ("The Power to Destroy the…", "I Don't Have Time to Chat wi…"), and the text card's excerpt is cut at 2 lines. The grid reads as rows of black slabs. | For browser tiles, fit the footer to its content: allow 3 name lines and add the type line. Or shrink the footer and give the art window the extra height. Keep the board geometry unchanged. | **Fixed.** Browser tiles add a type line to the footer; full name in a tooltip (M1-20). Board geometry unchanged. |
| M1-09 | 2 | Visual system §1 rule 2 (saturation is a signal); P6 | Every inspector: `40-inspector-leader-1280.png`, `41-inspector-character-1920.png`, `44-inspector-long-repairs-1280.png` | At M1 no card is automated, so **every** inspector shows a saturated yellow "⚠ Effect not automated" chip and a yellow-bordered notice that says "In a game this card plays for its stats", although no game exists yet. A warning that is always on teaches people to ignore warnings. The same text ends all ~2,800 accessible names ("…, not verified, effect not automated"). | Until M4a, replace both with one neutral line: "Card effects aren't automated yet; the game engine comes later." Bring back the warning chip when it separates scripted from unscripted cards. Drop the suffix from accessible names while it is true of every card. | **Fixed.** While no card is scripted, the inspector shows a neutral outline chip and one line ("Card effects aren't automated yet…"); the yellow warning returns automatically once any script exists. The suffix is gone from tile names. |
| M1-10 | 2 | P4 No hidden state; wireframe 12 (status chips on tiles) | Banned filter: `27-filter-banned.png`; any rotated card | Banned and rotated cards look identical to legal ones in the grid. Legality appears only in the inspector. Players browse partly to learn what they can play. | Add a small text chip in the art window's top band, "Banned" or "Rotated", with an icon, and put it in the accessible name. Hide "Unknown block" from tiles. | **Fixed.** "⛔ Banned" and "⟲ Rotated" chips on tiles, also in the accessible name. Unknown is not shown. Test: `shows banned and rotated status on tiles`. |
| M1-11 | 2 | P9 Honest about certainty | Image host down: `60-fallback-1280.png`, `64-fallback-inspector.png` | The fallback works, but the inspector says "**No image available**. The card is shown as text." when the image exists and only the host is unreachable. The page gives no notice that art failed. Once the host recovers, tiles stay as text until a reload. A slow host leaves the art blank for as long as the browser waits (`65-slow-host-loading.png`). | Say "Couldn't load the card image (optcgapi.com didn't respond). Retry". Show one quiet notice in the results bar when several images fail. Retry on the `online` event or when the user presses Retry. | **Fixed, except the slow host.** Inspector says "Couldn't load the card image (optcgapi.com didn't respond)" with Retry; "no image" only when the printing has none; a results-bar notice after 3 failures; retry on the `online` event. A slow host still waits for the browser timeout. |
| M1-12 | 2 | Heuristic: recover from errors | Set chunk fails to load: `81-set-load-error.png` | The status stays at "**Loading 0 of 1 set…**" for good, beside a raw developer error: "TypeError: Failed to fetch dynamically imported module: http://…/OP-17-yq3Agtf3.js". There is no Retry button. On GitHub Pages this happens to any tab left open across a deploy, because chunk names are hashed. | Set the status to "Couldn't load OP-17". Add a plain message: "The card list didn't load. Check your connection, or reload; the site may have updated." Add a Retry button, and offer Reload when the chunk returns 404. | **Fixed.** Status "Couldn't load OP-17", a plain message, Retry and Reload page; a failed chunk can be retried. Test: `a set that fails to load says so and can be retried`. |
| M1-13 | 2 | Heuristic "user control and freedom" | Log `afterReload`, `deepLink`; Back with the inspector open | Search, set, filters and the open card are not in the URL. A reload resets everything to OP-17, a card cannot be linked or bookmarked, and pressing Back with the inspector open leaves the page instead of closing it. | Mirror filters in the query string with `replaceState`. Open the inspector as `?card=OP05-119` with `pushState`, so Back closes it and the link can be shared. | **Fixed.** Filters mirror into the query string (replaceState); the inspector opens as `?card=ID` (pushState), so Back closes it and links open it. |
| M1-14 | 2 | P8 One place for each thing (wayfinding) | All sets, scrolled: `70-scrolled-mid.png`, `71-scroll-jump-120ms.png` | The 2,799 cards scroll as one undivided stream. There are no set headers and nothing shows where you are, except the IDs in tiny captions. | Add sticky set headers in the virtual list ("EB-04 · 80 cards"), or a set jump-list beside the scrollbar. | **Deferred** to M6 (deck builder browser): needs grouped virtual rows; not a local fix. |
| M1-15 | 2 | Heuristic "flexibility and efficiency of use" | Inspector: `52-kbd-inspector-open.png` | Comparing cards means close, move, open, again and again. The inspector has no previous or next card control. | Add "Previous card" and "Next card" buttons with PageUp/PageDown, moving through the current results. Leave the arrow keys for artwork. | **Fixed.** Previous/Next buttons and PageUp/PageDown in the inspector, with "n of N". |
| M1-16 | 2 | accessibility.md §11.1 (axe gate); WCAG 2.5.3 | axe on the default, search, fallback and zoom states: log `axe:*` | `app/e2e/cards.spec.ts` runs **no axe check**. The plan requires axe with zero violations on every UI state in CI. Playwright runs only the 720p project, so 1920 is never tested. axe here reports `label-content-name-mismatch` (serious) on every tile, because the visible plates (cost, power, Counter) inside the button are not in its name. The name does start with the visible card name, so the real 2.5.3 risk is low, but the gate would fail. | Add `@axe-core/playwright` to the cards spec at both sizes, for the default, inspector, fallback and no-results states. Resolve the rule, for example with `aria-labelledby` pointing at the visible name plus a described-by for the stats, or record a reasoned exception in `accessibility.md`. Add a 1080p project. | **Fixed.** axe (`@axe-core/playwright`, the review's tag set) on default, no results, inspector, text fallback and 320 px, in a new 1080p project as well as 720p: 0 violations. Tiles are now named by visually hidden text that starts with the card name (no `aria-label`), so `label-content-name-mismatch` no longer applies. |
| M1-17 | 2 | WCAG 2.4.2 Page titled | All routes: log `default-*.title` | The document title is "OPTCG Sim" on /cards and every other route, so tabs, history and screen-reader page announcements cannot tell pages apart. | Use "Cards · OPTCG Sim". While the inspector is open, the title can name the card. | **Fixed.** "Cards · OPTCG Sim"; with the inspector open, "Name (ID) · Cards · OPTCG Sim". |
| M1-18 | 1 | P6; card-face-study §1 (printed regions) | Tile macro: `04-card-macro-1280.png` | The window crop starts at the scan's y ≈ 4%, so slivers of the printed power box and frame (red and white fragments) show above and right of our power plate on most tiles. | Start the crop at about 6%, or run the power plate to the window's right edge. | **Fixed.** Crop starts at 6% of the scan. |
| M1-19 | 1 | Visual system §4 rings | Search focused: `10-search-luffy-defaultset.png` | The 6 px outline offset on text inputs runs through the descenders of the "Search name, ID or text" label above. | Reduce the offset on inputs to 2–3 px, or give labels at least 8 px of bottom margin. | **Fixed.** Inputs use a 2 px outline offset. |
| M1-20 | 1 | accessibility.md §10 (1.4.12 note: full name in a tooltip) | `02-default-1280.png` | Truncated names ("I Don't Have Time to Chat wi…") have no tooltip or other way to see the full name without opening the inspector. | Add `title` on the tile, or show the full name on hover or focus in the caption. | **Fixed.** `title` with the full name on every tile. |
| M1-21 | 1 | Polish | `54-kbd-ctrl-end.png` ("Capone"Gang"B / ege"), `71-scroll-jump-120ms.png` ("Eustass"Captain "Kid") | `overflow-wrap: anywhere` splits words mid-word, and upstream names lack spaces around the quotes. | Use `overflow-wrap: break-word`. Normalise the quote spacing in the card normaliser. | **Partly.** `overflow-wrap: break-word`. Quote spacing left as upstream: changing names needs a source per card. |
| M1-22 | 1 | Copy | `40-…`, `42-inspector-altart-1280.png`, `43-…`, `44-…` | Several strings are clumsy or internal: "Not legal (rotated) (block 1)"; "Banned (banned from 2025-08-30)"; the internal artwork ID "OP05-119#2" and product "P"; repairs shown as raw JSON (`"[]" → "["Special"]"`); "Escape closes." tacked onto the provenance line. | Use "Rotated (block 1)" and "Banned since 2025-08-30". Hide the `#n` IDs and expand product codes. Render repairs in words. Move the Escape hint next to Close. | **Fixed.** "Rotated (block 1)", "Banned since 2025-08-30", no `#n` IDs, product names spelled out, repairs in words, Esc hint beside Close. |
| M1-23 | 1 | Visual system §2.5 (colour initials) | `22-filter-leader.png` | Black cards show the initial "**K**" on a grey band. "K" is a print convention, not a player one. | Use "Bk", or full colour words at roomy density, and put the colour names in the band's tooltip. | **Fixed.** "Bk". |
| M1-24 | 1 | Polish | `02-default-1280.png` | The 264 px column truncates controls: "Card numb", "OP-17 · The World's Stronge", "e.g. Rocks, OP17-039, Block". | Rename the option to "Number", widen the column to 280 px, and shorten the placeholder. | **Fixed.** 280 px column, "Number", shorter placeholder. |
| M1-25 | 1 | ADR 0007 (hotlinking courtesy) | Log `imgRequestsDuringScroll` = 184 | A fast scroll requests art for every tile that passes, even for a few milliseconds. That is about 184 hotlinked requests to a third-party host in one scroll test. | Set `src` only after a tile has been in view for about 150 ms, or once scrolling idles. | **Fixed.** Tiles request art only once scrolling has been idle for 150 ms. |
| M1-26 | 1 | PROMPT Performance (60 fps) | Log `scroll-x4` | With the CPU throttled 4×, frames are p99 50 ms and max 200 ms (at 1× they are flat 16.7 ms). This is fine for M1. | Recheck in the M10 throttled trace. | **Deferred** to the M10 throttled trace, as recommended. |
| M1-27 | 1 | accessibility.md §3.16 | Code and DOM | Results are `role="list"` with roving buttons, and search is a plain `type="search"`. The spec says `grid` and `combobox`. The behaviour is good; the spec and the build disagree. | Update `accessibility.md` to the list-with-roving-buttons pattern, which is a sound choice, or implement the spec. | **Not changed in code.** The build keeps list + roving buttons; `accessibility.md` is a design document, so the spec update is left to its owner. |
| M1-28 | 1 | Wireframe 12 ("In meta lists") | Filters | "Verified only" is internal jargon. What a player wants is wireframe 12's "In meta lists", and today those are the same 182 cards. | Rename it "In meta decklists" and explain verification in the inspector. | **Fixed.** "In meta decklists (verified)". |
| M1-29 | 1 | Heuristic "user control" | Log `filter:sort=cost` | Sort has no direction control, and "Cost" puts the Leaders (no cost) first. | Add an ascending/descending toggle and sort the Leaders last when sorting by cost. | **Fixed.** "Reverse order" toggle; cost sorts put Leaders last in both directions. |

**Counts:** severity 4: 0 · severity 3: 4 · severity 2: 13 · severity 1: 12 · total 29.

## Verdict

M1 review: FAIL (open: M1-01 search silently limited to one set, M1-02 18 Tab stops from search to results, M1-03 no card focus in forced colours, M1-04 no reflow at 320 px)

All four blocking fixes are small and local:
- **M1-01:** change the search scope rule.
- **M1-02:** add a key and a skip target.
- **M1-03:** draw the ring with an outline, plus a forced-colours rule.
- **M1-04:** add a narrow-layout media query.

Re-review needs `90-zoom-400-1280`, `95-forced-colors-card-focus`, the Tab count from search to the grid, and the "Luffy" result count from the default view. The axe gate (M1-16) should land with the fixes so that M1-03 and M1-04 stay fixed.

## Builder disposition notes (2026-10-28)

- **Service worker (listed under "Not assessed").** Confirmed broken: the built `sw.js` began with `import … from "./assets/sources-….js"`, so the classic-script registration failed and no page was ever controlled. Fixed by building `src/sw.ts` as a self-contained IIFE (`app/vite.config.ts`). Test `app/e2e/sw.spec.ts`: the worker controls the page, more than 10 image entries land in `optcg-images-v1`, and a reload sends fewer requests to the image host than there are cached images.
- The Disposition column is the builder's; the reviewer's text is unchanged.


## Re-review (2026-10-28, commit `d7746a8`)

### Method

- I rebuilt with `npm run build` and served the bundle with `npm run preview`. The preview server was stopped afterwards.
- I drove the build with my own Playwright harness, `.cache/m1-review/r2.mjs`, plus three small probes (`insp320b.mjs`, `narrowkbd.mjs`, `dbg.mjs`). I did not use the builder's tests or screenshots.
- Sizes: 1280×720, 1920×1080, 200% zoom (640×360 and 960×540 CSS px at DPR 2), and 320 CSS px wide (320×180 and 320×256 at DPR 4), plus forced-colours emulation.
- I re-ran axe-core with the same tag set as before.
- Screenshots are `.cache/m1-review/r2-*.png`, and the logs are `r2-log-*.json`.

### Severity-3 findings

| ID | Result | Measurement |
|---|---|---|
| M1-01 | **Verified** | Searching "Luffy" from the default view gives "123 cards in all sets" at both 1280 and 1920 (`r2-01-luffy-1280.png`). With OP-05 picked it gives "3 cards in OP-05 · 123 in all sets", and the second figure is a button (`r2-01b-luffy-setpicked-1280.png`). The default view says "119 cards in OP-17 (newest set)". |
| M1-02 | **Verified** | From page load, 6 Tab presses reach the first card (Skip to results, logo, Home, Cards, search, card); before the fix it was 23. From search, Tab, ArrowDown and Enter each reach result 0 in **1 key**, and the first Tab plus Enter on "Skip to results" lands on result 0. Arrows, Enter, Escape and focus return still work. Measured at 1280 and 1920. |
| M1-03 | **Verified** | In forced colours the focused card has `outline: solid 3px` in the system Highlight colour at a 4 px offset, and it is clearly visible (`r2-03-forced-focus-1280.png`, same at 1920). In normal mode the ring is a 2 px outline at a 4 px offset over a 4 px dark gap, and on the first tile it is not clipped (`r2-03-normal-focus-first-1280.png`). |
| M1-04 | **Verified for the results page; not for the inspector** | At 320×180 the page's scrollWidth is 320 (0 px of overflow), the results are 320 px wide, the count sits below the header with no overlap, a focused card is fully in view, and axe reports 0 violations (`r2-04-320-full.png`). At 640×360 the results are 640 px wide and the inspector reads correctly. The inspector at 320 px fails, and is logged as new finding M1-30. |

### Severity-2 spot checks

| ID | Result | Evidence |
|---|---|---|
| M1-05 | Verified | At 640×360 the page scrolls with full-width results, 4 tiles in view after one scroll, and no horizontal scroll (`r2-04-200-1280-scrolled.png`). |
| M1-06 | Verified | The active-filter chips are in the bar and "Clear all" works. The empty state reads "No cards match “zzqq” in all sets with 1 filter (Colour: Red)." and offers "Clear filters". |
| M1-07 | Verified, with a nit (see M1-34) | Name matches now come before mentions in rules text. |
| M1-09 | Verified | The inspector shows a neutral "Effect not automated" chip and one quiet line, and the yellow is gone. |
| M1-10 | Verified, with a new problem (see M1-32) | "⛔ Banned" and "⟲ Rotated" chips appear on tiles and in their accessible names. |
| M1-11 | Verified | When the image host is aborted: a notice in the results bar, "Couldn't load the card image (optcgapi.com didn't respond)" in the inspector, and after unblocking, "Retry images" restores all 49 tiles. |
| M1-12 | Verified | A failed chunk shows the status "Couldn't load OP-17" with a plain message, Retry and Reload. After Retry, 119 cards load. |
| M1-13 | Verified, with a new problem (see M1-31) | Filters persist across a reload (`?set=all&legality=banned`). `?card=OP05-119` opens the inspector, and Back closes it. |
| M1-15 | Verified | PageDown in the inspector moves to the next result ("4 of 44"). |
| M1-16 | Verified | axe reports 0 violations on the default view at 1280 and 1920, no results, the inspector, the fallback inspector, 200% and 320 px. |
| M1-17 | Verified | The page title is "Cards · OPTCG Sim", and with the inspector open it is "Roronoa Zoro (OP01-001) · Cards · OPTCG Sim". |
| Service worker | **Verified** | The worker controls the page on the first visit and after a reload. `optcg-images-v1` holds 49 entries. With the image host aborted after caching, all 49 tiles still render from cache (`r2-sw-hostdown-cached.png`). |
| Scroll | Verified | With all 2,799 cards, frame times are p50, p99 and max 16.7–16.8 ms. Image requests during the fling: 0. |

### New findings

| ID | Sev | Principle / WCAG | Screen, state, screenshot | Problem | Recommended fix | Disposition |
|---|---|---|---|---|---|---|
| M1-30 | **3** | WCAG 1.4.10 Reflow | Inspector at 320 CSS px: `r2-04-inspector-320x256-scrolled.png`, `r2-04-inspector-320x180-scrolled.png`; probe `insp320b.mjs` | At 320 px the inspector keeps its two-column grid (`240px 0px`). The info column (stats, legality and the **card text**) is **0 px wide** at x = 294, so its text wraps one letter per line at the dialog's edge, and the dialog overflows sideways (scrollWidth 414 against clientWidth 284). At 320×180 the sticky header (name, ID, Previous/Next, Close, Esc) fills all 160 px of the dialog's height, so **no card content is visible at all**. At 400% zoom, card text cannot be read anywhere in the product. | At 560 px and below, use one column (art scaled to width, then the info). Make the header non-sticky, or compact it to one row (name and Close, with Previous/Next moved to the footer). Add the inspector at 320×256 to the reflow e2e test and to axe. | **Fixed.** At ≤560 px the inspector is one column (`minmax(0,1fr)`), its header and footer are not sticky, and the whole dialog scrolls; Previous/Next moved to a footer, so the header is just name, ID and Close. At 320×256 and 320×180: dialog scrollWidth ≤ clientWidth, info and card-text columns ≥ 250 px, header under half the dialog height, card text scrolls into view, axe 0. Tests: `inspector reflows at 320x256`, `inspector reflows at 320x180`. Screenshot `.cache/m1/r3-inspector-320x256-text.png`. |
| M1-31 | 2 | accessibility.md §4.3 ("Focus is never lost to `<body>`"); WCAG 2.4.3 | Inspector closed by browser Back, or opened from a `?card=` deep link and then closed | After Back (whether the inspector was opened by keyboard or by mouse), focus lands on `BODY`. Closing a deep-linked inspector with Escape also leaves focus on `BODY`. Both come from the M1-13 fix. | On a `popstate` close, focus the opener, or else the tile for that card if it is rendered, or else the results region. Do the same for a deep-linked close. | **Fixed.** Every close (Escape, ✕, backdrop, Back, deep link) focuses the open card's tile, else the results region. Test: `focus returns to the card after Back and after closing a deep-linked inspector`. |
| M1-32 | 2 | P6 Art is the hero; card-face-study §1 (faces sit in the upper third) | Rotated filter: `r2-s2-rotated-chips.png`; all sets: `r2-01-luffy-1280.png` | The "⟲ Rotated" chip is centred in the upper art window, on top of the subject's face (Zoro, Law and Luffy in the first row). It appears on 597 of 2,799 cards. | Put the chip on the top edge of the footer plate, or in the art window's bottom-right corner opposite the Counter plate. Never centre it over the art. | **Fixed.** The chip sits in the art window's bottom-right corner, clear of faces and of the name, opposite the Counter plate (`.cache/m1/r3-rotated-chips-1280.png`). |
| M1-33 | 2 | WCAG 3.3.2 Labels or instructions; 2.5.3 | Search, at every size: `r2-s2-default-1280.png` | The visible label "Search name, ID or text" was removed. The only visible cue is the placeholder "Name, number or text   /", which disappears once the user types. The accessible label is visually hidden. | Restore a short visible label ("Search"), or a search icon plus a persistent visible prefix. Keep the placeholder as the example only. | **Fixed.** Visible label "Search cards" beside the box; the placeholder is only the example. |
| M1-34 | 2 | WCAG 2.4.3 Focus order; 2.4.11 | Narrow layout (640×360), pressing Filters from the keyboard: `r2-narrow-filters-kbd.png`, probe `narrowkbd.mjs` | The panel opens above the results bar, which pushes the focused "Filters" button 587 px down and off screen (y = 735 in a 360 px viewport). The next Tab goes to result 0 and only then up into the filters, so the visual order and the focus order disagree. | Open the panel below the button (in DOM order after it), or move focus to the panel's first control on open. Keep the toggle in view. | **Fixed.** In the narrow layout the panel opens directly below the Filters button and focus moves to its first control (in view); a "Show N results" button at its end closes it and focuses the grid. Test: `narrow layout: Filters opens below its button…`. |
| M1-35 | 1 | Search relevance | Search for "Zoro": log `02-search+Tab` | "Best match" ranks Zoro-Juurou (OP05-067, ST18-004) above Roronoa Zoro, because a name prefix outranks a whole word in the name. "Luffy" puts the "Luffy Is the Man…" Events above every Monkey.D.Luffy. | Score a whole-word match in the name as highly as a prefix match, then break ties by category (Leader and Character before Event) and by card number. | **Fixed.** A whole word of the name ranks with a prefix; ties put Leaders and Characters before Events and Stages. Unit test: "zoro" ranks Roronoa Zoro first. |
| M1-36 | 1 | card-face-study §1 | Tile macro: `r2-s2-tile-macro.png` | With the crop now starting at 6%, slivers of the printed power box still show above the power plate (M1-18 is only partly fixed). | Start the crop at about 8%, or extend the power plate up to the window's top edge. | **Fixed.** On tiles the power plate runs to the window's top-right corner, covering the printed power box. |

**Counts for this re-review:** of the original severity-3 findings, all 4 are verified, and M1-04 is verified for the results page only. New findings: severity 3: 1 (M1-30) · severity 2: 4 · severity 1: 2. No new severity 4.

M1 review: FAIL (open: M1-30, inspector unreadable at 320 CSS px)

## Re-review 2 (2026-10-28, commit `95ba79f`)

### Method

- I rebuilt with `npm run build` and served the bundle with `npm run preview`. The server was stopped afterwards.
- I measured with my own harness, `.cache/m1-review/r3.mjs`, plus a chip-overlap probe, `chip.mjs`.
- The inspector was measured at 320×256, 320×180, 375×667, 480×270, 560×315, 561×400, 640×360, 800×450, 1280×720 and 1920×1080, using OP05-119 (two paragraphs of text) and OP15-092 (the longest text that has a repair).
- axe-core was run with the same tag set as before.
- Screenshots are `.cache/m1-review/r3-*.png`, and the log is `r3-log.json`.
- Changes to `engine/` were not in scope.

### M1-30: inspector reflow — **verified**

| Viewport | Columns | Overflow (scrollWidth / clientWidth) | Header height / dialog height | Card text column |
|---|---|---|---|---|
| 320×256 | one, 278 px | 302 / 302: none | 65 / 240 = **0.27**, not sticky | 278 px wide, readable (`r3-30-insp-320x256-*.png`) |
| 320×180 | one, 278 px | 302 / 302: none | 65 / 164 = **0.40**, not sticky | 278 px wide, readable (`r3-30-insp-320x180-text.png`) |
| 375×667 | one | none | 0.08 | 333 px |
| 480×270 / 560×315 | one | none | 0.21 / 0.18 | 438 / 518 px |
| 561×400 / 640×360 / 800×450 | two | none | 0.17 / 0.19 / 0.15 (sticky) | 233 / 308 / 458 px |
| 1280×720 / 1920×1080 | two | none | 0.11 / 0.10 | 586 / 666 px |

- The longest card text (OP15-092) reads in full at 320×256, down to the provenance links (`r3-30-long-320-text.png`, `-bottom.png`).
- With focus in the dialog, the arrow keys scroll it (scrollTop 0 → 119).
- axe reports 0 violations at 320×256 and at 320×180.

### Spot checks: M1-31 to M1-36

| ID | Result | Measurement |
|---|---|---|
| M1-31 | Verified | Every way of closing returns focus to a card, never to `<body>`: Back after a keyboard open (focus goes to the opener, idx 1, and `:focus-visible` holds), Back after a mouse open (the opener, idx 3), Escape on a deep link from another set (result 0), and Escape at every inspector size. Forward reopens the inspector. |
| M1-32 | Verified, but it causes M1-37 | The chip is now in the art window's bottom-right corner (x 0.37–0.98, y 0.45–0.57 of the face) and no longer covers faces (`r3-32-rotated.png`). |
| M1-33 | Verified | A visible label, "Search cards", is 89×20 px and not hidden (`r3-sweep-default-1280.png`, `r3-34-320-open.png`). |
| M1-34 | Verified | At 640 and 320, pressing Enter on "Filters" puts focus on the Set select, which is in view below the button. Tab then moves through the colours in visual order, and "Show 20 results" returns focus to result 0. No horizontal scroll, and axe reports 0 violations. |
| M1-35 | Verified | The first results for "Zoro" are three Roronoa Zoro Leaders, then the Characters. "Luffy", "Nami" and "Kaido" likewise start with their Leaders and then Characters of that name. |
| M1-36 | Verified | No printed frame shows above the power plate (`r3-36-tile-macro.png`). |

### Sweep

- **1280 and 1920:** `/` then ArrowDown reaches result 0, Enter opens the inspector, and Escape returns focus to result 0. The forced-colours ring is a solid 3 px outline.
- **axe:** 0 violations on the default view, search, the inspector, and the text fallback, at both sizes.
- **New severity 3 or 4:** none.

### New findings

| ID | Sev | Principle / WCAG | Screen, state, screenshot | Problem | Recommended fix |
|---|---|---|---|---|---|
| M1-37 | 2 | Visual system §9 check 3 (numbers are never truncated); P1 | 1280×720 compact tiles, any banned or rotated card with a Counter: `r3-32-counter-chip-1280.png`, `r3-32-rotated.png` | The relocated chip (z 3) overlaps the Counter plate (z 2) by **5.4 px**, so "+2000" reads as "+200(" (26 of 42 visible tiles in the Rotated filter). At 1920 the gap is 21 px, so there is no overlap. The value stays correct in the accessible name and the inspector. This regression came from the M1-32 fix. | At compact density, use an icon-only chip (⟲ or ⛔, with the word in `title` and the accessible name), or stack the chip above the Counter plate. Add a test that no chip intersects any plate. |
| M1-38 | 1 | WCAG 2.4.11 Focus not obscured (minimum) | Inspector at 561–640 px wide (two-column, sticky header) | When content is scrolled into view programmatically, the sticky header hides the first line of card text (text top at 29–67 px, header bottom at 80–82 px). Manual scrolling is unaffected. | Add `scroll-padding-top` equal to the header height on the dialog. |

**Counts for re-review 2:** M1-30 verified. M1-31 to M1-36: 6 of 6 verified. New findings: severity 3 or 4: 0 · severity 2: 1 · severity 1: 1.

M1 review: PASS
