# Design principles

**As of:** 2026-10-28 (Phase 4, revision 2: review-1 fixes)
**Inputs:** `PROMPT.md` (Phase 4, Accessibility, Performance), `docs/research/competitive-teardown.md`, `docs/plan-review-1.md` (UX-5, UX-7, UX-9, UX-10), `docs/ARCHITECTURE.md` §2.3, §2.7, §5.
**Used by:** every screen review. The Phase 4 heuristic review (`review-1.md`) and the per-milestone screenshot reviews (PLAN §2) score each screen against this file. The app README will quote the seven principle titles and their one-line meanings.

Principles 1 to 7 are from `PROMPT.md`. Principles 8 to 10 are **additions** that the research justifies; each says which finding it rests on.

## How to use this file in a review

For each screen, the reviewer runs the **check** under every principle and records pass, fail or not applicable, with a screenshot reference. A failed check is a finding. Severity follows Nielsen's 0–4 scale. A failure of principle 1, 2, 3 or 7 on the game board is at least severity 3, because it blocks a core job ("Play"). A check that needs a human, not a screenshot, says so.

Several claims about competitors below rest on material nobody here observed first-hand. They are marked **unobserved**. SeaKing and DuelVoyager block Anthropic agents (teardown §1, §2), so everything said about them is a vendor claim or an absence of evidence.

---

## 1. The board reads at a glance

**What it means here.** Within about two seconds of looking, without reading any sentence, a player can answer six questions:
1. Whose turn is it?
2. Which phase is it?
3. How much DON!! does each side have, active and rested?
4. What is every Leader's and Character's current power?
5. How many Life cards does each side have?
6. How many cards are in each hand?

The answers are numbers and positions that always sit in the same place. Live values (power with DON!! given, modified cost, Life, hand size, deck size) are drawn by us on solid plates over the card. They are never left to the printed numbers on the scan, which go stale the moment a modifier applies.

- **Do:** show the live power on an opaque plate in the card's top-right corner, where the printed power sits, so the player never sees two disagreeing numbers. Put both players' Life, DON!! and deck counts in the same columns, so a vertical glance compares them.
- **Don't:** put any of the six answers only in a tooltip, a hover, the log or a panel the player has to open. Don't let a count change without that number visibly updating in place.
- **Check:** a reviewer looks at a mid-game screenshot for five seconds, then answers the six questions from memory. Any wrong or missing answer is a finding. Second check: every number on the board is in tabular figures and at least 12 px.

## 2. Legal moves are visible; illegal ones are not offered

**What it means here.** The engine's `legalActions` is the only source of truth (ARCH §2.1, §5). The board decorates exactly the cards and zones that have a legal action for the current decision, and nothing else. A card with no legal action is not hidden. It is undecorated, and asking it why (hover, focus or click) shows the engine's `whyNot` reason in plain words with the rule reference.

- **Do:** draw the legal-move ring with a glyph in the card's corner that says what kind of action is available (play, attack, give DON!!, target). Explain undecorated cards on demand: "Can't attack: played this turn and has no [Rush] (CR 3-7-4)".
- **Don't:** offer a button or drop target that the engine will reject and then show an error. Don't grey out the whole board outside targeting modes either: the art stays bright.
- **Check:** in every decision state in `flows.md`, compare the decorated set on screen with the engine's `legalActions` for that state (automated in M3). Every undecorated interactive element must return a `whyNot` reason. A drag must never be droppable on an illegal target.

## 3. Irreversible steps are confirmable, and most steps are rewindable

**What it means here.** Attacks, Counter commitments and effect choices get one clear confirm, and that confirm states the consequence ("Confirm attack: 7000 vs 5000"). Everything else (playing a card, giving DON!!, ending the turn) commits immediately and can be rewound by player-level move in practice modes (ARCH §2.3 `intentId`, §5). Rewind restores the exact prior state, RNG included, so it cannot be used to fish for a better draw, and the UI says so.

- **Do:** put the consequence in the confirm button's label: "Counter +2000 and survive", "Take the hit (Life 4 → 3)". Keep Rewind in the same place in every state, beside the primary button.
- **Don't:** use a modal "Are you sure?" for routine moves. Don't make the player confirm what Rewind can undo, because confirmation fatigue trains people to click through the confirms that matter.
- **Check:** list every action in a full turn and in a full defence. Each one is either confirmed with its consequence in the label, or appears as one Rewind step. None is both, and none is neither.

## 4. No hidden state and no surprise

**What it means here.** Everything the rules make public is on screen or one action away: pending effects and Triggers, the opponent's DON!!, hand size, deck size, Life count, trash contents, and which of the opponent's hand cards are known (ARCH §2.7 `known`). Opponent actions play at a pace a person can follow, with a speed control, a "thinking" state, and an always-visible event log written in the same words as the battle panel.

- **Do:** show "2 effects waiting" as a chip in the midline band whenever the resolution queue is not empty. Show an AI move as highlight, then move, then dwell, and log it at the same time.
- **Don't:** resolve two opponent moves in one animation frame. Don't skip an animation without logging it. Don't reveal anything the projection hides: no face-down Life peeking, no hint of deck order.
- **Check:** pause at any moment of an AI turn. A reviewer can say what the AI just did and what is about to resolve, using only the screen. Second check: diff the screen against `project(state, human)`. Nothing on screen may come from outside the view.

## 5. Teach by doing, explain on demand

**What it means here.** Every zone, keyword, prompt and number has a one-step explanation: hover or focus on desktop, long-press on touch, or the `?` key. The coach panel never opens, speaks or warns unless the player has turned that behaviour on (ARCH §5, worker priorities). Empty zones carry their own name ("Stage", "Character area") so the board labels itself for a first-time player.

- **Do:** in the battle panel, say "Ties go to the attacker" next to the numbers the first few times a tie decides a battle. Give each `whyNot` reason a "Learn more" link to the rules reference entry.
- **Don't:** open a tutorial overlay, a coach pop-up or a blunder warning the player did not ask for. Don't put explanations in a modal that blocks the board.
- **Check:** pick ten random visible elements. Each has an explanation reachable in one step by mouse, keyboard and touch. Then play a full game with the coach set to "off" and count unprompted interruptions. The target is zero.

## 6. Real card art is the hero

**What it means here.** The layout exists to show cards. Chrome is quiet, dark and low in chroma: slate neutrals, no textures, no brand flourishes. The only saturated colours on screen are the cards themselves and a small set of state signals. All available art carries a SAMPLE watermark (`data-sources.md`). So "hero" means the largest clean view of the art we can give, not the full scan at any cost (`card-face-study.md`).

- **Do:** keep panels at most two lightness steps from the mat. Use saturated colour only for state (legal, attack, DON!!) and always together with an icon or text.
- **Don't:** use gradients, gloss, metallic frames, pirate motifs or anything that imitates the official One Piece Card Game brand. Don't cover more than about half of a board card's art with plates and chips.
- **Check:** desaturate a board screenshot. Chrome and cards should still separate cleanly. Then count the saturated non-card pixels: they should come only from state signals that are currently active.

## 7. Landscape first, keyboard complete

**What it means here.** The board is designed at 1280×720 and 1920×1080, then adapted to tablet landscape. Phones get an honest "The board needs a bigger screen" (they are below the board's minimum in either orientation), and a portrait tablet gets a stacked board, not a rotate gate (`board.md` §6.4; review-1 C14). Every action in a full game can be done from the keyboard alone, with a visible focus that is never covered (WCAG 2.4.7, 2.4.11). `accessibility.md` owns the key map. This file only requires that one exists and is complete.

- **Do:** follow the board's reading order with Tab: opponent, midline, your field, your hand, then the decision panel, coach, log and rail header (`accessibility.md` §3.1: the decision panel comes straight after the hand on purpose). One tab stop per zone, plus a "Skip to decision" link first. Arrow keys move within a zone. Every drag has a click equivalent, and every click has a key equivalent.
- **Don't:** make any action drag-only or hover-only. Don't let the preview dock, a popover or a raised hand card cover the focused element.
- **Check:** the Playwright keyboard-only game (PLAN, M3) passes. Screenshots of the focus ring at both resolutions show it unobscured on every focusable element type. Below the minimum supported size, the board does not render (see `board.md`).

---

## Additions

### 8. One place for each thing (addition)

**Why it is added.** The teardown found that manual tables make the learner do the bookkeeping (§4 Untap, §5 TTS). It also found that OPTCGSim spreads state across opt-in settings, sub-steps and a separate combat log (§3, secondhand). A rules-enforcing sim can give every kind of information one fixed home, and that is what makes principle 1 achievable.

**What it means here.** Each kind of thing has exactly one home, and that home never moves during a game:
- turn and phase: the midline band, centred;
- the current decision, its choices, and End turn / Confirm: the decision panel, bottom right;
- history: the log, in the rail;
- advice: the coach, in the rail;
- card detail: the preview dock.

The board never reflows during a game. The only exceptions are a window resize and the user changing density.

- **Do:** put the battle panel inside the decision panel, so "what am I deciding" and "what are the numbers" are read in the same place.
- **Don't:** show a prompt as a toast in one state, a banner in another and a modal in a third.
- **Check:** for each decision kind in ARCH §2.3, screenshot the prompt. All of them sit in the decision panel, and the primary button sits at the same coordinates.

### 9. Honest about certainty (addition)

**Why it is added.** SeaKing's own caveat (**unobserved**, vendor claim via search index, teardown §2) is that a reasonable decision can be graded low for losing to cards the player could not see. ARCH §4.4 and §4.5 already define `proven / refuted / unknown` and `any-hand / needed-hidden-info / search-incomplete`. The UI has to carry those labels through. Otherwise the engine's honesty is lost at the last step.

**What it means here.** Anything computed about hidden information is labelled with its certainty, in words, every time. That covers the lethal detector, hints, review flags and the battle panel's "they can survive with…".

- **Do:** write "They have 4 cards in hand; at most +8000 from Counters (estimate from their archetype)".
- **Don't:** state an opponent's possible defence as a fact. Don't show a green "no missed win" for a turn the search did not finish.
- **Check:** every numeric claim about an unknown zone on screen carries a certainty word (proven, estimate, unknown) or links to one.

### 10. Pace is the player's (addition)

**Why it is added.** Plan review UX-5 found that a 1.5 s per-decision AI makes 30–60 s turns. ARCH §4.1 now sets an 8 s turn target at 1× speed and leaves the perceived time to Phase 4. The teardown found no product whose pacing we could observe (SeaKing pacing **unobserved**). The Bandai app's reviewers praise "no turn timer" (§6, secondhand).

**What it means here.** The human is never rushed and never kept waiting without knowing why:
- There are no turn timers in v1.
- AI turns follow the budget in `board.md` "Pacing".
- "Thinking" appears only when the wait is real.
- "Skip to my decision" and a step mode exist.
- Reduced motion keeps the dwell time, so it never just speeds up the opponent.

- **Do:** keep animating while the worker searches, so think time hides behind motion.
- **Don't:** let a spinner sit over an idle board. Don't let the 4× speed setting skip the dwell on attacks aimed at the player.
- **Check:** time ten seeded Warlord turns at 1×. The median is at most 8 s and the 90th percentile at most 11 s, excluding the human's own decisions. With reduced motion on, turn time changes by less than ±20%.
