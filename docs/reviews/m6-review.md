# M6 adversarial review (Deck builder)

Scope: commit 93b7b32 plus the working tree (engine/src/deck.ts, setup.ts, cards/src/decklist.ts, app/src/decks/*, Setup.tsx, decks.ts, App.tsx, Header.tsx). Method: read the code against PLAN row 17 and the M6 done row, flows F17 and F3a, the rules digest, and `standard.json`; probed the parser and validator with scripts, probed the running app with Playwright, and looked at all 16 screenshots. Severity: 1 minor, 2 should fix, 3 must fix before done, 4 critical.

## Done-criteria check

- **All 36 meta lists round-trip without loss: confirmed.** I parsed the export of every list in `compact`, `count` and `limitless` formats and in JSON: 0 differences (same Leader, same multiset of cards, every line `ok` or `leader`). All 36 also pass `deckIssues(..., 'standard')` with no issue.
- **Validator matches the rules and standard.json: confirmed on probes.** Banned (6 cards, incl. the banned Leader ST10-001), banned pairs including the Leader side (OP11-040 is a Leader and pairs with OP11-067 and OP08-069; reported once, not twice), 5 copies, 51 cards, Leader in main, off-colour, rotated Leader, unknown legality as a warning, unknown card number. No restricted card exists in the data, so the restricted branch runs only in unit tests. Alt arts count together because decks hold card numbers only (a `_p1` suffix inside a deck spec is "unknown card", correct since the parser strips it before it reaches the spec).
- **Any Standard-legal card can be added and saved: yes.** Note the default "Standard-legal" toggle also hides the 246 cards whose legality is `unknown` (EB-05 and others). They can be added with the toggle off, with a warning row. Acceptable for M6; M6b removes the gap.
- **A non-meta-leader deck can be played against the AI: yes.** `ai/test/non-meta.test.ts` passes (60 tests across the three M6 test files pass); the e2e "Play with this deck starts a game" passes. (One e2e run failed with `ENOENT ... test-results/.playwright-artifacts-0/...trace`: a trace-file race in my shared `test-results` folder, not a product failure; the test body passed on re-run of the other viewport.)

The two things that decide the verdict are a data-loss bug in the store (M6-1) and keyboard focus loss in the core add/remove interaction (M6-2).

## Findings

### M6-1 (severity 3) Saved decks are silently overwritten by a stale cache across tabs
`app/src/decks/store.ts:27-52` (`read`, `write`, `subscribeDecks`). The module caches the whole array on first read and only listens for the `storage` event while some component is subscribed (`subscribeDecks`). Setup and `savedOptions()` read without subscribing.
Scenario (reproduced): tab 1 is on `/play` (Setup reads the cache). Tab 2 saves a deck "FromTab2". Tab 1 clicks Decks (list shows only the old decks: the storage event fired while nobody listened), clicks New deck. `write([...read(), d])` writes the stale array: localStorage ends as `['UnkDeck','New deck']` and "FromTab2" is gone. The same happens on any edit (every keystroke in the name field rewrites the whole array).
Fix: do not trust the cache across writes. Re-read `localStorage` inside `write` (read-modify-write on the fresh array: `const fresh = parse(getItem())`; apply the change by id), register the `storage` listener at module load (invalidate the cache always), and re-validate on `visibilitychange`/focus.

### M6-2 (severity 3) Keyboard focus is dropped to `<body>` after the core builder actions
`app/src/decks/DecksRoute.tsx:385-406` (tile `−` is `disabled={n === 0}`), `:547-554` (deck-row `−` unmounts with its row), `:447-455` (Change Leader unmounts), `:408-415` (Choose unmounts), `ImportDialog.tsx:96-100` (Esc).
Scenario (reproduced; `document.activeElement` is BODY each time): a keyboard user presses Enter on `−` of a card that has 1 copy, or on `−` in the deck list for the last copy of a card, or on "Choose as Leader", or "Change Leader". The focused button disables or disappears and focus falls to the page start. The next Tab starts again at the skip link; reaching the deck pane from the search box takes 67 Tab stops (measured). Pressing Esc in the Import dialog also lands on BODY (Export dialog correctly returns to its button, so the two dialogs disagree).
Fix: keep buttons focusable (use `aria-disabled` and a no-op, not `disabled`), and after a removal move focus to the next row's control, the list heading, or the grid tile; after Choose/Change Leader focus the search box or the Leader chip; on dialog close restore focus to the opener (store `document.activeElement` before `showModal`, restore in `onClose`, for both dialogs). Announce the result in the existing live region.

### M6-3 (severity 2) F17 step 1 keyboard model is not built; the grid costs 2 Tab stops per tile
`DecksRoute.tsx:274-283, 369-420`. F17 specifies arrows moving in results, Enter/Backspace to add and remove, `A` on focus for the art switcher, and Tab moving between panes. Implemented: `/`, and `+`/`-` only while focus is already on a tile button. No roving tabindex, no arrows, no way to jump between panes (see M6-2: 67 stops). Fix: make the grid one composite widget (roving tabindex, arrow keys, Enter adds, Backspace removes, `A` cycles art on the focused row) and put a "Skip to deck" link before the grid.

### M6-4 (severity 2) Setup lets a saved deck with an unknown card start, then fails with a cryptic message
`Setup.tsx:130-139`. The check is skipped when any card is not in `deckCards` ("a card the data does not know fails at game start"). Reproduced with a saved deck containing `OP99-001`: Start is enabled, the automation line is missing, and Start produces "Couldn't start the game: Unknown set OP-99" (from `setCodeOf`/`loadSet`, not from `deckIssues`). This contradicts F3a step 2 and F17 step 7 ("the builder, Setup and game start never disagree": the builder shows "Unknown card OP99-001"). It is also open during the card-loading window: Start is enabled before `deckCards` loads, and a Standard-illegal saved deck can slip through because game start checks `free` only.
Fix: compute problems from the deck spec without waiting for card data (unknown IDs are knowable from the set manifest), disable Start while `deckCards` is not loaded for the chosen decks, and call `deckIssues` with a lookup that returns undefined for missing IDs so the same message appears. Make `loadCards` tolerate an unknown set (catch and report as a deck problem).

### M6-5 (severity 2) One malformed stored deck blanks the whole app
`store.ts:25-30`. The filter only checks `typeof d.id === 'string'`. Reproduced: `[{"id":"saved:bad","name":"x"}]` in `optcg.decks.v1` makes `/decks` throw `Cannot read properties of undefined (reading 'length')` (DecksRoute.tsx:134, `d.main.length`) and the page body is empty. There is no error boundary on the route. A schema change in a later milestone will hit the same path.
Fix: validate and coerce each entry on read (`name` string, `leader` string or null, `main` array of strings, `format` in the set, `art` object), drop or repair the rest; add an error boundary around lazy routes.

### M6-6 (severity 2) A failed save is silent
`store.ts:37-41`. The catch says "the decks stay for this session only", but the user is told nothing, while the page promises "Decks are saved in this browser" and the design drops the Save button on the strength of "every change saves at once". In a private window or with storage full, the deck vanishes on reload with no warning.
Fix: have `write` return/emit a failure state and show a persistent notice in the builder ("This browser is not saving decks. Export your list to keep it.") with an Export shortcut.

### M6-7 (severity 2) Builder layout defects at 1280x720 and 1920x1080
`decks.css`, `.builder-grid` (nested `overflow: auto` region, 443 px client height of 2,244 px scroll) and `.show-more`. In screenshots 02, 04 and 06 the "Show 60 more" button overlaps the lower edge of the visible tile row and hides the `−`/`+` controls (6 tiles overlap the button at 1280x720; measured). In 02 and in the 1920 shot, the "Choose as Leader" label is wider than its tile and runs to the tile edges. At 1280x720 only about two tile rows are visible, inside a scroll area inside a pane. At 800 px wide (below the 960 px breakpoint) the deck pane's list region collapses to a sliver under the checks (my screenshot `narrow800.png`) and the grid shows one row.
Fix: put the "Show more" button inside the scroll region after the grid (or paginate by scrolling), give the grid its own padding-bottom, shorten the label to "Leader" with the full name in `aria-label`, and let the deck list region keep a minimum height below 960 px.

### M6-8 (severity 2) Setup's deck problems appear far from the picker and below the fold
`Setup.tsx:355-364`, screenshot 08-1280. The "Fix the deck first" box sits in the Game column under the seed field, after the opponent list; at 1280x720 it is below the fold and Start is disabled with no hint near the control the user just changed. It also announces once as `role="alert"` when it first appears, then never when the content changes. Fix: show the problems inside the DeckPicker fieldset of the seat that has them, with a link "Open in the deck builder"; keep the summary near Start only as a one-liner. Use a stable live region.

### M6-9 (severity 2) Parser rejects common real-world inputs
`cards/src/decklist.ts:40` (the `LINE` regex is case-sensitive on the ID) and `:41` (`BLANK`).
- Lowercase IDs (`4 op01-016`, `4xop01-016`) are "Not a card line"; the code then upper-cases the ID it can never reach. JSON also fails for `"op17-039"` (`parseJson` never upper-cases the Leader).
- Section headings that sites emit, such as `Leader (1)`, `Characters (12)`, `Events:`, `Stages`, or a bare `Leader` followed by `OP17-039` with no count, are blocking "Not a card line" errors that the user must drop one by one. `Leader` + ID with no count is a plausible hand-typed form.
- Trailing text after the ID such as `4 OP01-016 # comment` or `// comment` yields a "name doesn't match" warning (`"// comment" doesn't match ...`); harmless but noisy.
Fix: make the ID pattern case-insensitive, treat `^(leader|characters?|events?|stages?|don!*)\b.*$` heading lines as blank, accept a bare ID line as count 1, and strip `#`/`//` comments before matching.

### M6-10 (severity 2) A huge count freezes the tab
`decklist.ts:104` and `:159` (`for (let k = 0; k < count; k++) out.main.push(id)`). `99999999 OP17-040` allocates 100 million entries (828 ms measured; one more digit or two will run out of memory), then `deckIssues` and the report build on it. The paste is parsed on every keystroke in the dialog. JSON `count` is not clamped either.
Fix: cap the per-line count (for example at 99, reporting "count too large" as a blocking line status) and make JSON counts integers 0 to 99.

### M6-11 (severity 1) JSON import silently drops entries
`decklist.ts:162-166`. `count: "x"`, `count: -3`, `null` and numbers inside `main` are ignored with no line in the report; `count: 2.5` imports 3 copies. Report each as a `syntax` line (with the index) and reject non-integers. All JSON problems carry `line: 1`.

### M6-12 (severity 2) Check rows expose a file name and drift from the F17 wording
`model.ts:46-59`, screenshots 04/06. The player sees "No banned cards or pairs (standard.json)" and "Standard blocks (standard.json)". F17 step 2 specifies "(from 2026-10-12)" and "Standard blocks 2-5". When a row fails, the rule string nests parentheses ("(Standard (banned since 2026-10-12))") because `rule` is taken from `mine[0].rule`.
Fix: label rows from the format data ("Standard blocks 2-5", "No banned cards or pairs (list of 2026-10-12)") and give `DeckIssue` a short `ruleRef` separate from the human `rule`.

### M6-13 (severity 2) Delete uses a native `window.confirm` and has no undo
`DecksRoute.tsx:485`. Every other dialog in the app is a styled `<dialog>`; the native confirm is off-brand, unstyled in the dark theme and not testable in the same way. Decision doc says deleting asks for confirmation, which holds, but one click after an accidental Enter loses the deck (and note M6-1). Fix: styled confirm dialog, or Delete with a 10 s "Deck deleted. Undo" toast and no confirm.

### M6-14 (severity 2, does not affect the done criteria) F17 items not implemented
- DON!! deck size and a Leader slot in the deck pane (step 1); the Leader is only a chip.
- Browser filters by colour and set (step 1); only cost, category, Leader's colours, Standard-legal, meta, automated.
- Grouping by category as an alternative to cost (step 1).
- Check-row highlighting is present, but a card that is banned, rotated or unknown shows no badge on its tile when the legal toggle is off.
- Import report notes "Not in Standard" and "Colour doesn't match Leader" appear only on lines that parse as ok; a size mismatch is never reported in the dialog (only in the button label).
- "Effect not automated" badge on unscripted tiles (step 3): disclosure exists, tile badge does not.
- `A` to cycle art (see M6-3). Leave-with-unsaved dialog (step 8) is intentionally replaced by autosave (DECISIONS 2026-11-23); that is fine.

### M6-15 (severity 1) Deck name has no validation
`DecksRoute.tsx:433-437`. An empty name leaves the list card with a blank title, `Export ""`, an empty Setup option label (" · OP17-039"), and every keystroke rewrites `updatedAt` (re-sorts the list). Trim, fall back to "Untitled deck" for display, cap the length, and only bump `updatedAt` on content changes.

### M6-16 (severity 2) Dialog behaviour
`ImportDialog.tsx`, `ExportDialog.tsx`. Initial focus lands on the Close button (first focusable), not on the paste box. Esc discards a pasted list without asking. `/` while a dialog is open moves nothing (fine) but the global handler runs. Esc/close focus restore is covered in M6-2. Fix: `autoFocus` the textarea in Import; keep text in a ref and confirm Esc only when there is unsaved text, or keep the text for the next open.

### M6-17 (severity 1) Setup problem list keys and truncation
`Setup.tsx:357-363`. `key={p}` duplicates when the same deck is chosen for both seats (two identical lines, React key warning), and `problems.slice(0, 4)` drops the rest with no "and N more".

### M6-18 (severity 1) Setup and game start with a deck deleted in another tab
`decks.ts:38-45`, `Setup.tsx:394-400`, `PlayRoute.tsx:94-95`. `DeckPicker` falls back to `DECKS[0]` for display while state still holds the deleted `saved:` id, so the picker shows a meta deck and the problem box says "deck was not found". `PlayRoute` does `deckById(choice.myDeck)!` and would throw if the deck vanished between Setup and Start. Reset the choice to the first meta deck when the id stops resolving.

### M6-19 (severity 1) Export dialog edges
`ExportDialog.tsx:40-47`. `URL.revokeObjectURL` runs synchronously after `click()` (Firefox and Safari can cancel the download; revoke on a timer). With no `navigator.clipboard` (non-secure context) Copy does nothing and says nothing. The JSON export includes `name`, but import ignores it (a round trip loses the name; list content is lossless).

### M6-20 (severity 1) Validator edge cases and wording
- `engine/src/deck.ts:70-73`: an unknown card number with more than 4 copies reports only "Unknown card" (no copies issue); harmless.
- `cards/src/format.ts` `standardLegality`: a restricted card is returned before the block check, so a restricted card in a rotated block would read as legal. No such card exists today (`restricted: []`), but the order should be rotation, then restriction.
- Game start deliberately checks `free` only (DECISIONS); F17 step 7 says the three places "never disagree". They differ for rotated or banned cards in a saved deck loaded through `/play?p1=saved:...&start=1`: Setup is bypassed and the game starts. Low risk (URL is a developer path), but document it or run `deckErrors` in `PlayRoute` for `saved:` decks.

### M6-21 (severity 1) Minor accessibility and polish
Tile controls are 24x24 px (meets WCAG 2.2 AA minimum, below comfortable for the primary add/remove action); the two `role="status"` regions (result count, deck announcements) can interrupt each other; the live-region text repeats exactly for "Imported 50 cards." twice in a row and is then not re-announced; Export radios in dark theme have low contrast in the unchecked state (screenshot 05).

## Visual review notes (16 screenshots)
01 and 07 are clean; 07's card shows "2 problems" in red with no way to see which from the list. 02/04/06: see M6-7 (button overlays row 2) and M6-12 (file name). 03 (import): the report reads well and "Use OP17-049" is a good fix action; the summary names only the first of two problems ("hello" is the second), and the footer error and the button both stand beside each other on one line. 05 (export): fine. 08 (Setup): see M6-8; the automation line for a 51-card deck still says "all 15 different cards are scripted" which is true but reads as approval while the deck is invalid.

## Verdict: FAIL

Severity 3: M6-1 (stale cache overwrites saved decks across tabs) and M6-2 (focus lost to body after the core add/remove, Choose Leader and dialog-close actions). Fix those two, and ideally M6-4, M6-5, M6-7 and M6-8, then re-review. The done-row criteria themselves (36 lists round-trip, validator matches rules and `standard.json`, any Standard-legal card addable and savable, non-meta Leader playable against the AI) are met.
