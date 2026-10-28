# Interaction flows

**As of:** 2026-10-28 (Phase 4, first draft for the UX-director review)
**Inputs:** `PROMPT.md` (Mission, the four jobs, Phase 4, Learning layer, AI opponent, Done when); `docs/plan-review-1.md` (UX-1 to UX-12); `docs/ARCHITECTURE.md` §2.1, §2.3, §4.1, §4.4, §4.5, §5; `docs/research/rules-digest.md` F–K; `docs/research/rulings.md`; `docs/research/competitive-teardown.md` ("UX decisions we will make differently"); `docs/content/curriculum.md`.
**Companion documents:** `learning-ui.md` (coach, lethal teaching, review, meta explorer, progress, drills), `explanations.md` (20 finished `Explanation` objects). `board.md`, `visual-system.md` and `accessibility.md` are being written in parallel. Where this file names a region ("battle panel", "decision bar") or a key, those documents own the final layout and key map; if they disagree with this file, they win and this file is updated.

## How to read a flow

Each flow is a numbered script. Every step has the same parts, in this order:

- **State**: what is on screen and who owes the decision (ARCHITECTURE §2.3: exactly one player owes a decision at any time).
- **Player**: what the player does, pointer first.
- **System**: what the app does in response, including the engine call behind it (`legalActions`, `whyNot`, `preview`, `reduce`).
- **Keys**: the keyboard path. Keys are proposals; `accessibility.md` owns the final map.
- **SR**: the exact text sent to the screen-reader live region. "polite" or "assertive" says which region. Only two things are ever assertive: a decision the player now owes during the opponent's turn, and the end of the game.
- **Edge**: error states and edge cases for that step.

Steps marked **(unobserved)** rest on what a competitor is said to do but that nobody on this project has seen first-hand (plan-review UX-8). They are revisited after the owner's SeaKing session.

## Global conventions

These apply to every flow. Individual flows only note exceptions.

### G1. Names of the places on screen

| Name | What it is | Owner |
| --- | --- | --- |
| **Decision bar** | One fixed strip that always says, in words, whose turn it is, the phase, and what decision is owed: "Your turn 3 · Main phase · Play, give DON!!, attack, or end your turn." It holds the primary commit button for the current decision. | `board.md` |
| **Battle panel** | Opens for every attack, for both sides. Shows attacker power, defender power, the gap, what is needed to stop the attack, and what is available. Doubles as the defence planner (F6). Not a modal: the board stays visible and interactive behind it. | `board.md`, this file F5–F6 |
| **Choice tray** | Where effect choices happen (F8): revealed cards, ordering lists, "you may" prompts. Anchored to the card or zone the effect came from. Not a modal. | this file F8 |
| **Coach panel** | Collapsible side panel. Hint, why, lethal detector, DON!! math, blunder warning, tempo meter. | `learning-ui.md` |
| **Log** | One line per player-level move, in the same words as the battle panel. Each AI line has a "Why?" affordance. | `board.md` |
| **Inspector** | Large card view with full text, rulings and "effect not automated" badge where relevant. | `board.md` |

### G2. Modes

| Mode | Opponent | Rewind | Commit style | Counts in stats |
| --- | --- | --- | --- | --- |
| **Practice** (default) | AI | On | Commit-and-undo (G3) | Yes, unless rewound (F11) |
| **Strict** | AI | Off | Staged commits only (G3) | Yes |
| **Hotseat** | Second human at the same device | On, needs both players | Commit-and-undo | No |
| **Open hands** (play both sides) | You control both sides | On | Commit-and-undo | No |
| **Tutorial** | Scripted Rookie | Step back only | Constrained to the taught action | No |
| **Drill / puzzle / "Show me"** | Scenario | Reset to start | Commit-and-undo | Drill stats only |

"Practice modes" in this file means every mode except Strict.

### G3. Commit, not confirm

The single most frequent interaction decision. The product has almost no "Are you sure?" dialogs.

1. **Multi-part decisions are staged and committed once.** Counters, Blocker choice, multi-target effects, DON!! counts, card ordering. The commit button names what it will do ("Block with Yamato and play 2 counters"). Pressing it *is* the confirmation required by principle 3.
2. **Single-step actions apply immediately in practice modes**, with a one-line undo toast ("Played Nami · Undo Ctrl+Z") that lasts 5 s at 1× and is also reachable from the rewind control for the rest of the game. This covers play, give DON!!, activate, end turn.
3. **Attacks use preview-then-commit** (F5): the first click on a target shows the battle math; a second click on the same target, Enter, or a drag commits. One extra click buys the math, which is the teaching moment.
4. **In Strict mode** there is no undo, so single-step actions that reveal information or end a window (end turn, take the hit, decline a Trigger) need a second press on the same control within 3 s. The control's label changes to "Press again to end turn". No dialog.
5. **Real dialogs exist only for** conceding, leaving a game that will not be saved, deleting saved data, and importing a progress file that will overwrite existing data.

### G4. Asking the engine

The app never decides legality (ARCHITECTURE §1).

- Highlights come from `view.decision.actions`. A card with no legal action is not decorated.
- Pointing at an undecorated card, or pressing Enter on it, shows `whyNot` in a tooltip and in the decision bar for 4 s: "Active Characters can't be attacked (CR 7-1-1-2)." The rule number is a link to the rules reference.
- Every number in the battle panel, the DON!! overlay and staged previews comes from `preview` on a scratch copy of the state held by the session store. Staging several items chains several previews. Nothing reaches `reduce` until commit.
- If `reduce` throws on a commit (an engine bug, since the UI only offers listed actions), the move is not applied, the board stays as it was, and the decision bar says: "That move couldn't be applied. Nothing changed. Copy a bug report?" The button copies the game record and the failing action as JSON. **SR (assertive):** "Move failed, nothing changed."

### G5. Auto-skip

ARCHITECTURE §2.3: a decision with exactly one legal action that changes nothing may be applied automatically. Default on; setting "Always ask me" turns it off.

- **What is skipped:** an empty Blocker window, an empty Counter window, a forced single pick, an [On Play] whose only option is "no target".
- **What is never skipped:** any decision with two or more options that differ; any "you may" with a real effect; any Trigger; ordering of two or more different effects; your end of turn.
- **How a skip shows:** the step chip in the battle panel ticks through ("Block · none available") and the log line records it. At 1× the chip holds 400 ms so the step is visible. **SR (polite):** "No Blocker available. No counters in hand." (one sentence for all skipped steps of that battle).
- **No information leaks through skips.** Whether a window is empty can reveal a hidden hand. Two rules prevent that:
  - A window may be auto-skipped for a human only when the human watching the other side could not learn anything from it. Against the AI this is always true (the AI receives views, never timing). In hotseat, the Counter window is skipped only when the defender's hand is empty, which is public. A Blocker window is public information either way.
  - The AI's own defensive windows always take the same visible time (the "considering" beat in F21), whether it had options or not.

### G6. Pacing and speed

Animation speed is 0.5×, 1× (default), 2×, 4× or Instant. Reduced motion (system setting or app setting) replaces movement with 150 ms cross-fades and highlight changes but keeps the holds, so an AI turn is still followable. All durations in this file are at 1×.

### G7. Screen-reader live regions

- **Polite region:** the log. One sentence per player-level move (`intentId`), not per engine action. "Kaido gives 3 DON!! to its Leader. Leader 8000."
- **Assertive region:** "Your decision" prompts that arrive during the opponent's turn, and the game result.
- Phase changes are announced once, politely: "Your turn 4. Refresh, draw, DON!!: 8 DON!!. Main phase."
- Every card's accessible name gives name, power, state and attached DON!!: "Shiki, 9000 power, active, 0 DON!!. Can attack." Hand cards add cost and Counter value.

### G8. Errors that apply everywhere

| Situation | Behaviour |
| --- | --- |
| Card art fails or is slow | Text card with name, cost, power, Counter and colour bar (ARCHITECTURE §5). Never blocks play. |
| AI worker crashes or times out | The store restarts the worker and re-sends the decision. After a second failure: "The AI stopped responding. Retry · Save and quit." Coach features show "Coach unavailable" in their section, not a dialog. |
| Tab hidden mid-AI turn | Animations pause; the AI keeps searching. On return, the queued moves play from where they stopped, or "Skip to my decision" is offered if more than 3 moves queued. |
| Reload or crash mid-game | The game resumes from the last checkpoint in IndexedDB with the full record (ARCHITECTURE §5). First screen: "Resume your game vs Kaido (turn 6)?" |
| Storage full | Settings and the current game keep working. "Saved games are full. Delete old reviews?" opens the saved-games list. |
| Phone portrait | "Rotate to play" screen (PROMPT principle 7). Menus, the meta explorer and guides stay readable in portrait. |

---

## F1. First launch

**Goal:** a new visitor reaches the right first experience in one decision; an experienced player reaches a game in two clicks (teardown decision 5).

1. **State:** the visitor opens the URL. No account, no cookie banner (there are no cookies or analytics).
   **System:** loads the shell (initial JS under 300 KB), shows the home screen with the footer disclaimer ("Unofficial fan tool. One Piece and all card names, text and art belong to their respective owners."). Card data loads in the background for the two default decks only.
   **SR (polite):** "OPTCG Sim. Have you played One Piece Card Game before?"

2. **State:** the home screen asks one question with two large choices and one small link:
   - **"I know the rules: start a game"**, with the sub-line "Rocks vs Kaido, Pirate AI. Change anything first if you like."
   - **"I'm new: teach me"**, with the sub-line "About 20 minutes. You can leave and come back."
   - Small link: "Just look around" (card browser, meta explorer, rules).
   **Keys:** focus starts on the first choice. Up/Down or Tab moves; Enter selects. `?` opens the shortcut sheet from here on.
   **Edge:** a returning visitor with a saved game sees "Resume your game" as the first choice instead and the question moves below it. A visitor who completed the tutorial never sees the question again; Settings → "Show the welcome question" brings it back.

3. **Branch A, "I know the rules".**
   **System:** opens Setup (F3) with everything preselected: your deck Rocks (OP17-039), AI deck Kaido (OP17-058), tier Pirate, first player by rock-paper-scissors. The Start button has focus.
   **Player:** presses Start (or changes something first).
   **System:** starts the game. The coach panel is collapsed to its rail. A single line in the decision bar, shown once per profile: "Coach is on the right (/) when you want it. H for a hint." It does not move focus and disappears at the first move.
   **SR (polite):** "Game started. Rock-paper-scissors decides who chooses first."
   **Edge:** if the default decks' card data has not finished loading, Start shows "Loading cards… 70%" in its label and stays enabled; pressing it queues the start.

4. **Branch B, "I'm new".**
   **System:** opens the tutorial at step 1 (F2). A "Leave tutorial" control is always visible; leaving saves the step.

5. **Branch C, "Just look around".**
   **System:** opens the card browser with the main navigation visible. The welcome question remains on Home until answered.

---

## F2. Tutorial, then the first full game

**Goal:** finish in under 20 minutes (PROMPT "Done when"), measured by the local per-step timing log (ARCHITECTURE §5). Built from scenarios on the real engine (ARCHITECTURE §2.9).

The tutorial has the eight steps from PROMPT Learning layer §1. Each step is one scenario. In each step, `legalActions` is filtered to the action being taught; everything else stays visible but inert.

| # | Step | The one action it allows | Two-sentence explanation (finished copy is M7 content) |
| --- | --- | --- | --- |
| T1 | Zones | Select each highlighted zone | What each zone is for |
| T2 | Your first turn | Draw, DON!!, play a Character | What the first turn allows (CR 6-3-1, 6-4-1) |
| T3 | Giving DON!! | Give DON!! and read the new power | +1000 per DON!!, on your turn only (CR 6-5-5-2) |
| T4 | Attacking the Leader | Declare an attack | Targets: Leader or rested Characters; ties go to the attacker |
| T5 | Being attacked | Block, counter, or take it | Block Step, then Counter Step (CR 7-1-2, 7-1-3) |
| T6 | Triggers | Activate or add to hand | A Life card's Trigger (CR 10-1-5) |
| T7 | Leader abilities | Use your Leader's effect | The Leader defines the deck |
| T8 | Winning | Find the last two hits | Life + 1 hits; you win when a hit lands at 0 Life |

1. **State:** a tutorial step loads. The highlighted control pulses once (no pulse under reduced motion: a thick focus ring instead). A short card anchored next to it holds the two sentences and a "Why?" link to the rule.
   **Player:** performs the highlighted action.
   **System:** applies it through `reduce`, plays the animation, then shows "Next" (Enter). Each step records start and end time to the timing log.
   **Keys:** Tab lands on the highlighted control first, then the explanation card, then "Leave tutorial". Enter performs the action.
   **SR (polite):** the step title and both sentences, then "Highlighted: your Leader. Press Enter to give 1 DON!!."

2. **Edge, the player tries something else.** A non-highlighted card or control does nothing except show, in the explanation card: "Not yet. First, give 1 DON!! to your Leader." (from the step's script, not from `whyNot`, because the action may be legal in a real game). No error sound, no shake.

3. **Edge, the player makes the taught move wrongly.** Example: in T5 they take the hit when the step asks them to counter. The step allows only the actions it teaches, so "Take it" is not offered in T5. Where a step teaches a choice (T6: activate or add to hand), both are allowed and the explanation adapts.

4. **Edge, leaving and resuming.** "Leave tutorial" saves the current step. Home shows "Continue the tutorial (step 5 of 8)". Resuming restarts the current step's scenario, not mid-step. "Back" goes to the start of the previous step.

5. **Completion.**
   **State:** T8 won.
   **System:** shows "Tutorial complete in 17 min" (from the timing log), and two choices: **"Play your first full game"** (focused) and "Back to Home". Progress records lesson L01–L07 tutorial credit.
   **SR (polite):** "Tutorial complete. Play your first full game?"

6. **First full game.**
   **System:** opens Setup with the tutorial decks preselected, AI tier Rookie, coach verbosity "Learner", and the lethal detector set to tier 1 always-on (it says "lethal on board" but not how). These defaults are set for this one game and named on the setup screen ("Set for your first game. Change in Settings later."). The game then runs as F4.
   **Edge:** if the player switches to Pirate or Warlord, the learner defaults remain; nothing else changes.

---

## F3. Setup: decks, AI, first player, mulligan

**Goal:** from Home to the mulligan in two clicks with defaults; every choice is changeable.

### F3a. Choose decks and AI

1. **State:** Setup screen, three columns at 1280×720 (your deck, opponent, game options); stacked on tablet.
   - **Your deck:** the last deck used, or a saved deck, or an archetype list from the meta explorer. Each shows leader art, name, colours, and scripting coverage ("50 of 50 cards automated").
   - **Opponent:** an archetype from the meta explorer (it brings its playbook) or one of your saved decks (the AI then uses the generic playbook, labelled as such). Tier: Rookie, Pirate (default), Warlord, Emperor, each with a one-line description and its typical turn time.
   - **Game options:** mode (Practice default, Strict, Hotseat, Open hands), who goes first (rock-paper-scissors default; "I go first"; "I go second"; "AI chooses"), coach verbosity.
   **Keys:** Tab between columns; arrows within a list; Enter opens a picker; S starts.
   **SR (polite):** "Setup. Your deck: Rocks. Opponent: Kaido, Pirate. Start button."

2. **Edge, invalid deck.** If your deck fails validation (`engine` deck checks: 50 cards, four copies per card number, colours, Leader, banned cards and pairs from `standard.json`), Start is disabled and the deck tile lists the reasons with rule references: "OP14-020 Dracule Mihawk is banned (from 2026-10-12)." The tile links to the deck builder with the problem selected.

3. **Edge, low coverage.** If either deck has unscripted cards, the tile shows "3 cards play for stats only" with a list. Start is allowed. For the AI's deck the tile adds whether a playbook exists ("Generic playbook: plays sensibly, not to this deck's plan").

### F3b. Who goes first

CR 5-2-1-4 and 5-2-1-5: rock-paper-scissors decides who **chooses**; the chooser declares first or second.

1. **State:** after Start with "rock-paper-scissors", a small RPS chooser appears in the decision bar: three buttons, Rock, Paper, Scissors, and a fourth, "Random for me".
   **Player:** picks one.
   **System:** the AI's pick comes from the seeded RNG (so rematches and replays stay deterministic), both picks show side by side for 800 ms, and ties replay automatically ("Tie, again").
   **Keys:** R, P, S, or arrows and Enter.
   **SR (polite):** "You chose Paper. Kaido chose Rock. You win and choose."

2. **If you win:** the decision bar asks "Go first or second?" with two buttons and a one-line coaching note under each, from `turn-order` content: "First: you attack first, but draw no card and get 1 DON!! on turn 1." / "Second: one card and one DON!! ahead on each of your turns." The coach's "Hint" is available here and returns the archetype guide's seat note where one exists.
   **Keys:** 1 for first, 2 for second, or arrows and Enter.
   **SR (polite):** "You choose. Go first or second?"

3. **If the AI wins:** the AI chooses after a 600 ms "considering" beat, and the decision bar says "Kaido chose to go second." The "Why?" link opens the AI's reason.

4. **Rematch rule:** in a rematch (F15), the loser of the previous game chooses, as in tournament best-of-three (TRM §4.6). No RPS. The setting "Always use rock-paper-scissors" overrides this.

5. **Edge, "At the start of the game" effects** (CR 5-2-1-5-1). If a Leader has one, it resolves now, before hands are drawn, with the chooser processing first (rulings RL-30 records the CR/Q&A conflict; the engine follows the CR). The log names it.

### F3c. Mulligan

CR 5-2-1-6: each player draws 5; starting with the player going first, each may redraw once (all five back, reshuffle, draw five). Life is then placed (CR 5-2-1-7).

1. **State:** your five cards fan out large in the centre. The opponent's five backs sit at the top. The decision bar: "Keep this hand, or redraw all five?" Two buttons: **Keep** (focused) and **Redraw**. The coach "Hint" is available and, in the coach panel, uses the archetype guide's mulligan section (see `explanations.md` E10, E11).
   **Keys:** K keep, R redraw; arrows move through the hand; I inspects.
   **SR (polite):** "Your opening hand: Nami, cost 1, Counter plus 1000; Sanji…" (all five), then "Keep, or redraw all five?"

2. **If you are going second,** the AI's decision comes first. The decision bar shows "Kaido is deciding…" for a 600 ms considering beat whether it keeps or redraws (no timing leak), then "Kaido kept" or "Kaido redrew". Then your decision.

3. **Redraw.** Your five cards slide back into the deck, the deck shuffles (one short animation, none under reduced motion), five new cards fan out. The decision bar: "This is your hand. (Redraw used.)" with a single **Continue** button. In practice modes, Undo still applies (G3), and rewinding restores the same seed, so redrawing again gives the same five (teardown decision 6). The undo toast says so: "Undo redraw · same shuffle".
   **SR (polite):** "New hand: …" then "Continue."

4. **Life placement.** Both players' Life cards move from the deck top to Life, face down (the deck's top card ends at the bottom of Life, CR 5-2-1-7). One combined animation, 800 ms. The first player's turn starts.

5. **Edge, mulligan drill link.** After the game, the review lists the mulligan as a reviewed decision (learning-ui, Game Review).

---

## F4. A full turn

**Goal:** the five phases run with no surprise and no dead clicks. Refresh, Draw and DON!! need no input unless an effect asks; the Main Phase is where the player acts.

### F4a. Start of turn (Refresh, Draw, DON!!)

1. **State:** the previous turn ends. The decision bar changes to "Your turn 4" and a phase breadcrumb (Refresh · Draw · DON!! · Main · End) highlights each step as it runs (teardown decision 4).
   **System, Refresh** (CR 6-2): "until the start of your next turn" effects end; start-of-turn effects activate (any choices prompt here); given DON!! return to the cost area rested; every rested card becomes active. One animation: DON!! slide off cards, then everything rotates upright (400 ms total).
   **System, Draw** (CR 6-3-1): one card slides to hand (none for the first player's first turn, and the breadcrumb says "No draw on turn 1").
   **System, DON!!** (CR 6-4): two DON!! flip into the cost area (one for the first player's first turn; fewer if the DON!! deck is short; the label says why).
   **SR (polite):** "Your turn 4. Refreshed. Drew Shiki. 2 DON!!: 8 DON!! active. Main phase."
   **Edge:** if a start-of-turn effect needs a choice, the sequence pauses on that step with a choice tray (F8) and the breadcrumb stays on Refresh. If the draw empties the deck, the game ends at once (CR 9-2-1-2; rules digest correction 2) and F15 opens with "Kaido wins: your deck ran out."

2. **State:** Main Phase. "At the start of the Main Phase" effects (CR 6-5-1) resolve first, with choices if needed. Then the decision bar reads "Main phase · Play, give DON!!, attack, or end your turn" and every legal action is decorated:
   - hand cards you can pay for: raised, with cost chip lit;
   - your active Leader and Characters that can attack: an attack glyph;
   - active DON!! in your cost area: lit, draggable;
   - cards with an activatable ability: an ability chip ("Activate: Main").
   The tempo meter in the coach rail shows "8 DON!! · 0 spent".

### F4b. Play a card

1. **Player:** clicks a playable hand card (or drags it to the field).
   **System:** the card lifts and the decision bar shows "Play Gloriosa for 4 DON!!? · Play (Enter) · Cancel (Esc)" with the 4 DON!! that will rest highlighted in the cost area. This is a preview, not a confirm dialog: Enter or a second click on the card plays it. Dragging onto the field plays it directly.
   **Keys:** arrows to the card in hand, P (or Enter twice).
   **SR (polite):** "Gloriosa, cost 4. Play for 4 DON!!? Enter to play."

2. **System on play:** DON!! rest, the card moves to the Character area (CR 2-7-2), its [On Play] resolves. Any choice opens a choice tray (F8).
   **SR (polite):** "You play Gloriosa. On Play: choose up to 1 Character with cost 5 or less."

3. **Edge, full Character area.** With 5 Characters, playing a sixth asks first: "Your Character area is full. Choose a Character to trash (not a K.O.: On K.O. won't trigger)." The candidates highlight; Esc cancels the whole play (CR 3-7-6-1, rules digest correction 3).

4. **Edge, Stage replacement.** Playing a Stage when one exists: "This replaces Thousand Sunny (trashed)." shown in the preview line, no extra step (CR 3-8-5-1).

5. **Edge, a card you can't play.** Clicking it shows `whyNot`: "Needs 7 DON!!; you have 4 active." or "Effect not automated yet" for an unscripted Event.

6. **Undo:** toast "Played Gloriosa · Undo". Undo restores the hand, the DON!! and the target of the On Play. If the On Play revealed hidden information (looked at the deck), the rewind is still allowed and marks the game as rewound (F11).

### F4c. Give DON!!

1. **Player:** clicks an active DON!! in the cost area, then a Leader or Character; or drags a DON!! onto the card; or selects a card and presses D (each press gives one).
   **System:** the DON!! moves under the card as a badge ("+1"), and the card's power updates at once in the tabular power chip. For several, the badge counts up ("+3"). One undo groups all DON!! given to the same card in one burst (one `intentId`).
   **Keys:** select the card, D gives 1, Shift+D takes back the last one in the current burst (an undo of one action, not a game rule).
   **SR (polite):** "Leader: 3 DON!!, 8000 power." (once per burst, after 600 ms of no further gives).
   **Edge:** a DON!! can't move once given (QA-GR); `whyNot` says so when the player tries to drag it away. Giving is not offered during battle.

2. **Coach link:** the tempo meter updates ("8 DON!! · 7 spent · 1 left"). If the coach's DON!! overlay is on, it shows the gap against the opponent's Leader for the card that just changed ("vs their Leader: 8000 vs 5000; they need 4000 to stop it").

### F4d. Activate an ability

1. **Player:** clicks the ability chip on a card (or selects the card and presses V).
   **System:** shows the cost and effect in the decision bar, with costs highlighted on the board (DON!! to rest, cards to trash, DON!! to return): "Kaido: DON!! −1 → give up to 1 opposing Character −2000 this turn. · Activate (Enter)". For a cost with a choice (which card to trash), the choice tray opens after Enter.
   **Edge:** a [Once Per Turn] ability already used shows "Used this turn" on the chip; `whyNot` gives the rule (CR 10-2-13).

### F4e. Attack

See F5.

### F4f. End the turn

1. **Player:** presses End turn in the decision bar (or E).
   **System, practice:** ends the Main Phase immediately and runs the End Phase (CR 6-6-1): [End of Your Turn] effects, then the opponent's [End of Your Opponent's Turn] effects, each with choices if any; then the three expiry tiers. The log summarises: "End of turn: Usopp sets 2 DON!! active. 5 active DON!!."
   **System, Strict:** the button becomes "Press again to end turn" for 3 s.
   **Optional nudge (setting "Warn when I end with attacks left", default off):** if active attackers remain, the button label becomes "End turn (2 attackers unused)" before the press. This is information on the button, not a dialog.
   **Blunder warning (off by default):** see `learning-ui.md`. If on and analysis finishes within 300 ms, the decision bar shows the warning inline and the press does not end the turn; a second press does.
   **SR (polite):** "Your turn ends. Kaido's turn 5."
   **Edge:** the end-of-turn effect with an "up to" choice (Nami OP14-031: set up to 5 DON!! active) opens a choice tray (F8a) with a count stepper. This is a real decision for some leaders (`explanations.md` E17).

---

## F5. Battle: declaring an attack (your attack)

**Goal:** the player sees the battle math before committing, and every step of the battle is visible as it happens (teardown decision 2).

1. **State:** Main Phase; at least one active attacker.
   **Player:** clicks an attacker (glyph lit) or drags it toward a target.
   **System:** the attacker lifts; legal targets light (opponent's Leader and rested Characters, CR 7-1-1-2); everything else dims. Pointing at a dimmed card shows `whyNot` ("Active Characters can't be attacked"). The battle panel opens in **preview** state but stays empty until a target is chosen.
   **Keys:** select the attacker, A; then arrows cycle the legal targets in reading order (Leader first); Esc cancels.
   **SR (polite):** "Shiki, 9000, attacking. Choose a target: their Leader, or Hawkins, rested."
   **Edge:** an attacker that can't attack shows why: "Played this turn (no Rush)" (CR 3-7-4); "No battles on your first turn" (CR 6-5-6-1); [Rush: Character] limits targets to Characters and the Leader shows "Rush: Character can't attack Leaders".

2. **State:** target pointed at (hover or arrow focus).
   **System:** the battle panel fills from `preview`:
   - **Attacker 9000 · Defender 5000.** Large tabular numbers.
   - **"They need 5000 to stop this"**, with the arithmetic on demand ("9000 − 5000 + 1000; ties go to you").
   - **What they can see to stop it:** active Blockers that could redirect (with their power), their on-attack effects visible on the board ("Kaido's Leader can give your attacker −2000 for 1 DON!!"), cards in hand with the coach's public bound if the DON!! overlay is on ("2 cards: up to +8000 with their deck's biggest counters").
   - **Your [When Attacking] effects** listed as "will ask" rows ("Rocks Leader: trash 1 to reveal").
   **SR (polite):** "Target their Leader, 5000. They need 5000 to stop it. Enter to attack."

3. **Player:** commits by clicking the same target again, pressing Enter, or releasing a drag on it.
   **System:** `reduce(declareAttack)`. The attacker rotates to rested and an arrow draws to the target (300 ms). The battle panel switches to **live** state with a step chip row: Attack · Block · Counter · Damage · End.
   **SR (polite):** "Shiki attacks their Leader."
   **Edge:** in Strict mode the commit is the same; there is no undo afterwards.

4. **Attack Step effects** (CR 7-1-1-3; RL-18). Your [When Attacking] effects resolve first, each as an inline prompt in the battle panel (F8d for "you may", F8a for choices). Then the defender's [On Your Opponent's Attack] effects; against the AI these play as its moves with the considering beat (F21).
   **SR (polite):** "Kaido's Leader returns 1 DON!!: Shiki −2000, now 7000."

5. **Defender's Block and Counter steps.** Against the AI: the step chips advance as the AI decides; each AI choice shows as a row in the panel ("Kaido blocks with Yamato") with a "Why?" link (F10). The panel's numbers update live.
   **SR (polite):** "Kaido blocks with Yamato. Shiki 7000 against Yamato 1000."

6. **Damage** (CR 7-1-4). The panel shows the result in words and numbers: "Shiki 7000 ≥ Yamato 1000: Yamato is K.O.'d." or "Hit: Kaido loses 1 Life (2 left)." For a Leader hit, the Life card moves to the defender's hand; if it is a Trigger the AI chooses to activate, the card flips face up in the centre for 1.2 s with its Trigger text, then resolves (F6 step 8 for the human side).
   **Edge:** Double Attack shows two damage pulses with the Trigger check between them (RL-20). Against 1 Life the panel says "Double Attack: 1 Life left, so 1 damage lands. Not a win (CR 7-1-4-1-1-1)." Banish says "Banish: Life card trashed, no Trigger."

7. **End of battle.** The panel holds the result for 1 s, then collapses to a one-line summary in the log. Battle-duration boosts expire (CR 7-1-5) and the numbers on the board return. Focus returns to the attacker's next eligible card.
   **SR (polite):** "Battle over. Their Life: 2."

8. **If the game ends** (a hit at 0 Life), F15 opens after the damage animation.

---

## F6. Battle: being attacked (the defence planner)

**Goal:** the defender plans the whole defence against live numbers and commits once. This is the hardest interaction in the product: three different rule windows (Attack Step effects, Block Step, Counter Step), resources shared between them, and an engine that takes one action at a time.

**Rules this flow must respect:**
- Order: attacker's [When Attacking] → defender's [On Your Opponent's Attack] and "when attacked" effects → Block Step → Counter Step → Damage (CR 7-1-1-3, 7-1-2, 7-1-3; RL-18).
- At most one Blocker; it must be active and not the target (CR 7-1-2-1, 10-1-4-1).
- The Block Step does not come back: a Character set active by a Counter can't then block (RL-18).
- [On Your Opponent's Attack] conditions are checked before any Counter (RL-46: OP13-001 counts active DON!! before Counter Events are paid).
- Character Counters cost nothing and come from hand; Event [Counter]s cost DON!! (CR 7-1-3-1).
- Ties go to the attacker (CR 7-1-4-1).

**Design:** one battle panel, three **lanes** in rule order, everything **staged** against chained `preview`s, one **commit** that sends the staged actions to the engine in rule order, re-validating after each.

1. **State:** the opponent declares an attack. The attack animation plays (arrow from attacker to target). The opponent's [When Attacking] effects resolve and show as rows.
   **System:** if you owe any decision in this battle, the battle panel opens in **defend** state and takes focus. If you owe none (no effect, no Blocker, no possible counter), auto-skip applies (G5) and the panel just shows the steps ticking.
   **SR (assertive):** "Kaido attacks your Leader. Kaido 7000, your Leader 5000. You need 3000 to stop it. You have 3 counter cards worth 5000. Plan your defence, or press T to take the hit."

2. **State: the defence planner.** Top: **Attacker 7000 · You 5000 · Need 3000**. Then three lanes, each collapsed to one line when it has nothing to offer:
   - **Lane 1, "When attacked"** (only if you have [On Your Opponent's Attack] or "when attacked" effects). Each effect is a row with its cost and a toggle or stepper. Examples: OP13-001 Luffy: "Rest DON!! for +2000 each: [−] 0 [+] · on Leader ▾" (stepper limited to your active DON!!, recipient picker for Leader or one Straw Hat Character); Kaido OP17-058: "Return 1 DON!!: attacker −2000" (offered only when the attacker is a Character, RL-45); Newgate OP17-040: "Trash 1 card: Leader +3000".
   - **Lane 2, "Block"**: your active Blockers other than the target, each with the result if it blocks ("Yamato 1000 vs 7000: Yamato is K.O.'d, your Leader is safe"). Choosing one changes the target in the header.
   - **Lane 3, "Counter"**: your hand, filtered to cards that can counter now: Character Counters with their value; Event [Counter]s with their DON!! cost and effect. Each card is a toggle. Cards that can't be used say why ("Needs 2 active DON!!; you have 1 left after your Leader's effect").
   - **Footer:** the predicted result and the commit button.

3. **Player stages.** Clicking a counter card (or Space on it) stages it: it lifts out of the hand fan into the lane, and every number updates from `preview`: "You 7000 · Need 1000 more". The footer reads, in order of state:
   - nothing staged: **"Take the hit"** (primary), with the consequence: "Life 4 → 3, +1 card";
   - staged but not enough: **"Play 1 counter — still hits (7000 vs 7000, ties go to the attacker)"**, in the warning style, and a one-line suggestion "Add Buckin (+1000) to stop it";
   - staged and enough: **"Stop it: play Rocks Pirates + Buckin"**, with the consequence "Hand 6 → 4";
   - staged more than needed: the footer adds "1000 more than needed" so over-countering is visible.
   **Keys:** Tab moves between lanes; arrows move within a lane; Space stages or unstages; `+`/`−` adjust a stepper; T takes the hit; Enter commits.
   **SR (polite, after each change):** "Staged Rocks Pirates, plus 2000. Your Leader 7000 against 7000: ties go to the attacker, still hits. Need 1000 more."

4. **Shared resources are shown as one pool.** Active DON!! appear once, in the header ("Active DON!!: 5"), and every lane draws from it. Staging three DON!! for Luffy's Leader leaves "2" for Event costs, and an Event needing 3 becomes unavailable with the reason. This is how RL-46 becomes visible instead of a surprise.

5. **Staging is order-free; the commit is in rule order.** The player can stage counters first and then pick a Blocker. On commit the store sends, in order: Lane 1 effects (in the order shown; if two of yours trigger together the lane shows a drag handle and order matters per F8b), then the Block decision, then each counter, then "done". The engine sees exactly the action sequence it expects.

6. **Re-validation during commit.** After each sent action, the store re-reads the view. If something the player could not have predicted happens (an [On Block] effect that draws a card, a Counter Event that draws, an opponent's replacement effect), the commit **pauses** with the remaining items still staged and a one-line note: "Mamaragan drew Nola (+2000). Add it, or finish." The commit button becomes "Finish defence". If a staged item became illegal, it unstages itself with the reason. Nothing staged is ever silently dropped.
   **SR (polite):** "Mamaragan drew a card: Nola, plus 2000. Add it or finish."

7. **Commit result.** The battle proceeds to Damage. The panel shows "Kaido 7000 < your Leader 8000: attack stopped." or the hit.
   **SR (polite):** "Attack stopped. Your Leader 8000."

8. **Trigger reveal** (CR 7-1-4-1-1-2, 10-1-5). If the attack hits your Leader and your top Life card has [Trigger]:
   **State:** the Life card flips toward you only (a private reveal; in hotseat, the curtain from F13 applies). The choice tray shows the card large with its Trigger text and two buttons: **"Activate Trigger"** and **"Add to hand"**. The preview line under each says what happens ("−3000 to Kaido's Leader this turn" / "Hand +1, Trigger unused").
   **Keys:** A activate, H add to hand (or arrows and Enter). This decision is never auto-skipped.
   **SR (assertive):** "Life card: Bad Manners Kick Course. Trigger: give up to 1 of your opponent's Leader or Character cards −3000 power this turn. Activate, or add to hand?"
   **Edge:** an activated Trigger reveals the card to both players; declining keeps it hidden from the opponent (CR 10-1-5-2). A Trigger with its own cost (DON!! −2, RL-25) shows that cost and is unavailable if you can't pay it. Under Double Attack, the second Life card's Trigger is asked separately, after the first resolves (RL-20). Under Banish, there is no Trigger prompt; the panel says "Banish: Life card trashed".

9. **Replacement effects mid-battle** (CR 8-1-3-4). If your Character would be K.O.'d and a "may … instead" replacement applies (King EB04-031, Rosinante OP12-061, Laboon OP15-035), F8e runs inside the battle panel before the K.O. animation.

10. **Edge, nothing you can do.** No effects, no Blocker, no counters: the panel shows the steps ticking and the hit; with "Always ask" on, it waits on **"Take the hit"** instead.

11. **Edge, attack moved away.** If an effect moves the attacker or target before damage (CR 7-1-1-4), the panel says "Battle ends: Kaido left the field" and staged items unstage.

12. **Edge, the defender is the AI and you are the attacker.** The AI never uses this panel; its choices appear as rows (F5 step 5).

---

## F7. Auto-skip of empty windows

Covered in G5. The flow-level details:

1. **State:** a battle starts and the defender has nothing to do in a window.
   **System:** applies the single legal action (`pass`), records it, shows the step chip ticking for 400 ms at 1× ("Block · none available"). Several empty windows in a row collapse into one tick sequence, under 1 s in total.
2. **Setting "Always ask me"** (Settings → Game → Auto-skip). With it on, every window waits for an explicit "Take the hit" / "No block" / "Done". Useful for learners and for screen-reader users who want each step stated. The tutorial forces it on in T5.
3. **What the log keeps:** "No Blocker available" and "No counter" lines stay in the log for review. Review flags never count an auto-skipped window as a decision.
4. **Edge:** if a window had a legal action that the auto-skip logic considered a no-op but the player wanted (for example declining an "up to 0" effect), there is no loss: "changes nothing" is decided by the engine (ARCHITECTURE §2.3).

---

## F8. Effect choices

All effect choices use the **choice tray**, anchored to the card whose effect is resolving, with the board still visible. The resolving effect's text is always shown at the top of the tray, with the current clause highlighted (no hidden state, principle 4).

### F8a. Multi-select with a running count and one commit

Engine: one `pick` at a time, then `done`, in canonical order, with completability lookahead (ARCHITECTURE §2.3). UI: a multi-select with one commit.

1. **State:** an effect says "Rest up to 2 of your opponent's Characters with a cost of 8 or less" (Nami OP14-031).
   **System:** eligible cards light on the board; ineligible ones dim and explain on hover ("Cost 10: over 8"). The tray shows **"Choose up to 2 · 0 chosen"** and the commit button **"Rest 0 Characters"** (enabled, since "up to" allows 0, CR 8-4-4-1).
   **SR (polite):** "Nami: rest up to 2 of your opponent's Characters with cost 8 or less. 2 eligible: Yamato, Queen."

2. **Player:** clicks cards to toggle them (or Space on each).
   **System:** each toggle updates the count and the button ("Rest 2 Characters"). Candidates that could no longer complete the choice dim with the reason from completability: "Total cost would be 11 (max 9)" (OP17-118 Xebec), "Same name as Shiki, already chosen" (different-names constraint), "Exactly 2 required: choose 1 more" (exact-N).
   **SR (polite):** "Yamato chosen. 1 of up to 2."

3. **Player:** commits (Enter or the button).
   **System:** sends `pick` for each chosen card in the engine's canonical order, then `done`. The order the player clicked does not matter and is not shown as meaningful.

4. **Counts and classes for DON!!.** DON!! choices are by class with a count (ARCHITECTURE §2.3, E-D4): "Return 1 DON!!: from active (5), rested (2), or given to Shiki (3)". The tray shows a stepper per class and a total ("1 of 1").

5. **Edge, exact count impossible.** If fewer eligible cards exist than required, the engine has already adjusted the requirement ("as many as possible", CR 8-4-4-1); the tray says "Only 1 eligible: choose it".

6. **Edge, choosing hidden cards from a secret area by a requirement:** the player may choose none even if a valid card exists (CR 8-4-4-2). The commit button reads "Choose none" when nothing is selected.

### F8b. Ordering simultaneous effects

CR 8-6: the turn player orders their own simultaneous effects; the opponent's resolve after; new triggers queue behind (rules digest items 127–130).

1. **State:** two or more of your effects trigger at once (for example two [End of Your Turn] effects, or an [On Play] and a "when a Character is played" effect).
   **System:** the tray shows a **"Resolve in this order"** list, pre-sorted by the engine's suggested order, with each effect's card, timing word and a one-line summary. The opponent's pending effects show greyed below, labelled "Then Kaido's: …", so nothing is hidden.
   **Player:** drags items to reorder, or uses Alt+Up/Down; Enter commits.
   **SR (polite):** "Two of your effects trigger. Order: 1, Usopp, set 2 DON!! active. 2, Sanji, set 1 DON!! active. Alt+arrows to reorder, Enter to resolve."

2. **Skip rule:** if all pending effects are the same card's identical effect (two copies of Usopp), the order cannot matter and the tray is skipped with a log line. Otherwise it is always asked; the default order is one keypress away.

3. **Edge, new trigger during resolution:** a new effect that triggers while resolving joins the list behind the ones already queued (CR 8-6-1-1) and the tray reappears only if a new ordering choice exists.

### F8c. Choosing from revealed cards

1. **State:** "Look at 5 cards from the top of your deck; reveal up to 1 Straw Hat Crew type Character other than [Nami] and add it to your hand. Then place the rest at the bottom of your deck in any order." (OP01-016)
   **System:** the tray expands beside the deck and shows the five cards large. Eligible cards are full colour; ineligible ones are dimmed with a reason badge ("Event", "Named Nami"). Commit: **"Add Sanji to hand"** or **"Add none"**.
   **Keys:** arrows move across the cards; I inspects one; Space selects; Enter commits.
   **SR (polite):** "Looking at 5: Sanji, eligible; Brook, eligible; Gum-Gum…, not eligible: Event; … Choose up to 1."

2. **Ordering the rest.**
   - **Bottom of deck:** the order rarely matters. By default the tray places them in the shown order and logs it. Setting "Ask me to order cards I put on the bottom" turns this into a step.
   - **Top of deck** (Streusen OP17-050: "reorganize them in any order and place them at the top or bottom"): always asked, because the next draws depend on it. Each card has Top/Bottom toggles and drag handles; the preview shows "Next draw: Shiki".

3. **Opponent's look-at effects.** You see "Kaido is looking at the top 5 of its deck", then the revealed card if one is revealed ("added Queen"), then "4 to the bottom". Hidden cards are never shown (ARCHITECTURE §2.7).

### F8d. Optional "you may" prompts

1. **State:** an effect with "may" or "up to" with a real choice: "Sanji [On Play]: set up to 2 of your DON!! active".
   **System:** an inline prompt anchored to the card, in the decision bar's style: the effect text, its cost if any, and two buttons, **"Use"** and **"Skip"**. The preview under "Use" shows the result ("5 active DON!!").
   **Keys:** U use, N skip, or Enter on the focused (Use) button.
   **SR (polite):** "Sanji, On Play: set up to 2 DON!! active. Use or skip?"
2. **Optional costs** ("You may trash 1 card from your hand: …"): "Use" leads into the cost choice (F8a). Skipping the cost skips the effect (CR 8-3-1-4).
3. **Never auto-declined.** A "may" with a real effect always asks, even with auto-skip on. A "may" with no legal target logs "No target: skipped" (QA-GR "target is not present").
4. **During the opponent's turn**, an optional effect of yours that triggers (an [On Your Opponent's Attack] outside a battle panel, or OP05-098 Enel's Life refill) uses the same prompt with the assertive SR announcement.

### F8e. Replacement prompts

CR 8-1-3-4: "instead" effects. Optional ones ("may") become an `optional` decision that can suspend an operation mid-battle or mid-effect (ARCHITECTURE §2.4).

1. **State:** an operation is about to happen to your card, and a replacement could apply. Example: Gloriosa's [On Play] would put your Usopp OP14-022 at the bottom of your deck; Laboon OP15-035 can replace that.
   **System:** pauses the opponent's animation at the moment of the effect (the arrow from Gloriosa to Usopp is drawn and held). The tray says what is about to happen and offers the replacement: **"Gloriosa would put Usopp on the bottom of your deck. Laboon: rest 2 of your cards instead?"** with **"Rest 2 instead"** and **"Let it happen"**. Each has its preview.
   **SR (assertive):** "Gloriosa would put your Usopp on the bottom of your deck. Laboon can replace this: rest 2 of your cards instead. Replace, or let it happen?"

2. **Several replacements apply** (Laboon, Zoro OP17-095 and Kyo can stack on the same event in different decks): the tray lists them in the CR 8-1-3-4-2 order (the card that generated the situation first, then the turn player's, then the non-turn player's) and asks for each in turn; each applies at most once (CR 8-1-3-4-3).

3. **Mandatory replacements** (no "may") apply without a prompt and log: "King: returned 1 DON!! instead of being K.O.'d." (Only optional ones ask; rules digest Q6.)

4. **Edge, impossible replacement** (Rosinante at 0 Life, RL-41): not offered. If the player looks for it, the inspector's "Why not offered?" says "Rosinante's replacement needs a Life card to add."

---

## F9. Hint

**Goal:** a hint returns a line, not a single action (plan-review UX-3), and never acts on its own. Full panel design in `learning-ui.md`.

1. **State:** any decision you owe. The coach rail's Hint button is enabled.
   **Player:** presses Hint (H).
   **System:** the coach panel expands if collapsed (it never covers the board), shows "Thinking… (Esc to stop)" and sends a hint request at the second-highest worker priority (ARCHITECTURE §5). Typical budget 1.5–2.5 s.
   **SR (polite):** "Hint: thinking."

2. **Result:** a numbered line with a one-paragraph reason (`explanations.md` E15):
   1. Play Nami: rest Yamato and Queen.
   2. Give 1 DON!! to your Leader.
   3. Attack Yamato with your Leader.
   4. Attack Queen with Bonney.
   5. End turn: Nami sets your 5 DON!! active.
   Each step has **"Show"**, which highlights the cards involved on the board; step 1 has **"Do step 1"**, which stages it exactly as if the player had clicked it (the player still commits). The reason, evidence, outcome and "Next time" follow.
   **Keys:** Down/Up move through steps; Enter on a step shows it; Shift+Enter does it.
   **SR (polite):** the claim, then "5 steps. Step 1: Play Nami: rest Yamato and Queen."

3. **Following the line.** As the player performs steps, completed steps tick. If the player deviates, the hint greys out with "Board changed: ask again" (one key, H). Hints are never re-run automatically.

4. **Edge, defensive decisions.** A hint during the defence planner returns the staged set ("Stage Rocks Pirates and Buckin, block with nothing") and offers "Stage this"; the player still commits.

5. **Edge, the AI is thinking.** The AI's own move outranks hints. The hint shows "Waiting for Kaido's move" and starts when the worker is free.

6. **Edge, budget runs out.** The hint returns its best line with certainty `search-incomplete` and the label "Best found, not fully checked".

7. **Records.** Each hint request is stored with the decision it was asked at. Progress and review show "hinted" on those decisions; hints never make a game "rewound".

8. **Drills:** "Hint" is renamed "Show answer" and counts the item as missed.

---

## F10. "Why did it do that"

1. **State:** the AI has just moved, or any AI move is in the log.
   **Player:** presses Why (W) for the last AI move, or the "Why?" link on any AI log line or battle-panel row.
   **System:** the coach panel shows that decision's `Explanation` (`explanations.md` E12–E14, E16). No search: the explanation was produced with the move.
   **SR (polite):** the claim, then evidence lines.

2. **Only public information.** The AI's explanation is filtered before it reaches the UI: it may cite the board, public counts, cards already revealed, and its archetype's general plan. It never cites cards in its hand, its deck order, or its Life (PROMPT "Rules the AI must obey"). A turn plan shows only the steps already taken; future steps stay hidden until they happen.

3. **Forced moves:** "Only legal move." **Auto-skipped AI windows:** no "Why?" link, since there was no choice (and the link's absence must not leak anything; the AI's considering beat is uniform, G5).

4. **Edge:** for the Rookie tier, "why" says "Rookie picks a random legal move, except that it always blocks or counters a lethal attack." That is honest and teaches what the tier is.

---

## F11. Rewind

ARCHITECTURE §5: rewind steps back by player-level move (`intentId`); "back to my last decision"; rewinds are marked in the record and rewound games are excluded from win-rate statistics.

1. **State:** any time in a practice mode. The rewind control sits next to the decision bar: **⟲ Back one move**, a menu with **"Back to my last decision"**, and **⟳ Forward** (enabled only after a rewind, until a new move is made).
   **Player:** presses Back (Ctrl/Cmd+Z).
   **System:** the store replays the record up to the previous move boundary (from the nearest checkpoint, ARCHITECTURE §5), animates the reversal briefly (200 ms, none under reduced motion), and shows a toast: "Back to: you gave 3 DON!! to your Leader."
   **SR (polite):** "Rewound: you gave 3 DON!! to your Leader. Your decision: Main phase."

2. **"Back to my last decision"** (Alt+Z). Steps back over all opponent moves to the last point where you owed a decision. During the AI's turn this also stops the AI's queued animation. It is the main recovery tool after a bad attack is countered.

3. **Forward** (Ctrl/Cmd+Shift+Z). Replays the moves undone, exactly. Any new move discards the forward branch, with no prompt (the branch is still in the record as a rewound branch for review).

4. **Determinism is stated.** The first rewind of each game shows one line under the toast: "Same shuffle: rewinding won't change your draws." (teardown decision 6). Rewinding past a reveal (a draw, a Life card, a look at the deck) restores the same cards.

5. **Marking.** From the first rewind, the game header shows a small "Rewound" tag. The game still saves, reviews and appears in history, but does not count in win rate (Progress says "3 rewound games not counted"). Hints do not mark a game; only rewinds do.

6. **Edge, Strict mode:** the control is absent, not disabled.

7. **Edge, hotseat:** a rewind needs both players' agreement. The control asks "Rewind for both players? The other player presses Enter to agree." A rewind across a handoff returns the screen to the handoff curtain (F13) for whoever owes the decision.

8. **Edge, rewind during an AI search:** the search is cancelled (`cancel(id)`) and restarted for the restored position when the AI next owes a decision.

9. **Edge, long rewinds:** the timeline menu (from the rewind control) lists every move of the game grouped by turn, so the player can jump many moves at once. It uses the same rows as the log.

---

## F12. Confirm versus undo

The policy is G3. This flow states it as an interaction table so the wireframes can be checked against it.

| Action | Practice modes | Strict |
| --- | --- | --- |
| Play a card | Immediate; undo toast | Preview in decision bar, then commit (second click or Enter) |
| Give DON!! | Immediate; undo groups a burst | Immediate; no undo (a give can't be reversed in the rules either) |
| Activate an ability | Cost preview, Enter commits; undo | Same, no undo |
| Declare an attack | Preview on target, second click commits; undo | Same, no undo |
| Effect choice (multi-select, order, revealed cards) | Staged, one commit; undo | Staged, one commit |
| Defence (effects, block, counters) | Staged, one commit; undo | Staged, one commit |
| Take the hit | One press; undo | Press again within 3 s |
| Trigger: activate or add to hand | One press; undo | Press again within 3 s |
| Mulligan redraw | One press; undo restores the same hand | Press again within 3 s |
| End turn | One press; undo | Press again within 3 s |
| Concede | Dialog | Dialog |
| Leave an unsaved game | Dialog | Dialog |

Why undo is preferred in practice: confirmations interrupt every move to protect against rare mistakes, and players learn to click through them. Undo costs nothing until it is needed, and in a learning tool, trying a move and taking it back is itself useful. The cost of undo (fishing for information) is removed by deterministic rewind and by marking rewound games.

---

## F13. Play both sides (open hands) and hotseat

Two different things (ARCHITECTURE §2.7, plan-review UX-7).

### F13a. Open hands (one person, both sides)

1. **Setup:** mode "Open hands". Both decks chosen by you; no AI tier.
2. **State:** both hands visible, face up: yours at the bottom, the other side's at the top, full size on 1920×1080 and in a compact face-up fan on 1280×720 (cards enlarge on focus). Life stays face down for both sides (it is secret to both players, CR 3-10-2).
3. **Decisions:** whoever owes the decision gets the decision bar; the bar names the side in words and colour plus icon: "Top player · Counter step". There is no handoff.
4. **Coach:** works for whichever side owes the decision. The lethal detector runs in `actual` mode (both hands are known).
5. **Use:** studying a matchup, testing lines, reproducing a game from paper.

### F13b. Hotseat (two people, one device)

1. **Setup:** mode "Hotseat"; each player names their side ("Chris", "Sam") and picks a deck.
2. **Handoff at turn change.** At the end of each turn the board blurs and a full-screen curtain appears: **"Pass to Sam · Press Space when ready"**. Both hands are hidden behind the curtain. Space (or a click) lifts it for the incoming player only.
   **SR (polite):** "Pass to Sam. Press Space when ready."
3. **Mid-turn defensive windows.** Every attack gives the defender a decision; a full handoff per attack would mean a dozen curtains per turn. Instead:
   - The battle panel opens with the defender's hand **hidden**: "Sam to defend. Sam: press and hold R to see your hand." While R (or a long press on the hand) is held, the defender's hand and the defence planner show; staging works with the other hand on the mouse or with Tab/Space. Releasing R hides the hand again but keeps staged items (shown as face-down "2 staged").
   - The attacker is asked by the curtain line "Chris, look away" for the duration. This is a social convention, as at a real table, not security.
   - The defence commit happens while R is held, or with the hand hidden (the button stays visible).
   - Triggers use the same press-and-hold reveal.
   - Setting "Full handoff for every defence" uses a curtain for each battle instead, for players who prefer it.
4. **Auto-skip in hotseat** follows G5: the Counter window is skipped only when the defender's hand is empty.
5. **Coach in hotseat:** available to whoever owes the decision, but its panel is hidden behind the curtain at handoff. Lethal detector runs in `public` mode for each side.
6. **Edge:** a hotseat game can be saved and resumed; resuming starts at a curtain.

---

## F14. Concede

1. **Player:** opens the game menu (Esc when nothing is staged, or the menu button) and chooses **Concede**.
   **System:** dialog, the only modal in a game: "Concede this game? It counts as a loss. You can still review it." Buttons: **Concede** and **Keep playing** (focused).
   **SR:** the dialog is announced by role; focus is trapped in it until it closes.
2. **On concede:** the game ends with `result: { winner: opponent }` and a `conceded` flag in the record; F15 opens.
3. **Edge, rewound game:** concede still allowed; still excluded from win rate.
4. **Edge, hotseat:** either player can concede on their own turn or decision.

---

## F15. Game end and rematch

1. **State:** the game ends (a hit at 0 Life, deck-out, concession, simultaneous loss shown as a draw, or a loop draw, rules digest correction 10).
   **System:** the board stays visible, dimmed, with the final position. A result card slides over the centre (not over the coach panel): **"You win · Turn 9 · Your Leader hit at 0 Life"** or **"Kaido wins: your deck ran out (CR 9-2-1-2)"**. The card shows four actions:
   - **Review this game** (focused). Starts analysis (F16).
   - **Rematch.** Same decks, same AI tier, new seed. The loser of this game chooses first or second (F3b step 4).
   - **New game.** Opens Setup with these settings.
   - **Home.**
   **SR (assertive):** "Game over. You win on turn 9." Then polite: "Review this game, Rematch, New game, Home."
2. **Background analysis starts at once** at the lowest worker priority, so Review opens fast if chosen; Rematch cancels it but keeps partial results, and the game appears in "Games to review".
3. **Edge, rewound game:** the result card adds "Rewound: not counted in your win rate".
4. **Edge, draw:** "Draw: both players lost at the same time (CR 9-2-1)."

---

## F16. Post-game review

The screen design is in `learning-ui.md` ("Game Review"). This is the flow.

1. **Player:** chooses Review this game (F15), or opens a saved game from History.
   **System:** opens the review screen. If analysis is still running, the timeline fills turn by turn with a progress line: "Analysing turn 4 of 11". A 300-decision game finishes in under 60 s (PLAN M8). The player can browse finished turns while later ones are analysed.
   **SR (polite):** "Review. Analysing turn 4 of 11." then, at the end, "Review ready: 3 flags."

2. **State:** horizontal turn timeline with flags; flag list; board at the selected moment.
   **Player:** selects a flag (click, or Left/Right through flags with Enter).
   **System:** restores the board to the moment of that decision (from the record; for display only), shows "What you did", "Stronger line", "Difference", the certainty label and the lesson link (`explanations.md` E01–E09, E19). The stronger line can be stepped through on the restored board.

3. **Replay from here.** "Play from here vs Kaido" starts a new game from that state (as a scenario with the full hidden state from the record, since the original game is over). The AI is the same tier. The new game is marked "from review" and excluded from win rate.

4. **Practice this.** Turns the flag into a puzzle (`learning-ui.md`, "Practice this"). The puzzle is added to the lethal-puzzle bank or the counter-or-take bank, depending on the flag's kind.

5. **Edge, stale record.** If the record's engine, card or script versions differ from the current build, the review opens read-only from its snapshots (ARCHITECTURE §2.9): timeline and flags viewable; "Play from here" and "Practice this" disabled with "This game was played on an older version. You can read the review, but not replay it."

6. **Edge, analysis cancelled or incomplete.** Unanalysed turns show as hatched on the timeline with "Not analysed" and a "Analyse now" button. A turn whose search hit its cap shows "Not fully checked" (`search-incomplete`) and is never displayed as clean.

---

## F17. Deck builder

1. **State:** two panes: card browser (search, filters by colour, cost, type, category, set, "in meta lists", "automated only") and the deck (Leader slot, 50-card list grouped by cost or category, DON!! deck size, coverage bar).
   **Player:** chooses a Leader first (the browser filters to legal colours after that).
   **Keys:** `/` focuses search; arrows move in results; `+`/`−` (or Enter/Backspace) add and remove one copy; Tab moves between panes.
   **SR (polite):** "Added Nami. 4 of 4 copies. Deck 23 of 50."

2. **Validation, live.** Each rule shows as a check row at the deck's top, with the rule reference: "50 cards (23)", "Max 4 per card number (CR 5-1-2-3)", "Colours match Leader", "No banned cards or pairs (from 2026-10-12)", "Standard blocks 2–5". Failing rows say exactly what fails and highlight the cards. The four-copy limit counts by card number across printings and alt arts (rules digest correction 13).

3. **Coverage %.** A bar under the deck: **"Automated: 47 of 50 cards (94%) · 14 of 16 card names"**. Coverage is counted by copies (what you will draw) with names as the second figure. Unscripted cards carry the "Effect not automated" badge, and a disclosure lists them with what that means: "Plays for its power and Counter; its effect won't happen. Keywords like Blocker still work where listed." (ARCHITECTURE §2.4)

4. **Import.**
   **Player:** chooses Import and pastes text (or drops a .txt/.json file).
   **System:** parses the common formats: `4xOP01-016`, `4 OP01-016`, `4 Nami OP01-016` (Limitless style), with or without a Leader line. It shows a line-by-line report: OK, "Unknown card ID", "Name doesn't match ID: using the ID", "5 copies: over the limit", "Not in Standard", "Colour doesn't match Leader". Nothing is applied until **"Import 50 cards"**. Lines with errors can be fixed inline or dropped.
   **SR (polite):** "Import: 17 lines read, 16 OK, 1 problem: line 9, unknown card ID OP17-999."
   **Edge:** an import with no Leader asks for one; an import whose Leader is unknown is rejected with the reason.

5. **Export.** Choose a format (the same three) and **Copy** or **Download**. A round trip of a tournament list must be lossless (PROMPT M6): the export of an imported list equals the input, normalised.

6. **Alt arts.** In the deck list, a card's art switcher (arrows on the card, or A on focus) cycles its artworks. This is cosmetic, stored locally (PROMPT "Art at runtime").

7. **Load into a game.** "Play with this deck" opens Setup with it selected; "Play against this deck" makes it the AI's deck (generic playbook unless it matches an archetype's Leader, in which case the setup offers that archetype's playbook).

8. **Edge, unsaved changes:** leaving asks "Save changes to 'Rocks test'?" (one of the few dialogs, G3).

---

## F18. Meta explorer

Screen design in `learning-ui.md`. The flow:

1. **Grid** of archetypes → select a tile (Enter) → **guide page** (what it does, game plan, key cards, mulligan, weaknesses, matchups, three sourced lists).
2. From the guide or a list: **"Play this deck"** (Setup with your deck = this list, AI deck = last used) or **"Play against this deck"** (AI deck = this list with its playbook; your deck = last used).
3. **Matchup grid** (from the grid's view switch, M) → select a cell → the one-line plan, its source tag or "inference" mark, and "Play this matchup".
4. **Edge:** a list older than 60 days carries "List may be out of date (73 days)" (PROMPT Meta Explorer); the guide's as-of date is always visible.

---

## F19. Drills

All four drills share one shell: a start screen (archetype or concept filter, number of items, optional timer), an item screen, an answer screen with an `Explanation`, and a summary. Timers follow WCAG 2.2.1 (details in `learning-ui.md`): off by default, adjustable, pausable, and never gate progress.

### F19a. Mulligan trainer

1. **State:** an opening hand for a chosen archetype, with the seat shown ("You go first") and the opponent's Leader.
   **Player:** Keep (K) or Redraw (R).
   **System:** answer screen: the guide's verdict and reasoning as an `Explanation` (`explanations.md` E10, E11), the three mulligan questions with this hand's answers, and the odds of a better redraw.
   **SR (polite):** hand, seat, then after answering: "Correct: keep. Turn-1 play, a piece of the plan, and 6000 of counter."

### F19b. Lethal puzzles

1. **State:** a board from a scenario (often from a review flag). The header says "Find lethal, or declare none." The defender's hand is shown as "3 cards, up to +4000 each" (public mode); behind it, the scenario holds the strongest hand the public search found, so a line that wins here wins against any hand.
   **Player:** plays the turn on the real board (all of F4 and F5), with undo; or presses **"No lethal"** (N).
   **System:** the defender plays its best defence from that hand. Win → correct. "No lethal" when lethal existed → shows the line. Lethal attempted and stopped → shows the refutation ("They stop Shiki with two +2000 Events").
   **Coach:** the guided count is available ("Count it with me", `learning-ui.md`), and using it doesn't mark the item wrong. "Show answer" does.

### F19c. Counter or take it

1. **State:** an incoming attack with your hand and board shown; the defence planner (F6) is the input.
   **Player:** stages and commits, or takes the hit.
   **System:** the analysis compares the choice with the alternatives and explains (`explanations.md` E04, E05, E19).

### F19d. DON!! allocation

1. **State:** a Main Phase with several playable lines.
   **Player:** plays the turn on the board and presses **"Submit turn"**, or switches to **"Choose a line"**, which lists 3–4 described lines to pick from (shorter for keyboard and screen-reader users, and equivalent for scoring).
   **System:** scores each line, shows the player's line against the best two, and explains with the tempo meter's terms.

---

## F20. Settings

Settings are one page with sections; every change applies at once and is stored in `localStorage` (ARCHITECTURE §5).

| Section | Setting | Options | Default |
| --- | --- | --- | --- |
| Game | Animation speed | 0.5×, 1×, 2×, 4×, Instant | 1× |
| Game | Reduced motion | Follow system, On, Off | Follow system |
| Game | Auto-skip empty windows | Auto-skip, Always ask me | Auto-skip |
| Game | Warn when I end with attacks left | On, Off | Off |
| Game | Rewind | Practice (on), Strict (off) | Practice |
| Game | Ask me to order cards I put on the bottom | On, Off | Off |
| Game | Hotseat: full handoff for every defence | On, Off | Off |
| Coach | Coach verbosity | Learner (evidence open, "next time" shown), Standard (claim and outcome; evidence on demand), Terse (claim only) | Standard (Learner for the first game after the tutorial) |
| Coach | Lethal detector | Off, Tier 1 always on, Tier 2 always on, Ask me | Ask me |
| Coach | Blunder warning | On, Off | Off |
| Coach | Tempo meter | On, Off | On |
| Drills | Timed drills | Off, On | Off |
| Drills | Time allowed | 50% to 300% of the base time, or untimed | 100% when on |
| Cards | Art variant | Per card in the deck builder; global "Prefer base art" | Base art |
| Cards | Show card text on the board | Always, On hover/focus | On hover/focus |
| Keyboard | Single-key shortcuts | On, Off, remap (WCAG 2.1.4) | On |
| Data | Export everything / Import / Delete all | | |
| About | Sources, licences, disclaimer | | |

**SR (polite) on each change:** "Animation speed: 2×."
**Edge:** "Delete all" is a dialog that names what will be lost and offers "Export first".

---

## F21. AI turn pacing

**Goal:** an AI turn of 8 s or less at 1×, including animation (ARCHITECTURE §4.1), that a human can follow, and a way to get to your next decision at once.

1. **Turn start.** The AI's Refresh, Draw and DON!! animations play (about 800 ms) while the worker plans the turn (`planTurn`, about 2.5 s for Warlord). The opponent's nameplate shows **"Kaido is thinking"** with an indeterminate bar only if planning is still running when the animations finish. Nothing spins over the board.
   **SR (polite):** "Kaido's turn 5. Kaido is thinking." (the second sentence only if the thinking state shows).

2. **Moves play in sequence**, each with a fixed hold so a human can read it:

   | Event | Duration at 1× |
   | --- | --- |
   | Play a card (move + On Play name) | 500 ms + 300 ms hold |
   | Give DON!! (one burst to one card) | 400 ms |
   | Activate an ability | 400 ms + 300 ms hold |
   | Declare an attack (rest + arrow) | 500 ms + 400 ms hold before your decision |
   | Battle result | 400 ms + 600 ms hold |
   | Effect choice by the AI (targets highlighted) | 300 ms + 300 ms hold |
   | "Considering" beat before any AI defensive or optional decision (uniform, G5) | 600 ms |

   A typical Warlord turn (start of turn, 2 plays, 2 DON!! bursts, 3 attacks that need no decision from you, 1 ability, no optional effects) is 0.8 + 2 × 0.8 + 2 × 0.4 + 3 × (0.9 + 1.0) + 0.7 = 9.6 s of animation by this table. That is over the 8 s target, so two rules bring it under: DON!! bursts given before an attack are merged into the attack declaration (−0.8 s), and the battle-result hold is skipped when the next move is another attack by the same player with no change to the defender's board (−0.6 s per chained attack). Result ≈ 7.6 s. Time spent on your own defensive decisions does not count against the 8 s.

3. **Thinking during animation.** The worker searches while moves animate (ARCHITECTURE §4.1). A re-search (after your counter broke the plan) usually finishes within the battle-result hold. If not, the nameplate shows "Kaido is thinking" after 400 ms of idle board.

4. **Skip to my decision.**
   **Player:** presses **"Skip to my decision"** in the decision bar (S), available whenever the AI has two or more moves queued or is thinking.
   **System:** applies queued moves without animation, and keeps doing so until you owe a decision or the AI's turn ends. It then shows a **"While you skipped"** list in the log, each line expandable: "Played Gloriosa: your Nami to the bottom of your deck." Your own decisions are never skipped; skipping stops at the defence planner, at a Trigger, at a replacement prompt.
   **SR (polite):** "Skipped 4 moves. Kaido played Gloriosa, gave 3 DON!! to Shiki, attacks your Leader with Shiki." then the assertive defence prompt.

5. **Speed changes mid-turn** apply to the next event. Instant behaves like a permanent "skip to my decision" with the same summary.

6. **Edge, the AI exceeds its budget.** The worker returns its best move at the budget (ARCHITECTURE §4.1); a CI test enforces budgets. If the app sees a decision take more than 3 s, the nameplate adds "Still thinking…" with no other change.

7. **Edge, reduced motion.** Holds stay (they are reading time, not motion); moves cross-fade.

---

## Open questions

**Q1. Hotseat privacy for defensive windows.** Every attack hands a decision to the defender, so hotseat needs some form of privacy many times per turn. The draft proposes a press-and-hold reveal of the defender's hand inside the battle panel, with "look away" as a social convention and a setting for a full curtain per battle. It is unproven that press-and-hold is comfortable while also staging counters with a pointer (it is with the keyboard: hold R, Tab, Space). Current best answer: ship press-and-hold as the default and test it in the slice-checkpoint owner session; if it fails, make the full curtain the default and keep auto-skip of truly empty windows to reduce the count.

**Q2. Should Strict mode exist in v1?** It exists because principle 3 says irreversible steps are confirmable and because a player preparing for tournaments may want no undo. It adds a second commit style to test. Current best answer: keep it, because it is a setting on top of the same staged commits (only end turn, take the hit, Trigger and redraw gain a second press), and it gives the review a population of games with no rewinds. Revisit if the slice checkpoint shows nobody uses it.

**Q3. Default animation speed for an experienced player.** The owner knows the rules; 1× is tuned for following, and he may find it slow. Current best answer: 1× default, with the speed control in the decision bar's overflow and remembered per profile; the "I know the rules" branch does not change it, because pacing is also what makes the AI's turn readable and SeaKing's pacing is (unobserved). Ask the owner in session 1.

**Q4. Attack preview step for experts.** Preview-then-commit costs one extra click per attack. The draft keeps it because the math is the teaching moment, and drag commits in one gesture. An alternative "quick attack" setting (first click on a target commits) is not in the draft. Current best answer: no quick-attack setting until the owner session shows the second click is a real cost; drag already serves experts.

**Q5. What SeaKing does for hint, rewind and review presentation.** Several choices here (hint as a line with "Do step 1", rewind by move with a jump list, certainty labels) were chosen partly to exceed SeaKing, whose actual behaviour is (unobserved) by this project. Current best answer: keep the choices, since each stands on its own reasoning, and list them for the owner's SeaKing session (PLAN row 6) so any of them can be revisited with evidence.

**Q6. Key map.** The single-letter keys in this file (A, D, P, E, T, H, W, S, K, R, U, N, V) are proposals and collide in places with the meaning in different contexts (R is "redraw" in the mulligan and "reveal hand" in hotseat; H is "hint" and "add to hand" in the Trigger tray). Context-scoped keys are common, but the collision on H inside the Trigger tray is a real risk. Current best answer: `accessibility.md` owns the final map; this file's proposal is that tray-scoped keys win inside a focused tray, and Hint moves to Shift+H inside any tray.

## Proposed decisions

**D1. Commit, not confirm.** Context: principle 3 asks for confirmable irreversible steps and rewindable most steps; plan-review UX-7 asked Phase 4 to settle confirm versus undo; confirmation dialogs on every move train players to click through them. Decision: multi-part decisions are staged and committed once, with a button that names the result; single-step actions apply immediately with undo in practice modes; attacks preview on the first target click and commit on the second; Strict mode adds a second press only to end turn, take the hit, Trigger and redraw; real dialogs exist only for concede, unsaved leave, delete and overwriting import. Alternatives rejected: a confirm dialog per irreversible action (interrupts the flow and is clicked through); undo only, with no staging (counters and multi-target choices need a preview of the combined result before anything happens); a global "confirm everything" setting (doubles the test surface for little gain).

**D2. One defence planner with three lanes and a single commit.** Context: the engine takes one defensive action at a time in rule order (Attack Step effects, Block, Counter), resources such as active DON!! are shared across those windows (RL-46), and the player needs to see the combined result before committing. Decision: the battle panel becomes a defence planner with lanes for "When attacked" effects, Block and Counter; everything is staged against chained `preview`s; one commit sends the actions in rule order and re-validates after each, pausing with the rest still staged if something unpredictable happens (a draw, a replacement). Alternatives rejected: three sequential prompts (the player can't see that resting DON!! for the Leader leaves too few for a Counter Event until it is too late); committing each counter as it is clicked (no way to back out of a partial set; mis-clicks become irreversible in Strict mode); letting the player stage across a Block Step that has already passed (the Block Step does not come back, RL-18).

**D3. Multi-select with a running count, canonical picks underneath.** Context: the engine requires one pick at a time in canonical order for search efficiency (ARCHITECTURE §2.3); players think in sets. Decision: every multi-card choice is a toggle multi-select with a running count, live completability (ineligible candidates dim with a reason), and one commit; the store sends picks in canonical order. Alternatives rejected: sequential pick prompts (slow, and implies an order that does not matter); exposing the canonical order to the player (meaningless to them).

**D4. Auto-skip that never leaks hidden information.** Context: auto-skip of empty windows is the default (ARCHITECTURE §2.3), but whether a Counter window is empty reveals something about a hidden hand, and the speed of the AI's defensive decisions could reveal whether it had options. Decision: a human's empty window is skipped only when no other human could learn from it (always against the AI; in hotseat only when the defender's hand is empty); every AI defensive or optional decision takes a uniform 600 ms considering beat; skipped steps still tick visibly and are logged. Alternatives rejected: skipping by the decider's information alone (leaks hand contents in hotseat); never skipping (prompt fatigue, the problem plan-review UX-7 named).

**D5. Rewind by move, deterministic, marked, and absent in Strict.** Context: rewind is core to practice (teardown decision 6) but can be used to fish for information or inflate win rate. Decision: rewind steps by player-level move, offers "back to my last decision" and forward, restores the exact RNG so draws do not change, marks the game as rewound from the first use, excludes rewound games from win rate (but not from review), needs both players' agreement in hotseat, and is absent in Strict mode. Alternatives rejected: rewind per engine action (too fine; "give 3 DON!!" would take three presses); re-randomising on rewind (turns rewind into a mulligan machine); excluding rewound games from review (they are often the most instructive).

**D6. AI pacing by table, with search overlapped and a skip that stops at your decisions.** Context: the AI turn target is 8 s at 1× including animation (ARCHITECTURE §4.1), and a human must be able to follow it (principle 4). Decision: fixed per-event durations (F21 table), planning overlapped with the start-of-turn animations, a uniform considering beat for AI decisions, merged DON!!-plus-attack animations and skipped holds on chained attacks to stay under 8 s, a "thinking" state only when the board is idle for 400 ms, and "Skip to my decision" that applies queued moves and summarises them, never skipping a decision the player owes. Alternatives rejected: animating every engine action (well over 8 s); a spinner over the board while thinking (hides the board); skipping straight to the end of the AI's turn (would skip your own defensive decisions).

**D7. Hotseat privacy by curtain at turn change and hold-to-reveal inside battles.** Context: hotseat needs two private hands on one screen, and the defender decides on every attack (plan-review UX-7). Decision: a full-screen curtain at each turn change; inside a battle, the defender's hand is hidden until they hold a reveal key or long-press; a setting switches to a curtain per battle; open hands is a separate mode with no privacy at all. Alternatives rejected: a curtain per battle by default (a dozen curtains per turn); no privacy in hotseat (then it is just open hands); hiding the attacker's screen region (both players share one screen, so it doesn't work).

**D8. First launch: one question, two answers, no account.** Context: plan-review UX-12 asked for a branch between experienced and new players; teardown decision 5 wants no wall between the URL and a game. Decision: the home screen asks "Have you played before?" with "I know the rules: start a game" (Setup prefilled with the slice decks Rocks vs Kaido at Pirate, Start focused) and "I'm new: teach me" (tutorial); a quiet "Just look around" link; returning players see "Resume" first. Alternatives rejected: a skill quiz (a wall); always starting with the tutorial (insults the first user, who knows the rules); no question (new players land on a board they cannot read).

**D9. AI explanations cite only public information, and turn plans show only executed steps.** Context: the AI's reasons come from feature differences over states that include its own hidden cards (ARCHITECTURE §4.5), and "why did it do that" must not become a way to read the AI's hand. Decision: the `Explanation` builder for AI decisions redacts any evidence that names a card in the AI's hand, deck or Life, or a count derived only from them; turn-plan explanations reveal steps only after they are executed; Rookie's "why" says plainly that it moves at random except against lethal. Alternatives rejected: unfiltered explanations (cheating by proxy); no "why" until the game ends (loses the teaching moment the PROMPT asks for).
