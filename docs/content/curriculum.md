---
title: "Curriculum: from first game to competitive-ready"
asOf: 2026-10-28
confidence: medium
sources:
  - https://en.onepiece-cardgame.com/pdf/rule_comprehensive.pdf?20260828
  - docs/research/rules-digest.md
  - docs/research/strategy-concepts.md
  - https://www.shonentcg.com/blog/one-piece-tcg-counter-mechanic-explained
  - https://www.shonentcg.com/blog/one-piece-tcg-mulligan-guide
  - https://www.shonentcg.com/blog/one-piece-tcg-don-system-explained
  - https://www.shonentcg.com/blog/one-piece-tcg-common-beginner-mistakes
  - https://www.shonentcg.com/blog/one-piece-tcg-deck-building-guide
  - https://hakitcg.com/blog/how-one-piece-tcg-works-rules-guide-2026
  - https://www.bountytcg.app/en/blog/one-piece-tcg-going-first-or-second
  - https://en.onepiece-cardgame.com/experienced-tcg-players/
---

# Curriculum

**As of:** 2026-10-28. Rules: Comprehensive Rules v1.2.1 (2026-08-28), via `docs/research/rules-digest.md`.

## How this file is used

- **Lesson IDs are stable.** The format is `L<nn>-<slug>`. Never renumber or rename a lesson; retire it and add a new one. Every `Explanation.lessonId` (ARCHITECTURE §4.5) must be one of these IDs.
- **Concept slugs** come from the "Concept slugs" table in `docs/research/strategy-concepts.md`. Rules-only lessons (L01–L07) carry rule numbers instead; their concept column says `—` where no strategy concept applies.
- **Exit criteria are untimed by default** (WCAG 2.2.1 Timing Adjustable). Each lesson also lists an *optional* timed criterion. The timed criterion is off unless the player switches on "timed drills" in settings, it never gates progress, and it can be extended or turned off at any time. Progress shows "passed" on the untimed criterion and a separate "passed (timed)" badge.
- **Drill sizes** match PROMPT.md M9 (at least 20 items per drill). Where a lesson says "10 items", the drill bank holds at least 20 and the lesson samples 10.
- **Measured in the app.** Every exit criterion is something the app can count: drill accuracy, review flags (PROMPT.md "Game Review"), or game results. "Agrees with the guide" means the answer matches the archetype guide or playbook in `docs/content/archetypes/`.
- Source tags (`[SH-CTR]` etc.) resolve in `docs/content/sources.md`. *(inference)* marks our own teaching choices.

## Concept → primary lesson

The review and coach link each flag to the lesson below.

| Concept slug | Primary lesson | Also in |
|---|---|---|
| `tempo` | L17-tempo-and-rush | L12, L23 |
| `don-efficiency` | L09-don-efficiency | L03 |
| `life-as-resource` | L11-life-as-resource | L06 |
| `counter-or-take` | L10-counter-or-take | L05 |
| `counters-and-blockers` | L05-block-and-counter | L10 |
| `board-vs-face` | L14-board-vs-face | L16 |
| `rush-tempo-swings` | L17-tempo-and-rush | L07 |
| `lethal-math` | L15-lethal-math | L16 |
| `mulligan` | L12-mulligan | L22 |
| `turn-order` | L13-turn-order | L02 |
| `hand-management` | L18-hand-management | L10 |
| `leader-identity` | L19-leader-identity | L22 |
| `card-advantage` | L20-card-advantage | L18 |
| `removal-timing` | L21-removal-and-denial | L14 |
| `resource-denial` | L21-removal-and-denial | — |
| `hand-reading` | L16-reading-counters | L15 |

## Stage 1 — First game (rules)

Goal: play a complete legal game and know why each step happens. These lessons pair with the guided tutorial (PROMPT.md Learning layer §1) and reuse its scenarios.

### L01-zones-and-setup
- **Concept slugs:** — · **Rules:** CR 3-1-1, 3-1-2, 5-1-2, 5-2-1-1 to 5-2-1-8
- **Concept:** Each player has a Leader, a 50-card deck, a 10-card DON!! deck, and the hand, trash, Character area (5 max), Stage area (1 max), cost area and Life areas (CR 3-1-1, 3-7-6, 3-8-5). Setup runs: show decks, shuffle, place Leaders, decide who picks first or second, draw 5, one optional all-or-nothing redraw starting with the first player, then place Life equal to the Leader's Life value (CR 5-2-1).
- **Drill:** "Name the zone": 10 highlighted zones on a board. Then "Order the setup": drag 7 setup steps into order.
- **Exit (untimed):** 10/10 zones named and the setup steps ordered correctly, in two consecutive attempts.
- **Exit (optional, timed):** the same within 60 seconds per attempt.

### L02-turn-structure
- **Concept slugs:** `turn-order` · **Rules:** CR 6-1-1, 6-2, 6-3-1, 6-4-1, 6-5-6-1, 6-6-1
- **Concept:** Every turn is Refresh → Draw → DON!! → Main → End (CR 6-1-1). The first player skips the turn-1 draw and places 1 DON!! instead of 2 (CR 6-3-1, 6-4-1). Neither player may battle on their own first turn (CR 6-5-6-1). DON!! available per turn is 1, 3, 5, 7, 9, 10 going first and 2, 4, 6, 8, 10 going second [SH-DON].
- **Drill:** 10 prompts of the form "You are going second, it is your turn 3: how many cards did you draw this turn, how many DON!! are in your cost area, and may you attack?"
- **Exit (untimed):** 9 of 10 correct.
- **Exit (optional, timed):** 9 of 10 correct, each within 15 seconds.

### L03-don-basics
- **Concept slugs:** `don-efficiency` · **Rules:** CR 6-5-5-1 to 6-5-5-4, 6-2-3, 8-3-1-5, 8-3-1-6, 8-3-2-3
- **Concept:** DON!! does two jobs: rest it to pay a cost, or give it to your Leader or a Character for +1000 power each, during your turn only (CR 6-5-5-2) [SH-DON]. A DON!! rested to pay a cost cannot also be given that turn [SH-DON]. Given DON!! returns to the cost area in your next Refresh Phase, and if the card leaves the field its DON!! drops to the cost area rested (CR 6-2-3, 6-5-5-4). DON!! −X returns DON!! to the DON!! deck, which is different from resting (CR 8-3-1-6) [SH-DON].
- **Drill:** 10 boards: "after these gives, what is each card's power on your turn, and on your opponent's turn?" plus 5 "can you afford this line?" items.
- **Exit (untimed):** 13 of 15 correct, including every "opponent's turn" item.
- **Exit (optional, timed):** 13 of 15 correct, each within 20 seconds.

### L04-battle-basics
- **Concept slugs:** `board-vs-face` · **Rules:** CR 7-1-1-1, 7-1-1-2, 7-1-4-1, 7-1-4-1-2, 3-7-4, 10-1-1-1
- **Concept:** Attack by resting an active Leader or Character; the target is the opponent's Leader or one of their *rested* Characters (CR 7-1-1-2). A Character cannot attack the turn it is played unless it has [Rush] (CR 3-7-4, 10-1-1-1). In the Damage Step the attacker wins if its power is **greater than or equal to** the defender's: ties go to the attacker (CR 7-1-4-1) [SH-CTR][HAKI].
- **Drill:** 10 declared attacks: "is this attack legal?" then "who wins this battle, and what happens?"
- **Exit (untimed):** 9 of 10 correct, including every tie item.
- **Exit (optional, timed):** 9 of 10 correct, each within 15 seconds.

### L05-block-and-counter
- **Concept slugs:** `counters-and-blockers` · **Rules:** CR 7-1-2-1, 10-1-4-1, 7-1-3-1, 7-1-3-1-1, 7-1-3-1-2, 10-2-4-1
- **Concept:** The Block Step comes before the Counter Step [SH-CTR] (CR 7-1-2, 7-1-3). One active [Blocker] per battle may rest to become the new target (CR 7-1-2-1, 10-1-4-1). In the Counter Step, trash Characters from hand for their printed Counter value at no cost, or pay for and trash [Counter] Events, in any number and order (CR 7-1-3-1) [SH-CTR]. The defender must end strictly higher: "a Counter that only matches the attacker's power is a wasted card" [SH-CTR].
- **Drill:** "Survive this attack": 10 attacks with your hand shown; pick the cheapest set of counters that stops it, or "cannot stop it".
- **Exit (untimed):** 8 of 10 with the minimum number of cards.
- **Exit (optional, timed):** 8 of 10, each within 30 seconds.

### L06-life-and-triggers
- **Concept slugs:** `life-as-resource` · **Rules:** CR 1-2-1-1-1, 1-2-1-1-2, 7-1-4-1-1-1 to 7-1-4-1-1-3, 10-1-5, 10-1-2-1, 10-1-3-1
- **Concept:** A successful hit on a Leader with Life moves the top Life card to hand, or the defender may reveal it and activate its [Trigger] instead (CR 7-1-4-1-1-2, 10-1-5). You lose if your Leader takes damage at 0 Life, or if your deck reaches 0 cards (CR 1-2-1-1). Double Attack deals 2 but does not win against 1 Life; Banish trashes the Life card and no Trigger activates (CR 10-1-2-1, 10-1-3-1; rules-digest item 95). "Every attack that lands costs you a Life card—and arms you with one more card to strike back" [BANDAI-EXP].
- **Drill:** 10 damage scenarios (single hit, Double Attack at 1 and 2 Life, Banish, Trigger choice, deck-out) — "what happens next?"
- **Exit (untimed):** 9 of 10 correct, including the Double Attack at 1 Life item.
- **Exit (optional, timed):** 9 of 10, each within 20 seconds.

### L07-keywords
- **Concept slugs:** `rush-tempo-swings` · **Rules:** CR 10-1 (all), 10-2 (all); rules-digest items 131–133
- **Concept:** Keywords are timing labels and permanent abilities: [Rush], [Rush: Character], [Double Attack], [Banish], [Blocker], [Trigger], [Unblockable], [On Play], [When Attacking], [On Block], [On K.O.], [On Your Opponent's Attack], [Activate: Main], [Main], [Counter], [Once Per Turn], [DON!! xX], DON!! −X, [Your Turn], [Opponent's Turn], [End of Your Turn] (rules-digest O). Read the timing label on the card first [HAKI].
- **Drill:** 15 real card texts from the archetype lists: "when can this effect be used, and what does it do?"
- **Exit (untimed):** 13 of 15 correct.
- **Exit (optional, timed):** 13 of 15, each within 30 seconds.

### L08-first-full-game
- **Concept slugs:** `leader-identity` · **Rules:** all of the above
- **Concept:** Put L01–L07 together in a full game.
- **Drill:** play complete games against the Rookie AI with a starter-level list (the tutorial's lists). Coach hints allowed.
- **Exit (untimed):** finish 3 complete games and win at least 2 against Rookie.
- **Exit (optional, timed):** none. Game clocks are never part of an exit criterion *(inference: a tournament clock would fail WCAG 2.2.1 for this purpose)*.

## Stage 2 — Core strategy

Goal: stop the habits that lose most games. Shonen TCG's priority order for new players is: hold counters, count the opponent's DON!! before attacking, stop over-extending into removal, then learn the take-versus-block read [SH-MIS]. Lessons L09–L12 follow that order.

### L09-don-efficiency
- **Concept slugs:** `don-efficiency` · **Rules:** CR 6-2-3, 6-2-4, 6-5-5
- **Concept:** DON!! does not carry over, so DON!! left active at end of turn is wasted unless it is held to pay a [Counter] Event [SH-DON][BANDAI-EXP]. "Spending every DON!! on Characters keeps your attacks at base power, and they bounce off a single Counter" [SH-DON]. Plan each turn around one job, develop or push [SH-DON][SH-MIS]. Each +1000 matters only if it forces one more counter card or one more Life *(inference; strategy-concepts.md §2c)*.
- **Drill:** "DON!! allocation" (PROMPT.md Drills): 10 main phases with several playable lines; pick one; the analysis scores each.
- **Exit (untimed):** 7 of 10 picks within the analysis's top two lines, **and** no "DON!! left unused" review flag in 2 of 3 consecutive games against Pirate.
- **Exit (optional, timed):** the drill part within 45 seconds per item.

### L10-counter-or-take
- **Concept slugs:** `counter-or-take`, `counters-and-blockers`, `hand-management`
- **Concept:** "Counter when the attack's consequence is worse than the card you would spend" [SH-CTR]. Take Life when you are high and the attacker is plain; block or counter near 0 Life or against Banish and Double Attack; taking Life early to refuel is often correct [SH-MIS]. Do not "spend every card on one non-lethal attack without checking the next sequence" [SH-CTR]. Use a Blocker when moving the attack onto a disposable Character is the best exchange; counter when the original target must survive [SH-CTR].
- **Drill:** "Counter or take it" (PROMPT.md Drills): 10 incoming attacks with your hand shown; decide block, counter (with which cards) or take; the analysis explains.
- **Exit (untimed):** 8 of 10 agree with the analysis, **and** at most one "wasted counter" or "hit that should have been countered" flag per game over 3 consecutive games against Pirate.
- **Exit (optional, timed):** the drill part within 30 seconds per item.

### L11-life-as-resource
- **Concept slugs:** `life-as-resource`
- **Concept:** Life is a card draw with a countdown: each hit gives a card, and the danger rises sharply as Life approaches 0 [BANDAI-EXP][SH-MIS]. A 4-Life two-colour Leader has one less cushion than a 5-Life single-colour one; in OP14–OP17 single-colour Leaders print 5 Life and two-colour Leaders 4 [SH-DB]. Against Banish, Life gives no card (CR 10-1-3-1) [BOUNTY].
- **Drill:** 10 positions: "you are at N Life facing these attackers; which hits do you take this turn?" scored by the analysis on Life after the opponent's next turn.
- **Exit (untimed):** 8 of 10 agree with the analysis.
- **Exit (optional, timed):** 8 of 10, each within 45 seconds.

### L12-mulligan
- **Concept slugs:** `mulligan`, `turn-order`, `leader-identity` · **Rules:** CR 5-2-1-6, 5-2-1-7
- **Concept:** One all-or-nothing redraw of five cards, before Life is set [SH-MUL] (CR 5-2-1-6). Ask three questions in order: can I act on turns 1–2; do I hold a piece of my plan; can I defend? Two yeses is a keep [SH-MUL]. Going first, redraw hands that need a second turn; going second, you can keep a hand one card short [SH-MUL]. A specific 4-of appears in the opening five 35.3% of the time and 58.1% with one mulligan [SH-MUL].
- **Drill:** "Mulligan trainer" (PROMPT.md Drills): 10 opening hands for one archetype, with seat shown; keep or redraw.
- **Exit (untimed):** 8 of 10 agree with that archetype guide's mulligan section, for each of 2 archetypes.
- **Exit (optional, timed):** 8 of 10, each within 10 seconds ("decide in ten seconds" [SH-MUL]).

### L13-turn-order
- **Concept slugs:** `turn-order`, `tempo`
- **Concept:** The second player stays one card and one DON!! ahead on equivalent turns; the first player gets the first attack [BOUNTY][SH-DON]. "The general default in One Piece is to go second"; go first with decks that curve out and attack early, or to race a faster deck, and against Banish decks [BOUNTY]. Beginners should go second [BOUNTY][SH-DON].
- **Drill:** 12 prompts, one per archetype, each against a named opponent: "first or second?" with the guide's reason.
- **Exit (untimed):** 9 of 12 agree with the archetype guides.
- **Exit (optional, timed):** 9 of 12, each within 15 seconds.

### L14-board-vs-face
- **Concept slugs:** `board-vs-face`, `removal-timing`
- **Concept:** Each attack goes at the Leader or a rested Character (CR 7-1-1-2). Hitting the Leader gives the opponent a card and a possible Trigger (CR 10-1-5) [BANDAI-EXP], so at high Life a K.O. on a rested Character often does more *(inference; strategy-concepts.md §6)*. "Plan each turn around one clear goal, board or pressure" [SH-MIS]. Before attacking, look at active Blockers and the opponent's hand size, and sometimes attack to bait a Blocker first [SH-MIS].
- **Drill:** 10 boards: choose the target for each attacker; the analysis scores the line.
- **Exit (untimed):** 7 of 10 within the analysis's top two lines, **and** at most one "poor attack ordering" flag per game over 3 games against Pirate.
- **Exit (optional, timed):** the drill part within 45 seconds per item.

## Stage 3 — Seeing the whole turn

### L15-lethal-math
- **Concept slugs:** `lethal-math`, `hand-reading`
- **Concept:** You need opponent Life + 1 successful Leader hits; Double Attack counts 2 toward Life but cannot win against 1 Life (CR 7-1-4-1-1-1, 10-1-2-1; rules-digest item 95). To stop an attack the defender needs (attacker − defender) + 1000 of counter, because ties go to the attacker (CR 7-1-4-1) [SH-CTR][HAKI]. At low Life, slow down and count their attackers, possible DON!! boosts, your Blockers and your counter value [SH-MIS]. Each hand card is at most one counter; a Life card taken is one more card they can counter with, so later swings must be bigger [SH-DON].
- **Drill:** "Lethal puzzles" (PROMPT.md Drills): 10 board states; find the lethal sequence or declare "no lethal".
- **Exit (untimed):** 8 of 10 correct (sequence that wins against every legal defence, or a correct "no lethal").
- **Exit (optional, timed):** 8 of 10, each within 60 seconds (PROMPT.md's example criterion).

### L16-reading-counters
- **Concept slugs:** `hand-reading`, `lethal-math`, `board-vs-face`
- **Concept:** The trash is public and the number of cards in hand is public (CR 3-1-4, 3-5-2), so you can bound the counters left in their hand. Count the opponent's active DON!! and hand before every important attack: their resources tell you how much they can boost on defence [SH-MIS][SH-DON]. "There is no universal 'smallest attacker first' rule": work out what each attack asks the defender to spend [HAKI].
- **Drill:** 10 positions with the opponent's trash, hand size and active DON!! shown: "what is the most counter power they can have?" then "which attack goes first?"
- **Exit (untimed):** 8 of 10 bounds correct to within 1000, and attack orders within the analysis's top two.
- **Exit (optional, timed):** 8 of 10, each within 60 seconds.

### L17-tempo-and-rush
- **Concept slugs:** `tempo`, `rush-tempo-swings`
- **Concept:** Tempo is acting first so the opponent spends their turn answering you *(inference; no freely readable source defines it for this game — strategy-concepts.md §1)*. [Rush] lets a Character attack the turn it is played and [Rush: Character] only at Characters (CR 10-1-1-1, 10-1-6-1). In a pure race, whoever attacks first usually wins by exactly one turn [BOUNTY].
- **Drill:** 10 positions: "how much damage can the opponent do next turn, counting Rush cards they could play with their next DON!!?"
- **Exit (untimed):** 8 of 10 within 1000 power and one attacker of the analysis's figure.
- **Exit (optional, timed):** 8 of 10, each within 45 seconds.

### L18-hand-management
- **Concept slugs:** `hand-management`, `card-advantage`
- **Concept:** Emptying your hand of counters is "the number one mistake": keep 1–3 counter cards in hand in the midgame [SH-MIS]. About two-thirds of a typical tournament list can counter (median 33 counter cards per 50) [SH-DB], so most hand cards are also shields *(inference)*. Keep a threat or two in reserve against removal colours, and do not give the opponent a two-for-one [SH-MIS].
- **Drill:** none separate; measured in play.
- **Exit (untimed):** over 3 consecutive games against Pirate, end at least 80% of your turns from your turn 3 onward with 1 or more counter cards in hand, and lose no game to an attack that the counters you played the turn before would have stopped (review flag).
- **Exit (optional, timed):** none.

### L19-leader-identity
- **Concept slugs:** `leader-identity`
- **Concept:** "Your Leader determines the colors you can play and sets the direction of your entire deck", and it never has to be drawn [BANDAI-EXP]. Read its text and mulligan toward it [SH-MUL]; if you cannot name the two things your deck must do by turn three, you cannot mulligan for them [SH-MUL].
- **Drill:** 12 leader cards from the Meta Explorer: "what does this deck want to do every turn, and what are the two things it must do by turn three?"
- **Exit (untimed):** 10 of 12 answers match the archetype guide's "What the deck is trying to do" (scored by keyword match plus self-check against the guide text).
- **Exit (optional, timed):** none.

## Stage 4 — Competitive-ready

### L20-card-advantage
- **Concept slugs:** `card-advantage`, `hand-management`
- **Concept:** Card advantage is having more useful cards than the opponent; one card that answers two pulls you ahead even when the board looks even *(inference; strategy-concepts.md §13)*. Going second is worth one card [BOUNTY]. Over-extending into removal hands the opponent a two-for-one [SH-MIS].
- **Drill:** 10 positions: compare two lines by cards spent and cards removed or drawn on each side.
- **Exit (untimed):** 8 of 10 agree with the analysis.
- **Exit (optional, timed):** 8 of 10, each within 60 seconds.

### L21-removal-and-denial
- **Concept slugs:** `removal-timing`, `resource-denial`
- **Concept:** Rested Characters can simply be attacked (CR 7-1-1-2), so effect removal is best spent on what attacks cannot reach: active Characters, Blockers, and Characters with ongoing effects *(inference; strategy-concepts.md §14)*. Resting an active Blocker before you attack removes a block (CR 10-1-4-1). Banish denies the Life card and its Trigger (CR 10-1-3-1).
- **Drill:** 10 positions with a removal card in hand: "what do you remove, and before or after which attacks?"
- **Exit (untimed):** 7 of 10 within the analysis's top two lines.
- **Exit (optional, timed):** 7 of 10, each within 60 seconds.

### L22-pilot-an-archetype
- **Concept slugs:** `leader-identity`, `mulligan`, `tempo`
- **Concept:** Play a meta deck the way its guide says. The archetype guide's "Game plan by turn" and "Playbook seeds" are the checklist.
- **Drill:** 5 games with one archetype against Pirate, with the coach's "game-plan check" on.
- **Exit (untimed):** in 3 of 5 games, meet at least 3 of that archetype's playbook seeds (as measured by the same assertions the AI playbook tests), and pass L12's mulligan drill for that archetype.
- **Exit (optional, timed):** none.

### L23-matchup-plans
- **Concept slugs:** `tempo`, `board-vs-face`, `removal-timing`
- **Concept:** Each guide gives a one-line plan against every other archetype. Most plans are *(inference)*; the sourced ones carry match records from Shonen TCG's Limitless Play samples.
- **Drill:** "Matchup quiz": 12 prompts "you are X against Y: what is the plan?" chosen from the guide's lines and three distractors; then one game per two matchups against Warlord.
- **Exit (untimed):** 10 of 12 quiz answers correct, and win at least 3 of 6 matchup games against Warlord.
- **Exit (optional, timed):** quiz within 20 seconds per prompt.

### L24-competitive-ready
- **Concept slugs:** all
- **Concept:** Capstone. Play to the standard of the review rather than the result of one game.
- **Drill:** a 10-game set with one archetype against Warlord, mixed opponents from the Meta Explorer.
- **Exit (untimed):** win 6 of 10 against Warlord, **and** average at most 1.0 severe review flags per game (missed lethal, lethal given away, hit that should have been countered).
- **Exit (optional, timed):** none.

## Open questions for this file

1. **Thresholds are inference.** Every "8 of 10" and every review-flag count above is our teaching choice, not a sourced standard. Tune against real players' drill data in M9.
2. **Agreement with "the analysis"** depends on the review engine's scoring (M8). Until it exists, drills that score against "the analysis" use hand-authored answers with the reasoning written out.
3. **onepiece.gg material excluded.** `strategy-concepts.md` cites onepiece.gg pages S1–S6, but onepiece.gg's robots.txt disallows Anthropic agents, so under the 2026-10-28 robots decision this curriculum does not use them. Several heuristics there (the "sit at 2 Life" rule, 8000/5000 counter examples, "weaker attack first") are therefore not taught as sourced claims.
