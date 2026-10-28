# Rules digest (Phase 1, Track A)

**As of:** 2026-10-28
**Primary source:** ONE PIECE CARD GAME Comprehensive Rules, **Version 1.2.1, "Last updated: 8/28/2026"** (PDF linked from the official rules page as `rule_comprehensive.pdf?20260828`, 28 pages, PDF created 2026-08-26). This was the newest version linked from https://en.onepiece-cardgame.com/rules/ on the as-of date.
**Secondary sources:**
- Official Rule Manual, Version 1.11 (linked as `rule_manual.pdf?20230623`, dated June 23, 2023).
- Q&A General Rules (`qa_rules.pdf?20250228`, dated February 28, 2025). Cited below as **QA-GR** followed by the question in short form. This PDF has no question numbers.
- Bandai Organized Play Tournament Rules Manual (`tournament_rules_manual.pdf?20260116`; title page says "Last Updated: October 17, 2025"). Cited as **TRM §x.y**.
- Sanctioned Tournament Floor Rules Ver. 1.6.0 (`floor_rule.pdf`, "Last updated: October/10/2025"). Cited as **FR §x**.
- Rule Overview Sheet English ver. (`rule_overview_sheet_en.pdf?20221223`). The PDF is image-only. I rendered it and read it visually. Cited as **ROS**.
- Play Guide web page. Cited as **PG**.

Citation convention: **CR x-y-z** uses the Comprehensive Rules' own numbering. The CR has a few typos in its numbering ("8.4.", "8.6.3.", "2-13" with no trailing period, "3-1-2-1" with no trailing period). I cite those exactly as printed. Where this digest adds interpretation that is not literal rule text, it is marked **[engine note]**. Anything I was unsure of is in "Open questions", not in the body.

## Pages opened

Official (en.onepiece-cardgame.com):
1. https://en.onepiece-cardgame.com/rules/ (the rules index; it lists document versions and dates)
2. https://en.onepiece-cardgame.com/pdf/rule_comprehensive.pdf?20260828 (read end to end, extracted with `pdftotext -layout`)
3. https://en.onepiece-cardgame.com/pdf/rule_manual.pdf?20230623 (read end to end; icon-only keywords drop out of the text extraction)
4. https://en.onepiece-cardgame.com/pdf/qa_rules.pdf?20250228 (read end to end)
5. https://en.onepiece-cardgame.com/pdf/floor_rule.pdf (read end to end)
6. https://en.onepiece-cardgame.com/pdf/tournament_rules_manual.pdf?20260116 (read the table of contents plus §3.5, §4.5–4.18, §5.2 and §7.4.1; the other sections are administrative)
7. https://en.onepiece-cardgame.com/pdf/rule_overview_sheet_en.pdf?20221223 (image-only; rendered and read visually)
8. https://en.onepiece-cardgame.com/rules/faq/ (index of Q&A PDFs: General Rules plus one per set; the per-set Q&As are left to Track F)
9. https://en.onepiece-cardgame.com/play-guide/
10. https://en.onepiece-cardgame.com/beginners/how-to-play.php (navigation only, no rules content)
11. https://en.onepiece-cardgame.com/experienced-tcg-players/ (marketing copy, no rules beyond what is above)
12. https://en.onepiece-cardgame.com/news/restriction.html (banned and restricted list effective Oct 12, 2026)
13. https://en.onepiece-cardgame.com/rules/announcements/lang_card_rule.php (rules for using cards in different languages)
14. https://en.onepiece-cardgame.com/rules/errata_card/ (fetched to confirm it exists; per-card errata are left to Track F)
15. https://en.onepiece-cardgame.com/topics/013.php (Block Number System / Standard Regulation)

Third party:
16. (Removed 2026-10-28. A community rules page was opened here as a cross-check, but its robots.txt disallows Anthropic agents, so under the robots decision in DECISIONS.md it is not used. CR 6-5-6-1 stands on its own.)
17. One web search: "One Piece Card Game player going second attack on their first turn rule".

Every source I tried to open loaded. Nothing was blocked. I saw `/pdf/rule_buddy_event.pdf` (team-match rules) in search results but did not open it; it is out of scope.

---

## Digest

### A. Game structure and fundamentals

1. The game is for exactly two players. The CR does not support three or more. (CR 1-1-1)
2. The game ends when a player loses. The other player wins. (CR 1-2-1)
3. There are exactly two rules defeat conditions: (a) you have 0 Life cards and your Leader takes damage; (b) you have 0 cards in your deck. (CR 1-2-1-1-1, 1-2-1-1-2, 1-2-2-1, 1-2-2-2, 9-2-1-1, 9-2-1-2)
4. A player who meets a defeat condition loses at the next rule processing (CR 1-2-2). Rule processing happens immediately when its event occurs, even in the middle of other actions (CR 9-1-2). **[engine note]** Run the defeat check after every atomic state change, not only at the end of an action.
5. If several players meet a defeat condition when rule processing begins, **all of them lose** (CR 9-2-1). See Open question Q4 for how to record the result.
6. Either player may concede at any time and loses immediately (CR 1-2-3). No card affects a concession. No effect can force one, and no replacement effect can replace a loss by concession (CR 1-2-4).
7. A card effect may make a player win or lose. That happens while the effect is processed, and the game ends then (CR 1-2-5).
8. Card text takes precedence over the CR when they conflict. (CR 1-3-1)
9. Impossible actions are not performed. If an effect asks for several actions and some are impossible, perform as many as possible. (CR 1-3-2)
10. Asking a card to change into the state it is already in does nothing, and the action counts as not performed. (CR 1-3-2-1) **[engine note]** For example, resting an already-rested card has not "rested" it, which matters for costs (see 8-3-1-3).
11. An action required 0 or a negative number of times is not performed. A negative count never means the opposite action. (CR 1-3-2-2)
12. A prohibiting effect always beats an effect that requires the prohibited action. (CR 1-3-3)
13. When both players must choose at the same time, the turn player chooses first, then the non-turn player. (CR 1-3-4)
14. When both players must perform an action at the same time, the turn player performs it first, then the non-turn player. (CR 1-3-10)
15. Chosen numbers are whole numbers of 0 or more unless the text says otherwise. (CR 1-3-5) For "up to N" with no minimum stated, 0 is a legal choice. (CR 1-3-5-1, 4-8-1, 8-4-4-1; QA-GR "up to … choose 0")
16. Numbers on cards cannot become fractions. A non-power number that would go negative is treated as 0, except where information is being added or subtracted. (CR 1-3-6)
17. **Power can be negative.** (CR 1-3-6-1) A card with negative power is not trashed or moved because of it (CR 1-3-6-1-1). Examples: 6000 − 10000 = −4000; giving one DON!! to a −4000 card makes it −3000. (QA-GR "−10000 power", "1 DON!! … −4000")
18. During a calculation a cost may go negative. Outside the calculation, a negative cost is treated as 0 (CR 1-3-6-2). A cost that is already negative keeps its negative value inside further modifications (CR 1-3-6-2-1). QA-GR "cost less than 0": it is treated as 0.
19. Card effects resolve in the order the text is written, unless the text says otherwise. (CR 1-3-7, 2-8-3)
20. If effects require a card to be both rested and set active at the same time, resting wins. (CR 1-3-8)
21. "Cost" is the payment to play a card: the number in its top-left corner. "Activation cost" is the payment to activate an effect. (CR 1-3-9-1, 1-3-9-2)
22. Infinite loops: if neither player can stop the loop, the game is a **draw** (CR 11-1-1-1). If only one player can stop it, that player names a number of iterations (CR 11-1-1-2). If both can, the turn player names a number, then the non-turn player does, and the smaller number is used (CR 11-1-1-3). In both cases the loop cannot be restarted from an identical state unless a player is forced to.

### B. Card information

23. There are five card categories: Leader, Character, Event, Stage, DON!!. (CR 2-2-2)
24. In card text, "Leader" means a Leader-category card in the Leader area (CR 2-2-3-1). "Character" means a Character-category card in the Character area (CR 2-2-4-1). "Character card" means one outside the Character area (CR 2-2-4-2). In "Leader and/or Character cards", the second part means a Character in the Character area (CR 2-2-4-3). "Stage" means the Stage category (CR 2-2-6-1). "Stage card" means one outside the Stage area (CR 2-2-6-2). "Event" or "Event card" means the Event category (CR 2-2-5-1).
25. Name references: `[Name]` matches the exact card name (CR 2-1-2). `"text"` matches names that contain the text (CR 2-1-2-1). Some cards get extra names from their text, which apply everywhere, including deck construction and secret areas (CR 2-1-3).
26. There are six colors: red, green, blue, purple, black, yellow (CR 2-3-3). A multicolor card counts as every color it has (CR 2-3-5).
27. Types: a card may have several, separated by "/" (CR 2-4-2). `{Type}` matches the exact type (CR 2-4-3). `"text"` matches types that contain the text (CR 2-4-3-1); for example, "XX" matches "Former XX" and "XX Allies" (QA-GR "type including XX"). Types granted by a card's own text apply everywhere (CR 2-4-4).
28. There are six attributes: Slash, Strike, Ranged, Special, Wisdom, "?" (CR 2-5-2). A card may have several (CR 2-5-4). Only Leaders and Characters have attributes (CR 2-5-5). `<Attribute>` notation is used in text (CR 2-5-6). Attributes granted by a card's own text apply everywhere (CR 2-5-7).
29. Only Leaders and Characters have power (CR 2-6-2). Only Characters, Events and Stages have a cost (CR 2-7-5). Only Leaders have Life (CR 2-9-3). Only Character cards have a printed Counter value (CR 2-10-2).
30. If a card has several Counter values, only the highest applies. (CR 2-10-4)
31. Unless otherwise specified, text on a Leader, Character or Stage works only while that card is in the Leader, Character or Stage area respectively. (CR 2-8-2)
32. Text in parentheses is explanatory and has no game effect (CR 2-8-4, 2-8-4-1). The exception is effect text placed in parentheses for readability (CR 2-8-4-2). "No base effect" means a card with no text (CR 2-8-5). A card whose effects were invalidated is **not** a "no base effect" card (CR 8-2-2).
33. Copyright, rarity, block symbol, illustration and illustrator do not affect play. (CR 2-12-1, 2-13-1, 2-15-1, 2-16-1, 2-17-1)
34. "Base" means the number or text as printed (CR 4-9-2). If several effects set base power to different values on the same card, the highest applies (CR 4-9-2-1). The same holds for base cost (CR 4-9-2-2).
35. « Set Power to 0 » lowers power for its duration by the target's current power at the moment of activation (CR 4-12-1). If the target's power is already negative, it does nothing (CR 4-12-2).

### C. Deck construction and formats

36. Each player needs exactly 1 Leader card, a 50-card deck and a 10-card DON!! deck. (CR 5-1-2; Rule Manual p.6; FR §12 Defeat example)
37. The deck contains only Character, Event and Stage cards. (CR 5-1-2-1)
38. Only cards of a color on the Leader may be included. A card that has any color the Leader lacks cannot be included. (CR 5-1-2-2) **[engine note]** This works out to: deck card's colors ⊆ Leader's colors.
39. A deck may hold at most 4 cards with the same **card number**. (CR 2-14-2, 5-1-2-3) **[engine note]** Alternate arts share a card number and count together.
40. Card effects about deck construction are permanent effects that replace the rules above, and they apply during deck construction. (CR 5-1-2-4, 5-1-2-4-1, 5-1-2-4-2)
41. Format layer (not in the CR): for official and sanctioned tournaments there are **Banned Cards** (no copies allowed), **Banned Pairs** (Card A and Card B may not be in the same deck) and **Restricted Cards**. The list effective Oct 12, 2026: banned OP06-047, OP03-040, OP06-086, ST10-001, OP06-116, OP14-020; no restricted cards; banned pairs {OP07-115, EB04-058}, {OP11-040, OP11-067}, {OP11-040, OP08-069}. (news/restriction.html) **[engine note]** Make this data, not code.
42. Format layer: since April 1, 2026 there are two regulations. **Standard** uses only cards whose Block Number is in the allowed set; for April 2026 to March 2027 that is blocks ②–⑤ plus "X" Block cards. **Extra** allows all blocks ① onward. (topics/013.php) **[engine note]** Block legality is per card number and some cards are re-blocked. This is format data for Track B/D.
43. Tournaments require the deck to be legal when it is presented (CR 5-2-1-1). Players may not change decks after seeing the opponent's Leader (FR §7).

### D. Areas (zones) and visibility

44. The areas are: deck, DON!! deck, hand, trash, Leader area, Character area, Stage area, cost area, Life area. (CR 3-1-1) "The field" means the Leader, Character, Stage and cost areas (CR 3-1-2). Conditions like "If you have…" refer to the field unless otherwise specified (CR 3-1-2-1).
45. The number of cards in every area is public at all times. (CR 3-1-4; TRM §4.11)
46. Visibility, per area:
    - **Deck**: secret, face-down, order unknown and unchangeable (CR 3-2-2). Cards moved together leave one at a time (CR 3-2-3). Shuffling randomizes it (CR 3-2-4).
    - **DON!! deck**: an open area. It is face-down, but both players may view its contents and order and change its order (CR 3-3-2). Cards leave one at a time (CR 3-3-3).
    - **Hand**: secret. The owner may view and reorder it; the opponent cannot view it unless an effect allows (CR 3-4-2, 3-4-3).
    - **Trash**: open and face-up. Either player may view it, and the owner may reorder their own. New cards go on top (CR 3-5-2).
    - **Leader area**: open (CR 3-6-2). **Character area**: open and face-up (CR 3-7-2). **Stage area**: open and face-up (CR 3-8-2). **Cost area**: open; the owner may reorder it and choose any DON!! when paying (CR 3-9-2).
    - **Life area**: secret and face-down. Neither player may view it or change its order. Cards normally leave from the top (CR 3-10-2). A Life card added face-up by an effect counts as being in an open area (CR 3-10-2-1). Effects that look at Life work on face-up or face-down cards, and the cards return to their previous facing afterward (CR 3-10-3). A card added from the deck to Life cannot be looked at by either player (QA-GR "deck to Life … look").
47. When several cards enter one area at once, their owner chooses the order unless an effect specifies it (CR 3-1-7). If they move from an open area to a secret area and the owner chooses the order, the opponent does not get to see that order (CR 3-1-8).
48. **New-object rule:** a card that moves from the Character or Stage area to another area becomes a new card. Effects applied to it do not carry over (CR 3-1-6). A DON!! card that changes area loses every effect applied to it (CR 3-1-6-1). For example, a cost reduction is lost when the card returns to hand (QA-GR "negative cost … returned to my hand").
49. A Leader-area card that is treated as a Leader cannot be moved out of the Leader area by any effect or rule. (CR 3-6-3)
50. Moving a card from one secret area to another secret area (for example, deck to hand by a search) always requires revealing it (CR 11-2-1). A card revealed by an effect or cost becomes unrevealed again once that effect or cost has resolved (CR 11-2-2).
51. Effects that look at secret areas show the cards only to the player who controls the effect, unless the text says otherwise (CR 11-3-1). Cards stay in their area while being looked at (CR 11-3-2). If the text gives no further instruction, they go back exactly as they were (CR 11-3-3).
52. At the end of the game every card returns to its owner (CR 4-2-2). "Owner" means the original holder (CR 4-2-1-1).
53. There is no hand-size limit. (QA-GR "limit to the number of cards … in my hand")

### E. Card states

54. Cards in the Leader, Character, Stage and cost areas are either **active** (upright) or **rested** (sideways). (CR 4-4-1, 4-4-1-1, 4-4-1-2)
55. A DON!! card that has been given to a card is neither active nor rested (CR 4-4-2). Effects cannot set given DON!! or DON!! in the DON!! deck to active or rested (QA-GR "DON!! cards given … set as active or rested").
56. Characters enter the Character area active (CR 3-7-5). Stages enter active (CR 3-8-4). DON!! enter the cost area active (CR 3-9-3). Each holds unless otherwise specified.
57. A card that "cannot be rested" cannot attack, cannot activate [Blocker], cannot pay a "rest this Character" activation cost, and cannot be rested by any effect. (QA-GR, four "cannot be rested" entries)

### F. Pre-game setup (exact order)

58. Each player presents a legal deck. (CR 5-2-1-1)
59. Each player shuffles their deck thoroughly and places it face-down. (CR 5-2-1-2) In tournaments the opponent then cuts or shuffles it, and no further randomizing is allowed (TRM §4.5; FR §8.1). Decks are placed before Leaders are revealed (QA-GR "place my deck and reveal my Leader … any order": No).
60. Each player places their Leader face-up in the Leader area. (CR 5-2-1-3)
61. Rock-Paper-Scissors or any other method decides **who chooses** whether to go first or second (CR 5-2-1-4). Nobody may influence that choice (CR 5-2-1-4-1). The chooser declares first or second (CR 5-2-1-5). Tournaments: any random method, and the winner chooses (TRM §4.6). In best-of-three, the loser of the previous game chooses (TRM §4.6).
62. "At the start of the game" Leader effects are processed now. The player who chose first or second processes theirs first, in any order, then the other player (CR 5-2-1-5-1). **Conflict:** the QA-OP13 entry for OP13-079 says the player **going first** processes first. The engine follows the CR and tags the test `@ruling-conflict` (`rulings.md` RL-30, OPEN-QUESTIONS Q-T1). If those effects changed a deck, its owner shuffles it (CR 5-2-1-5-2). **[engine note]** This happens before opening hands are drawn.
63. Each player draws 5 cards. Then, **starting with the player going first**, each player may redraw once: return the whole hand to the deck, reshuffle, and draw 5 (CR 5-2-1-6, 5-2-1-6-1; Rule Manual p.7 ❺). One redraw at most, and it is all or nothing.
64. **After** redraws, each player moves cards equal to their Leader's Life value from the top of the deck to the Life area face-down, so that the deck's top card ends up at the **bottom** of the Life pile (CR 5-2-1-7, 2-9-2, 2-9-2-1; QA-GR "order in which Life cards are placed"). Nobody looks at them (CR 2-9-2).
65. The first player starts their turn. (CR 5-2-1-8)

### G. Turn structure

66. A turn is Refresh → Draw → DON!! → Main → End. (CR 6-1-1)
67. **Refresh Phase**, in this order (CR 6-2):
    1. Effects that last "until the start of your next turn" end. (CR 6-2-1)
    2. Both players' "at the start of your/your opponent's turn" effects activate. (CR 6-2-2)
    3. Every DON!! given to the turn player's Leader and Characters returns to the cost area **rested**. (CR 6-2-3) This is mandatory (QA-GR "choose not to return a DON!!": No).
    4. Every rested card in the turn player's Leader, Character, Stage and cost areas becomes active. (CR 6-2-4)
68. **Draw Phase:** the turn player draws 1. **The player going first does not draw on their first turn.** (CR 6-3-1)
69. **DON!! Phase:** place 2 DON!! from the DON!! deck face-up in the cost area (active per CR 3-9-3). **The player going first places only 1 on their first turn.** If the DON!! deck holds 1 card, place 1. If it holds 0, place none. (CR 6-4-1, 6-4-2, 6-4-3)
70. **Main Phase:** first, both players' "at the start of the Main Phase" effects activate (CR 6-5-1). Then the turn player may do any of these, in any order and as often as they like: play a card (CR 6-5-3), activate an effect (CR 6-5-4), give DON!! (CR 6-5-5), battle (CR 6-5-6). (CR 6-5-2) Declaring the end of the Main Phase moves to the End Phase. (CR 6-5-2-1)
71. **No player can battle on their own first turn.** That covers turn 1 for the first player and turn 2 for the second player. (CR 6-5-6-1 "Neither player can battle on their first turn"; Rule Manual p.11; ROS "Players also cannot attack on their first turn.")
72. **End Phase**, in this order (CR 6-6-1):
    1. Activate and resolve every [End of Your Turn] effect; the turn player picks their order (CR 6-6-1-1, 6-6-1-1-3). Then every [End of Your Opponent's Turn] effect; the non-turn player picks their order (CR 6-6-1-1-2, 6-6-1-1-4). Each of these activates and resolves only once (CR 6-6-1-1-1).
    2. Turn player's delayed "at the end of this turn"/"at the end of your turn" processing runs, and the turn player's "until the end of the turn" and "until the end of the End Phase" effects end; the turn player picks the order. Then the same for the non-turn player ("at the end of this turn"/"at the end of your opponent's turn"). (CR 6-6-1-2 (1), (2))
    3. Turn player's "during this turn" effects end, in the order they choose. Then the non-turn player's. (CR 6-6-1-3)
    4. The turn ends and the other player becomes the turn player. (CR 6-6-1-4)
73. **[engine note]** That gives three duration tiers that end at different points in the End Phase: "until end of turn / End Phase" (step 2), "during this turn" (step 3), and "during this battle" (End of the Battle, item 97). A fourth tier, "until the start of your next turn", ends at Refresh step 1.

### H. Playing cards and paying costs

74. Play order for a Character from hand: reveal it, rest active DON!! in the cost area equal to its cost, then play it (CR 2-7-2). Stage: same order (CR 2-7-4). Event: reveal, rest DON!! equal to its cost, trash it, then activate and resolve its effect (CR 2-7-3, 8-4-2).
75. In the Main Phase the turn player may play Characters and Stages, and activate Events marked [Main], from hand (CR 6-5-3-1). A card costing 0 can be played with no DON!! (QA-GR "0 cost … no DON!!").
76. "Playing" a card means paying its cost and activating it or playing it from hand (CR 4-7-1). A card that "cannot be played" cannot have its cost paid and cannot be activated or played from hand (CR 4-7-2). Placing a Character in the Character area is called playing it (CR 3-7-3), and the same goes for a Stage in the Stage area (CR 3-8-3).
77. Card activation (using an Event from hand) is different from effect activation. "When you activate an Event" refers to card activation. (CR 8-5-1..8-5-4) Activating an Event's [Trigger] does not count as activating an Event. (QA-GR "activated that Event card's [Trigger] … 'when you activate an Event'": No)
78. **Character limit:** at most 5 Characters may be in the Character area (CR 3-7-6). To play a new Character with 5 already present: reveal the new card, trash 1 of your Characters, then play the new one (CR 3-7-6-1). That trash is rule processing, and no effect can apply to it (CR 3-7-6-1-1). It is not a K.O., so [On K.O.] does not activate (QA-GR "5 Characters … [On K.O.]": No). See Open question Q1 for where the cost payment falls, and Q2 for effect-plays.
79. **Stage limit:** at most 1 Stage (CR 3-8-5). To play a new one: reveal it, trash the old Stage, play the new one (CR 3-8-5-1). Full order: reveal, pay the cost, trash the existing Stage, place the new one (QA-GR "another Stage card").
80. **Summoning sickness:** a played card cannot attack on the turn it was played, unless something says otherwise (CR 3-7-4; ROS). **[engine note]** The Leader is placed during setup (CR 5-2-1-3) and is never "played", so 3-7-4 does not restrict it; it can attack from the first turn on which battle is allowed (item 71).

### I. DON!!

81. **Giving DON!!** (Main Phase action): move 1 **active** DON!! from your cost area under your Leader or one of your Characters, still visible (CR 6-5-5-1; the CR literally says "a Character card in the cost area", see Open question Q10). Repeat as often as possible (CR 6-5-5-3).
82. Each given DON!! adds +1000 power to the card it is given to, **during your turn only** (CR 6-5-5-2; Rule Manual p.4, p.11). **[engine note]** Given DON!! stay attached through the opponent's turn and return at your next Refresh (CR 6-2-3), but they add no power then.
83. A given DON!! cannot be moved to another card during the Main Phase. (QA-GR "transfer a DON!! card already given": No)
84. When a card with given DON!! moves to another area, all its DON!! go to the cost area **rested**. (CR 6-5-5-4; Rule Manual p.14)
85. **① (number in a circle):** an activation cost of resting that many active DON!! in your cost area (CR 8-3-1-5). "You may rest 1 of your DON!! cards:" is the same as ① (QA-GR "You may rest 1 of your DON!! cards").
86. **DON!! −X:** an activation cost of choosing X DON!! in total from your Leader area, Character area and cost area and returning them to the **DON!! deck** (CR 8-3-1-6, 10-2-10-1). Given DON!! qualify (QA-GR "[DON!! −○:] … already been given": Yes). Any cost-area DON!! qualify, active or rested (Rule Manual p.15 glossary). **[engine note]** DON!! returned to the DON!! deck can be placed again in later DON!! Phases, so the cost area can shrink and refill. The 10-card total is conserved.
87. **[DON!! xX]:** a condition met when this card has X or more DON!! given to it (CR 8-3-2-3, 10-2-9-1). It still works with more than X (QA-GR "[DON!! x○] … more than the specified number": Yes). If the effect also has an activation timing, the DON!! condition must hold at that moment (CR 8-3-2-3).

### J. Battle

88. A battle can only start in the turn player's Main Phase, outside another battle (CR 7-1, 6-5-6). The attacker is the active Leader or one active Character, rested as part of the declaration. The target is the opponent's Leader or **one rested** Character (the CR puts no state requirement on the Leader target). (CR 7-1, 7-1-1-1, 7-1-1-2) **[engine note]** The CR sets no per-turn limit on attacks. Any active, eligible card may attack, and a card set active again may attack again (CR 6-5-2 "as many times as you wish").
89. **Attack Step:** (1) declare the attack by resting the attacker; (2) choose the target; (3) [When Attacking], "when you attack", [On Your Opponent's Attack] and 「When Attacked」 effects activate (CR 7-1-1-1..7-1-1-3). [On Your Opponent's Attack] activates **after** the attacker's [When Attacking] and other Attack Step effects (CR 10-2-16-1; QA-GR "Which activates first": the attacker's [When Attacking]). [On Your Opponent's Attack] activates whatever the target is (QA-GR "targets a different card": Yes).
90. At the end of the Attack Step, if the attacker or the target has moved areas, skip straight to End of the Battle (CR 7-1-1-4). The same check runs at the end of the Block Step (CR 7-1-2-3) and the Counter Step (CR 7-1-3-1-3). (QA-GR "moved to a different area during the Attack Step, Block Step, or Counter Step")
91. **Block Step:** the defender may activate **one** [Blocker] in this battle, at most (CR 7-1-2-1; QA-GR "2 or more [Blocker]": No). Activating it is optional (QA-GR "do I have to activate that [Blocker]": No). The Blocker rests and takes the place of the card being attacked (CR 10-1-4-1). The [Blocker] must be on one of the defender's **other** cards, not the card being attacked (CR 10-1-4-1 "one of your other cards is being attacked"; QA-GR "[Blocker] of a Character being attacked": No). A rested Character cannot block (QA-GR "[Blocker] of a rested Character": No). When a Blocker activates, [On Block] and "when you block" effects activate (CR 7-1-2-2, 10-2-15-1).
92. [Unblockable]: the opponent cannot activate [Blocker] against this attacker. (CR 10-1-7-1)
93. **Counter Step:** the **defender** may do the following in any order and as often as they like (CR 7-1-3-1):
    - **Character Counter:** trash a Character card with a Counter value **from hand** to give their Leader or 1 Character +Counter power **for this battle** (CR 7-1-3-1-1). It costs nothing (QA-GR "pay a cost to use a Character's Counter": No). It may target a card that is not being attacked, and the boost still ends with the battle (QA-GR "card not being attacked": Yes). Counters on Characters in play cannot be used (QA-GR "Counters of Characters on the field": No). It may boost a Blocker (QA-GR "[Blocker] … use a Counter": Yes).
    - **Event [Counter]:** pay the Event's cost, trash it, and activate its [Counter] effect (CR 7-1-3-1-2). This is allowed only during the opponent's Counter Step (CR 10-2-4-1; QA-GR "[Counter] effect during my Main Phase": No). Other effects may grant [Counter] activation (CR 10-2-4-1-1), but an effect cannot activate [Counter] unless it says "activate [Counter]" (CR 10-2-4-1-2).
94. **Damage Step:** compare powers once. If attacker power **≥** defender power, the attacker wins (CR 7-1-4-1). Ties and negative values follow this rule as written: −2000 vs −2000 is a win for the attacker, and 0 vs 0 K.O.s the defender (QA-GR "−2000 power", "0 power").
    - Target is a **Leader** and the attacker wins: 1 damage (CR 7-1-4-1-1). If the defender has **0 Life at the moment damage is determined**, the attacker **wins the game** (CR 7-1-4-1-1-1). Otherwise the defender adds the top Life card to hand, or reveals it and activates its [Trigger] instead (CR 7-1-4-1-1-2). With 2 or more damage (for example [Double Attack]), repeat the "1 or more Life" step that many times (CR 7-1-4-1-1-3).
    - Target is a **Character** and the attacker wins: it is K.O.'d (CR 7-1-4-1-2). Go to End of the Battle.
    - Attacker power < defender power: nothing happens. Go to End of the Battle (CR 7-1-4-2).
95. [Double Attack]: damage to the opponent's Leader from this card's attack is 2 instead of 1 (CR 10-1-2-1). It is mandatory (QA-GR "choose to deal 1 damage": No). The amount is fixed at 2 once determined, even if the attacker loses Double Attack or leaves the field during the first damage's Trigger (QA-GR "loses its [Double Attack] or leaves the field"). Against a defender with **1 Life**, Double Attack does **not** win: Life goes to 0 and the game continues (QA-GR "1 Life card … [Double Attack] … win": No; consistent with CR 7-1-4-1-1-1 and 7-1-4-1-1-3). A [Trigger] from the first damage resolves before the second damage is checked (QA-GR "[Trigger] … before the second damage").
96. [Banish]: when this card's attack deals damage to the opponent Leader's Life, the Life card is **trashed** instead of added to hand, and its [Trigger] does not activate (CR 10-1-3-1). It is mandatory (QA-GR "choose not to trash a Life card … [Banish]": No).
97. **End of the Battle**, in this order (CR 7-1-5): the battle ends (7-1-5-1); both players' "at the end of the/this battle" and "if this … battles" effects activate (7-1-5-2); the turn player's "during this battle" effects end (7-1-5-3); the non-turn player's "during this battle" effects end (7-1-5-4); return to the Main Phase (7-1-5-5).
98. [Rush]: a Character may attack on the turn it is played. (CR 10-1-1-1)
99. [Rush: Character]: a Character may attack the opponent's **Characters** (not the Leader) on the turn it is played. (CR 10-1-6-1)

### K. Damage, Life and [Trigger]

100. Damage processing (from any source): for each point of damage, the damaged player moves 1 card from the top of their Life to their hand. X = 0 does nothing. (CR 4-6-1, 4-6-2, 4-6-2-1, 4-6-2-2)
101. When a Life card with [Trigger] goes to hand during damage processing, the player may activate the [Trigger] (CR 4-6-3). To do so, they reveal it and activate it **instead of** adding it to hand (CR 10-1-5-1, 2-11-1). If they decline, the card goes to hand unrevealed (CR 10-1-5-2; QA-GR "add a card to my hand without activating its [Trigger]": Yes). Damage processing pauses while the [Trigger] resolves (CR 8-6-2-1).
102. While its [Trigger] is being activated, the card is in **no area**. Afterward it is trashed unless the effect says otherwise. (CR 10-1-5-3)
103. If an effect or replacement effect stops the Life card from going to hand, its [Trigger] cannot activate. (CR 4-6-3-1)
104. [Trigger] can only activate when damage is taken. It cannot activate when an effect such as "add/trash 1 card from the top of your Life" moves the card. (QA-GR "Add 1 card from the top of your Life … [Trigger]": No) A face-up Life card's [Trigger] can activate (QA-GR "Trigger of a card placed face-up": Yes).
105. If a [Trigger] says "activate this card's [Main] effect", the [Main]'s own activation cost (for example DON!! −2) must still be paid (QA-GR "OP03-074 … without paying its DON!! −2": No). [Trigger] may allow [Main] or [Counter] effects outside their usual timing (CR 10-2-3-1-1, 10-2-4-1-1).
106. Other effects whose activation timing occurs during damage processing wait until **all** damage processing has finished. (CR 8-6-2)
107. "Top or bottom of Life" means the very top or very bottom card. A card placed there goes face-down unless told otherwise. If Life is empty, the card simply goes into the Life area. (QA-GR two "top or bottom of the Life cards" entries)
108. A Life card looked at by an effect that says "place it at the top or bottom of the Life cards" must return to its **owner's** Life. (QA-GR two "Advanced Rules" entries)

### L. K.O. and trash

109. "K.O." means a Character trashed by losing a battle or by a card effect (CR 10-2-1-1). As an instruction, it means putting the Character from the Character area into its **owner's** trash (CR 10-2-1-2). [On K.O.] and "cannot be K.O.'d" effects apply only to K.O. by an effect or by battle. Any other trashing is not a K.O. (CR 10-2-1-3). That includes an effect that tells you to "trash" a Character: it is not a K.O. (QA-OP13, card OP13-008; `rulings.md`)
110. [On K.O.]: when the card is K.O.'d on the field, check its conditions and activate it **on the field**. Then the card is trashed and the effect resolves while it is in the trash (CR 10-2-17-1, 10-2-17-2). It activates only for the card that was K.O.'d itself, not when that card K.O.s something (QA-GR "Does [On K.O.] mean…").
111. "Trash" as a keyword means choosing a card from hand and placing it in the trash. (CR 10-2-14-1) "Remove" means moving a card from its area to another area. (CR 4-11-2)

### M. Effects: categories, costs, conditions

112. An effect is the instruction in a card's text together with its cost (CR 8-1-1). An effect with "can" or "may" is optional. Without those words, it must be activated and carried out as far as possible (CR 8-1-2). An [On Play] with no cost must be activated. If it has a cost, the player may decline to pay and the card is still played (QA-GR "play a Character card with an [On Play] effect without activating").
113. There are four categories: auto, activate, permanent, replacement. (CR 8-1-3)
114. **Auto effects** activate automatically, once per occurrence of their event (CR 8-1-3-1). Markers include [On Play], [When Attacking], [On Block], [On K.O.], [End of Your Turn], [End of Your Opponent's Turn], and any "when…"/"on…" wording (CR 8-1-3-1-1). An auto effect does not activate if the card that met its timing has moved areas before activation (CR 8-1-3-1-3). An auto effect triggered by a card moving activates only if the destination is an **open** area (CR 8-4-5).
115. **Activate effects** are declared by the turn player in their Main Phase. Markers: [Activate: Main], [Main] (CR 8-1-3-2, 8-1-3-2-1, 6-5-4-1). Neither [Activate: Main] nor [Main] can be used during a battle (CR 10-2-2-1, 10-2-3-1). [Main] appears only on Events (CR 10-2-3-1).
116. **Permanent effects** apply continuously while valid (CR 8-1-3-3). Ones that say "according to/under the rules" also work from secret areas (CR 8-1-3-3-3). If permanent effects change each other's impact: the turn player applies theirs in any order, then the non-turn player, repeating until nothing changes (CR 8-1-3-3-5).
117. **Replacement effects** use the word "instead" (CR 8-1-3-4). If you choose not to apply an available replacement, it does not resolve (CR 8-1-3-4-1). When several could apply, the order is: the replacement from the card that generated the situation first, then the turn player's in the order they choose, then the non-turn player's (CR 8-1-3-4-2). The same replacement cannot apply to the same event twice (CR 8-1-3-4-3). A replacement replaces the whole indicated part, even mid-resolution, and the remaining text then continues (CR 8-1-3-4-4, 8-1-3-4-4-1). An impossible replacement cannot be applied (CR 8-1-3-4-5). Replacements may chain (CR 8-1-3-4-6). The replaced part counts as an effect activated by the replacement's owner (CR 8-1-3-4-7).
118. One-shot effects act once on resolution. Continuous effects last for a stated duration. (CR 8-1-4-1, 8-1-4-2)
119. Invalidation: an invalidated effect does nothing, makes no choices, and its activation cost cannot be paid (CR 8-2-1-1). A "valid only if…" effect is invalid while its condition fails (CR 8-2-1-2). Auto and activate effects that have already resolved are not undone by later invalidation (CR 8-2-3). New effects gained after invalidation stay valid unless stated otherwise (CR 8-2-4). A "during this turn" effect from an already-resolved ability survives its source leaving the field (QA-GR "'during this turn' … moved to another area": Yes).
120. **Activation cost** is the text before the colon (CR 8-3-1). Several cost actions are paid in text order (CR 8-3-1-1). Costs added by other effects are paid in their resolution order (CR 8-3-1-2). **If any part cannot be paid, none of it can be** (CR 8-3-1-3). If you become unable to pay partway through, pay as much as possible, and the effect after the colon does not resolve (CR 8-3-1-3-1). Costs worded "can/may" are optional, but if you skip them the effect does not activate (CR 8-3-1-4). A cost may be replaced by a replacement process. If the cost is not paid as written, the effect does not resolve (CR 8-3-1-7).
121. **Conditions:** [DON!! xX], [Your Turn] and [Opponent's Turn] are conditions (CR 8-3-2). All conditions must hold, including ones added by other effects (CR 8-3-2-1, 8-3-2-2). [Your Turn] holds during your turn (CR 8-3-2-4, 10-2-11-1). [Opponent's Turn] holds during your opponent's turn (CR 8-3-2-5, 10-2-12-1). Text after a failed "if…" does not resolve (CR 8-3-3).
122. "If" and "Then": when an "if" clause cannot be resolved, the clause that follows it cannot be resolved either (CR 4-10-1). When a "then" clause cannot be resolved, the following clause still can, unless a preceding "if" had already failed (CR 4-10-2).
123. **Activation procedure** (CR 8-4-1): (1) check conditions; (2) specify the effect, revealing the card if it is in hand; (3) determine and pay every activation cost; (4) activate; (5) resolve. Event: trash it, then carry out the effect (CR 8-4-2). Field card: carry out the effect (CR 8-4-3). Effects are evaluated against the continuous and permanent effects in place at that moment (CR 8-4-6).
124. Choices ("choose", "select", "up to") are made **during resolution** (CR 8-4-4). If a number is given, choose as many as possible up to it; "up to" allows 0 (CR 8-4-4-1). When choosing hidden cards from a secret area by a requirement, the player may choose none even if a valid card is present (CR 8-4-4-2). With no target stated, the effect applies to its source card or its controller (CR 8-4-4-3). When choosing from the deck, look at the card faces (CR 8-4-4-4). An effect with no legal target may still be activated and does nothing (QA-GR "target is not present": Yes).
125. "Draw X": X = 0 does nothing, otherwise draw X times (CR 4-5-3). "Draw up to X" is a loop: you may stop before each single draw (CR 4-5-4, 4-5-4-1..4-5-4-3). Drawing is never revealed (CR 4-5-1).
126. **[Once Per Turn]:** activates and resolves once per turn (CR 10-2-13-1), counted per card (CR 10-2-13-2; QA-GR "same name with [Once Per Turn]": Yes). After resolving it cannot activate again and its cost cannot be paid again that turn (CR 10-2-13-3). A card that leaves and comes back is a new card and gets a fresh use (CR 10-2-13-4). If payment fails partway, the use is still spent (CR 10-2-13-5).

### N. Order of simultaneous effects

127. When both players' effects trigger together, the **turn player resolves theirs first** (CR 8-6-1; Rule Manual p.14: the turn player resolves all of theirs, then the other player). If resolving one of the turn player's effects triggers another turn-player effect, the non-turn player's already-pending effects resolve before that new one (CR 8-6-1).
128. The turn player orders their own simultaneous effects (Rule Manual p.14 "Effect Activation Order"). If A and B are pending, and resolving A triggers C, then C resolves **after** B (CR 8-6-1-1).
129. An effect triggered by activating a card or an effect waits until the earlier activation has finished resolving. (CR 8.6.3)
130. Effects triggered during damage processing wait until all damage processing is done. [Trigger] is the exception: it pauses damage processing (CR 8-6-2, 8-6-2-1).

### O. Keyword and timing-word index (complete list as defined in CR v1.2.1)

131. Keyword effects (CR 10-1): [Rush] 10-1-1; [Double Attack] 10-1-2; [Banish] 10-1-3; [Blocker] 10-1-4; [Trigger] 10-1-5; [Rush: Character] 10-1-6; [Unblockable] 10-1-7.
132. Keywords (CR 10-2): K.O. 10-2-1; [Activate: Main] 10-2-2; [Main] 10-2-3; [Counter] 10-2-4 (Event); [When Attacking] 10-2-5; [On Play] 10-2-6; [End of Your Turn] 10-2-7; [End of Your Opponent's Turn] 10-2-8; [DON!! xX] 10-2-9; DON!! −X 10-2-10; [Your Turn] 10-2-11; [Opponent's Turn] 10-2-12; [Once Per Turn] 10-2-13; Trash 10-2-14; [On Block] 10-2-15; [On Your Opponent's Attack] 10-2-16; [On K.O.] 10-2-17.
133. Other timing phrases the CR uses outside section 10:
    - "At the start of the game" (CR 5-2-1-5-1)
    - "until the start of your next turn" (CR 6-2-1)
    - "at the start of your/your opponent's turn" (CR 6-2-2)
    - "at the start of the Main Phase" (CR 6-5-1)
    - "at the end of this turn / your turn / your opponent's turn" (CR 6-6-1-2)
    - "until the end of the turn" (CR 6-6-1-2)
    - "until the end of the End Phase" (CR 6-6-1-2)
    - "during this turn" (CR 6-6-1-3)
    - "when you attack" and 「When Attacked」 (CR 7-1-1-3)
    - "when you block" (CR 7-1-2-2)
    - "at the end of the/this battle" and "if this … battles" (CR 7-1-5-2)
    - "during this battle" (CR 7-1-5-3)
    - "when you activate an Event" (CR 8-5-4)
    - "instead" (CR 8-1-3-4)
    - « Set Power to 0 » (CR 4-12)
    - "base" (CR 4-9)
    - "up to" (CR 4-8)
    - "if" / "then" (CR 4-10)
    - "remove" (CR 4-11)
    - Counter symbol (CR 2-10)
    - ① (CR 8-3-1-5)

### P. Tournament procedure relevant to the sim (optional modes)

134. The recommended sanctioned format is best-of-one: 35 minutes plus 5 minutes extra (FR §8.2). Bandai OP standard qualifying rounds are 30 + 5. Top cut is best-of-three, 60 + 10 (TRM §3.5).
135. When time runs out mid-game, the active player's current turn is turn 0, followed by 3 more turns. If there is still no winner, tiebreaks in order: most Life; most deck cards; most Characters; the player who last removed a card from their Life area. (TRM §5.2; FR §8.2 has the same order but says "last drew from their Life area".) In single elimination, a simultaneous loss counts as a loss for the **turn player** (TRM §5.2).
136. Public knowledge: hand size, deck and DON!! deck sizes, the number and names of cards in the trash, Life count, and which cards were played this turn. Private: deck contents, Life contents, hand contents. (TRM §4.11, §4.12)
137. A missed mandatory auto effect is resolved later. A missed optional ("you can") effect counts as declined. (TRM §7.4.1 item 2) **[engine note]** This does not apply to the sim, which never misses an effect, but it confirms the optional/mandatory split.

---

## Corrections to PROMPT.md assumptions

1. **Attack restriction applies to both players.** PROMPT.md "Setup" mentions only the first player's turn-one attack restriction. CR 6-5-6-1: "Neither player can battle on their first turn." The second player cannot attack on turn 2 either. The first possible battle is turn 3. (Also in the Rule Manual p.11 and ROS.)
2. **Deck-out is not "failing to draw".** PROMPT.md "Rules processing" says "loss … on failing to draw". The CR defeat condition is **having 0 cards in your deck** (CR 1-2-1-1-2, 9-2-1-2), checked immediately by rule processing (CR 9-1-2). Drawing, milling or otherwise removing your last deck card loses the game at that moment, without waiting for a later draw.
3. **The 6th-Character rule is not "trash down to five when a sixth would enter".** CR 3-7-6-1: with 5 Characters in play, you reveal the new card, **trash 1 first**, then play the new card. It is rule processing with no effects applied (CR 3-7-6-1-1). It is not a K.O. and does not trigger [On K.O.] (QA-GR). The board never holds 6.
4. **Power may be negative.** The invariant "power never negative in a way the rules forbid" should be stated as: power has no floor (CR 1-3-6-1, 1-3-6-1-1), and a cost is floored at 0 except inside a calculation (CR 1-3-6-2).
5. **The zone-count invariant (61 per player) needs a "resolving" pseudo-zone.** A Life card whose [Trigger] is being activated "does not belong in any area" (CR 10-1-5-3). DON!! −X moves DON!! back into the DON!! deck (CR 8-3-1-6), which is fine because the total is conserved.
6. **Refresh order is more specific.** First, "until the start of your next turn" effects end. Then start-of-turn effects activate. Then given DON!! return **rested**. Then all rested cards are set active. (CR 6-2-1..6-2-4) The 2023 Rule Manual's shorthand "return … in an active state" has the same net result.
7. **End Phase has three ordered expiry tiers, not just "power modifiers expire".** See CR 6-6-1-1..6-6-1-4 and digest item 72. Battle-duration effects expire at End of the Battle, turn player's first (CR 7-1-5-3, 7-1-5-4).
8. **Counter Step detail.** Character Counters are free and come from **hand** only. Event [Counter] cards require paying their cost (CR 7-1-3-1-1, 7-1-3-1-2; QA-GR). Only the defending player acts in the Counter Step.
9. **Double Attack does not "take two life" in every case.** Against 1 Life it takes 1 and does not win (QA-GR). The 0-Life check happens once, when damage is determined (CR 7-1-4-1-1-1).
10. **Simultaneous loss.** The CR says every player meeting a defeat condition loses (CR 9-2-1). The CR names no winner. Only the tournament manual adds "turn player loses" for single elimination (TRM §5.2). Infinite loops nobody can stop are a **draw** (CR 11-1-1-1). The engine therefore needs a draw result.
11. **The keyword list in PROMPT.md is incomplete.** Missing: [Rush: Character], [Unblockable], [On Your Opponent's Attack], [End of Your Opponent's Turn], [Main], [Counter] (Event keyword, separate from the Character Counter value), [Your Turn], [Opponent's Turn], DON!! −X, Trash, 「When Attacked」, plus « Set Power to 0 » and "At the start of the game" (see digest items 131–133).
12. **Setup order.** "At the start of the game" Leader effects run after the first/second decision and **before** opening hands (CR 5-2-1-5-1). The redraw order starts with the player going first (CR 5-2-1-6). Life is placed **after** redraws, with the deck's top card at the bottom of Life (CR 5-2-1-7). Also, the RPS winner **chooses** first or second (CR 5-2-1-4, 5-2-1-5). The winner is not automatically first.
13. **The 4-copy limit is per card number, not "card ID".** If the data model gives alt arts separate IDs, the limit must group by card number (CR 5-1-2-3). Banned cards, banned pairs, restricted cards and Standard/Extra block legality are an extra format layer outside the CR (restriction.html, topics/013.php).
14. **DON!! power applies only on your turn** (CR 6-5-5-2). DON!! stay given through the opponent's turn and still count for [DON!! xX] conditions (CR 8-3-2-3). This is important for opponent-turn effects with a DON!! condition.

## Open questions

Each entry gives my best answer, then the competing reading.

- **Q1. Cost payment order when playing into a full board.** CR 2-7-2 says reveal → rest DON!! → play. CR 3-7-6-1 says reveal → trash 1 → play. *Best answer:* reveal → pay cost → trash 1 Character → place, by analogy with the official Stage Q&A ("reveal…, pay the cost, trash the card already in the Stage area, then place"). *Competing reading:* trash before paying. This only matters for effects that check board state while costs are paid.
- **Q2. Does the 5-Character procedure apply when an effect plays a Character** (for example "play from trash")? *Best answer:* yes. CR 3-7-3 defines any placement as "playing", and CR 3-7-6 caps the area at 5. *Competing reading:* effect-plays fail when the area is full (CR 1-3-2 impossible action). Track F should look for a ruling.
- **Q3. Effect damage of X ≥ 2 when Life runs out partway.** *Best answer:* effect damage follows CR 4-6-2 together with 9-2-1-1. Each point is a separate "Leader takes damage" event, so a point taken at 0 Life is a defeat. Battle damage instead follows CR 7-1-4-1-1-1/-3 and the Double Attack Q&A, so it never defeats a player who had Life when damage was determined. *Competing reading:* the Double Attack Q&A's logic ("damage is fixed") applies to all multi-point damage, with only one 0-Life check at the start. Track F should confirm.
- **Q4. How to record a simultaneous loss.** *Best answer:* result = `draw` (both lost) in casual play, with an optional "tournament single-elimination" setting where the turn player loses (TRM §5.2). *Competing reading:* the CR's "all of those players lose" is a distinct "double loss" result. Store it as `bothLost` and render it as a draw.
- **Q5. Granularity of rule processing when both players act "simultaneously"** (for example both draw the last card of their deck). CR 1-3-10 says the turn player acts first, and CR 9-1-2 says rule processing is immediate. *Best answer:* check after each player's atomic action, so the turn player can lose before the non-turn player draws. *Competing reading:* the whole simultaneous instruction is one event, so both lose together (CR 9-2-1, 1-2-2 "at the next time of rule processing"). The Rule Manual p.7 note ("all ongoing effects will be canceled") supports immediacy.
- **Q6. Are replacement effects without "may/can" optional?** CR 8-1-3-4-1 speaks of "choosing not to apply" an available replacement. CR 8-1-2 says effects without "may/can" are mandatory. *Best answer:* mandatory unless worded with "may/can"; read 8-1-3-4-1 as covering optional replacements. *Competing reading:* every replacement is optional. Track E/F should check card wordings.
- **Q7. [DON!! xX] wording.** CR 10-2-9-1 describes the condition as a card "that originally has no or less than X … and is given DON!! cards such that the number … is X or higher". That could be read as a transition, but CR 8-3-2-3 and QA-GR both treat it as a plain state check (≥ X). *Best answer:* a state check, valid on either player's turn unless the card also has [Your Turn].
- **Q8. Does activating a [Trigger] Event or Character require paying its printed cost?** The CR prescribes no cost payment for [Trigger] (CR 10-1-5-1, 2-11-1). Only activation costs inside the effect apply (QA-GR Top Knot). *Best answer:* the printed cost is not paid. *Competing reading:* none in the official text. Listed only because the CR never says it outright.
- **Q9. Can a Leader that somehow has [Blocker] block?** CR 10-1-4-1 says "this card" and "one of your other cards". The Rule Manual says "one of their Characters". *Best answer:* the CR wording allows any card of yours that has [Blocker] except the attack target. **Correction (Track F):** this does come up. OP05-022 is a Leader with printed [Blocker], and its official Q&A confirms that it can block (`rulings.md`).
- **Q10. CR 6-5-5-1 typo.** It says "underneath your Leader or a Character card in the cost area". *Best answer:* this means a Character in the **Character area** (Rule Manual p.11; CR 6-2-3 refers to DON!! "given to cards in your Leader area and Character area").
- **Q11. QA-GR lists the Stage area as a source for DON!! −X**, but CR 8-3-1-6 lists only the Leader, Character and cost areas. *Best answer:* follow the CR. DON!! can only be given to Leaders and Characters (CR 6-5-5-1), so a Stage never holds DON!! unless a future effect allows it.
- **Q12. The defender's [On Your Opponent's Attack] versus 7-1-1-4.** If a [When Attacking] effect moves the target, does [On Your Opponent's Attack] still activate before the end-of-step check? *Best answer:* yes. All Attack Step triggers activate (CR 7-1-1-3), then the check runs "at the end of the Attack Step" (CR 7-1-1-4).
- **Q13. Should the sim enforce tournament procedure** (opponent cuts the deck, time limits, extra turns)? *Best answer:* no for v1. The seeded RNG stands in for shuffling and cutting. Time-limit tiebreaks (TRM §5.2) could be an optional ranked-mode setting later.

## Engine test checklist

One line per rule; each needs at least one test.

- CR 1-2-1-1-1 / 9-2-1-1: player at 0 Life whose Leader takes damage loses.
- CR 1-2-1-1-2 / 9-2-1-2: player whose deck reaches 0 cards loses immediately, including by drawing their last card.
- CR 1-2-3 / 1-2-4: concession ends the game at once, and no effect or replacement can prevent it.
- CR 1-2-5: an effect-driven win or loss ends the game during resolution.
- CR 9-1-2: defeat is checked mid-resolution (deck hits 0 partway through a multi-draw).
- CR 9-2-1: both players meeting defeat at the same check → both lose (draw result).
- CR 1-3-2: partial impossibility does as much as possible (for example "draw 2" with 1 card left: draws 1, then loses).
- CR 1-3-2-1: resting an already-rested card is "not performed" (a cost that needs it cannot be paid).
- CR 1-3-2-2: count of 0 or less does nothing.
- CR 1-3-3: prohibition beats requirement.
- CR 1-3-4 / 1-3-10: turn player chooses and acts first in simultaneous choices and actions.
- CR 1-3-5 / 1-3-5-1 / 4-8-1: "up to N" allows 0. Chosen numbers are non-negative integers.
- CR 1-3-6 / 1-3-6-1 / 1-3-6-1-1: power may go negative and the card stays on the field.
- CR 1-3-6-2 / 1-3-6-2-1: cost floors at 0 outside a calculation. Negative intermediate values carry through stacked modifiers.
- CR 1-3-7 / 2-8-3: effect text resolves top to bottom.
- CR 1-3-8: rest-and-activate at the same time → rested.
- CR 2-1-2 / 2-1-2-1 / 2-1-3: exact vs substring name matching, and text-granted names (including in deck construction).
- CR 2-3-5: a multicolor card matches each of its colors.
- CR 2-4-3 / 2-4-3-1 / 2-4-4: exact vs substring type matching, and text-granted types.
- CR 2-5-4 / 2-5-6 / 2-5-7: attribute matching, including multiple and text-granted attributes.
- CR 2-8-2: Leader, Character and Stage text inactive outside its own area.
- CR 2-10-4: only the highest of several Counter values applies.
- CR 2-14-2 / 5-1-2-3: more than 4 copies of a card number (counting alt arts together) is rejected.
- CR 4-9-2-1 / 4-9-2-2: several base-setting effects → highest value applies.
- CR 4-12-1 / 4-12-2: Set Power to 0 subtracts current power, and does nothing if power is already negative.
- CR 5-1-2: exactly 1 Leader, 50-card deck, 10 DON!!.
- CR 5-1-2-1: Leader or DON!! in the main deck is rejected.
- CR 5-1-2-2: a deck card with a color not on the Leader is rejected (including a multicolor card that is partly off-color).
- CR 5-1-2-4: deck-construction effects override the 5-1-2 rules.
- CR 5-2-1-4 / 5-2-1-5: the RPS winner chooses first or second.
- CR 5-2-1-5-1 / 5-2-1-5-2: start-of-game Leader effects run in chooser-first order before hands are drawn, and the deck is shuffled if changed.
- CR 5-2-1-6 / 5-2-1-6-1: 5-card hand; one optional full redraw per player, first player decides first.
- CR 5-2-1-7 / 2-9-2-1: Life = Leader's Life value, deck top ends at Life bottom, placed after redraws.
- CR 3-1-4: zone counts are visible in both players' projections.
- CR 3-1-6 / 3-1-6-1: a card leaving the Character or Stage area loses all applied effects. A DON!! changing area loses its effects.
- CR 3-1-7 / 3-1-8: owner orders simultaneous placements, and the order is hidden when moving open → secret.
- CR 3-2-2 / 3-4-3 / 3-10-2: deck, opponent's hand and Life contents are hidden in projections.
- CR 3-3-2: DON!! deck contents are visible to both players.
- CR 3-5-2: trash is visible to both players. New cards go on top.
- CR 3-6-3: the Leader cannot be moved by any effect.
- CR 3-7-4: a played Character cannot attack the turn it is played.
- CR 3-7-5 / 3-8-4 / 3-9-3: entering cards are active by default.
- CR 3-7-6 / 3-7-6-1 / 3-7-6-1-1: playing a 6th Character trashes one first. No [On K.O.]. Never 6 on board.
- CR 3-8-5 / 3-8-5-1: playing a 2nd Stage trashes the old one.
- CR 3-10-2-1 / 3-10-3: face-up Life is treated as open, and looking at Life preserves facing.
- CR 4-4-2: given DON!! have no active/rested state, and effects cannot change it.
- CR 4-5-3 / 4-5-4: draw X with X = 0; "draw up to X" may stop early.
- CR 4-6-2 / 4-6-2-2: X-point effect damage moves X Life cards one at a time.
- CR 4-6-3 / 4-6-3-1: [Trigger] is offered on damage, and blocked if the card cannot go to hand.
- CR 4-10-1 / 4-10-2: "if" failure blocks the following clause; "then" failure does not.
- CR 6-2-1: "until the start of your next turn" effects end at Refresh.
- CR 6-2-2: start-of-turn effects for both players activate at Refresh.
- CR 6-2-3 / 6-2-4: given DON!! return rested, then all of the turn player's field cards become active.
- CR 6-3-1: first player skips the draw on turn 1. The second player draws on turn 2.
- CR 6-4-1: 2 DON!! per turn; the first player gets 1 on turn 1.
- CR 6-4-2 / 6-4-3: 1 DON!! placed when 1 remains; none when 0 remain.
- CR 6-5-1: start-of-Main-Phase effects activate.
- CR 6-5-3-1 / 2-7-2..2-7-4: play sequences for Character, Stage and Event (reveal, rest DON!!, place or trash-then-resolve).
- CR 6-5-5-1 / 6-5-5-3: giving requires an active cost-area DON!!, with unlimited repeats.
- CR 6-5-5-2: +1000 per given DON!! only during the owner's turn.
- CR 6-5-5-4: a card leaving with DON!! → DON!! go to the cost area rested.
- CR 6-5-6-1: no attack on either player's first turn (turns 1 and 2). Attacks allowed from turn 3.
- CR 6-6-1-1..6-6-1-1-4: End of Your Turn (turn player's order) then End of Your Opponent's Turn (non-turn player's order), once each.
- CR 6-6-1-2: "until end of turn/End Phase" effects expire, turn player's then non-turn player's.
- CR 6-6-1-3: "during this turn" effects expire after step 6-6-1-2.
- CR 6-6-1-4: the turn passes to the other player.
- CR 7-1 / 7-1-1-1 / 7-1-1-2: legal attackers (active Leader or Character) and targets (Leader, or a rested Character only).
- CR 7-1-1-3 / 10-2-16-1: [When Attacking] resolves before [On Your Opponent's Attack].
- CR 7-1-1-4 / 7-1-2-3 / 7-1-3-1-3: attacker or target leaving → skip to End of Battle.
- CR 7-1-2-1: at most one [Blocker] per battle.
- CR 7-1-2-2 / 10-2-15-1: [On Block] activates on blocking.
- CR 7-1-3-1-1: Character Counter from hand only, free, lasts the battle, may target any of your Leader or Characters.
- CR 7-1-3-1-2 / 10-2-4-1: Event [Counter] costs DON!! and only works in the opponent's Counter Step.
- CR 10-2-4-1-2: an effect cannot activate [Counter] unless it says "activate [Counter]".
- CR 7-1-4-1: attacker wins ties (≥), including negative and zero power.
- CR 7-1-4-1-1-1: battle damage determined against 0 Life → attacker wins.
- CR 7-1-4-1-1-2: Life to hand or [Trigger] instead.
- CR 7-1-4-1-1-3 / 10-1-2-1: Double Attack = 2 damage. At 1 Life it does not win. The amount stays fixed if the attacker leaves.
- CR 7-1-4-1-2: losing Character is K.O.'d.
- CR 7-1-4-2: attacker with lower power → nothing happens.
- CR 7-1-5-1..7-1-5-5: end-of-battle triggers, then battle-duration expiry turn player first, then back to Main.
- CR 8-1-2: "may" effects optional; others mandatory as far as possible. An [On Play] with a cost may be declined.
- CR 8-1-3-1: an auto effect fires once per occurrence.
- CR 8-1-3-1-3: an auto effect does not activate if its card moved first.
- CR 8-4-5: move-triggered auto effects fire only into open areas.
- CR 8-1-3-2 / 10-2-2-1 / 10-2-3-1: [Activate: Main] and [Main] only in your Main Phase, never in battle.
- CR 8-1-3-3-3: "under the rules" permanent effects work from secret areas.
- CR 8-1-3-3-5: permanent-effect interaction loop (turn player first, repeat until stable).
- CR 8-1-3-4-2: replacement precedence (source card, then turn player, then non-turn player).
- CR 8-1-3-4-3: the same replacement does not reapply to the same event.
- CR 8-1-3-4-4 / 8-1-3-4-4-1: mid-text replacement, then the rest of the text continues.
- CR 8-1-3-4-5 / 8-1-3-4-6 / 8-1-3-4-7: impossible replacements, chaining, ownership.
- CR 8-2-1-1 / 8-2-1-2 / 8-2-2 / 8-2-3 / 8-2-4: invalidation semantics.
- CR 8-3-1-1 / 8-3-1-2: activation-cost ordering.
- CR 8-3-1-3 / 8-3-1-3-1: a cost that cannot be paid in full cannot be paid at all. Failing mid-payment → effect does not resolve.
- CR 8-3-1-4: an optional cost that is skipped → no effect.
- CR 8-3-1-5: ① rests N active cost-area DON!!.
- CR 8-3-1-6 / 10-2-10-1: DON!! −X returns DON!! from Leader, Character or cost area (given, active or rested) to the DON!! deck.
- CR 8-3-1-7: replaced costs.
- CR 8-3-2-1 / 8-3-2-2: all conditions required, including added ones.
- CR 8-3-2-3 / 10-2-9-1: [DON!! xX] true at ≥ X, checked at the activation timing.
- CR 8-3-2-4 / 8-3-2-5: [Your Turn] / [Opponent's Turn].
- CR 8-3-3: a failed "if" stops the rest of the text.
- CR 8-4-1: activation procedure order.
- CR 8-4-4 / 8-4-4-1: choices made at resolution, as many as possible.
- CR 8-4-4-2: a player may whiff a search in a secret area.
- CR 8-4-4-3: default target is the source card or its controller.
- CR 8-4-6: evaluate against current continuous and permanent effects.
- CR 8-5-4: "when you activate an Event" is not triggered by an Event's [Trigger].
- CR 8-6-1: turn player resolves first. A newly triggered turn-player effect waits for pending non-turn-player effects.
- CR 8-6-1-1: pending B resolves before newly triggered C.
- CR 8-6-2 / 8-6-2-1: triggers during damage wait, except [Trigger], which pauses damage.
- CR 8.6.3: triggers caused by an activation wait for that activation to finish.
- CR 10-1-1-1: [Rush] may attack the turn it is played.
- CR 10-1-3-1: [Banish] trashes the Life card, with no [Trigger] and no choice.
- CR 10-1-4-1: [Blocker] must be active, cannot be the attacked card, redirects the attack.
- CR 10-1-5-1 / 10-1-5-2: [Trigger] is optional, and a declined Trigger card goes to hand unrevealed.
- CR 10-1-5-3: a [Trigger] card is in no area during activation, then is trashed.
- CR 10-1-6-1: [Rush: Character] may attack Characters but not the Leader on the turn it is played.
- CR 10-1-7-1: [Unblockable] prevents [Blocker].
- CR 10-2-1-1 / 10-2-1-2 / 10-2-1-3: K.O. only by battle or effect, to the owner's trash. Other trashing is not a K.O.
- CR 10-2-13-1..10-2-13-5: [Once Per Turn] is per card, resets when the card becomes a new object, and is consumed by a failed payment.
- CR 10-2-14-1: "Trash" cost means discarding from hand.
- CR 10-2-17-1 / 10-2-17-2: [On K.O.] activates on the field and resolves from the trash.
- CR 11-1-1-1 / 11-1-1-2 / 11-1-1-3: infinite-loop handling (draw, or a declared iteration count).
- CR 11-2-1 / 11-2-2: secret → secret moves are revealed, then unrevealed afterward.
- CR 11-3-1 / 11-3-2 / 11-3-3: looking at secret areas is private to the effect's controller, and cards return in their original state.
- QA-GR "no hand limit": hand size is unbounded.
- QA-GR "cannot be rested": blocks attacking, [Blocker], rest costs, and effect rests.
- QA-GR "Trigger only on damage": an effect moving a Life card offers no [Trigger]. Face-up Life [Trigger] still works.
- QA-GR "Life top/bottom to owner": looked-at Life returns to its owner's Life.
- Format: banned card, banned pair and Standard block legality are enforced by the deck validator from data (restriction.html, topics/013.php).
