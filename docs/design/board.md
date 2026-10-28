# Board

**As of:** 2026-10-28 (Phase 4, revision 1)
**Inputs:** `PROMPT.md` (Phase 4 "Board layout", Accessibility, Performance), `principles.md`, `docs/research/rules-digest.md` §D, §E, §I, `docs/ARCHITECTURE.md` §2.3, §2.7, §4.1, §5, `docs/plan-review-1.md` UX-5, UX-7, UX-9, UX-10, `docs/research/competitive-teardown.md`.
**Companion files:**
- `visual-system.md` and `tokens.css`: colours, type, motion.
- `card-face-study.md`: what the card face shows under the SAMPLE watermark.
- `flows.md`: step-by-step interaction scripts.
- `learning-ui.md`: coach content.
- `accessibility.md`: the key map and screen-reader detail.

This file owns geometry, zone behaviour, the input model and pacing. Where it touches those other files, it gives the dock and the dimensions; they own the content.

**Method.** Every rectangle below comes from a calculator script (`.cache/design/layout.mjs`, not committed). It derives card size from the vertical budget, checks the horizontal fit of the widest row, and writes the tables in this file. M3 should port it into `app/src/board/layout.ts` so the app and this document cannot drift apart.

**Unobserved.** No layout here copies a competitor. Where a choice is compared with SeaKing or DuelVoyager, their behaviour is **unobserved** (teardown §1, §2). The comparisons with MTG Arena and Hearthstone are general genre conventions, not teardown findings.

---

## 1. Structure

The screen has two columns, and neither ever reflows during a game:
- **The board** (left). It holds both players' fields, the midline band and your hand.
- **The rail** (right). From top to bottom it holds the rail header, the event log, the coach and the decision panel.

```
1280×720                                               board 960 │ rail 320
┌──────────────────────────────────────────────────────────────────┬──────────────────────┐
│ Opp identity      [▯▯▯▯▯▯  6 cards]  opponent hand (backs)        │ ≡  Rules  ⚙  ⤢       │ rail header
│ ┌DON┐┌cost area──┐┌Life──┐  ┌Leader┐  ┌Stage─┐        ┌Deck┐┌Trash┐ │ Event log            │
│ │ 6 ││▮▮▮▮ ▬▬    ││≡≡≡≡ 4│  │ OPP  │  │      │        │ 32 ││ 12  │ │  T5 Opp · Kaido…     │
│ └───┘└───────────┘└──────┘  └──────┘  └──────┘        └────┘└─────┘ │  T5 You · Countered… │
│              [C1]   [C2]   [C3]   [C4]   [C5]   opponent characters │  …                   │
│ Opponent thinking…   Turn 5 · Your turn · Refresh›Draw›DON!!›[Main]›End   ⧉ 2 waiting │
│              [C1]   [C2]   [C3]   [C4]   [C5]   your characters     ├──────────────────────┤
│ ┌DON┐┌cost area──┐┌Life──┐  ┌Leader┐  ┌Stage─┐        ┌Deck┐┌Trash┐ │ Coach ▸ Hint · Why   │
│ │ 4 ││▮▮▮ ▬▬▬    ││≡≡≡≡≡5│  │ YOU  │  │      │        │ 30 ││ 8   │ ├──────────────────────┤
│ └───┘└───────────┘└──────┘  └──────┘  └──────┘        └────┘└─────┘ │ Decision panel       │
│   [h1] [h2] [h3] [h4] [h5] [h6]                     your hand       │ (battle panel here)  │
│                                                                    │ [Rewind] [End turn ▸]│
└──────────────────────────────────────────────────────────────────┴──────────────────────┘
```

**Reading order.** Read from top to bottom: opponent hand, opponent Leader row, opponent Characters, midline, your Characters, your Leader row, your hand. Then the rail: log, coach, decision. This is also the Tab order (principle 7). Character rows face each other across the midline, because Characters are what attack and get attacked. The Leader rows sit behind them, as on the official playmat (Play Guide zone diagram, teardown §6).

**The opponent is mirrored vertically, not rotated.** The opponent's rows are reflected across the midline: their Leader row is at the top and their Characters face yours. Their zones stay in the **same columns** as yours: Life above Life, DON!! above DON!!, Deck above Deck. A real table rotates the opponent 180°, which puts their Life on your right. We do not copy that, because comparing like with like in one vertical glance is what makes principle 1 work. Opponent cards are drawn upright, never upside down. (Proposed decision PD-2.)

**Both Leaders sit on one vertical axis.** The axis runs through both Leader slots, the centre Character slots, the turn indicator and the centre of the hand. At the desktop targets the axis is the board's centre. On tablets it shifts right by the minimum needed to fit the Leader row (§6).

---

## 2. Cards

### 2.1 Aspect ratio and sizes

- **Aspect ratio:** 63:88 (width:height), the physical card (63 × 88 mm). In CSS, `--card-h = --card-w × 88 / 63`.
- **Corner radius:** 4.5% of width (`--card-radius`), close to the printed card.

| Target | Board and hand card | Slot (Character, Leader, Stage) | Preview dock card art |
|---|---|---|---|
| 1280×720 | **84 × 117** | 117 × 117 | 168 × 235 |
| 1920×1080 | **126 × 176** (exact 63:88) | 176 × 176 | 240 × 335 |
| Tablet 1180×740 | 86 × 120 | 120 × 120 | 152 × 212 |
| Tablet 1024×690 | 80 × 112 | 112 × 112 | 144 × 201 |
| Short desktop 1280×600 | 77 × 108 | 108 × 108 | 140 × 196 |
| **Minimum legible** | **76 × 106** | 106 × 106 | n/a |

84 × 117 is 0.3% off the true ratio. The art is drawn with `object-fit: cover`, so the error is a sub-pixel crop.

**Slots are square: they are as wide as a card is tall.** A rested card is turned 90° in place, so it needs the card's height as width. Making every rotatable slot square (Characters, Leader, Stage) means resting or untapping never moves a neighbour. The cost is about 33 px of horizontal space per slot at 1280. We have that space, because height binds before width at every target.

**Card size comes from height.** The vertical budget at each target is:

`viewport height = strip + 5 gaps + hand gap + midline + bottom margin + 5 card heights`

That is four field rows plus the hand. In short-height mode it is 4.6 card heights, because the hand peeks at 60% (§6.3). The script then checks that the Leader row fits horizontally.

### 2.2 Minimum legible card size: 76 × 106

At board size the printed text on any scan is unreadable: a 117 px card prints its effect text at about 4 px. So "legible" does not mean the printed card. It means that our own overlays and the art stay readable. The minimum is set by three constraints, and the tightest one wins.

1. **The badge row must fit "10000" next to the cost.** Live power reaches five digits in ordinary play: a 5000 Leader with five DON!! given, or a buffed Character. The power plate uses 13 px bold tabular figures, five digits wide plus 3 px padding, about 46 px. The cost disc is 18 px, and there are three 2 px insets. That is about 72 px in total, so **76 px is the narrowest card where the two plates sit side by side without overlapping.** This was verified in a rendered mock-up: at 76 px with the tightened tokens, about 2 px stay clear. With the first, larger token values, the 76 px card overlapped the cost disc. Below 76 px the plates collide, or the power falls under the 13 px floor.
2. **Numerals stay at or above 13 px bold, and text at or above 12 px.** 13 px bold Inter has a cap height of about 9.5 px, the size of desktop menu text at arm's length. That is the smallest size at which "8000" and "6000" are told apart at a glance with open digits (`ss01`, `visual-system.md`).
3. **About half of the art must stay uncovered.** At 76 px the cost, power, DON!! and keyword plates cover about 40% of the art window in the recommended face (`card-face-study.md`). Smaller than that, and the plates become the card.

Touch target size never binds: 76 × 106 is well above the 44 px comfort target. Below 76 px the layout does not shrink further. It changes mode (§6), and below the minimum supported viewport the board does not render (§6.4).

### 2.3 Where the badges sit

Badges are opaque plates (`--color-plate`) with theme-invariant colours, so contrast never depends on the art underneath. They scale with card width through the `--badge-*` tokens. They **stay upright when the card is rested** and re-anchor to the corners of the rotated card's bounding box, so a rested card's power reads exactly like an active one.

Board card (Leader, Character, Stage):

```
┌───────────────────────┐
│(3)          [ 7000 ▲] │  TL: cost disc. TR: live power plate. Both cover the printed values.
│                       │
│        art            │
│                       │
│[◆2]               [⛨] │  BL: given DON!! count. BR: keyword icons (up to 2, then "+1").
│ name (footer, per face study)
└───────────────────────┘
   └ DON!! token edges peek 3 px under the bottom edge, one per given DON!!, at most 3
```

| Position | Badge | Shows | Rules |
|---|---|---|---|
| Top-left | **Cost** disc | Live cost (Characters, Stage, Events in hand). The Leader has none. | A modified cost shows the live value in buff or debuff colour with an ▲ or ▼ glyph. The base value is in the preview. A cost below 0 shows as 0, the floor outside calculations (digest item 18). |
| Top-right | **Power** plate | Live power from `derive` (ARCH §2.5) | Up from base: `--color-plate-buff` plus ▲. Down: `--color-plate-debuff` plus ▼. Negative power shows with a minus sign (digest item 17). During a battle, the attacker's and defender's power plates grow 1.25× to tie them to the battle panel. |
| Bottom-left | **DON!!** badge | ◆ glyph plus the number given | On your turn the badge is solid. On the opponent's turn your given DON!! stay attached but add no power (digest item 82), so the badge turns to outline style and its accessible name says "2 DON!! given, no power on opponent's turn". |
| Bottom-right | **Keywords** | Icons for [Blocker], [Rush], [Double Attack], [Banish], [Unblockable], [Rush: Character] | Each icon has its keyword as its accessible name and tooltip. At most 2 show, then a "+N" chip. |
| Left edge, 36% down (hand only) | **Counter** plate | "+1000" or "+2000" | Only in the hand and in the Counter step, where it matters (digest item 93). It sits where the counter is printed, so it covers it. |
| Above or below the card, centred (rested only) | **State** chip | ⟳ icon plus the word "Rested" | It sits in the free band a rotated card leaves inside its square slot. That band is 16.5 px at 1280, enough for a 16 px chip. |
| Top edge, centred (when it applies) | **Status** chip | "New" (played this turn, can't attack); "Effect not automated" (unscripted, ARCH §2.4) | Icon plus word at roomy density. Icon only at compact density, with the word in the tooltip and accessible name. |

Hand cards use the same positions, plus the Counter plate. Events show cost (TL) and a timing chip ("[Counter]", "[Main]") where power would sit. A card with [Trigger] shows a Trigger icon among its keywords.

### 2.4 Active vs rested

Rested is shown by **three cues, none of them colour**:
1. **Rotation:** the card turns 90° clockwise inside its square slot.
2. **An icon and a word:** the "⟳ Rested" chip (icon only at compact density on DON!! tokens, §3.4).
3. **A small brightness drop on the art** (−12%). The plates are not dimmed. This cue is tertiary and never relied on.

Active cards carry no state chip, because active is the default. The screen reader name always states the state: "Roronoa Zoro, Character, rested, 7000 power, 2 DON!! given".

Motion: the rotation takes `--dur-base` (200 ms) with `--ease-standard`. Under reduced motion it is instant, with a 120 ms fade on the state chip.

### 2.5 Card states (visual)

| State | Treatment (never colour alone) |
|---|---|
| Legal (has an action in this decision) | 3 px `--color-accent` ring at 3 px offset plus a soft glow, **and** a corner glyph naming the action: ▶ play, ⚔ can attack, ◆ can receive DON!!, ⌖ can be targeted, ⚡ ability ready |
| Selected (source of the current move) | Raised 6 px with `--elev-2`, a solid ring, and a ✓ "Selected" chip; the decision panel names it |
| Target candidate (in targeting mode) | Legal ring plus a ⌖ crosshair glyph. Non-candidates get `--color-dim` (50%) only while the mode lasts. |
| Chosen (in a multi-pick) | Ring plus a numbered chip (1, 2, …) in pick order; the decision panel shows "2 of 3 chosen" |
| Staged Counter (hand) | Raised 16 px, a ✓ chip, and a "+2000 staged" tag |
| Attacking / attacked | Attack arrow (§3.10); an "Attacking" chip on the source; ⌖ on the target |
| Opponent's acting card (AI turn) | 3 px `--color-opponent` ring plus a "playing", "attacking" or "activating" word chip during the highlight and dwell |
| Hover | Raised 2 px; preview after 250 ms (§3.12) |
| Focus | Two-tone focus ring: 2 px `--color-focus` outside a 2 px `--color-focus-gap`, at 4 px offset, outside any legal ring. Never covered (§3.12). |
| Changed since you last looked (after "Skip") | A "New", "+2000" or "K.O.'d" ghost chip for 2 s or until the next input |

Focus and legal combine: the legal ring sits inside and the focus ring outside it, and the two read as different things. That was checked in the mock-up (`card-face-study.md`).

---

## 3. Zones

### 3.1 Exact rectangles at 1280×720

All values are CSS px from the viewport's top-left. "Opp" means opponent. The axis is x = 480.

| Zone | x | y | w | h | Notes |
|---|---:|---:|---:|---:|---|
| Opponent identity | 16 | 0 | 238 | 32 | "Opponent · Warlord · Kaido" (leader name, AI tier), status word ("Thinking") |
| Opponent hand (backs) | 270 | 0 | 420 | 32 | Backs peek from the top edge; "6 cards" label; known cards face up with a "Known" tag (ARCH §2.7) |
| Opp DON!! deck | 20 | 49 | 60 | 100 | Back plus count |
| Opp DON!! cost area | 88 | 40 | 185 | 117 | Active row and rested row (§3.4) |
| Opp Life | 289 | 40 | 117 | 117 | Face-down stack plus count (§3.3) |
| Opp Leader slot | 422 | 40 | 117 | 117 | Card 84×117 centred; on the axis |
| Opp Stage slot | 555 | 40 | 117 | 117 | Square, so a rested Stage fits |
| Opp Deck | 768 | 40 | 84 | 117 | Back plus count |
| Opp Trash | 860 | 40 | 84 | 117 | Top card face up plus count; opens the trash viewer |
| Opp Character slots 1–5 | 172, 297, 422, 547, 672 | 165 | 117 | 117 | Pitch 125; slot 3 on the axis |
| Midline band | 16 | 290 | 928 | 40 | Left: opponent activity. Centre: turn and phase (520 wide, x 220–740). Right: pending-effects chip. |
| My Character slots 1–5 | 172, 297, 422, 547, 672 | 338 | 117 | 117 | |
| My DON!! deck | 20 | 472 | 60 | 100 | |
| My DON!! cost area | 88 | 463 | 185 | 117 | |
| My Life | 289 | 463 | 117 | 117 | |
| My Leader slot | 422 | 463 | 117 | 117 | |
| My Stage slot | 555 | 463 | 117 | 117 | |
| My Deck | 768 | 463 | 84 | 117 | |
| My Trash | 860 | 463 | 84 | 117 | |
| My hand | 16 | 592 | 928 | 117 | Cards 84×117, 8 px gap, centred on the axis; 10 cards before overlap |
| Rail header | 960 | 0 | 320 | 44 | Game menu (Concede, Rematch, Settings), Rules reference, Fullscreen |
| Event log (coach collapsed) | 960 | 44 | 320 | 380 | 32 px header plus about 17 lines at 20 px |
| Coach (collapsed) | 960 | 424 | 320 | 48 | Strip of coach buttons (Hint, Why, Lethal, DON!! math, Tempo) with state badges, per `learning-ui.md` |
| Event log (coach open) | 960 | 44 | 320 | 148 | At least 5 lines |
| Coach (open) | 960 | 192 | 320 | 280 | Content per `learning-ui.md` |
| Decision panel | 960 | 472 | 320 | 248 | 36 header, 148 body, 64 footer (Rewind plus a 48 px primary button) |
| Preview dock (default) | 872 | 8 | 400 | 456 | Over the log and coach only; never over the decision panel (§3.12) |

The vertical budget: strip 32, five 8 px gaps, a 12 px hand gap, a 40 px midline, five rows of 117, and an 11 px bottom margin, for 720 in total.

### 3.2 Exact rectangles at 1920×1080

The axis is x = 760. Gaps are 12, the hand gap 16, margins 24.

| Zone | x | y | w | h |
|---|---:|---:|---:|---:|
| Opponent identity | 24 | 0 | 397 | 48 |
| Opponent hand (backs) | 445 | 0 | 630 | 48 |
| Opp DON!! deck | 68 | 77 | 91 | 143 |
| Opp DON!! cost area | 171 | 60 | 277 | 176 |
| Opp Life | 472 | 60 | 176 | 176 |
| Opp Leader slot | 672 | 60 | 176 | 176 |
| Opp Stage slot | 872 | 60 | 176 | 176 |
| Opp Deck | 1232 | 60 | 126 | 176 |
| Opp Trash | 1370 | 60 | 126 | 176 |
| Opp Character slots 1–5 | 296, 484, 672, 860, 1048 | 248 | 176 | 176 |
| Midline band (turn and phase at x 500–1020) | 24 | 436 | 1472 | 56 |
| My Character slots 1–5 | 296, 484, 672, 860, 1048 | 504 | 176 | 176 |
| My DON!! deck | 68 | 709 | 91 | 143 |
| My DON!! cost area | 171 | 692 | 277 | 176 |
| My Life | 472 | 692 | 176 | 176 |
| My Leader slot | 672 | 692 | 176 | 176 |
| My Stage slot | 872 | 692 | 176 | 176 |
| My Deck | 1232 | 692 | 126 | 176 |
| My Trash | 1370 | 692 | 126 | 176 |
| My hand (11 cards before overlap) | 24 | 884 | 1472 | 176 |
| Rail header | 1520 | 0 | 400 | 56 |
| Event log (coach collapsed / open) | 1520 | 56 | 400 | 640 / 288 |
| Coach (collapsed / open) | 1520 | 696 / 344 | 400 | 48 / 400 |
| Decision panel | 1520 | 744 | 400 | 336 |
| Preview dock (default) | 1432 | 8 | 480 | 728 |

At 1920 the extra width becomes space beside the Character rows (272 px each side) and between Stage and Deck. It is not used to grow the cards, because height already binds. We leave that space empty on purpose. It is where attack arrows and their labels travel, and the board stays calm.

### 3.3 Life

- **Face down, count visible.** Life is a stack of our own card backs, laid **landscape** as on the physical mat, inside a square box. Each card sits offset by `min(0.1w, (h − w) / (n − 1))`, so 4, 5 or 7 Life stay individually countable. A count plate shows the number at power size, plus the word "Life" at caption size, at the box's bottom-right.
- **Order.** The top of the Life pile is drawn nearest the midline, so "the top card" (digest items 64 and 107) has a visible place. Taking damage animates that card off the stack.
- **Face-up Life** (added face up by an effect, digest item 46) shows face up in its position with a "Face up" chip.
- **0 Life.** The empty box shows "0 Life · next hit loses", with a warning icon, the warning colour and the words. Colour is not the only cue.
- **Hidden.** Life contents are never in the view (ARCH §2.7). Hover shows only the count and the rule ("Life cards are face down; neither player may look", CR 3-10-2).

### 3.4 DON!! deck, cost area and given DON!!

The real DON!! card art is not used. DON!! appear as our own **tokens**: a rounded rectangle at 63:88 with a ◆ glyph, `--color-don` fill. The token is about 0.29 card width (24 × 34 px at 1280).

- **DON!! deck:** a token back plus a count ("6"). It is an open area (CR 3-3-2), so hover lists its contents, which are always DON!!.
- **Cost area:** two labelled rows inside the zone.
  - **Active row**, on top: upright tokens, labelled "Active 4".
  - **Rested row**, below: tokens **rotated 90°** in `--color-don-rested`, labelled "⟳ Rested 2".

  Rested DON!! are told apart by four cues: row, rotation, icon and label. When there are more than 7 tokens in a row, they overlap with an even pitch, and the label keeps the exact count. Each row's count is also part of the zone's accessible name: "Your cost area: 4 active, 2 rested".
- **Given DON!!:** shown on the card they boost. There is a BL badge "◆2", and up to 3 token edges peek 3 px below the card's bottom edge, echoing the physical tuck. The card's live power already includes their +1000 each, on its owner's turn only (§2.3). When a card with given DON!! leaves the field, its tokens animate back to the **rested** row (digest item 84). At Refresh they animate to the rested row and then everything untaps (digest item 67), in that order, so the rule is visible.
- **DON!! −X costs** return tokens to the DON!! deck (digest item 86). The animation goes to the deck, not the cost area, and the log line says so.
- **Glance totals.** The midline band does not repeat the DON!! counts. Each cost area's labels are the single home (principle 8).

### 3.5 Deck, trash and hand

- **Deck:** our card back plus a count plate. At 5 cards or fewer, a warning chip shows "5 left" (deck-out loses at once, digest item 3). It is not openable.
- **Trash:** the top card face up (the same face treatment as the board), a count plate, and the ▤ "Open" affordance on hover and focus. Clicking it or pressing Enter opens the **trash viewer**. That is a dialog docked over the rail's log area, with a scrim over the rail only. It lists cards newest first with filters by category, and Esc closes it and returns focus. Both trashes are open areas (CR 3-5-2).
- **Your hand:** face up, in the order you chose (ARCH §2.7), centred on the axis, with an 8 px gap.
  - Above 10 cards at 1280 (11 at 1920), cards overlap with an even pitch.
  - A hovered or focused card rises by 25% of its height and comes to the front, so it is never covered.
  - Drag to reorder (keyboard: `accessibility.md`).
- **Opponent hand:** backs in canonical order (ARCH §2.7), peeking from the top edge, with "N cards". A known card (revealed and still in hand) shows face up at strip size with a "Known" tag, and the preview works on it.

### 3.6 Stage

A square slot to the right of the Leader. When empty, it shows the label "Stage". A rested Stage rotates like a Character. Replacing a Stage animates the old one to the trash first (digest item 79).

### 3.7 Character area

Five fixed square slots. A new Character takes the empty slot **nearest the centre**: 3, then 2, 4, 1, 5. Cards **never move** when a neighbour leaves, which protects spatial memory. Empty slots show a faint outline (`--color-mat-line`), and the label "Character area" appears in the centre slot when all five are empty.

**Playing a sixth Character** (digest item 78) is not a separate screen. The engine owes a `choose` decision, all five Characters get the target treatment with the label "Trash 1 to make room (not a K.O.)", and the decision panel explains the rule.

### 3.8 Midline band: phase indicator and turn counter

The midline band is the board's one fixed status line. It sits between the Character rows, where the eye rests.

- **Centre (on the axis): turn and phase in words.** It reads `Turn 5 · Your turn`, then a five-step phase stepper: `Refresh › Draw › DON!! › Main › End`.
  - **The current phase** is a filled chip with an ▸ marker, `aria-current="step"` and bold weight. Past phases are muted; future phases are outlined.
  - **On the opponent's turn** it reads `Turn 6 · Opponent's turn`, with the opponent identity tag (orange fill plus the word "Opponent").
  - **During a battle** the Main chip expands into battle sub-steps: `Main › Battle: Attack › Block › Counter › Damage`. They collapse back at End of the Battle (CR 7-1-5).
  - **The turn counter counts game turns from 1**, as the CR does (digest item 71: "no battle on your first turn" is turn 1 or turn 2). Hover adds "(your 3rd turn)".
- **Left: opponent activity.** "Opponent is thinking…" with a static icon plus an animated ellipsis (static under reduced motion). Or the last AI move in a few words ("played Kaido"). It is empty on your turn.
- **Right: the pending-effects chip.** "⧉ 2 waiting" whenever the resolution queue or `pendingTriggers` is not empty (principle 4). Clicking it shows the queue in order in the decision panel.

The band is 40 px high at 1280 and 56 px at 1920. All of its text is 14 px or larger.

### 3.9 End Turn and the decision panel

The **decision panel** is the single home for "what am I deciding" (principle 8). It docks at the bottom of the rail, next to your hand, because most defensive choices (Counters) come from the hand.

- **Header (36 px):** the decision in words, for example "Your Main phase" or "Counter step · you are defending", plus a `?` that explains the step.
- **Body (148 px at 1280, 220 at 1920):** context and choices for the decision, or the battle panel (§3.10).
- **Footer (64 px):** **Rewind** (secondary, left; hidden in modes without rewind) and the **primary button** (right, 48 px tall at 1280 and 56 at 1920, at least 136 px wide).

The primary button always sits at the same coordinates. Its label is the action:

| State | Primary | Secondary |
|---|---|---|
| Your Main phase, idle | **End turn** (sub-label: "2 can attack · 3 DON!! unused") | Rewind |
| Source selected | none; the action list is in the body | Cancel |
| Attack target chosen | **Confirm attack** (sub-label: "7000 vs 5000") | Cancel |
| Block step (defending) | **No block** or **Block with Nami** | (choices in the body) |
| Counter step (defending) | **Take the hit** (Life 4 → 3), or **Counter +2000 · survive** once a Counter is staged | Clear |
| Trigger revealed | **Activate Trigger** or **Add to hand** (two equal buttons) | none |
| Effect choice | **Done** (enabled at the minimum count) | Reset |
| Opponent's turn | **Skip to my decision** | speed control in the body |
| Game over | **Review game** | Rematch |

**End Turn is not confirmed.** It is rewindable in practice modes (principle 3). The live sub-label carries the information that a confirm would have nagged about. Shortcuts are in `accessibility.md`; this file reserves one key for the primary button.

### 3.10 Battle panel

The battle panel lives in the decision panel's body for the whole battle, from target selection to End of the Battle, on both sides. It is the "DON!! math overlay" of PROMPT's learning UI, made a permanent part of play (teardown decision 3). `learning-ui.md` adds the coach layer on top: the explanations, and the lethal context.

```
BATTLE · Counter step              Attack › Block › [Counter] › Damage
Attacker  Roronoa Zoro                         7000
          5000 base + 2000 DON!!
Defender  Your Leader · Monkey.D.Luffy   5000 → 7000
          5000 + 2000 staged (Sanji)
──────────────────────────────────────────────────
✕ Hit lands. Ties go to the attacker.  Need +1000 more.
Counters in hand: 3 cards, up to +5000 · 1 Event needs 1 DON!!
[ Clear ]                       [ Take the hit · Life 4 → 3 ]
```

- **Numbers:** attacker power and defender power at `--num-battle` (28 px at 1280, 36 px at 1920), tabular, right-aligned so the digits line up. Each has a one-line breakdown from `preview` (ARCH §2.1): base, DON!!, effects, staged Counters.
- **Gap and result:** one line with an icon, a word and colour together.
  - "✕ Hit lands", in attack colour.
  - "✓ Attack fails", in success colour.
  - "✕ K.O.", for a Character target.

  When it is a tie, the line says "Ties go to the attacker" (CR 7-1-4-1). The need is stated as "Need +1000 more", the smallest step that reverses the result.
- **Counters available:** from your hand, as a count and a total: "3 cards, up to +5000". [Counter] Events show their DON!! cost, and affordability comes from `legalActions`. Each listed Counter is also lit in the hand. Clicking a lit hand card stages it and updates every number at once through `preview`.
- **Live in every step:**
  - **Block step:** the panel lists the legal Blockers with the projected result for each ("Nami 5000 vs 7000 → Nami is K.O.'d").
  - **Choosing a Blocker:** the arrow re-routes to it on the board, and the defender line changes.
  - **Counter step:** staging and unstaging update everything.
  - **Damage step:** the panel shows the result for 600 ms at 1× before the Life card moves.
- **Attacker's side** (your attack): the defender line shows their power. The need line reads "They need +3000 to survive · 4 cards in hand". Any estimate of their Counters carries a certainty word (principle 9) and belongs to the coach, not the panel.
- **Double Attack and Banish** add a line: "Double Attack: 2 damage" or "Banish: Life card is trashed, no Trigger".
- **On the board, at the same time:** a 4 px `--color-attack` arrow runs from the attacker to its target, dashed while you are choosing and solid once declared, with a ⌖ on the target. Both power plates grow 1.25×. The Blocker re-route bends the arrow and adds a "Blocked by Nami" label.

### 3.11 Event log (always visible)

- **One line per player-level move**, grouped by `intentId` (ARCH §2.3). A chevron expands a line into its engine actions. Turn headers separate turns: "Turn 5 · You".
- **Line anatomy:** `[You|Opp tag] verb phrase · numbers`. For example: "Opp · Kaido attacks your Leader · 9000 vs 5000", "You · Counter: Nami +1000 · 5000 → 6000", "Hit · your Life 4 → 3". The actor tag is a filled chip with a word (You / Opp), so the actor is never shown by colour alone. The verbs and numbers are the battle panel's own, so the two never disagree.
- **Linked cards:** card names in a line are buttons. Hovering or focusing one highlights the card on the board and opens its preview. On your own moves in practice modes, a "Rewind to here" action appears.
- **Scroll:** newest at the bottom, and it auto-follows unless the user has scrolled up. Then a "↓ 3 new" pill appears.
- **Semantics:** `role="log"`. Screen-reader announcements go through a separate live region (`accessibility.md`), so the visual log can be dense without being chatty.
- **Never fully hidden.** When the coach is "tall" (§3.13), the log keeps a 3-line ticker.

### 3.12 Hover, long-press and focus preview

The preview shows the card bigger, with our own rendering of its text, so it is legible whatever the image source. It has five parts:
- **The art.** The full scan, SAMPLE watermark included (`card-face-study.md`), or the text card if the image fails.
- **Identity:** name, ID, category, colours as words, types and attribute.
- **Stats:** printed and live cost, power and counter, with a breakdown of each live value ("7000 = 5000 base + 2000 DON!!, your turn only").
- **Effect and Trigger text** at `--text-md`, with an "Effect not automated" warning chip for unscripted cards (ARCH §2.4).
- **Active modifiers** with their durations ("−1000 until end of turn, from Kaido").

**The dock.** It is 400 × 456 at 1280 (x 872, y 8) and 480 × 728 at 1920. It overlays the log and coach and the board's right margin, and **never covers the decision panel**. While you choose Counters from the hand, you can therefore read a card and see the battle maths at the same time.

**Placement rule (WCAG 2.4.11 Focus Not Obscured).** Before opening, the dock checks whether its default rectangle intersects the rectangle of the **focused or hovered element**. That element is the one being previewed or, for a log link, the link itself. If it does, the dock opens at its alternate position: the board's top-left (x = margin, y = strip + gap). If both positions intersect, which no layout here produces, it shrinks to the free side. The preview never takes focus and is `aria-hidden`, because the card's own accessible description carries the same information.

| Trigger | Behaviour |
|---|---|
| Mouse hover | Opens after 250 ms. Moving to another card swaps instantly (hover intent). Closes 150 ms after the pointer leaves the card and the dock. |
| Keyboard focus | Opens after **400 ms of dwell**, so arrowing through a row doesn't flash. A setting "Preview on focus" (default on) controls it. Esc hides it until focus moves. A key toggles it on demand (`accessibility.md`). |
| Long-press (touch) | 450 ms. Opens **pinned** with a visible ✕. A tap outside closes it. Moving more than 8 px before 450 ms cancels it and starts a drag instead. |
| Drag in progress | Suppressed. |

Raised hand cards, popovers and the dock all keep the focused element visible. The rail and decision panel are columns, not overlays, so sticky chrome never covers focus.

### 3.13 Coach dock and reflow

The coach is a **collapsible panel in the rail**, between the log and the decision panel. It is never a modal. `learning-ui.md` owns its content.

| Coach state | 1280 height | 1920 height | Log height | Board |
|---|---|---|---|---|
| Collapsed (default) | 48 | 48 | 380 / 640 | unchanged |
| Open | 280 | 400 | 148 / 288 (≥ 5 lines) | unchanged |
| Tall (for a long explanation or a lethal walkthrough) | to the log ticker | to the log ticker | 3-line ticker (76 px) | unchanged |

**The board does not reflow when the coach opens.** The coach takes height from the log, never width from the board. This is deliberate: a board that shifts when help appears punishes the player for asking (principle 8). The panel animates its height over `--dur-slow` (instant under reduced motion). Focus moves into the coach only when the player opened it by keyboard. The collapsed header still shows the coach's live state ("Lethal: off", "Hint ready"), so nothing the coach knows is hidden behind the collapse.

---

## 4. Input model

### 4.1 Click first, drag as an accelerator

**Click (tap) is the primary input. Drag is an accelerator for the same moves. Every move also has a keyboard path.** Click is primary for four reasons:
- it works the same with a mouse, a trackpad, touch and the keyboard;
- it keeps precise targeting off the wrist;
- it lets each move pause for a confirm where one is due;
- it is what the keyboard model maps onto.

Drag exists because experienced players expect it, and it saves one click per move. (Proposed decision PD-3.)

### 4.2 Selection model

There is at most **one selected source** at a time. The board is always in one of five modes, and the decision panel names the mode.

1. **Idle.** Legal sources are lit (§2.5).
2. **Source selected.** Click a lit card. It rises with a ✓, an **action popover** anchors to it, and the decision panel lists the same actions. The popover lists only legal actions, each with its consequence:
   - "Play · 3 DON!!"
   - "Attack"
   - "Give DON!!"
   - "Activate: Main · ① rest 1 DON!!"

   An illegal action that a player might expect appears disabled with its `whyNot` reason ("Attack: played this turn, no [Rush]"). That is the only place a disabled action is shown. It teaches without offering.
3. **Targeting.** For a field card that can attack, **attack is the default action**. Selecting it lights its legal attack targets straight away with ⌖. A click on a target goes directly to confirm, skipping the popover. Other actions stay in the popover.
4. **Confirm.** For attacks only, from the main phase. The battle panel shows the preview and the primary button reads "Confirm attack". Enter confirms and Esc steps back one mode.
5. **Committed.** The engine applies the action, the log writes the line, and the board returns to idle. In DON!! mode it stays in DON!! mode (below).

**Click outside or Esc** steps back one mode. Clicking an unlit card in idle shows its `whyNot` in a small popover and selects nothing.

**Playing a card.** Click the hand card, then "Play". If the card has no choices to make, it is played (no confirm; Rewind undoes it). If it does have choices (On Play targets), they follow as an effect-choice decision in the decision panel (`flows.md`).

**Giving DON!!** There are two paths, and both produce one log line and one rewind step per recipient.
- **DON!! mode (fast):** click your cost area's active row, or a token in it. The decision panel says "Giving DON!! · 4 active". Every legal recipient, meaning your Leader and Characters, lights with ◆. Each click on a recipient gives 1 DON!!, and its badge and power tick up at once. The mode stays on until you press Esc, click empty mat, click Done, or run out of active DON!!. Consecutive gives to the same card share one `intentId`, so the log reads "Give 3 DON!! to Zoro".
- **From the card (precise, and the keyboard path):** select the card, then "Give DON!!". A stepper `− 1 +` (up to your active count) and a Give button appear in the popover.

**Counter staging and multi-pick** use the staged and chosen states (§2.5). A pick is offered only while the choice can still be completed. The UI sends picks to the engine in canonical order on commit (ARCH §2.3). `flows.md` owns the scripts.

### 4.3 Drag (accelerator)

| Drag | Drop | Result |
|---|---|---|
| Hand card (playable) | Anywhere on your field | Same as Play. Choices follow in the decision panel. |
| Your attacker | A lit target | Goes to the **confirm** state. It is not committed on drop. |
| Active DON!! token (or the active row) | A lit recipient | Gives 1 DON!!. Drag again for more. |
| Hand card | Another hand position | Reorders the hand. |

- A drag starts after 8 px of movement. On touch, it starts after 8 px once the long-press timer has been cancelled.
- While dragging, the lit targets are the same as in click mode. The dragged card follows the pointer at `--elev-drag`, and the attack arrow follows it.
- Dropping on an unlit area snaps the card back with its `whyNot` as a toast near the drop point. Nothing reaches the engine.
- A drag never commits anything that click mode would confirm.

### 4.4 Keyboard (summary; `accessibility.md` owns the key map)

- Tab moves between regions in reading order (§1). Arrow keys move within a region, Enter or Space selects, and Esc steps back.
- Every mode in §4.2 is reachable. Targets are cycled with the arrow keys in targeting mode.
- The primary button has one dedicated key in every state.
- Focus is never moved by the AI's actions. When a decision arrives for the human, focus goes to the decision panel's first choice, and a live-region announcement accompanies it.

---

## 5. Pacing of AI turns

**Target:** a typical AI turn takes **8 s or less at 1× speed**, including animation and excluding the time the human spends in their own Block, Counter and Trigger decisions (ARCH §4.1).

### 5.1 How a move is shown

Each AI move plays as **highlight → move → dwell**, then the log line. The source card gets the orange ring and a word chip for `--dur-highlight`. The card or token travels for `--dur-move`. The board then holds still for `--dur-dwell` so a person can read the result. Moves never overlap. The next move's highlight starts only after the previous dwell ends (principle 4).

### 5.2 Time budget at 1×

| Segment | Duration at 1× | Notes |
|---|---:|---|
| Refresh + Draw + DON!! | 700 ms | One composite animation: given DON!! return rested, then untap, then draw, then the new DON!! arrive. The worker starts `planTurn` at the **start** of this segment, because these steps are forced. |
| Visible thinking (Warlord) | ≤ 1,800 ms | The 2.5 s plan minus the overlap with the segment above. Rookie and Pirate: 0. Emperor: up to about 5.3 s, and the UI says "Emperor thinks longer". |
| Each main-phase move (play, give DON!! group, activate) | 600 ms | 120 highlight + 240 move + 240 dwell |
| Each attack declaration | 600 ms | 120 highlight + 240 arrow + 240 dwell. The battle panel opens for the human. |
| Each damage resolution | 600 ms | 360 Life flip and travel + 240 dwell |
| End Phase | 300 ms | |
| **Typical turn:** 3 moves, 3 attacks, 2 hits | **7,500 ms** | 700 + 1,800 + 1,800 + 1,800 + 1,200 + 300 |
| Heavy turn: 6 moves, 4 attacks, 3 hits | 10,600 ms, then compressed to ≈ 8,900 ms | See the compression rule below |

**Compression rule.** Once a turn's queued animation passes 6 s, the dwell on **non-attack** moves drops from 240 to 120 ms for the rest of that turn. Attacks keep the full dwell, because the human must follow every attack aimed at them. Compression never applies under 0.5× or in step mode.

**Thinking only when it is real.** The "thinking" state appears only if the animation queue is empty **and** the worker has not answered within 300 ms. That avoids a flicker on every move. In thinking:
- the midline left reads "Opponent is thinking…";
- the opponent identity chip shows "Thinking";
- the decision panel shows an indeterminate bar (a static "Thinking" label under reduced motion) and the speed control.

Defensive decisions by the AI (block, counter, trigger; 0.4 s budget) follow the same rule, so a fast answer shows no thinking state.

### 5.3 Controls

- **Speed:** a segmented control with `0.5×`, `1×`, `2×`, `4×`, in the decision panel during AI turns and in Settings. It scales highlight, move and dwell by 1/speed. Think time does not scale. At 4×, attacks aimed at the human keep at least 240 ms of dwell. The default is 1×; the tutorial forces 0.5×.
- **Step mode** ("Pause after each opponent move", off by default, on in the tutorial): the AI waits after each move. The primary button reads "Next move", and the AI continues on that key.
- **Skip to my decision** (the primary button during AI turns): finishes the queued animations instantly until the human owes a decision or the AI turn ends. Skipped moves are still logged, and those log lines are marked "skipped". On return, every card that changed carries a "changed" chip for 2 s, and the decision panel shows a one-line recap ("While skipped: played Kaido, gave 2 DON!!, attacked twice").
- **Reduced motion** sets move and damage times to 0 (instant placement with a 120 ms fade) and **doubles the dwell to 480 ms** (`tokens.css`). Turn length therefore changes by about ±10%, and the opponent never becomes harder to follow because motion is reduced (principle 10).

**Unobserved.** We do not know how SeaKing paces its AI or what speed control it offers. The owner hands-on (PLAN §1 row 6) should note it, and the slice checkpoint should revisit this budget against it.

---

## 6. Adaptations

### 6.1 Rules the layout follows at any size

1. Card height comes from the vertical budget. If the Leader row (or the Character row) does not fit horizontally at that size, the layout steps through these modes, in order, until it fits:
   - shift the axis right by the minimum needed;
   - narrow the rail (320 → 280 → 264);
   - narrow the cost area (2.2 → 1.9 card widths);
   - stack Deck and Trash as half-height tiles;
   - switch the hand to peek mode;
   - **otherwise do not render the board** (§6.4).
2. Cards never go below 76 × 106.
3. The rail, the log and the decision panel exist at every supported size.

### 6.2 Tablet landscape

Touch changes the input model more than the geometry:
- There is no hover. Long-press opens a pinned preview.
- Every button is at least 44 × 44, and the primary button is 48.
- Click-first selection works unchanged with taps.
- Drag works but starts only after 8 px of movement, and never conflicts with scrolling, because the board never scrolls.

| Viewport (Safari, landscape) | Card | Rail | Axis | Changes from desktop |
|---|---|---|---|---|
| 1180 × 740 (11" iPad) | 86 × 120 | 280 | x 483 (shifted 33 px right) | Rail 280. Preview dock 360 wide. Decision panel 264 high. |
| 1024 × 690 (10" iPad and smaller) | 80 × 112 | 264 | x 430 (shifted 50 px right) | Rail 264. Cost area 1.9w (152 px). **Deck and Trash stack** as half-height tiles (80 × 52 each): deck count, and the trash's top card cropped to its art. Hand: 8 cards before overlap. |
| 1366 × 1024 (13" iPad) | desktop rules | 320 | centre | Same as 1280, with more height. |

The full 1180 and 1024 rectangle sets are produced by the layout script, and M3 renders them from the same code. Representative rows at 1024 × 690:
- My Leader slot: 374, 448, 112 × 112;
- My Character slots: x 134 to 614, y 328;
- My Deck: 668, 448, 80 × 52;
- My Trash: 668, 508, 80 × 52;
- My hand: 12, 570, 736 × 112;
- Decision panel: 760, 426, 264 × 264.

### 6.3 Short desktop windows (real 720p screens)

A 1280 × 720 **screen** gives a browser viewport of only about 1280 × 600 once browser chrome is subtracted. Below a 650 px viewport height the layout switches to **compact height**:
- the hand **peeks**: 60% of each card shows, which keeps cost, power and Counter visible, because all hand badges sit in the top 60%;
- the hovered or focused card rises fully;
- gaps drop to 6 px, the strip to 28 and the midline to 36.

At 1280 × 600 this gives 77 × 108 cards, which is legible. The rail header offers **Fullscreen** (the Fullscreen API), and the first game on a short window suggests it once.

### 6.4 Minimum supported viewport and the phone screens

The board needs a viewport of at least **968 × 590 CSS px**. That figure is computed from the 76 px card with every compaction applied. We test the floor at 1024 × 600. Below it, the board does not render.

**Phone portrait: "rotate to play"**, which PROMPT requires. A full-screen message replaces the board:
- our own line icon of a device turning, about 96 px;
- the heading "Turn your device sideways to play";
- the line "The board is designed for landscape";
- links to everything that works in portrait (Rules reference, Meta Explorer, Glossary, Card browser).

These reading pages are responsive. The game state is kept, so rotating resumes exactly where the player was.

**But a phone in landscape is still below the floor.** An iPhone 15 in landscape is about 852 × 393 viewport. At that height the cards would come out about 46 px wide, well below the minimum. So the screen is chosen by whether rotating would actually help:
- **If the device's landscape size meets the floor** (an iPad in portrait, large foldables), show "Turn your device sideways to play".
- **If it does not** (phones), show "The board needs a bigger screen". It explains that games are played on a tablet or computer, offers the same reading links, and says that a game in progress is saved on this device.

Showing "rotate to play" on a phone that cannot fit the board would promise something the next screen breaks. (Open question OQ-1, proposed decision PD-5.)

---

## 7. Performance notes that bind the layout

- **No layout shift when art arrives.** Every card box has fixed dimensions from the layout, and the face renders its text frame first (`card-face-study.md`). The image only fills the art window.
- **Image size.** Images are requested at the slot size where the source allows. optcgapi serves only 600 × 838, so the browser downscales; the service worker caches it (ARCH §5).
- **Animation.** Animations use only `transform` and `opacity`, so moves, rotations and the hand rise are compositor-only. The attack arrow is one SVG path per battle. The 60 fps budget (PROMPT Performance) is checked by the M10 trace on the board at both targets.
- **Fixed geometry.** The layout is recomputed only on resize (debounced 100 ms), never per frame.

---

## Open questions

- **OQ-1. Phone landscape.** PROMPT gives phone portrait a "rotate to play" screen, but a phone in landscape (about 850 × 390) is below the board's minimum (968 × 590) at legible card sizes. Should v1 tell phone users the board needs a bigger screen (PD-5)? Or does the owner want a separate phone-landscape layout, for example Leader and Characters in one row, Life and DON!! as counters, and the hand as a drawer? That would be new scope, and its cards would still be about 60 px wide. *Current best answer:* tell the truth on phones; no phone board in v1.
- **OQ-2. Opponent orientation.** A vertical mirror (zones in the same columns as yours) reads better on a screen. A 180° rotation matches a real table, where their Life is on your right. Does the owner, as a paper player, find the mirror disorienting? *Current best answer:* mirror (PD-2). Confirm in the first owner session (`usability-plan.md`).
- **OQ-3. End Turn without a confirm.** The proposal relies on the live sub-label ("2 can attack · 3 DON!! unused") plus Rewind. In a mode without Rewind (a future ranked-like mode), should ending the turn with unused attackers need a confirm? *Current best answer:* there is no such mode in v1; revisit if one is added.
- **OQ-4. Pacing against the baseline.** The 600 ms per move and the 8 s target are reasoned from first principles. SeaKing's pacing is **unobserved**. The owner hands-on should time one SeaKing AI turn and note its speed controls, and the slice checkpoint should compare.
- **OQ-5. Turn counter wording.** "Turn 5" counts game turns, as the CR does. Some players count "my turn 3". The proposal shows game turns, with "(your 3rd turn)" on hover. Is that the owner's mental model?

## Proposed decisions

**PD-1. Two columns: a fixed board and a fixed rail.** *Context:* at 1280 × 720, height is the scarce dimension and width is spare. The log must always be visible, the coach must be a collapsible side panel, and the battle maths must be on screen during battles. *Decision:* the board takes the left column and sizes its cards from height. A right rail (320 px at 1280, 400 at 1920) stacks the log, the coach and the decision panel, and the battle panel lives inside the decision panel. Opening the coach takes height from the log and never reflows the board. *Alternatives rejected:*
- the coach as a second column that squeezes the board: at 1280 the Leader row would drop below the minimum card size;
- a battle panel floating over the centre of the board: it covers the cards it describes;
- a log drawer: it fails "always visible".

**PD-2. The opponent mirrored vertically, with zones in the same columns as yours.** *Context:* principle 1 needs Life, DON!! and deck counts compared at a glance, and the brief says the opponent is mirrored at the top. *Decision:* the opponent's rows are reflected across the midline, their Characters face yours, their Leader row is at the top, and each zone sits in the same column as yours. Their cards render upright. *Alternatives rejected:*
- a 180° rotation like a real table: it puts their Life opposite yours across the board and needs upside-down art or inconsistent positions;
- a full copy of your layout, with Characters at the top edge: it puts Leaders next to each other across the midline and Characters far apart, which breaks the attack geometry.

**PD-3. Click-to-select is primary; drag is an accelerator; every move has a keyboard path.** *Context:* PROMPT defaults to both, with click primary. Touch, keyboard and confirm steps all favour click. *Decision:* a single-source selection model with an action popover, where attack is the default action of an attacker. A click on a lit target goes straight to confirm. Drags produce exactly the same states and never bypass a confirm. DON!! giving has a persistent DON!! mode for speed and a stepper for precision. *Alternatives rejected:*
- drag as primary: imprecise on trackpads and touch, and no keyboard analogue;
- a modal action menu for every click: it adds a step to the most common move, the attack.

**PD-4. AI turns are paced as highlight, move and dwell (600 ms per move at 1×), with thinking shown only when it is real.** *Context:* UX-5 requires an AI turn of 8 s or less at 1× and a design for perceived time. *Decision:* the per-segment budget in §5.2 (typical turn about 7.5 s), with the worker planning while the forced phases animate, dwell compression after 6 s (never on attacks), speeds of 0.5× to 4×, step mode, and "Skip to my decision" with a recap. Reduced motion keeps or lengthens the dwell instead of removing it. *Alternatives rejected:*
- a fixed per-move delay with no thinking state: it hides real waits;
- an instant AI with only a log: it fails principle 4;
- a "thinking" spinner on every move: it flickers and teaches the user to ignore it.

**PD-5. Phones get an honest screen.** *Context:* the board needs at least 968 × 590 at legible card size, and phones are below that in either orientation. *Decision:* a device whose landscape size meets the floor gets "Turn your device sideways to play". A phone gets "The board needs a bigger screen" with links to the reading features. Both keep the game state. *Alternatives rejected:*
- "rotate to play" on every portrait phone: it promises a board that then cannot render;
- a scaled-down board on phones: about 46 px cards breaks principles 1 and 6.

**PD-6. The minimum legible board card is 76 × 106, and below it the layout changes mode instead of shrinking.** *Context:* printed text is unreadable at board size, so legibility depends on our overlays. A rendered mock-up showed that five-digit power and the cost disc collide below about 76 px. *Decision:* 76 × 106 is the floor. The layout reaches its compact modes (§6.1) before it gets there, and the board does not render below the supported viewport. *Alternatives rejected:*
- abbreviating power ("10k"): it costs precision in battle maths, the thing the product teaches;
- dropping the cost badge on the board: it hides a value that many removal effects key on ("cost 3 or less").
