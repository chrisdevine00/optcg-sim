# Rulings and edge cases (Phase 3, Track F)

**As of:** 2026-10-28
**Scope:** the PROMPT.md Track F list, every open question R1–R14, S3, S4 and B4 in `docs/OPEN-QUESTIONS.md`, and the rulings the 12 meta leaders in `docs/research/meta-lists.json` depend on.
**Companion:** `docs/research/rules-digest.md` (Track A). This file does not repeat the digest; it settles what the digest left open and adds the per-card rulings.

## How to read this file

- **Answers come only from official sources:** the Comprehensive Rules (CR), the general Q&A (QA-GR), the per-set Q&A PDFs, the Rule Manual, and the tournament and floor rules. No community source is used as an answer anywhere in this file.
- **Paraphrase.** The official site says its text "may not be reproduced without permission", so every ruling is in my own words. Short quotations appear only where the wording matters. Each per-card Q&A is identified by its file, the card number it is filed under, and a short paraphrase of its question.
- **Card number of a Q&A row.** In the extracted Q&A PDFs, the card-number label sits at the bottom (or vertical middle) of its table row, below the question. Every card-specific citation below was checked against that card's text, so the question is about the card named. Where a citation is only "a card in this file", I say so.
- **Confidence levels:**
  - *official explicit*: a CR rule or an official Q&A answers this exact question.
  - *official by inference*: no source answers it directly, but CR text or analogous official rulings decide it with no competing official reading.
  - *unresolved*: official sources are silent or conflict. My best answer is given and marked.
- **Engine tests** are written as `createFromScenario` positions (ARCHITECTURE §2.1). Notation: **P1** is the turn player, **P2** the non-turn player. "Spec" lists only what matters; everything else is default (40-card decks, empty trash, 5 Life). "Expect" is checked with `derive`, the event log, and `checkInvariants`.

## Sources and pages opened

`https://en.onepiece-cardgame.com/robots.txt` returns 404, so the host sets no crawler rules. I still fetched one file per second with an identifying user agent. Every file is cached under `.cache/track-f/`.

| Short name | URL | Version or date |
| --- | --- | --- |
| CR | https://en.onepiece-cardgame.com/pdf/rule_comprehensive.pdf?20260828 | v1.2.1, "Last updated: 8/28/2026". Still the newest on https://en.onepiece-cardgame.com/rules/ on 2026-10-28. |
| QA-GR | https://en.onepiece-cardgame.com/pdf/qa_rules.pdf?20250228 | 2025-02-28 (no question numbers) |
| Rule Manual | https://en.onepiece-cardgame.com/pdf/rule_manual.pdf?20230623 | v1.11 |
| TRM | https://en.onepiece-cardgame.com/pdf/tournament_rules_manual.pdf?20260116 | "Last Updated: October 17, 2025" |
| FR | https://en.onepiece-cardgame.com/pdf/floor_rule.pdf | v1.6.0 |
| Q&A index | https://en.onepiece-cardgame.com/rules/faq/ | lists 46 Q&A PDFs; I downloaded and read all of them |
| QA-OP05 | https://en.onepiece-cardgame.com/pdf/qa_op05.pdf?20240405 | |
| QA-OP08 | https://en.onepiece-cardgame.com/pdf/qa_op08.pdf?20240830 | |
| QA-OP09 | https://en.onepiece-cardgame.com/pdf/qa_op09.pdf?20241129 | no entry for OP09-062 |
| QA-OP12 | https://en.onepiece-cardgame.com/pdf/qa_op12.pdf?20260206 | |
| QA-OP13 | https://en.onepiece-cardgame.com/pdf/qa_op13.pdf?20260206 | no entry for OP13-004 |
| QA-OP14 | https://en.onepiece-cardgame.com/pdf/qa_op14_eb04.pdf?20260626 | OP-14 and EB-04 |
| QA-OP15 | https://en.onepiece-cardgame.com/pdf/faq_op15-eb04.pdf?20260313 | OP-15 (file name says eb04) |
| QA-OP17 | https://en.onepiece-cardgame.com/pdf/qa_op17.pdf?20260821 | |
| QA-ST30 | https://en.onepiece-cardgame.com/pdf/qa_st-30.pdf?20260529 | |
| Other per-set Q&As | `https://en.onepiece-cardgame.com/pdf/qa_<set>.pdf?<date>`, as linked from the Q&A index: qa_op01 (20240405), qa_op02 (20240405), qa_op03 (20240405), qa_op04 (20240405), qa_op06 (20240419), qa_op07 (20250228), qa_op10 (20250228), qa_op11 (20250523), qa_op16 (20260821), qa_eb01 (20240419), qa_eb02 (20250425), qa_eb03 (20260206), qa_prb01 (20241025), qa_promotion-cards (20260206), qa_st-01-st-04 (20240405), qa_st-05 (20230127), qa_st-06 (20230303), qa_st-07 (20230609), qa_st-08 (20230728), qa_st-09 (20230728), qa_st-10 (20240405), qa_st-13 (20240405), qa_st-32 (20260717), qa_st-34 (20260821) | |
| Block page | https://en.onepiece-cardgame.com/topics/013.php | "Introduction of the Block Number System", updated 2025-07-23 |
| Block list | https://en.onepiece-cardgame.com/news/blockicon-card.html (also reached from `/rules/blockicon-card/`, which redirects here) | dated 2026-07-17, lists updated to 2026-08-21 |

Per-set Q&As are cited as QA-<set> (QA-OP01, QA-ST01–04, QA-EB03, QA-PRB01; QA-PROMO is qa_promotion-cards).

Card text for the cards discussed was read from the official card list cache (`.cache/track-b/official/`) and, where a card was missing there, from the optcgapi cache (`.cache/track-b/raw/optcgapi-all.json`). That text is used only to check that a Q&A row is about the card named.

## Index

| ID | Topic | Closes |
| --- | --- | --- |
| RL-01 | Simultaneous auto effects: who goes first, and where new triggers queue | (PROMPT list) |
| RL-02 | [Trigger] versus other effects caused by the same damage | (PROMPT list) |
| RL-03 | Effects triggered while paying for or resolving an activation | — |
| RL-04 | Playing a Character from hand into a full Character area: order of cost and trash | R1 |
| RL-05 | Playing a Character by an effect into a full Character area | R2 |
| RL-06 | What the full-area trash may choose, and what it is not | (PROMPT list) |
| RL-07 | Replacing a Stage | (PROMPT list) |
| RL-08 | "During this battle" and Counter boosts | (PROMPT list) |
| RL-09 | "During this turn", "until the end of the turn" and [End of Your Turn] | (PROMPT list) |
| RL-10 | "Until the start of your next turn" | (PROMPT list) |
| RL-11 | Durations that reach into the next turn | engine gap |
| RL-12 | Continuous effects outlive their source; the moved card loses them | (PROMPT list) |
| RL-13 | DON!! power is your turn only; [DON!! xX] is a state check on both turns | R7 |
| RL-14 | "Cannot be K.O.'d" covers battle and effects | (PROMPT list) |
| RL-15 | "Cannot be K.O.'d" versus bounce, bottom-deck, trash and rule trash | (PROMPT list) |
| RL-16 | "Cannot be K.O.'d" versus costs and cost-filtered removal | (PROMPT list) |
| RL-17 | Attack targets: rested Characters only; attacking again | (PROMPT list) |
| RL-18 | Blocker timing relative to attack triggers and Counter | (PROMPT list) |
| RL-19 | A Leader with [Blocker] | R9 |
| RL-20 | Double Attack: Trigger step, fixed damage, 1 Life | S3 |
| RL-21 | Banish | (PROMPT list) |
| RL-22 | Effect damage and the 0-Life loss | R3 |
| RL-23 | DON!! to the cost area versus DON!! to the DON!! deck | (PROMPT list) |
| RL-24 | Returned DON!! come back through the DON!! Phase; DON!! −X sources | S4, R11 |
| RL-25 | [Trigger] costs nothing but its own activation cost; the card is in no area | R8 |
| RL-26 | Deck-out | (PROMPT list) |
| RL-27 | Simultaneous defeat and rule-processing granularity | R4, R5 |
| RL-28 | First player's turn 1 and second player's turn 2 | (PROMPT list) |
| RL-29 | Mulligan (redraw) procedure | (PROMPT list) |
| RL-30 | "At the start of the game" order: CR and Q&A disagree | conflict |
| RL-31 | Replacement effects: optional or mandatory, one replacement for several events, impossible replacements | R6 |
| RL-32 | Order of interacting permanent effects | R14 |
| RL-33 | Several base-power settings | — |
| RL-34 | [On Your Opponent's Attack] and the end-of-Attack-Step check | R12 |
| RL-35 | Giving DON!!: "cost area" in CR 6-5-5-1 | R10 |
| RL-36 | Tournament procedure in the sim | R13 |
| RL-37 | Block number: per printing or per card number | B4 |
| RL-40 | OP15-058 Enel: 6-card DON!! deck | leader |
| RL-41 | OP12-061 Donquixote Rosinante: Law K.O. replacement | leader |
| RL-42 | OP05-098 Enel: Life reaches 0 on the opponent's turn | leader |
| RL-43 | OP17-079 Monkey.D.Luffy: granting [Blocker] | leader |
| RL-44 | OP17-039 Rocks.D.Xebec: the revealed card | leader |
| RL-45 | OP17-058 Kaido: two timings, one use per turn | leader |
| RL-46 | OP13-001 Monkey.D.Luffy: counts DON!! before Counter | leader |
| RL-47 | OP14-041 Boa Hancock: draw on every opponent-turn play | leader |
| RL-48 | OP08-098 Kalgara: usable at 0 Life | leader |
| RL-49 | ST30-001 Luffy & Ace: what the two effects cover | leader |
| RL-50 | OP09-062 Nico Robin: Banish and the DON!! ramp (no per-card Q&A) | leader |
| RL-51 | OP13-004 Sabo: conditional permanent power (no per-card Q&A) | leader |

---

## A. Effect ordering

### RL-01 Simultaneous auto effects: who goes first, and where new triggers queue

- **Question:** When both players' auto effects trigger at the same moment, who resolves first? When resolving one effect triggers another, where does the new one go?
- **Answer:**
  1. The turn player resolves all of their simultaneously triggered effects first, in the order they choose. Then the non-turn player resolves theirs, in the order they choose (CR 8-6-1; Rule Manual p.14).
  2. If the turn player's resolution triggers a **new** effect of the turn player, the non-turn player's already-pending effects resolve before it (CR 8-6-1).
  3. Within one player: if A and B are pending and A's resolution triggers C, C resolves after B (CR 8-6-1-1).
  4. Official examples:
     - QA-OP11, card OP11-102 Camie, "My opponent's Leader is OP05-098 Enel … in what order do this [Your Turn] effect and Enel's effect resolve?": the turn player's effect resolves first because the turn player's effects take priority.
     - QA-OP10, card OP10-042 Usopp, "my OP10-090 Franky was K.O.'d and I used its [On K.O.] to play OP04-092 Rebecca … which activates first, this Leader's [Opponent's Turn] effect or Rebecca's [On Play]?": the Leader's effect always resolves before the [On Play] of the Character that Franky played. That is CR 8-6-1-1: Usopp's effect (B) was already pending when Rebecca's [On Play] (C) triggered.
     - QA-OP05, card OP05-098 Enel, "Which first, this Leader's effect or the [On Play] of OP05-106 Shura that I played with a [Trigger]?": the player who controls both chooses the order.
- **Confidence:** official explicit.
- **Sources:** CR 8-6-1, 8-6-1-1; Rule Manual p.14; QA-OP11 OP11-102; QA-OP10 OP10-042; QA-OP05 OP05-098.
- **Closes:** PROMPT.md "ordering of simultaneous triggers".
- **Engine test:** Spec: P2's turn (P2 is the turn player). P1 (non-turn player) has Leader OP10-042 Usopp and OP10-090 Franky (a {Dressrosa} Character) in play, with OP04-092 Rebecca in P1's trash and 5 or fewer cards in P1's hand. Action: P2 K.O.s Franky with an effect. Expect: P1 gets an `order` decision for Usopp's effect and Franky's [On K.O.]. P1 picks Franky first and plays Rebecca. Then Usopp's draw resolves **before** Rebecca's [On Play]: the event log shows `Draw` before Rebecca's `EffectResolved`. A second test uses the Camie/Enel position from RL-42 and checks that the turn player's effect resolves before the non-turn player's.

### RL-02 [Trigger] versus other effects caused by the same damage

- **Question:** A Life card with [Trigger] is checked during damage, and the same damage also triggers other effects, such as "when you take damage" or "when your Life becomes 0". Which goes first?
- **Answer:** [Trigger] always goes first. Damage processing pauses, the player decides whether to activate the [Trigger], and it resolves (CR 8-6-2-1). Every other effect whose timing was met during damage processing waits until **all** damage processing is finished, including the second point of a Double Attack (CR 8-6-2).
  - QA-OP13, card OP13-002 Portgas.D.Ace, "can I choose the order of this Leader's effect and a [Trigger]?": no. You reveal the Life card and decide on the [Trigger] first; the Leader's "when you take damage" effect activates after the [Trigger] has resolved.
  - QA-OP05, card OP05-098 Enel, "1 Life left and that card has a Trigger: which activates first?": you decide on the [Trigger] first; if you activate it, Enel's effect activates after it has been processed.
- **Confidence:** official explicit.
- **Sources:** CR 8-6-2, 8-6-2-1; QA-OP13 OP13-002; QA-OP05 OP05-098.
- **Closes:** PROMPT.md "ordering of simultaneous triggers" (damage case).
- **Engine test:** Spec: P2's turn. P1 has Leader OP13-002 Ace with 1 DON!! given, 2 Life, and the top Life card is a Character with "[Trigger] Play this card". Action: P2's Leader attacks P1's Leader; no block, no counter; damage. Expect: a `trigger` decision first. If P1 activates it, the played Character's [On Play] (if any) and Ace's draw are both queued only after damage processing ends, and P1 then gets an `order` decision for them. Assert that no `Draw` event from Ace appears before the `TriggerResolved` event.

### RL-03 Effects triggered while paying for or resolving an activation

- **Question:** If paying an activation cost (for example DON!! −2) triggers another effect, when does it resolve?
- **Answer:** After the activation that caused it finishes resolving (CR 8.6.3). QA-OP04, card OP04-064 Ms. All Sunday: with OP04-058 Crocodile as Leader and 6 DON!! on the field, P1 activates Ms. All Sunday's [Trigger] ("DON!! −2: Play this card"), so 4 DON!! remain. Crocodile's [Opponent's Turn] effect (add 1 DON!! when your effect returns DON!!) has activated first, giving 5. Then Ms. All Sunday's [On Play] adds 1 more, giving 6, so its "6 or more DON!!, draw 1" condition is met and P1 draws.
- **Confidence:** official explicit.
- **Sources:** CR 8.6.3 (printed with dots), 8-6-1-1; QA-OP04, card OP04-064, "My Leader is OP04-058 Crocodile and I have 6 DON!! … can I draw with the [On Play]?".
- **Closes:** none (supports R12 and RL-25).
- **Engine test:** Spec: P2's turn. P1 has Leader OP04-058 Crocodile, 6 DON!! on the field (all in the cost area), 4 in the DON!! deck, and OP04-064 on top of Life. Action: P2 deals 1 damage; P1 activates the [Trigger] and returns 2 DON!!. Expect: Crocodile's add resolves before Ms. All Sunday's [On Play]; the final DON!! on the field is 6; P1 draws 1; the DON!! total is still 10.

---

## B. Character area, Stage area

### RL-04 Playing a Character from hand into a full Character area: order of cost and trash

- **Question:** With 5 Characters in play, P1 plays a sixth from hand. CR 2-7-2 says reveal → rest DON!! → play; CR 3-7-6-1 says reveal → trash 1 → play. Where does the cost payment go?
- **Answer:** Reveal → pay the cost → trash 1 Character → place the new one. No source states this for Characters. The official Stage ruling uses exactly this order: reveal, pay the cost, trash the old Stage, place the new one (QA-GR "Can I play another Stage card…?"). CR 3-7-6-1 and 3-8-5-1 are worded identically, so the Character case follows the Stage case. The ordering matters only if something checks the board while costs are paid, for example a cost reduction that counts your Characters. No such Q&A exists, so the count at payment time includes the Character that will be trashed.
- **Confidence:** official by inference.
- **Sources:** CR 2-7-2, 3-7-6-1, 3-8-5-1; QA-GR Stage entry.
- **Closes:** R1 (best answer confirmed by inference).
- **Engine test:** Spec: P1 Main Phase, 5 Characters A–E in play, 3 active DON!!, and a 3-cost Character X in hand. Action: play X. Expect: the decision sequence is `pay` (DON!! picks) → `choose` (trash target among A–E) → X enters active. Events: `CardRevealed(X)`, `DonRested×3`, `CardTrashed(A, cause: rule)`, `CardPlayed(X)`. The Character area never holds 6.

### RL-05 Playing a Character by an effect into a full Character area

- **Question:** If an effect plays a Character (from hand, trash or deck) while the area holds 5, does the effect fail, or does the trash procedure apply?
- **Answer:** The trash procedure applies. The player reveals the Character to be played, trashes 1 Character already in the area, then plays the new one. QA-OP01, card OP01-014 Jinbe, "Can I use this [On Block] effect to play a Character from my hand if I have 5 Characters?": yes, with that procedure. The trashed card can be the source of the effect, even the attacker: QA-OP01, card OP01-049 Bepo, "5 Characters, I use this [When Attacking] to play a Character; can I trash this Bepo?": yes, and because the attacker has left the field the battle ends with nothing happening (CR 7-1-1-4).
- **Confidence:** official explicit.
- **Sources:** CR 3-7-3, 3-7-6-1, 7-1-1-4; QA-OP01 OP01-014, OP01-049.
- **Closes:** R2.
- **Engine test:** Spec: P1 Main Phase, 5 Characters in play including OP01-049 Bepo (active, 1 DON!! given), a "Heart Pirates" 3-cost Character Y in hand, P2 Leader at 5000. Action: Bepo attacks P2's Leader; [When Attacking] plays Y; P1 chooses to trash Bepo. Expect: Y in the Character area; Bepo in the trash with no [On K.O.]; Bepo's DON!! in the cost area rested (CR 6-5-5-4); the battle goes straight to End of the Battle (no `block` or `counter` decision for P2); P2's Life unchanged.

### RL-06 What the full-area trash may choose, and what it is not

- **Question:** Which Characters can be chosen for the full-area trash, and does it count as a K.O. or as being "removed by an effect"?
- **Answer:** Any one of your Characters. The trash is rule processing and no effect can apply to it (CR 3-7-6-1-1). So:
  - It is not a K.O.: [On K.O.] does not activate (QA-GR "5 Characters … [On K.O.]").
  - "Cannot be K.O.'d" and "instead" effects that watch for K.O. or removal by an effect cannot stop it (CR 3-7-6-1-1, 10-2-1-3).
  - It applies to the defender as well. QA-ST01–04, card ST02-010 Basil Hawkins: the defender has 5 Characters, blocks with OP01-014 Jinbe, uses Jinbe's [On Block] to play a Character, and trashes the blocking Jinbe. The attack target no longer exists, so the Counter and Damage Steps are skipped and the battle ends. Hawkins's "if this Character battles" effect does not resolve.
- **Confidence:** official explicit.
- **Sources:** CR 3-7-6-1-1, 10-2-1-3, 7-1-2-3; QA-GR; QA-ST01–04 ST02-010.
- **Closes:** PROMPT.md "full character area".
- **Engine test:** Spec: P2's turn. P1 has 5 Characters including OP01-014 Jinbe (active, 1 DON!! given), a Character with "[On K.O.]: draw 1", and a Character with "cannot be K.O.'d by effects"; a red 2-cost Character in hand. P2's ST02-010 Hawkins (1 DON!!) attacks a rested P1 Character. Action: P1 blocks with Jinbe; [On Block] plays the 2-cost; P1 trashes Jinbe. Expect: no `counter` decision; Hawkins stays rested; no draw from any [On K.O.]. Variant: P1 trashes the "cannot be K.O.'d" Character instead, and it is trashed.

### RL-07 Replacing a Stage

- **Question:** How do you play a Stage while one is already in play?
- **Answer:** Reveal the new Stage, pay its cost, trash the Stage already there, then place the new one (QA-GR "Can I play another Stage card if there is already a Stage card on my field?"). CR 3-8-5-1 gives the same order without the payment step. The old Stage is trashed by rule. It is a new object in the trash (CR 3-1-6), and any DON!! or effects on it do not carry over. Stages enter active (CR 3-8-4). Neither source sets a limit on how often you replace a Stage, beyond the cost.
- **Confidence:** official explicit.
- **Sources:** QA-GR Stage entry; CR 3-8-4, 3-8-5, 3-8-5-1, 3-1-6.
- **Closes:** PROMPT.md "replacing a Stage".
- **Engine test:** Spec: P1 Main Phase, Stage S1 in play (rested), 2 active DON!!, a 1-cost Stage S2 in hand. Action: play S2. Expect: `DonRested×1`, then `CardTrashed(S1, cause: rule)`, then S2 in the Stage area **active**; the Stage area holds exactly 1; `whyNot` for a third Stage with 0 active DON!! is the cost.

---

## C. Durations: when power and other modifications end

Summary of the expiry points, in game order. CR numbers are the exact sub-steps; the engine's `duration` values must expire at these points (ARCHITECTURE §2.2).

| Wording on the card | Ends at | CR |
| --- | --- | --- |
| Character Counter value; "during this battle" | End of the Battle: turn player's effects at 7-1-5-3, then non-turn player's at 7-1-5-4 | 7-1-3-1-1, 7-1-5-3/4 |
| "until the end of the turn", "until the end of the End Phase" | End Phase step 6-6-1-2: turn player's (1), then non-turn player's (2) | 6-6-1-2 |
| "during this turn" | End Phase step 6-6-1-3, after 6-6-1-2: turn player's, then non-turn player's | 6-6-1-3 |
| "until the start of your next turn" | Refresh Phase step 6-2-1 of that player's next turn, before start-of-turn effects | 6-2-1 |
| "until the end of your opponent's next End Phase" | The opponent's next End Phase, step 6-6-1-2 (2) (the effect's owner is the non-turn player then) | 6-6-1-2 (inference, RL-11) |
| "until the end of your opponent's next turn" / "your next turn" | The End Phase of that later turn | ST10-016 and OP09-093 Q&As (RL-11) |
| +1000 per given DON!! | Not a duration. It applies only during its owner's turn (6-5-5-2); the DON!! leave at that owner's next Refresh (6-2-3). | 6-5-5-2 |

### RL-08 "During this battle" and Counter boosts

- **Question:** When does a Counter boost, or any "during this battle" effect, end? What if it went on a card that is not in the battle?
- **Answer:** At End of the Battle (CR 7-1-5-3/4). A Character Counter lasts "during that battle" (CR 7-1-3-1-1). It may be given to a card that is not being attacked, and it still ends with the battle (QA-GR "Can I use a Counter to increase the power of a card not being attacked?"). The end-of-battle triggers ("at the end of the battle", "if this … battles") activate at 7-1-5-2, **before** battle-duration effects expire, so they still see the boosted values.
- **Confidence:** official explicit.
- **Sources:** CR 7-1-3-1-1, 7-1-5-2..7-1-5-4; QA-GR Counter entries.
- **Closes:** PROMPT.md "when power modifications expire" (battle).
- **Engine test:** Spec: P2's turn, P2's 5000 Leader attacks P1's 5000 Leader. P1 has a +2000 Counter Character in hand and a rested Character Z (3000). Action: P1 counters onto Z (not the target). Expect: during the Damage Step, Z is 5000 and P1's Leader is 5000, so P2 wins the battle and P1 takes 1 damage. After End of the Battle, Z is 3000. A second test puts the Counter on the Leader, and the battle ends with the Leader at its original power.

### RL-09 "During this turn", "until the end of the turn" and [End of Your Turn]

- **Question:** In the End Phase, do [End of Your Turn] effects see "during this turn" boosts? Which expires first, "until the end of the turn" or "during this turn"?
- **Answer:** The End Phase has three ordered steps (CR 6-6-1):
  1. [End of Your Turn] effects, then [End of Your Opponent's Turn] effects, each once (6-6-1-1).
  2. Delayed "at the end of this turn" processing runs, and "until the end of the turn" / "until the end of the End Phase" effects end: turn player's, then non-turn player's (6-6-1-2).
  3. "During this turn" effects end: turn player's, then non-turn player's (6-6-1-3).

  So [End of Your Turn] effects still see "during this turn" boosts. QA-OP10, card OP10-003 Sugar, "Does the [End of Your Turn] check for a 6000-power Character happen before '+2000 during this turn' boosts return to normal?": yes, it activates before the power returns.
- **Confidence:** official explicit.
- **Sources:** CR 6-6-1-1..6-6-1-4; QA-OP10 OP10-003.
- **Closes:** PROMPT.md "when power modifications expire" (turn).
- **Engine test:** Spec: P1 End Phase about to start. P1 Leader OP10-003 Sugar; a {Donquixote Pirates} Character at 4000 with a "+2000 during this turn" modifier; 1 rested DON!!. Action: end the Main Phase. Expect: Sugar's effect sees 6000 and sets 1 DON!! active; then the modifier expires (event order `EffectResolved(Sugar)` → `ModifierExpired`). A companion test puts an "until the end of the turn" and a "during this turn" modifier on the same card and asserts the expiry order 6-6-1-2 before 6-6-1-3.

### RL-10 "Until the start of your next turn"

- **Question:** When does "until the start of your next turn" end, and does it protect during the opponent's whole turn?
- **Answer:** It ends at step 6-2-1 of its controller's next Refresh Phase. That is before "at the start of your turn" effects activate (6-2-2) and before DON!! return and untap (6-2-3, 6-2-4). It therefore covers the whole of the opponent's turn. QA-OP06, card OP06-074 Zephyr: a Character protected by OP04-083 Sabo's "[On Play] None of your Characters can be K.O.'d by effects until the start of your next turn" cannot be K.O.'d by Zephyr's effect on the opponent's turn.
- **Confidence:** official explicit.
- **Sources:** CR 6-2-1..6-2-4; QA-OP06 OP06-074, "Can I K.O. a Character with 5000 power or less that is subject to OP04-083 Sabo's [On Play]?".
- **Closes:** PROMPT.md "until start of next turn".
- **Engine test:** Spec: P1 plays OP04-083 Sabo on turn N. On turn N+1 (P2's), P2 plays OP06-074 Zephyr, pays DON!! −1 and targets a 4000 P1 Character. Expect: the negate applies, the K.O. does nothing, and the Character stays. On turn N+2, at P1's Refresh, the protection expires at 6-2-1: a test hook inspects the modifier list between 6-2-1 and 6-2-2.

### RL-11 Durations that reach into the next turn

- **Question:** Cards in the current meta use durations the engine's list does not have: "until the end of your opponent's next End Phase" (OP17-034, OP17-043, EB04-061, OP16-073, OP12-073), "until the end of your opponent's next turn" (OP09-093, OP11-119), and "until the end of your next turn". When do they end?
- **Answer:**
  - "Until the end of your next turn": QA-ST10, card ST10-016 Gum-Gum Kong Gatling, "Until when is this [Trigger] ('until the end of your next turn') effective?": until it has become your turn again and that turn has ended.
  - "Until the end of your opponent's next turn": QA-OP09, card OP09-093 Marshall.D.Teach, "How long can the chosen Character not attack?": until the end of your opponent's next turn.
  - "Until the end of your opponent's next End Phase": no Q&A gives the exact sub-step. By CR 6-6-1-2, effects lasting "until the end of the End Phase" end at step 6-6-1-2. In the opponent's End Phase the effect's owner is the non-turn player, so it ends at 6-6-1-2 (2). That is after the opponent's [End of Your Turn] effects (6-6-1-1), so those still see it. The other two durations end at the same step of the stated turn ("until the end of the turn").
- **Confidence:** official explicit for the first two (which turn); official by inference for the exact sub-step.
- **Sources:** QA-ST10 ST10-016; QA-OP09 OP09-093; CR 6-6-1-2.
- **Closes:** none. It is an engine gap: the `duration` union in ARCHITECTURE §2.2 needs `untilEndOfOpponentsNextEndPhase(p)` and `untilEndOfTurn(turnNumber)`. See proposed decision D-2.
- **Engine test:** Spec: P1 turn N plays OP17-043 Ganzui (Leader base power becomes 6000 "until the end of your opponent's next End Phase"). Expect: P1's Leader base is 6000 through P1's End Phase N and P2's turn N+1, including when an [End of Your Turn] effect of P2 checks it at 6-6-1-1. It is back to printed base at P2's step 6-6-1-2 (2), before 6-6-1-3. On P1's turn N+2 it is printed base.

### RL-12 Continuous effects outlive their source; the moved card loses them

- **Question:** If the card that created a "during this turn" effect leaves the field or is negated, does the effect end? What happens to effects on a card that leaves the field?
- **Answer:**
  - An effect that has already resolved keeps lasting for its duration even if its source moves (QA-GR "'during this turn' … moved to another area": still valid) or is negated later (CR 8-2-3). QA-OP06, card OP06-074 Zephyr: negating OP02-004 Edward.Newgate after its [On Play] resolved does not remove the +2000 it gave the Leader. QA-OP14, card OP14-017 Chambres: when one of two power-swapped Characters leaves, the other keeps its swapped value until the end of the turn.
  - The card that moves out of the Character or Stage area becomes a new card; every effect on it is lost (CR 3-1-6), including cost changes when it returns to hand (QA-GR "negative cost … returned to my hand"). Given DON!! go to the cost area rested (CR 6-5-5-4).
  - Permanent effects ("if …, this Character gains …") stop the moment their source or condition stops (CR 8-1-3-3, 2-8-2).
- **Confidence:** official explicit.
- **Sources:** QA-GR; CR 3-1-6, 6-5-5-4, 8-2-3; QA-OP06 OP06-074; QA-OP14 OP14-017.
- **Closes:** PROMPT.md "when power modifications expire" (source leaves).
- **Engine test:** Spec: P1 Main Phase. A P1 Character with "[Activate: Main] rest this: your Leader gains +2000 during this turn"; activate it, then P2's effect (scripted) bounces that Character. Expect: the Leader keeps +2000 until 6-6-1-3. Second spec: a P1 Character with a "−2 cost during this turn" modifier is returned to hand. Expect: in hand it has its printed cost; `derive` shows no modifier on its new instance ID; the `renames` list maps old to new.

### RL-13 DON!! power is your turn only; [DON!! xX] is a state check on both turns

- **Question:** Do given DON!! add power on the opponent's turn? Does a [DON!! xX] effect work on the opponent's turn?
- **Answer:**
  - The +1000 per given DON!! applies only during your own turn (CR 6-5-5-2).
  - A [DON!! xX] condition is a plain check: it holds whenever X or more DON!! are given to the card (CR 8-3-2-3; QA-GR "more than the specified number": still works). It holds on either turn unless the card also says [Your Turn]. QA-ST01–04, card ST01-013 Roronoa Zoro ("[DON!! x1] This Character gains +1000 power"), "Does it also gain +1000 during my opponent's turn?": yes, it works during both players' turns. Given DON!! stay attached through the opponent's turn and return at your next Refresh (CR 6-2-3), so the condition can still hold then.
  - With an activation timing, the condition must hold at that moment. QA-OP01, card OP01-061 Kaido: if the DON!! given to the Leader leaves at the same time as the opponent's Character is K.O.'d, the [DON!! x1] effect does not activate.
  - CR 10-2-9-1's wording ("originally has no or less than X … and is given …") is not a transition test; the CR and Q&A above treat it as a state.
- **Confidence:** official explicit.
- **Sources:** CR 6-5-5-2, 6-2-3, 8-3-2-3, 10-2-9-1; QA-GR; QA-ST01–04 ST01-013; QA-OP01 OP01-061.
- **Closes:** R7.
- **Engine test:** Spec: P1's turn ends with ST01-013 Zoro (3000 base) holding 1 given DON!!. On P2's turn, `derive(Zoro).power` = 4000 (3000 + 1000 from [DON!! x1], +0 from the DON!! itself). On P1's turn it was 5000 (3000 + 1000 + 1000). At P1's next Refresh, after 6-2-3, it is 3000.

---

## D. K.O. and removal

### RL-14 "Cannot be K.O.'d" covers battle and effects

- **Question:** Does an unqualified "cannot be K.O.'d" stop a battle loss as well as K.O. effects? How narrow are the qualified versions?
- **Answer:**
  - Unqualified "cannot be K.O.'d" stops K.O. both by effects and by losing a battle. QA-PROMO, card P-040 Kaido, "What does 'this Character cannot be K.O.'d' mean?": it cannot be K.O.'d by effects or in battle. QA-ST05, card ST05-017 Union Armada: the chosen Character is not K.O.'d either by an effect or in battle.
  - A Character that loses a battle but cannot be K.O.'d simply stays (CR 7-1-4-1-2 tries to K.O. it; CR 1-3-3 lets the prohibition win). The battle still counts as won by the attacker for "if this battles / wins" checks; nothing else happens.
  - "Cannot be K.O.'d by effects" does not stop a battle K.O., and "cannot be K.O.'d in battle by <attribute> cards" applies only to attackers with that attribute. QA-GR: a Leader treated as having all attributes **cannot** K.O. in battle a Character that "cannot be K.O.'d in battle by <Slash> attribute cards".
  - "By your opponent's effects" protection does not stop your own effects. QA-OP04, card OP04-079 Orlumbus: choosing your own "cannot be K.O.'d by effects" Character for Orlumbus's "K.O. 1 of your {Dressrosa} Characters" leaves it on the field.
- **Confidence:** official explicit.
- **Sources:** CR 1-3-3, 7-1-4-1-2, 10-2-1-3; QA-PROMO P-040; QA-ST05 ST05-017; QA-GR (all-attributes Leader); QA-OP04 OP04-079.
- **Closes:** PROMPT.md "'cannot be K.O.'d'" (battle and effect).
- **Engine test:** Spec: P1 Main Phase; P1's 6000 Character (1 DON!!, so 7000) attacks P2's rested 5000 Character V that carries a "cannot be K.O.'d during this turn" modifier (from ST05-017). Expect: Damage Step resolves 7000 ≥ 5000; V stays in play; no `CardKOd` event; End of the Battle runs normally. Variant with "cannot be K.O.'d by effects": V is K.O.'d in battle.

### RL-15 "Cannot be K.O.'d" versus bounce, bottom-deck, trash and rule trash

- **Question:** Does "cannot be K.O.'d" stop an effect that returns the Character to hand, places it at the bottom of the deck, or trashes it? Does it stop the full-area rule trash?
- **Answer:** No to all of these. K.O. means trashed by losing a battle or by a K.O. effect; "cannot be K.O.'d" only matters for those, and any other way of trashing is not a K.O. (CR 10-2-1-1..10-2-1-3).
  - An effect that says "trash" is not a K.O. QA-OP13, card OP13-008 Emporio.Ivankov: when Ivankov is trashed by its own replacement, it is trashed without being K.O.'d, and "when a Character is K.O.'d" effects do not activate.
  - The rule trash at 5 Characters is not a K.O. (RL-06).
  - Bounce and bottom-deck are not K.O. by definition (CR 4-11-2 "remove").
  - Protection worded "cannot be **removed from the field**" is broader. QA-OP02, card OP02-027 Inuarashi: it stops K.O. by effects and also being moved to hand, deck or trash by the opponent's effects.
- **Confidence:** official explicit.
- **Sources:** CR 4-11-2, 10-2-1-1..10-2-1-3, 3-7-6-1-1; QA-OP13 OP13-008; QA-OP02 OP02-027; QA-GR (5-Character trash).
- **Closes:** PROMPT.md "'cannot be K.O.'d' vs trashing".
- **Engine test:** Spec: P2 has OP03-088 Fukurou ("cannot be K.O.'d by effects") and OP02-027 Inuarashi, both cost 4 or less, with all of P2's DON!! rested. P1 activates OP03-074 Top Knot (place a cost-4-or-less Character at the bottom of the owner's deck). Expect: Fukurou is a legal target and resolving moves it to the bottom of P2's deck (no K.O., no [On K.O.]). Choosing Inuarashi is allowed as a target, but the move does not happen and Inuarashi stays. A third case: a scripted "trash up to 1 of your opponent's Characters" effect trashes Fukurou, and `CardTrashed` carries `cause: effect`, not `CardKOd`.

### RL-16 "Cannot be K.O.'d" versus costs and cost-filtered removal

- **Question:** Can a protected Character be chosen as the target of "K.O. up to 1 of your opponent's Characters with a cost of N or less"? Can it be used to pay a cost of "K.O. 1 of your Characters"?
- **Answer:**
  - As a target: it can be chosen, and the K.O. simply does not happen (CR 1-3-2, 1-3-3). QA-OP04, card OP04-079 Orlumbus: you may choose the protected Character; it is not K.O.'d. A cost filter ("cost of N or less") reads the **current** cost after modifiers, unless the card says "base cost" (QA-OP10, card OP10-098 Liberation: a base-cost filter ignores lowered costs).
  - As a cost: it cannot pay it. A cost that cannot be paid in full cannot be paid at all, and the effect after the colon does not resolve (CR 8-3-1-3). QA-OP05, card OP05-087 Hakuba ("You may K.O. 1 of your Characters other than this Character: …"): choosing OP03-088 Fukurou (cannot be K.O.'d by effects) leaves it on the field and the −5 cost does not happen. The same holds if OP04-082 Kyros replaces its K.O. by resting the Leader: the cost was not paid as written, so nothing happens (CR 8-3-1-7).
- **Confidence:** official explicit.
- **Sources:** CR 1-3-2, 1-3-3, 8-3-1-3, 8-3-1-7; QA-OP04 OP04-079; QA-OP05 OP05-087 (two rows: Fukurou and Kyros); QA-OP10 OP10-098.
- **Closes:** PROMPT.md "'cannot be K.O.'d' vs cost-based removal".
- **Engine test:** Spec: P1 attacks with OP05-087 Hakuba (1 DON!! given); P1's only other Character is OP03-088 Fukurou. Expect: `legalActions` for the optional cost either does not offer Fukurou (completability lookahead, ARCHITECTURE §2.3) or offers it and the effect fizzles with Fukurou still in play. Pick one and test it. **Recommended:** offer it; the Q&A treats it as a legal but failed payment. Then assert that no −5 cost modifier exists. Second spec: Kyros chosen, replacement rests P1's Leader, no −5.

---

## E. Battle

### RL-17 Attack targets: rested Characters only; attacking again

- **Question:** What can be attacked, and can a card that has attacked attack again?
- **Answer:**
  - Targets: the opponent's Leader (active or rested) or one of their **rested** Characters (CR 7-1, 7-1-1-2). Active Characters can be attacked only when an effect allows it. QA-OP11, card OP11-119 Koby: the permission does not let a Character attack on the turn it was played. QA-OP11, card OP11-010 Hibari: other attack restrictions still apply. With a rested OP01-051 Eustass"Captain"Kid holding a DON!! on the opponent's field, the Leader still cannot attack the opponent's other active Characters.
  - There is no per-turn attack limit. A Leader or Character set active again by an effect may attack again: QA-ST01–04, card ST02-001 Eustass"Captain"Kid (Leader set active again) and card ST02-009 Trafalgar Law (Character set active again).
  - The attacker must be active and is rested as the cost of declaring (CR 7-1-1-1). A card that "cannot be rested" therefore cannot attack (QA-GR).
- **Confidence:** official explicit.
- **Sources:** CR 7-1, 7-1-1-1, 7-1-1-2, 6-5-2; QA-OP11 OP11-119, OP11-010; QA-ST01–04 ST02-001, ST02-009; QA-GR "cannot be rested".
- **Closes:** PROMPT.md "attacks on rested characters".
- **Engine test:** Spec: P1 Main Phase, turn 3. P2 has an active Character A and a rested Character R. Expect: `legalActions` attack targets for P1's Leader = {P2 Leader, R}; `whyNot(attack A)` cites CR 7-1-1-2. After the attack, set P1's Leader active by a scripted effect, and the attack action is offered again.

### RL-18 Blocker timing relative to attack triggers and Counter

- **Question:** In what order do [When Attacking], [On Your Opponent's Attack], "when attacked", [Blocker] and Counter happen? Can a Character set active during the Counter Step then block?
- **Answer:**
  1. Attack Step: the attacker's [When Attacking] and "when you attack" effects activate first, then the defender's [On Your Opponent's Attack] and "when attacked" effects (CR 7-1-1-3, 10-2-16-1; QA-GR "Which activates first"). QA-OP17, card OP17-040 Edward.Newgate: its "when your Leader is attacked" effect activates at the same timing as [On Your Opponent's Attack], before [Blocker] and Counter.
  2. Block Step: at most one [Blocker] per battle, optional, from an active card other than the attack target (CR 7-1-2-1, 10-1-4-1; QA-GR). [On Block] then activates (CR 7-1-2-2).
  3. Counter Step: Character Counters and Event [Counter]s, any number, in any order (CR 7-1-3-1).
  - The Block Step does not come back. QA-OP01, card OP01-057 Paradise Waterfall, and QA-OP04, card OP04-035 Spiderweb: a Character set active by a [Counter] effect cannot use [Blocker] in that battle, because the Block Step has ended.
  - [On Your Opponent's Attack] is decided before any Counter is used. QA-OP13, card OP13-001 Monkey.D.Luffy: you cannot first use a 1-cost [Counter] Event to get down to 5 active DON!! and then use the Leader's effect (see RL-46).
  - A [Blocker] can then be countered (QA-GR "[Blocker] … use a Counter": yes).
- **Confidence:** official explicit.
- **Sources:** CR 7-1-1-3, 7-1-2-1..7-1-2-3, 7-1-3-1, 10-1-4-1, 10-2-16-1; QA-GR; QA-OP17 OP17-040; QA-OP01 OP01-057; QA-OP04 OP04-035; QA-OP13 OP13-001.
- **Closes:** PROMPT.md "Blocker timing relative to Counter".
- **Engine test:** Spec: P2's turn; P2's Character attacks P1's Leader. P1 has a rested [Blocker] Character B and OP01-057 Paradise Waterfall in hand with 1 active DON!!. Expect: the decision order is P2 [When Attacking] → P1 [On Your Opponent's Attack] → `block` (B not offered: rested) → `counter`. P1 plays Paradise Waterfall and sets B active. Expect: no further `block` decision this battle; the Damage Step follows.

### RL-19 A Leader with [Blocker]

- **Question:** Can a Leader with [Blocker] block, and what happens if it loses that battle?
- **Answer:** Yes. OP05-022 Donquixote Rosinante is a Leader with printed [Blocker]. CR 10-1-4-1 lets "this card" block when one of your **other** cards is attacked, so the Leader can block an attack on one of your Characters. QA-OP05, card OP05-022, "If my Leader blocks and loses the battle, what happens?": you take damage. QA-OP12, card OP12-020 Roronoa Zoro: when a Character attack is redirected to that Leader, the attacker battled a Leader, not a Character. Leaders can also gain [Blocker] from effects (QA-OP16 and QA-OP17, card OP16-048 Buggy). The Rule Manual's "one of their Characters" wording is narrower than the CR; the CR and the Q&A govern.
- **Confidence:** official explicit.
- **Sources:** CR 10-1-4-1, 7-1-4-1-1; QA-OP05 OP05-022; QA-OP12 OP12-020; QA-OP16/QA-OP17 OP16-048.
- **Closes:** R9 (and corrects the digest's "very unlikely to come up": a printed Leader has it).
- **Engine test:** Spec: P2's turn. P1 Leader OP05-022 (5000, active) and a rested P1 Character C. P2's 6000 Character attacks C. Action: P1 blocks with the Leader. Expect: the Leader rests and becomes the target; Damage Step 6000 ≥ 5000 deals 1 damage to P1 (Life −1, Trigger offered); C is untouched; P2's "if this battles your opponent's Character" checks are false.

### RL-20 Double Attack: Trigger step, fixed damage, 1 Life

- **Question:** How do Triggers work under Double Attack? Does Double Attack win against 1 Life? What if the attacker loses Double Attack mid-damage?
- **Answer:**
  - The 0-Life check happens once, when the Damage Step determines that damage will be dealt (CR 7-1-4-1-1-1). If the defender has 1 or more Life then, the Life-to-hand step repeats once per point of damage (CR 7-1-4-1-1-3). Against 1 Life, Double Attack takes the last card and the game goes on (QA-GR "If my opponent has 1 Life card, can I win … with [Double Attack]?": no).
  - Each point is checked separately for [Trigger], and a [Trigger] from the first point resolves before the second point (QA-GR; QA-OP03, card OP03-118 Ikoku Sovereignty; QA-ST07, card ST07-015). If that [Trigger] adds a Life card, the second point takes it.
  - The amount is fixed at 2 once damage is determined. It stays 2 if the attacker leaves the field or loses Double Attack during the first point's [Trigger] (QA-GR), or because a condition changes after the first point (QA-OP03, card OP03-108 Charlotte Cracker: Life counts become equal, Double Attack and +1000 are lost, the second point still happens).
  - If Double Attack is lost **before** the Damage Step, the hit is 1 damage (QA-ST06, card ST06-004 Smoker).
  - "When you deal damage" effects activate once per attack, not once per point (QA-OP03, card OP03-043 Gaimon).
  - Double Attack is mandatory (QA-GR) and only applies to attack damage (QA-EB03, card EB03-055 Nico Robin).
- **Confidence:** official explicit.
- **Sources:** CR 7-1-4-1-1-1..7-1-4-1-1-3, 10-1-2-1, 8-6-2-1; QA-GR (four Double Attack rows); QA-OP03 OP03-043, OP03-108, OP03-118; QA-ST06 ST06-004; QA-ST07 ST07-015; QA-EB03 EB03-055.
- **Closes:** S3; PROMPT.md "Trigger step under multiple damage (Double Attack)".
- **Engine test:** Three positions. (a) P2 has 1 Life (no Trigger); P1's Double Attack Character hits the Leader. Expect: P2 Life 0, `result` null, the battle ends normally. (b) P2 has 1 Life, which is OP03-118 Ikoku Sovereignty, and 2+ cards in hand. Expect: `trigger` decision; P2 activates it, trashes 2 and adds the deck top to Life; then the second point takes that card; P2 ends at 0 Life, not lost. (c) P2 has 0 Life when the Double Attack hits. Expect: P1 wins at once.

### RL-21 Banish

- **Question:** How does Banish interact with Triggers, Double Attack and losing Banish?
- **Answer:**
  - When a Banish attacker's damage hits Life, the Life card is trashed instead of going to hand, and no [Trigger] activates (CR 10-1-3-1). It is mandatory (QA-GR). QA-OP06, card OP06-083 Oars: with Banish gained from OP06-101 O-Nami, no Trigger activates and the Life card is trashed.
  - Banish is checked when damage is dealt. QA-OP06, card OP06-002 Inazuma: if a Counter lowers Inazuma below 7000, it loses Banish and the battle is processed without it.
  - Banish applies only to damage from an attack, not to effect damage or Life moved by effects (QA-EB03, card EB03-055).
  - With Double Attack and Banish together, each of the two points trashes a Life card with no Trigger. No Q&A states the combination; it follows from CR 7-1-4-1-1-3 repeating the step to which Banish applies.
  - Because the Life card does not reach the hand, "when a Life card is added to hand" effects see nothing (CR 4-6-3-1).
- **Confidence:** official explicit; the combination with Double Attack is by inference.
- **Sources:** CR 10-1-3-1, 7-1-4-1-1-3, 4-6-3-1; QA-GR; QA-OP06 OP06-002, OP06-083; QA-EB03 EB03-055.
- **Closes:** PROMPT.md "Trigger step under multiple damage (Banish)".
- **Engine test:** Spec: P2 has 3 Life, top two are [Trigger] cards. P1's Leader has Banish (OP09-062) and a Double Attack modifier. Expect: two `LifeTrashed` events, no `trigger` decision, P2 Life 1, P2 hand unchanged. Variant (QA-OP06 OP06-002): P1's OP06-002 Inazuma at 7000 attacks; P2 uses a [Counter] Event that gives Inazuma −2000 during this battle. Expect: Inazuma loses Banish, the hit is a normal Life-to-hand, and P2 gets a `trigger` decision if the card has one.

### RL-22 Effect damage and the 0-Life loss

- **Question:** Does effect damage defeat a player at 0 Life? What about effect damage of 2 or more when Life runs out partway?
- **Answer:**
  - Effect damage at 0 Life defeats that player: "Leader takes damage when that player has 0 Life cards" (CR 1-2-1-1-1, 9-2-1-1). QA-EB03, card EB03-055 Nico Robin, "Can I win by dealing damage with this [On K.O.] when my opponent has 0 Life?": yes.
  - Moving Life by an effect is not damage and never defeats anyone (QA-ST01–04, card ST04-001 Kaido, trashing an opponent's Life at 0 Life: "nothing will happen"; QA-OP02, card OP02-001 Edward.Newgate, its [End of Your Turn] Life-to-hand at 0 Life does not make you lose).
  - X ≥ 2 effect damage: no official source covers it, and **no card in the current pool deals more than 1 damage by an effect** (only OP06-116 Reject and EB03-055, both 1). By CR 4-6-2-2 each point repeats the 1-damage step, and CR 1-2-1-1-1 makes any point taken at 0 Life a defeat. The Double Attack ruling (RL-20) is specific to battle damage (CR 7-1-4-1-1-1 checks once). Best answer: per point, as R3 proposed.
- **Confidence:** official explicit for 1 damage; unresolved (no card, no ruling) for X ≥ 2.
- **Sources:** CR 1-2-1-1-1, 4-6-2, 9-2-1-1, 7-1-4-1-1-1; QA-EB03 EB03-055; QA-ST01–04 ST04-001; QA-OP02 OP02-001.
- **Closes:** R3 (resolved for every existing card; the X ≥ 2 rule stays as the best answer).
- **Engine test:** Spec: P2's turn, P1 has 0 Life and EB03-055 in play; P2 K.O.s it with an effect. Expect: P1 gets the optional [On K.O.]; accepting deals 1 damage and P1 wins immediately (`result.winner = P1`). Second spec: P1 with 1 Life is hit by OP06-116 Reject's damage mode (it requires P1 to have exactly 1 Life): Life goes to 0, no loss.

---

## F. DON!!

### RL-23 DON!! to the cost area versus DON!! to the DON!! deck

- **Question:** When do DON!! go back to the cost area, when to the DON!! deck, and in what state? Who picks which DON!! leave?
- **Answer:**
  - **To the cost area, rested:**
    - All DON!! given to the turn player's cards return at Refresh step 6-2-3. This is mandatory (QA-GR), and they are then untapped at 6-2-4.
    - All DON!! under a card that moves to another area (K.O., bounce, rule trash, bottom-deck) go to the cost area rested (CR 6-5-5-4).
    - They lose any effects that applied to them (CR 3-1-6-1).
  - **To the DON!! deck:** only an instruction that says so moves DON!! to the DON!! deck: the DON!! −X cost (CR 8-3-1-6, 10-2-10-1) or effect text such as "your opponent returns 1 DON!! card from their field to their DON!! deck".
    - Under DON!! −X the payer may choose any DON!! on their field: given DON!! (QA-GR), active or rested ones in the cost area.
    - When an effect makes a player return DON!!, the **owner** of those DON!! chooses which (QA-OP16, card OP16-074 Magellan).
    - Effects that care about DON!! "returned to your DON!! deck" also see returns caused by the opponent (QA-ST10, card ST10-014 Wire; QA-OP02, card OP02-071 Magellan's question about the opponent's DON!!).
    - "When 2 or more DON!! are returned" needs them returned **at the same time**, by one cost or effect. Two separate DON!! −1 costs do not count (QA-OP09, card OP09-061 Monkey.D.Luffy). DON!! −2 is one return of 2 (QA-OP02, card OP02-071: +1000 once).
  - Effects cannot set given DON!! or DON!! in the DON!! deck active or rested (QA-GR).
- **Confidence:** official explicit.
- **Sources:** CR 3-1-6-1, 6-2-3, 6-2-4, 6-5-5-4, 8-3-1-6, 10-2-10-1; QA-GR (three DON!! rows); QA-OP16 OP16-074; QA-ST10 ST10-014; QA-OP02 OP02-071; QA-OP09 OP09-061.
- **Closes:** PROMPT.md "DON!! returned to the DON!! deck vs the cost area".
- **Engine test:** Spec: P1 Main Phase. P1 Character K holds 2 given DON!!; P1 cost area has 3 active and 1 rested DON!!; DON!! deck 4. (a) P2's scripted effect K.O.s K. Expect: P1 cost area gains 2 **rested** DON!!; DON!! deck unchanged. (b) P1 pays a DON!! −2 cost and picks one given DON!! from another Character and one rested cost-area DON!!. Expect: DON!! deck 6; total 10. (c) A P2 effect makes P1 return 1 DON!!: the `choose` decision belongs to P1.

### RL-24 Returned DON!! come back through the DON!! Phase; DON!! −X sources

- **Question:** Can DON!! returned by DON!! −X be placed again in later DON!! Phases? Can the Stage area be a DON!! −X source?
- **Answer:**
  - Yes. The DON!! Phase places 2 cards from the DON!! deck, or 1 if only 1 is there, or none if it is empty (CR 6-4-1..6-4-3). Nothing distinguishes a returned DON!! from one never placed. The DON!! total is fixed by the deck size: 10 normally, 6 for OP15-058 Enel (QA-OP15, card OP15-058: "you can continue to use a total of 6 DON!! cards between your field and DON!! deck"). So DON!! −X at 10 DON!! on the field costs tempo now and comes back 2 per turn. "DON!! on your field" counts DON!! in the Leader, Character, Stage and cost areas, given ones included (QA-OP01, card OP01-091 King).
  - The Stage area: QA-GR lists "Leader area, Stage area, Character area, or cost area" for DON!! −X, but CR 8-3-1-6 and 10-2-10-1 list only Leader, Character and cost areas. DON!! can be given only to a Leader or Character (CR 6-5-5-1), and no card in the pool gives DON!! to a Stage (searched the optcgapi text). The difference therefore never arises. Follow the CR, and treat "any DON!! on your field" as the source set.
- **Confidence:** official by inference (S4); R11 is unresolved in wording but moot.
- **Sources:** CR 6-4-1..6-4-3, 8-3-1-6, 10-2-10-1, 6-5-5-1; QA-OP15 OP15-058; QA-OP01 OP01-091; QA-GR DON!! −X row.
- **Closes:** S4; R11 (moot, follow the CR).
- **Engine test:** Spec: P1 has 10 DON!! on the field, DON!! deck 0, turn N Main Phase. Action: pay DON!! −2. Expect: DON!! deck 2. Advance to P1's next DON!! Phase. Expect: 2 placed, DON!! deck 0, field 10 again. Invariant: field + DON!! deck = setup DON!! size in every step.

### RL-25 [Trigger] costs nothing but its own activation cost; the card is in no area

- **Question:** Does activating a Character's or Event's [Trigger] require paying its printed cost? Where is the card while its [Trigger] resolves?
- **Answer:**
  - The printed cost is not paid. Only an activation cost written in the [Trigger] itself is paid. QA-OP04, card OP04-064 Ms. All Sunday ("[Trigger] DON!! −2: Play this card"): P1 returns 2 DON!!, going from 6 to 4, and the 5-cost Character is played with no further payment. Declining the DON!! −2 means the card is not played: you cannot pay the cost and skip the play (QA-OP04 OP04-064 and OP04-069). A [Trigger] that says "activate this card's [Main]" still needs the [Main]'s own activation cost (QA-GR, OP03-074 Top Knot).
  - While the [Trigger] resolves, the card is in no area, and it is trashed afterwards unless the effect says otherwise (CR 10-1-5-3). So it is not in the trash and cannot play itself from the trash (QA-OP14, several OP14 cards, first OP14-089: "Cards are not considered to be in the trash while their [Trigger] effects are being resolved"). It is not in Life either: QA-EB01, card EB01-059 Kingdom Come, counts total Life without the Trigger card.
  - Activating an Event's [Trigger] is not "activating an Event" (QA-GR; QA-OP15, card OP15-002 Lucy).
- **Confidence:** official by inference (printed cost: no Q&A says it outright, but OP04-064's ruling only works if it is not paid); official explicit for the rest.
- **Sources:** CR 10-1-5-1..10-1-5-3, 2-11-1, 8-5-4; QA-OP04 OP04-064, OP04-069; QA-GR; QA-OP14 OP14-089; QA-EB01 EB01-059; QA-OP15 OP15-002.
- **Closes:** R8.
- **Engine test:** Spec: P2's turn. P1 has 4 DON!! on the field (all rested) and OP04-064 on top of 2 Life. P2 deals 1 damage. Expect: `trigger` decision offered even though P1 has no active DON!!; P1 accepts and returns 2 DON!!; Ms. All Sunday enters; the DON!! −2 is the only DON!! change before her [On Play]. During resolution, the card's zone is `resolving`, and the invariant zone count holds.

---

## G. Game end and setup

### RL-26 Deck-out

- **Question:** When exactly does a player lose to an empty deck? Do looking, "draw 2" with 1 card, or self-milling count?
- **Answer:**
  - A player loses as soon as their deck has 0 cards. It is a defeat condition checked by rule processing the moment it happens, even in the middle of an effect (CR 1-2-1-1-2, 9-1-2, 9-2-1-2). Failing to draw is not what triggers it. The Rule Manual (p.7) adds that all ongoing effects are cancelled.
  - "Draw 2" with 1 card left: you draw 1, the deck is at 0, and you lose (CR 1-3-2, 9-1-2). QA-ST01–04, card ST03-005 Dracule Mihawk: its mandatory draw 2 can empty the deck, and that player loses.
  - Looking at the deck does not empty it: the cards stay in the deck while looked at (CR 11-3-2; QA-OP01, card OP01-016 Nami).
  - A cost that adds to the deck counts before the draw: QA-PROMO, card P-033 Monkey.D.Luffy, placing itself at the bottom of a 1-card deck as the cost and then drawing 1 does not lose.
  - Leaders can replace the rule: OP03-040 Nami (win instead of losing, "according to the rules") and OP15-022 Brook (lose at the end of that turn instead, even if cards are added back; QA-OP15, card OP15-022). If the Leader's effect is negated when the deck hits 0, its owner loses (QA-OP10, card OP10-098 Liberation).
- **Confidence:** official explicit.
- **Sources:** CR 1-2-1-1-2, 1-3-2, 9-1-2, 9-2-1-2, 11-3-2; Rule Manual p.7; QA-ST01–04 ST03-005; QA-OP01 OP01-016; QA-PROMO P-033; QA-OP15 OP15-022; QA-OP10 OP10-098.
- **Closes:** PROMPT.md "deck-out".
- **Engine test:** (a) P1 has 1 card in deck and ST03-005 Mihawk with 1 DON!! attacks. Expect: draw 1 → `result.winner = P2` immediately; no trash step; the battle never reaches the Block Step. (b) Deck 1, P-033 activated: bottom-deck the Character (deck 2), draw 1 (deck 1), game continues. (c) Deck 5, an effect looks at 5: game continues.

### RL-27 Simultaneous defeat and rule-processing granularity

- **Question:** If both players meet a defeat condition at the same rule-processing check, what is the result? If an effect makes both players act, does rule processing wait until both have acted?
- **Answer:**
  - All players meeting a defeat condition when rule processing starts lose (CR 9-2-1). The CR names no winner, and it has a separate "draw" outcome only for unstoppable loops (CR 11-1-1-1).
  - The TRM shows how events record it. A game must end in a win, loss or draw (TRM §5.2). In single elimination draws are not allowed, and "if there is a tie due to all players fulfilling loss conditions simultaneously, the current turn-player loses" (TRM §5.2). By implication a simultaneous loss outside single elimination is a draw.
  - Granularity: when both players must act, the turn player acts first, then the non-turn player (CR 1-3-10). Rule processing is immediate (CR 9-1-2). So the turn player's action is checked before the non-turn player acts. QA-OP05, card OP05-058 It's a Waste of Human Life!!: the turn player trashes from hand first, then the opponent, as two steps. No Q&A covers two simultaneous deck-outs.
- **Confidence:** official explicit for the CR result and the TRM single-elimination rule; official by inference for "draw" in casual play and for per-action checking.
- **Sources:** CR 1-3-10, 9-1-2, 9-2-1, 11-1-1-1; TRM §5.2 (tournament_rules_manual.pdf p.23–24); QA-OP05 OP05-058.
- **Closes:** R4 (store `bothLost`, show a draw; optional "single elimination" setting gives the turn player the loss); R5 (per-action check, turn player first).
- **Engine test:** Spec: both players have 1 card in deck; P1 (turn player) resolves a scripted "each player draws 1". Expect: P1 draws, rule processing runs, and `result.winner = P2` before P2 draws. Second spec: a single atomic step that empties both decks at once (scripted test op). Expect: `result = { draw: 'bothLost' }`; with the `singleElimination` option set, `result.winner` is the non-turn player.

### RL-28 First player's turn 1 and second player's turn 2

- **Question:** What exactly is restricted on each player's first turn?
- **Answer:**
  - First player, turn 1: no draw (CR 6-3-1); 1 DON!! instead of 2 (CR 6-4-1); no battle (CR 6-5-6-1).
  - Second player, turn 2: normal draw and 2 DON!!, but **no battle** either: "Neither player can battle on their first turn" (CR 6-5-6-1; Rule Manual p.11).
  - The first battle of the game is on turn 3.
  - Granting [Rush] does not get round it. QA-PRB01, card PRB01-001 Sanji: a Character given [Rush] on your first turn cannot attack. QA-ST32, card ST32-005 Roronoa Zoro: [Rush: Character] cannot attack Characters on your first turn either.
  - Everything else is allowed on turn 1: playing cards, giving DON!!, [Activate: Main].
  - Leader effects that look at the DON!! Phase still work. QA-OP13, card OP13-003 Gol.D.Roger: with no DON!! on the field at the start of your first turn, the DON!! placed then go to the cost area and are not given to the Leader.
  - Effects keyed to "your second turn or later" cannot be used on your first turn (QA-OP15, card OP15-058, RL-40).
- **Confidence:** official explicit.
- **Sources:** CR 6-3-1, 6-4-1, 6-5-6-1; Rule Manual p.11; QA-PRB01 PRB01-001; QA-ST32 ST32-005; QA-OP13 OP13-003; QA-OP15 OP15-058.
- **Closes:** PROMPT.md "first player's turn-1 restrictions (and second player's turn 2)".
- **Engine test:** `createGame` with a fixed seed. Turn 1 (P1): hand stays 5, cost area 1 DON!!, `legalActions` contain no `attack`. Turn 2 (P2): hand 6, cost area 2, no `attack` even for a Character played with [Rush] granted by a scripted effect; `whyNot` cites CR 6-5-6-1. Turn 3 (P1): Leader attack offered.

### RL-29 Mulligan (redraw) procedure

- **Question:** What is the exact opening-hand and redraw procedure?
- **Answer:**
  1. Each player draws 5 (CR 5-2-1-6).
  2. Starting with the player going first, each player may redraw once: return the whole hand to the deck, shuffle, draw 5 (CR 5-2-1-6, 5-2-1-6-1; Rule Manual p.7 step ❺). It is all or nothing, once per player. The second player decides after seeing whether the first player redrew.
  3. Only after both decisions does each player put Life cards from the top of the deck face-down, top card ending at the bottom of the Life pile, with nobody looking (CR 5-2-1-7, 2-9-2, 2-9-2-1; QA-GR).
  4. "At the start of the game" Leader effects (for example OP13-079 Imu's Stage search) happen **before** the opening draw (CR 5-2-1-5-1; see RL-30 for whose go first).

  In tournaments, the opponent may cut or shuffle after any shuffle (TRM §4.5; FR §8.1). The sim's seeded shuffle replaces that (R13).
- **Confidence:** official explicit.
- **Sources:** CR 5-2-1-5-1, 5-2-1-6, 5-2-1-6-1, 5-2-1-7; Rule Manual p.7; QA-GR Life-order row; TRM §4.5.
- **Closes:** PROMPT.md "mulligan procedure".
- **Engine test:** `createGame` with a seed. Expect: the first `mulligan` decision belongs to the first player, the second to the other. If P1 redraws, P1's hand is 5 new cards from a reshuffled 50, and P1 has no second `mulligan` decision. Life is placed after both decisions: Life[bottom] equals the deck top at that moment (check with a seed whose deck top is known).

### RL-30 "At the start of the game" order: CR and Q&A disagree

- **Question:** If both Leaders have "at the start of the game" effects, who resolves first?
- **Answer:** The official sources conflict.
  - CR 5-2-1-5-1 (v1.2.1, 2026-08-28): the player who **chose** first or second (the RPS winner) processes theirs first, then the other player.
  - QA-OP13 (2026-02-06), card OP13-079 Imu, "If both of us use this Leader, who plays their Stage first?": the player **going first**.

  The two agree when the chooser goes first, which is the usual choice, and disagree when the chooser goes second. The CR is newer and is the document that governs rules. Best answer: follow the CR, and log the conflict.
- **Confidence:** unresolved (conflict between official documents).
- **Sources:** CR 5-2-1-5-1; QA-OP13 OP13-079.
- **Closes:** none. New open question (see "Open questions" at the end).
- **Engine test:** Spec: both Leaders are OP13-079 Imu; P2 wins the choice and chooses to go second. Expect (CR reading): P2's start-of-game Stage search happens before P1's. A second test with P2 choosing first has both readings agree. Flag the first test `@ruling-conflict` so it is easy to flip.

---

## H. Effects engine questions

### RL-31 Replacement effects: optional or mandatory, one replacement for several events, impossible replacements

- **Question:** Is a replacement effect without "may" optional? Can one replacement cover several simultaneous events? What if the replacement cannot be carried out?
- **Answer:**
  - **Optional only when worded so.** CR 8-1-2 makes any effect without "can/may" mandatory. CR 8-1-3-4-1 ("if … you choose not to apply the replacement") describes the optional ones. Mandatory examples in the card pool:
    - OP08-045 Thatch ("trash this Character and draw 1 card instead"): no "may".
    - ST13-003 Monkey.D.Luffy: face-up Life cards go to the bottom of the deck instead of to hand, "according to the rules". QA-ST13, card ST13-003: with 1 face-up Life card, OP06-116 Reject deals 1 damage and that Life card **is** put at the bottom of the deck. The player gets no choice.
    - Every "may … instead" in the meta leaders and cards is optional, for example OP12-061 Rosinante (RL-41).
  - **One application can cover several simultaneous events** when the card's wording allows it. QA-OP17, card OP17-021 Crone Oil: two Characters would leave at once, you rest 1 card, and neither leaves. QA-OP17, card OP17-023 Nami: one rest saves two Characters K.O.'d at once. Self-replacements that substitute this card choose which event to cover. QA-OP10, card OP10-032 Tashigi, and QA-OP17, card OP17-015 Marco: the other Character is saved and the replacing Character is still K.O.'d. Two copies of a card can each apply (QA-OP12, card OP12-027 Koushirou).
  - **Impossible replacements cannot be applied** (CR 8-1-3-4-5):
    - QA-OP12, card OP12-061: a Life-to-hand replacement cannot be used with 0 Life.
    - QA-OP13, card OP13-109 Jewelry Bonney: "turn the top Life card face-up instead" cannot be used if it is already face-up (CR 1-3-2-1).
    - QA-OP07, card OP07-029 Basil Hawkins (needs an opponent's active Character) and card OP07-042 Gecko Moria (needs another of your Characters to bottom-deck): the replacement cannot be used when no such card exists.
  - A replaced cost is not "paid as written", so the effect after the colon does not resolve (CR 8-3-1-7; QA-ST13, card ST13-003 with ST13-012 Makino; QA-OP05, card OP05-087 with Kyros).
- **Confidence:** official by inference for "mandatory unless may" (consistent with the ST13-003 ruling, no Q&A states the rule in general); official explicit for the rest.
- **Sources:** CR 8-1-2, 8-1-3-4-1..8-1-3-4-7, 8-3-1-7, 1-3-2-1; QA-ST13 ST13-003; QA-OP17 OP17-021, OP17-023, OP17-015; QA-OP10 OP10-032; QA-OP12 OP12-027, OP12-061; QA-OP13 OP13-109; QA-OP07 OP07-029, OP07-042.
- **Closes:** R6.
- **Engine test:** (a) Spec: P2's OP08-045 Thatch is K.O.'d by P1's effect. Expect: no `optional` decision; Thatch is trashed (not K.O.'d, no [On K.O.] watchers fire); P2 draws 1. (b) Spec: P1 has OP17-023 Nami (active) and two {Straw Hat Crew} Characters; P2's scripted effect K.O.s both at once. Expect: one `optional` decision; accepting rests Nami and both survive. (c) P1 has 0 Life and OP12-061 as Leader; P2 K.O.s a [Trafalgar Law]. Expect: no `optional` decision; Law is K.O.'d.

### RL-32 Order of interacting permanent effects

- **Question:** CR 8-1-3-3-5 lets the turn player order interacting permanent effects. Is there an official example where order matters, and how should `derive` layer permanent effects against continuous modifiers from resolved effects?
- **Answer:** Yes. QA-OP10 answers three cases with Leader OP10-042 Usopp, whose permanent effect gives {Dressrosa} Characters "with a cost of 2 or more" +1 cost. Bartolomeo (OP04-089, base cost 3) is on the field at cost 4.
  1. The opponent's [On Play] gives it −2 cost (OP02-106 Tsuru). The permanent effect is processed first (3 → 4), then the auto effect's modifier (4 → 2). 2 still meets "2 or more", so the result is **2**.
  2. The opponent gives it −3 cost (OP07-080 Kaku). 3 → 4 → 1. Now the condition fails, Usopp's +1 is removed, and the result is **0**.
  3. The opponent's **permanent** effect (OP03-078 Issho, [DON!! x1][Your Turn] −3 cost to all) applies on the opponent's turn. The turn player's permanent effects go first: Issho takes 3 → 0. Usopp's condition is then not met, so the result is **0**.

  The procedure these answers follow:
  1. Apply permanent effects, turn player's first, then the non-turn player's, each against the running value (CR 8-1-3-3-5 I–II).
  2. Then apply continuous effects from resolved auto and activate effects.
  3. Re-check permanent effects' conditions against the result, and repeat until nothing changes (CR 8-1-3-3-5 III).

  A condition is evaluated on the value that includes its own bonus: in case 1, "2 or more" is checked against 2, which already includes Usopp's +1.
- **Confidence:** official explicit (three worked Q&As).
- **Sources:** CR 8-1-3-3-5, 8-4-6; QA-OP10, card OP10-042, three rows beginning "I have OP04-089 Bartolomeo, a card with a base cost of 3…".
- **Closes:** R14. The ARCHITECTURE §2.5 layering needs one change, see proposed decision D-3.
- **Engine test:** Three golden tests, one per Q&A, each `createFromScenario`: P1 Leader OP10-042, OP04-089 Bartolomeo in play; P2's turn. (1) P2 plays OP02-106 Tsuru targeting Bartolomeo → `derive(Bartolomeo).cost === 2`. (2) P2 plays OP07-080 Kaku (pays its trash cost) → `0`. (3) P2 has OP03-078 Issho with 1 DON!! given → `0`. Also assert a fourth, non-Q&A case for stability: no opponent effect → `4`.

### RL-33 Several base-power settings

- **Question:** If two effects set the same card's base power to different values, which wins?
- **Answer:** The higher value, whatever the order (CR 4-9-2-1; same for base cost, 4-9-2-2).
  - QA-OP17, card OP17-043 Ganzui: the Leader's base power was already set to 7000; Ganzui's [On Play] sets 6000. The 7000 stands.
  - QA-OP17, card OP17-008 Jozu: base set to 7000, then Jozu sets 8000. The result is 8000.
  - Modifiers apply on top of whichever base wins. Related: negating a card's own effects does not reset boosts that other cards gave it (QA-OP06, card OP06-083 Oars, "does this [Activate: Main] reset this Character's power to its base power?": no).
- **Confidence:** official explicit.
- **Sources:** CR 4-9-2-1, 4-9-2-2; QA-OP17 OP17-043, OP17-008; QA-OP06 OP06-083.
- **Closes:** none (confirms the ARCHITECTURE §2.5 "set-base" layer: take the maximum, not the latest).
- **Engine test:** Spec: P1 Leader (printed 5000) has a base-7000 modifier until the end of the opponent's next End Phase; P1 plays OP17-043 Ganzui. Expect: `derive(Leader).basePower === 7000`. Then add a +1000 "during this turn" modifier → power 8000.

### RL-34 [On Your Opponent's Attack] and the end-of-Attack-Step check

- **Question:** If an attacker's [When Attacking] effect moves the attack target, does the defender's [On Your Opponent's Attack] still activate before the battle ends?
- **Answer:** Yes. All Attack Step effects activate at 7-1-1-3: the attacker's first, then [On Your Opponent's Attack] "after" those (CR 10-2-16-1). The move check runs "at the end of the Attack Step" (CR 7-1-1-4), after them. [On Your Opponent's Attack] activates whatever the target is (QA-GR). An auto effect fails only if the card that met its timing has moved (CR 8-1-3-1-3), and for [On Your Opponent's Attack] that card is the attacking opponent's card, not the target. No Q&A shows this exact sequence.
- **Confidence:** official by inference.
- **Sources:** CR 7-1-1-3, 7-1-1-4, 8-1-3-1-3, 10-2-16-1; QA-GR [On Your Opponent's Attack] rows.
- **Closes:** R12.
- **Engine test:** Spec: P1 attacks P2's rested Character T with a Character whose [When Attacking] bounces up to 1 opponent Character; P2 Leader OP17-058 Kaido with 1 DON!! on the field. Action: P1 bounces T. Expect: P2 still gets Kaido's [On Your Opponent's Attack] `optional` decision; after it, the battle goes to End of the Battle (no `block` decision).

### RL-35 Giving DON!!: "cost area" in CR 6-5-5-1

- **Question:** CR 6-5-5-1 says DON!! are given to "your Leader or a Character card in the cost area". Is that a typo?
- **Answer:** Yes. A Character is a card in the Character area (CR 2-2-4-1). CR 6-2-3 returns DON!! "given to cards in your Leader area and Character area". The Rule Manual (p.11) and QA-GR ("DON!! cards given to Characters or Leaders") agree. Give only to your Leader or a Character in the Character area.
- **Confidence:** official by inference.
- **Sources:** CR 2-2-4-1, 6-2-3, 6-5-5-1; Rule Manual p.11; QA-GR.
- **Closes:** R10.
- **Engine test:** Spec: P1 Main Phase with 1 active DON!!, a Character in play and a Stage. Expect: `give` targets = {Leader, Character}; no Stage, no card in hand.

### RL-36 Tournament procedure in the sim

- **Question:** Should the sim enforce opponent cuts, time limits and extra turns?
- **Answer:** None of these are game rules. They are event procedure: TRM §4.5 (shuffle, then the opponent cuts or shuffles), §4.6 (the random method's winner chooses; in best-of-three the loser of the previous game chooses), §5.2 (time is called → turn 0 plus 3 extra turns → tiebreak order Life, deck, Characters, last Life removal); FR §8.1–8.2. The CR itself only requires a thorough shuffle (CR 5-2-1-2). For v1, the seeded shuffle stands in for shuffle-and-cut. Time limits and extra turns are an optional ranked-mode setting later.
- **Confidence:** official explicit (that these are tournament rules, not game rules).
- **Sources:** TRM §4.5, §4.6, §5.2; FR §8.1, §8.2; CR 5-2-1-2.
- **Closes:** R13 (no change).
- **Engine test:** None for v1. When the optional mode exists: a scenario with time called on P2's turn plays turns 0–3, then picks the winner by Life, then deck size, then Characters.

### RL-37 Block number: per printing or per card number

- **Question:** The official card list gives a block per printing; reprints can carry a newer block, and OP15-096 shows no block. Is Standard legality decided per printing or per card number?
- **Answer:** Per **card number**. All printings of a number share its legality.
  - The Block Number page says that when a card number's block is updated, "all past illustrations will become available" (topics/013.php, Standard Regulation section).
  - The update notice (news/blockicon-card.html, dated 2026-07-17, lists updated to 2026-08-21) groups cards **by card number** in three lists:
    1. Card numbers with a Super Parallel Rare printing (37 card numbers). These stay Standard-legal "regardless of whether they have been reprinted", and new SPRs are printed with block "X".
    2. Card numbers fixed at block ④ "regardless of reprints" (15 card numbers). They are legal 2026-04-01 to 2029-03-31.
    3. Card numbers whose block changed through a reprint: OP01-016, OP04-016, EB04-061.
  - The default block comes from the product: booster packs 1–4 are block 1, 5–8 block 2, and so on (topics/013.php). OP-15 is therefore block 4, which settles OP15-096 (the official site leaves its block blank). Starter decks, extra boosters and promos have no published formula, so their block comes from the printed icon.
  - Standard from 2026-04 to 2027-03 allows blocks ②–⑤ plus "X"; Extra allows all (topics/013.php).
- **Confidence:** official explicit for per-card-number legality and the three lists; official by inference for applying the booster formula to a blank printing.
- **Sources:** https://en.onepiece-cardgame.com/topics/013.php ; https://en.onepiece-cardgame.com/news/blockicon-card.html
- **Closes:** B4. The rule: a card number is Standard-legal if any of these is true:
  - it is on list 1 (SPR) or list 2 (fixed ④, within the dates), or
  - the newest block printed on any of its printings is within the allowed set, or
  - (for printings with a blank block) its product's block is within the allowed set.

  Banned cards and banned pairs are applied afterwards. The lists hold 37 + 15 + 3 = 55 entries, which are 53 distinct card numbers because OP01-016 and OP04-016 appear twice. That matches Track B's count of 53.
- **Engine test:** This is a deck-validator test, not an engine test. With a fixture of `standard.json`:
  - OP01-016 in any printing → legal (list 1 and list 3);
  - OP03-008 → legal (list 2);
  - an OP01 card on no list → rotated;
  - OP15-096 with `block: null` → block 4 → legal;
  - an EB04-061 printing showing an older block → legal (list 3).

---

## I. Meta leaders

Leader text below is the official card list's (`/cardlist/?series=…`, fetched 2026-10-28, cached in `.cache/track-f/cardlist-*.html` and `.cache/track-b/official/`). Two optcgapi texts differ in meaning: OP12-061's cost is **DON!! −1** (optcgapi prints "DON!! 1") and OP13-004 gives **−1000** (optcgapi prints "1000"). That is the sign loss Track B already reported.

### RL-40 OP15-058 Enel: 6-card DON!! deck

- **Question:** How do the 6-card DON!! deck and the [Activate: Main] work, including on turn 1 and if the Leader is negated?
- **Answer:**
  - "Under the rules of this game, your DON!! deck consists of 6 cards" is a permanent effect that works during deck construction and setup (CR 5-1-2-4, 8-1-3-3-3). The player prepares only 6 DON!! (QA-OP15, card OP15-058, "do I have to prepare 10?": no).
  - If the Leader's effect is negated during the game, the DON!! count does not change. The player keeps using 6 in total between the field and the DON!! deck (QA-OP15, card OP15-058, "if this Leader's effect is negated…").
  - The DON!! Phase follows the normal rules on the smaller deck: 2, then 1 if only 1 remains, then none (CR 6-4-1..6-4-3). Enel going first places 1, 2, 2, 1 and is then empty from turn 9 unless DON!! return.
  - [Activate: Main] [Once Per Turn] on the player's first turn: it can be activated but adds and gives nothing (QA-OP15, card OP15-058, "What happens if I use it on my first turn?"). From the second turn on: add up to 1 DON!! active and up to 4 more rested, then give up to 4 **rested** DON!! to one Character. The card text overrides the normal rule that only active DON!! can be given (CR 1-3-1, 6-5-5-1).
  - "Your second turn" counts the Leader owner's own turns, so it is game turn 3 when going first and game turn 4 when going second. The Q&A only speaks of "the first turn"; counting the owner's own turns follows from the word "your".
- **Confidence:** official explicit (6 cards, negation, first-turn use); official by inference (which turn is "your second").
- **Sources:** QA-OP15 OP15-058 (three rows); CR 1-3-1, 5-1-2-4, 6-4-1..6-4-3, 6-5-5-1, 8-1-3-3-3.
- **Closes:** leader need (ARCHITECTURE §2.2 already models DON!! deck size as setup data).
- **Engine test:** `createGame` with OP15-058 for P1 going first. Expect: P1's DON!! deck size 6; invariants use 6 for P1 and 10 for P2. Turn 1: activating the effect leaves the cost area at 1 DON!!. Turn 3: cost area 3 after the DON!! Phase (1+2), DON!! deck 3; activating adds 1 active and 2 rested (only 3 left), then gives up to 4 rested DON!! (the 2 just added plus 2 rested from earlier plays) to one Character. A negate-Leader scripted effect on turn 5 does not change the total of 6.

### RL-41 OP12-061 Donquixote Rosinante: Law K.O. replacement

- **Question:** How do Rosinante's K.O. replacement and its cost reduction work?
- **Answer:**
  - **Replacement:** "[Once Per Turn] If your [Trafalgar Law] would be K.O.'d, you may add 1 card from the top of your Life cards to your hand instead."
    - It is optional ("may") and once per turn (CR 8-1-3-4-1, 10-2-13).
    - It covers K.O. by battle and by effect, since both are K.O. (CR 10-2-1-1). It does not cover bounce, bottom-deck or trash.
    - It cannot be used with 0 Life (QA-OP12, card OP12-061).
    - The Life card goes to hand without a [Trigger]. It is not damage (QA-GR "Trigger only on damage"), so it cannot defeat the player.
    - A battle K.O. replaced this way is still a lost battle; "if this battles" effects still apply.
    - The name must be exactly [Trafalgar Law] (CR 2-1-2).
  - **Cost reduction:** "[Activate: Main] [Once Per Turn] DON!! −1: the next time you play [Trafalgar Law] with a cost of 4 or more from your hand during this turn, its cost is reduced by 2."
    - Playing a non-Law Character does not use it up (QA-OP12, card OP12-061, row 2).
    - Neither does a Law of cost 3 or less (row 3).
    - Neither does a Law of cost 4+ played by another effect without paying its cost (row 4).
    - It lasts until it is used or until "during this turn" effects end (CR 6-6-1-3).
- **Confidence:** official explicit (0 Life, the three cost rows); official by inference (battle K.O. coverage, no Trigger).
- **Sources:** QA-OP12 OP12-061 (four rows); CR 2-1-2, 8-1-3-4-1, 10-2-1-1, 10-2-13; QA-GR.
- **Closes:** leader need; the ARCHITECTURE §2.4 reference case.
- **Engine test:** Spec: P2's turn, P1 Leader OP12-061, 3 Life, P1 Character [Trafalgar Law] rested. P2 attacks Law and wins the battle. Expect: `optional` decision; accept → Law stays, P1 Life 2, P1 hand +1, no `trigger` decision, Once Per Turn marked. In the same turn, a second Law K.O. offers no `optional`. Variant at 0 Life: no `optional`; Law is K.O.'d. Cost test: P1's turn, activate (DON!! −1); play a 2-cost non-Law Character; then a 5-cost Law costs 3; a second Law that turn costs 5.

### RL-42 OP05-098 Enel: Life reaches 0 on the opponent's turn

- **Question:** "[Opponent's Turn] [Once Per Turn] When your number of Life cards becomes 0, add 1 card from the top of your deck to the top of your Life cards. Then, trash 1 card from your hand." How does it sequence with [Trigger], Double Attack and the opponent's effects?
- **Answer:**
  - It is an auto effect triggered during damage processing, so it waits until **all** damage processing ends (CR 8-6-2).
  - With 1 Life against Double Attack, both points are processed first. The second point finds 0 Life and does nothing, and it is not a defeat (RL-20). Then Enel adds a Life card (QA-OP05, card OP05-098, the [Double Attack] row).
  - If the last Life card has a [Trigger], the [Trigger] decision comes first and Enel activates after it (RL-02). If that [Trigger] brought Life back from 0 to 1 (OP03-118), Enel still activates, because Life did become 0 (QA-OP05, card OP05-098, Ikoku Sovereignty row).
  - With OP05-106 Shura played by its [Trigger], the Enel player orders Enel's effect and Shura's [On Play] (QA-OP05, Shura row).
  - Against the turn player's simultaneous effects, the turn player's resolve first (QA-OP11, card OP11-102 Camie: Camie's effect resolves first and does nothing because the only Life card is the one OP06-115's [Trigger] added; then Enel adds 1 and trashes 1).
  - It does not stop a hit at 0 Life from winning (CR 7-1-4-1-1-1).
  - It is once per turn, and only on the opponent's turn.
  - "Trash 1 card from your hand" is mandatory but does nothing with an empty hand (CR 1-3-2).
  - Life reaching 0 by Banish or by an effect also triggers it, because the condition is the count, not damage. That last point is by inference.
- **Confidence:** official explicit (Trigger, Double Attack, Ikoku, Shura, Camie rows); official by inference (Banish and effect routes).
- **Sources:** QA-OP05 OP05-098 (four rows); QA-OP11 OP11-102; CR 1-3-2, 7-1-4-1-1-1, 8-6-1, 8-6-2.
- **Closes:** leader need.
- **Engine test:** Spec: P2's turn; P1 Leader OP05-098 with 1 Life (no Trigger), 2 cards in hand; P2's Double Attack Character hits P1's Leader. Expect: two damage points (second does nothing), then P1's Enel resolves: Life 1, hand 2 (+1 from damage, −1 trash), `result` null. Later that turn a second Leader hit takes that Life card (Life 0, Enel's Once Per Turn already spent, nothing added), and a third hit at 0 Life ends the game with `result.winner = P2`. Camie variant per QA-OP11 as the RL-01 ordering test.

### RL-43 OP17-079 Monkey.D.Luffy: granting [Blocker]

- **Question:** "All of your Characters with a cost of 12 or more gain [Blocker]." What counts, and what happens under negation?
- **Answer:**
  - The check uses the Character's **current** cost, including modifiers, continuously (permanent effect, CR 8-1-3-3).
  - Self-cost boosts such as "This Character gains +12 cost" (OP17-085 Dorry, OP17-089 Jaguar.D.Saul) apply only on the field, not in hand, trash or deck (QA-OP17, cards OP17-085 and OP17-089).
  - If the Leader's effect is negated, the Characters lose [Blocker] for that time (QA-OP17, card OP17-079, row 1).
  - If a Character's own effects are negated, it keeps [Blocker] as long as its cost is still 12 or more. If its +12 was its own effect and is now negated, its cost drops below 12 and it loses [Blocker] (QA-OP17, card OP17-079, row 2).
  - All normal Blocker rules apply: active, not the target, one per battle (RL-18).
- **Confidence:** official explicit.
- **Sources:** QA-OP17 OP17-079 (two rows), OP17-085, OP17-089; CR 8-1-3-3, 10-1-4-1.
- **Closes:** leader need (the grant is a layer-4 ability grant re-checked after costs, ARCHITECTURE §2.5).
- **Engine test:** Spec: P2's turn; P1 Leader OP17-079; P1 has OP17-085 Dorry (printed cost below 12, +12 on field) active; P2 attacks P1's Leader. Expect: `block` decision offers Dorry. Then a scripted "negate the effects of Dorry during this turn" → Dorry's cost drops below 12 and `block` no longer offers it. Separately, "negate the Leader's effect" → no Character offered.

### RL-44 OP17-039 Rocks.D.Xebec: the revealed card

- **Question:** "[When Attacking] You may trash 1 card from your hand: Reveal 1 card from the top of your deck. If the revealed card's type includes 'Rocks Pirates', draw 2 cards." Where does the revealed card go?
- **Answer:** It stays on top of the deck while revealed. On a hit, you draw 2 cards from the top of the deck, the revealed card among them. On a miss, it goes back face-down on top (QA-OP17, card OP17-039). "Type includes" is a substring match on types (CR 2-4-3-1; QA-GR "Former XX", "XX Allies"). With exactly 1 card in deck, a hit draws it, the deck is at 0, and the player loses (RL-26). Trashing from hand is an optional cost; without it nothing is revealed (CR 8-3-1-4).
- **Confidence:** official explicit (reveal handling); official by inference (1-card deck).
- **Sources:** QA-OP17 OP17-039; CR 2-4-3-1, 8-3-1-4, 9-2-1-2; QA-GR.
- **Closes:** leader need.
- **Engine test:** Spec: P1 Leader OP17-039 attacks; deck top is a "Rocks Pirates" card X, then Y. Pay the trash cost. Expect: `CardRevealed(X)` visible to both projections; P1 hand +X +Y; then X becomes hidden in P2's view (opaque handle). Miss variant: deck top non-Rocks Z → Z still on top, and P2's `known` map shows Z on top of P1's deck until the next shuffle.

### RL-45 OP17-058 Kaido: two timings, one use per turn

- **Question:** "[When Attacking]/[On Your Opponent's Attack] [Once Per Turn] DON!! −1: Give up to 1 of your opponent's Characters −2000 power during this turn." Can it be saved for a later attack in the same turn?
- **Answer:**
  - Yes. Declining on one opponent attack keeps it available for a later attack that turn (QA-OP17, card OP17-058). [Once Per Turn] is used up only when the effect resolves (CR 10-2-13-1, 10-2-13-3), or when payment fails partway (CR 10-2-13-5).
  - It can be used once on the Kaido player's own turn (when attacking) and once on each opponent turn (when attacked).
  - DON!! −1 may return a given DON!! (QA-GR). With no DON!! on the field it cannot be paid.
  - On the opponent's turn it activates after the attacker's [When Attacking] effects (CR 10-2-16-1) and before Blocker and Counter (RL-18).
  - The −2000 lasts until the end of the turn (6-6-1-3), not just the battle.
  - It targets Characters only, never the attacking Leader.
- **Confidence:** official explicit.
- **Sources:** QA-OP17 OP17-058; CR 10-2-13-1, 10-2-13-3, 10-2-13-5, 10-2-16-1, 6-6-1-3; QA-GR.
- **Closes:** leader need.
- **Engine test:** Spec: P2's turn; P1 Leader OP17-058 with 2 DON!! on the field. P2's Character A attacks; P1 declines. Then P2's Character B attacks; P1 accepts, returns 1 DON!!, gives B −2000. Expect: B's power drops for the rest of the turn (check after the battle), P1's DON!! deck +1, and on P2's third attack no `optional` is offered.

### RL-46 OP13-001 Monkey.D.Luffy: counts DON!! before Counter

- **Question:** "[DON!! x1] [On Your Opponent's Attack] If you have 5 or less active DON!! cards, you may rest any number of your DON!! cards. For every DON!! card rested this way, this Leader or up to 1 of your 'Straw Hat Crew' type Characters gains +2000 power during this battle." When is the DON!! count checked?
- **Answer:**
  - At [On Your Opponent's Attack] in the Attack Step, before any Counter. You cannot first pay a [Counter] Event to drop to 5 active DON!! and then use the Leader (QA-OP13, card OP13-001).
  - [DON!! x1] needs a DON!! still given to the Leader on the opponent's turn. DON!! given on your own turn stay until your next Refresh, so the condition can hold (RL-13).
  - Resting DON!! here is part of the effect, not a cost, and those DON!! cannot then pay for [Counter] Events.
  - How the +2000s are distributed: the text can be read as one recipient chosen once ("this Leader or up to 1 … Character") or as a choice per DON!!. No Q&A addresses it. Best answer: one recipient for all of them.
- **Confidence:** official explicit (timing); unresolved (single recipient).
- **Sources:** QA-OP13 OP13-001; CR 6-2-3, 8-3-2-3, 10-2-16-1.
- **Closes:** leader need; one new open question (Q-T2 below).
- **Engine test:** Spec: P2's turn; P1 Leader OP13-001 with 1 given DON!!, 6 active DON!! in the cost area, a 1-cost [Counter] Event in hand. P2 attacks. Expect: at the [On Your Opponent's Attack] point the condition fails (6 > 5) and no `optional` is offered. Variant with 5 active: P1 rests 3 → Leader +6000 during this battle; then only 2 active remain for Counter Events.

### RL-47 OP14-041 Boa Hancock: draw on every opponent-turn play

- **Question:** "[Opponent's Turn] When you play a Character, draw 1 card." Is the draw optional? How many draws for several Characters played at once? What about the K.O. effect?
- **Answer:**
  - The draw is mandatory (QA-OP14, card OP14-041, row 1).
  - It triggers once per Character played, including several played at once by one effect. The ruling's example is OP16-105 Gecko Moria's [Trigger] playing 3 Characters, which draws 3 (QA-OP14, card OP14-041, row 2).
  - Characters played by a [Trigger] or by an [On Block] effect during the opponent's turn count, because they are played (CR 3-7-3).
  - Each draw can deck the player out (RL-26).
  - Second effect: "[DON!! x1] [Once Per Turn] When one of your {Amazon Lily} or {Kuja Pirates} Characters with 5000 base power or more is K.O.'d, add up to 1 card from the top of your opponent's Life cards to the owner's hand." It needs a real K.O. (battle or effect, CR 10-2-1), so bounce and rule trash do not count. It is not damage, so no [Trigger] (QA-GR). "Base power" ignores modifiers (CR 4-9-2).
- **Confidence:** official explicit (draw rows); official by inference (second effect).
- **Sources:** QA-OP14 OP14-041 (two rows); CR 3-7-3, 4-9-2, 10-2-1; QA-GR.
- **Closes:** leader need.
- **Engine test:** Spec: P2's turn; P1 Leader OP14-041; P1 takes damage and the Life card is a Character with "[Trigger] Play this card". Expect: after the [Trigger] resolves, Hancock's draw is mandatory (no `optional` decision) and P1 draws 1. Multi-play test: a scripted effect plays 3 Characters at once; 3 draws.

### RL-48 OP08-098 Kalgara: usable at 0 Life

- **Question:** "[DON!! x1] [When Attacking] Play up to 1 {Shandian Warrior} type Character card from your hand with a cost equal to or less than the number of DON!! cards on your field. If you do, add 1 card from the top of your Life cards to your hand." Can it be used at 0 Life? What counts as DON!! on the field?
- **Answer:**
  - Yes. At 0 Life the play still happens and the Life part does nothing (QA-OP08, card OP08-098).
  - "DON!! cards on your field" counts all of them: cost area active and rested, plus DON!! given to the Leader and Characters (QA-OP01, card OP01-091).
  - "If you do" needs the play to happen (CR 4-10-1). Playing 0 cards means no Life is taken.
  - Taking the Life card is not damage: no [Trigger], no defeat (QA-GR).
  - Playing into a full Character area uses the trash procedure (RL-05).
  - The played Character cannot attack that turn without [Rush] (CR 3-7-4).
- **Confidence:** official explicit (0 Life, DON!! count); official by inference (the rest).
- **Sources:** QA-OP08 OP08-098; QA-OP01 OP01-091; CR 3-7-4, 4-10-1; QA-GR.
- **Closes:** leader need.
- **Engine test:** Spec: P1 Leader OP08-098 with 1 given DON!!; 3 more DON!! in the cost area (4 on field); 0 Life; a 4-cost {Shandian Warrior} in hand. Attack. Expect: the Character is offered and enters; Life stays 0; no loss; the battle continues.

### RL-49 ST30-001 Luffy & Ace: what the two effects cover

- **Question:** "If you have a Character with 7000 base power or more, give this Leader −2000 power. [Opponent's Turn] All of your [Portgas.D.Ace] and [Monkey.D.Luffy] cards gain +3000 power." Does the Leader get the +3000? Does it get −2000 with no Characters?
- **Answer:**
  - With 0 Characters, there is no −2000 (QA-ST30, card ST30-001, row 1).
  - The [Opponent's Turn] boost cannot apply to this Leader (row 2). Its name is "Luffy & Ace", not exactly [Monkey.D.Luffy] or [Portgas.D.Ace] (CR 2-1-2).
  - The −2000 is a permanent effect. It is re-checked whenever the board changes: playing or losing a 7000-base Character switches it on and off.
  - "Base power" ignores modifiers (CR 4-9-2).
  - Throughout the ST30 deck, "6000 power" or "6000 base power" means exactly 6000, not 6000 or less (QA-ST30, rows for ST30-002 to ST30-016).
- **Confidence:** official explicit (rows 1–2); official by inference (the re-check).
- **Sources:** QA-ST30 ST30-001 (two rows) and the ST30 "exactly 6000" rows; CR 2-1-2, 4-9-2, 8-1-3-3.
- **Closes:** leader need.
- **Engine test:** Spec: P2's turn; P1 Leader ST30-001, P1 has a [Monkey.D.Luffy] Character (6000 base) and no 7000-base Character. Expect: Leader at printed power (no +3000), Luffy 9000. Add a 7000-base Character: Leader printed −2000. On P1's own turn: Luffy back to 6000 (plus any given DON!!).

### RL-50 OP09-062 Nico Robin: Banish and the DON!! ramp (no per-card Q&A)

- **Question:** How do Robin's [Banish] and her "[When Attacking] You may trash 1 card with a [Trigger] from your hand: Add up to 1 DON!! card from your DON!! deck and rest it" work?
- **Answer:** QA-OP09 has no entry for OP09-062, so this rests on the CR and on rulings for similar cards.
  - Her Leader attacks have Banish: Life cards are trashed and no [Trigger] (RL-21).
  - The trash cost can be paid even with an empty DON!! deck, and the add then does nothing (QA-OP01, card OP01-101 Sasaki, the same effect: "Can I trash a card if I have no cards in my DON!! deck?": yes; QA-GR "target is not present").
  - The added DON!! enters the cost area **rested**, not given, so it adds no power to Robin in that battle. It is untapped at the next Refresh.
  - "A card with a [Trigger]" means a card whose text has a [Trigger] (CR 2-11-2).
- **Confidence:** official by inference.
- **Sources:** CR 10-1-3-1, 2-11-2, 8-3-1-4; QA-OP01 OP01-101; QA-GR.
- **Closes:** leader need.
- **Engine test:** Spec: P1 Leader OP09-062 attacks with DON!! deck 0 and a [Trigger] card in hand. Expect: `optional` offered; paying trashes the card; DON!! count unchanged; the attack proceeds and, if it connects, P2's Life card goes to trash with no `trigger` decision.

### RL-51 OP13-004 Sabo: conditional permanent power (no per-card Q&A)

- **Question:** "If you have 4 or more Life cards, give this Leader −1000 power. [DON!! x1] If you have a Character with a cost of 8 or more, your Leader and all of your Characters gain +1000 power." When does each part apply?
- **Answer:** QA-OP13 has no entry for OP13-004. Both parts are permanent effects, valid while their conditions hold, on either player's turn (CR 8-1-3-3-2).
  - The Life condition is re-checked every time Life changes. Taking the 4th-to-3rd Life point removes the −1000 at once, including mid-battle before the next point of a Double Attack (CR 8-1-3-3).
  - The [DON!! x1] part works on the opponent's turn if a DON!! is still given to the Leader (RL-13).
  - The cost-8 check uses current cost (CR 2-7-6), so cost reductions on the opponent's side do not matter, but a "−cost" effect on Sabo's own 8-cost Character can switch it off.
- **Confidence:** official by inference.
- **Sources:** CR 2-7-6, 8-1-3-3, 8-1-3-3-2, 8-3-2-3; QA-ST01–04 ST01-013 (state-check model).
- **Closes:** leader need.
- **Engine test:** Spec: P2's turn; P1 Leader OP13-004 (printed 5000) with 1 given DON!!, 4 Life, and an 8-cost Character. Expect: Leader 5000 (−1000 +1000), Character +1000. P2 deals 1 damage: Life 3 → Leader 6000 at once. P2 gives the 8-cost Character −1 cost: both +1000s vanish.

---

## J. Status of the open questions

| ID | Status | Answer in one line | Entry |
| --- | --- | --- | --- |
| R1 | Resolved (official by inference) | Reveal → pay cost → trash 1 Character → place, as in the official Stage ruling. | RL-04 |
| R2 | Resolved (official explicit) | Effect plays into a full area use the same trash procedure; even the attacker can be trashed, which ends the battle. | RL-05 |
| R3 | Resolved for every existing card; general X ≥ 2 case unresolved | Effect damage at 0 Life defeats (EB03-055 Q&A). No card deals 2+ effect damage; keep the per-point rule as best answer. | RL-22 |
| R4 | Resolved (CR + TRM) | All players meeting a defeat condition lose; record `bothLost`, show a draw; single-elimination option: turn player loses (TRM §5.2). | RL-27 |
| R5 | Resolved (official by inference) | Check after each player's action, turn player first (CR 1-3-10, 9-1-2). | RL-27 |
| R6 | Resolved (official by inference) | Replacements are mandatory unless worded "may/can" (ST13-003 ruling); one application can cover simultaneous events if worded so. | RL-31 |
| R7 | Resolved (official explicit) | [DON!! xX] is a ≥ X state check on both turns (ST01-013 Q&A). | RL-13 |
| R8 | Resolved (official by inference) | [Trigger] never pays the printed cost, only its own activation cost (OP04-064 Q&A). | RL-25 |
| R9 | Resolved (official explicit) | A Leader can block; OP05-022 has printed [Blocker] and a Q&A. | RL-19 |
| R10 | Resolved (official by inference) | Typo: give DON!! to the Leader or a Character in the Character area. | RL-35 |
| R11 | Moot, CR followed | No card can give DON!! to a Stage, so the QA-GR "Stage area" wording never applies. | RL-24 |
| R12 | Resolved (official by inference) | [On Your Opponent's Attack] activates before the end-of-Attack-Step move check. | RL-34 |
| R13 | Unchanged | Tournament procedure is not game rules; not in v1. | RL-36 |
| R14 | Resolved (official explicit) | Permanent effects first (turn player's, then non-turn player's), then resolved continuous modifiers, then re-check conditions (three OP10-042 Usopp Q&As). | RL-32 |
| S3 | Resolved (official explicit) | Double Attack against 1 Life does not win (QA-GR). | RL-20 |
| S4 | Resolved (official by inference) | Returned DON!! are placed again by later DON!! Phases; the total stays at the setup size (OP15-058 Q&A). | RL-24 |
| B4 | Resolved (official explicit) | Legality is per card number; updated blocks make all printings usable; OP15-096 is block 4 by the booster formula. | RL-37 |

## K. Where the rules digest needs correcting

1. **Q9 (Leader with [Blocker])** says this "is very unlikely to come up with current cards". It already exists: OP05-022 Donquixote Rosinante is a Leader with printed [Blocker], and QA-OP05 rules on it (RL-19). Leaders can also gain [Blocker] from OP16-048 Buggy.
2. **Item 62 and correction 12 ("At the start of the game" order)** follow CR 5-2-1-5-1 (the chooser goes first). QA-OP13, card OP13-079 Imu, says the player **going first** goes first. The digest is faithful to the CR but should note the conflict (RL-30).
3. **Item 109 (K.O.)** paraphrases CR 10-2-1-1 as "a Character trashed … by a card effect". An effect that says "trash" a Character is **not** a K.O. (QA-OP13, card OP13-008: "trashed without being K.O.'d"). Only a K.O. instruction or a lost battle is a K.O. (RL-15).
4. **Item 40 / CR 5-1-2-4** cites "see 8-1-3-4-3" for permanent effects. That is a typo in the CR itself; permanent effects are 8-1-3-3. It changes nothing.
5. Not a digest error but worth carrying: OP12-061's cost is **DON!! −1** and OP13-004's first effect is **−1000**. The optcgapi text drops both minus signs (Section I).

## L. Open questions (new)

- **Q-T1. "At the start of the game" order.** CR 5-2-1-5-1 (2026-08-28) says the player who chose first or second processes first. QA-OP13 OP13-079 (2026-02-06) says the player going first. Best answer: follow the CR (newer, governing document) and tag the test `@ruling-conflict` (RL-30).
- **Q-T2. OP13-001 Luffy's +2000s.** Is there one recipient for all the +2000s, or a choice per rested DON!!? No Q&A. Best answer: one recipient, chosen once (RL-46).
- **Q-T3. Effect damage of 2 or more.** No card and no ruling. Best answer: each point is a separate damage event, and a point taken at 0 Life defeats (RL-22). Revisit when a card does it.
- **Q-T4. Which turn is "your second turn" (OP15-058 Enel)?** Best answer: the owner's own second turn (game turn 3 going first, 4 going second). The Q&A only covers "the first turn" (RL-40).

## M. Proposed decisions

- **D-1. Close the open questions as in Section J.** Record R1–R12, R14, S3, S4 and B4 as resolved with the one-line answers above, R13 unchanged, and Q-T1 to Q-T4 as new open questions.
- **D-2. Add two durations to the engine.** `duration` gains `untilEndOfOpponentsNextEndPhase(owner)` (expires at the owner's opponent's next End Phase, step 6-6-1-2 (2)) and `untilEndOfTurn(turnNumber)` (expires at step 6-6-1-2 of that turn; covers "your next turn" and "your opponent's next turn"). Five meta cards need the first: OP17-034, OP17-043, EB04-061, OP16-073, OP12-073 (RL-11).
- **D-3. Revise `derive` layering (ARCHITECTURE §2.5)** to match the OP10-042 Q&As:
  1. Set-base: take the **highest** value (CR 4-9-2).
  2. Permanent-effect modifiers: the turn player's, then the non-turn player's, each against the running value.
  3. Continuous modifiers from resolved effects, in timestamp order. « Set Power to 0 » belongs here: its amount is fixed when it is activated (CR 4-12-1).
  4. Grants and removals.
  5. Re-check every conditional permanent effect against the result. Drop the failures and recompute, repeating to a fixed point.

  The three Usopp cases become golden tests (RL-32). The `order` decision for permanent effects is not needed for any current card.
- **D-4. Protected Characters stay choosable.** `legalActions` should offer a "cannot be K.O.'d" Character as a K.O. target and as a "K.O. 1 of your Characters" cost pick. The pick then does nothing or the effect fizzles, as the Orlumbus and Hakuba Q&As describe (RL-16). The AI may prune these moves; the rules engine should not hide them. This is an exception to the completability lookahead in ARCHITECTURE §2.3, and it applies only when a Q&A says the choice is legal.
- **D-5. Every RL entry becomes a test.** Put them at `engine/test/rulings/RL-xx.test.ts`, named by RL ID with the Q&A row in a comment, so a changed ruling points straight at its test.
