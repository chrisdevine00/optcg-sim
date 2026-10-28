# Effect DSL: vocabulary, grammar and scripting coverage (Phase 3, Track E)

**As of:** 2026-10-28.
**Inputs:** the optcgapi.com dump cached by Track B (`allSetCards`, `allSTCards`, `promos-P`; `promos-all` returned an error body and was not used), `docs/research/meta-lists.json` (12 archetypes, 36 lists, 182 card IDs), `docs/research/rules-digest.md` (CR v1.2.1), `docs/ARCHITECTURE.md` §2.2–2.5, ADRs 0003, 0006 and 0013.
**Scripts and intermediate outputs:** `.cache/track-e/` (gitignored): `build_pool.py`, `tagger.py`, `stats.py`, `dsl_map.py`, and the files `pool.json`, `tagged.json`, `stats.json`, `meta-features.json`, `meta-prims.json`, `untagged-strict.txt`.

The tagger exists only to **measure** which vocabulary to build first. It never produces behaviour (ADR 0006). Every count below comes from regexes over third-party text, and the precision notes in §1.4 say how far to trust them.

## 0. Summary

- **Pool:** 2,799 distinct card IDs (base printing of 5,112 rows). 2,516 have effect text. They split into 3,534 abilities and 4,086 clauses.
- **Tagger coverage:** 3,991 of 4,086 clauses (97.7 %) get at least one action tag, and 2,432 of 2,516 cards (96.7 %) have every clause tagged. Every ability gets a timing, but "permanent" is the fallback for untagged text, so that figure is softer (§1.3). On the 182 meta cards, 362 of 366 clauses (98.9 %) are tagged. After a manual read of all 182, every meta card maps onto the vocabulary in §5.
- **Top 10 actions, weighted by copies in the 36 lists (the DSL backlog order):** power ± (575), draw (457), look at top N and add or reorder (364), add to Life (270), [Trigger] "play this card" (172), K.O. (154), add DON!! from the DON!! deck (149), trash from own hand (131), cost ± (112), give DON!! (111).
- **Top timings by weight:** [On Play] (1,186), [Trigger] (421), permanent (337), [Counter] (241), [Main] (208), [Activate: Main] (184). [On Block] does not appear in any meta list. The whole pool has only 14 [On Block] cards.
- **Minimal vocabulary for the 182 meta cards:** 28 effect primitives (25 one-shot actions plus 3 continuous-only forms), 12 cost primitives, 17 timing forms (5 named autos, 8 event-triggered kinds, 3 activate timings, [Trigger]), 10 condition forms over 11 numeric terms, 18 filter predicates, 6 pick shapes, 3 explicit durations, 1 replacement shape with 2 events, and 2 rules clauses. The full list is in §5, with the 38 meta cards that need something beyond the core.
- **Data defects in meta cards:** 28 meta cards need a minus sign restored by the pipeline rule. 21 have "DON!! N" for "DON!! −N", and 9 have an unsigned "N power" given to the opponent (OP15-061 and OP15-076 have both). One more, OP13-004 Sabo's self-penalty, is **not** caught by the sign-repair rule in `data-sources.md`, making 29 in all. Other defects: two typos ("poser", "Charactes"), a truncated name ("Sakazuk"), a shifted cost column (OP12-018 has cost "Former Roger Pirates"), and two meta cards with empty text. onepiece.limitlesstcg.com shows both of those as vanillas (§1.5).

## 1. Method

### 1.1 Pool construction

Rows from `optcgapi-allSetCards.json` (3,654), `optcgapi-allSTCards.json` (626) and `optcgapi-promos-P.json` (832) were grouped by card number (the `card_set_id` prefix before `_`). For each number, the row whose `card_image_id` equals the card number is the base printing. The result is 2,799 cards: 2,194 Characters, 410 Events, 146 Leaders and 49 Stages. 529 card numbers have printings whose text differs. On inspection, those differences are whitespace, the appended "This card has been officially errata'd." note, or reprint disclaimers. Base-printing text was used throughout. 283 cards have empty or `NULL` text. Most are vanillas, but the data cannot prove that (§1.5).

### 1.2 Normalization (measurement only)

Applied in `tagger.py` before splitting:
- remove the errata note, "Disclaimer:" tails, and keyword reminder text in parentheses;
- unify "−", "－" and "–" to "-", "[Activate:Main]" to "[Activate: Main]", "[DON!!x1]" and "[DON!!×1]" to "[DON!! x1]", and "K.O up" to "K.O. up";
- rewrite a circled-number cost "(1)" as `①1` (CR 8-3-1-5);
- **sign repair, the same two rules as `data-sources.md` "Decision":**
  - `DON!! N` followed by ":" or "," becomes `DON!! -N`: 68 repairs in the pool, on 21 meta cards.
  - An unsigned `N power` or `N cost` inside a "give … opponent's/their …" clause becomes negative: 66 power and 15 cost repairs in the pool, on 9 meta cards.

### 1.3 Splitting and tagging

1. **Abilities.** A bracketed timing or keyword tag starts a new ability only at a boundary: the start of the text, or after ".", ")", "]", "!" or a bullet. That rule keeps inline references such as "gains [Rush]", "your opponent's [Blocker] Characters" and "a card with a [Trigger]" out of the split. A run of adjacent tags is one ability header, for example `[DON!! x1] [When Attacking]` or `[Your Turn] [Once Per Turn]`. Untagged paragraphs become separate abilities.
2. **Timing.** The header's tags give the timing. An untagged ability is classified by its text, in this order:
   - "would … instead" → replacement;
   - "At the start of the game" → start of game;
   - "When …" → event-triggered auto;
   - "this card in your hand" → permanent effect from hand;
   - "Under the rules of this game" → rules clause;
   - otherwise → permanent.
3. **Cost.** The text before the first colon is the cost when it contains "you may", "DON!! −N", `①N`, "trash this" or "rest this" (CR 8-3-1). "choose one:" and "the following effects:" are not costs.
4. **Clauses.** The effect is split on sentence ends (protecting "K.O." and dotted names such as "Monkey.D.Luffy"), on bullets, and on ", then," and "Then,". Each clause gets every matching tag from about 110 action regexes, 13 condition regexes and 5 duration regexes. The fine tags then fold into the action families of §3.

### 1.4 Coverage and precision

| Measure | Pool | Meta (182) |
| --- | --- | --- |
| Cards with text | 2,516 of 2,799 | 180 of 182 |
| Abilities, with a timing | 3,534 (100 %; 359 are the "permanent" fallback) | 100 % |
| Clauses with ≥1 action tag | 3,991 of 4,086 (97.7 %) | 362 of 366 (98.9 %) |
| Cards with every clause tagged | 2,432 of 2,516 (96.7 %) | 176 of 180 |

**Precision.** All 182 meta cards were read and checked against their tags (`meta-features.json`). Seven errors were found and corrected by hand in `dsl_map.py`:
- OP12-006: "[Monkey.D.Luffy]" broke the search regex.
- OP17-040: a "trash 1 card … to activate this effect" cost was tagged as an effect.
- OP14-041 and EB03-053: "add … opponent's Life to hand" also matched add-to-Life (fixed in the tagger).
- OP17-087: "poser" typo.
- OP15-092: bulleted thresholds were not tagged.
- OP13-004: sign defect.

For the wider pool, samples of 5 clauses from each of 21 tags were read. Errors seen:
- "set it as active" after "add DON!!" was also counted as set-active (fixed);
- "trash … Life" matched unrelated "trash" text (fixed);
- "cannot be rested" was counted as a removal protection (fixed);
- cost filters such as "−0 cost Characters" are still counted as cost modifiers.

Treat pool counts as ±10 % per family. Treat meta counts as exact for presence but not for multiplicity: a card counts once per family however many times it uses it.

### 1.5 Data defects found in meta cards (to fix in M1 overrides)

| Card | Defect | Correction for scripting |
| --- | --- | --- |
| 21 cards: EB04-040, OP09-072, OP09-077, OP09-078, OP10-067, OP12-061, OP15-061, OP15-066, OP15-067, OP15-074, OP15-075, OP15-076, OP15-077, OP15-078, OP15-118, OP16-078, OP17-061, OP17-075, OP17-076, OP17-077, ST34-004 | "DON!! N" without the minus | DON!! −N. Confirmed for OP12-061 on its Limitless card page ("DON!! −1"); the others follow the systematic defect and must be confirmed per card in M1 |
| 9 cards: OP12-018, OP13-076, OP15-061, OP15-076, OP15-114, OP17-017, OP17-042, ST21-017, ST31-004 | unsigned "N power" given to the opponent | −N power |
| OP13-004 Sabo (Leader) | "If you have 4 or more Life cards, give this Leader 1000 power." The minus is almost certainly dropped (a self-penalty clause, like ST30-001's "give this Leader −2000 power"), but the repair rule only fires for opponent-directed text | Flag it; confirm on the card page. See open question E-Q8 |
| OP17-087 Nico Robin | "−3000 poser" | "power" (typo) |
| OP17-076 | "Charactes" | "Characters" (typo) |
| OP16-065 | name "Sakazuk" | the name is truncated; the card is Sakazuki |
| OP12-018 | `card_cost` = "Former Roger Pirates", `card_type` fields shifted | Stats must come from an override |
| OP05-117 Upper Yard | power "NULL" | Stage; no power |
| OP12-114 Wyper, OP08-099 Kalgara | text empty / "NULL" | onepiece.limitlesstcg.com card pages (opened one at a time, 2026-10-28) show no effect text for either, so both are treated as vanillas. Confirm in M1 |
| OP07-077, OP05-117, OP08-109 | types written in square brackets ("[Animal Kingdom Pirates] type") where newer cards use braces or quotes | The type filter must accept all three bracket styles |
| EB04-030 Kaido | "gains Rush" without brackets | Keyword grant |

The two-mode wording "[Main] / [Counter]" (OP06-017) and the dual auto header "[When Attacking]/[On Your Opponent's Attack]" (OP17-048, OP17-058) are deliberate card wordings, not defects. One ability has two timings and **one** Once Per Turn counter.

## 2. Untagged clause patterns

95 pool clauses have no action tag (`untagged-strict.txt`). Grouped:

| Pattern | Count | Example | DSL treatment |
| --- | --- | --- | --- |
| "This effect can be activated when …" (an activation window on an [Activate: Main] or [Counter] ability) | 13 | "This effect can be activated when your opponent attacks." | `window` field on an activate ability (§4.2) |
| Bare "Select …" / "Choose …" sentences that bind targets for a later sentence | 15 | "Select up to 1 of your opponent's Characters." | `select` step with `bind` (§4.10) |
| "Under the rules of this game …" deck and loss rules | 6 | "you may have any number of this card in your deck"; "You lose at the end of the turn in which your deck becomes 0 cards." | `rules` clauses: deck construction and defeat conditions (pool only) |
| Malformed header tokens | 6 | "[DON!!" + "x1]" across a line break; "[On your Opponent's Attack]"; "[Rush Character]" | Data defect; normalize case and spacing |
| Unsigned power or cost on the card's **own** side (sign almost certainly dropped) | 4 | "give this card in your hand 3 cost" (two cards), "give this Leader 1000 power" (OP13-004), "Give this Character 2000 power." | Not repaired by the pipeline rule; flag for human verification (E-Q8) |
| Combined "play/add [A], [B] and [C] each" or "up to 1 X and up to 1 Y" | 5 | "Play up to 1 each of [Sabo], [Portgas.D.Ace], and [Monkey.D.Luffy]" | `pick` with `groups` (§4.4) |
| Attack-target change | 2 | "Change the target of the attack to …" | `redirectAttack` (pool only) |
| Clause substitution ("… instead of a Character with a cost of 4 or less") | 2 | "If you have 15 or more cards in your trash, choose up to 1 … with a cost of 6 or less instead …" | A text-level replacement of a filter: script it as `if/else` with two filters, **not** as a replacement effect |
| Activating an Event from hand by an effect | 2 | "Activate up to 1 {Dressrosa} type Event with a base cost of 3 or less from your hand." | `activateAbility` with `from: hand` (pool only) |
| Tagging misses on names containing "." | ~10 | "[Dr. Hogback]", "[Tony Tony.Chopper]" | Tagger artefact only |
| Long-tail one-offs | ~30 | "Look at all of your opponent's Life cards and place them back …"; "At the end of a battle in which this Character battles …"; "you may K.O. any number of your [Thriller Bark Pirates]…"; "your opponent plays up to 1 Character …"; "Then, trash this SAtage." (typo) | Each needs its own primitive or composition; none is in a meta list |

**Timing words absent from the English pool:** [End of Your Opponent's Turn] (0 cards) and 「When Attacked」 (0). "At the start of the game" appears on 1 card (OP13-079) and "at the start of your turn" on 1 (OP11-040). They stay in the vocabulary because the CR defines them, but they come last.

**Replacement wording (rules-digest Q6).** 71 pool sentences use "would … instead". Only **one** has no "may/can": OP08-045, "If this Character would be removed from the field by your opponent's effect or K.O.'d, trash this Character and draw 1 card instead." Every meta replacement is optional, so the Q6 answer matters for one off-meta card.

## 3. Frequency tables

### 3.1 Actions, weighted by copies in the 36 meta lists (DSL backlog order)

"Weight" = sum over the 36 lists of copies of every card that uses the action at least once (leaders count 1 per list). "Meta cards" = distinct meta card IDs using it. "Pool" = distinct cards in the 2,799-card pool using it. "Primitive" = the §4.6 action that implements it.

| # | Action family | Weight | Meta cards | Pool cards | Primitive |
| --- | --- | --- | --- | --- | --- |
| 1 | Power + / − (until end of turn, battle, or static) | 575 | 61 | 607 | `powerMod` |
| 2 | Draw | 457 | 41 | 395 | `draw` |
| 3 | Look at top N | 364 | 28 | 239 | `lookAtTop` |
| 4 | … reveal/add up to K to hand | 311 | 23 | 179 | `lookAtTop` |
| 5 | … place the rest at the bottom | 298 | 23 | 193 | `lookAtTop` |
| 6 | Add a card to the top of your Life | 270 | 16 | 92 | `move` |
| 7 | Play this card ([Trigger] "Play this card") | 172 | 11 | 133 | `play` |
| 8 | K.O. | 154 | 18 | 305 | `ko` |
| 9 | Add DON!! from the DON!! deck (active or rested) | 149 | 16 | 147 | `addDon` |
| 10 | Trash from your own hand (effect, not cost) | 131 | 14 | 152 | `trashFromHand` |
| 11 | Cost + / − | 112 | 10 | 139 | `costMod` |
| 12 | Give rested DON!! to Leader/Character | 111 | 10 | 107 | `giveDon` |
| 13 | Rest opponent's card(s) | 110 | 14 | 163 | `rest` |
| 14 | Play from hand | 108 | 12 | 186 | `play` |
| 15 | Set active (DON!! or Characters) | 91 | 10 | 142 | `setActive` |
| 16 | Play from trash | 85 | 4 | 49 | `play` |
| 17 | Gains [Rush] | 83 | 8 | 71 | `grantKeyword` |
| 18 | Replacement ("would … instead") | 72 | 8 | 73 | `(replacement ability)` |
| 19 | Opponent trashes from hand | 57 | 5 | 29 | `trashFromHand` |
| 20 | Add from trash to hand | 51 | 6 | 41 | `move` |
| 21 | Opponent's top Life to owner's hand | 51 | 4 | 10 | `move` |
| 22 | Base power becomes N | 47 | 4 | 27 | `setBasePower` |
| 23 | Trash from top of deck (both meta uses are "trash the rest" after a look) | 46 | 2 | 70 | `lookAtTop` (`rest: trash`) |
| 24 | Negate effects | 42 | 4 | 15 | `negateEffects` |
| 25 | Choose one (modal) | 36 | 2 | 25 | `chooseOne` |
| 26 | Return DON!! to DON!! deck (as effect) | 33 | 5 | 30 | `returnDon` |
| 27 | Cannot attack | 29 | 4 | 40 | `restrict` |
| 28 | Will not become active next Refresh | 29 | 4 | 30 | `skipRefresh` |
| 29 | Gains [Unblockable] | 27 | 2 | 8 | `grantKeyword` |
| 30 | Look and reorder top/bottom (no add) | 26 | 4 | 29 | `lookAtTop` |
| 31 | Trash to deck bottom | 24 | 1 | 5 | `move` |
| 32 | Select-and-bind (no action itself) | 23 | 3 | 22 | `select` |
| 33 | Activate this card's [Main]/[On Play] | 22 | 4 | 74 | `activateAbility` |
| 34 | Gains [Blocker] | 21 | 3 | 66 | `grantKeyword` |
| 35 | Counter value in hand | 20 | 2 | 4 | `counterMod` |
| 36 | Delayed ("at the end of this turn", "the next time") | 18 | 3 | 21 | `delayed` |
| 37 | Gains [Rush: Character] | 18 | 1 | 3 | `grantKeyword` |
| 38 | "Under the rules of this game" | 15 | 2 | 22 | `rules` clause |
| 39 | Field card to owner's deck bottom | 14 | 2 | 49 | `move` |
| 40 | Opponent chooses (mode) | 12 | 1 | 12 | `chooseOne` |
| 41 | Return to owner's hand | 12 | 1 | 80 | `move` |
| 42 | Rest DON!! (as effect) | 12 | 3 | 22 | `rest` |
| 43 | Also named […] | 12 | 1 | 8 | `(rules: nameAlias)` |
| 44 | Cannot draw | 12 | 1 | 1 | `restrict` |
| 45 | Power per count ("for every") | 11 | 2 | 9 | `powerMod` |
| 46 | Cannot play | 10 | 1 | 10 | `restrict` |
| 47 | Gains [Double Attack] | 10 | 1 | 22 | `grantKeyword` |
| 48 | Reveal top of deck/Life | 8 | 2 | 34 | `reveal` |
| 49 | Opponent can only attack X | 7 | 1 | 3 | `restrict` |
| 50 | Cannot be removed by opponent's effects | 7 | 1 | 12 | `restrict` |
| 51 | Hand to deck top/bottom | 6 | 1 | 17 | `move` |
| 52 | Own Life to hand (effect) | 6 | 2 | 26 | `move` |
| 53 | Trash own Life | 5 | 1 | 20 | `move` |
| 54 | Opponent cannot activate [Blocker] | 4 | 2 | 15 | `restrict` |
| 55 | Gains keyword (unbracketed) | 3 | 1 | 9 | `grantKeyword` |
| 56 | DON!! deck size | 3 | 1 | 1 | `(rules: donDeckSize)` |
| 57 | Rest own card (effect) | 2 | 1 | 10 | `rest` |

**Pool-only actions** (no meta card uses them; pool cards): restrict:cannotBeKO 46, trashFromField 24, opponentHandOrTrashToDeck 16, grant:canAttackActive 14, grantKeyword:Banish 13, activationWindow 13, restrict:cannotBeRested 12, rules:deck 9, shuffle 8, play:selected 7, restrict:cannotActivate 6, play:deck 6, turnLifeFace 6, lookAtLife 5, restrict:cannotAddLife 4, play:stage 4, winLose 3, play:rested 3, revealFromHand 3, damage 3, swapBasePower 3, typeAlias 3, redirectAttack 2, extraTurn 1, activateEventFromHand 1.

Pool order differs from meta order. K.O. is third in the pool (305 cards, after power and draw) but eighth in the meta; bounce (80 pool cards) and [On K.O.] effects (164) barely appear in the meta. Add-to-Life (92 pool cards) and the opponent's Life-to-hand (10 pool cards) are top-10 and top-25 in the meta because three Life-pressure archetypes (Nico Robin, Yellow Enel, Hancock) are in the top 12.

### 3.2 Timings and timing-like conditions

| # | Item | Weight | Meta cards | Pool cards |
| --- | --- | --- | --- | --- |
| 1 | [On Play] | 1186 | 95 | 933 |
| 2 | [Trigger] | 421 | 40 | 483 |
| 3 | Permanent (no timing) | 337 | 29 | 344 |
| 4 | [Counter] (Event) | 241 | 28 | 199 |
| 5 | [Main] (Event) | 208 | 31 | 285 |
| 6 | [Activate: Main] | 184 | 18 | 379 |
| 7 | Keyword-only line ([Blocker], [Rush] …) | 175 | 17 | 219 |
| 8 | [Once Per Turn] | 164 | 19 | 311 |
| 9 | [Your Turn] | 120 | 8 | 107 |
| 10 | Replacement ("instead") | 72 | 8 | 73 |
| 11 | [When Attacking] | 68 | 10 | 254 |
| 12 | Event-triggered auto ("When …") | 42 | 6 | 79 |
| 13 | [On K.O.] | 36 | 2 | 164 |
| 14 | [On Your Opponent's Attack] | 30 | 4 | 57 |
| 15 | [End of Your Turn] | 28 | 3 | 53 |
| 16 | [DON!! xN] | 24 | 5 | 219 |
| 17 | [Opponent's Turn] | 19 | 4 | 79 |
| 18 | "Under the rules of this game" | 15 | 2 | 9 |
| 19 | Permanent from hand ("this card in your hand") | 13 | 2 | 16 |

Pool only: [On Block] 14.

### 3.3 Activation costs

| # | Item | Weight | Meta cards | Pool cards |
| --- | --- | --- | --- | --- |
| 1 | `cost:donMinus` | 260 | 30 | 177 |
| 2 | `cost:trashFromHand` | 235 | 22 | 222 |
| 3 | `cost:restDon` | 162 | 16 | 119 |
| 4 | `cost:restSelf` | 59 | 5 | 136 |
| 5 | `cost:revealFromHand` | 32 | 4 | 22 |
| 6 | `cost:lifeToHand` | 27 | 4 | 48 |
| 7 | `cost:lifeFaceUp` | 26 | 3 | 14 |
| 8 | `cost:mill` | 20 | 1 | 8 |
| 9 | `cost:trashSelf` | 18 | 2 | 62 |
| 10 | `cost:restOwnCharacters` | 2 | 1 | 13 |

Pool only: `cost:other` 74, `cost:trashFromTrash` 26, `cost:returnOwnCharacter` 21, `cost:trashOwnCharacter` 9.

### 3.4 Conditions in effect text

| # | Item | Weight | Meta cards | Pool cards |
| --- | --- | --- | --- | --- |
| 1 | `ifLeaderType` | 339 | 34 | 400 |
| 2 | `ifLifeCount` | 213 | 20 | 173 |
| 3 | `ifCharacterExists` | 168 | 15 | 113 |
| 4 | `ifDonCount` | 149 | 16 | 146 |
| 5 | `ifCompare` | 36 | 6 | 45 |
| 6 | `ifLeaderMulticolor` | 31 | 4 | 20 |
| 7 | `ifHandCount` | 27 | 2 | 82 |
| 8 | `ifDo` | 16 | 3 | 23 |
| 9 | `ifRevealed` | 8 | 2 | 15 |
| 10 | `ifThisPlayedThisTurn` | 8 | 1 | 7 |
| 11 | `ifRested` | 7 | 1 | 10 |
| 12 | `ifTrashCount` | 5 | 2 | 34 |
| 13 | `ifTurnCount` | 3 | 1 | 1 |

### 3.5 Durations

| # | Item | Weight | Meta cards | Pool cards |
| --- | --- | --- | --- | --- |
| 1 | `thisTurn` | 364 | 41 | 478 |
| 2 | `thisBattle` | 261 | 29 | 212 |
| 3 | `untilEndOfOppNextTurn` | 56 | 5 | 88 |
| 4 | `nextRefresh` | 29 | 4 | 29 |

Pool only: `untilStartOfYourNextTurn` 18.

### 3.6 Printed keywords (keyword lines, not grants)

| # | Item | Weight | Meta cards | Pool cards |
| --- | --- | --- | --- | --- |
| 1 | `Blocker` | 176 | 15 | 283 |
| 2 | `Rush` | 16 | 2 | 21 |
| 3 | `RushCharacter` | 12 | 1 | 7 |
| 4 | `DoubleAttack` | 10 | 1 | 9 |
| 5 | `Banish` | 9 | 2 | 10 |

Pool only: `Unblockable` 3.

### 3.7 Per archetype

Weights are copies across that archetype's three lists. Top eight action families, then top six timings.

| Archetype | Actions (weight) | Timings (weight) |
| --- | --- | --- |
| OP17-039 Rocks.D.Xebec | powerMod 76; draw 69; discard 31; restrict:cannotAttack 19; replacement 12; toDeckBottom 12; chooseOne 12; opponentDiscard 12 | onPlay 107; oncePerTurn 36; keyword 29; onOpponentAttack 24; counter 24; main 24 |
| OP09-062 Nico Robin | play:self 57; draw 56; addLife 50; lookAtTop:restToBottom 43; lookAtTop 43; lookAtTop:addToHand 32; powerMod 23; addDon 15 | onPlay 104; trigger 91; yourTurn 42; keyword 19; onKO 12; permanent 12 |
| ST30-001 Luffy & Ace | powerMod 60; lookAtTop 50; lookAtTop:restToBottom 50; lookAtTop:addToHand 47; giveDon 36; play:hand 24; grantKeyword:Rush 24; rest 21 | onPlay 89; counter 41; permanent 27; main 24; whenAttacking 24; trigger 16 |
| OP13-004 Sabo | powerMod 91; costMod 38; draw 29; lookAtTop 28; lookAtTop:addToHand 28; mill 24; play:trash 19; ko 13 | onPlay 115; permanent 93; counter 15; replacement 12; trigger 11; activateMain 6 |
| OP17-058 Kaido | addDon 78; returnDon 33; draw 32; powerMod 25; addLife 20; replacement 19; rest 19; ko 17 | onPlay 72; oncePerTurn 49; activateMain 45; main 33; keyword 29; trigger 25 |
| OP13-001 Monkey.D.Luffy | setActive 67; rest 39; powerMod 37; lookAtTop 36; lookAtTop:addToHand 36; lookAtTop:restToBottom 36; replacement 14; grantKeyword:Rush: Character 12 | onPlay 103; activateMain 30; endOfYourTurn 26; trigger 19; counter 14; keyword 14 |
| OP15-058 Enel | powerMod 74; draw 74; lookAtTop 23; lookAtTop:addToHand 19; lookAtTop:restToBottom 19; ko 16; addDon 14; grantKeyword:Rush 12 | main 71; onPlay 68; counter 48; permanent 29; whenAttacking 16; trigger 11 |
| OP17-079 Monkey.D.Luffy | powerMod 72; costMod 62; draw 38; play:trash 23; mill 22; lookAtTop:addToHand 22; lookAtTop 22; ko 22 | onPlay 121; permanent 120; replacement 12; counter 4; main 4 |
| OP14-041 Boa Hancock | addLife 65; play:self 48; draw 35; giveDon 29; lookAtTop 24; lookAtTop:restToBottom 19; discard 16; play:hand 16 | trigger 109; onPlay 102; oncePerTurn 27; activateMain 24; keyword 18; permanent 12 |
| OP12-061 Donquixote Rosinante | powerMod 47; addDon 42; draw 42; lookAtTop 37; lookAtTop:addToHand 37; lookAtTop:restToBottom 37; discard 18; addLife 17 | onPlay 97; activateMain 31; counter 30; keyword 25; main 24; trigger 23 |
| OP05-098 Enel | addLife 88; play:self 45; draw 40; lookAtTop 32; lookAtTop:restToBottom 32; ko 30; powerMod 28; lookAtTop:addToHand 20 | onPlay 104; trigger 96; yourTurn 33; permanent 16; keyword 12; counter 12 |
| OP08-098 Kalgara | lookAtTop 46; lookAtTop:addToHand 46; lookAtTop:restToBottom 46; play:hand 38; powerMod 36; addLife 30; draw 26; giveDon 24 | onPlay 104; trigger 20; yourTurn 17; keyword 14; onKO 12; counter 12 |

**What the tables say for build order**

- **Leaders are under-weighted.** A leader counts once per list, but its ability can fire every turn. All 12 meta leaders should be scripted before any other card with the same weight.
- **Four engine features appear in every archetype:** power modifiers with a duration, draw, look-at-top-N with a filtered pick, and [On Play]. These are the M2 slice.
- **The Elbaph decks (OP13-004 Sabo, OP17-079 Luffy) are mostly permanent effects.** They hinge on "if there is a Character with a cost of 12 or more" plus "+12 cost" statics, with permanent weights of 93 and 120. Those decks test `derive` and its fixed-point loop (ARCHITECTURE §2.5) far more than the interpreter.
- **The DON!! economy is its own subsystem.** Kaido, Purple Enel and Rosinante (13.6 % of categorized decklists between them, 16.4 % post-ban) need DON!! −X with a choice of which DON!! to return, add-from-DON!!-deck active or rested, return-as-effect, "set DON!! active", and an auto effect on "a DON!! card is returned" (OP17-062). Every DON!! movement must go through the atomic-op choke point so that OP17-062 and the King/Kaido replacements (EB04-030, EB04-031) can see it.
- **[Trigger] is heavy in three archetypes:** Nico Robin, Yellow Enel and Hancock carry 91–109 weight each. The Trigger window, and "Play this card" from the no-area `resolving` slot, must ship with the first slice that includes any of them.
- **Replacements appear in 8 meta cards across 6 archetypes:** OP17-095, OP17-045, OP15-035, OP15-069, EB04-030, EB04-031, OP17-023 and OP12-061. Four of the eight replace "removed from the field by your opponent's effect", a wider event than K.O., and four replace a K.O. All eight are optional ("you may").

## 4. The DSL

### 4.1 Principles

1. **A script is data.** It is a typed, JSON-serializable object, with no functions, closures or classes (ADR 0003, 0006). The engine interprets it with the resolution stack (ARCHITECTURE §2.4). A frame stores `{ abilityRef, stepPath, locals }`, so a suspended choice is just a frame waiting for its next action.
2. **The engine owns rules, scripts own text.** A script says *what* the card says: timing, conditions, cost, steps. The engine owns everything the CR says about it:
   - when the timing fires and who orders simultaneous auto effects (CR 8-6);
   - whether conditions hold, and whether costs are payable (all-or-nothing);
   - "as many as possible" and "up to" semantics, target legality and invalidation;
   - Once Per Turn bookkeeping, the new-object rule, and replacement ordering.
   A script never encodes a rule that applies to all cards.
3. **Every player choice is an engine decision.** That means `choose` (one pick at a time, then `done`), `optional`, or `order` (ARCHITECTURE §2.3). A script declares a choice's shape (`pick`) and never its UI.
4. **Text order is step order.** A step does what one clause says. The connectives "then", "if", "if you do" and "and" are explicit step kinds, because the CR gives them different failure semantics (CR 4-10-1, 4-10-2, 8-3-3).
5. **Relative players.** `you` is the controller of the ability's source when it activated. `opponent` is the other player. `owner` is resolved per card.

### 4.2 Ability kinds and timings

| Kind | Header / wording | Fields | CR |
| --- | --- | --- | --- |
| `auto` | [On Play], [When Attacking], [On Your Opponent's Attack], [On Block], [On K.O.], [End of Your Turn], [End of Your Opponent's Turn], "At the start of the game", "at the start of your turn", "When …" | `when: AutoTiming[]` (two entries = one ability with a shared Once Per Turn, e.g. "[When Attacking]/[On Your Opponent's Attack]"), `conditions`, `oncePerTurn`, `cost?`, `effect` | 8-1-3-1, 10-2-5..17 |
| `activate` | [Activate: Main], [Main] (Events), [Counter] (Events) | `when: 'activateMain' \| 'main' \| 'counter' \| ('main'\|'counter')[]` (OP06-017 "[Main] / [Counter]"), `window?` ("This effect can be activated when …"), `conditions`, `oncePerTurn`, `cost?`, `effect` | 8-1-3-2, 10-2-2..4 |
| `trigger` | [Trigger] | `conditions?`, `cost?`, `effect`. The card is in `resolving` (no area) and is trashed afterwards unless the effect moved it (CR 10-1-5-3). The printed cost is never paid (rules-digest Q8) | 10-1-5 |
| `permanent` | No timing word; "[Your Turn]", "[Opponent's Turn]" or "[DON!! xN]" alone; "this card in your hand" | `zone: 'field' \| 'hand'` (default field), `conditions`, `apply: Continuous[]` | 8-1-3-3 |
| `replacement` | "If … would …, … instead" | `replaces: ReplaceEvent`, `optional` ("may"), `oncePerTurn`, `instead: Cost[] \| Step[]` | 8-1-3-4 |
| `rules` | "Under the rules of this game …" | `RulesClause[]`, applied at setup, deck validation or derive, and valid from secret areas | 8-1-3-3-3 |

Printed keyword lines ([Blocker], [Rush], [Rush: Character], [Double Attack], [Banish], [Unblockable]) go in `keywords: Keyword[]`, not in abilities. The engine implements keywords. The [Trigger] keyword is the existence of a `trigger` ability.

**Auto timings** (`AutoTiming`):
- **Named:** `onPlay`, `whenAttacking`, `onOpponentAttack`, `onBlock`, `onKO`, `endOfYourTurn`, `endOfOpponentsTurn`, `startOfYourTurn`, `startOfGame`.
- **Event-triggered** (`{ event, … }`):
  - `cardPlayed { by, filter }`: OP14-041 "[Opponent's Turn] When you play a Character".
  - `eventActivated { by }` and `blockerActivated { by }`: OP11-012, OP15-119.
  - `attack { attacker?: Filter, target?: Filter }`: OP17-040 "When your Leader … attacks or is attacked" is two entries.
  - `donReturned { owner }`: OP17-062.
  - `lifeRemoved { owner: 'any' }`: OP12-099.
  - `lifeBecameZero { owner }`: OP05-098.
  - `koed { filter }`: OP14-041 [DON!! x1]. The filter is evaluated on the K.O. event's LKI snapshot.

**When an auto effect fires.** The engine checks `conditions` (including `donGiven`, `yourTurn` and `opponentsTurn`) when the event happens, and again on resolution (CR 8-3-2-3, 8-4-1). It queues the effect per CR 8-6. An auto with a `cost` is **optional by construction** (QA: an [On Play] with a cost may be declined). An auto without one is mandatory unless `optional: true` ("you may" in the effect).

### 4.3 Conditions and numbers

```
Condition := { yourTurn } | { opponentsTurn }
           | { donGiven: n }                         // [DON!! xN] on this card, ≥ n (CR 8-3-2-3)
           | { cmp: [Num, Op, Num] }                 // Op ∈ <=, >=, =, <, >
           | { exists: Selector } | { none: Selector }
           | { leader: Filter }                      // "if your Leader has the {X} type / is [Enel] / is multicolored"
           | { self: Filter }                        // "if this Character is rested / was played this turn"
           | { ref: Name, matches: Filter }          // "if the revealed card's type includes …"
           | { did: Label }                         // "If you do" — the labelled optional step was performed in full
           | { all: Condition[] } | { any: Condition[] } | { not: Condition }
Num := integer
     | { count: Selector }                           // "for every {Straw Hat Crew} type card on your field"
     | { life: P | 'both' } | { hand: P } | { trash: P } | { deck: P }
     | { donOnField: P, state?: 'active' | 'rested' }   // cost area + given (rules-digest: field = Leader, Character, Stage, cost areas)
     | { donGiven: P }                                    // total given DON!! (OP12-015, ST31-004)
     | { turnIndex: P }                                   // "your second turn or later" (OP15-058)
     | { refCount: Name } | { refStat: Name, stat: 'cost' | 'power' | 'basePower' }
     | { sum: Num[] } | { mul: [Num, integer] }
P := 'you' | 'opponent'
```

"If there is a Character with a cost of 12 or more" is `exists` with `owner: 'any'`. That form carries 15 meta cards in the two Elbaph decks. "If you have less Characters than your opponent" is `cmp` of two `count`s. "Equal to or less than the number on your opponent's field" (EB04-038, P-093) is `cmp` of two `donOnField`s.

### 4.4 Selectors and filters (the target grammar)

```
Selector := {
  from:   Zone | Zone[]       // 'leader' | 'characters' | 'stage' | 'field' (= leader+characters+stage)
                              // | 'hand' | 'trash' | 'deckTop' | 'lifeTop' | 'lifeTopOrBottom' | 'looked'
                              // | 'donCostArea' | 'donGiven' | 'donField' (= costArea+given) | 'donDeck' | 'self'
  owner:  P | 'any',
  filter?: Filter,
  pick?:  Pick,               // absent = every matching card ("all of your opponent's Characters")
  chooser?: P,                // default 'you'; 'opponent' for "your opponent trashes 1 card from their hand"
  bind?:  Name,               // store the chosen instance IDs in frame locals
}
Pick := { upTo: N } | { exactly: N } | { upTo: N, totalCost?: { lte: Num }, distinctNames?: true }
      | { groups: { filter: Filter, upTo: N }[] }    // "up to 1 … cost ≤6 and up to 1 … cost ≤5" (EB04-059)
      | { any: true }                                  // "any number of"
Filter := { category: ('Leader'|'Character'|'Stage'|'Event')[] }
        | { cost: Cmp } | { baseCost: Cmp } | { power: Cmp } | { basePower: Cmp } | { counter: Cmp } | { hasCounter: boolean }
        | { type: string }            // exact element of the card's type list ({Navy}, "Navy", [Navy] all mean this)
        | { typeIncludes: string }    // "a type including \"Rocks Pirates\"" — substring over each type element
        | { name: string }            // [Trafalgar Law]; matches alias names from `rules.alsoNamed`
        | { color: Color } | { multicolor: true } | { hasTrigger: boolean } | { keyword: Keyword }
        | { state: 'active' | 'rested' } | { isSelf: boolean } | { playedThisTurn: true } | { ref: Name }
        | { all: Filter[] } | { any: Filter[] } | { not: Filter }
Cmp := { lte: Num } | { gte: Num } | { eq: Num }
```

Current values (`cost`, `power`) are read from `derive`, and base values from card data (CR 4-9). "Other than [X]" is `not: { name: X }`. "your Leader or Character cards" is `from: ['leader','characters']`. "your opponent's Leader and all of their Characters" is two selectors without `pick`.

### 4.5 Costs and how they are paid

```
Cost := { donMinus: n }               // DON!! −N: return N DON!! from Leader/Character/cost areas to the DON!! deck (CR 8-3-1-6)
      | { restDon: n | 'any' }        // ①N and "rest N of your DON!! cards" (CR 8-3-1-5; QA)
      | { trash: Selector }           // "trash 1 card [with a [Trigger] / {Elbaph} type] from your hand"
      | { reveal: Selector }          // "reveal 2 Events from your hand"
      | { restSelf } | { trashSelf }
      | { rest: Selector }            // "rest 2 of your Characters", "rest 2 of your cards"
      | { lifeToHand: { from: 'top' | 'topOrBottom', n } }
      | { turnLifeFaceUp: n }
      | { mill: n }                   // "trash 3 cards from the top of your deck"
      | { returnDon: n }              // replacement payloads ("return 1 DON!! card … instead")
      | { move: Selector, to: Dest }  // "place 3 cards from your trash at the bottom of your deck" (OP17-095)
```

**Payment procedure** (CR 8-3-1, 8-4-1, digest items 120 and 123):

1. **Offer only payable abilities.** `legalActions` offers an activate ability (and the `optional` "pay?" decision for an auto with a cost) only if **every** cost element can be paid together. That means:
   - conditions hold;
   - Once Per Turn is unused;
   - the counts exist;
   - the combination is jointly payable.
   This is the all-or-nothing rule (CR 8-3-1-3). `whyNot` names the first failing element: "You need 2 DON!! on your field to return."
2. **Pay elements in text order** (CR 8-3-1-1). Each element that involves a choice is a `choose` decision with `exactly: n`, never "up to". Examples: which hand card to trash, which DON!! to return.
3. **Lookahead across elements.** A pick is offered only if the *remaining* elements stay payable after it. Example: "DON!! −1, rest 1 of your DON!!" with 1 active and 1 rested DON!! in the cost area. Returning the active one would leave nothing to rest, so the only legal pick is the rested DON!!. This is the same completability rule as ADR 0003, extended over the whole cost list. With the lookahead, payment cannot fail partway in practice. CR 8-3-1-3-1 (pay what you can, then no effect) remains as a defensive path that logs an `Anomaly`.
4. **Then resolve.** For an Event: trash the card, then resolve (CR 8-4-2). Once Per Turn is marked when the effect resolves, or when payment fails partway (CR 10-2-13-5).

**DON!! picks are by location, not by instance.** DON!! cards are interchangeable except for where they are and their state. A DON!! choice therefore offers one candidate per non-empty class:
- cost area, active;
- cost area, rested;
- given to card X (one class per card).
Picks run in that canonical order, so returning 3 DON!! is at most a few branches for search, not C(10,3).

### 4.6 Actions

Every action takes its targets as a `Selector` and resolves "as many as possible" (CR 8-1-2). "Up to" allows 0 (CR 8-4-4-1). An action with no legal target does nothing and does not fail the ability (QA "target is not present").

| Action | Shape | Covers | Atomic op(s) it calls |
| --- | --- | --- | --- |
| `draw` | `{ draw: Num, player?, upTo? }` | "Draw N", "draw up to N" (a loop, CR 4-5-4) | draw ×N |
| `trashFromHand` | `{ trashFromHand: Selector }` (`from: 'hand'`, `chooser`) | own discard; "your opponent trashes 1 card from their hand" (`owner/chooser: opponent`); "trash 2 cards from your opponent's hand" (`owner: opponent`, `chooser: opponent`, E-Q5) | handToTrash |
| `mill` | `{ mill: { player, n } }` | "trash N cards from the top of your deck" | deckToTrash |
| `lookAtTop` | `{ lookAtTop: { n, player?, take: Take[], rest: 'bottomAnyOrder' \| 'trash' \| 'topOrBottomAnyOrder' \| 'topAnyOrder' } }` with `Take = { pick, filter?, reveal?: true, to: 'hand' \| 'lifeTop' }` | the whole "look at N; reveal up to 1 {X} type card and add it to your hand; then place the rest at the bottom in any order" family, and scry ("place them at the top or bottom in any order", OP17-050 "reorganize … then draw 1") | deckToLooked, lookedToHand/Life, lookedToDeck; ordering is an `order` decision |
| `reveal` | `{ reveal: { from: 'deckTop' \| 'lifeTop', n, bind } }` | OP17-039 Rocks leader, OP15-119 | none; publishes knowledge |
| `move` | `{ move: { what: Selector, to: Dest } }` with `Dest = { zone: 'hand' \| 'trash' \| 'deck' \| 'life', position?: 'top' \| 'bottom' \| 'topOrBottom', faceUp?: boolean, owner?: 'owner' }` | add-to-Life from deck/hand/trash (Moria face-up), opponent's Life → owner's hand, own Life → hand, Life → trash, trash → hand, field → owner's hand (bounce), field → owner's deck bottom, trash → deck bottom, hand → deck | a whitelisted (from, to) pair → one typed atomic op (decision E-D5) |
| `play` | `{ play: { what: Selector, rested?: true } }` (`from: 'self'` for [Trigger] "Play this card") | play from hand, trash, `looked` or self; "play up to 2 {Rocks Pirates} type cards with different card names and a total cost of 9 or less" | playToField (the 5-Character rule applies, digest Q2) |
| `ko` | `{ ko: Selector }` | K.O. by cost/power/base power, "K.O. all … with 0 power or less", "total cost of 4 or less" (`pick.totalCost`) | ko |
| `rest` | `{ rest: Selector }` | opponent's Characters, cards, DON!! (OP12-037 "Characters or DON!! cards") | rest |
| `setActive` | `{ setActive: Selector }` | "set up to 2 of your DON!! cards as active", "set this Character as active" | setActive |
| `skipRefresh` | `{ skipRefresh: Selector }` | "will not become active in your opponent's next Refresh Phase" | a one-shot flag consumed at that player's next Refresh (CR 6-2-4) |
| `powerMod` | `{ power: { target: Selector, amount: Num, duration } }` | ± power, "+1000 per 1 cost on the revealed card", "for every DON!! rested this way" | modifier |
| `setBasePower` | `{ setBasePower: { target, value: Num, duration } }` | "base power becomes 0 / 6000 / 8000" (ST34-004, OP15-071, OP17-112 static) | modifier, layer 1 (CR 4-12 for 0) |
| `costMod` | `{ cost: { target, amount, duration } }` | "+2 cost until the end of your opponent's next End Phase" (OP15-074) | modifier |
| `playCostMod` | `{ playCost: { next: Filter, from: 'hand', amount, window: 'thisTurn', uses: 1 } }` | OP12-061 "The next time you play [Trafalgar Law] … the cost will be reduced by 2" | a pending one-shot modifier consumed on the next qualifying play (E-Q2) |
| `giveDon` | `{ giveDon: { n: Num, state: 'rested' \| 'active', to: Selector, each?: true } }` | "give up to 1 rested DON!! card to your Leader or 1 of your Characters"; OP14-105 "your Leader and all of your Characters … each"; OP15-058 "up to 4 … to 1 of your Characters" | donGive |
| `addDon` | `{ addDon: { n, state: 'active' \| 'rested', upTo?: true }[] }` | "add up to 1 DON!! card … and set it as active, and add up to 4 additional DON!! cards and rest them" (one array) | donDeckToCostArea |
| `returnDon` | `{ returnDon: { n: Num \| 'toMatchOpponent' } }` | OP08-074 end-of-turn equalizer; replacement payloads | donReturn |
| `trashLife` | `{ move: lifeTop → trash }`, plus `{ trashLifeUntil: n }` | EB01-059 "trash cards from the top of your Life cards until you have 1 Life card" | lifeToTrash ×k |
| `grantKeyword` | `{ grant: { target, keyword, duration } }` | [Rush], [Blocker], [Unblockable], [Rush: Character], [Double Attack] | modifier (ability layer) |
| `negate` | `{ negate: { target, duration } }` | "negate the effect(s) of up to 1 of your opponent's Characters during this turn" | modifier (ability layer; CR 8-2) |
| `restrict` | `{ restrict: { target: Selector \| P, what: Restriction, duration } }` with `Restriction = 'cannotAttack' \| 'cannotActivateBlockerAgainstIt' \| { cannotPlay: Filter } \| 'cannotDrawByOwnEffects' \| 'cannotBeRemovedByOpponentEffects' \| 'cannotBeKOd' \| …` | OP17-054/OP17-065 cannot attack; ST21-003/OP07-057 "if the selected Character attacks … your opponent cannot activate [Blocker]"; OP13-118 "you cannot play Character cards with a base cost of 5 or more during this turn"; OP12-099 | modifier, read by `legalActions` and the ops |
| `chooseOne` | `{ chooseOne: Step[][], chooser?: P }` | OP17-112 (you choose), OP17-049 "Your opponent chooses one" | `choose` decision over modes |
| `activateAbility` | `{ activate: { ability: 'main' \| 'onPlay', of: 'self' } }` | "[Trigger] Activate this card's [Main]/[On Play] effect" (its own costs are still paid, QA OP03-074) | pushes a frame for that ability |
| `delayed` | `{ delayed: { at: 'endOfThisTurn' }, do: Step[] }` | OP14-031 "set up to 5 of your DON!! cards as active at the end of this turn", OP08-074 | registers a one-shot auto effect |
| `select` | `{ select: Selector }` with `bind` | "Select up to 1 … and that card gains +2000 … Then, if the selected card attacks …" | none |

Control-flow steps are in §4.10.

### 4.7 Durations

`'battle' | 'thisTurn' | 'untilEndOfOpponentsNextTurn' | 'untilStartOfYourNextTurn' | 'nextRefresh' | 'whileSource'`

- **`untilEndOfOpponentsNextTurn`** is the wording "until the end of your opponent's next End Phase/turn". It appears on 5 meta cards with weight 56: OP16-065, OP17-054, OP17-065, OP15-074 and EB04-007. ARCHITECTURE §2.2's duration list **does not include it**; see decision E-D2.
- **"During this turn" versus "until the end of the turn".** These expire at different End Phase sub-steps (CR 6-6-1-2/3). The script keeps the printed wording as `thisTurn` and the engine maps every `thisTurn` to the CR tier for "during this turn". The pool has no meta card that depends on the difference. If one appears, add `untilEndOfTurn`.
- **`whileSource`** is the implicit duration of every `permanent` ability.

### 4.8 Replacements

```
Replacement := { kind: 'replacement', replaces: ReplaceEvent, optional: boolean, oncePerTurn?: true,
                 conditions?: Condition[], instead: Cost[] | Step[] }
ReplaceEvent := { ko: Selector }                                   // "If [your X] would be K.O.'d"
              | { leaveField: Selector, cause: 'opponentEffect' }  // "would be removed from the field by your opponent's effect"
              // pool only: { damage: … }, { lifeToHand: … }, rules-level face-up Life
```

How the engine applies them (ARCHITECTURE §2.4, ADR 0013):
- **Collect.** Before an atomic op runs, the choke point collects every replacement whose `replaces` matches the op, the affected card and the cause. It skips any that already applied to this event (CR 8-1-3-4-3), any whose Once Per Turn is spent, and any whose `instead` cannot be done. A payload that is impossible cannot be applied (CR 8-1-3-4-5): Rosinante with 0 Life, or Zoro OP17-095 with fewer than 3 cards in the trash.
- **Order.** Applicable replacements are ordered per CR 8-1-3-4-2, using an `order` decision when the turn player has two or more.
- **Decide.** An `optional` replacement becomes an `optional` decision owned by its controller, even mid-battle (it suspends the op).
- **Apply.** If accepted, the payload runs as an effect of the replacement's controller (CR 8-1-3-4-7) and the original op does not happen. If declined, the op runs.
- **Mass ops.** "K.O. all …" checks replacements per card, so OP15-114 Wyper's mass K.O. can stop on each Law, King or Kaido.

`ko` matches K.O. by battle and by effect, but not the 5-Character trash or other trashing (CR 10-2-1-3). `leaveField` with `cause: 'opponentEffect'` matches K.O. by an opponent's effect, bounce, deck-bottom, trash-from-field and move-to-Life when the cause is the opponent's effect. It does **not** match a battle K.O. or rule processing.

### 4.9 Permanent effects and keyword grants

```
Continuous := { power: { target: Selector, amount: Num } }
            | { setBasePower: { target, value: Num } }
            | { cost: { target, amount } }
            | { playCost: { target: Selector /* in hand */, amount } }   // OP07-064 Sanji "-3 cost" in hand
            | { counter: { target: Selector /* in hand */, value, onlyIfNone?: true } }  // OP17-063, OP17-118
            | { grant: { target, keyword } }                               // OP17-079 Luffy: all your cost ≥12 Characters gain [Blocker]
            | { restrict: { target, what } }                               // OP15-118 cannot be removed by opponent's effects
            | { lockAttackTarget: { attacker: P, only: Selector } }       // OP17-044 Captain John
            | { tiers: { when: Condition, apply: Continuous[] }[] }       // OP15-092 trash-count thresholds
```

- **Derived only.** Permanent effects are inputs to `derive` (ARCHITECTURE §2.5) and are never stored as modifiers. `conditions` are re-checked on every derive. The layer assignment is:
  - `setBasePower` → layer 1 (layer 2 for "becomes 0");
  - `power` and `cost` → layer 3;
  - `grant` and `restrict` → layer 4.
- **Hand zone.** `zone: 'hand'` effects (counter values, play-cost changes) are derived for cards in hand. They are visible only to the owner's projection, except where the CR reveals them.
- **Keyword grants** by permanent effects (OP17-079, OP16-113 "If you have 2 or less Life cards, this Character gains [Blocker]") and by one-shot effects (`grantKeyword`) both end up in `derive`'s keyword set, which `legalActions` reads for Blocker, Rush and Unblockable.

### 4.10 Control flow: "if", "then", "if you do", "you may", modes, scaling

```
Step := { do: Action, label?: Label }
      | { if: Condition, then: Step[], else?: Step[] }     // CR 8-3-3 and 4-10-1: the guarded clause and the clause it gates are skipped
      | { may: Step[] | Cost[], label: Label }             // "you may X" inside an effect → optional decision
      | { ifDid: Label, then: Step[] }                       // "If you do, Y" → runs only if the labelled `may` fully happened
      | { chooseOne: Step[][], chooser?: P }
      | { forEach: Num, do: Step[] }                         // rare; most "for every" is a scaled Num instead
      | { delayed: …, do: Step[] }
Effect := Step[]
```

- **"Then" needs no wrapper.** "A. Then, B." is simply `[A, B]`. B runs even if A did nothing (CR 4-10-2), because steps are sequential and independent.
- **"If X, A. Then, B."** The clause after a failed "if" is also skipped (CR 4-10-1). The script writes this as `{ if: X, then: [A, B] }`. The author must place B inside the guard when the CR reading requires it. This is the most likely scripting mistake, so the per-card test must cover the failed-condition branch.
- **"You may rest 1 of your DON!! cards. If you do, …"** (OP12-018, OP05-038) is `may` + `ifDid`, not a cost. It sits after the colon, so it is part of the effect.

### 4.11 How choices map to engine decisions

| Script element | Decision | min / max | Notes |
| --- | --- | --- | --- |
| `pick: { upTo: n }` | `choose`, one `pick` at a time, then `done` | 0 / min(n, candidates) | "up to" allows 0 (CR 8-4-4-1) |
| `pick: { exactly: n }` | `choose` | min(n, candidates) / same | "as many as possible" (CR 8-4-4-1); with 0 candidates there is no decision |
| `pick` over a hidden zone by requirement (deck, Life) | `choose` | 0 / n | The player may choose none even when a match exists (CR 8-4-4-2). The view shows the looked-at cards only to the chooser (ARCHITECTURE §2.7) |
| `pick.totalCost`, `pick.distinctNames`, `pick.groups` | `choose` | as declared | **Completability lookahead:** a candidate is offered only if the remaining budget, name set or group quota can still accept it. OP17-119 Loki "total cost of 4 or less": after a 3-cost pick, only cost ≤1 remain. OP17-118 Rocks: picks after the first exclude the same name and anything over the remaining 9 |
| `may`, auto with a cost, optional replacement | `optional` | yes / no | The cost is chosen after "yes" |
| `chooseOne` | `choose` over modes (`chooser` may be the opponent) | exactly 1 | A mode that would do nothing is still choosable (E-Q6) |
| `lookAtTop.rest: 'bottomAnyOrder'`, several simultaneous autos, several replacements | `order` | n/a | Order of cards placed at the bottom is chosen by the owner. It is an `order` decision only when ≥2 cards remain. The session store may auto-resolve it to canonical order with the "always ask" setting off (§2.3 auto-skip) |
| DON!! in a cost or effect | `choose` over DON!! location classes | as declared | §4.5 |
| `restDon: 'any'`, `pick: { any: true }` | `choose` | 0 / all | OP13-001 "rest any number of your DON!! cards" |

**Canonical order.** Picks for an unordered set must be made in candidate order (ADR 0003): sorted by zone, then instance ID, then DON!! class. The UI shows a multi-select and sends picks in that order. The AI search therefore never sees A-then-B and B-then-A as two branches.

**For the AI.** The AI gets exactly the same decisions through `legalActions`. Because scripts are data, the AI can also *read* them for heuristics without running them, for example "this hand has 3 [Counter] Events with +2000 or more", or "the opponent's Leader can make one Character −2000 each turn". The playbooks (ARCHITECTURE §4.6) can name ability IDs.

### 4.12 "This card", bound targets, last-known information and renames

- **`self`** is the source instance at activation. If the source left the area where the ability works, `self` stops resolving: a `self`-targeted action does nothing, and an auto whose source moved before activation does not activate (CR 8-1-3-1-3). The exceptions are:
  - **[On K.O.]:** `self` follows the `renames` entry from the field ID to the new trash ID, so "play this card from your trash" or "add this card to hand" can still find it (CR 10-2-17-2).
  - **[Trigger]:** `self` is the card in `resolving`; "Play this card" moves it from there.
- **Bound names** (`bind`) hold instance IDs in frame locals. "it", "that card", "the selected Character" and "the revealed card" are all `{ ref: name }`. If a bound card has since left its area (new ID), later steps skip it. They do **not** follow renames unless the step says so with `followRename: true`. Today only "add the card K.O.'d this way to hand" style text needs that, and no meta card does.
- **Last-known information.** Event-triggered autos read the event's snapshot through `{ lki: 'subject' }` filters. OP14-041 "Characters with 5000 base power or more is K.O.'d" checks the K.O.'d card's base power and types *as they were on the field*. The snapshot carries power, base power, cost, types, given DON!! and cause (ARCHITECTURE §2.2).
- **Revealed and looked-at cards** are in the pseudo-zone `looked` (owner-only visibility) until the action that placed them finishes. `reveal` publishes the card to both views for the rest of the effect.

### 4.13 How an unscripted card behaves

- **Characters and Stages** can be played for their cost and keep their printed power, cost and Counter value. A Character Counter is a stat, not an effect, so it works in the Counter Step.
- **Printed keywords** work only if the card's verified override lists them in `keywords` (decision E-D7). A card whose whole text is keyword lines (for example "[Blocker]" alone) counts as scripted once that list is verified.
- **Effects** never resolve. That covers abilities, [Trigger] (the card simply goes to hand on damage), replacements and permanent effects.
- **Unscripted Events** cannot be activated: there is nothing to resolve. Their Counter value, if any, still works. `whyNot` says "This card's effect is not automated yet."
- **Unscripted Leaders** play with their power and Life only.
- **Where the badge shows.** The inspector shows the optcgapi text with an "effect not automated" badge. The deck builder's coverage number counts a card as covered only if every ability is scripted, weighted by copies. The game setup screen warns when either deck has unscripted cards. Game records store the script hash (ARCHITECTURE §2.9), so later scripting does not silently change an old replay.
- **The AI** treats unscripted cards as vanillas and is told so, so its evaluation does not assume effects that will not happen.

### 4.14 TypeScript sketch for `cards/src/dsl.ts`

This is a sketch for M2, not final code. Every type is plain data. Discriminated unions use a single distinguishing key so a JSON validator (zod) can check scripts in CI.

```ts
// cards/src/dsl.ts (sketch)
export type P = 'you' | 'opponent';
export type Keyword = 'Blocker' | 'Rush' | 'RushCharacter' | 'DoubleAttack' | 'Banish' | 'Unblockable';
export type Color = 'Red' | 'Green' | 'Blue' | 'Purple' | 'Black' | 'Yellow';
export type Category = 'Leader' | 'Character' | 'Stage' | 'Event';
export type Label = string;   // names a `may` step for `ifDid`
export type Name = string;    // names a bound selection

export interface CardScript {
  cardId: string;                       // card number, e.g. 'OP12-061'
  textHash: string;                     // hash of the verified text; cards:update fails CI when upstream text changes
  verified: { source: string; date: string; textFixes?: string[] };
  keywords?: Keyword[];
  rules?: RulesClause[];
  abilities: Ability[];
}

export type RulesClause =
  | { donDeckSize: number }             // OP15-058 Enel
  | { alsoNamed: string[] }             // EB04-038 Rosinante & Law
  | { anyNumberInDeck: true }           // pool only
  | { deckRestriction: Filter };        // pool only

interface AbilityBase { id: string; oncePerTurn?: true; conditions?: Condition[] }
export type Ability =
  | (AbilityBase & { kind: 'auto'; when: AutoTiming[]; optional?: true; cost?: Cost[]; effect: Effect })
  | (AbilityBase & { kind: 'activate'; when: ActivateTiming | ActivateTiming[]; window?: AutoTiming; cost?: Cost[]; effect: Effect })
  | (AbilityBase & { kind: 'trigger'; cost?: Cost[]; effect: Effect })
  | (AbilityBase & { kind: 'permanent'; zone?: 'field' | 'hand'; apply: Continuous[] })
  | (AbilityBase & { kind: 'replacement'; replaces: ReplaceEvent; optional: boolean; instead: Cost[] | Effect });

export type ActivateTiming = 'activateMain' | 'main' | 'counter';
export type AutoTiming =
  | 'onPlay' | 'whenAttacking' | 'onOpponentAttack' | 'onBlock' | 'onKO'
  | 'endOfYourTurn' | 'endOfOpponentsTurn' | 'startOfYourTurn' | 'startOfGame'
  | { event: 'cardPlayed'; by: P; filter?: Filter }
  | { event: 'eventActivated'; by: P }
  | { event: 'blockerActivated'; by: P }
  | { event: 'attack'; attacker?: Selector; target?: Selector }
  | { event: 'donReturned'; owner: P }
  | { event: 'lifeRemoved'; owner: P | 'any' }
  | { event: 'lifeBecameZero'; owner: P }
  | { event: 'koed'; filter: Filter };          // filter reads the LKI snapshot

export type Condition =
  | { yourTurn: true } | { opponentsTurn: true }
  | { donGiven: number }
  | { cmp: [Num, '<=' | '>=' | '=' | '<' | '>', Num] }
  | { exists: Selector } | { none: Selector }
  | { leader: Filter } | { self: Filter }
  | { ref: Name; matches: Filter }
  | { all: Condition[] } | { any: Condition[] } | { not: Condition };

export type Num =
  | number
  | { count: Selector }
  | { life: P | 'both' } | { hand: P } | { trash: P } | { deck: P }
  | { donOnField: P; state?: 'active' | 'rested' } | { donGiven: P }
  | { turnIndex: P }
  | { refCount: Name } | { refStat: Name; stat: 'cost' | 'power' | 'basePower' }
  | { sum: Num[] } | { mul: [Num, number] };

export type Zone =
  | 'leader' | 'characters' | 'stage' | 'field' | 'hand' | 'trash'
  | 'deckTop' | 'lifeTop' | 'lifeTopOrBottom' | 'looked' | 'self'
  | 'donCostArea' | 'donGiven' | 'donField' | 'donDeck';

export interface Selector {
  from: Zone | Zone[];
  owner: P | 'any';
  filter?: Filter;
  pick?: Pick;                 // absent: every match
  chooser?: P;
  bind?: Name;
  lki?: 'subject';             // event-triggered autos: read the snapshot
}
export type Pick =
  | { upTo: number; totalCost?: Cmp; distinctNames?: true }
  | { exactly: number }
  | { any: true }
  | { groups: { filter: Filter; upTo: number }[] };

export type Cmp = { lte: Num } | { gte: Num } | { eq: Num };
export type Filter =
  | { category: Category[] }
  | { cost: Cmp } | { baseCost: Cmp } | { power: Cmp } | { basePower: Cmp } | { hasCounter: boolean }
  | { type: string } | { typeIncludes: string } | { name: string }
  | { color: Color } | { multicolor: true } | { hasTrigger: boolean } | { keyword: Keyword }
  | { state: 'active' | 'rested' } | { isSelf: boolean } | { playedThisTurn: true } | { ref: Name }
  | { all: Filter[] } | { any: Filter[] } | { not: Filter };

export type Cost =
  | { donMinus: number }
  | { restDon: number | 'any' }
  | { trash: Selector } | { reveal: Selector } | { rest: Selector }
  | { restSelf: true } | { trashSelf: true }
  | { lifeToHand: { from: 'top' | 'topOrBottom'; n: number } }
  | { turnLifeFaceUp: number }
  | { mill: number }
  | { returnDon: number }
  | { move: Selector; to: Dest };

export type Duration = 'battle' | 'thisTurn' | 'untilEndOfOpponentsNextTurn' | 'untilStartOfYourNextTurn';
export interface Dest { zone: 'hand' | 'trash' | 'deck' | 'life'; position?: 'top' | 'bottom' | 'topOrBottom'; faceUp?: boolean }

export type Step =
  | { do: Action; label?: Label }
  | { if: Condition; then: Step[]; else?: Step[] }
  | { may: Step[] | Cost[]; label: Label }
  | { ifDid: Label; then: Step[] }
  | { chooseOne: Step[][]; chooser?: P }
  | { forEach: Num; do: Step[] }
  | { delayed: { at: 'endOfThisTurn' }; do: Step[] };
export type Effect = Step[];

export type Action =
  | { draw: Num; player?: P; upTo?: true }
  | { trashFromHand: Selector }
  | { mill: { player: P; n: number } }
  | { lookAtTop: { n: number; player?: P; take: { pick: Pick; filter?: Filter; reveal?: true; to: 'hand' | 'lifeTop' }[];
                   rest: 'bottomAnyOrder' | 'trash' | 'topOrBottomAnyOrder' | 'topAnyOrder' } }
  | { reveal: { from: 'deckTop' | 'lifeTop'; n: number; bind: Name } }
  | { move: { what: Selector; to: Dest } }
  | { trashLifeUntil: number }
  | { play: { what: Selector; rested?: true } }
  | { ko: Selector }
  | { rest: Selector } | { setActive: Selector } | { skipRefresh: Selector }
  | { power: { target: Selector; amount: Num; duration: Duration } }
  | { setBasePower: { target: Selector; value: Num; duration: Duration } }
  | { cost: { target: Selector; amount: Num; duration: Duration } }
  | { playCost: { next: Filter; from: 'hand'; amount: number; window: 'thisTurn'; uses: 1 } }
  | { giveDon: { n: Num; state: 'rested' | 'active'; to: Selector; each?: true } }
  | { addDon: { n: number; state: 'active' | 'rested'; upTo?: true }[] }
  | { returnDon: { n: Num | 'toMatchOpponent' } }
  | { grant: { target: Selector; keyword: Keyword; duration: Duration } }
  | { negate: { target: Selector; duration: Duration } }
  | { restrict: { target: Selector | P; what: Restriction; duration: Duration } }
  | { activate: { ability: 'main' | 'onPlay'; of: 'self' } }
  | { select: Selector };

export type Restriction =
  | 'cannotAttack' | 'cannotActivateBlockerAgainstIt' | 'cannotDrawByOwnEffects'
  | 'cannotBeRemovedByOpponentEffects' | 'cannotBeKOd' | { cannotPlay: Filter };

export type Continuous =
  | { power: { target: Selector; amount: Num } }
  | { setBasePower: { target: Selector; value: Num } }
  | { cost: { target: Selector; amount: Num } }
  | { playCost: { target: Selector; amount: Num } }
  | { counter: { target: Selector; value: number; onlyIfNone?: true } }
  | { grant: { target: Selector; keyword: Keyword } }
  | { restrict: { target: Selector | P; what: Restriction } }
  | { lockAttackTarget: { attacker: P; only: Selector } }
  | { tiers: { when: Condition; apply: Continuous[] }[] };

export type ReplaceEvent =
  | { ko: Selector }
  | { leaveField: Selector; cause: 'opponentEffect' };
```

**Authoring helpers.** `cards/src/dsl-helpers.ts` should provide builders that return the same data, so scripts read like the card:
- `oppChars({ costLte: 5 }).upTo(1)`;
- `yourLeaderOrChar().upTo(1)`;
- `lookTop(5).reveal(upTo(1, type('Navy'))).toHand().restBottom()`.
The builders are sugar only. The test compares a script with its builder form, so neither drifts.

## 5. The smallest vocabulary that covers all 182 meta cards

Derived by reading every meta card (text in `.cache/track-e/meta-cards.txt`) against §4. Names here are the script keys from §4.14 (`power`, `cost`, `negate`, `grant`). §3 and Appendix A use the tagger's family labels for the same things (`powerMod`, `costMod`, `negateEffects`, `grantKeyword`). The per-card mapping is Appendix A. Two meta cards (OP12-114 Wyper, OP08-099 Kalgara) are vanillas and need nothing.

| Group | Members needed by the meta (count) | In §4 but not needed by any meta card |
| --- | --- | --- |
| Ability kinds | auto, activate, trigger, permanent (field and hand), replacement, rules (6) | — |
| Named auto timings | onPlay, whenAttacking, onOpponentAttack, onKO, endOfYourTurn (5) | onBlock, endOfOpponentsTurn, startOfYourTurn, startOfGame |
| Event-triggered autos | cardPlayed (OP14-041), eventActivated (OP11-012, OP15-119), blockerActivated (OP15-119), attack (OP17-040), donReturned (OP17-062), lifeRemoved (OP12-099), lifeBecameZero (OP05-098), koed with LKI (OP14-041) (8) | — |
| Activate timings | activateMain, main, counter, and main+counter on one ability (OP06-017) (3) | `window` |
| Conditions | yourTurn, opponentsTurn, donGiven, cmp, exists, none, leader, self, ref, all (10) | any, not (expressible but unused) |
| Numeric terms | integer, count, life (you/opponent/both), hand, trash, donOnField (± state), donGiven, turnIndex, refCount, refStat, mul (11) | deck, sum |
| Filters | category, cost, baseCost, power, basePower, hasCounter, type, typeIncludes, name, color, multicolor, hasTrigger, state, isSelf, playedThisTurn, all, any, not (18) | keyword, ref |
| Picks | upTo, exactly, totalCost (OP17-119), distinctNames + totalCost (OP17-118), groups (EB04-059), any (OP13-001) (6) | — |
| Costs | donMinus, restDon, trash, reveal, rest, restSelf, trashSelf, lifeToHand (top / topOrBottom), turnLifeFaceUp, mill, returnDon, move (12) | — |
| One-shot actions | draw, trashFromHand, lookAtTop, reveal, move, trashLifeUntil, play, ko, rest, setActive, skipRefresh, power, setBasePower, cost, playCost, giveDon, addDon, returnDon, grant, negate, restrict, chooseOne, activate, delayed, select (25) | mill (meta "trash the rest" is `lookAtTop.rest: 'trash'`), forEach |
| Continuous forms | power, setBasePower, cost, playCost, counter, grant, restrict, lockAttackTarget, tiers (9; 3 of them are not also actions) | — |
| Restrictions | cannotAttack, cannotActivateBlockerAgainstIt, cannotPlay(filter), cannotDrawByOwnEffects, cannotBeRemovedByOpponentEffects (5) | cannotBeKOd (46 pool cards, 0 meta) |
| Durations | battle, thisTurn, untilEndOfOpponentsNextTurn, plus the implicit whileSource (3 + 1) | untilStartOfYourNextTurn |
| Replacement events | ko, leaveField by opponent's effect (2) | — |
| Rules clauses | donDeckSize (OP15-058), alsoNamed (EB04-038) (2) | anyNumberInDeck, deckRestriction |
| Keywords (printed or granted) | Blocker, Rush, RushCharacter, DoubleAttack, Banish, Unblockable (6) | — |
| Control flow | do, if/else, may + ifDid (OP05-038, OP12-018, OP08-098), chooseOne (4) | forEach |

**Size:** 28 distinct effect primitives (25 one-shot actions plus 3 continuous-only forms), 12 costs, 17 timing forms (5 named autos, 8 event kinds, 3 activate, 1 trigger), 10 condition forms over 11 numeric terms, 18 filter predicates, 6 pick shapes, 3 explicit durations, 1 replacement shape with 2 events, and 2 rules clauses.

### 5.1 Meta cards that need anything unusual (38)

"Unusual" means the card needs something beyond the core every archetype uses (power ± with a duration, draw, look-at-top-N, K.O./rest by cost or power, play by filter, add to Life, simple DON!! add/give, [Trigger] "Play this card").

| Card | Weight | What is unusual | Needs |
| --- | --- | --- | --- |
| OP12-061 Donquixote Rosinante (Leader) | 3 | Once Per Turn **optional replacement** of a K.O. of a *named* Character (alias-aware), with a Life-to-hand payload; a one-shot **next-play cost reduction** | replacement `ko`, `playCost` (§6.6) |
| OP17-095 Roronoa Zoro, OP17-045 Kyo, OP15-035 Laboon, OP15-069 Nola | 24, 12, 12, 4 | Replace "**removed from the field by your opponent's effect**" for *any* of your Characters (Laboon, Nola: base power ≤7000). The payloads are trash→deck bottom ×3, trash 2 from hand, "rest 2 of your cards" and return 1 DON!! | replacement `leaveField`, E-D3, E-Q3 |
| EB04-031 King, EB04-030 Kaido, OP17-023 Nami | 12, 3, 2 | Self or ally K.O. replacement paying with DON!! return or resting this card | replacement `ko` |
| OP17-118 Rocks.D.Xebec | 12 | A permanent Counter value **in hand** that depends on your field ("If you only have Characters without a Counter"); play up to 2 with **distinct names and a total cost ≤ 9** | `zone: 'hand'`, `pick.distinctNames + totalCost`, E-Q4 |
| OP17-063 Kaido | 8 | Every Counter-less Character in your hand has +1000 Counter; "If this Character was played on this turn"; negate *then* K.O. the **same** chosen card ("and K.O. it") | hand `counter`, `playedThisTurn`, `bind`/`ref` |
| OP17-119 Loki | 23 | K.O. with a **total cost of 4 or less** across picks; +12 cost static; power only on the opponent's turn | `pick.totalCost` lookahead |
| OP15-092 Monkey.D.Luffy | 3 | Three cumulative thresholds on trash count; one tier sets the **Leader's** base power on the opponent's turn | `tiers`, `setBasePower` |
| OP17-112 Charlotte Linlin | 24 | [Your Turn] static: base power of filtered Characters becomes 8000; [On Play] draw then choose a mode | `setBasePower` (permanent), `chooseOne` |
| OP15-071 Holly | 10 | Grants [Double Attack] to all [Ohm]; on the opponent's turn sets base power 6000 for [Ohm] and itself | permanent `grant` and `setBasePower` |
| OP17-049 Charlotte Linlin | 12 | **The opponent chooses** the mode; a dual-player effect | `chooseOne.chooser: 'opponent'` |
| OP13-001 Monkey.D.Luffy (Leader) | 3 | Effect-time "rest **any number** of DON!!" with power scaled by the count; [DON!! x1] checked on the opponent's turn | `pick.any`, `refCount`, §6.1 |
| OP15-058 Enel (Leader) | 3 | DON!! deck of 6 (setup rule); "your second turn or later"; add 1 active + 4 rested; give up to 4 DON!! to one Character | `rules.donDeckSize`, `turnIndex` |
| EB04-038 Rosinante & Law | 12 | Also named [Trafalgar Law] and [Donquixote Rosinante] under the rules; compares DON!! counts across players | `rules.alsoNamed` |
| OP17-062 Kaido | 11 | [Your Turn] Once Per Turn auto on **a DON!! card being returned to the DON!! deck** (fires off your own DON!! −X costs) | `donReturned` event at the DON!! return op |
| OP08-074 Black Maria | 3 | Add up to 5 rested DON!!, then a **delayed** "at the end of this turn, return DON!! until you have the same number as your opponent" | `delayed`, `returnDon: 'toMatchOpponent'` |
| OP14-031 Nami | 12 | Delayed "set up to 5 DON!! active at the end of this turn" | `delayed` |
| OP14-041 Boa Hancock (Leader) | 3 | Opponent's-turn auto on your play; [DON!! x1] Once Per Turn auto on a K.O. of a filtered Character, using **LKI** base power | `cardPlayed`, `koed` + LKI |
| OP05-098 Enel (Leader) | 3 | [Opponent's Turn] Once Per Turn "When your number of Life cards becomes 0" | `lifeBecameZero` |
| OP12-099 Kalgara | 12 | "When a card is removed from your or your opponent's Life cards" on your turn, then **you cannot draw with your own effects** this turn | `lifeRemoved`, `cannotDrawByOwnEffects` |
| OP15-119 Monkey.D.Luffy | 5 | "When your opponent activates an Event or [Blocker]": reveal the top Life card, +1000 per 1 cost of it | event autos, `reveal lifeTop`, `refStat` |
| OP17-040 Edward.Newgate | 12 | Once Per Turn auto "When your Leader with a type including 'Rocks Pirates' attacks or is attacked", with an optional cost written as "you may trash 1 … to activate this effect" | `attack` event ×2, cost on an auto |
| OP17-044 Captain John | 7 | While rested and the Leader is Rocks: "your opponent cannot attack any card other than the Character [Captain John]" | `lockAttackTarget` |
| ST21-003 Sanji, OP07-057 Perfume Femur | 2, 2 | "If the selected Character attacks during this turn, your opponent cannot activate [Blocker]" | `select` + `restrict` on the bound card |
| EB02-021 Gum-Gum Giant Pistol, OP05-114 El Thor | 1, 3 | A later clause refers to "the selected Character" / "that card" | `bind`/`ref` |
| OP14-104 Gecko Moria | 19 | Select from trash, then **play it or add it to the top of your Life face-up** (destination choice) | `select` + `chooseOne` |
| EB01-059 Kingdom Come | 5 | "trash cards from the top of your Life cards until you have 1"; [Trigger] K.O. cost ≤ both players' Life | `trashLifeUntil`, `life: 'both'` |
| OP07-064 Sanji | 1 | Cost −3 **in hand** when your DON!! is at least 2 fewer than your opponent's | hand `playCost` |
| OP13-118 Monkey.D.Luffy | 10 | "you cannot play Character cards with a base cost of 5 or more during this turn" | `restrict cannotPlay` |
| OP08-098 Kalgara (Leader) | 3 | Play cost bound by "the number of DON!! cards on your field"; "If you do" → own Life to hand | `may`/`ifDid`, `donOnField` in a filter |
| OP15-118 Enel | 7 | Static "cannot be removed from the field by your opponent's effects" when DON!! ≤ 6 | `restrict cannotBeRemovedByOpponentEffects` read by the `leaveField` choke point |
| P-088 Trafalgar Law | 12 | [Trigger] condition on both players' combined Life | `life: 'both'` |

### 5.2 Hardest meta cards

1. **OP12-061 Rosinante (Leader).** A replacement inside battle damage, Once Per Turn, alias-aware, plus a deferred play-cost modifier. ADR 0013 already names it the reference case. §6.6 scripts it.
2. **OP17-095 Zoro and OP17-045 Kyo, each at the top of its deck.** The "removed from the field by your opponent's effect" replacement needs **every** removal op behind one choke point that knows the cause. That is wider than ARCHITECTURE §2.4's op list (decision E-D3).
3. **OP17-118 Rocks.D.Xebec.** A hand-zone permanent that depends on field state, plus the hardest completability problem in the meta: two picks with distinct names under a shared cost budget, from hand.
4. **OP17-063 Kaido.** A hand-zone Counter grant for every Counter-less Character, plus negate-then-K.O. of one bound target.
5. **OP13-001 Luffy (Leader).** An optional "any number" DON!! choice on the opponent's turn feeding a scaled power boost. For the AI this is a numeric choice on every attack, so DON!! choices must be by class (§4.5).
6. **OP15-092 Luffy, OP17-112 Linlin and OP15-071 Holly.** Permanent base-power setters interacting with "+12 cost" statics and given-DON!! power. These are the cases that exercise `derive`'s layers and fixed point.

## 6. Hand-scripted cards (on paper)

**How these were written.** Text is the optcgapi base printing; any defect is corrected and noted. `textHash` and `verified` are filled in when the M1/M2 override is written from the card's official page. Tests use `createFromScenario` (ADR 0013). In the test sketches, `P1` owns the scripted card.

### 6.1 Leader ability: OP13-001 Monkey.D.Luffy

> [DON!! x1] [On Your Opponent's Attack] If you have 5 or less active DON!! cards, you may rest any number of your DON!! cards. For every DON!! card rested this way, this Leader or up to 1 of your "Straw Hat Crew" type Characters gains +2000 power during this battle.

No defect found.

```ts
export const OP13_001: CardScript = {
  cardId: 'OP13-001', textHash: 'TBD', verified: { source: 'TBD (official card page)', date: 'TBD' },
  abilities: [{
    id: 'opp-attack-boost', kind: 'auto', when: ['onOpponentAttack'],
    conditions: [{ donGiven: 1 }],                                  // still true on the opponent's turn: given DON!! return at your Refresh
    effect: [
      { if: { cmp: [{ donOnField: 'you', state: 'active' }, '<=', 5] }, then: [
        { may: [{ do: { rest: { from: 'donCostArea', owner: 'you', filter: { state: 'active' },
                                 pick: { any: true }, bind: 'rested' } } }], label: 'rest' },
        { ifDid: 'rest', then: [
          { do: { power: {
              target: { from: ['leader', 'characters'], owner: 'you', pick: { upTo: 1 },
                        filter: { any: [{ isSelf: true },
                                        { all: [{ category: ['Character'] }, { type: 'Straw Hat Crew' }] }] } },
              amount: { mul: [{ refCount: 'rested' }, 2000] },
              duration: 'battle' } } },
        ] },
      ] },
    ],
  }],
};
```

**Test sketch:** `OP13-001: On Your Opponent's Attack rests chosen DON!! and boosts for this battle`.
- **Scenario.** It is P2's turn 4, Main Phase. P1's Leader is OP13-001 with 1 given DON!!. P1's cost area has 3 active and 2 rested DON!!. P1 has OP13-027 Sanji (a Straw Hat Crew Character). P2 has an active 7000 Character.
- **Actions.** P2 attacks P1's Leader. P1 gets `optional` and answers yes. P1 gets `choose` and makes picks of class "cost area, active". Assert that exactly one pick action is offered per step: DON!! choices are by class. P1 picks 2 and sends `done`. P1 gets `choose` with candidates [Leader, Sanji] and picks the Leader.
- **Expect.**
  - Leader power is 9000 during the battle (5000 + 4000; the given DON!! adds nothing on P2's turn, CR 6-5-5-2).
  - The cost area is 1 active and 4 rested.
  - After End of the Battle the Leader is back to 5000.
- **Variants.**
  - With 6 active DON!!, no `optional` is offered.
  - With 0 given DON!!, the ability does not trigger.
  - Picking 4 is impossible with 3 active.
  - Declining leaves everything unchanged.

### 6.2 [Trigger]: OP16-119 Marshall.D.Teach

> [On Play] Look at 3 cards from the top of your deck; add up to 1 card to the top of your Life cards. Then, place the rest at the bottom of your deck in any order.
> [Trigger] Negate the effect of up to 1 of your opponent's Characters during this turn. Then, K.O. up to 1 of your opponent's Characters with a cost of 5 or less.

No defect found.

```ts
export const OP16_119: CardScript = {
  cardId: 'OP16-119', textHash: 'TBD', verified: { source: 'TBD', date: 'TBD' },
  abilities: [
    { id: 'on-play', kind: 'auto', when: ['onPlay'], effect: [
      { do: { lookAtTop: { n: 3, take: [{ pick: { upTo: 1 }, to: 'lifeTop' }], rest: 'bottomAnyOrder' } } },
    ] },
    { id: 'trigger', kind: 'trigger', effect: [
      { do: { negate: { target: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } }, duration: 'thisTurn' } } },
      { do: { ko: { from: 'characters', owner: 'opponent', filter: { cost: { lte: 5 } }, pick: { upTo: 1 } } } },
    ] },
  ],
};
```

**Test sketch:** `OP16-119: Trigger negates then K.O.s; the card is trashed, not added to hand`.
- **Scenario.** It is P2's turn. P1 has 3 Life, and the top Life card is OP16-119. P2 has X (cost 5, with an [On K.O.] effect) and Y (cost 7, with a permanent +power effect).
- **Actions.** P2's Leader attacks and wins. Damage processing stops on P1's `trigger` decision, and P1 activates. P1 picks Y as the negate target, then picks X as the K.O. target.
- **Expect.**
  - Y loses its permanent effect until the end of turn: its derived power drops.
  - X is in P2's trash, and its [On K.O.] **did** resolve (X was not negated).
  - OP16-119 is in P1's trash (CR 10-1-5-3).
  - P1's hand count is unchanged.
  - Then damage processing finishes.
- **Second case.** P1 negates **and** K.O.s X. Expect X's [On K.O.] **not** to activate. This is pending Track F (E-Q1).
- **On Play case.** The Life count rises by 1, and the remaining 2 cards are placed at the bottom through an `order` decision.

### 6.3 [Counter] Event: OP15-078 Mamaragan

> [Main] DON!! −2: Draw 1 card. Then, rest up to 1 of your opponent's Characters with 5000 power or less.
> [Counter] Up to 1 of your Leader or Character cards gains +1000 power during this battle. Then, if you have 6 or less DON!! cards on your field, draw 1 card.

**Defect:** optcgapi has "DON!! 2:". Restored to "DON!! −2" by the systematic sign-repair rule; confirm on the official card page in M1. Printed cost 0.

```ts
export const OP15_078: CardScript = {
  cardId: 'OP15-078', textHash: 'TBD', verified: { source: 'TBD', date: 'TBD', textFixes: ['DON!! 2 → DON!! −2'] },
  abilities: [
    { id: 'main', kind: 'activate', when: 'main', cost: [{ donMinus: 2 }], effect: [
      { do: { draw: 1 } },
      { do: { rest: { from: 'characters', owner: 'opponent', filter: { power: { lte: 5000 } }, pick: { upTo: 1 } } } },
    ] },
    { id: 'counter', kind: 'activate', when: 'counter', effect: [
      { do: { power: { target: { from: ['leader', 'characters'], owner: 'you', pick: { upTo: 1 } }, amount: 1000, duration: 'battle' } } },
      { if: { cmp: [{ donOnField: 'you' }, '<=', 6] }, then: [{ do: { draw: 1 } }] },
    ] },
  ],
};
```

**Test sketch:** `OP15-078: Counter +1000 and conditional draw; Main needs DON!! −2`.
- **Counter case.**
  - **Scenario.** It is P2's turn. P1 has 4 DON!! in the cost area plus 2 given (6 on the field) and Mamaragan in hand.
  - **Actions.** P2 attacks. In the Counter Step, P1's `counter` decision lists Mamaragan. P1 activates it (0 DON!! rested) and picks the Leader.
  - **Expect.** The Leader is +1000 for the battle, P1 draws 1, and Mamaragan is in the trash before the effect resolves (CR 8-4-2).
  - **Variant.** With 7 DON!! on the field, the +1000 still applies and there is no draw (CR 4-10-2: the failed "if" does not undo the earlier clause).
- **Main case.**
  - With exactly 1 DON!! on the field, Mamaragan is **not** in `legalActions`. `whyNot` cites CR 8-3-1-3.
  - With 2 DON!! (1 given to the Leader, 1 rested in the cost area), the `choose` offers the classes "given to Leader" and "cost area, rested". Both are returned, P1 draws 1, and a ≤5000-power opponent Character is rested.
  - Mamaragan is **not** offered in P1's own Counter Step: [Counter] is only usable in the opponent's (CR 10-2-4-1).

### 6.4 [Blocker] with [On Block]

**No meta card has [On Block]** (§3.2: 0 of 182; 14 in the whole pool). The closest meta cards are the most-played [Blocker], EB04-058 Borsalino (weight 52), and, as the nearest [On Block] analogue, OP12-033 Helmeppo from the pool. Both are scripted.

> **EB04-058 Borsalino:** [Blocker] [On Play] If you have 2 or less Life cards, add up to 1 card from the top of your deck to the top of your Life cards.

> **OP12-033 Helmeppo (not in any meta list):** [Blocker] [On Block] Rest up to 1 of your opponent's Characters with a cost of 5 or less.

No defects found.

```ts
export const EB04_058: CardScript = {
  cardId: 'EB04-058', textHash: 'TBD', verified: { source: 'TBD', date: 'TBD' },
  keywords: ['Blocker'],
  abilities: [{ id: 'on-play', kind: 'auto', when: ['onPlay'], effect: [
    { if: { cmp: [{ life: 'you' }, '<=', 2] }, then: [
      { do: { move: { what: { from: 'deckTop', owner: 'you', pick: { upTo: 1 } },
                      to: { zone: 'life', position: 'top', faceUp: false } } } },
    ] },
  ] }],
};

export const OP12_033: CardScript = {
  cardId: 'OP12-033', textHash: 'TBD', verified: { source: 'TBD', date: 'TBD' },
  keywords: ['Blocker'],
  abilities: [{ id: 'on-block', kind: 'auto', when: ['onBlock'], effect: [
    { do: { rest: { from: 'characters', owner: 'opponent', filter: { cost: { lte: 5 } }, pick: { upTo: 1 } } } },
  ] }],
};
```

**Test sketch:** `EB04-058: Blocker redirects; On Play adds Life only at 2 or less`.
- With 2 Life, play Borsalino. P1 gets `choose` (0..1). Picking 1 moves the deck top to Life face-down: Life 3, deck −1.
- With 3 Life, playing it opens no decision.
- On P2's turn, P2 attacks P1's Leader. In the `block` decision P1 picks Borsalino. Borsalino rests and becomes the target (CR 10-1-4-1). A rested Borsalino is not offered (QA).

**Test sketch:** `OP12-033: On Block rests a cost ≤5 opponent Character before the Counter Step`.
- **Scenario.** P2 has two active Characters: A, which attacks, and B (cost 5).
- **Actions.** A attacks P1's Leader. P1 blocks with Helmeppo. The [On Block] auto resolves before the Counter Step (CR 7-1-2-2) and rests B.
- **Expect.** B is rested. The battle continues with Helmeppo as the target. The end-of-Block-Step move check passes (CR 7-1-2-3).

### 6.5 Card that interacts with DON!!: OP16-065 Sakazuki

> [On Play] DON!! −1: Give up to 1 of your opponent's Characters −6000 power until the end of your opponent's next End Phase. [Activate: Main] [Once Per Turn] You may rest 1 of your DON!! cards: If your Leader has the {Navy} type, add up to 2 DON!! cards from your DON!! deck and set them as active.

**Defects:** optcgapi names the card "Sakazuk", which is truncated. The text signs are correct in the data.

```ts
export const OP16_065: CardScript = {
  cardId: 'OP16-065', textHash: 'TBD', verified: { source: 'TBD', date: 'TBD', textFixes: ['name: Sakazuk → Sakazuki'] },
  abilities: [
    { id: 'on-play', kind: 'auto', when: ['onPlay'], cost: [{ donMinus: 1 }], effect: [   // a cost makes the auto optional (QA)
      { do: { power: { target: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } },
                       amount: -6000, duration: 'untilEndOfOpponentsNextTurn' } } },
    ] },
    { id: 'ramp', kind: 'activate', when: 'activateMain', oncePerTurn: true, cost: [{ restDon: 1 }], effect: [
      { if: { leader: { type: 'Navy' } }, then: [
        { do: { addDon: [{ n: 2, state: 'active', upTo: true }] } },
      ] },
    ] },
  ],
};
```

**Test sketch:** `OP16-065: DON!! −1 from a given DON!!; −6000 lasts through the opponent's End Phase; ramp once per turn`.
- **Scenario.** It is P1's turn, Main Phase. P1's Leader is OP12-061 Rosinante (types include Navy) with 1 given DON!!. P1 has 7 DON!! in the cost area, and all of them are rested after paying 7 for Sakazuki. P2 has a 7000 Character Z.
- **On Play.**
  - P1 gets `optional` pay?, then `choose` with the single class "given to Leader". After paying, the DON!! deck goes up by 1.
  - Z is at 1000 for the rest of P1's turn and all of P2's turn. It is back to 7000 after P2's End Phase (assert at P2's End Phase sub-steps, CR 6-6-1).
  - The `DonReturned` event fires. In a variant with OP17-062 Kaido on P1's field during P1's turn, that card's auto triggers.
- **Activate: Main, next turn.**
  - With a Navy Leader and 2 active DON!!, activating rests 1 and adds 2 active from the DON!! deck: the cost area shows 3 active.
  - The ability is **not** offered a second time that turn.
  - With 1 card left in the DON!! deck, only 1 is added ("up to").
  - With a non-Navy Leader, the cost is still paid and nothing is added.

### 6.6 Replacement effect: OP12-061 Donquixote Rosinante (Leader)

> [Once Per Turn] If your [Trafalgar Law] would be K.O.'d, you may add 1 card from the top of your Life cards to your hand instead.
> [Activate: Main] [Once Per Turn] DON!! −1: The next time you play [Trafalgar Law] with a cost of 4 or more from your hand during this turn, the cost will be reduced by 2.

**Defect:** optcgapi has "DON!! 1:". The onepiece.limitlesstcg.com card page (opened 2026-10-28) shows "DON!! −1".

```ts
export const OP12_061: CardScript = {
  cardId: 'OP12-061', textHash: 'TBD', verified: { source: 'TBD (official card page)', date: 'TBD', textFixes: ['DON!! 1 → DON!! −1'] },
  abilities: [
    { id: 'law-shield', kind: 'replacement', oncePerTurn: true, optional: true,
      replaces: { ko: { from: 'characters', owner: 'you', filter: { name: 'Trafalgar Law' } } },  // battle or effect K.O.
      instead: [{ lifeToHand: { from: 'top', n: 1 } }] },
    { id: 'law-discount', kind: 'activate', when: 'activateMain', oncePerTurn: true, cost: [{ donMinus: 1 }], effect: [
      { do: { playCost: { next: { all: [{ category: ['Character'] }, { name: 'Trafalgar Law' }, { cost: { gte: 4 } }] },
                          from: 'hand', amount: -2, window: 'thisTurn', uses: 1 } } },
    ] },
  ],
};
```

**Engine behaviour this relies on:**
- **Hook point.** The K.O. choke point collects `law-shield` for a Character whose derived names include "Trafalgar Law". That covers ST10-010, P-088, P-093, and EB04-038 through `rules.alsoNamed`.
- **When it is offered.** It is offered only if P1 has ≥1 Life (CR 8-1-3-4-5) and the Once Per Turn is unused.
- **Accepting.** If P1 accepts, the top Life card goes to hand. That is **not** damage, so no [Trigger] is offered (QA "Add 1 card from the top of your Life … [Trigger]: No"). The Character stays on the field, and the K.O. event, [On K.O.] and any "when K.O.'d" autos do not happen. Once Per Turn is spent.
- **Declining** does not spend Once Per Turn (CR 10-2-13-1: it is spent when it resolves).
- **Discount.** The `playCost` record is consumed by the next play from hand that pays a cost and matches. Whether an effect-play from hand consumes it is open question E-Q2.

**Test sketch:** `OP12-061: Law K.O. replaced by Life to hand once per turn; discount applies to the next Law only`.
- **Battle K.O.**
  - **Scenario.** P1 has 3 Life (the top card has a [Trigger]) and a **rested** ST10-010 Law (5000) on the field. On P2's turn, a 6000 Character attacks Law, and P1 declines to block or counter.
  - In the damage step, P1 gets `optional`. P1 accepts.
  - **Expect.** Law is still on the field. P1 has 2 Life and +1 card in hand. No `trigger` decision is offered. The event log shows `ReplacementApplied`.
- **Second K.O. the same turn.** P2 K.O.s Law again by an effect (for example an OP17-063 Kaido activation). There is no `optional`, and Law is K.O.'d.
- **0 Life.** No `optional`. Law is K.O.'d.
- **Alias.** EB04-038 Rosinante & Law is protected the same way.
- **Discount.** On P1's turn, activate law-discount (DON!! −1), then play ST10-010 (cost 4) from hand: rest 2. A second Law (P-093, cost 4) costs 4. A 3-cost card named Law, if one existed, would not consume the discount.
- **Rule trash.** The 5-Character rule trash of Law is **not** offered the replacement (CR 3-7-6-1-1).

### 6.7 Bonus: OP17-058 Kaido (Leader), a dual timing with one Once Per Turn

> [When Attacking]/ [On Your Opponent's Attack] [Once Per Turn] DON!! −1: Give up to 1 of your opponent's Characters −2000 power during this turn.

No defect found (the minus signs are present).

```ts
export const OP17_058: CardScript = {
  cardId: 'OP17-058', textHash: 'TBD', verified: { source: 'TBD', date: 'TBD' },
  abilities: [{ id: 'shrink', kind: 'auto', when: ['whenAttacking', 'onOpponentAttack'], oncePerTurn: true,
    cost: [{ donMinus: 1 }],
    effect: [{ do: { power: { target: { from: 'characters', owner: 'opponent', pick: { upTo: 1 } }, amount: -2000, duration: 'thisTurn' } } }] }],
};
```

**Test sketch.** On P2's turn, P2 attacks twice. The first attack offers `optional`; P1 pays DON!! −1 and the attacker gets −2000. The second attack offers nothing (Once Per Turn is shared across both timings). On P1's next turn, Kaido's attack offers it again.

## 7. Open questions

**E-Q1. Does a negated Character's [On K.O.] activate when it is then K.O.'d?** *Context:* OP16-119's [Trigger] and OP17-063 Kaido ("negate the effect of … and K.O. it") negate a Character during this turn and then K.O. it. [On K.O.] activates on the field and resolves from the trash (CR 10-2-17-1/-2), where the card is a new object that the negation no longer covers. *Best answer:* it does not activate. The activation check happens on the field while the card is still negated (CR 8-2-1-1), and OP17-063's wording only makes sense if negation stops [On K.O.]. *Competing reading:* the effect resolves from the trash, unaffected by the negation. Track F should look for a Q&A entry. The engine test in §6.2 is written against the best answer and marked pending.

**E-Q2. Is OP12-061's "next time you play [Trafalgar Law] … from your hand" discount consumed by a play from hand that an effect makes?** *Context:* Effect-plays from hand pay no cost, for example OP12-015 "play up to 1 … from your hand". *Best answer:* only a play that pays a cost consumes the discount, because "the cost will be reduced" has nothing to act on otherwise. *Competing reading:* "the next time you play" is literal, so any play from hand of a qualifying Law consumes it. Low impact; Track F.

**E-Q3. What can OP15-035 Laboon's "rest 2 of your cards" rest?** *Context:* "your cards" is wider than "your Characters". *Best answer:* any 2 of your active Leader, Characters, Stage or cost-area DON!! cards (all are cards on your field that can be rested). *Competing reading:* Characters and Leader only. This changes how often the replacement is payable. Track F.

**E-Q4. Is OP17-118's "If you only have Characters without a Counter" true when you have no Characters?** *Best answer:* yes. The script uses `none: { your Characters with a Counter }`, which holds for an empty board. *Competing reading:* it needs at least one Character. This changes whether Rocks has a +2000 Counter in an empty-board opening hand. Track F.

**E-Q5. Who picks the card in "trash 2 cards from your opponent's hand" (ST10-010) and "Trash 1 card from your opponent's hand" (OP17-075)?** *Context:* Other cards say "your opponent trashes", which clearly means the opponent chooses. *Best answer:* the opponent chooses, by analogy, and the hand stays hidden. *Competing reading:* the controller picks blindly. The engine would then map the pick to a card through the seeded RNG so that the face-down order leaks nothing (ARCHITECTURE §2.7). Track F should find the ruling. The DSL supports both through `chooser` (and a `blind: true` flag if needed).

**E-Q6. May a player choose a mode of "choose one" that would do nothing?** *Context:* With OP17-049, the opponent chooses between "Draw 2 cards" (for the controller) and "trash 2 cards from their hand". An opponent with an empty hand would pick the second for free. *Best answer:* yes. The CR does not require a mode to be resolvable, and "an effect with no legal target may still be activated" (QA). *Competing reading:* a mode that cannot do anything is not choosable. Track F.

**E-Q7. Exactly which events does "removed from the field by your opponent's effect" cover, and how does it order against a K.O. replacement?** *Best answer:*
- It covers K.O. by an opponent's effect, return to hand, placement in a deck, trash from the field, and placement into Life, all caused by an effect the opponent controls.
- It excludes a battle K.O., the 5-Character rule trash, and costs the owner pays.
- When Rosinante's `ko` replacement and Zoro's `leaveField` replacement could both apply, both belong to the same player (the turn player or not), who orders them (CR 8-1-3-4-2). Accepting one ends the event.
Track F should confirm the scope of "removed from the field" with a Q&A on OP17-095 or OP15-035.

**E-Q8. Are unsigned self-directed power and cost values sign defects?** *Context:* OP13-004 Sabo reads "give this Leader 1000 power". The pool also has "give this card in your hand 3 cost" twice and "Give this Character 2000 power.". The `data-sources.md` repair rule only fires for opponent-directed text. *Best answer:* all four are dropped minus signs, judging by card design and the analogous ST30-001 wording. Do not auto-repair. Flag them for human verification, because "give this Character 2000 power" could in principle be a +. The owner or M1 verification resolves each one on the official card page.

**E-Q9. Should a card's printed keywords work when it is otherwise unscripted?** *Context:* 219 pool abilities are bare keyword lines. A Blocker that cannot block misrepresents the card more than a missing On Play does. *Best answer:* yes, through the verified override's `keywords` list (E-D7), never from parsed text. *Competing reading:* nothing works until the card is fully scripted, which is simpler and matches ADR 0006 literally but makes deck testing misleading.

## 8. Proposed decisions

**E-D1. Scripts are typed TS data in the §4.14 shape, checked by a schema in CI.** *Context:* ADR 0006 requires data, and the engine requires serializability. *Decision:*
- One `CardScript` per card number in `cards/effects/<SET>/<ID>.ts`.
- Each is validated by a zod schema derived from `dsl.ts`.
- Builder helpers are allowed as sugar.
- A script lint rejects unbound `ref`s, unknown `ifDid` labels, selectors without `owner`, a `pick` inside a cost that is not `exactly`, and steps after a guarded "if" that should be inside it (heuristic: warn when the printed text has "If …, A. Then, B" and B is outside the guard).

*Alternatives rejected:* plain JSON files (no type checking or editor help); a text mini-language (needs a parser, the thing ADR 0006 rejects); per-card functions (not serializable).

**E-D2. Add `untilEndOfOpponentsNextTurn` and `untilStartOfYourNextTurn` to the modifier durations in ARCHITECTURE §2.2.** *Context:* 5 meta cards (weight 56) say "until the end of your opponent's next End Phase", and 18 pool cards say "until the start of your next turn". §2.2 lists neither the first nor a per-player version of the second. *Decision:*
- `untilEndOfOpponentsNextTurn` expires at the CR 6-6-1 tier for "until the end of the End Phase" in the opponent's next turn.
- `untilStartOfYourNextTurn` expires at CR 6-2-1 of the controller's next turn.

*Alternatives rejected:* approximating the first with `untilStartOfNextTurn(you)`, which is wrong for anything that checks power in the opponent's End Phase or your start-of-turn effects; a raw turn counter, which hides the CR tier.

**E-D3. Route every way a card leaves the field through one `leaveField(card, dest, cause)` choke point.** *Context:* ARCHITECTURE §2.4 hooks K.O., trash from field, Life moves, rest, DON!! return, draw and damage. Four meta replacements (OP17-095, OP17-045, OP15-035, OP15-069) and one protection (OP15-118) key on *removal by the opponent's effect*, which also covers bounce and deck placement. *Decision:*
- K.O., return to hand, place in deck, trash from field and place into Life all call `leaveField` with `cause = { kind: 'battle' | 'effect' | 'rule' | 'cost', controller }`.
- Replacements and `cannotBeRemovedByOpponentEffects` match on the cause.
- K.O. keeps its own hook first (for `ko` replacements), then leaveField's.

*Alternatives rejected:* a hook per op, where missing one op is a silent bug in the most-played Sabo and Luffy decks; treating "removed" as K.O. only, which is wrong by the card text.

**E-D4. DON!! choices are made by location class, not by instance.** *Context:* DON!! −X, rest N DON!!, give DON!! and "any number" choices would otherwise branch over interchangeable cards. *Decision:* candidates are "cost area active", "cost area rested" and "given to <card>" (one class per card), with counts. Picks follow canonical class order, and the engine assigns concrete instance IDs deterministically (lowest ID first). *Alternatives rejected:* per-instance picks (combinatorial blow-up for search, meaningless to players); a single "number" input (cannot express *which* card's given DON!! to return, which matters for power).

**E-D5. Use one generic `move` action with a whitelist of (from, to) pairs, each bound to a typed atomic op and event.** *Context:* the meta needs about 11 zone transfers, and each must be visible to replacements and autos by its specific kind ("Life card removed", "returned to hand"). *Decision:*
- `move` is the only script-level transfer verb except the CR keywords, which keep their own names: `ko`, `play`, `draw`, `trashFromHand`, `giveDon`, `returnDon`.
- The engine table maps each (from, to) pair to an op such as `lifeToHand` or `fieldToOwnerHand`.
- An unlisted pair fails schema validation.

*Alternatives rejected:* one action per pair (20-plus names to learn and test); an untyped move (replacements could not target it).

**E-D6. Cost payability uses full lookahead, and cost picks are always exact.** *Context:* CR 8-3-1-3 is all-or-nothing, and ADR 0003 already requires completability. *Decision:*
- `legalActions` offers an ability only if all its cost elements are jointly payable.
- Every cost pick is `exactly`, offered only if the rest stay payable.
- The CR 8-3-1-3-1 partial-payment path stays as defensive code that emits an `Anomaly` event.

*Alternatives rejected:* checking each element as it is paid (allows dead-end states the player cannot back out of); letting the player cancel mid-payment (not in the CR, and it complicates replay).

**E-D7. Printed keywords come from the verified override, not from text.** *Decision:*
- `cards/overrides/<ID>.json` may carry `keywords` with a source URL even when no script exists.
- The engine honours it, and keyword-only cards then count as fully scripted.
- `cards:update` fails if the upstream text's keyword lines stop matching the override, the same rule as for `textHash`.

*Alternatives rejected:* deriving keywords from text at build time (contradicts ADR 0006); no keywords for unscripted cards (makes 219 pool abilities, and 15 meta Blockers until scripted, silently wrong).

**E-D8. Unscripted Events cannot be activated, and unscripted [Trigger]s are not offered.** *Context:* §4.13. *Decision:* `whyNot` returns "effect not automated yet" for an unscripted Event's [Main]/[Counter]. A Life card's unscripted [Trigger] simply goes to hand. *Alternatives rejected:* activating as a no-op, which spends DON!! for nothing and teaches wrong play; activating with a manual "resolve it yourself" mode, which breaks replay and the AI.

**E-D9. Once Per Turn is keyed by instance and ability ID.** *Decision:*
- The key is `oncePerTurnUsed[`${instanceId}:${abilityId}`]`.
- An ability with two timings (OP17-058, OP17-048) has one ID and one key.
- It is spent when the effect resolves, when payment fails partway (CR 10-2-13-5), or, for a replacement, when the replacement is applied.
- It is not spent when the player declines an `optional`.
- A new object gets a fresh key (CR 10-2-13-4).

*Alternatives rejected:* keying by card number (wrong: CR 10-2-13-2 counts per card); spending on decline (contradicts "activates and resolves once").

**E-D10. Keep the tagger as a measurement tool and re-run it per set release.** *Decision:* in M2, port `.cache/track-e/tagger.py` and `stats.py` to `cards/scripts/measure-effects.ts`. Its output, the meta-weighted backlog and the coverage percentage, goes into the coverage report that the deck builder and PLAN read. It never produces scripts. *Alternatives rejected:* a one-off analysis (the backlog order goes stale with every set and every meta update); generating draft scripts from it (the slippery slope ADR 0006 forbids).

**E-D11. Build in backlog order, leaders first.** *Decision:*
1. All 12 meta leaders.
2. Then by the §3.1 meta weight: power ±, draw, look-at-top-N, add to Life, [Trigger] play this card, K.O., add DON!!, own discard, cost ±, give DON!!, rest, play from hand or trash, set active.
3. Then the remaining unusual primitives in §5.1, in the order of their cards' weights.
4. Replacements (E-D3) ship with Rosinante in M2, as ADR 0013 already requires.

*Alternatives rejected:* pool-frequency order, which would build K.O., bounce and [On K.O.] early when the meta barely uses them.

## Appendix A. Meta cards → timings, costs and primitives

Auto-derived from the tagger with the §1.4 corrections, sorted by weight. Keywords are printed keyword lines. For cards in §5.1, that table is authoritative. `move` covers every zone transfer in E-D5.

| Card | Name | Wt | Archetypes | Timings | Costs | Primitives | Keywords |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EB04-058 | Borsalino | 52 | OP05-098, OP08-098, OP09-062, OP12-061, OP14-041 | keyword, onPlay | — | move | Blocker |
| OP17-109 | Charlotte Pudding | 36 | OP05-098, OP09-062, OP14-041 | onPlay, trigger | trashFromHand | draw, lookAtTop | — |
| OP15-078 | Mamaragan | 35 | OP12-061, OP15-058, OP17-058 | counter, main | donMinus | draw, powerMod, rest | — |
| OP17-114 | Sweet 3 Generals | 34 | OP05-098, OP08-098, OP09-062, OP12-061 | yourTurn, onPlay, trigger | restDon | draw, move, play, powerMod | — |
| OP16-119 | Marshall.D.Teach (119) | 30 | OP05-098, OP09-062, OP14-041 | onPlay, trigger | — | ko, lookAtTop, move, negateEffects | — |
| OP01-016 | Nami | 24 | OP13-001, OP13-004, ST30-001 | onPlay | — | lookAtTop | — |
| OP17-074 | Yamato | 24 | OP09-062, OP17-058 | keyword, onPlay | — | addDon | Blocker |
| OP17-080 | Usopp | 24 | OP13-004, OP17-079 | onPlay, permanent | — | lookAtTop, mill, powerMod | — |
| OP17-095 | Roronoa Zoro (095) | 24 | OP13-004, OP17-079 | replacement | — | (replacement ability), move, powerMod | — |
| OP17-102 | Charlotte Oven | 24 | OP05-098, OP09-062 | onKO, trigger | — | play | — |
| OP17-107 | Charlotte Daifuku | 24 | OP05-098, OP09-062 | trigger | — | play | — |
| OP17-112 | Charlotte Linlin (112) | 24 | OP05-098, OP09-062 | yourTurn, onPlay, permanent | — | chooseOne, draw, move, setBasePower | — |
| ST31-005 | Thousand Sunny | 24 | OP13-001, ST30-001 | activateMain, onPlay | restSelf | giveDon, lookAtTop | — |
| OP17-082 | Sanji | 23 | OP13-004, OP17-079 | onPlay, permanent | — | draw, powerMod, trashFromHand | — |
| OP17-087 | Nico Robin | 23 | OP13-004, OP17-079 | onPlay, permanent | — | powerMod | — |
| OP17-119 | Loki | 23 | OP13-004, OP17-079 | onPlay, permanent | — | costMod, ko, powerMod | — |
| OP17-089 | Jaguar.D.Saul | 22 | OP13-004, OP17-079 | onPlay, permanent | — | costMod, lookAtTop, mill | — |
| OP17-093 | Monkey.D.Luffy (093) | 22 | OP13-004, OP17-079 | onPlay, permanent | — | draw, grantKeyword, play | — |
| OP15-088 | Pirates Docking Six | 20 | OP13-004, OP17-079 | onPlay, permanent | mill | costMod, play | — |
| EB02-017 | Nami | 19 | OP13-001, ST30-001 | onPlay | — | lookAtTop | — |
| OP04-016 | Bad Manners Kick Course | 19 | OP13-001, OP13-004, ST30-001 | counter, trigger | trashFromHand | powerMod | — |
| OP14-104 | Gecko Moria - OP14-104 | 19 | OP05-098, OP14-041 | onPlay, trigger | — | move, play | — |
| OP17-106 | Charlotte Smoothie | 19 | OP05-098, OP09-062 | yourTurn, onPlay, trigger | restDon | move, play, trashFromHand | — |
| ST10-010 | Trafalgar Law (010) | 19 | OP12-061, OP15-058 | onPlay | donMinus | trashFromHand | Blocker |
| EB04-002 | Jewelry Bonney (EB04-002) | 18 | OP13-001, ST30-001 | onPlay | — | lookAtTop | — |
| EB04-007 | Roronoa Zoro (EB04-007) | 18 | OP13-001, OP13-004 | activateMain, oncePerTurn, onPlay | — | grantKeyword, powerMod | — |
| OP15-113 | Roronoa Zoro (OP15-113) | 18 | OP05-098, OP14-041 | onPlay | trashFromHand | move | — |
| OP17-086 | Nami (086) | 18 | OP13-004, OP17-079 | onPlay | trashFromHand | draw | — |
| OP06-115 | You're the One Who Should Disappear | 16 | OP05-098, OP14-041 | counter, trigger | trashFromHand | move, powerMod, trashFromHand | — |
| OP11-106 | Zeus | 16 | OP05-098, OP08-098 | onPlay | lifeToHand | ko | — |
| OP17-081 | Gerd | 16 | OP13-004, OP17-079 | onPlay, permanent | trashFromHand | costMod, move | — |
| OP17-113 | Streusen (113) | 16 | OP05-098, OP09-062 | onPlay | — | lookAtTop | — |
| OP09-077 | Gum-Gum Lightning | 15 | OP12-061, OP15-058, OP17-058 | main, trigger | donMinus | addDon, ko | — |
| OP17-084 | Tony Tony.Chopper | 15 | OP13-004, OP17-079 | onPlay | — | grantKeyword | — |
| EB03-053 | Nami (053) | 12 | OP08-098 | onKO, onPlay | lifeFaceUp | giveDon, move, play | — |
| EB04-031 | King | 12 | OP17-058 | activateMain, oncePerTurn, replacement | — | (replacement ability), addDon, returnDon | — |
| EB04-032 | Queen | 12 | OP17-058 | activateMain, oncePerTurn, onPlay | restDon, trashFromHand | addDon, draw | — |
| EB04-038 | Rosinante & Law | 12 | OP12-061 | onPlay, rulesModifier | — | (rules: nameAlias), addDon, draw | Blocker |
| OP05-117 | Upper Yard | 12 | OP08-098 | onPlay | — | lookAtTop | — |
| OP07-077 | We're Going to Claim the One Piece!!! | 12 | OP17-058 | main, trigger | — | activateAbility, lookAtTop | — |
| OP08-110 | Wyper | 12 | OP08-098 | onPlay | — | lookAtTop, play | — |
| OP12-015 | Monkey.D.Luffy | 12 | ST30-001 | onPlay, permanent | revealFromHand | giveDon, play, powerMod | — |
| OP12-071 | Charlotte Pudding | 12 | OP15-058 | onPlay | — | lookAtTop | — |
| OP12-099 | Kalgara | 12 | OP08-098 | autoEvent, yourTurn | — | draw, restrict | — |
| OP12-114 | Wyper | 12 | OP08-098 | — | — | — (vanilla) | — |
| OP12-115 | I Love You!! | 12 | OP12-061 | counter | — | move, powerMod | — |
| OP13-027 | Sanji | 12 | OP13-001 | endOfYourTurn, onPlay | — | setActive | — |
| OP14-022 | Usopp | 12 | OP13-001 | endOfYourTurn | — | setActive | — |
| OP14-031 | Nami | 12 | OP13-001, ST30-001 | onPlay | — | delayed, rest, setActive | Blocker |
| OP14-105 | Gorgon Sisters | 12 | OP14-041 | activateMain, oncePerTurn, trigger | revealFromHand | giveDon, play | — |
| OP14-107 | Shakuyaku | 12 | OP14-041 | onPlay, trigger | — | draw, play, trashFromHand | — |
| OP14-112 | Boa Hancock - OP14-112 | 12 | OP14-041 | onPlay, trigger | — | move, play | — |
| OP14-114 | Ran | 12 | OP14-041 | activateMain, oncePerTurn, trigger | — | giveDon, play | — |
| OP15-035 | Laboon | 12 | OP13-001 | replacement | — | (replacement ability) | — |
| OP15-061 | Ohm | 12 | OP15-058 | onPlay, whenAttacking | donMinus | draw, powerMod | — |
| OP15-067 | Shura | 12 | OP15-058 | onPlay, permanent | donMinus | draw, grantKeyword | — |
| OP15-075 | El Thor | 12 | OP15-058 | counter, main | donMinus | ko, powerMod | — |
| OP15-076 | Lightning Beast Kiten | 12 | OP15-058 | counter, main | donMinus | draw, powerMod | — |
| OP15-077 | Lightning Dragon | 12 | OP15-058 | main | donMinus | draw, skipRefresh | — |
| OP15-101 | Kalgara | 12 | OP08-098 | onPlay | trashFromHand | lookAtTop | — |
| OP15-114 | Wyper | 12 | OP08-098 | activateMain, oncePerTurn, onPlay | lifeFaceUp | giveDon, ko, powerMod | — |
| OP16-064 | Koby | 12 | OP12-061 | onPlay | — | lookAtTop | — |
| OP16-065 | Sakazuk | 12 | OP12-061 | activateMain, oncePerTurn, onPlay | donMinus, restDon | addDon, powerMod | — |
| OP16-078 | Marineford | 12 | OP12-061 | activateMain, onPlay | donMinus, restSelf | draw, lookAtTop, trashFromHand | — |
| OP16-113 | Boa Marigold | 12 | OP14-041 | permanent, trigger | — | grantKeyword, play | — |
| OP17-040 | Edward.Newgate (040) | 12 | OP17-039 | autoEvent, oncePerTurn, onPlay | — | draw, powerMod | — |
| OP17-045 | Kyo | 12 | OP17-039 | onPlay, replacement | — | (replacement ability), draw, trashFromHand | — |
| OP17-046 | Gloriosa | 12 | OP17-039 | keyword, onPlay | — | move | Blocker |
| OP17-048 | Shiki (048) | 12 | OP17-039 | oncePerTurn, keyword, onOpponentAttack, whenAttacking | trashFromHand | powerMod | RushCharacter |
| OP17-049 | Charlotte Linlin (049) | 12 | OP17-039 | oncePerTurn, onOpponentAttack, onPlay | trashFromHand | chooseOne, draw, powerMod, trashFromHand | — |
| OP17-054 | Miss Buckingham Stussy | 12 | OP17-039 | activateMain, onPlay | restDon, restSelf | restrict | — |
| OP17-055 | There's No Authority in the World That Lasts Forever!!! | 12 | OP17-039 | counter, main | restDon | grantKeyword, powerMod | — |
| OP17-056 | Rocks Pirates | 12 | OP17-039 | counter, main | restDon | move, powerMod | — |
| OP17-073 | Basil Hawkins | 12 | OP17-058 | onPlay | trashFromHand | addDon | — |
| OP17-094 | Rodo | 12 | OP17-079 | permanent | — | costMod | — |
| OP17-118 | Rocks.D.Xebec (118) | 12 | OP17-039 | fromHand, onPlay | — | counterMod, draw, play | — |
| P-088 | Trafalgar Law (Event Pack Vol. 7) | 12 | OP12-061 | trigger | — | play | — |
| P-093 | Trafalgar Law (Illustration Box Vol.6) | 12 | OP12-061 | keyword, onPlay | — | addDon | Blocker |
| ST21-014 | Monkey.D.Luffy (014) | 12 | ST30-001 | keyword, whenAttacking | — | giveDon | Rush |
| ST30-012 | Monkey.D.Luffy | 12 | ST30-001 | onPlay, whenAttacking | restDon | grantKeyword, rest | — |
| ST31-001 | Sanji | 12 | ST30-001 | donX, onPlay, permanent | — | draw, grantKeyword, play | — |
| OP08-051 | Buckin | 11 | OP17-039 | yourTurn, onPlay | — | powerMod | — |
| OP08-109 | Mont Blanc Noland | 11 | OP08-098 | onPlay | — | move | — |
| OP09-078 | Gum-Gum Giant | 11 | OP09-062 | counter | donMinus, trashFromHand | draw, powerMod | — |
| OP17-050 | Streusen (050) | 11 | OP17-039 | onPlay | — | draw, lookAtTop | — |
| OP17-062 | Kaido (062) | 11 | OP17-058 | autoEvent, oncePerTurn, yourTurn, keyword | — | addDon, returnDon, setActive | Blocker |
| OP05-038 | Charlestone | 10 | OP13-001 | counter, trigger | — | powerMod, rest, setActive, trashFromHand | — |
| OP13-118 | Monkey.D.Luffy (118) | 10 | OP13-001 | keyword, onPlay | — | restrict, setActive | DoubleAttack |
| OP15-071 | Holly | 10 | OP15-058 | opponentTurn, permanent | — | grantKeyword, setBasePower | — |
| OP15-108 | Nami (OP15-108) | 10 | OP08-098 | onPlay | — | lookAtTop | — |
| OP17-017 | Ga Ha Ha Ha!! | 10 | ST30-001 | counter | — | powerMod | — |
| OP17-061 | Lead Performers | 10 | OP17-058 | activateMain, onPlay | donMinus, trashSelf | move, play | — |
| ST34-003 | Charlotte Brulee | 10 | OP09-062 | onPlay | — | lookAtTop | — |
| ST34-004 | Charlotte Linlin | 10 | OP17-058 | onPlay | donMinus, trashFromHand | move, setBasePower | — |
| OP08-115 | The Earth Will Not Lose! | 9 | OP08-098 | counter, trigger | — | draw, play, powerMod, trashFromHand | — |
| OP12-112 | Baby 5 (112) | 9 | OP09-062 | trigger | — | draw | — |
| OP13-040 | I Know You're Strong... So I'll Go All Out from the Very Start!!! | 9 | OP13-001, ST30-001 | counter, main | restDon | powerMod, skipRefresh | — |
| OP13-076 | Divine Departure | 9 | OP12-061, OP15-058 | counter, main | restDon, trashFromHand | powerMod | — |
| OP10-067 | Senor Pink | 8 | OP15-058 | onPlay | donMinus | move, setActive | — |
| OP15-032 | Brook (OP15-032) | 8 | OP13-001, ST30-001 | activateMain, onPlay | trashSelf | rest, setActive | — |
| OP15-074 | Varie | 8 | OP15-058 | counter, main | donMinus | costMod, draw, powerMod | — |
| OP17-052 | Don Marlon | 8 | OP17-039 | onPlay | — | move | — |
| OP17-063 | Kaido (063) | 8 | OP17-058 | activateMain, oncePerTurn, permanent | donMinus | counterMod, ko, negateEffects | — |
| OP17-110 | Charlotte Perospero | 8 | OP05-098, OP09-062 | yourTurn, onPlay, trigger | — | grantKeyword, play | — |
| ST31-004 | Monkey.D.Luffy (ST31-004) | 8 | OP13-001 | onPlay, permanent | — | grantKeyword, powerMod | — |
| OP05-077 | Gamma Knife | 7 | OP15-058 | main, trigger | donMinus | addDon, powerMod | — |
| OP08-036 | Electrical Luna | 7 | OP13-001 | main, trigger | — | rest, skipRefresh | — |
| OP12-108 | Donquixote Rosinante (108) | 7 | OP12-061 | onPlay | — | lookAtTop | — |
| OP15-118 | Enel (OP15-118) | 7 | OP15-058 | onPlay, permanent | donMinus | lookAtTop, powerMod, restrict, trashFromHand | — |
| OP17-044 | Captain John | 7 | OP17-039 | activateMain, permanent | restSelf | draw, restrict, trashFromHand | — |
| ST01-011 | Brook | 7 | OP13-004 | onPlay | — | giveDon | — |
| OP06-106 | Kouzuki Hiyori | 6 | OP14-041 | onPlay | lifeToHand | move | — |
| OP11-054 | Nami (054) | 6 | OP14-041 | keyword, onPlay | — | draw, lookAtTop, move | Blocker |
| OP12-037 | Demon Aura Nine Sword Style Asura Blades Drawn Dead Man's Game | 6 | OP13-001, ST30-001 | counter, main | restDon | powerMod, rest | — |
| OP14-108 | Silvers Rayleigh | 6 | OP14-041 | onPlay, trigger | — | activateAbility, ko | — |
| OP17-065 | Queen | 6 | OP17-058 | keyword, onPlay | donMinus | draw, restrict | Banish |
| OP17-083 | Jinbe (083) | 6 | OP13-004 | permanent | — | grantKeyword, powerMod | — |
| OP17-090 | Franky | 6 | OP17-079 | onPlay, permanent | — | ko, powerMod | — |
| OP17-098 | Gum-Gum Kong Gun | 6 | OP13-004, OP17-079 | counter, main | restDon | ko, powerMod | — |
| EB01-059 | Kingdom Come | 5 | OP05-098, OP08-098 | main, trigger | — | ko, move | — |
| OP07-076 | Slow-Slow Beam Sword | 5 | OP12-061, OP17-058 | counter, trigger | donMinus | addDon, powerMod, rest | — |
| OP15-119 | Monkey.D.Luffy (OP15-119) | 5 | OP08-098 | permanent | — | grantKeyword, powerMod, reveal | — |
| OP17-042 | Kaido (042) | 5 | OP17-039 | keyword, onPlay | revealFromHand | powerMod | Blocker |
| OP17-096 | I'm Luffy!! The Man Who Will Be King of the Pirates!! | 5 | OP13-004 | counter, trigger | — | move, powerMod | — |
| ST17-004 | Boa Hancock | 5 | OP14-041 | onPlay | — | giveDon, lookAtTop | Blocker |
| EB02-052 | Enel | 4 | OP05-098 | permanent, whenAttacking | trashFromHand | grantKeyword, move, powerMod | — |
| OP10-114 | X.Drake | 4 | OP12-061 | activateMain | restSelf | rest | — |
| OP13-037 | Roronoa Zoro | 4 | OP13-001, ST30-001 | endOfYourTurn, onPlay | — | setActive | — |
| OP14-118 | You'll Frighten Me... | 4 | OP14-041 | counter, trigger | — | play, restrict | — |
| OP15-066 | Satori | 4 | OP15-058 | onPlay, whenAttacking | donMinus | draw, lookAtTop | — |
| OP15-069 | Nola | 4 | OP17-058 | replacement | — | (replacement ability), returnDon | — |
| OP16-067 | Tsuru | 4 | OP12-061 | onPlay | — | lookAtTop, trashFromHand | — |
| OP17-022 | Shanks (022) | 4 | OP13-001 | keyword, onPlay | — | rest, setActive | Rush |
| OP17-075 | X.Drake | 4 | OP17-058 | onPlay | donMinus | trashFromHand | — |
| ST14-017 | Thousand Sunny | 4 | OP17-079 | onPlay, permanent | — | costMod, draw | — |
| EB04-030 | Kaido | 3 | OP17-058 | onPlay, replacement | donMinus | (replacement ability), grantKeyword, rest, returnDon | — |
| OP05-098 | Enel (098) | 3 | OP05-098 | autoEvent, oncePerTurn, opponentTurn | — | move, trashFromHand | — |
| OP05-114 | El Thor | 3 | OP08-098 | counter, trigger | — | ko, powerMod | — |
| OP06-017 | Meteor-Strike of Love | 3 | ST30-001 | counter, main | lifeToHand | powerMod | — |
| OP08-074 | Black Maria | 3 | OP17-058 | activateMain, oncePerTurn | — | addDon, delayed, returnDon | — |
| OP08-098 | Kalgara (098) | 3 | OP08-098 | donX, whenAttacking | — | move, play | — |
| OP09-062 | Nico Robin (062) | 3 | OP09-062 | keyword, whenAttacking | trashFromHand | addDon | Banish |
| OP12-006 | Shakuyaku | 3 | ST30-001 | onPlay | — | lookAtTop | — |
| OP12-018 | Color of the Supreme King Haki | 3 | ST30-001 | counter | — | powerMod, rest | — |
| OP12-061 | Donquixote Rosinante (061) | 3 | OP12-061 | activateMain, oncePerTurn, replacement | donMinus | (replacement ability), costMod, delayed, move | — |
| OP13-001 | Monkey.D.Luffy (001) | 3 | OP13-001 | donX, onOpponentAttack | — | powerMod, rest | — |
| OP13-004 | Sabo (004) | 3 | OP13-004 | donX, permanent | — | powerMod | — |
| OP14-041 | Boa Hancock - OP14-041 | 3 | OP14-041 | autoEvent, donX, oncePerTurn, opponentTurn | — | draw, move | — |
| OP15-058 | Enel (OP15-058) | 3 | OP15-058 | activateMain, oncePerTurn, rulesModifier | — | (rules: donDeckSize), addDon, giveDon | — |
| OP15-092 | Monkey.D.Luffy (OP15-092) | 3 | OP13-004, OP17-079 | permanent | — | costMod, powerMod, setBasePower | — |
| OP17-039 | Rocks.D.Xebec (039) | 3 | OP17-039 | whenAttacking | trashFromHand | draw, reveal | — |
| OP17-058 | Kaido (058) | 3 | OP17-058 | oncePerTurn, onOpponentAttack, whenAttacking | donMinus | powerMod | — |
| OP17-060 | Ulti & Page One | 3 | OP17-058 | onPlay | — | addDon, ko | — |
| OP17-076 | Wo Ro Ro Ro Ro... I Think I've Sobered Up | 3 | OP17-058 | counter, trigger | donMinus, trashFromHand | draw, powerMod | — |
| OP17-077 | Kundali Dragon Swarm | 3 | OP17-058 | counter, main | donMinus, restDon, trashFromHand | addDon, powerMod | — |
| OP17-079 | Monkey.D.Luffy (079) | 3 | OP17-079 | permanent | — | grantKeyword | — |
| OP17-091 | Brook | 3 | OP17-079 | onPlay, permanent | — | powerMod, trashFromHand | — |
| OP17-111 | Charlotte Mont-d'or | 3 | OP09-062 | onPlay, trigger | revealFromHand | ko, play | — |
| ST30-001 | Luffy & Ace | 3 | ST30-001 | opponentTurn, permanent | — | powerMod | — |
| EB01-056 | Charlotte Flampe | 2 | OP05-098 | onPlay | lifeToHand | draw | — |
| EB04-059 | Black Rope Dragon Twiste | 2 | OP05-098 | main, trigger | lifeFaceUp | draw, ko, trashFromHand | — |
| OP01-055 | You Can Be My Samurai!! | 2 | ST30-001 | main | restOwnCharacters | draw | — |
| OP05-115 | Two-Hundred Million Volts Amaru | 2 | OP08-098 | main, trigger | trashFromHand | move, powerMod, rest | — |
| OP06-058 | Gravity Blade Raging Tiger | 2 | OP14-041 | main, trigger | — | move | — |
| OP07-057 | Perfume Femur | 2 | OP14-041 | main, trigger | — | draw, powerMod, restrict | — |
| OP08-099 | Kalgara (099) | 2 | OP08-098 | — | — | — (vanilla) | — |
| OP09-072 | Franky | 2 | OP15-058 | keyword, onPlay | donMinus, trashFromHand | draw | Blocker |
| OP13-113 | Lilith | 2 | OP05-098 | onPlay, trigger | — | activateAbility, lookAtTop | — |
| OP14-019 | I Have a Plan to Take Down One of the Four Emperors!! | 2 | ST30-001 | main, trigger | — | draw, lookAtTop | — |
| OP14-096 | Ground Death | 2 | OP13-004 | counter, main | restDon | negateEffects, powerMod | — |
| OP15-112 | Raki | 2 | OP08-098 | keyword, onPlay | — | play | Blocker |
| OP16-077 | "Buddha" Sengoku | 2 | OP12-061 | main | — | lookAtTop, trashFromHand | — |
| OP16-117 | Black Hole | 2 | OP09-062 | main, trigger | trashFromHand | move, negateEffects | — |
| OP17-023 | Nami (023) | 2 | OP13-001 | replacement | — | (replacement ability), rest | — |
| ST21-003 | Sanji | 2 | OP13-001 | onPlay | — | restrict | — |
| ST21-017 | Gum-Gum Mole Pistol | 2 | ST30-001 | main, trigger | — | activateAbility, ko, powerMod | — |
| EB02-021 | Gum-Gum Giant Pistol | 1 | ST30-001 | main, trigger | — | powerMod, rest, skipRefresh | — |
| EB04-040 | Flame Dragon Torch | 1 | OP17-058 | counter, main | donMinus, restDon | powerMod, rest | — |
| OP07-064 | Sanji | 1 | OP15-058 | fromHand, keyword | — | costMod | Blocker |
| OP11-012 | Franky | 1 | ST30-001 | autoEvent, oncePerTurn, yourTurn | — | powerMod | — |
| OP12-038 | Two-Sword Style Rashomon | 1 | ST30-001 | counter, main | restDon | ko, powerMod | — |
| OP17-059 | Aramaki | 1 | OP12-061 | keyword, onPlay | donMinus | draw, ko | Blocker |

