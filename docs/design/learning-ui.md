# Learning UI

**As of:** 2026-10-28 (Phase 4, first draft for the UX-director review)
**Inputs:** `PROMPT.md` (Learning layer, AI opponent, Phase 4 "Learning UI"); `docs/plan-review-1.md` (UX-1, UX-3, UX-4, UX-9, UX-12); `docs/ARCHITECTURE.md` §4.4 (lethal search), §4.5 (`Explanation`), §5 (worker priorities, 300 ms blunder cap); `docs/content/curriculum.md` (lesson IDs, untimed exit criteria); `docs/research/strategy-concepts.md` (concept slugs).
**Companions:** `flows.md` (how each screen is reached and operated, keyboard paths, announcements), `explanations.md` (finished copy for 20 explanations, used as snapshot tests). Layout dimensions and tokens belong to `board.md` and `visual-system.md`.

## 1. What the learning UI is for

SeaKing is reported to tell a player that they missed lethal (unobserved). This product has to teach the player to see it next time (PROMPT "Reference products"). Four rules follow, and every component below is checked against them.

1. **Teach the count, not the answer.** Wherever a computer could just show the line, the UI first offers the player a way to work it out (tiered lethal detector, guided count, "Show" before "Do").
2. **Never interrupt.** Nothing in the learning layer takes focus, opens over the board, or makes a sound unless the player asked for it or switched it on (PROMPT principle 5). The full contract is in §2.2.
3. **Say how sure you are.** Every finding carries a certainty label that a player can read without a glossary, and an unchecked turn is never shown as clean (teardown decision 7).
4. **Every claim has numbers and a source.** The `Explanation` shape (ARCHITECTURE §4.5) forces a claim, evidence with board numbers, an outcome in player units, a rule of thumb, a lesson and citations. The UI shows all of them, in a fixed order, at a depth set by the coach verbosity setting.

## 2. Coach panel

### 2.1 Placement and states

- **Where.** The right-hand column that `board.md` reserves for the log. The coach and the log share that column: when the coach is expanded, the log collapses to its last three lines at the bottom of the column. The coach never covers the playmat, the hands or the battle panel. (This depends on `board.md` keeping that column; if it does not, this section must change, not the playmat.)
- **Collapsed (the rail).** A 48 px strip with five icon buttons, each with a text label on hover and focus and an accessible name: Hint, Why, Lethal, DON!! math, Tempo. A button can carry a **badge**: a small shape with a number or glyph. Badges are the only way the coach signals anything unprompted, and only for features the player has switched on (§2.2).
- **Expanded.** The rail's full width: 320 px at 1280×720 and 400 px at 1920×1080 (`board.md` is the source of truth for layout). Sections stack in a fixed order: **Hint**, **Why**, **Lethal**, **DON!! math**, **Tempo**. Each section has a header row that collapses it on its own. The panel scrolls inside itself.
- **Toggle:** the rail's chevron or `/` (proposal; `accessibility.md` owns keys). Expanding never moves focus into the panel unless the player pressed a coach key (H, W, L), in which case focus goes to that section's result.
- **Remembered** per profile: expanded or collapsed, and which sections are open.

### 2.2 The interruption contract

| Feature | What may happen without the player asking | How it shows | What never happens |
| --- | --- | --- | --- |
| Hint | Nothing | — | No hint is computed or shown unless requested |
| Why | Nothing; each AI move gets a quiet "Why?" link in the log | Link only | The coach does not open to explain the AI |
| Lethal detector, "Ask me" (default) | Nothing | — | No background search |
| Lethal detector, tier 1 or 2 always on | Badge on the Lethal rail button when the state changes ("Lethal" or "2 hits"); a polite SR line | Badge shape plus text; no colour-only meaning | No line is ever revealed without a press; focus never moves |
| DON!! math | Numbers inside the battle panel, which is already open | In-panel | No overlay on the playmat unless switched on |
| Tempo meter | Its bar updates as DON!! are spent | In the rail | No end-of-turn nag |
| Blunder warning (off by default) | When on: an inline warning next to the commit control, only at commit time, only if analysis finishes within 300 ms | Inline text and a changed button label | No dialog; no warning if analysis is late; never more than once per decision |

A test in M7 asserts this table: with every coach feature at its default, a full game produces zero coach-initiated focus changes, zero coach-initiated panel expansions and zero assertive announcements from the coach.

### 2.3 Rendering an `Explanation`

One component renders every explanation in the product: hints, "why", review flags, drill answers, the blunder warning and the lethal detector's tier 3. Its anatomy, top to bottom:

1. **Claim.** One sentence, set as the section's heading. "You had lethal this turn."
2. **Certainty chip.** Text plus a distinct shape, never colour alone (§4.3 has the copy).
3. **Evidence.** A list, one line per `Evidence`. Arithmetic is written out ("9000 − 5000 + 1000 = 5000"). Card names are chips that open the inspector and, on hover or focus, highlight the card on the board.
4. **Line.** Numbered steps (`Move[]`). Each has **Show** (highlights the cards and draws the arrow on the board, or on the restored board in review). In a live game, step 1 also has **Do step 1**, which stages it; the player still commits (flows F9).
5. **Outcome.** A chip in player units: "Wins the game", "+2 cards for 1 Life".
6. **Next time.** A short callout with the rule of thumb.
7. **Lesson link.** "Lesson: Lethal math (L15)", opening the curriculum lesson and its drill.
8. **Sources.** A disclosure, closed by default: rule numbers link to the rules reference; strategy tags link to `sources.md` entries.

**Verbosity** (Settings → Coach):

| Level | Shown open | Behind "More" |
| --- | --- | --- |
| Learner | Claim, certainty, evidence, line, outcome, next time, lesson | Sources |
| Standard (default) | Claim, certainty, line, outcome | Evidence, next time, lesson, sources |
| Terse | Claim, outcome | Everything else |

Verbosity never changes the words, only how much is open. The snapshot tests in `explanations.md` therefore cover every level at once.

**SR:** the component is a region named by the claim. Reading order is the anatomy order. Evidence lines are a list. "Show" buttons have names such as "Show step 2 on the board: attack Kaido with your Leader".

### 2.4 Hint

- **Request:** the Hint button or H, at any decision you owe (flows F9).
- **States:** idle → **Thinking** (indeterminate bar, "Esc to stop", typical 1.5–2.5 s, worker priority 2 of 4, ARCHITECTURE §5) → **Result** or **Best found** (`search-incomplete`) → **Stale** ("Board changed: ask again") once the player does something not in the line.
- **A hint is a line, not a move** (plan-review UX-3). For a Main Phase it is the turn: plays, gives, attacks in order, and how it ends ("End turn: Nami sets your 5 DON!! active"). For a defence it is the staged set ("Stage Rocks Pirates and Buckin; no block"). For a choice it is the picks. See `explanations.md` E15.
- **Alternatives.** Under the line, "Other lines" lists up to two alternatives with their outcome chips and one sentence each on why they are worse ("Sanji instead: ends with 3 active DON!!, +6000 defence"). These come from the same feature differences as the reason (ARCHITECTURE §4.5).
- **Progress.** Hints used are recorded per decision; Progress shows "hinted decisions" per game. A hint never marks a game as rewound.

### 2.5 Why

- **Request:** Why or W for the last AI move; "Why?" links on any AI log line or battle-panel row (flows F10).
- **Content:** the stored `Explanation` from that decision. Only public information (flows D9). AI turn plans show executed steps only; the rest reads "Further steps hidden until played".
- **Empty states:** "Only legal move." for forced moves. "Rookie picks a random legal move, except that it always blocks or counters a lethal attack." for Rookie.
- Examples: `explanations.md` E12 (block), E13 (counter), E14 (turn plan), E16 (leader ability).

### 2.6 Lethal detector

Covered in §3, because it is the centre of lethal teaching. In the panel it is the **Lethal** section; on the rail, the Lethal button and its badge.

### 2.7 DON!! math overlay

The arithmetic of every battle, shown where the battle is.

- **In the battle panel (always on).** Attacker power, defender power, and the line **"Need 3000 to stop it"**. The arithmetic ("7000 − 5000 + 1000; ties go to the attacker") shows on hover, focus, or permanently at Learner verbosity.
  - **On your attack**, the panel adds "What they could have": active Blockers, visible on-attack effects with their numbers, and the public bound on their hand ("3 cards: up to +12000 if each is one of their deck's +4000 Events"). The bound comes from the archetype prior used by `public` lethal search (ARCHITECTURE §4.4).
  - **On defence**, it adds "What you have": staged and available counters, active DON!! for Event costs and leader effects (flows F6).
- **On the board (setting "DON!! math on the board", default off).** While you are giving DON!! or selecting an attacker, each legal target shows a small "+4000 to stop" tag computed from `preview`. This turns DON!! allocation into something the player can see before attacking.
- **Rules it teaches:** ties go to the attacker (CR 7-1-4-1); DON!! add power only on your turn (CR 6-5-5-2); battle boosts end at end of battle (CR 7-1-5). Each appears as a footnote line the first three times it is relevant per profile.

### 2.8 Blunder warning

Off by default (PROMPT "Coach"). When on:

1. **Precompute.** When a decision starts, the coach asks the worker (priority 3 of 4) to score the current best line. When the player points at or focuses a commit control, it asks for the score of that specific action. Most of the time the answer is ready before the press.
2. **At the press.** If the pressed action's score is below the best line by more than the threshold, and the answer is available **within 300 ms of the press**, the commit does not happen. The control's label changes to **"Commit anyway"** and an inline note appears directly above it with the claim and the alternative: "Setting 4 DON!! active switches your Leader's defence off. Set 2 instead? · Use the better choice · Commit anyway". See `explanations.md` E17.
3. **If the analysis is late,** the press commits normally and nothing is shown, ever, for that decision (ARCHITECTURE §5). A late warning that arrives after the move would be noise.
4. **Once per decision.** "Commit anyway" commits with no further check.
5. **Mute by kind.** Each warning has "Don't warn me about this" (for example "ending with DON!! unused"), stored per profile and listed in Settings.
6. **Threshold.** Expressed in the heuristic's units and tuned in M7; the design requirement is that it fires only for clear mistakes (losing lethal, giving lethal away, wasting a whole turn's DON!!), not for close calls.
7. **SR (polite):** "Warning: setting 4 DON!! active switches your Leader's defence off. Press Enter again to commit anyway, or choose the better option."

### 2.9 Tempo meter

A small horizontal bar in the rail (and a larger one in the expanded panel) of this turn's DON!!.

- **Segments**, left to right, each with a distinct pattern as well as a tint: **Paid** (rested to pay costs), **Given** (attached), **Held for a purpose**, **Unused**. Example label: "8 DON!! · 4 paid · 1 given · 3 held".
- **Held for a purpose** is what makes the meter honest. Active DON!! count as held, not unused, when something can spend them on the opponent's turn: the cost of a [Counter] Event in your hand, or an opponent-turn effect such as OP13-001 Luffy's leader (up to 5 active DON!!). This is the same rule as curriculum L09's exit criterion, so the meter and the review agree.
- **Expanded view** shows a one-line explanation of DON!! efficiency and the current state: "3 active DON!! with nothing to spend them on their turn. Giving them to an attacker adds +3000 now." With OP13-001: "5 active DON!! held for your Leader: up to +10000 on their turn." (`explanations.md` E06, E07)
- **End of turn:** the meter freezes for the opponent's turn showing your last turn's split, then resets at your Refresh.

## 3. Lethal teaching

### 3.1 The tiered detector

Plan-review UX-4: lethal must be taught, not only detected. The detector answers in three tiers, and the player chooses how far to go each time.

| Tier | What it says | Example copy |
| --- | --- | --- |
| 0 | Nothing (off, or not asked) | — |
| 1 | Whether lethal exists, with certainty | "Lethal is on the board. Works against any hand." |
| 2 | How many hits, and how many attackers you have | "You need 3 hits. You have 3 attackers that can hit their Leader." |
| 3 | The full line, as an `Explanation` | `explanations.md` E20 |

- **Asking:** the Lethal button or L. The first press shows tier 1; each further press reveals the next tier. "Count it with me" (§3.2) sits between tier 2 and tier 3.
- **Always-on settings:** "Tier 1 always on" or "Tier 2 always on" runs the search in the background (worker priority 4, lowest) at the start of each of your Main Phases and after each of your moves, and sets a badge. Tier 3 always needs a press.
- **Both players.** On your turn it checks your lethal. On the opponent's turn, once they enter their Main Phase, it checks their lethal against you, using your real hand for your defence and public information for their hand: "Their board threatens lethal: you must stop 2 of their 3 attacks." That is the moment a player needs to plan the defence.
- **Modes** (ARCHITECTURE §4.4): live play always uses `public` (proofs hold against any plausible hand). Review uses `actual` as well and labels the difference (§4.3). Open-hands games use `actual`, labelled "Both hands visible".
- **Statuses:**
  - **Checking…**: search running; tier 1 shows a neutral bar, never a guess.
  - **Proven**: "Lethal is on the board."
  - **Refuted**: "No lethal: they can stop at least 1 of the 3 hits you need." With tier 3 showing the defence that stops it.
  - **Unknown**: "Couldn't finish checking." Never presented as "no lethal".
- **Triggers.** Hidden Life Triggers are chance nodes. A proof that needs a Trigger not to fire says so in its certainty line: "Works against any hand, unless a Life card's Trigger stops it (their deck runs N Triggers)", with N from the archetype prior. Decks with no Triggers in their prior (Rocks) say nothing.
- **SR (polite)**, tier by tier: "Lethal: proven, works against any hand." / "You need 3 hits. You have 3 attackers."

### 3.2 Guided count ("Count it with me")

Before the line is revealed, the player can work through the count the curriculum teaches (L15, L16). Four questions, answered on the board.

1. **"How many hits do you need?"** The player types a number or clicks their opponent's Life stack (which counts out loud: "2 Life, plus 1"). Check: Life + 1. Double Attack note when relevant (`explanations.md` E18).
2. **"Which of your cards can attack their Leader this turn?"** The player clicks them. Check: active, not summoning-sick (or Rush), not [Rush: Character], no "cannot attack". Missed or wrong cards are explained by `whyNot`.
3. **"How much can they stop?"** The panel helps them build it: active Blockers (one per battle), visible on-attack effects (Newgate: +3000 for a card, once per turn; Kaido: −2000 to a Character), and cards in hand times their deck's biggest counter. It adds the line players most often miss: **"Each hit gives them a card. After 1 hit they have 2 cards; after 2 hits, 3."**
4. **"Split your DON!!."** The player drags DON!! onto attackers in a sandbox copy of the board (nothing is committed). Each attacker shows "needs X to stop · they can have Y by then". The player orders the attacks by dragging their numbers.

**"Check my count"** compares the four answers with the search's line and marks each one right or wrong, with the reason for anything wrong. **"Show the line"** reveals tier 3. Using the guided count is not "showing the answer" in drills (flows F19b).

**Progress** records, per lethal opportunity, the furthest tier the player needed: found it alone, after tier 1, after tier 2, after the guided count, or after tier 3. That is the measure of whether lethal teaching works.

Worked example: `explanations.md` E20 (Kaido against Rocks: 3 hits, 3 attackers, defence that grows by one card per hit, DON!! split 2 / 5 / 0, smallest first).

## 4. Game Review

### 4.1 Layout

From top to bottom, at 1280×720 (1920×1080 adds width to the board and the detail panel):

1. **Header.** Result, decks, AI tier, turns, "Rewound" tag if any, analysis status ("Analysing turn 4 of 11", or "3 flags · 1 severe").
2. **Turn timeline.** A horizontal strip, one column per game turn, alternating your turns and theirs. Two rows: your decisions (top) and the opponent's (bottom; the AI's notable moves carry "Why?" markers). Flags sit on the row and turn where they happened. Turns not yet analysed are hatched; turns whose search hit its cap carry a "not fully checked" marker. A Life sparkline for both players runs under the strip, so the shape of the game reads at a glance. The mulligan is column 0.
3. **Board viewer** (left, large). The restored position at the selected moment, read-only, with a "Step through the better line" control.
4. **Detail panel** (right). The selected flag's `Explanation`, preceded by **"What you did"** (one line, from the record) and followed by **Play from here** and **Practice this**.

### 4.2 Flags

| Flag kind | Concept | Severity when `any-hand` | Shape |
| --- | --- | --- | --- |
| Missed lethal | `lethal-math` | Severe | Filled diamond |
| Lethal given away | `lethal-math` | Severe | Filled diamond with slash |
| Hit that should have been countered | `counter-or-take` | Severe if it lost the game, else moderate | Filled triangle |
| Counter wasted | `counter-or-take` | Moderate | Hollow triangle |
| DON!! left unused | `don-efficiency` | Moderate if 3 or more, else minor | Hollow square |
| Poor attack ordering (face vs board, order) | `board-vs-face` | Moderate | Hollow circle |
| Mulligan | `mulligan` | Minor | Small bar at turn 0 |

- **Severity** controls size and the order of the flag list, never only colour. "Severe" is the set curriculum L24 counts.
- **Certainty changes severity.** A flag with `needed-hidden-info` is always shown as **Hindsight**, a separate small style, and is never severe (it was not a mistake you could have seen). A `search-incomplete` turn is not a flag; it is a marker meaning "not fully checked".
- **Not flagged, with a note.** Where a rule would flag correct play, the review shows nothing on the timeline but the detail of that turn says why, for example "5 active DON!! held for your Leader: not counted as unused" (`explanations.md` E07). This keeps the review consistent with the tempo meter and with L09's exit rule.
- **Keyboard:** Left/Right move between flags across the timeline; Up/Down between rows; Enter selects; F filters by kind. **SR:** each flag's name is "Turn 9, your turn: missed lethal, severe, works against any hand."

### 4.3 Certainty labels

The three values of `certainty` (ARCHITECTURE §4.5) have fixed copy, a shape and a tooltip:

| Value | Label | Shape | Tooltip |
| --- | --- | --- | --- |
| `any-hand` | **Holds whatever they held** | Solid check-circle | "This works against every hand they could have had, using only what you could see." |
| `needed-hidden-info` | **Hindsight: needed their hidden cards** | Eye | "This only works against the hand they actually held, which you couldn't see. Shown to help you read hands, not as a mistake." |
| `search-incomplete` | **Not fully checked** | Dashed circle | "The analysis ran out of time on this turn. It found no proof either way. Analyse deeper?" |

"Analyse deeper" (on `search-incomplete`) re-runs that turn's search with ten times the budget, with progress and a cancel. For live coach use (hint, lethal detector) the same labels read "Works against any hand", "Depends on their hand" and "Best found, not fully checked".

### 4.4 Restore and replay

- Selecting a flag restores that position in the board viewer (read-only).
- **Step through the better line** plays the line's moves on the viewer, one per press, with the opponent's best responses from the analysis.
- **Play from here** starts a new game from that exact state, including hidden cards, against the same AI tier (flows F16). It is marked "from review" and excluded from win rate.
- **Stale records** (version mismatch, ARCHITECTURE §2.9) open read-only from snapshots: the timeline, flags and explanations are visible; Step through, Play from here and Practice this are disabled with the reason.

### 4.5 Practice this

Turns a flag into a puzzle (plan-review UX-4: puzzles drawn from flags).

1. **Player:** presses **Practice this** on a flag.
2. **System:** builds a `ScenarioSpec` from the restored state, chooses the drill bank by kind (missed lethal or lethal given away → lethal puzzles; counter wasted or should have countered → counter or take it; DON!! unused → DON!! allocation), and sets the hidden information:
   - for an `any-hand` flag, the defender's hand is the strongest hand consistent with what the player could see (the hand the `public` search used to try to refute the line), so solving the puzzle means beating any hand;
   - for a `needed-hidden-info` flag, the actual hand is used and the puzzle is labelled "Their real hand: one way to see it".
3. **System:** opens the puzzle at once ("Try it now") and adds it to the bank as "From your game, turn 9". The original flag shows "Practised: solved" or "Practised: not yet".
4. **Edge:** a flag on a stale record can't be practised.

### 4.6 Saving

Reviews are saved locally with the record (ARCHITECTURE §5). History lists games with result, date, flags by severity and a "Review" button. A game whose analysis did not finish shows "Analysis incomplete · Resume".

## 5. Meta Explorer

### 5.1 Grid

A responsive grid of archetype tiles (12 today, `meta-lists.json`). Header: **"English Standard · as of 2026-10-28 · 33 online events, 30 Jul to 28 Oct"** with a link to how it is counted.

**Tile anatomy:**
- Leader art (with the SAMPLE watermark caveat handled by the card-face study in `board.md`), name and leader ID: "Rocks.D.Xebec · OP17-039".
- Colours as text and icon, never colour alone: "Blue".
- **Tier** from the only source we can use: opmetagame ("S"), labelled with its source on hover. The onepiece.gg tier is `null` for every archetype (robots), so the tile never shows a blank where a tier "should" be; it shows the opmetagame tier with its source.
- **Share:** "11.2% of lists" and "16.1% since the ban".
- **Guide freshness:** the date range of its three lists ("Lists: 8 to 13 Oct" for Rocks today), or "Lists may be out of date (73 days)" when older than 60 days (PROMPT Meta Explorer).
- **Automation:** "50 of 50 cards automated", so the player knows whether the deck plays fully.

**Sort and filter:** by share (default), share since the ban, tier, colour, name; filter by colour. Keyboard: arrows move across tiles in grid order; Enter opens; M switches to the matchup grid. **SR:** "Rocks.D.Xebec, Blue, tier S on opmetagame, 11.2% of lists, 16.1% since the ban. Guide and 3 lists."

### 5.2 Guide page

Sections in the order of the guide files: What the deck is trying to do; Game plan by turn; Defining cards (each card a chip with art, opening the inspector); Mulligan (with "Try the mulligan trainer for this deck"); What it is weak to; Matchups (one line each, with its source tag or an "inference" mark); Sourced lists (event, date, placing, link); Playbook seeds (what the AI checks itself against).

- **Inference is visible.** Every claim the guide marks *(inference)* carries a small "our reasoning" label; sourced claims carry their tag. The player can tell opinion from source at a glance (PROMPT Learning layer: "cite the rule, the ruling, or the strategy source").
- **Actions,** at the top and repeated next to each list: **Play this deck** and **Play against this deck** (flows F18). "Play against" loads the AI with that archetype's playbook.
- **As-of and sources** in the footer of every guide: `asOf`, `confidence`, sources.

### 5.3 Matchup grid

A 12 × 12 grid: rows "you play", columns "against". Each cell shows a short marker (sourced record such as "6–2" where a source gives one; otherwise a neutral "plan" glyph) and opens a popover with the one-line plan, its source or "inference" mark, and **Play this matchup**. The diagonal shows "mirror". Row and column headers stay pinned while scrolling.

- **No fake precision.** Cells do not show win percentages the project does not have. A colour scale is not used, because most cells are inference.
- **Keyboard:** arrows move cell by cell; Enter opens the popover; Esc closes. **SR:** "Rocks against Kaido: plan available, inference. Enter for details."

## 6. Progress

Local only, exportable (PROMPT Learning layer §7).

### 6.1 What to work on next

The top of the Progress page is a single recommendation card (plan-review UX-12):

> **Work on: When to counter or take the hit.**
> 5 flags in your last 6 games, 2 of them severe. Your counter-or-take drill: 6 of 10.
> **Start lesson L10** · Other suggestions

**How it is chosen:**

1. For each concept slug, a score from review flags over the last 10 reviewed, non-tutorial games: severe flags weigh 3, moderate 2, minor 1, Hindsight 0.5; each game's flags are multiplied by 0.85 for each newer game after it; the total is divided by the number of games.
2. Add drill evidence: for the concept's primary lesson, 2 points if the last drill session was below the lesson's untimed exit criterion.
3. Remove concepts whose lesson exit was passed in the last 5 games with no flags since.
4. Pick the highest score; break ties by curriculum teaching order.
5. With fewer than 3 reviewed games, recommend the next unfinished lesson in teaching order instead, and say so ("Not enough games yet: next in the course is L18").

The card always states its reason in numbers. "Other suggestions" shows the next two concepts with their reasons. Hints used and lethal tiers needed (§3.2) appear as supporting lines, not as score inputs, in v1.

### 6.2 The rest of the page

- **Course:** lessons in teaching order with status: not started, in progress, passed, passed (timed). Each opens its lesson and drill.
- **Drills:** accuracy over time per drill (a small line chart, one per drill, following the `dataviz` conventions in `visual-system.md`), untimed and timed shown separately.
- **Games:** win rate by your archetype and by AI tier, from games that were not rewound and not started from review; the count of excluded games is shown ("3 rewound games not counted").
- **Flags:** frequency by kind over the last 20 games.
- **Lethal:** "Found alone" rate and the tier breakdown from §3.2.
- **Data:** Export everything (one JSON file), Import (with a dialog when it would overwrite), Delete all.

## 7. Drills

Four drills (PROMPT Learning layer §5), one shared shell (flows F19).

### 7.1 Shell

- **Start screen:** drill name, the lesson it belongs to, filters (archetype, seat, source: "from my games" or "bank"), number of items (default 10), and the timer option.
- **Item screen:** the scenario on the real board or the defence planner; a progress line "Item 3 of 10"; Show answer; Skip.
- **Answer screen:** right or wrong in words and shape, then the `Explanation`. Next (Enter).
- **Summary:** score against the lesson's untimed exit criterion ("8 of 10: passed"), and, if timing was on, the timed result separately.

### 7.2 Timers and WCAG 2.2.1

Timing is never required to learn or to pass (curriculum "Exit criteria are untimed by default"; plan-review UX-9).

- **Off by default.** Settings → Drills → Timed drills, or the timer toggle on each start screen.
- **Adjustable:** 50% to 300% of the base time, or untimed, before and during a session. The base times are the curriculum's optional timed criteria (for example 60 s per lethal puzzle).
- **Pausable:** Pause (P) stops the clock and hides nothing.
- **Never gates.** When time runs out the item does not end; the clock shows "Over time" and the item can still be answered and counted for the untimed criterion. Only the separate "passed (timed)" badge needs answers within time.
- **Warnings:** a polite SR announcement at 10 s left; no sound by default; no flashing.
- **Visual:** a thin bar and a number, both with text equivalents.

### 7.3 The four drills

| Drill | Lesson | Input | Answer source |
| --- | --- | --- | --- |
| Mulligan trainer | L12 | Keep or Redraw on a dealt hand with seat and matchup shown | The archetype guide's mulligan section (`explanations.md` E10, E11) |
| Lethal puzzles | L15, L16 | Play the turn on the board, or declare "No lethal"; guided count available | Lethal search in `public` mode; puzzles from review flags (§4.5) |
| Counter or take it | L10 | The defence planner | The analysis's comparison of block, counter and take (`explanations.md` E04, E05, E19) |
| DON!! allocation | L09 | Play the turn and submit, or choose from 3–4 described lines | The analysis's scores for each line, explained in tempo-meter terms |

Each drill bank holds at least 20 items (PROMPT M9). Items from the player's own games are marked "From your game, turn 9" and come first when the source filter allows.
