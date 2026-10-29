# Example explanations

**As of:** 2026-10-28 (Phase 4, revision 2: review-1 fixes)
**Purpose:** about 20 finished `Explanation` objects (ARCHITECTURE §4.5), each for a concrete, rules-correct position. Plan-review UX-3 requires them: the owner reviews the copy, and each becomes a snapshot test in M5a/M7/M8 that passes only if the evidence numbers match the position.
**Card text:** every card used here appears in a list in `docs/research/meta-lists.json`. Text was read from `.cache/track-b/raw/optcgapi-allSetCards.json` and, where a sign or wording mattered, checked on Limitless card pages on 2026-10-28 (OP13-004, OP13-027, OP14-031, OP17-040, OP17-046, OP17-056, OP17-074, OP17-080, OP17-119). Leader rulings come from `docs/research/rulings.md` (RL-13, RL-20, RL-45, RL-46).
**Rules arithmetic used throughout:**
- The attacker wins if its power is **greater than or equal to** the defender's (CR 7-1-4-1). So to stop an attack the defender needs **attacker − defender + 1000** more power (counters come in 1000s).
- Hits needed to win = **Life + 1**: a hit at 0 Life wins (CR 7-1-4-1-1-1).
- Each Leader hit moves a Life card **to the defender's hand** (CR 7-1-4-1-1-2), so the defender has one more card for the next attack.
- Given DON!! add +1000 each **on their owner's turn only** (CR 6-5-5-2).
- Double Attack cannot win from 1 Life (CR 7-1-4-1-1-1, RL-20).

## Shapes

ARCHITECTURE §4.5 fixes `Explanation`; it does not yet define `Evidence` or `Move`. This document proposes both, because the snapshot tests need them.

```ts
type ConceptId =
  | 'tempo' | 'don-efficiency' | 'life-as-resource' | 'counter-or-take'
  | 'counters-and-blockers' | 'board-vs-face' | 'rush-tempo-swings' | 'lethal-math'
  | 'mulligan' | 'turn-order' | 'hand-management' | 'leader-identity'
  | 'card-advantage' | 'removal-timing' | 'resource-denial' | 'hand-reading';

type Certainty = 'any-hand' | 'needed-hidden-info' | 'search-incomplete';

interface Evidence {
  text: string;                       // finished copy, one line
  figures?: Record<string, number>;   // every number in `text`, named; the test recomputes these from the scenario
}

interface Move {                      // a player-level move (one intentId), for display
  kind: 'play' | 'giveDon' | 'activate' | 'attack' | 'block' | 'counter' | 'take'
      | 'choose' | 'trigger' | 'keep' | 'redraw' | 'endTurn';
  text: string;                       // finished copy for the numbered step
  card?: string;                      // card ID of the actor, for "Show"
  target?: string;                    // card ID or 'leader'
  count?: number;                     // DON!! count, picks
}

interface Explanation {
  conceptId: ConceptId;
  claim: string;
  evidence: Evidence[];
  line: Move[] | null;
  outcome: string;
  certainty: Certainty;
  nextTime: string;
  lessonId: string;                   // from docs/content/curriculum.md
  sources: string[];                  // CR numbers, RL ids, tags from docs/content/sources.md
}
```

### What `certainty` means by context

| Context | `any-hand` | `needed-hidden-info` | `search-incomplete` |
| --- | --- | --- | --- |
| Review flag (lethal) | Proven in `public` mode: wins against any hand the opponent could hold | Proven only in `actual` mode, against the hand they held | Search hit its cap |
| Review flag (other kinds), hint, drill answer | The reasons rest only on information the player had | The judgment leans on the opponent's hidden cards | Search hit its cap before ranking the lines |
| AI "why" | The value for a single decision, because AI explanations cite only public information (flows D9) | An attack, whose result depends on the player's hidden hand; turn plans whose payoff does | Not used for AI "why" (M5a review M5a-01): whether the budget ran out depends on how many moves the AI's hidden hand allows |

### Certainty labels by context

The chip's words depend on where the explanation appears, not only on its `certainty` value (review-1 UX-R25). A label must never contradict the text beside it.

| Where it appears | `any-hand` | `needed-hidden-info` | `search-incomplete` |
| --- | --- | --- | --- |
| Review flag, review marker | "Holds whatever they held" | "Hindsight: needed their hidden cards" | "Not fully checked" |
| Live coach: hint, lethal detector, DON!! math | "Works against any hand" | "Depends on their hand" | "Best found, not fully checked" |
| AI "Why" (E12–E14, E16) | "Public information only" | "Public information only · depends on your hand" | "Best found in its time" |
| Guide-sourced answer: mulligan trainer, mulligan hint (E10, E11) | "From the Rocks guide (sourced)" (the archetype's name) | not used | not used |
| Drill answer from a search (lethal puzzle, counter or take, DON!! allocation) | "Works against any hand" | "Their real hand: one way to see it" | "Best found, not fully checked" |

- **Estimates are labelled as estimates.** An outcome that depends on a choice the opponent has not made yet states the condition ("unless they spend 6000 of counters") or carries an "Estimate" chip. "Likely" is never used beside "Works against any hand".
- **Snapshot rule.** The snapshot tests render each example in every context it is listed for (the Index's "Where it appears" column) and assert that the chip text equals this table's cell. A new context needs a new row before it ships.

### Turn vocabulary

One rule everywhere (review-1 UX-R26; `board.md` OQ-5):
- **Turns are game turns**, counted from 1 as the CR counts them: "Turn 9", "on turn 5".
- Where the player's own count matters, add it in brackets: "by turn 5 (your 3rd)". Never write "your turn 3" alone.
- Positions in this file still say which seat the player is in ("going second, game turn 8") so the DON!! count can be checked.
- **Puzzles keep the source game's turn number** ("From your game, turn 12"), and the puzzle header uses the same number ("Puzzle · turn 12").

### Copy rules

- Claim: one sentence, at most 12 words, no exclamation marks, no "you should have".
- Evidence: one line each, at most about 30 words; arithmetic written out as "9000 − 5000 + 1000 = 5000"; the real minus sign (U+2212).
- Powers printed as on cards (9000, not 9,000). "DON!!" always with both exclamation marks.
- "You" is the player; "they" is the opponent. In AI explanations the AI is named by its Leader ("Kaido", "Xebec").
- Card names as printed. Where two cards share a name, add the power or role on first use ("Kaido (12000)", "your Leader").
- `nextTime`: an imperative rule of thumb the player can reuse in a different game.

### How the snapshot tests use these

For each example, M5a/M7/M8 build the position as a `ScenarioSpec`, run the producer (review, hint, AI or lethal search), and assert:
1. `claim`, `outcome`, `nextTime`, `conceptId`, `lessonId`, `certainty` equal the strings here;
2. every `figures` value equals the value computed from the scenario with `derive`, `preview` and the search;
3. every evidence `text` matches the snapshot after the figures are substituted;
4. the `line`, replayed with `reduce`, reaches the stated `outcome` against the defence the search used.

Producer-specific values that the scenario can't fix (search line counts, timings) are injected by a test double and say so in the example's notes.

## Index

| # | Kind | Where it appears | Decks (you vs them) | Concept |
| --- | --- | --- | --- | --- |
| E01 | Missed lethal (`any-hand`) | Review flag | Kaido vs Rocks | `lethal-math` |
| E02 | Lethal that needed hidden information | Review flag (Hindsight) | Rocks vs Kaido | `hand-reading` |
| E03 | Search incomplete | Review marker | Rocks vs Luffy OP13-001 | `lethal-math` |
| E04 | Wasted counter | Review flag | Kaido vs Rocks | `counter-or-take` |
| E05 | Hit that should have been countered | Review flag | Rocks vs Kaido | `counter-or-take` |
| E06 | DON!! left unused | Review flag, tempo meter | Rocks vs Kaido | `don-efficiency` |
| E07 | Holding DON!! was correct (OP13-001) | Tempo meter, review "not flagged" note | Luffy OP13-001 vs Rocks | `don-efficiency` |
| E08 | Board over face | Review flag | Kaido vs Rocks | `board-vs-face` |
| E09 | Face over board | Review flag | Rocks vs Kaido | `board-vs-face` |
| E10 | Mulligan: keep | Mulligan hint, trainer | Luffy OP13-001 | `mulligan` |
| E11 | Mulligan: redraw | Mulligan hint, trainer | Rocks | `mulligan` |
| E12 | AI why: block | Why | Rocks vs Kaido (AI) | `counters-and-blockers` |
| E13 | AI why: counter | Why | Luffy OP13-001 vs Rocks (AI) | `counter-or-take` |
| E14 | AI why: turn plan | Why | Luffy OP13-001 vs Rocks (AI) | `removal-timing` |
| E15 | Hint line | Hint | Luffy OP13-001 vs Kaido | `don-efficiency` |
| E16 | AI why: leader ability | Why | Luffy OP13-001 vs Kaido (AI) | `leader-identity` |
| E17 | Blunder warning | Blunder warning | Luffy OP13-001 vs Kaido | `don-efficiency` |
| E18 | Double Attack at 1 Life | Guided count | Luffy OP13-001 vs Rocks | `lethal-math` |
| E19 | Counter that only tied | Review flag, defence-planner warning | Rocks vs Kaido | `counters-and-blockers` |
| E20 | Live lethal, three tiers | Lethal detector tier 3 | Kaido vs Rocks | `lethal-math` |

Rocks (OP17-039) and Kaido (OP17-058) dominate because they are the slice decks (PLAN row 11); OP13-001 appears where the brief requires it.

---

## E01. Missed lethal (works against any hand)

**Where:** Game Review flag, severe.

**Position.** Game turn 9, your Main Phase. You: Kaido (OP17-058) Leader, 5000 power, 3 Life. Your Kaido (OP17-062), 12000, active, played on an earlier turn. 4 active DON!! in your cost area, none given yet. Them: Rocks.D.Xebec (OP17-039) Leader, 5000, **1 Life, 2 cards in hand**, no Characters. Rocks's three sourced lists run no [Trigger] cards, and their biggest counters are the 0-cost Events Rocks Pirates and There's No Authority… (+2000 each); OP17-118 Xebec's +2000 in hand is conditional and no larger.

**What you did.** Gave 2 DON!! to Kaido (14000) and 2 to your Leader (7000). Attacked with Kaido first: the hit took their last Life card into their hand (3 cards). Your Leader then attacked at 7000; they played two +2000 Events (9000) and survived at 0 Life.

```ts
{
  conceptId: 'lethal-math',
  claim: 'You had lethal this turn.',
  evidence: [
    { text: 'They had 1 Life, so you needed 2 hits: one for the last Life card, one to win.',
      figures: { opponentLife: 1, hitsNeeded: 2 } },
    { text: 'Their 2 cards could add at most +4000: their deck\'s biggest counters are +2000 Events.',
      figures: { handSize: 2, maxPerCard: 2000, maxDefence: 4000 } },
    { text: 'With all 4 DON!! on your Leader it attacks at 9000. Stopping it takes 9000 − 5000 + 1000 = 5000. They have 4000.',
      figures: { leaderPower: 9000, stopLeader: 5000, maxDefence: 4000 } },
    { text: 'That hit puts their last Life card in their hand: 3 cards, at most +6000.',
      figures: { handAfterHit: 3, maxDefenceAfterHit: 6000 } },
    { text: 'Kaido then attacks at 12000. Stopping it takes 12000 − 5000 + 1000 = 8000. They have 6000.',
      figures: { kaidoPower: 12000, stopKaido: 8000, maxDefenceAfterHit: 6000 } },
    { text: 'Their deck runs no Trigger cards, so the Life card can\'t stop you either.',
      figures: { triggersInPrior: 0 } },
  ],
  line: [
    { kind: 'giveDon', text: 'Give all 4 DON!! to your Leader (9000).', card: 'OP17-058', count: 4 },
    { kind: 'attack', text: 'Attack their Leader with your Leader.', card: 'OP17-058', target: 'leader' },
    { kind: 'attack', text: 'Attack their Leader with Kaido (12000).', card: 'OP17-062', target: 'leader' },
  ],
  outcome: 'Wins the game this turn.',
  certainty: 'any-hand',
  nextTime: 'Count Life + 1 hits, then their best possible defence. Put your DON!! where it beats that defence, and send your hardest-to-stop attack last: every hit hands them another card.',
  lessonId: 'L15-lethal-math',
  sources: ['CR 7-1-4-1', 'CR 7-1-4-1-1-1', 'CR 7-1-4-1-1-2', 'CR 6-5-5-2', 'SH-CTR', 'SH-DON'],
}
```

**Check.** Leader 5000 + 4 × 1000 = 9000. Their best with 2 cards: 5000 + 4000 = 9000, a tie, which the attacker wins: hit. Life 1 → 0, hand 3. Kaido 12000 against 5000 + 6000 = 11000: hit at 0 Life, win. In the played order, Kaido's hit came first, so the Leader faced 3 cards: 7000 needs 3000, and 2 cards gave 4000. Even with all 4 DON!! on the Leader, Kaido first would fail (9000 needs 5000; 3 cards give 6000). Order matters as much as the split.

---

## E02. Lethal that needed hidden information

**Where:** Game Review, Hindsight flag (never severe).

**Position.** Your Main Phase. You: Rocks.D.Xebec (OP17-039) Leader with 3 DON!! (8000); Shiki (OP17-048) 9000, Edward.Newgate (OP17-040) 8000 and Charlotte Linlin (OP17-049) 7000, all active and able to attack. Them: Kaido (OP17-058) Leader 5000, **1 Life, 3 cards in hand**, no active Blockers, rested King (EB04-031) and Queen (EB04-032), DON!! on their field. Their Leader's "[On Your Opponent's Attack] [Once Per Turn] DON!! −1: give up to 1 of your opponent's Characters −2000" is unused this turn. Kaido's lists run Kundali Dragon Swarm and Flame Dragon Torch ([Counter] DON!! −1: Leader +4000).
**Hidden (known to the review only):** their hand was Kaido (OP17-062), Lead Performers (OP17-061) and Gum-Gum Lightning (OP09-077), none with a Counter value or [Counter] effect. Their top Life card was Yamato (OP17-074), +1000 Counter.

**What you did.** Your Leader hit their Leader (no counter): Life 1 → 0, Yamato to their hand. Then Shiki attacked King, Newgate attacked Queen, and Linlin stayed back.

```ts
{
  conceptId: 'hand-reading',
  claim: 'Against the hand they actually held, you had lethal.',
  evidence: [
    { text: 'They were at 1 Life with 3 cards in hand, so you needed 2 hits.',
      figures: { opponentLife: 1, handSize: 3, hitsNeeded: 2 } },
    { text: 'From what you could see, each card could have been a +4000 Event. Three of those, with their Leader\'s −2000 on Shiki, stop any three of your four attacks.',
      figures: { maxPerCard: 4000, attackers: 4, stoppable: 3 } },
    { text: 'Their actual hand: Kaido, Lead Performers and Gum-Gum Lightning. None of them can counter.',
      figures: { actualCounterInHand: 0 } },
    { text: 'Your Leader\'s hit gave them Yamato (+1000). Shiki at 9000 then needed 5000 to stop, or 3000 after Kaido\'s −2000. They had 1000.',
      figures: { stopShiki: 5000, stopShikiAfterMinus: 3000, actualMaxDefence: 1000 } },
  ],
  line: [
    { kind: 'attack', text: 'After your Leader\'s hit, attack their Leader with Shiki.', card: 'OP17-048', target: 'leader' },
  ],
  outcome: 'Would have won this turn, against the hand they held.',
  certainty: 'needed-hidden-info',
  nextTime: 'When lethal depends on their hand, weigh it: if they do have the counters, what do you lose by attacking their Leader anyway? Often only the Characters you didn\'t K.O.',
  lessonId: 'L16-reading-counters',
  sources: ['CR 7-1-4-1', 'CR 7-1-4-1-1-1', 'RL-45', 'SH-MIS', 'SH-DON'],
}
```

**Check.** Public mode, before any attack: Leader 8000 needs 4000 (1 card), Newgate 8000 needs 4000 (1), Linlin 7000 needs 3000 (1), Shiki 9000 needs 5000 (2 cards) or 3000 after −2000 (1). Three cards of +4000 stop any three, and the fourth hit only takes Life to 0: refuted. If your Newgate's +3000 makes your Leader 11000 (needs 7000, 2 cards), they stop the other three and take that hit: still refuted. Actual mode: after the first hit they hold 1000 of counter; Shiki (7000 after −2000) still beats 5000 + 1000. Proven.

---

## E03. Search incomplete

**Where:** Game Review, "Not fully checked" marker on the turn (not a flag).

**Position.** Game turn 12, your Main Phase, 10 DON!!. You: Rocks.D.Xebec Leader; Shiki 9000, Newgate 8000, Linlin 7000 and Captain John (OP17-044) 6000, all active. Them: Monkey.D.Luffy (OP13-001) Leader, **2 Life, 5 cards**, 1 DON!! given to their Leader and **4 active DON!!** left in their cost area from their turn; Nami (OP14-031), active, [Blocker]. Their Leader: "[DON!! x1] [On Your Opponent's Attack] If you have 5 or less active DON!! cards, you may rest any number of your DON!! cards. For every DON!! card rested this way, this Leader or up to 1 of your Straw Hat Crew type Characters gains +2000 power during this battle."

**Test note:** the search result (`unknown`, 26,000 lines, 4 s) is injected by a test double; the other figures come from the scenario.

```ts
{
  conceptId: 'lethal-math',
  claim: 'This turn wasn\'t fully checked for lethal.',
  evidence: [
    { text: 'They were at 2 Life, so you needed 3 hits. You had 5 attackers.',
      figures: { opponentLife: 2, hitsNeeded: 3, attackers: 5 } },
    { text: 'Their Leader could rest 4 active DON!! for +2000 each, spread across your attacks. The same DON!! pay for their [Counter] Events.',
      figures: { activeDon: 4, perDon: 2000 } },
    { text: 'Nami could block one attack, and they held 5 cards.',
      figures: { blockers: 1, handSize: 5 } },
    { text: 'The analysis checked 26,000 lines in its 4-second limit for this turn. It found no forced win and no defence that always holds.',
      figures: { linesChecked: 26000, limitSeconds: 4 } },
  ],
  line: null,
  outcome: 'Unknown: no win proven, none ruled out.',
  certainty: 'search-incomplete',
  nextTime: 'When their defence has many parts, count it in order: Blockers, then effects that trigger on your attack, then cards in hand. If the count is close, attack in the order that makes them spend first.',
  lessonId: 'L16-reading-counters',
  sources: ['CR 7-1-2-1', 'CR 7-1-3-1', 'RL-46'],
}
```

**Check.** 2 Life + 1 = 3 hits. Five attackers listed. Luffy's condition: 4 active ≤ 5, and 1 DON!! given: the effect is live on your turn.

---

## E04. Wasted counter

**Where:** Game Review flag, moderate.

**Position.** Their turn. You: Kaido (OP17-058) Leader 5000, **5 Life, 6 cards in hand**. Them: Rocks.D.Xebec Leader with 1 DON!! (6000) attacks your Leader. All their other Characters are rested; it is their last possible attack this turn.

**What you did.** Played Basil Hawkins (OP17-073, +2000 Counter): your Leader 7000, attack stopped. Hand 6 → 5.

```ts
{
  conceptId: 'counter-or-take',
  claim: 'This counter didn\'t need playing.',
  evidence: [
    { text: 'You were at 5 Life. Taking the hit leaves 4: you would still need to take 5 more hits to lose.',
      figures: { life: 5, lifeAfterHit: 4 } },
    { text: 'It was their last attack this turn: nothing else of theirs was active.',
      figures: { remainingAttackers: 0 } },
    { text: 'Countering cost you a card. Taking the hit would have given you one: 7 cards instead of 5.',
      figures: { handIfCounter: 5, handIfTake: 7 } },
  ],
  line: [
    { kind: 'take', text: 'Take the hit.' },
  ],
  outcome: '+2 cards in hand for 1 Life.',
  certainty: 'any-hand',
  nextTime: 'At high Life, let a lone hit through. Keep counters for hits that would cost you the game or a Character you need.',
  lessonId: 'L10-counter-or-take',
  sources: ['CR 7-1-4-1-1-2', 'SH-CTR', 'SH-MIS', 'BANDAI-EXP'],
}
```

**Check.** 6000 vs 5000: hit unless they add 2000 (6000 − 5000 + 1000). Hawkins +2000 → 7000. Take: hand 6 + 1 = 7, Life 4. Counter: hand 5, Life 5. At 4 Life, losing needs 4 more Life cards plus a hit at 0: 5 hits.

---

## E05. A hit that should have been countered

**Where:** Game Review flag, severe (it lost the game).

**Position.** Their turn. You: Rocks.D.Xebec Leader 5000, **1 Life**, no Characters. Hand: Rocks Pirates (OP17-056, [Counter] +2000, cost 0), There's No Authority… (OP17-055, [Counter] +2000, cost 0), Buckin (OP08-051, +1000). Them: Kaido (OP17-058); **0 cards in hand, 0 active DON!!**; three active attackers: Ulti & Page One (OP17-060) 6000, their Leader with 2 DON!! (7000), Kaido (OP17-062) 12000. Kaido's leader effect only targets Characters, and you have none.

**What you did.** Took Ulti's hit (Life 0; the Life card was Kyo, no Counter). Stopped their Leader with Rocks Pirates and Buckin (8000). Played There's No Authority on Kaido's attack (7000 against 12000) and lost.

```ts
{
  conceptId: 'counter-or-take',
  claim: 'Taking that hit lost the game.',
  evidence: [
    { text: 'At 1 Life you could take one more hit this turn, not two: a hit at 0 Life loses.',
      figures: { life: 1, hitsYouCanTake: 1 } },
    { text: 'Their three attacks needed 2000, 3000 and 8000 of counter to stop.',
      figures: { stopUlti: 2000, stopLeader: 3000, stopKaido: 8000 } },
    { text: 'Your hand held 5000: enough for the two smaller attacks, never for Kaido.',
      figures: { handCounter: 5000 } },
    { text: 'Taking Ulti\'s hit meant Kaido had to be stopped too: 3000 + 8000 = 11000. Your deck\'s biggest counter is +2000, so no Life card could have covered it.',
      figures: { neededAfterTaking: 11000, bestPossible: 7000 } },
    { text: 'They had no cards in hand and no active DON!!, so these numbers couldn\'t change.',
      figures: { opponentHand: 0, opponentActiveDon: 0 } },
  ],
  line: [
    { kind: 'counter', text: 'Stop Ulti & Page One with There\'s No Authority (7000 against 6000).', card: 'OP17-055' },
    { kind: 'counter', text: 'Stop their Leader with Rocks Pirates and Buckin (8000 against 7000).', card: 'OP17-056' },
    { kind: 'take', text: 'Take Kaido\'s hit: 1 Life → 0.' },
  ],
  outcome: 'Survives the turn at 0 Life.',
  certainty: 'any-hand',
  nextTime: 'At 1 Life, find the attack you can\'t stop and save your last Life for it. Counter everything else.',
  lessonId: 'L10-counter-or-take',
  sources: ['CR 1-2-1-1-1', 'CR 7-1-4-1', 'CR 7-1-4-1-1-1', 'SH-CTR', 'SH-MIS'],
}
```

**Check.** 6000 − 5000 + 1000 = 2000; 7000 − 5000 + 1000 = 3000; 12000 − 5000 + 1000 = 8000. Hand 2000 + 2000 + 1000 = 5000 ≥ 2000 + 3000, < 8000. After taking Ulti: 11000 needed from 5000 plus one Life card of at most +2000 (Rocks's lists have no larger counter and no Triggers) = 7000. The line holds in any attack order: whichever comes, counter the 2000 and 3000 ones, take Kaido's.

---

## E06. DON!! left unused

**Where:** Game Review flag (moderate, 3 DON!!); also the tempo meter's end-of-turn text.

**Position.** Game turn 8 (your 4th), going second: 8 DON!!. You played Charlotte Linlin (OP17-049, cost 5): 3 active DON!! left. Your Leader (5000, no DON!! given) attacked their Leader: Kaido (OP17-058), 5000, 3 Life. They played Queen (EB04-032, +1000): 6000, attack stopped. You ended the turn with **3 active DON!!**. Your hand: Rocks Pirates and There's No Authority… (both cost 0), Kyo, Shiki. Nothing on your board or in your hand spends DON!! on their turn.

```ts
{
  conceptId: 'don-efficiency',
  claim: 'You left 3 DON!! unused.',
  evidence: [
    { text: 'You ended your turn with 3 active DON!!. Your Counter Events cost 0, and nothing else of yours uses DON!! on their turn, so those 3 did nothing.',
      figures: { activeDonAtEnd: 3, usableOnTheirTurn: 0 } },
    { text: 'Your Leader attacked at 5000 into their 5000 Leader. A 1000 counter stopped it.',
      figures: { attackPower: 5000, defencePower: 5000, stopNeeded: 1000 } },
    { text: 'With those 3 DON!! your Leader attacks at 8000, and stopping it takes 8000 − 5000 + 1000 = 4000: two ordinary counters, or one of their +4000 Events, which also costs them a DON!!.',
      figures: { attackWithDon: 8000, stopNeededWithDon: 4000 } },
  ],
  line: [
    { kind: 'giveDon', text: 'Give 3 DON!! to your Leader (8000) before it attacks.', card: 'OP17-039', count: 3 },
    { kind: 'attack', text: 'Attack their Leader with your Leader.', card: 'OP17-039', target: 'leader' },
  ],
  outcome: 'Costs them at least 1 more card, or 1 more Life.',
  certainty: 'any-hand',
  nextTime: 'Before you end your turn, spend every DON!! that nothing will use on their turn. Give it to an attacker before the attack, not after.',
  lessonId: 'L09-don-efficiency',
  sources: ['CR 6-5-5-2', 'CR 7-1-4-1', 'SH-DON', 'SH-MIS'],
}
```

**Check.** Going second, game turn 8 (your 4th): 2 + 2 + 2 + 2 = 8 DON!!. Linlin 5 → 3 left. 5000 vs 5000 is a tie, a hit unless they add 1000. With 3 DON!!: 8000 − 5000 + 1000 = 4000. Kaido's +4000 Events (Kundali Dragon Swarm, Flame Dragon Torch) are "[Counter] DON!! −1", hence "also costs them a DON!!". Kaido's leader −2000 cannot target your Leader (RL-45).

---

## E07. Holding DON!! was correct (OP13-001 Luffy)

**Where:** the tempo meter's explanation at the end of your turn; the review's "not flagged" note for this turn (learning-ui §4.2).

**Position.** Game turn 8 (your 4th), going second: 8 DON!!. You: Monkey.D.Luffy (OP13-001) Leader. You played Usopp (OP14-022, cost 4): 4 active, 4 rested. You gave 1 DON!! to your Leader (3 active) and attacked with it. End of turn: Usopp ("[End of Your Turn] If your Leader has the FILM or Straw Hat Crew type, set up to 2 of your DON!! cards as active") sets 2 active. You end with **5 active, 2 rested, 1 given to your Leader**. Them: Rocks.D.Xebec.

```ts
{
  conceptId: 'don-efficiency',
  claim: 'Keeping 5 DON!! active was right.',
  evidence: [
    { text: 'Your Leader keeps its 1 given DON!! through their turn, so its [DON!! x1] defence is on.',
      figures: { givenToLeader: 1 } },
    { text: 'You end with 5 active DON!!, the most it can use. With 6 or more active, the effect can\'t be used at all.',
      figures: { activeDon: 5, limit: 5 } },
    { text: 'On their turn each DON!! you rest gives +2000 in a battle: up to +10000 across their attacks. Given on your turn, the same 5 were worth +1000 each: +5000.',
      figures: { theirTurnValue: 10000, yourTurnValue: 5000 } },
    { text: 'DON!! you rest stay rested until your next turn, so choose which of their attacks gets them.',
      figures: {} },
  ],
  line: null,
  outcome: 'Up to +10000 of defence on their turn, instead of +5000 on your attacks.',
  certainty: 'any-hand',
  nextTime: 'With this Leader, end your turn with 1 DON!! on the Leader and up to 5 active. Count those DON!! as defence, like counters in hand.',
  lessonId: 'L09-don-efficiency',
  sources: ['RL-46', 'RL-13', 'CR 6-5-5-2', 'CR 8-3-2-3', 'SH-RGL'],
}
```

**Check.** 8 − 4 (Usopp) − 1 (given) = 3 active; + 2 from Usopp = 5 active, 2 rested. 5 × 2000 = 10000; 5 × 1000 = 5000. [DON!! x1] is a state check that holds on the opponent's turn while the DON!! stays given (RL-13). The review's "DON!! left unused" rule excludes DON!! the player's own opponent-turn effects can spend (curriculum L09 exit).

---

## E08. Board over face

**Where:** Game Review flag "Poor attack ordering", moderate.

**Position.** Your Main Phase. You: Kaido (OP17-058) Leader with 3 DON!! (8000); King (EB04-031), 7000, active. Some of your DON!! are rested in the cost area. Them: Rocks.D.Xebec Leader 5000, **4 Life, 3 cards**; their only Character is Edward.Newgate (OP17-040), 8000, **rested** (it attacked last turn): "[Once Per Turn] When your Leader with a type including 'Rocks Pirates' attacks or is attacked, you may trash 1 card from your hand: your Leader gains +3000 power during this battle." No Blockers.

**What you did.** Your Leader and King both attacked their Leader; they took both hits (Life 4 → 2, hand 3 → 5).

```ts
{
  conceptId: 'board-vs-face',
  claim: 'Newgate was the better target for your Leader.',
  evidence: [
    { text: 'Newgate gives their Leader +3000 in one battle every turn, attacking or defending, for one card from hand.',
      figures: { newgateBoost: 3000 } },
    { text: 'Your Leader\'s −2000 (return 1 rested DON!!) makes Newgate 6000. To save it from your 8000 Leader they need 8000 − 6000 + 1000 = 3000: two cards, since their biggest counter is +2000.',
      figures: { attackPower: 8000, newgateAfterMinus: 6000, stopNeeded: 3000, maxPerCard: 2000, cardsToSave: 2 } },
    { text: 'At 4 Life, each hit on their Leader gave them a card. Your two hits gave them 2.',
      figures: { opponentLife: 4, cardsGiven: 2 } },
  ],
  line: [
    { kind: 'attack', text: 'Attack Newgate with your Leader, and return 1 rested DON!! to give it −2000.', card: 'OP17-058', target: 'OP17-040' },
    { kind: 'attack', text: 'Attack their Leader with King.', card: 'EB04-031', target: 'leader' },
  ],
  outcome: 'Newgate K.O.\'d, or 2 of their cards spent to save it; King still takes 1 Life.',
  certainty: 'any-hand',
  nextTime: 'At high Life, hit the Character that pays them every turn. Turn to their Leader once the hits start setting up lethal.',
  lessonId: 'L14-board-vs-face',
  sources: ['CR 7-1-1-2', 'CR 8-3-1-6', 'RL-45', 'SH-MIS', 'BANDAI-EXP'],
}
```

**Check.** Kaido's leader: "[When Attacking]/[On Your Opponent's Attack] [Once Per Turn] DON!! −1: Give up to 1 of your opponent's Characters −2000 power during this turn"; DON!! −1 may return a rested cost-area DON!!, so your Leader keeps its 3 given DON!! (CR 8-3-1-6). Newgate's own effect boosts only their Leader, so it does not trigger when Newgate is attacked. Rocks Pirates and There's No Authority… can target a Rocks Pirates Character; Buckin is +1000. Any two cards make 3000 or more only if at least one is a +2000 card; the copy says "two cards", which is the minimum.

---

## E09. Face over board

**Where:** Game Review flag "Poor attack ordering", moderate.

**Position.** Your Main Phase. You: Rocks.D.Xebec; Shiki (OP17-048), 9000, active. Them: Kaido (OP17-058) Leader 5000, **2 Life, 2 cards**; Basil Hawkins (OP17-073), 1000, rested ("[On Play] You may trash 1 card from your hand: … add up to 1 DON!! card as active"; no other text). Their Leader's −2000 was already used this turn on your Linlin.

**What you did.** Shiki attacked Hawkins; Hawkins was K.O.'d.

```ts
{
  conceptId: 'board-vs-face',
  claim: 'Shiki should have attacked their Leader.',
  evidence: [
    { text: 'Hawkins\'s only text is its [On Play], already used. On the board it\'s a 1000-power Character.',
      figures: { hawkinsPower: 1000 } },
    { text: 'At their Leader, Shiki needs them to find 9000 − 5000 + 1000 = 5000.',
      figures: { stopNeeded: 5000 } },
    { text: 'They had 2 cards. Only a +4000 Event plus another counter reaches 5000; anything less and they drop to 1 Life.',
      figures: { handSize: 2, biggestCounter: 4000 } },
    { text: 'Their Leader\'s −2000 was already used this turn, so Shiki stays at 9000.',
      figures: { shikiPower: 9000 } },
  ],
  line: [
    { kind: 'attack', text: 'Attack their Leader with Shiki.', card: 'OP17-048', target: 'leader' },
  ],
  outcome: 'Both their cards spent, or 1 Life lost, instead of a 1000-power Character.',
  certainty: 'any-hand',
  nextTime: 'Before attacking a Character, ask what it will do next turn. If the answer is "not much", hit the Leader.',
  lessonId: 'L14-board-vs-face',
  sources: ['CR 7-1-4-1', 'RL-45', 'SH-MIS'],
}
```

**Check.** Kaido's counters by card: +4000 (Kundali Dragon Swarm, Flame Dragon Torch; Leader only), +3000 (Wo Ro Ro Ro Ro…, which also trashes a card), +2000 (Nola, Basil Hawkins, X.Drake, Black Maria, Slow-Slow Beam Sword), +1000 (Queen EB04-032, Yamato, Ulti & Page One, Mamaragan). Two cards reach 5000 only as 4000 + 1000 or more. Wo Ro Ro (+3000) needs the other card as its cost.

---

## E10. Mulligan: keep

**Where:** Mulligan hint (flows F3c); mulligan trainer answer (F19a).

**Position.** You: Monkey.D.Luffy (OP13-001), going first, list 1 from `meta-lists.json` (Aegean Pirate Cup #6, 4th). Opening hand: Nami (OP01-016, cost 1, +1000), Sanji (ST21-003, cost 2, +2000), Usopp (OP14-022, cost 4, +1000), Laboon (OP15-035, cost 1, +2000), Roronoa Zoro (EB04-007, cost 7).

```ts
{
  conceptId: 'mulligan',
  claim: 'Keep this hand.',
  evidence: [
    { text: 'You can act early: Nami costs 1 and searches 5 cards for a Straw Hat Crew Character. Going first you have 1 DON!! on turn 1.',
      figures: { namiCost: 1, donTurn1: 1 } },
    { text: 'It holds your plan: Usopp sets 2 DON!! active at the end of your turn, which keeps your Leader\'s defence loaded.',
      figures: { usoppRestand: 2 } },
    { text: 'It can defend: Laboon and Sanji (+2000 each), Usopp and Nami (+1000 each) make 6000 of counter.',
      figures: { counterTotal: 6000 } },
  ],
  line: [
    { kind: 'keep', text: 'Keep.' },
  ],
  outcome: 'A turn-1 search, a restand piece and 6000 of counter.',
  certainty: 'any-hand',
  nextTime: 'Ask three questions: can I act on my first two turns, do I hold a piece of my plan, can I defend? Two yeses is a keep.',
  lessonId: 'L12-mulligan',
  sources: ['CR 5-2-1-6', 'SH-MUL', 'SH-RGL'],
}
```

**Check.** Counter values from card data: OP15-035 2000, ST21-003 2000, OP14-022 1000, OP01-016 1000; EB04-007 0. Sum 6000. The guide's keepable hand: one turn-1 searcher, one restand piece, a couple of counters (OP13-001 guide, Mulligan).

---

## E11. Mulligan: redraw

**Where:** Mulligan hint; mulligan trainer answer.

**Position.** You: Rocks.D.Xebec (OP17-039), going first, list 1 (ChinoizeCup #122, 6th), which runs 18 Characters costing 1 to 3 (Buckin 3, Streusen 3, Kyo 4, Don Marlon 4, Miss Buckingham Stussy 4). Opening hand: Rocks.D.Xebec (OP17-118, cost 10), Shiki (OP17-048, cost 7), Edward.Newgate (OP17-040, cost 6), Charlotte Linlin (OP17-049, cost 5), Rocks Pirates (OP17-056, [Counter] +2000).

```ts
{
  conceptId: 'mulligan',
  claim: 'Redraw this hand.',
  evidence: [
    { text: 'Your cheapest Character costs 5. Going first you have 1, 3, then 5 DON!!: nothing to play until turn 5 (your 3rd).',
      figures: { cheapestCharacter: 5, firstPlayableGameTurn: 5 } },
    { text: 'Your deck has 18 Characters that cost 1 to 3. A fresh five has at least one of them 90% of the time.',
      figures: { earlyPlays: 18, deckSize: 50, chanceAtLeastOne: 0.90 } },
    { text: 'It defends with one card: Rocks Pirates, +2000.',
      figures: { counterCards: 1, counterTotal: 2000 } },
    { text: 'Don\'t keep a hand for Xebec: your Leader digs two cards per hit, and the deck usually finds it by 10 DON!!.',
      figures: {} },
  ],
  line: [
    { kind: 'redraw', text: 'Redraw all five.' },
  ],
  outcome: 'A 90% chance of a play by turn 3 (your 2nd), instead of none until turn 5.',
  certainty: 'any-hand',
  nextTime: 'Going first with Rocks, redraw any hand with no Character costing 1 to 3.',
  lessonId: 'L12-mulligan',
  sources: ['CR 5-2-1-6', 'CR 6-4-1', 'SH-XEB', 'SH-MUL'],
}
```

**Check.** DON!! going first: 1, 3, 5 (CR 6-4-1). P(at least one of 18 in 5 from 50) = 1 − C(32,5)/C(50,5) = 1 − 201,376 / 2,118,760 = 0.905. OP17-118's in-hand +2000 Counter applies only "if you only have Characters without a Counter", so it is not counted as a sure counter. "Usually finds it by 10 DON!!": SH-XEB's simulation, 76% going first and 77% going second (Rocks guide). The guide's sourced baseline mulligans any hand without a 1- to 3-cost Character.
**Copy note for review:** the outcome follows the turn vocabulary rule: "by turn 3 (your 2nd)" stays true for Stussy and Don Marlon (cost 3, playable on game turn 3 going first with 3 DON!!). Owner may prefer "an early play".

---

## E12. AI why: a block

**Where:** "Why?" on the AI's block (flows F10). AI: Kaido (OP17-058), Pirate tier.

**Position.** Your Main Phase. You: Rocks.D.Xebec; Shiki (OP17-048), 9000, attacks the AI's Leader. AI: Kaido Leader 5000, **2 Life, 3 cards in hand**; Yamato (OP17-074, 1000, [Blocker], "[On Play] Add up to 1 DON!! card as rested from your DON!! deck"), active. The AI's Leader −2000 was used earlier this turn.

**AI decision:** block with Yamato. Yamato is K.O.'d (9000 ≥ 1000).

```ts
{
  conceptId: 'counters-and-blockers',
  claim: 'It blocked with Yamato: the cheapest way to keep its Life.',
  evidence: [
    { text: 'Kaido was at 2 Life with 3 cards in hand.',
      figures: { aiLife: 2, aiHandSize: 3 } },
    { text: 'Stopping Shiki at its Leader takes 9000 − 5000 + 1000 = 5000: at least 2 cards, since its deck\'s biggest counter is +4000.',
      figures: { stopNeeded: 5000, biggestCounter: 4000, cardsNeeded: 2 } },
    { text: 'Yamato\'s [On Play] was already used. Blocking cost one 1000-power Character instead of cards.',
      figures: { yamatoPower: 1000 } },
    { text: 'Its Leader\'s −2000 was already used this turn.',
      figures: {} },
  ],
  line: [
    { kind: 'block', text: 'Block with Yamato.', card: 'OP17-074' },
  ],
  outcome: 'Kept 2 Life and all 3 cards, for one 1000-power Character.',
  certainty: 'any-hand',
  nextTime: 'Expect a Blocker whose job is done to be thrown in front of your biggest attack. Attack with something smaller first to draw it out.',
  lessonId: 'L05-block-and-counter',
  sources: ['CR 7-1-2-1', 'CR 10-1-4-1', 'SH-CTR', 'SH-MIS'],
}
```

**Check.** Every number is public: Life, hand size, Yamato's printed text, the archetype's counter cards (the player can read Kaido's guide), and the once-per-turn leader effect being spent (logged). Nothing names a card in the AI's hand (flows D9).

---

## E13. AI why: a counter

**Where:** "Why?" on the AI's counter. AI: Rocks.D.Xebec (OP17-039), Warlord.

**Position.** Your Main Phase. You: Monkey.D.Luffy (OP13-001) Leader with 1 DON!! (6000) attacks the AI's Leader. Still active and able to attack: Sanji (OP13-027) 7000 and Usopp (OP14-022) 5000, no DON!! given. AI: Rocks Leader 5000, **1 Life**.

**AI decision:** plays Rocks Pirates (OP17-056, cost 0, [Counter] +2000), revealed by playing it: its Leader 7000, attack stopped.

```ts
{
  conceptId: 'counter-or-take',
  claim: 'It countered: at 1 Life it can take only one more hit.',
  evidence: [
    { text: 'Xebec was at 1 Life: one hit leaves 0, and the next hit wins for you.',
      figures: { aiLife: 1 } },
    { text: 'You still had Sanji (7000) and Usopp (5000) ready. Stopping them takes 3000 and 1000.',
      figures: { sanjiPower: 7000, usoppPower: 5000, stopSanji: 3000, stopUsopp: 1000 } },
    { text: 'Rocks Pirates costs 0 and made its Leader 7000 against your 6000.',
      figures: { leaderAfter: 7000, attackPower: 6000 } },
    { text: 'Taking this hit would mean stopping both of your next attacks. Countering now leaves it a Life card to spend on one of them.',
      figures: {} },
  ],
  line: [
    { kind: 'counter', text: 'Play Rocks Pirates: +2000 to its Leader.', card: 'OP17-056' },
  ],
  outcome: 'Stays at 1 Life, with one hit to spare against your last two attacks.',
  certainty: 'any-hand',
  nextTime: 'When they are at 1 Life, they must stop all but one of your attacks. Send the one that is hardest to stop last.',
  lessonId: 'L10-counter-or-take',
  sources: ['CR 7-1-4-1', 'CR 7-1-4-1-1-1', 'SH-CTR'],
}
```

**Copy note (M5a review M5a-14):** the claim was "It countered because at 1 Life it can take only one more hit." (13 words); it now keeps to the 12-word rule.

**Check.** 6000 − 5000 + 1000 = 2000 needed; Rocks Pirates gives exactly 2000 (7000 > 6000). Sanji 7000 − 5000 + 1000 = 3000. Usopp 5000 vs 5000 ties, so 1000. Rocks Pirates is public once played.

---

## E14. AI why: a turn plan

**Where:** "Why?" on the AI's turn, available once its turn ends (executed steps only, flows D9). AI: Rocks.D.Xebec, Warlord, going second.

**Position.** Game turn 10 (the AI's 5th): 10 DON!!. AI: Shiki (OP17-048) 9000 and Edward.Newgate (OP17-040) 8000, both active. You: Monkey.D.Luffy (OP13-001) Leader 5000, **1 Life, 4 cards**, 1 DON!! given to your Leader, **3 active DON!!** in your cost area; Nami (OP14-031), 2000, active, [Blocker], cost 4.

**AI's executed turn:** played Gloriosa (OP17-046, cost 4): Nami to the bottom of your deck. Gave 3 DON!! to Shiki (12000) and 3 to its Leader (8000). Attacked your Leader with Shiki, then with its Leader, then with Newgate.

```ts
{
  conceptId: 'removal-timing',
  claim: 'Its plan: remove your Blocker, then make your Leader\'s DON!! go first.',
  evidence: [
    { text: 'You were at 1 Life, so you had to stop 2 of its 3 attacks.',
      figures: { yourLife: 1, attacks: 3, mustStop: 2 } },
    { text: 'Nami was your only Blocker. Gloriosa put her on the bottom of your deck before any attack.',
      figures: { blockersAfter: 0 } },
    { text: 'Your Leader could rest your 3 active DON!! for up to +6000 in total, and DON!! rested that way stay rested for the rest of its turn.',
      figures: { yourActiveDon: 3, maxLeaderBoost: 6000 } },
    { text: 'Shiki attacked first at 12000. Stopping it took 8000: all 3 DON!! plus a 2000 counter, or 8000 of counters alone.',
      figures: { shikiPower: 12000, stopShiki: 8000 } },
    { text: 'Its Leader then attacked at 8000 (11000 with Newgate\'s +3000), and Newgate at 8000: 4000 (or 7000) and 4000 to stop.',
      figures: { leaderPower: 8000, leaderWithNewgate: 11000, stopLeader: 4000, stopLeaderWithNewgate: 7000, stopNewgate: 4000 } },
  ],
  line: [
    { kind: 'play', text: 'Play Gloriosa: Nami to the bottom of your deck.', card: 'OP17-046', target: 'OP14-031' },
    { kind: 'giveDon', text: 'Give 3 DON!! to Shiki (12000) and 3 to its Leader (8000).', count: 6 },
    { kind: 'attack', text: 'Attack your Leader with Shiki.', card: 'OP17-048', target: 'leader' },
    { kind: 'attack', text: 'Attack your Leader with its Leader.', card: 'OP17-039', target: 'leader' },
    { kind: 'attack', text: 'Attack your Leader with Newgate.', card: 'OP17-040', target: 'leader' },
  ],
  outcome: 'You had to stop 8000, then 4000 to 7000, then 4000, with 3 DON!! and 4 cards.',
  certainty: 'needed-hidden-info',
  nextTime: 'When your defence is your Leader\'s DON!!, expect the biggest attacker first. Decide before the first attack which hit you will take.',
  lessonId: 'L21-removal-and-denial',
  sources: ['CR 10-1-4-1', 'RL-46', 'SH-XEB', 'SH-MIS'],
}
```

**Check.** 10 DON!! − 4 (Gloriosa) = 6 = 3 + 3. Gloriosa: "Place up to 1 Character with a cost of 5 or less at the bottom of the owner's deck"; Nami costs 4. Shiki 9000 + 3000 = 12000; 12000 − 5000 + 1000 = 8000; 3 × 2000 = 6000. Leader 5000 + 3000 = 8000 → 4000; + Newgate 3000 = 11000 → 7000. Newgate 8000 → 4000. `needed-hidden-info` because whether the plan wins depends on your 4 hidden cards (shown as "Depends on your hand").

---

## E15. Hint: a whole line

**Where:** Coach hint (flows F9).

**Position.** Game turn 6 (your 3rd), going second: **6 DON!!, all active**. You: Monkey.D.Luffy (OP13-001) Leader 5000, 4 Life; Jewelry Bonney (EB04-002), 2000, active (played on turn 2, your 1st). Hand: Nami (OP14-031), Sanji (OP13-027), Laboon, Bad Manners Kick Course, Usopp (OP14-022). Them: Kaido (OP17-058), 5 Life, 5 cards; Yamato (OP17-074, 1000, [Blocker], cost 3) and Queen (EB04-032, 1000, cost 1), both **active**.

```ts
{
  conceptId: 'don-efficiency',
  claim: 'Play Nami, attack both their Characters, and end with 5 DON!! active.',
  evidence: [
    { text: 'Nami rests both their Characters, so your attackers can hit them, and Yamato can\'t block this turn.',
      figures: { charactersRested: 2 } },
    { text: 'To save Yamato from your 6000 Leader they need 6000 − 1000 + 1000 = 6000. To save Queen from Bonney, 2000.',
      figures: { leaderPower: 6000, stopOnYamato: 6000, bonneyPower: 2000, stopOnQueen: 2000 } },
    { text: 'Kaido\'s −2000 can shrink Bonney to 0, for 1 DON!!, but it can\'t touch your Leader.',
      figures: { bonneyAfterMinus: 0 } },
    { text: 'At the end of your turn Nami sets up to 5 DON!! active. With 1 on your Leader, that is up to +10000 of defence on their turn.',
      figures: { activeAtEnd: 5, defence: 10000 } },
    { text: 'Sanji instead ends your turn with 3 active DON!!: +6000.',
      figures: { sanjiActiveAtEnd: 3, sanjiDefence: 6000 } },
  ],
  line: [
    { kind: 'play', text: 'Play Nami: rest Yamato and Queen.', card: 'OP14-031', count: 2 },
    { kind: 'giveDon', text: 'Give 1 DON!! to your Leader (6000).', card: 'OP13-001', count: 1 },
    { kind: 'attack', text: 'Attack Yamato with your Leader.', card: 'OP13-001', target: 'OP17-074' },
    { kind: 'attack', text: 'Attack Queen with Bonney.', card: 'EB04-002', target: 'EB04-032' },
    { kind: 'endTurn', text: 'End your turn: Nami sets your 5 DON!! active.' },
  ],
  outcome: 'K.O.s their Blocker unless they spend 6000 of counters, and keeps +10000 of defence for their turn.',
  certainty: 'any-hand',
  nextTime: 'With this Leader, plan each turn backwards from the DON!! you want active at the end.',
  lessonId: 'L09-don-efficiency',
  sources: ['CR 7-1-1-2', 'CR 10-1-4-1', 'RL-45', 'RL-46', 'SH-RGL'],
}
```

**Check.** Going second, game turn 6 (your 3rd): 6 DON!!. Nami costs 4: 2 active, 4 rested. Give 1: 1 active, 4 rested, 1 given. Nami's text: "Rest up to 2 of your opponent's Characters with a cost of 8 or less. Then, set up to 5 of your DON!! cards as active at the end of this turn." Cost area holds 5 at the end, all set active. Yamato and Queen cost 3 and 1. 6000 vs 1000: save needs 6000; 2000 vs 1000: save needs 2000. Kaido's −2000 targets "your opponent's Characters" (RL-45). Sanji line: 6 − 5 = 1, + 2 (On Play) = 3, − 1 given = 2, + 1 (End of Your Turn) = 3 active; 3 × 2000 = 6000. The outcome states its condition ("unless they spend 6000 of counters") instead of "Likely", so it agrees with the "Works against any hand" chip (UX-R25).

---

## E16. AI why: a leader ability

**Where:** "Why?" on the AI's use of its Leader during your attack. AI: Kaido (OP17-058), Warlord.

**Position.** Your Main Phase. You: Monkey.D.Luffy (OP13-001); Usopp (OP14-022), 5000 + 1 DON!! = 6000, attacks the AI's Leader (5000). AI: 10 DON!! on its field, its DON!! deck empty.

**AI decision:** "[On Your Opponent's Attack] [Once Per Turn] DON!! −1: Give up to 1 of your opponent's Characters −2000 power during this turn." Usopp becomes 4000; the attack fails without a counter.

```ts
{
  conceptId: 'leader-identity',
  claim: 'It shrank your attacker instead of spending a counter.',
  evidence: [
    { text: 'Your Usopp attacked at 6000 into its 5000 Leader.',
      figures: { attackPower: 6000, defencePower: 5000 } },
    { text: 'Kaido returned 1 DON!! to give Usopp −2000. At 4000 the attack failed, and no card left its hand.',
      figures: { attackAfter: 4000, cardsSpent: 0 } },
    { text: 'That DON!! went back to its DON!! deck and returns in its next DON!! Phase. A counter card would have been gone for good.',
      figures: { donReturned: 1 } },
    { text: 'The effect works once per turn, so your next attacker won\'t face it.',
      figures: {} },
  ],
  line: [
    { kind: 'activate', text: 'Return 1 DON!!: Usopp −2000 this turn.', card: 'OP17-058', target: 'OP14-022' },
  ],
  outcome: 'Stopped the attack for 1 DON!! instead of a card.',
  certainty: 'any-hand',
  nextTime: 'Against Kaido, attack first with the Character you least need to land: it draws out the once-per-turn −2000. It can never shrink your Leader.',
  lessonId: 'L27-opponent-turn-timing',
  sources: ['RL-45', 'RL-24', 'CR 8-3-1-6', 'CR 10-2-16-1'],
}
```

**Check.** 6000 − 2000 = 4000 < 5000: attack fails (CR 7-1-4-2). With 10 on the field and an empty DON!! deck, the returned DON!! is placed again in the next DON!! Phase (1 card in the deck → 1 placed, CR 6-4-2; RL-24).

---

## E17. Blunder warning

**Where:** Blunder warning at the commit of an effect choice (learning-ui §2.8). The setting is on.

**Position.** Game turn 8 (your 4th), going second: 8 DON!!. You: Monkey.D.Luffy (OP13-001). You played Nami (OP14-031) for 4, gave 1 DON!! to your Leader and attacked. End of turn: Nami's "set up to 5 of your DON!! cards as active" resolves. Your cost area: **3 active, 4 rested**; 1 given to your Leader. In the decision panel you set the stepper to **4** and press commit.

```ts
{
  conceptId: 'don-efficiency',
  claim: 'Setting 4 DON!! active switches your Leader\'s defence off.',
  evidence: [
    { text: 'Your Leader\'s defence needs 5 or fewer active DON!! when they attack. It is checked before any Counter, so you can\'t spend down to 5 on their turn.',
      figures: { limit: 5 } },
    { text: 'You have 3 active and 4 rested. Setting 4 makes 7 active: no defence. Setting 2 makes 5: up to +10000.',
      figures: { activeNow: 3, restedNow: 4, activeIfFour: 7, activeIfTwo: 5, defenceIfTwo: 10000 } },
  ],
  line: [
    { kind: 'choose', text: 'Set 2 DON!! active (5 active in total).', count: 2 },
  ],
  outcome: 'Up to +10000 of defence on their turn, instead of none from your Leader.',
  certainty: 'any-hand',
  nextTime: 'With this Leader, more active DON!! is not better past 5. Stop at 5.',
  lessonId: 'L27-opponent-turn-timing',
  sources: ['RL-46', 'CR 10-2-16-1', 'SH-RGL'],
}
```

**Check.** 8 − 4 − 1 = 3 active, 4 rested. 3 + 4 = 7 > 5; 3 + 2 = 5; 5 × 2000 = 10000. RL-46: the 5-or-fewer condition is checked at [On Your Opponent's Attack], before Counter Events can be paid. The warning appears only if the score is ready within 300 ms of the press (ARCHITECTURE §5).

---

## E18. Double Attack at 1 Life

**Where:** Guided count, step 1 (learning-ui §3.2), after the player answers "1 hit (Double Attack)".

**Position.** Your Main Phase. You: Monkey.D.Luffy (OP13-001) Leader 5000, no DON!! left to give; Monkey.D.Luffy (OP13-118), 7000, [Double Attack], active (played last turn). Them: Rocks.D.Xebec Leader 5000, **1 Life, 0 cards in hand**, no Characters. Rocks's lists run no [Trigger] cards; their biggest counter is +2000.

```ts
{
  conceptId: 'lethal-math',
  claim: 'At 1 Life, Double Attack counts as one hit.',
  evidence: [
    { text: 'You win by hitting their Leader while they have 0 Life.',
      figures: {} },
    { text: 'Double Attack\'s damage is decided once. At 1 Life it takes their last Life card, and the game goes on.',
      figures: { opponentLife: 1 } },
    { text: 'So you need 2 attacks that land: your Leader and Luffy.',
      figures: { hitsNeeded: 2, attackers: 2 } },
    { text: 'Attack with your Leader first: with no cards they can\'t stop a 5000 tie. The Life card it gives them is at most +2000, short of the 3000 needed to stop Luffy.',
      figures: { leaderPower: 5000, opponentHand: 0, maxPerCard: 2000, stopLuffy: 3000 } },
  ],
  line: [
    { kind: 'attack', text: 'Attack their Leader with your Leader.', card: 'OP13-001', target: 'leader' },
    { kind: 'attack', text: 'Attack their Leader with Luffy.', card: 'OP13-118', target: 'leader' },
  ],
  outcome: 'Wins the game this turn.',
  certainty: 'any-hand',
  nextTime: 'Double Attack counts 2 toward their Life, but the winning hit has to land at 0 Life.',
  lessonId: 'L06-life-and-triggers',
  sources: ['CR 7-1-4-1-1-1', 'CR 7-1-4-1-1-3', 'CR 10-1-2-1', 'RL-20'],
}
```

**Check.** Leader 5000 vs 5000: tie, hit (CR 7-1-4-1); Life 1 → 0; hand 0 → 1. Luffy 7000 − 5000 + 1000 = 3000 > 2000: hit at 0 Life, win. In the other order, Luffy's Double Attack takes the last Life card (the second point finds 0 Life and does nothing, RL-20), and the Leader's 5000 tie can then be stopped by any 1000 counter.

---

## E19. A counter that only tied

**Where:** Game Review flag "Counter wasted", moderate. The first evidence line is also the defence planner's inline warning when the same counter is staged (flows F6 step 3).

**Position.** Their turn. You: Rocks.D.Xebec Leader 5000, 3 Life; hand: Rocks Pirates (OP17-056, +2000), Buckin (OP08-051, +1000), Kyo, Shiki. Them: Kaido (OP17-058) Leader with 2 DON!! (7000) attacks your Leader.

**What you did.** Played Rocks Pirates: your Leader 7000. 7000 vs 7000: the hit landed (Life 3 → 2).

```ts
{
  conceptId: 'counters-and-blockers',
  claim: 'Your counter tied, and ties go to the attacker.',
  evidence: [
    { text: 'Their Leader attacked at 7000. Rocks Pirates made yours 7000, so the hit still landed.',
      figures: { attackPower: 7000, defenceAfter: 7000 } },
    { text: 'Stopping it took 7000 − 5000 + 1000 = 3000. Buckin (+1000) with Rocks Pirates would have made 8000.',
      figures: { stopNeeded: 3000, withBuckin: 8000 } },
  ],
  line: [
    { kind: 'take', text: 'Best: take the hit and keep Rocks Pirates for a later attack.' },
    { kind: 'counter', text: 'Also fine: add Buckin (8000 vs 7000), spending 2 cards to save 1 Life.', card: 'OP08-051' },
  ],
  outcome: 'Keeps Rocks Pirates (+2000) for a later attack, for the same 1 Life.',
  certainty: 'any-hand',
  nextTime: 'A counter has to put you above their power, not level with it. Check the "need" number before you play one.',
  lessonId: 'L05-block-and-counter',
  sources: ['CR 7-1-4-1', 'SH-CTR', 'HAKI'],
}
```

**Check.** 5000 + 2000 = 7000 = attacker: attacker wins (CR 7-1-4-1). Stop needs 3000; 2000 + 1000 = 3000 → 8000 > 7000. The line compares both remedies (UX-R27): taking the hit costs 1 Life and keeps the +2000 card; adding Buckin costs 2 cards and saves 1 Life. At 3 Life with a +2000 card in hand, keeping the card is ranked first, and the second is shown as also fine so the player sees the trade. The outcome names what the best line gains compared with what was done: the same Life lost, one counter card kept.

---

## E20. Live lethal, three tiers

**Where:** Lethal detector (learning-ui §3.1). Tier 1: "Lethal is on the board. Works against any hand." Tier 2: "You need 3 hits. You have 3 attackers that can hit their Leader." Tier 3: the object below. The guided count for this position: hits 3; attackers Ulti, Leader, Kaido; their defence 1 card now (+3000 at most, through Newgate), one more card per hit; DON!! split 2 / 5 / 0, smallest first.

**Position.** Game turn 11 (your 6th), going first: **10 DON!!, all active, none given**. You: Kaido (OP17-058) Leader 5000; Ulti & Page One (OP17-060) 6000 and Kaido (OP17-062) 12000, both active, played on earlier turns. Them: Rocks.D.Xebec Leader 5000, **2 Life, 1 card in hand**; their only Character is Edward.Newgate (OP17-040), rested ("[Once Per Turn] When your Leader … is attacked, you may trash 1 card from your hand: your Leader gains +3000 power during this battle"). No Blockers. No [Trigger] cards in Rocks's lists; biggest counter +2000.

```ts
{
  conceptId: 'lethal-math',
  claim: 'You have lethal: 3 hits, and they can\'t stop any of them.',
  evidence: [
    { text: 'They are at 2 Life, so you need 3 hits. You have 3 attackers.',
      figures: { opponentLife: 2, hitsNeeded: 3, attackers: 3 } },
    { text: 'They hold 1 card. Newgate turns a card into +3000 once this turn; their counters are +2000 each.',
      figures: { handSize: 1, newgateBoost: 3000, maxPerCard: 2000 } },
    { text: 'Each hit gives them a card: 1 card for your first attack, 2 for the second, 3 for the third.',
      figures: { cardsAtFirst: 1, cardsAtSecond: 2, cardsAtThird: 3 } },
    { text: 'Ulti with 2 DON!! (8000) needs 4000 to stop. They can make 3000.',
      figures: { ultiPower: 8000, stopUlti: 4000, maxAtFirst: 3000 } },
    { text: 'Your Leader with 5 DON!! (10000) needs 6000. They can make 5000.',
      figures: { leaderPower: 10000, stopLeader: 6000, maxAtSecond: 5000 } },
    { text: 'Kaido (12000) needs 8000. They can make 7000.',
      figures: { kaidoPower: 12000, stopKaido: 8000, maxAtThird: 7000 } },
  ],
  line: [
    { kind: 'giveDon', text: 'Give 2 DON!! to Ulti & Page One (8000) and 5 to your Leader (10000).', count: 7 },
    { kind: 'attack', text: 'Attack their Leader with Ulti & Page One.', card: 'OP17-060', target: 'leader' },
    { kind: 'attack', text: 'Attack their Leader with your Leader.', card: 'OP17-058', target: 'leader' },
    { kind: 'attack', text: 'Attack their Leader with Kaido (12000).', card: 'OP17-062', target: 'leader' },
  ],
  outcome: 'Wins the game this turn.',
  certainty: 'any-hand',
  nextTime: 'Each hit hands them a card. Size each attack against the cards they will have by then, and send the biggest last.',
  lessonId: 'L15-lethal-math',
  sources: ['CR 7-1-4-1', 'CR 7-1-4-1-1-1', 'CR 7-1-4-1-1-2', 'CR 6-5-5-2', 'SH-DON', 'SH-CTR'],
}
```

**Check.** Attack 1: 8000 − 5000 + 1000 = 4000; one card gives at most 3000 (trashed to Newgate) or 2000: hit, Life 1, hand 2. Attack 2: 10000 − 5000 + 1000 = 6000; two cards give at most 3000 + 2000 = 5000: hit, Life 0, hand 3. Attack 3: 12000 − 5000 + 1000 = 8000; three cards give at most 3000 + 2000 + 2000 = 7000: hit at 0 Life, win. If Newgate is used earlier, later maxima only fall. 7 of 10 DON!! used; 3 spare. Kaido's own [When Attacking] −2000 is optional and not needed.

---

## Notes for the owner's review

- **E11's outcome** wording is open: "a play by turn 3 (your 2nd)" is exact; "an early play" is friendlier.
- **E14** uses "Depends on your hand"; E15 no longer hedges ("Likely" was replaced by its condition, UX-R25).
- **AI explanations (E12, E13, E14, E16)** name the AI by its Leader. The alternative is "The AI". Naming the Leader reads better in mirror matches only if both sides are not the same Leader; mirrors need "their Kaido".
- **Hindsight (E02)** is phrased to avoid blame. The owner may want it firmer for players who play conservatively by habit.
