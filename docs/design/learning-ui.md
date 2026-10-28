# Learning UI

**As of:** 2026-10-28 (Phase 4, revision 2: review-1 fixes)
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

- **Where.** A docked section of the rail, between the log and the decision panel (`board.md` §3.13). It takes height from the log and never width from the board, so the board never reflows. The coach never covers the playmat, the hands or the decision panel.
- **States and heights** are owned by `board.md` §3.13:
  - **Collapsed (the strip, default).** 48 px.
  - **Open.** The log keeps at least 5 lines above it.
  - **Tall.** The log becomes a 3-line ticker and the decision panel shrinks to its header and footer. **Tall is entered only by a player request**: tier 3 of the lethal detector, the guided count, or "Make taller" on a long hint. The coach never enters it on its own. It is available only in your idle Main phase, where the decision panel's body is a summary that End turn's sub-label already carries. If a decision you owe arrives (an attack on you, an effect choice), the coach drops to its strip, the decision panel goes tall, and the coach remembers its section and scroll position: the strip's Lethal badge reads "line kept" until you reopen it.
- **The strip.** Five buttons, each **one word**: Hint, Why, Lethal, Math, Tempo, plus the open chevron. A button's state shows as a **badge** (a small shape with a glyph or number: "◆" for "lethal on board", "5/7" for tempo, "ready" for a finished hint), never as a second line of micro-text. Badges are the only way the coach signals anything unprompted, and only for features the player has switched on (§2.2). The longest strings ("Tempo 10/10", "Answer") are tested at 1280 so nothing collides. In drills, Hint is renamed **Answer**, with no sub-label (flows F9).
- **Open and tall.** The rail's full width (`board.md` is the source of truth for layout). The sections keep a fixed order, **Hint**, **Why**, **Lethal**, **DON!! math**, **Tempo**, as one tab row at the top of the panel; only the chosen section shows, so no height goes on five stacked headers (`board.md` §3.13). In the open state the section scrolls inside itself; content that needs more room (tier 3, the guided count) offers the tall state instead of three screens of scrolling.
- **Toggle:** the strip's chevron or `C` (`accessibility.md` §3.12). Expanding never moves focus into the panel unless the player pressed a coach key (H, W, L), in which case focus goes to that section's result.
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

**Verbosity is applied everywhere the component renders**, including the coach's tier 3: at Standard the evidence is behind "More", so the numbered line with Show and Do step 1 is visible without scrolling in the tall coach at 1280. Review and drill answers use Learner by default, because the player came to read.

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
- **Content:** the stored `Explanation` from that decision. Only public information (flows D9), and its certainty chip reads **"Public information only"** (`explanations.md`, certainty by context). AI turn plans show executed steps only; the rest reads "Further steps hidden until played".
- **Empty states:** "Only legal move." for forced moves. "Rookie picks a random legal move, except that it always blocks or counters a lethal attack." for Rookie.
- Examples: `explanations.md` E12 (block), E13 (counter), E14 (turn plan), E16 (leader ability).

### 2.6 Lethal detector

Covered in §3, because it is the centre of lethal teaching. In the panel it is the **Lethal** section; on the rail, the Lethal button and its badge.

### 2.7 DON!! math overlay

The arithmetic of every battle, shown where the battle is.

- **The coach section adds only what the battle panel lacks** (UX-R24): what they can make and its certainty, and the rule footnotes. It does not repeat the sum ("see the battle panel"), because both sit in the same rail.
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
- **End of turn:** the meter freezes for the opponent's turn showing your last turn's split, then resets at your Refresh. No end-of-turn message is shown (§2.2).

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

Before the line is revealed, the player can work through the count the curriculum teaches (L15, L16). Four questions, answered on the board. The guided count opens the coach **tall** (§2.1), so all four questions and their answers fit at 1280×720 without scrolling.

1. **"How many hits do you need?"** The player types a number or clicks their opponent's Life stack (which counts out loud: "2 Life, plus 1"). Check: Life + 1. Double Attack note when relevant (`explanations.md` E18).
2. **"Which of your cards can attack their Leader this turn?"** The player clicks them. Check: active, not summoning-sick (or Rush), not [Rush: Character], no "cannot attack". Missed or wrong cards are explained by `whyNot`.
3. **"How much can they stop?"** The panel helps them build it: active Blockers (one per battle), visible on-attack effects (Newgate: +3000 for a card, once per turn; Kaido: −2000 to a Character), and cards in hand times their deck's biggest counter. It adds the line players most often miss: **"Each hit gives them a card. After 1 hit they have 2 cards; after 2 hits, 3."**
4. **"Split your DON!!."** This step runs **on the board itself** in a labelled **sandbox mode**: the midline band reads "Sandbox · nothing is played" with an Exit sandbox button, the board edge takes the sandbox outline, and gives are made with the normal inputs (DON!! mode, `+`, drag). Each attacker shows "needs X to stop · they can have Y by then". The player orders the attacks by clicking the numbered order chips. The coach is the questionnaire beside it (tall state); the decision panel's footer reads **Check my split** and Exit sandbox. Leaving sandbox restores the real position exactly. Nothing reaches the engine's real game state.

**"Check my count"** compares the four answers with the search's line and marks each one right or wrong, with the reason for anything wrong. **"Show the line"** reveals tier 3. Using the guided count is not "showing the answer" in drills (flows F19b).

**Progress** records, per lethal opportunity, the furthest tier the player needed: found it alone, after tier 1, after tier 2, after the guided count, or after tier 3. That is the measure of whether lethal teaching works.

Worked example: `explanations.md` E20 (Kaido against Rocks: 3 hits, 3 attackers, defence that grows by one card per hit, DON!! split 2 / 5 / 0, smallest first).

## 4. Game Review

### 4.1 Layout: Overview and Study

Review has two modes (review-1 C21, UX-R5). The board is the evidence, so it is only ever shown at game size; a scaled-down board would put its text under the 12 px floor. **No rendered text is under 12 px anywhere in review.** Wireframes: `wireframes/11b-review.html` (Overview) and `11c-study.html` (Study).

**Overview** (the default; a normal page with the app header and footer). From top to bottom at 1280×720:
1. **Header.** Result, decks, AI tier, turns, "Rewound" tag if any, analysis status ("Analysing turn 4 of 11", or "5 flags · 1 severe").
2. **Turn timeline.** A horizontal strip, one column per game turn, each column headed with its turn and actor ("T9 · Kaido", "T8 · You"). Two rows: your decisions (top) and **"Kaido's notable moves"** (bottom; they carry "Why?" markers). Flags sit on the row and turn where they happened, **sized by severity** (severe 20 px with the word "Severe", moderate 16 px, minor 12 px) as well as by shape (§4.2). Turns not yet analysed are hatched; turns whose search hit its cap carry a "not fully checked" marker. A Life sparkline for both players runs under the strip. The mulligan is column 0.
3. **Flag list.** Under the timeline: one row per flag (turn, kind, severity word, certainty), sortable by turn or severity (severity first by default). It is a keyboard target of its own (`accessibility.md` §3.16).
4. **Selected flag.** Left: a **text-free thumbnail** of the restored position (shapes and arrows only, `aria-hidden`; it shows where things are, not the numbers) with **Study this moment (Enter)**. Right: **"What you did"** (one line, from the record) and the flag's `Explanation` at Learner verbosity.
5. **Pinned action footer** in the detail panel, which never scrolls: **Study this moment**, **Play from here**, **Practice this** (UX-R29).

**Study** (the board page). Enter on a flag, or "Study this moment":
- The restored position renders **at native size in the game's own two-column layout** (`board.md` §3.1/§3.2), read-only, with the battle panel, arrows and log as they were at that decision.
- The **rail** holds the explanation (in place of the log and coach) and a pinned footer, **Play from here · Practice this**, in the decision panel's position. The rail header holds **← Overview** (Esc) and a **previous/next flag stepper** ("Flag 2 of 5", N / Shift+N). The rail notice stays.
- **Step through the better line** plays the line on this board, one move per press, from the explanation's Show buttons.

At 1920×1080 Overview and Study stay separate pages in v1; side by side is possible later (the ruling allows it) and is not designed yet.

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

- **Severity** controls glyph size (20 / 16 / 12 px) and the order of the flag list, never only colour; severe flags also carry the word "Severe". "Severe" is the set curriculum L24 counts.
- **Certainty changes severity.** A flag with `needed-hidden-info` is always shown as **Hindsight**, a separate small style, and is never severe (it was not a mistake you could have seen). A `search-incomplete` turn is not a flag; it is a marker meaning "not fully checked".
- **Not flagged, with a note.** Where a rule would flag correct play, the review shows nothing on the timeline but the detail of that turn says why, for example "5 active DON!! held for your Leader: not counted as unused" (`explanations.md` E07). This keeps the review consistent with the tempo meter and with L09's exit rule.
- **Keyboard:** Left/Right move between turns on the timeline; Up/Down between rows; the flag list is its own tab stop; N / Shift+N next and previous flag; Enter opens Study; F filters by kind. **SR:** each flag's name is "Turn 9, your turn: missed lethal, severe, works against any hand."

### 4.3 Certainty labels

The three values of `certainty` (ARCHITECTURE §4.5) have fixed copy, a shape and a tooltip:

| Value | Label | Shape | Tooltip |
| --- | --- | --- | --- |
| `any-hand` | **Holds whatever they held** | Solid check-circle | "This works against every hand they could have had, using only what you could see." |
| `needed-hidden-info` | **Hindsight: needed their hidden cards** | Eye | "This only works against the hand they actually held, which you couldn't see. Shown to help you read hands, not as a mistake." |
| `search-incomplete` | **Not fully checked** | Dashed circle | "The analysis ran out of time on this turn. It found no proof either way. Analyse deeper?" |

"Analyse deeper" (on `search-incomplete`) re-runs that turn's search with ten times the budget, with progress and a cancel. For live coach use (hint, lethal detector) the same labels read "Works against any hand", "Depends on their hand" and "Best found, not fully checked". Labels are chosen **by context**, not only by value (UX-R25): an AI "Why" reads "Public information only"; a guide-sourced answer (the mulligan trainer) reads "From the Rocks guide (sourced)"; a hint outcome that is an estimate reads "Estimate". The full table is in `explanations.md` ("Certainty labels by context"), and its snapshot tests check it.

### 4.4 Restore and replay

- Selecting a flag selects it in Overview; Study restores that position on the read-only board. A "not fully checked" turn restores that turn's **starting** position, and its step control reads "No better line computed" (UX-R31).
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

Reviews are saved locally with the record (ARCHITECTURE §5). The **History** page (the "Reviews" nav item) is specified in §9.

## 5. Meta Explorer

### 5.1 Grid

A responsive grid of archetype tiles (12 today, `meta-lists.json`). Header: **"English Standard · as of 2026-10-28 · 33 online events, 30 Jul to 28 Oct"** with a link to how it is counted.

**Tile anatomy:**
- Leader art (with the SAMPLE watermark caveat handled by the card-face study in `board.md`), name and leader ID: "Rocks.D.Xebec · OP17-039". Where two archetypes share a Leader name, the tile uses the **same disambiguated name as the matchup grid** everywhere ("Luffy (Black)", "Enel (Purple)"), never the card ID alone (UX-R42).
- Colours as text and icon, never colour alone: "Blue".
- **Tier** from the only source we can use: opmetagame ("S"), labelled with its source on hover. The onepiece.gg tier is `null` for every archetype (robots), so the tile never shows a blank where a tier "should" be; it shows the opmetagame tier with its source.
- **Share:** "11.2% of lists" and "16.1% since the ban".
- **Guide freshness:** the date range of its three lists ("Lists: 8 to 13 Oct" for Rocks today), or "Lists may be out of date (73 days)" when older than 60 days (PROMPT Meta Explorer).
- **Automation:** "50 of 50 cards automated", so the player knows whether the deck plays fully. When it does not, the tile states the consequence, not a status: "Plays with a generic AI; 7 card effects not automated" (UX-R42).

**Sort and filter:** by share (default), share since the ban, tier, colour, name; filter by colour. Keyboard: arrows move across tiles in grid order; Enter opens; M switches to the matchup grid. **SR:** "Rocks.D.Xebec, Blue, tier S on opmetagame, 11.2% of lists, 16.1% since the ban. Guide and 3 lists."

### 5.2 Guide page

Sections in the order of the guide files: What the deck is trying to do; Game plan by turn; Defining cards (each card a chip with art, opening the inspector); Mulligan (with "Try the mulligan trainer for this deck"); What it is weak to; Matchups (one line each, with its source tag or an "inference" mark); Sourced lists (event, date, placing, link); Playbook seeds (what the AI checks itself against).

- **Inference is visible.** Every claim the guide marks *(inference)* carries a small "our reasoning" label; sourced claims carry their tag. The player can tell opinion from source at a glance (PROMPT Learning layer: "cite the rule, the ruling, or the strategy source").
- **Actions,** at the top and repeated next to each list: **Play this deck** and **Play against this deck** (flows F18). "Play against" loads the AI with that archetype's playbook.
- **As-of and sources** in the footer of every guide: `asOf`, `confidence`, sources.

### 5.3 Matchup grid

A 12 × 12 grid: rows "you play", columns "against". Each cell shows a short marker (sourced record such as "6–2" where a source gives one; otherwise a neutral "plan" glyph) and opens a popover with the one-line plan, its source or "inference" mark, and **Play this matchup**. The diagonal shows "mirror". Row and column headers stay pinned while scrolling.

- **No fake precision.** Cells do not show win percentages the project does not have. A colour scale is not used, because most cells are inference.
- **Records say whose they are** ("16–20 (Rocks W–L)", also on the guide page). **When two sources disagree** about one pairing (the Rocks row and the Robin row give different records), both rows show the same marker and the popover lists both records with "Sources disagree" and each source (UX-R41).
- **Overflow:** at 1280 the grid scrolls horizontally inside its frame with a scroll shadow on the clipped edge and a sticky first column.
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
- **Item screen:** the scenario on the real board or the defence planner; a progress line "Item 3 of 10"; one **Show answer** (the coach strip's "Answer" button on board drills); Skip. **The item never telegraphs its answer** (UX-R7): answer buttons have equal weight, none is pre-focused, focus starts on the hand or the prompt, and their order is fixed (Keep left, Redraw right). Lethal puzzles use **Submit turn** as the primary (not End turn) and evaluate themselves after the last legal attack (UX-R32).
- **Answer screen:** right or wrong in words and shape, then the `Explanation`. Next (Enter).
- **Summary:** score against the lesson's untimed exit criterion ("8 of 10: passed"), and, if timing was on, the timed result separately.

### 7.2 Timers and WCAG 2.2.1

Timing is never required to learn or to pass (curriculum "Exit criteria are untimed by default"; plan-review UX-9).

- **Off by default.** Settings → Drills → Timed drills, or the timer toggle on each start screen.
- **Adjustable:** one option list, **Untimed (default) · 50% · 100% · 200% · 400% · 1000%** of the base time (review-1 C13; 1000% meets WCAG 2.2.1's ten-times rule; 50% serves players who want pressure), before and during a session. The base times are the curriculum's optional timed criteria (for example 60 s per lethal puzzle). The same list is in Settings → Drills and on each start screen.
- **Pausable:** the timer's own Pause button (Space while the timer is focused) stops the clock and hides nothing. `P` keeps its board meaning.
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

Each drill bank holds at least 20 items (PROMPT M9). Items from the player's own games are marked "From your game, turn 9" (the source game's turn number, `explanations.md` turn vocabulary) and come first when the source filter allows.

## 8. Learn

The teaching loop is flag → lesson → drill → Progress "Work on" (§6.1). Every explanation's lesson link and the "Learn" nav item land here (UX-R11). Wireframe: `wireframes/18-learn.html` (`#hub`, `#lesson`).

### 8.1 Course hub

- **Header:** "Learn" and one line: "27 lessons in 4 stages. Untimed; leave and come back any time."
- **Continue card** at the top: the next unfinished lesson in teaching order, or the Progress page's "Work on" lesson when that differs, with its reason in numbers (the same text as §6.1).
- **Stages** in curriculum order (`docs/content/curriculum.md`): Stage 1 First game (rules), Stage 2 Core strategy, Stage 3 Seeing the whole turn, Stage 4 Competitive-ready. Each lesson row shows its ID and title ("L10 Counter or take the hit"), status in words and shape (not started, in progress, passed, passed timed), its drill if it has one, and an estimated time. The tutorial is Stage 1's first row.
- **Keyboard:** each stage is a list; rows are links. **SR:** "L10, Counter or take the hit, in progress, drill 6 of 10."

### 8.2 Lesson page

One page per lesson, opened from the hub, from an explanation's "Lesson:" link, or from the Progress "Work on" card. Sections in order:

1. **Header:** lesson ID and title, stage, status, "Back to Learn".
2. **The idea:** the concept in two or three short paragraphs, from the curriculum entry, with glossary terms linked.
3. **Worked example:** one `Explanation` from `explanations.md` (for example L05 uses E04/E05; L10 uses E05 and E19; L15 uses E01 and E20), rendered at Learner verbosity, with a text-free thumbnail and **Show me**.
4. **Show me:** opens the example's position as a scenario on the real board (a "Show me" mode, flows G2), with the coach open on the same explanation; Esc returns to the lesson.
5. **Practise:** the drill entry for that lesson (mulligan, lethal puzzles, counter or take it, DON!! allocation), with the untimed **exit criterion** stated ("Pass: 8 of 10 untimed") and the player's best result. Lessons with no drill say how they are passed (a tutorial step, or "Finish a game with no flag of this kind").
6. **Rules and sources:** the rule numbers and strategy sources the lesson cites.

Lesson links resolve for every `lessonId` used in `explanations.md`; a CI check fails on a lesson ID with no page.

## 9. History (Reviews)

The "Reviews" nav item. Wireframe: `wireframes/20-history.html` (`#list`, `#empty`).

- **List**, newest first: one row per game with result in words ("Won", "Lost", "Conceded", "Draw"), opponent and tier, your deck, date, turns, flags by severity as shapes with counts ("1 severe · 3 moderate · 1 hindsight"), tags ("Rewound", "From review", "Tutorial"), and **Review**. A game whose analysis did not finish shows **"Analysis incomplete · Resume"**. A stale record (older engine or card data) shows **"Read-only: older version"** and opens Overview read-only (§4.4).
- **Filters:** result, opponent archetype, has severe flags. **Sort:** date, severe flags.
- **Empty state:** "No games yet: play a game and its review appears here." with **Play a game** and **Try the tutorial**.
- **Storage full** (`flows.md` G8) opens this list with a note: "Saved games are full. Delete old reviews to keep saving." and a select-and-delete mode.
- **Keyboard:** the list is a table with row headers; Enter on a row opens its review. **SR:** "Lost to Kaido, Pirate, 28 October, 13 turns, 1 severe flag. Review."

Progress (§6) is wireframed in `wireframes/19-progress.html` (`#progress`, and `#new` for a player with fewer than 3 reviewed games). Errors and empty states for the learning pages (stale review, analysis failed, art failed, storage full) are in `wireframes/21-errors.html`.
