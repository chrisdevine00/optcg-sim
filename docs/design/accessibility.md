# Accessibility plan

**As of:** 2026-10-28 (Phase 4, revision 1)
**Target:** WCAG 2.2 level AA for the whole product, plus PROMPT.md's "a full game vs AI is playable with keyboard alone".
**Inputs:** `PROMPT.md` (Done when, Phase 4, Accessibility, Learning layer); `docs/plan-review-1.md` (UX-2, UX-8, UX-9); `docs/PLAN.md` §2, §3, §5; `docs/ARCHITECTURE.md` §2.3, §2.7, §2.8, §5; `docs/research/rules-digest.md` §D–K; `docs/research/effect-dsl.md` §4.11, E-D4; `docs/content/curriculum.md` (untimed exit criteria).
**Companions written in parallel:** `board.md` (geometry), `flows.md` (interaction scripts, confirm vs undo), `visual-system.md` (tokens), `learning-ui.md` (coach, review). Where this file and one of those disagree on **keyboard, focus, announcements or timing**, this file wins and the other is corrected. Where they disagree on **geometry or visual styling**, they win and this file's tables are updated to match. §14 lists what each one must carry over.

## 1. The model in one paragraph

The board is a DOM (not canvas) composite widget. It has one tab stop per zone, and the zones are in reading order. Arrow keys move within a zone. Enter opens a menu of the focused card's legal actions, built only from `view.decision.actions`. Every multi-step action (attack, give N DON!!, pick several cards, order effects, defend) runs as a named **mode** with its own instructions in the prompt bar. Escape always backs out one level, and nothing reaches the engine until the mode's single commit. Single-letter shortcuts work only while focus is inside the board, and can be switched off. Screen-reader output comes from one announcer that consumes **projected** events grouped by `intentId`, so there is one sentence per player move. AI turns are paced, pausable and summarised. Nothing in the product is timed unless the player switches on timed drills.

## 2. Ground rules

1. **DOM rendering.** Cards, zones and badges are DOM or inline SVG elements with accessible names. The board is never a `<canvas>` or WebGL surface, because those cannot expose names, states or focus. Animation uses CSS transforms on DOM nodes (60 fps budget, ARCHITECTURE §5).
2. **No rules in the accessibility layer.** Action menus, target lists, pick validity, counter staging previews and "why not" text come from the engine API (`view.decision.actions`, `whyNot`, `preview`). The session store may run `reduce` on a scratch copy to validate a staged set (§3.8). Components never compute legality.
3. **Keyboard parity.** Every pointer action has a keyboard path, and every drag has a click path (WCAG 2.5.7). Every keyboard command has a visible control somewhere, so nothing exists only as a shortcut.
4. **Announcements come from views.** The announcer reads projected events and the player's view, never raw state, so the accessibility layer cannot leak hidden information (ARCHITECTURE §2.7). A test enforces this (§11.1).
5. **No time pressure.** The game waits for the human indefinitely at every decision. There are no turn timers, auto-pass timers, or toasts that vanish before they can be read (§8).

## 3. Keyboard interaction spec (play)

### 3.1 Board structure and reading order

The board element has `role="application"`, `aria-roledescription="game board"`, and the label "Game board, turn N, your Main Phase" (updated per phase). Inside it, each zone is a `role="group"` with a name. Each card is a focusable element with `aria-haspopup="menu"`. Focus uses a **roving tabindex**: one tab stop per zone, and the zone remembers its last-focused card.

Why `role="application"`: NVDA and JAWS in browse mode take arrow keys and single letters for their own navigation. Inside an application region they switch to focus mode and pass keys through, so the board's arrows and shortcuts work. Long-form reading (card text, coach explanations, the game log, review) lives **outside** the application region in normal document semantics, where browse mode works. The risk and its fallback are in §12, R1.

**Tab order follows rows top to bottom, then left to right as rendered.** For the default layout (official playmat arrangement, opponent rotated 180° at the top), the order is:

| # | Tab stop | Inner items (arrow keys) |
| --- | --- | --- |
| 1 | Game status bar: turn, active player, phase stepper, game menu | Phase steps are read-only; menu is a button |
| 2 | Opponent's hand | One item: "Opponent's hand, 6 cards; 1 known: Kaido". Known cards come from `view.known` |
| 3 | Opponent's Trash | Top card; Enter opens the trash list |
| 4 | Opponent's cost area | Two items: "4 active DON!!", "2 rested DON!!" |
| 5 | Opponent's DON!! deck | One item: count |
| 6 | Opponent's Deck | One item: count (plus "top card known" when the view says so) |
| 7 | Opponent's Stage | The Stage, or "empty" |
| 8 | Opponent's Leader | The Leader |
| 9 | Opponent's Life | "4 Life, face down", plus one item per face-up Life card (CR 3-10-2-1) |
| 10 | Opponent's Characters | 0–5 cards in slot order, or "empty" |
| 11 | Centre lane: prompt bar and battle panel | Prompt text, then its buttons |
| 12 | Your Characters | 0–5 cards |
| 13 | Your Life | as 9 |
| 14 | Your Leader | |
| 15 | Your Stage | |
| 16 | Your Deck | |
| 17 | Your DON!! deck | |
| 18 | Your cost area | "6 active DON!!", "1 rested DON!!" |
| 19 | Your Trash | |
| 20 | Your hand | Cards in your chosen order |
| 21 | Coach panel (outside the board, `<aside>`) | Normal tab order |
| 22 | Game log (outside the board, `role="log"`) | Normal document |

If `board.md` places a zone differently, the rule (rows top to bottom, left to right as rendered) wins, and this table is updated in the same commit. A Playwright test asserts the DOM tab sequence against this table at both resolutions.

Empty zones stay tab stops so that the order never shifts. A zone with nothing to act on is still announced ("Your Stage, empty").

### 3.2 Modes

Every keystroke is interpreted in the current **mode**. The prompt bar always shows the mode's name, what is being decided, and its keys, and the mode's name is announced on entry.

| Mode | Entered by | Arrows / Tab | Enter / Space | Escape |
| --- | --- | --- | --- | --- |
| **Explore** (default) | always, between decisions | move between zones and cards | open the action menu | close an open popup; otherwise nothing |
| **Menu** | Enter on a card | Up/Down through actions | choose | back to Explore, focus on the card |
| **Target** | an action that needs one target (attack, single-target effect) | cycle **legal targets only**, in reading order | choose the target, then Confirm | back to the previous step |
| **Count** | give N DON!!, or any DON!! pick by location class | Up/Down change the count; Tab moves between rows | commit | cancel with nothing sent |
| **Pick** | a `choose` decision with max > 1 | move between candidates | Space toggles; Enter commits when valid | clear the selection; a second Escape returns to the decision |
| **Order** | an `order` decision | move between items | Space grabs or drops; Enter commits | drop the grabbed item back; a second Escape restores the suggested order |
| **Defend** | the human owes a `block`, `counter` or `trigger` decision | move between Blockers, hand cards and the staging tray | Space stages or unstages; Enter commits | clear staging (never "take the hit") |
| **Dialog** | inspector, trash list, rewind list, shortcut sheet, confirms | per dialog | per dialog | close and return focus to the invoking element |

Escape never commits anything. In particular, Escape in Defend mode clears staging, and it does not mean "take the hit".

When an engine decision arrives that the human owes (`block`, `counter`, `trigger`, `choose`, `order`, `optional`, `mulligan`, `chooseFirst`), focus moves to the prompt bar or the mode's first item, and the prompt is read as the focused element's name. This is the default; the setting "Move focus to new decisions" can switch it off (§9.3).

### 3.3 Moving between zones and within a zone

| Key | Action |
| --- | --- |
| Tab / Shift+Tab | Next or previous zone (table in §3.1). Leaving zone 20 goes to the coach panel. |
| Left / Right | Previous or next card in the zone. It stops at the ends and does not wrap, so the edge is unambiguous. |
| Home / End | First or last card in the zone. |
| Up / Down | The zone visually above or below. The card in the closest column gets focus. This is a sighted-user accelerator; Tab is the canonical order. |
| `G`, then a letter | **Go to.** A small popover lists the letters and waits with no timeout until the next key or Escape. Lowercase means yours; Shift means the opponent's. `h` hand, `c` Characters, `l` Leader, `s` Stage, `d` DON!! (cost area), `n` DON!! deck, `k` deck, `t` trash, `f` Life, `b` battle panel, `p` prompt, `g` game log. |
| `P` | Jump to the current decision (prompt bar). |
| `Q` | Speak a status summary (§9.2). `Shift+Q` speaks both boards in full. |

### 3.4 Selecting a card and opening its legal actions

1. Focus a card. Its name and state are read (§9.1).
2. Enter, Space, Shift+F10 or the Menu key opens the **action menu** (`role="menu"`), placed beside the card and never over it (§4.2).
3. The menu lists only legal actions for that card, from `view.decision.actions`, grouped and worded as player moves. Each item names its cost and its result:
   - hand card: "Play Zoro: rest 3 DON!!" or "Activate [Main]: …";
   - your Character or Leader: "Attack…", "Give DON!!…", "Activate: Main – <short ability name>";
   - any card: "Inspect" (always present) and "Why can't I…" (present when `whyNot` has an answer for a common intent such as attack or play).
4. If no action is legal, the menu shows one line from `whyNot`, for example "Can't attack: played this turn (CR 3-7-4)", plus Inspect.
5. Choosing an item that needs nothing more performs it, unless `flows.md` makes it confirmable. Choosing an item that needs more enters Target, Count or Pick mode.

The direct keys `A` (attack), `+` or `=` (give DON!!) and `I` (inspect) skip the menu for the focused card. If the action is not legal, the key does nothing visible except announce the `whyNot` reason once ("Zoro can't attack: it was played this turn"). It never shows an error dialog.

### 3.5 Choosing attack targets

1. On your attacker, press `A` (or choose "Attack…"). Target mode starts: "Choose a target for Zoro's attack. 2 targets: opponent's Leader, rested Kid. Arrows to move, Enter to choose, Escape to cancel."
2. Arrow keys and Tab cycle **only** legal targets, in reading order. The opponent's Leader is first. Illegal cards are skipped, so an active Character is never focusable as a target (CR 7-1-1-2).
3. Enter chooses the target and opens the attack confirm in the battle panel. The confirm shows the `preview` numbers as text: "Zoro 7000 attacks Leader 5000. Attacker is ahead by 2000; opponent needs 3000 Counter to survive." Enter confirms; Escape goes back to target choice.
4. Whether the confirm appears is a `flows.md` decision (confirm vs undo, plus a setting). The keyboard path is the same either way: the confirm is a focused button, so pressing Enter twice is the fast path.

### 3.6 Giving N DON!! by keyboard

Giving DON!! is one engine action per DON!!, grouped by `intentId` into one move (ARCHITECTURE §2.3). The UI collects the count first and then sends N actions.

1. On your Leader or Character, press `+` (or choose "Give DON!!…"). Count mode opens as a small dialog anchored beside the card: "Give DON!! to Zoro. 1 of 6 active DON!!. Zoro: 5000 → 6000 this turn."
2. Up/Down, or `+`/`-`, change the count. Digits 1–9 set it directly. The maximum is the number of active DON!! in your cost area that the engine offers; at the maximum, Up announces "6, maximum".
3. Each change updates the preview line and announces it politely, with only the numbers ("3: Zoro 8000").
4. Enter commits. The store sends N `give` actions with one `intentId`, and the announcer says one sentence: "Gave 3 DON!! to Zoro. Zoro 8000."
5. Escape cancels; nothing is sent.

Starting from the DON!! side works too. Focus "6 active DON!!" in your cost area, press Enter, choose "Give to…", then pick the card in Target mode, and Count mode follows.

### 3.7 DON!! picks by location class (costs and effects)

DON!! −X costs, "rest N DON!!" and "return DON!!" choices are `choose` decisions over **location classes with counts** (`effect-dsl.md` E-D4). The UI renders one Count dialog with one row per class:

```
Return 2 DON!! to your DON!! deck (DON!! −2).        0 of 2 chosen
  Cost area, active      [ 0 ]  of 4
  Cost area, rested      [ 0 ]  of 1
  Given to Zoro          [ 0 ]  of 2   (Zoro loses 1000 per DON!! this turn)
  Given to Leader        [ 0 ]  of 1
                                     [ Confirm ]  (disabled until 2 of 2)
```

- Each row is a `spinbutton`. Tab moves between rows; Up/Down change the row's count.
- The header is a status line ("1 of 2 chosen"), announced politely on change.
- Completability lookahead comes from the engine. If a row cannot go higher, its increment is disabled and announced ("maximum for this cost"). The store checks validity by applying the picks in canonical class order to a scratch state (§3.8).
- Enter on Confirm commits. The store sends picks in canonical order, then `done`.

### 3.8 Multi-select picks with one commit

Applies to `choose` decisions with `max > 1` (for example "K.O. up to 2", "add up to 1 from the top 5", or a "total cost of 4 or less" search).

1. The candidates appear in place if they are on the board, or in a **Reveal tray** (a non-modal dialog) if they come from a hidden zone ("Look at the top 5 cards of your deck"). Only the chooser's view shows looked-at cards (ARCHITECTURE §2.7).
2. The candidate list is a `listbox` with `aria-multiselectable="true"`. Arrows move; Space toggles; each option reads "Kaido, cost 10, not selected".
3. A status line keeps a running count and the constraint: "2 selected of up to 3. Total cost 3 of 4." Changes are announced politely.
4. A candidate that cannot join the current selection is marked unavailable, with a reason from the engine ("would exceed total cost 4"). The rule for validity: the store sorts the selection into canonical order, applies each `pick` to a scratch copy of state with `reduce`, and checks that every step and the following `done` (or a further pick, if below min) appear in that step's `legalActions`. No component computes legality. If this proves too slow in M3, the fallback is an engine helper with the same contract (proposed decision PD-3, §13).
5. Enter (or the Commit button) commits when the selection is valid. "Up to" allows committing with 0 (CR 8-4-4-1); the button then reads "Choose none".
6. Escape clears the selection. A second Escape returns focus to the prompt, without committing.

### 3.9 Ordering effects and cards

Applies to `order` decisions: simultaneous triggers, replacements, cards going to the bottom of the deck (CR 3-1-7, 8-6).

1. The items appear as an ordered `listbox` in the suggested (canonical) order: "1 of 3: Zoro [On Play], draw 1".
2. Arrows move focus. Space **grabs** the focused item ("grabbed Zoro [On Play], position 1 of 3"). Up/Down then move it, announcing "moved to position 2 of 3". Space drops it. `Alt+Up`/`Alt+Down` move the focused item in one step without grabbing.
3. A "Use suggested order" button resets the list.
4. Enter commits. Escape while an item is grabbed returns it to where it was before the grab.
5. When the auto-skip setting (ARCHITECTURE §2.3) resolves an `order` decision to canonical order, the announcer says so: "Effects resolved in the suggested order."

### 3.10 Defending: Blocker, Counter staging and commit, Trigger

The engine runs Block Step, then Counter Step, as two decisions (CR 7-1-2, 7-1-3), and [On Block] effects resolve between them. The UI shows both in one **Defend panel** so the player can plan, but it commits them in that order.

**Arrival.** Focus moves to the Defend panel. Its heading is read: "Opponent's Kaido, 9000, attacks your Leader, 5000. You need 5000 more to survive. Block or counter." Battle numbers come from `preview`.

**Block step.**
1. Tab or arrows move through the eligible Blockers (active, with [Blocker], not the card being attacked; CR 10-1-4-1) and the button "Don't block". Each Blocker reads its `preview`: "Block with Jinbe, 6000: Jinbe would be K.O.'d unless you add 4000."
2. While choosing, the panel lists your hand's Counter values as text, so the player can plan the blocker and the counters together.
3. Enter on a Blocker or on "Don't block" commits the block decision. Only one Blocker per battle, so the choice is a single pick.
4. If there are no eligible Blockers and auto-skip is on, nothing is asked, and the announcer says "No Blockers available."

**Counter step (staging).**
1. Focus moves to your hand, filtered to the playable counters: Character cards with a Counter value, and [Counter] Events whose cost you can pay. Other hand cards are present but marked "not usable now".
2. Space **stages** or unstages the focused card. Staged cards move to the **staging tray** (numbered, in staging order), and the battle line updates: "Staged +3000. Leader 8000 vs 9000: still loses; 2000 more needed." Ties go to the attacker (CR 7-1-4-1), so "needed" always means enough to go strictly above the attacker, and a tie says so: "Tied: the attacker wins ties."
3. Each staged Character Counter targets the defending card by default (the attacked card, or the Blocker). To change it: focus the item in the tray, press Enter, and choose "Change target…" (any of your Leader or Characters; CR 7-1-3-1-1).
4. Staged [Counter] Events show "+? (resolves on commit)" when their effect needs choices; otherwise they use `preview`. The store validates the whole staged set, including DON!! for event costs, with the scratch-`reduce` rule from §3.8. An item that would make the set unpayable cannot be staged, and the engine's reason is announced.
5. Two commit buttons, always in this order:
   - **"Play 2 counters"**: sends the staged actions in tray order, then `done`. Any choices an Event needs are asked as they resolve.
   - **"Take the hit"**: sends `done` with nothing staged. If cards are staged, this button is relabelled "Take the hit (discard staging)".
   Enter on the tray commits "Play N counters". `T` is **not** bound to "take the hit", because a single-key irreversible action is too easy to press by accident.
6. Escape clears staging.

**Trigger.** "Life card: Gum-Gum Red Hawk has [Trigger]: <trigger text>. Activate the Trigger, or add it to hand." There are two buttons, and focus is on the first. If the card has no [Trigger] or it is unscripted, the card goes to hand, and the announcer says "Added 1 Life card to hand", naming the card for its owner only.

### 3.11 Other decisions

- **Choose first or second / mulligan:** a dialog with two buttons. For the mulligan, your hand is a readable list above the buttons (arrows, `I` to inspect).
- **Optional ("you may")**: Yes/No buttons. The text names the cost, if any.
- **End turn:** `E`, or the End Turn button in the prompt bar. Whether a confirm appears (for example "You have 3 active DON!! and 2 Characters that can attack") is a `flows.md` decision. With a confirm, the key path is `E`, then Enter.

### 3.12 Rewind, hint, coach panel, lethal, battle maths

| Key | Action | Notes |
| --- | --- | --- |
| `U` | Rewind one player move (by `intentId`) | Practice modes only. Announces "Rewound: gave 3 DON!! to Zoro. Your Main Phase, turn 5." Rewind is deterministic, RNG included (DECISIONS 2026-10-28). |
| `Shift+U` | Back to my last decision | |
| `R` | Open the rewind list | A dialog with a `listbox` of moves, newest first ("Turn 5, you: gave 3 DON!! to Zoro"). Enter restores to before the focused move, after a confirm. |
| `Ctrl+Z` / `Cmd+Z` | Alias for `U` where the browser lets the page receive it | Safari may treat Cmd+Z as "Undo Close Tab" when no field is focused; `U` is the dependable key. To be verified in M3. |
| `H` | Hint | Opens the coach panel if it is closed. The hint arrives asynchronously from the worker. While waiting the panel shows "Thinking…" (no spinner-only state), then the line as an ordered list of moves with its reason. A polite announcement says "Hint ready: attack the Leader with Zoro first. Press C to read it." Focus stays on the board. |
| `W` | Why did the opponent do that | Same pattern as `H`, for the last AI move. |
| `L` | Lethal check, tiered (ARCHITECTURE §4.4) | First press: "Lethal: yes" / "no" / "unknown, search incomplete". Second press: the number of hits. Third press: the full line. Each tier is text in the coach panel and is announced politely. |
| `M` | Focus the battle panel and DON!! maths | During a battle. It reads attacker power, defender power, the gap, and the counters in hand. |
| `C` | Toggle the coach panel and move focus into or out of it | The panel is an `<aside aria-label="Coach">` in normal document flow: browse mode works there, and Tab order is header, Hint, Why, Lethal, toggles, then content. Pressing `C` again returns focus to the card that had it. |

The coach never takes focus on its own. Detector lights and the tempo meter change silently, unless the player has switched on "Announce coach alerts". This follows "the coach never interrupts unless asked" (PROMPT.md).

### 3.13 AI turn playback

| Key | Action |
| --- | --- |
| `K` | Pause or resume AI playback (the YouTube convention). WCAG 2.2.2 requires a way to pause auto-updating content. |
| `.` | While paused: advance one AI move. |
| `[` / `]` | Slower / faster: Step (wait for me), 0.5×, 1×, 2×, Instant. |

Pace never limits the human. The engine is waiting for the AI, not for the player, and the player's own decisions have no clock.

### 3.14 The shortcut set and the shortcut sheet

Board scope (focus inside the board's application region; no dialog or menu open):

| Key | Command | Key | Command |
| --- | --- | --- | --- |
| `?` | Shortcut sheet | `H` | Hint |
| `P` | Current decision | `W` | Why did they do that |
| `G` + letter | Go to zone | `L` | Lethal check (tiered) |
| `Q` / `Shift+Q` | Status / full board summary | `M` | Battle panel and maths |
| `A` | Attack with focused card | `C` | Coach panel |
| `+` or `=` | Give DON!! to focused card | `U` / `Shift+U` | Rewind one move / to my last decision |
| `I` | Inspect focused card | `R` | Rewind list |
| `E` | End turn | `K`, `.`, `[`, `]` | AI playback |
| Enter, Space, Shift+F10 | Action menu / activate | Escape | Back out one level |

**The shortcut sheet** opens with `?`, from the game menu ("Keyboard shortcuts") and from the Help entry in the app header. That Help entry is in the same place on every page (WCAG 3.2.6). The sheet is a modal dialog with the tables above, grouped by task, and with the current settings shown ("Single-key shortcuts: on"). It is printable, and its content is also a page in the rules reference.

### 3.15 Conflict rules (WCAG 2.1.4 and screen readers)

1. **Scoped to focus.** Single-character shortcuts fire only while focus is inside the board region. They never fire in text inputs, in search fields, inside dialogs, menus or the coach panel, or on any other page. This meets 2.1.4's "active only on focus" option.
2. **Switch-off.** Settings → Keyboard → "Single-key shortcuts" (on by default) can be turned off. When off, every command is still available through the action menu, the prompt bar buttons, the game menu and the coach panel. 2.1.4's "turn off" option is met too. A remapping editor is in the backlog, not v1.
3. **Reserved keys we never bind:** screen-reader modifier chords (NVDA key Insert or CapsLock, JAWS Insert, VoiceOver Ctrl+Option); Alt+letter (browser menus, Windows); Ctrl+letter and Cmd+letter except the Z alias; function keys (F6 cycles the browser's address bar, F7 is caret browsing); and Tab traps.
4. **Default actions handled in the board:** the board calls `preventDefault` for keys it consumes. These include Space (page scroll), `/` and `'` (Firefox quick find; `?` is Shift+/), and arrows (scroll).
5. **Screen-reader modes.** Inside the application region, NVDA and JAWS pass keys to the page. Outside it, the virtual cursor works normally. VoiceOver's Quick Nav and Single-Key Quick Nav intercept arrows and letters when they are on. The board's help text, and the VoiceOver test script (§11.3), tell the user to turn Quick Nav off on the board (press Left and Right arrow together) and to leave Single-Key Quick Nav off.
6. **Two-key sequences have no timeout.** After `G`, the popover waits for the next key or Escape (WCAG 2.2.1).

### 3.16 Other screens

| Screen | Keyboard model |
| --- | --- |
| Tutorial | Same board model. The step text lives in a region outside the board (`P` reads it). Constrained steps offer only the taught action, and "Show me" moves focus to the highlighted target. Exit and Resume are buttons and are always reachable. |
| Review | The turn timeline is a `toolbar` with roving focus (Left/Right between turns). Flags within a turn are a list (Up/Down). `N` / `Shift+N` jump to the next / previous flag. Enter restores the board read-only and moves focus to the flag's explanation, which is a document region. "Practice this" and "Replay from here" are buttons. |
| Drills | The board model for puzzles. Mulligan and Counter-or-take use the dialogs above. Timer controls are in §8. |
| Deck builder, card browser | Search is a `combobox`; results are a `grid` with arrow navigation; Enter adds; `Delete` removes from the list; import and export use a textarea and buttons. |
| Meta explorer | Archetype tiles are links in a list; the matchup grid is a `table` with row and column headers. |
| Settings, rules reference, glossary | Standard document and form semantics. Text reflows at 320 CSS px (WCAG 1.4.10). |

## 4. Focus

### 4.1 Visible focus (WCAG 2.4.7; aiming at 2.4.13)

- The focus indicator is a **two-tone ring**: a 2 px light outline outside a 2 px dark outline, offset 2 px. One of the two tones gives at least 3:1 against any card art or playmat behind it (WCAG 1.4.11). The tokens live in `visual-system.md`, and the M0 contrast check covers them.
- Focus is shown with `:focus-visible` for keyboard and programmatic focus. A pointer click does not draw the ring, but a decision that moves focus does.
- In Target, Pick and Defend modes, the **legal-target** decoration and the **focus** ring are different shapes (dashed outline plus a crosshair glyph for "legal", solid ring for "focused"), so a focused legal target shows both.
- In forced-colors mode (Windows High Contrast) the ring uses `Highlight`, and decorations use borders, never backgrounds alone.

### 4.2 Focus never obscured (WCAG 2.4.11)

No author content may cover the focused element, even partly where avoidable, and never entirely:

| Overlay | Rule |
| --- | --- |
| Hover zoom (pointer) | It appears in a fixed preview well (position from `board.md`), never over the board's focused card. After any keyboard input, hover zoom is suppressed until the pointer moves again. |
| Inspector (`I`) | It opens as a side panel. Focus moves into it, and Escape returns focus to the card. It never overlaps the card it describes. |
| Action menu, Count dialog, Reveal tray | Placed beside the card, flipping side to stay clear of it. If no side fits at 1280×720, the board scrolls the card into view, using `scroll-padding` equal to the sticky bars. |
| Battle panel, Defend panel | Docked in the centre lane. They never cover a legal target or the attacker. |
| Hand fan (overlapping cards) | The focused card is raised (z-order) and shown in full. Its neighbours never cover it. |
| Coach panel | A docked column that resizes the board; it does not float over it. At 1280×720 the board area shrinks per `board.md`. |
| Toasts and announcements | None are visual-only and none float over the board. Status text sits in the prompt bar. |
| Sticky status bar and prompt bar | `scroll-padding-top` and `scroll-padding-bottom` match their heights. |

A Playwright check focuses every focusable element in each mode at both resolutions and asserts that the element's bounding box is not fully covered by any other element (`elementsFromPoint` sampled at its centre and four inset points).

### 4.3 Focus management rules

- Opening a dialog moves focus into it. Closing it returns focus to the element that opened it, or, if that element is gone (a card that left the field), to its zone.
- When a focused card leaves its zone (K.O.'d, returned), focus moves to the same slot index in that zone, or to the zone itself if it is now empty. Focus is never lost to `<body>`.
- After an AI move, focus stays where the player left it unless a new human decision arrives (§3.2).
- A rewind restores focus to the zone of the rewound move's first card, or to the prompt bar.

## 5. Target size (WCAG 2.5.8)

The minimum for every pointer target is **24×24 CSS px** at 1280×720 and 100% zoom, unless the spacing exception applies (a 24 px circle centred on each target does not intersect any other target). Primary controls (End Turn, Confirm, Commit, the Defend buttons, Hint) are at least 44×44 px.

| Element | Rule at 1280×720 |
| --- | --- |
| Cards on the field and in hand | Far above the minimum; the card is the target. Overlapping hand cards: the visible strip of each card is at least 24 px wide, or the hand stops overlapping and scrolls. |
| **Given DON!! badge** | **One badge per card**, showing the count ("×2"), not one per DON!!. The badge is **part of the card's target**, not a separate target, so it has no minimum of its own. Its text still meets contrast, and it is at least 20 px tall for legibility. Where the badge must be a separate target (the "Given to Zoro" class in a DON!! pick), the pick happens in the Count dialog's rows (§3.7), whose spinbutton steppers are at least 24×24. |
| Cost-area DON!! | Two targets ("active", "rested") of at least 44×24, not one per DON!! card. |
| Opponent's hand backs | One target for the zone. |
| Phase stepper chips | Read-only; not targets. |
| Count steppers, staging-tray remove buttons, timeline flags | At least 24×24. |
| Card text links in the inspector (keywords to glossary) | Inline links in a sentence are exempt under 2.5.8; they are still at least 24 px line height. |

A Playwright script measures every interactive element's box in each mode at both resolutions, and fails on any target under 24×24 that does not meet the spacing exception.

## 6. Colour and contrast

### 6.1 No colour-only meaning (WCAG 1.4.1)

| Meaning | Colour is backed by |
| --- | --- |
| Active vs rested | 90° rotation, plus a "rested" icon, plus the accessible-name state |
| Playable or legal target | Dashed outline plus a glyph (play arrow; crosshair for targets), plus the action menu |
| Your side vs the opponent's | Position, zone labels, and names ("Opponent's Leader") |
| Power raised or lowered | ▲ or ▼ and a signed number ("+2000"), never only green or red text |
| Battle result in the panel | Words: "Attacker ahead by 2000", "Defender survives", "Tied: attacker wins ties" |
| Card colours (game data: Red, Green, …) | Colour names next to swatches in the inspector, filters and deck builder; multicolour cards list each name |
| Review flags | A distinct icon shape per category, plus a text label |
| Lethal detector, coach alerts | Icon plus text ("Lethal: yes"); never a coloured light alone |
| Staged vs unstaged | Position in the tray, a number, and the state "staged" |
| Errors and unavailable options | Text reason from `whyNot`, plus an icon |

### 6.2 Contrast

- Text 4.5:1 (large text 3:1). UI components and graphical objects 3:1 (WCAG 1.4.3, 1.4.11). This applies in both the dark default and the light theme.
- Numbers drawn over card art (power, cost, counts) sit on solid chips, never directly on art. Text over art uses a scrim token from `visual-system.md` that reaches 4.5:1 against the art's worst case (pure white).
- The token-pair contrast check runs at build time (PLAN M0). Axe checks rendered contrast in every flow (§11.1).
- Colour-vision checks: in M3 and M10, the visual-regression run takes extra screenshots with Chromium's emulated vision deficiencies (protanopia, deuteranopia, tritanopia, achromatopsia, via the DevTools protocol), and the reviewer confirms that every row of §6.1 still reads.

## 7. Motion and flashing

- **Reduced motion.** `prefers-reduced-motion: reduce` and the in-app setting "Reduce motion: follow system / on / off" (the in-app setting wins) both turn off movement:
  - card travel (deck to hand, hand to field, field to trash) becomes an instant move with a static "just moved" marker on the destination that stays until the next move;
  - the Trigger flip becomes a crossfade of 150 ms or less;
  - rest and active rotation becomes instant;
  - no screen shake, no parallax, and no zoom-in transitions.
- **No flashing.** Nothing flashes more than three times in any second (WCAG 2.3.1). Attention cues (lethal available, a new decision) are static outlines or icons. Any pulse lasts at least 2 s per cycle, stops after three cycles, and is off under reduced motion. Damage feedback never uses full-screen colour flashes.
- **Animation speed** is separate from reduced motion: AI pace (§3.13) and "Animation speed" in Settings. Reduced motion does not slow the game down; it removes movement.
- **Auto-moving content** (AI playback) can be paused, stepped and slowed (WCAG 2.2.2).
- Sound cues, if any (PROMPT.md allows a few), are off by default. They never carry information that is not also shown and announced.

## 8. Timing (WCAG 2.2.1, 2.2.2)

| Place | Policy |
| --- | --- |
| Every game decision | No time limit. The engine waits indefinitely. |
| AI turns | Paced for following along, pausable, steppable (§3.13). The ≤8 s AI-turn target (ARCHITECTURE §4.1) is about not making the player wait; it never makes the player hurry. |
| Blunder warning | The 300 ms cap (ARCHITECTURE §5) limits the system, not the player. The warning never auto-dismisses; it stays in the confirm until the player acts. |
| Tutorial | No timers. Text never auto-advances. Exit and resume at any step. The timing log (`usability-plan.md` §7) records time; it never limits it. |
| Drills and puzzles | **Untimed by default** (`curriculum.md`). "Timed drills" is a setting that is off by default. When on, the player can set 1×, 2×, 4× or 10× time, or switch it off at any time, including mid-item. Pausing stops the clock, and timed results never gate progress. |
| Go-to (`G`) and other key sequences | No timeout. |
| Hover and focus content | Persists until dismissed or until focus or hover leaves (WCAG 1.4.13); Escape dismisses it. |
| Messages | No toast-only messages. Every status also lands in the prompt bar or the game log. |
| Sessions | No session expiry: everything is local. |

## 9. Screen readers

### 9.1 Names and states

Accessible names are built by one module in `app/` from the player's view plus `derive` output. Each element has a **short name** (read on focus) and a **description** (`aria-describedby`, read after a pause, or on demand with `I`). Settings → Accessibility → "Card announcements: brief / standard / full" sets how much goes into the name.

| Element | Name (standard verbosity) | Description |
| --- | --- | --- |
| Your Character | "Roronoa Zoro, rested, 7000 power, 2 DON!!" | "Character, cost 3, base power 5000, +2000 from DON!! this turn. Rush. Played this turn. Actions: attack, give DON!!. Enter for actions, I to inspect." |
| Card during the opponent's turn | "Roronoa Zoro, active, 5000 power, 2 DON!! (no bonus on opponent's turn)" | as above; CR 6-5-5-2 |
| Your Leader | "Your Leader, Monkey.D.Luffy, active, 6000 power, 1 DON!!, 4 Life" | leader ability summary, "Once per turn: used" if spent |
| Opponent's Character | "Opponent's Kaido, rested, 10000 power" | "Can be attacked" when it is a legal target |
| Hand card | "Gum-Gum Red Hawk, Event, cost 2, Counter +4000, playable" or "…, not playable now" | full text, "effect not automated" badge if unscripted |
| Opponent's hand | "Opponent's hand, 6 cards; 1 known: Kaido" | |
| Life | "Your Life, 4 cards, face down" | face-up Life cards are separate items |
| Deck, DON!! deck | "Your deck, 32 cards", "Your DON!! deck, 3 cards" | "Top card known: …" when the view says so |
| Trash | "Your trash, 7 cards, top: Nami" | "Enter to browse" |
| Cost area items | "6 active DON!!", "1 rested DON!!" | |
| Empty slot or zone | "Your Stage, empty" | |
| Staged counter | "Staged 1 of 2: Sanji, +2000, to Leader" | "Enter to change target or unstage" |

Rules for names:
- **Order:** identity, state, power, DON!!, then anything else. Power is always the **current derived** value. The base value is in the description when it differs.
- **Words, not glyphs.** "+2000", not "▲2000"; "DON!!" is spelled as printed, and the glossary teaches its pronunciation ("don").
- Card art images have `alt=""`, because the element's name already carries the card. The text card fallback uses the same name.
- State changes on a focused card (it gets rested, its power changes) update the name and are also announced through the live region (§9.3), because SRs do not re-read a focused element's changed name reliably.

### 9.2 Status summary (`Q`)

`Q` speaks one polite message:

"Turn 6, your Main Phase. You: 4 Life, 5 cards in hand, 3 of 7 DON!! active, 3 Characters. Opponent: 3 Life, 6 cards in hand, 2 Characters, 1 rested."

`Shift+Q` speaks every zone of both boards in tab order. It is long by design, and the player can stop it with the screen reader's own stop key (Ctrl).

### 9.3 Live-region announcement policy

**Plumbing**
- Two regions exist in the DOM from page load and are never removed: `#announce-polite` (`role="status"`, `aria-live="polite"`) and `#announce-assertive` (`role="alert"`).
- The game log is `role="log"` with **`aria-live="off"`**. It is the full, readable history, but it is not spoken automatically, so nothing is said twice.
- One **announcer** module consumes **projected** events (ARCHITECTURE §2.8) from the store. It groups them by `intentId` into **one sentence per player move**, and writes the sentence into a region.
- **Repeated identical strings:** VoiceOver may skip a string that equals the previous one. The announcer alternates between two polite nodes and clears the old one after 1 s.
- **Suppression:** if the same move also moved focus to an element whose name carries the information (a new decision prompt), the live message is dropped.

**Settings** (Settings → Accessibility; the game menu offers the same):

| Setting | Options (default first) |
| --- | --- |
| Opponent moves | Each move / Turn summary only / Off |
| Your own moves | Confirm briefly / Off |
| Power changes from effects | Announce / Off |
| Move focus to new decisions | On / Off (off: a polite "Your decision: block or counter. Press P." instead) |
| Coach alerts (lethal detector, tempo) | Off / On |

**Per event type**, for moves that the screen-reader user did **not** make. Your own moves, with "Confirm briefly", use the same sentence in the second person.

| Event (§2.8) | Announced as | Politeness |
| --- | --- | --- |
| `PhaseChanged` | Only at the start of your turn and your Main Phase, merged with Refresh, Draw and DON!!: "Your turn 7. Drew Nami. 2 DON!! placed; 7 DON!! active." The opponent's phase changes are folded into the AI turn summary. | polite |
| `CardMoved`: draw | Yours: named. Opponent's: "Opponent drew 1." | polite |
| `CardMoved`: play | "Opponent played Kaido, cost 10, resting 10 DON!!." | polite |
| `CardMoved`: search or reveal to hand | Named only if revealed in the view: "Opponent added Nami to hand (revealed)." Otherwise "Opponent added 1 card to hand." | polite |
| `CardMoved`: to trash, deck, Life | Named for open destinations; counts only for secret ones. | polite |
| `DonPlaced`, `DonGiven` | Folded into the move: "Opponent gave 2 DON!! to Kaido; Kaido 12000." | polite |
| `PowerModified` (by effect) | Merged into the move's sentence: "…; your Zoro −2000 this turn, now 3000." Battle-only modifiers go in the battle sentence. | polite |
| `AttackDeclared` against you | When focus moves to the Defend panel, the panel heading carries it and no live message is sent. With "move focus" off: "Opponent's Kaido, 12000, attacks your Leader, 5000. Your decision." | **assertive** when focus does not move; otherwise none |
| `AttackDeclared` by you | "Zoro attacks opponent's Leader, 7000 vs 5000." | polite |
| `BlockerActivated` | "Opponent blocks with Jinbe, 6000." | polite |
| `CounterPlayed` | Merged per Counter Step: "Opponent countered +3000; Leader now 8000 vs your 7000." | polite |
| `DamageDealt` | "Hit. Opponent takes 1 damage, 3 Life left." For you: "You take 1 damage, 3 Life left; Life card added to hand: Sanji." | polite |
| `TriggerRevealed` | Opponent's: "Opponent reveals Trigger: Gum-Gum Red Hawk, <trigger summary>." Yours: through the Trigger prompt (§3.10). | polite |
| `KO` | "Your Zoro was K.O.'d." / "Opponent's Kid K.O.'d." | polite |
| `ReplacementApplied` | Named by its card: "Rosinante's effect: took a Life card instead of the K.O." | polite |
| `EffectActivated` | Folded into the move's sentence, by ability name: "Kaido [On Play]: K.O.'d your Zoro." | polite |
| Auto-skipped decision (§2.3) | "No Blockers available." / "No counters in hand." / "Effects resolved in the suggested order." | polite |
| Rewind | "Rewound to before: gave 3 DON!! to Zoro. Your Main Phase, turn 5." | polite |
| `GameEnded` | "You win: opponent's Leader hit at 0 Life. Review is ready." / "You lose: …" | **assertive** |
| `Anomaly` | Development builds only: "Engine anomaly logged." | polite |
| Hint, Why, Lethal results | "Hint ready: …" (first sentence only; the full text is in the coach panel). | polite |

**AI turns: summarised, not flooded.**
1. **Each move (default).** The AI's moves play one at a time at the chosen pace (§3.13). The announcer emits one sentence per move, timed to the animation. Speech cannot be detected, so the pace setting is the user's control. Step pace (wait for `.`) is suggested on the accessibility settings page for screen-reader users.
2. **Auto-collapse.** At 2× or Instant pace, or when more than 3 AI moves would be announced within 4 s, the announcer stops speaking each move and holds them for the summary. It still announces attacks that need your decision.
3. **End-of-turn summary**, always: "Opponent's turn 6: played Kaido and Nami; 3 attacks; you took 2 damage, Life 4 to 2; your Zoro was K.O.'d. Your turn 7. Drew Usopp. 7 DON!! active." Every detail is in the game log (`G`, `g`).
4. **Decisions inside the AI turn** (block, counter, trigger) always interrupt playback. The AI waits for you; nothing is skipped.

**Hidden information.** The announcer takes only projected events and the player's view. A unit test runs the announcer on two states that differ only by a permutation of hidden cards (the same pair the engine's leak test uses) and asserts the strings are identical.

## 10. WCAG 2.2 AA checklist: how each criterion is met

The criteria that need design decisions are listed here. The rest (for example 2.4.2 Page titled, 3.1.1 Language) are routine and are covered by axe and the M10 audit.

| SC | How |
| --- | --- |
| 1.1.1 Non-text content | Card art `alt=""`, with the name on the element; icons have labels; decorative chrome is hidden. |
| 1.3.1 Info and relationships | Zones are named groups; landmarks for header, board, coach (`aside`), log, main content; review timeline and matchup grid use real list and table semantics. |
| 1.3.2 / 2.4.3 Meaningful sequence, focus order | §3.1 table and test. |
| 1.3.4 Orientation | Exception risk R5 (§12). |
| 1.4.1 Use of colour | §6.1. |
| 1.4.3 / 1.4.11 Contrast | §6.2, §4.1. |
| 1.4.4 / 1.4.10 Resize, reflow | Documents reflow at 320 px. The board is a two-dimensional layout under the reflow exception, and at 200% it switches to `board.md`'s tablet layout. Risk R6. |
| 1.4.12 Text spacing | No fixed-height text boxes. Truncated card names keep the full name in the accessible name and in a tooltip. Tested by injecting the 1.4.12 spacing CSS in M10. |
| 1.4.13 Content on hover or focus | Hover zoom is dismissible (Escape), hoverable and persistent (§4.2). |
| 2.1.1 / 2.1.2 Keyboard, no trap | §3; dialogs trap focus intentionally and Escape always exits. |
| 2.1.4 Character key shortcuts | §3.15. |
| 2.2.1 / 2.2.2 Timing, pause | §8, §3.13. |
| 2.3.1 Three flashes | §7. |
| 2.4.7 / 2.4.11 Focus visible, not obscured | §4. |
| 2.5.1 Pointer gestures | Long-press zoom has `I` and the Inspect menu item; no multi-point gestures. |
| 2.5.2 Pointer cancellation | Actions fire on pointer-up; a drag dropped outside a legal target, or cancelled with Escape, does nothing. |
| 2.5.3 Label in name | Visible button text starts the accessible name ("End turn", not "Finish"). |
| 2.5.7 Dragging movements | Click is primary (PROMPT.md); drag is only an accelerator. |
| 2.5.8 Target size | §5. |
| 3.2.1 / 3.2.2 On focus, on input | Focus never triggers an action; toggles never commit. Only explicit commit buttons and Enter commit. |
| 3.2.6 Consistent help | Help (shortcut sheet, rules reference) is in the same header position on every page. |
| 3.3.1 / 3.3.3 Error identification, suggestion | `whyNot` text names the rule; import errors in the deck builder name the line and the fix. |
| 3.3.4 Error prevention | Irreversible game steps are confirmable or rewindable (principle 3); import never overwrites without a confirm. |
| 3.3.7 Redundant entry | Settings and deck choices persist locally. |
| 3.3.8 Accessible authentication | No accounts. |
| 4.1.2 Name, role, value | §9.1; custom widgets follow the ARIA Authoring Practices patterns named in §3. |
| 4.1.3 Status messages | §9.3. |

## 11. Testing

### 11.1 Automated (CI, every push)

| Check | Tool | Gate |
| --- | --- | --- |
| Axe on every distinct UI state: board in Explore, Target, Count, Pick, Order and Defend modes; inspector; trash list; rewind list; shortcut sheet; coach panel open; review with a flag selected; each tutorial step; each drill; deck builder; meta explorer; settings | `@axe-core/playwright`, tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa` | Zero violations. `incomplete` results are saved as a CI artifact and read at each milestone review. |
| Keyboard-only full game vs Rookie | Playwright, keyboard events only, no `click` | Must finish (PLAN M3). |
| Tab order matches §3.1 at both resolutions | Playwright | Exact sequence. |
| Focus visible and not obscured | Playwright: focus each element; screenshot the ring; occlusion sampling (§4.2) | No fully covered focused element. |
| Target size | Playwright box measurement (§5) | No undersized target without spacing. |
| Reduced motion | `page.emulateMedia({ reducedMotion: 'reduce' })`; assert no element has a running transform transition | Zero moving animations. |
| Forced colours | `page.emulateMedia({ forcedColors: 'active' })`; screenshots | Reviewed at M3 and M10. |
| Announcer strings | Vitest snapshots: one per event type and per setting, from planted scenarios | Snapshots match. |
| Announcer leak test | Vitest property test (§9.3) | Identical strings. |
| No network from logs and settings | Playwright request log during the tutorial and settings flows | Only the app origin and the art origins. |
| JSX lint | `eslint-plugin-jsx-a11y` | No errors. |
| Token contrast | Build-time script (PLAN M0) | All pairs pass. |
| Lighthouse accessibility | Lighthouse CI at M10 | ≥ 90 (PLAN M10). |

### 11.2 Manual screen-reader passes

**When:** M3, the learning slice (L), M7 (all three required by PLAN §5), and M10 (PLAN M10's audit), which repeats all three scripts.

**Matrix:**
- NVDA (current stable) with Firefox (current) and with Chrome (current), on Windows 11;
- VoiceOver with Safari, on the current macOS.

Versions are written into each pass record.

**Who runs them, and how** (proposed decision PD-4, §13):
1. **Scripted run (agent).** Guidepup (`@guidepup/playwright`) drives VoiceOver on macOS and NVDA on Windows and returns the spoken-phrase log (checked 2026-10-28: https://github.com/guidepup/guidepup). The agent runs each script below with Guidepup and saves the spoken log next to the pass record. VoiceOver runs locally on the owner's Mac. NVDA runs on a Windows GitHub Actions runner via a manual `workflow_dispatch` job, never per push. A subagent compares each log against the "expect" column.
2. **Human listening pass (owner or an invitee).** The same script by hand, with VoiceOver, about 30 minutes. NVDA by hand needs a Windows machine or VM; if the owner has none, the NVDA pass is the scripted run only, and the record says so (risk R9).

**Records:** `docs/design/a11y-passes/<milestone>-<reader>-<browser>.md`. Each record holds the versions, every step's result (pass, fail, or note), the spoken-log excerpt for any failure, and the findings with severity 0–4. Severity 3 and 4 findings block the milestone, as in the verification ritual.

**Setup common to all scripts:** a fresh profile; Settings defaults except "AI pace: Step"; scenario starts from fixed `ScenarioSpec` seeds so the expected text is stable; VoiceOver Quick Nav off; NVDA in its default configuration.

### 11.3 Script: M3 (board, every decision type)

Scenario: `a11y-m3` (hotseat off, vs Rookie, both decks with Blockers, Counters, a [Trigger] and a two-target effect).

| # | Do | Expect |
| --- | --- | --- |
| 1 | Load the game; press Tab from the page top | Skip link "Skip to board"; then the board's name "Game board, turn 1, your Main Phase" and its role description |
| 2 | Tab through every zone | Each zone in §3.1 order, with its name and count; empty zones say "empty" |
| 3 | `Q` | The status summary (§9.2) |
| 4 | Your hand: arrows; `I` on a card; Escape | Each card's name and playable state; the inspector opens with full text; focus returns to the card |
| 5 | Enter on a playable Character; choose Play | Menu items with costs; after playing: "Played Nami, rested 2 DON!!." Focus is on the new card or the hand |
| 6 | `+` on your Leader; Up twice; Enter | Count dialog "1 of N"; "3: Leader 8000"; "Gave 3 DON!! to Leader. Leader 8000." |
| 7 | `A` on a Character played this turn | "Nami can't attack: it was played this turn." No dialog |
| 8 | `E`, then confirm; let Rookie play its turn at Step pace, pressing `.` for each move | One sentence per AI move; the end-of-turn summary |
| 9 | When attacked: Defend panel | Focus moves to it; the heading reads the attack; Blockers listed with previews |
| 10 | Choose "Don't block"; stage two counters with Space; change one counter's target; Enter | Running total announced after each Space, including the tie wording; "Played 2 counters…"; then the result |
| 11 | Take a hit that reveals a [Trigger] | The Trigger prompt with two buttons; the result is announced |
| 12 | Your turn: `A` on the Leader; arrows; Enter; Enter | Only legal targets cycle; the confirm reads the `preview` maths; "Leader attacks…" |
| 13 | Resolve the two-target effect (Pick mode) | Count line "1 selected of up to 2"; an unavailable candidate gives its reason; commit |
| 14 | Resolve an `order` decision (two simultaneous triggers) | Grab, move and drop are announced with positions; commit |
| 15 | `U`, then `R`, then choose a move and confirm | The rewind sentence; the list reads each move; focus is restored per §4.3 |
| 16 | `?`, then Escape | Sheet dialog read; focus returns |
| 17 | Settings → Single-key shortcuts off; back to the board; press `A` | Nothing happens; the action menu still offers Attack |
| 18 | Play to the end (Rookie) | `GameEnded` is announced assertively; review link reachable |

Pass: every step's expectation is heard, with no step needing a pointer or sighted help.

### 11.4 Script: learning slice (L)

Scenario: `a11y-l` (Rocks vs Kaido, a planted position with lethal available, then the planted missed-lethal record).

| # | Do | Expect |
| --- | --- | --- |
| 1 | Declare an attack; `M` | The battle panel reads attacker power, defender power, the gap, and counters needed |
| 2 | Confirm the attack and let the AI defend | One sentence for its Counter Step with the new totals, for example "Opponent countered +2000; Leader now 7000 vs your 7000. Tied: the attacker wins ties." The battle panel's text matches |
| 3 | `L`, `L`, `L` | Tier 1 "Lethal: yes, proven against any hand"; tier 2 the number of hits; tier 3 the line as an ordered list in the coach panel |
| 4 | `C`; read the panel with the virtual cursor or VO navigation | Browse mode works there; headings and lists are present |
| 5 | Turn on the lethal detector; play on to a position where it changes | Silent by default; with "Coach alerts: on", one polite "Lethal available" |
| 6 | Open the review of the planted record | The timeline toolbar; `N` to the flag; the flag's text with its certainty label |
| 7 | Enter on the flag | The board restores read-only; focus moves to the explanation; `Q` reads the restored position |
| 8 | "Practice this" | The puzzle opens; untimed; the board model is unchanged |
| 9 | Answer with the line; or "Declare no lethal" | The result and the explanation are announced politely and are readable in a document region |

### 11.5 Script: M7 (tutorial and coach)

| # | Do | Expect |
| --- | --- | --- |
| 1 | First launch, choose the beginner path, start the tutorial | The step text region is read; `P` re-reads it; no timers anywhere |
| 2 | Each of the 8 steps: follow the instructions using only keys from the step text and the shortcut sheet | Each constrained step offers only the taught action; "Show me" moves focus to it; the step completes |
| 3 | Exit at step 4; reload; resume | Resumes at step 4 with focus on the step text |
| 4 | Finish the tutorial; start a game vs Rookie | Game starts; nothing explains it except the app |
| 5 | `H` during your Main Phase | "Hint ready: …"; `C` reads the line and reason |
| 6 | Let the AI move; `W` | The explanation for the last AI move |
| 7 | Switch on the blunder warning; make the planted blunder | The warning is part of the confirm dialog's description, read with it; it never auto-dismisses |
| 8 | Tempo meter on | Its value is in the coach panel as text, not announced unless "Coach alerts" is on |
| 9 | Settings → Opponent moves: Turn summary only; play one AI turn at 2× | Only the end-of-turn summary, plus any decision prompt |

### 11.6 M10 audit

All three scripts on all three reader and browser pairs, plus:
- 200% browser zoom and the text-spacing CSS on the board, tutorial, review and settings;
- forced colours;
- the colour-vision screenshots;
- Lighthouse ≥ 90;
- a full keyboard-only game vs Warlord by hand (PROMPT.md Done when).

## 12. Exceptions and known risks

| # | Risk | Likelihood / impact | Mitigation |
| --- | --- | --- | --- |
| R1 | **`role="application"` on the board.** Users lose browse-mode reading inside the board; some screen-reader users find application regions disorienting. | Medium / high | All long text lives outside the region (coach, log, inspector, review explanations). `Q` and `Shift+Q` speak the board. The board's description says how to leave it (Tab past the hand, or `C`). Verified in the M3 pass. **Fallback** if the M3 pass fails: no application role; each zone becomes a `listbox` (cards as options, actions through a menu button beside the list), and single-key shortcuts are off by default for screen-reader users. |
| R2 | **Card images contain the card text** (1.1.1, 1.4.5). | Certain / medium | The image is decorative (`alt=""`). The card's text comes from the data in the name, the description and the inspector. Card art is third-party content whose presentation is the card itself; our own UI never uses images of text. |
| R3 | **Upstream card-text errors** reach the screen-reader user unseen (optcgapi defects, ADR 0007). | Medium / medium | Verified overrides for all 182 meta cards (PLAN M1). The inspector names the data source; the "effect not automated" badge is spoken. |
| R4 | **Single-key shortcuts** collide with assistive technology or habits. | Medium / medium | Focus-scoped, can be switched off, reserved keys never used (§3.15); verified in every manual pass. |
| R5 | **Orientation (1.3.4).** PROMPT.md specifies a "rotate to play" screen for phone portrait. Locking the board to landscape needs the "essential" exception. | Medium / medium | Only the board shows the prompt. Every other route works in portrait. The prompt has a "Continue in portrait" link that renders the board scaled with scrolling, never a dead end (proposed decision PD-5). |
| R6 | **Resize and reflow on the board** (1.4.4, 1.4.10). At 200% zoom, a 1280×720 window is effectively 640×360. | High / medium | The board is a two-dimensional layout, which the reflow exception covers. At small effective viewports `board.md`'s tablet layout applies. The prompt bar, battle panel and inspector are the readable channels and scale with text. Checked at M10. |
| R7 | **Live-region reliability**, especially VoiceOver with Safari (dropped or merged messages). | Medium / medium | Persistent regions, alternating nodes, no identical repeats, one sentence per move, and the game log as the fallback record. Verified per pass. |
| R8 | **AI pace vs speech.** The app cannot know when speech has finished, so moves can overrun speech. | Medium / medium | Step pace, the turn summary mode, auto-collapse (§9.3), and pause on `K`. |
| R9 | **No Windows machine** for a human NVDA pass. | Medium / medium | The scripted Guidepup NVDA run on a Windows CI runner; a human pass when the owner has Windows access (a VM is enough). Records state which kind of pass ran. |
| R10 | **No native screen-reader users** among the participants. The owner and the agent are sighted operators, and a sighted pass misses real-use problems. | High / medium | Follow the ARIA Authoring Practices patterns closely. Invite a screen-reader user if the owner knows one (`usability-plan.md`). Any accessibility claim in STATUS.md says which passes ran. |
| R11 | **Focus obscured at 1280×720** by the hand fan, coach panel or menus. | Medium / medium | §4.2 rules and the occlusion test. |
| R12 | **DON!! badge legibility** at 1280×720. | Medium / low | One badge per card with a count, at least 20 px tall, part of the card's target (§5). |
| R13 | **Contrast over card art**, which varies, and all available art carries the SAMPLE watermark. | Medium / medium | Numbers sit on chips; scrims are tuned to the worst case; the card-face study (Phase 4) covers it. |
| R14 | **Drag-only habits** from other simulators. | Low / low | Click is primary; drag is optional (2.5.7). |
| R15 | **Hover zoom** (1.4.13). | Low / medium | Dismissible, hoverable and persistent; suppressed after keyboard input (§4.2). |
| R16 | **Timed drills** (2.2.1). | Low / low | Off by default, adjustable, and switchable off mid-item (§8). |

## 13. Proposed decisions and open questions

Each is ready to be copied into `docs/DECISIONS.md` (which this agent does not edit) once accepted.

**PD-1. The board is one `role="application"` region with roving focus.** *Context:* the board needs arrow keys and single-key shortcuts, which browse mode intercepts. *Decision:* one application region for the board, with named zone groups and full announcements; reading content stays outside it. *Alternatives rejected:* per-zone `listbox` (selection semantics do not fit cards that carry action menus; kept as the R1 fallback); a single `grid` (Tab leaves a grid by convention, and the row and column announcements are noise for zones of unequal size); no role (arrows would be eaten by browse mode).

**PD-2. Multi-step actions collect input locally and commit once.** *Context:* the engine takes one pick at a time with `intentId` grouping (ARCHITECTURE §2.3). *Decision:* the Count, Pick, Order and Defend modes stage locally, send the engine actions in canonical order on one commit, and Escape never sends anything. *Alternatives rejected:* sending each pick as it is made (each pick would be a separate rewind step, and a half-made choice would be a live game state); a numeric "give N" engine action (rejected by E-D4 for search reasons).

**PD-3. Staged-set validity comes from scratch `reduce`, not a new engine API.** *Context:* the multi-select and counter staging need "can this card join the set?" without UI rules. *Decision:* the session store applies the staged picks in canonical order to a scratch copy with `reduce` and checks `legalActions` at each step. If that costs more than 16 ms per keystroke in M3, add an engine helper `checkPicks(state, picks) → { ok, selectable[], reason }`, which is an ARCHITECTURE §2.1 change. *Alternatives rejected:* UI-side validation (breaks the boundary); committing picks one by one (PD-2).

**PD-4. Screen-reader passes are scripted with Guidepup plus a human VoiceOver pass.** *Context:* PLAN requires manual NVDA and VoiceOver passes, the agent cannot listen, and the owner is on macOS. *Decision:* §11.2. *Alternatives rejected:* axe only (it cannot judge announcements); skipping NVDA (it is the most-used screen reader on Windows); paying for a remote audit (not in scope).
**Open question for the owner (not blocking):** do you have access to Windows (a machine or a VM) for a human NVDA pass at M10?

**PD-5. Phone portrait shows the rotate prompt with a way past it.** *Context:* PROMPT.md asks for a rotate screen; WCAG 1.3.4 forbids orientation lock unless essential. *Decision:* a rotate prompt only on the board route, with "Continue in portrait". *Alternatives rejected:* a hard lock (fails 1.3.4 for mounted devices); a full portrait board (non-goal in PROMPT.md).

**PD-6. Focus moves to decisions the human owes by default.** *Context:* when the AI attacks, a keyboard or screen-reader user must find the Defend panel. *Decision:* focus moves there, and a setting turns it off. *Alternatives rejected:* announcement only (users must hunt for the prompt); a modal dialog (it hides the board the player needs in order to decide).

## 14. What the other Phase 4 documents must carry over

- **`board.md`:** the §3.1 order, or an updated table here; the preview well for hover zoom (§4.2); one DON!! badge per card, at least 20 px tall at 1280×720 (§5); cost-area targets as two class buttons; the coach panel docked, not floating; the tablet layout used at 200% zoom.
- **`flows.md`:** the modes in §3.2 and their Escape rules; Defend panel order (§3.10); which steps confirm; that "take the hit" is never a single key.
- **`visual-system.md`:** focus-ring tokens (§4.1), legal-target vs focus decorations (§4.1, §6.1), chip and scrim tokens (§6.2), reduced-motion replacements (§7).
- **`learning-ui.md`:** coach panel structure (§3.12), tiered lethal text, review keyboard model (§3.16), and the rule that the coach never takes focus.
- **Wireframes:** must support the keyboard path for S0's keyboard task (`usability-plan.md` §5.1).
