# M6b-1 runtime audit, slice 1: block 5, block X, block 1 exceptions and EB-05

Written for PLAN §2a M6b-1, using the method of `docs/research/m4b-runtime-audit.md` (sections 1, 3, 4). Inputs: `cards/data/coverage-report.json` (`backlog` entries with block 5, `X` or 1), every card of `cards/data/sets/EB-05.json` that is not in `SCRIPTED_ID_LIST` and has effect or trigger text, the verified text with `cards/overrides/<ID>.json` where present, `cards/src/dsl.ts`, `cards/src/dsl-validate.ts` (`IMPLEMENTED`, `moveShape`, `zonesIn`), the runtime in `engine/src/effects/` (`run.ts`, `eval.ts`, `compile.ts`, `layers.ts`), `engine/src/flow.ts`, `engine/src/derive.ts`, `engine/src/ops/index.ts`, `engine/src/actions.ts`, effect-dsl.md, `rulings.md` and `rules-digest.md`. The tagger's tags were used as a hint only. Nothing here scripts a card.

## 1. Result

- **243 cards audited**: 188 coverage-report backlog entries (block 5: 180 cards from OP-17 57, OP-16 100, ST-30 13, ST-31 2, ST-32 5, ST-34 3; block X: EB04-061, OP17-005, OP16-063, OP16-073; block 1 exceptions: OP01-120, OP02-013, OP03-122, OP04-083) plus 55 EB-05 cards (61 in the set; the other 6 have no effect text). 10 are Leaders (OP17-001, OP17-020, OP17-099, OP16-001, OP16-022, OP16-041, OP16-060, OP16-079, OP16-080, EB05-010), 2 are Stages (OP17-057, OP16-021), 39 are Events.
- **193 cards need nothing new**: every shape they use is already in `IMPLEMENTED` and runs (including the 2 keyword-only cards OP16-044 and OP16-088, which are a bare [Blocker]).
- **50 cards need at least one gap** (EB05-048 needs 2, ST32-003 needs 2). 26 distinct gaps, `B5-G1` to `B5-G26`.
- **3 cards are unexpressible without a design decision**: OP16-080 (redirect an attack's target), EB05-052 (replace "you would take damage"), OP16-079 (an event whose effect acts on the event's subject, and a play-origin zone). OP17-020 (a cost worded "A or B") is a smaller design decision with a clean DSL answer (B5-G13).
- The 26 gaps are mostly small and local. Only B5-G19 (redirect attack) and B5-G20 (replacement on damage) are large. B5-G1 (an `attribute` filter) alone unblocks 9 cards across ST-32 and EB-05 and is a few lines in three files.
- **Every card in this slice is `verified: false`** in `cards/data/sets/*.json` (one OP-17 card has an override file, the others none). The scripting wave must verify text first (PROMPT.md M1). Several texts have visible defects, listed in section 4 (Q1, Q2).

## 2. Card table

Grouped by set, newest first, Leaders first. "none" means every shape the card needs is already implemented and the runtime supports it. Shapes are in short form: costs before the colon, "if/then" for conditions, "Counter" for a battle power effect.

### EB-05 (legality unknown; first scripting batch with OP-18): 55 cards

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| EB05-010 | Nico Robin | [Once Per Turn] koed event (own Character, Wisdom attribute, no [Blocker]) -> deckTop to Life; [Activate: Main] OPT setActive Character (attribute, power<=6000) | B5-G1 |
| EB05-001 | Jewelry Bonney | [On Play] if leader type: draw, play upTo 2 from hand (power<=2000); [Activate: Main] OPT power -1000 until opp next End Phase (power>=6000) | none |
| EB05-002 | Doll | [On Play] lookAtTop 5 take upTo 2 (type, cost>=2) rest bottom; trashFromHand | none |
| EB05-004 | Baby 5 | [On Play] cost reveal 2 Events, draw 2; [On K.O.] play from hand rested (power<=6000) | none |
| EB05-005 | Belo Betty | [On Play] power +2000 upTo 3 (type and hasTrigger); [Activate: Main] cost trashSelf, power -2000 | none |
| EB05-006 | Miss Buckingham Stussy | [Activate: Main] OPT cost lifeToHand top; chooseOne power +3000 / -4000 on any Character | none |
| EB05-007 | Monet | [On Play] cost reveal 3 (Event or type), draw 1; [End of Your Turn] power +5000 self until opp next End Phase | none |
| EB05-008 | Luffy, Now's Your Chance | [Main] cost: give 1 active DON!! to Leader + reveal 2 red Events; power -7000 on rested opp Character; [Counter] if no Character cost>=5, power | B5-G11 |
| EB05-009 | Fight and Die with Me!!! | [Main] power +1000 to all Characters base power<=4000 until opp next End Phase; [Counter] Leader power | none |
| EB05-011 | Otohime | [On Play] if leader named: cost turn top Life face-down; rest opp Character cost<=5 | B5-G12 |
| EB05-012 | Camie | [On Play] rest opp Character cost<=6 | none |
| EB05-013 | Shirley | [On Opponent's Attack] OPT cost restDon 1; power +2000 to Leader of type A or B | none |
| EB05-014 | Shirahoshi | [On Play] lookAtTop 5 take upTo 2 (name or type) rest trash; [Activate: Main] cost restSelf, grant Rush (type, power<=6000) | none |
| EB05-016 | Nico Robin | [Your Turn][On Play] play from hand (cost<=5, Wisdom attribute); [Trigger] rest opp Character | B5-G1 |
| EB05-017 | Mermaid Cafe Dancers | [On Opponent's Attack] cost restDon 1 + trashSelf; Leader power +4000 battle (type A or B) | none |
| EB05-018 | Rebecca | [On Play] skipRefresh on opp rested Character cost<=6 | none |
| EB05-019 | I Choose to Open This Country to the World!! I Want to Fight on Your Side!!! | [Counter] cost rest 1 of your cards; power battle; [Trigger] if opp Life<=3 play from hand (type, power<=6000) | none |
| EB05-020 | My name is Shirahoshi!! | [Main] cost rest your Leader [Shirahoshi] (rest selector, name filter, costOptional); draw 2 | none |
| EB05-021 | Alvida | [On Play] draw 2, play from hand (type, cost<=8), restrict player cannotPlay Character; [When Attacking] negate opp Character thisTurn | none |
| EB05-022 | Octopako | [On K.O.] draw 2 | none |
| EB05-023 | Osome | [On Play] cost trash 2 Events; draw 3 | none |
| EB05-024 | Little Sadi | permanent: if leader type, grant Blocker + cost +2 on self | none |
| EB05-025 | Domino | [On Play] lookAtTop 3 take 1 (type) rest bottom; [Trigger] activate [On Play] | none |
| EB05-027 | Hibari | [On Play] draw 3, trash 2, move opp-or-own Character cost<=2 to deck bottom | none |
| EB05-028 | Boa Hancock | [On Play] if opp hand>=9, opponent trashFromHand 4 (chooser opponent) | none |
| EB05-029 | Kimono Sleeve Cage | [Main] cost trash 1 from hand; select opp Character cost<=6, negate, move to hand (bound ref) | none |
| EB05-030 | Take Care, Everybody. | [Main] if leader named, move any Character cost<=5 to hand; [Counter] draw 1, power thisTurn | none |
| EB05-031 | Vinsmoke Reiju | [On Play] DON!! -1: if leader type, trash 10 from top of deck (mill as an effect); [Activate: Main] cost trashSelf, if opp Character base power>=8000 addDon 4 active | B5-G6 |
| EB05-033 | Nico Robin | [On Play] if leader type and donOnField(opp)-donOnField(you)>=6 (sum with mul -1): draw 3, trash 2, addDon 4 rested | none |
| EB05-034 | Sugar | [On Play] DON!! -2: if donOnField>=7, power -4000 | none |
| EB05-035 | Speed | [On Play] DON!! -1: lookAtTop 5 take upTo 2 (type) rest bottom; play upTo 2 from hand (type, power<=5000) | none |
| EB05-036 | Tsuru | [On Play] if leader type: draw 1, addDon 1 rested | none |
| EB05-037 | Black Maria | [On Play] lookAtTop 3 take 1 (type) rest bottom | none |
| EB05-038 | Russian | [On Play] power +3000 to [Senor Pink] | none |
| EB05-039 | Pink Hornet | [Main] DON!! -1: if leader type, power -4000; [Counter] DON!! -1: Leader power battle | none |
| EB05-040 | You Need Me, Don't You?!! | [Main] cost: return 1 ACTIVE DON!! to the deck; if leader type draw 3, trash 1; [Counter] Leader power | B5-G7 |
| EB05-042 | Shinobu | [On Play] draw 2, trash 2 | none |
| EB05-043 | Perona | [On K.O.] chooseOne (K.O. / rest) opp Character cost<=6 | none |
| EB05-044 | Ms. Father's Day | [On Play] if leader typeIncludes and opp has Character cost 0: power -1000 on opp Leader | none |
| EB05-045 | Ms. Monday | [On Play] ko own Character (typeIncludes); [On K.O.] lookAtTop 3 take 1 (typeIncludes) rest trash | none |
| EB05-046 | Yamato | permanent: if opp has Character base power>=8000, grant Blocker + power +3000; [On Opponent's Attack] cost trash 1; if trash>=10 setBasePower Leader 7000 thisTurn | none |
| EB05-047 | Ripley | permanent cost +12 self; [On Play] cost trash 1; play from trash (cost<=2) | none |
| EB05-048 | Hedgehog Stinger | [Main] cost: restDon 1 + K.O. own Character (typeIncludes); opp Characters with cost 0 cannot activate [Blocker] thisTurn; [Counter] Leader power | B5-G2, B5-G4 |
| EB05-049 | Special Hollow | [Main]/[Counter] cost K.O. own Character (type); cost -3 on opp Character / power +4000 battle | B5-G2 |
| EB05-050 | Atlas | [On Play] lookAtTop 4 take 1 (Wisdom attribute) rest bottom; [Trigger] activate [On Play] | B5-G1 |
| EB05-051 | Ahiru | [On Play] rest opp Character cost<=Life total of both (Cmp lte Num life both); [Trigger] play this card | none |
| EB05-052 | Gloriosa | replacement: if you would take damage, trash this Character instead; [Trigger] draw 2, trash 1 | B5-G20 |
| EB05-053 | Charlotte Praline | [When Attacking] OPT if opp hand>=9: move 1 hand card to top of Life | none |
| EB05-054 | Charlotte Brulee | [Trigger] play upTo 2 from hand (type, power 4000) | none |
| EB05-055 | Nami | [Your Turn][On Play] if leader Wisdom attribute: deckTop to Life; [Trigger] cost trash 1: if Life<=2 play this card | B5-G1 |
| EB05-056 | Nico Olvia | [On Play] cost trash 1 card with a Trigger: if leader named, draw 2; [Trigger] play this card | none |
| EB05-057 | Nojiko | [Activate: Main] OPT giveDon rested to Leader/Character (Special or Wisdom attribute); [Trigger] if Life<=2 play from hand (power<=6000, hasTrigger) | B5-G1 |
| EB05-059 | Charlotte Pudding!! | [Main] draw 1; Characters (base power 4000, type) cannot be K.O.'d IN BATTLE until opp next End Phase; [Trigger] draw 1, play from hand (power 4000, hasTrigger) | B5-G10 |
| EB05-060 | Take Care of Lilith!!! | [Main] cost: trash own {Egghead} Character cost>=5; deckTop to Life; [Counter] cost turnLifeFaceUp 1, power battle | B5-G2 |
| EB05-061 | Nami | replacement OPT: removed by opponent (base power<=6000): cost lifeToHand top instead; [On Play] play from hand (red, cost<=2) | none |

### OP-17 (block 5): 58 cards

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| OP17-020 | Shanks | [Activate: Main] OPT cost: trash 1 from hand OR rest 1 DON!!; skipRefresh on opp rested Character | B5-G13 |
| OP17-001 | Edward.Newgate | [On Opponent's Attack] OPT cost trash 1; power +4000 battle | none |
| OP17-099 | Charlotte Linlin | [When Attacking] cost trash 1; chooseOne (chooser opponent): trashFromHand + deckTop to Life / blind trash from opp hand | none |
| OP17-041 | Wang Zhi | Blocker; [On Play] cost trash 1; move all opp Characters base cost 1 to deck bottom (owner orders) | none |
| OP17-103 | Charlotte Katakuri | [Your Turn][On Play] if leader type: deckTop to Life, power -3000; [Trigger] play this card | none |
| OP17-104 | Charlotte Cracker | [Your Turn][On Play] cost restDon 2: if leader type deckTop to Life; [Trigger] play this card | none |
| OP17-031 | Yasopp | [On Play] draw 1, rest opp Character cost<=8; [End of Your Turn] setActive Character (typeIncludes) | none |
| OP17-027 | Benn.Beckman | Rush: Character; [On Play] if leader type: draw 1, rest up to 2 opp Characters | none |
| OP17-032 | Limejuice | [On Play] lookAtTop 3 take 1 (typeIncludes) rest bottom | none |
| OP17-029 | Hongo | Blocker; [On Play] setActive DON!!, rest up to 2 opp Characters cost<=2 | none |
| OP17-033 | Lucky.Roux | [On Play] lookAtTop 3; [On Opponent's Attack] cost trashSelf; rest opp Leader or Character | none |
| OP17-036 | Withdraw Now and Allow Me to Save Face | [Main] cost restDon 6; rest, K.O. up to 2 rested cost<=6; [Counter] power on [Shanks] | none |
| OP17-019 | I Don't Have Time to Chat with Snot-Nosed Brats | [Main] lookAtTop 5 (typeIncludes); [Trigger] Leader power thisTurn | none |
| OP17-021 | Crone Oil | replacement: removed by opp effect (Character typeIncludes): rest 1 of your cards instead | none |
| OP17-043 | Ganzui | replacement: if this Character would be removed (any cause), cost trash 2 instead; [On Play] setBasePower Leader 6000 until opp next End Phase | B5-G21 |
| OP17-037 | Are You That Afraid of the New Era?! | [Main] lookAtTop 5 (typeIncludes); [Counter] cost rest 1 of your cards; power battle | none |
| OP17-003 | Izo | Rush: Character; [On Play] if leader named or type: power -6000 on opp rested Character | none |
| OP17-008 | Jozu | [On Play] setBasePower [Edward.Newgate] Leader 8000 until opp next End Phase | none |
| OP17-026 | Fugar | [When Attacking] if leader type: rest opp Character cost<=2; [On K.O.] draw 1 | none |
| OP17-002 | Atmos | permanent (opponent's turn): power +3000 self | none |
| OP17-016 | Rakuyo | [On Play] K.O. up to 2 opp Characters base power<=2000 | none |
| OP17-028 | Bonk Punch & Monster | Blocker; [On Play] K.O. opp rested Character cost<=6 | none |
| OP17-067 | Kurozumi Kanjuro | [On Play] DON!! -1: if Character cost>=10, rest opp Character | none |
| OP17-038 | I Think He's Seen an Ugly Future... | [Main] cost rest 4 of your cards: rest opp Character; [Counter] cost trash 1; power battle | none |
| OP17-068 | Sasaki | [When Attacking] cost trash 2: if leader type addDon 2 rested | none |
| OP17-015 | Marco | replacement: removed by opp effect: ko this Character instead; [On K.O.] cost trash 1 (typeIncludes): play self from trash | none |
| OP17-069 | Jack | Rush: Character; [On Play] DON!! -1: if leader type power -2000 | none |
| OP17-004 | Inuarashi & Nekomamushi | [On Play] grant Rush to Character (type or typeIncludes) | none |
| OP17-009 | Haruta | permanent (opponent's turn): power +3000; [On Play] K.O. base power<=2000 | none |
| OP17-071 | Who's.Who | [On Play] DON!! -1: K.O. up to 2 cost<=2; [Trigger] play this card | none |
| OP17-108 | Charlotte Brulee | Blocker; [Trigger] rest opp Character cost<=6 | none |
| OP17-117 | Maser Saber | [Counter] power on [Charlotte Linlin]; [Trigger] opponent may trash 3 from hand, if not K.O. cost<=6 (if hand>=3 + chooseOne chooser opponent) | none |
| OP17-078 | Drunken Dragon Bagua | [Main] cost restDon 2 + trash 2: if leader type addDon 3 rested; [Counter] power | none |
| OP17-115 | Don't you know that even in the cruel world of pirates there's still a code of honor?!! | [Main] grant Unblockable to [Charlotte Linlin] Leader; [Counter] power | none |
| OP17-007 | Kouzuki Oden | [On Play] if leader named or type: play from hand (type, typeIncludes, power<=6000) | none |
| OP17-057 | Fullalead | Stage: [On Opponent's Attack] cost restSelf + trash 1; power +1000 battle (Leader or Character, typeIncludes) | none |
| OP17-012 | Blenheim | Blocker; [On K.O.] play from hand (cost 1, typeIncludes) | none |
| OP17-030 | Monkey.D.Luffy | [On Play] cost restDon 1: grant Rush self; [Activate: Main] OPT if hand<=5 setActive DON!! | none |
| OP17-034 | Rockstar | [Activate: Main] OPT if opp Leader power>=6000: setActive DON!!; setBasePower own Leader (type) until opp next End Phase | none |
| OP17-053 | Barbell | [On K.O.] opponent moves 2 hand cards to deck bottom (chooser opponent); [Activate: Main] OPT cost trash 1; power self | none |
| OP17-116 | Fulgora | [Main] cost restDon 2; K.O. opp Stage; [Counter] if 2+ Characters with hasTrigger, power battle | B5-G9 |
| OP17-072 | Black Maria | Blocker; [On Opponent's Attack] OPT cost trash 1; power +1000 battle | none |
| OP17-097 | I'll Feed on This Rage and Use It to Bring the World to Ruin!!! | [Main] cost -1 on all opp Characters thisTurn; [Counter] Leader power battle | none |
| OP17-013 | Portgas.D.Ace | permanent (hand): if opp has Character power>=10000 cost -2; [On Play] if leader named: power -6000 on opp rested Character | none |
| OP17-014 | Whitey Bay | [On Play] K.O. base power<=2000; [On Opponent's Attack] cost trashSelf; Leader power +1000 battle | none |
| OP17-018 | The Power to Destroy the World | [Main] cost restDon 2; K.O. opp Stage; [Counter] if 2+ Characters base power>=8000, power battle | B5-G9 |
| OP17-024 | Howling Gab | Banish; [On Play] rest opp Character | none |
| OP17-064 | King | Blocker; [On Opponent's Attack] OPT cost trash 1; power +2000 battle | none |
| OP17-010 | Fossa | [Activate: Main] OPT if opp Character power>=10000 and no other [Fossa]: grant Blocker + power +2000 until opp next End Phase | none |
| OP17-011 | Blamenco | [DON!! x2][When Attacking] power -4000 on opp Character | none |
| OP17-025 | Building Snake | [On K.O.] K.O. opp rested Character cost<=6; [Activate: Main] OPT giveDon rested to [Shanks] Leader | none |
| OP17-047 | Shiki | [End of Your Turn] if hand<=2: opponent moves 1 hand card to deck bottom | none |
| OP17-066 | Kurozumi Orochi | [On Play] DON!! -1: if Character cost>=10 draw 2, trash 1 | none |
| OP17-085 | Dorry | permanent cost +12 self; [On Play] if leader type: play [Brogy] cost<=5 from hand or trash; restrict player cannotPlay Character | none |
| OP17-092 | Brogy | permanent cost +12 self; [On Play] if leader type: play [Dorry] cost<=5 from hand or trash; restrict player cannotPlay Character | none |
| OP17-101 | Caribou | [Activate: Main] OPT cost lifeToHand top; power -3000; [Trigger] cost trash 1; K.O. cost<=5 | none |
| OP17-105 | Charlotte Chiffon | [On Play] cost trash 1 card with hasTrigger; move opp Character with hasTrigger to hand | none |
| OP17-005 | Edward.Newgate | permanent (hand): if opp has Character power>=10000 cost -4; [On Play] setBasePower monocolored Leader 8000 until opp next End Phase | none |

### ST-34 (block 5): 3 cards

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| ST34-002 | Charlotte Cracker | [On Play] if leader type: addDon 1 rested; K.O. cost<=2 | none |
| ST34-001 | Charlotte Katakuri | [Your Turn][Once Per Turn] donReturned event: if leader type addDon 2 rested; [On K.O.] play from hand (power<=8000) | none |
| ST34-005 | Baron Tamago & Pekoms | [When Attacking] DON!! -1: K.O. base power<=2000 | none |

### ST-32 (block 5): 5 cards

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| ST32-002 | Kouzuki Oden | [On Play] draw 1; opp Character base cost<=6 cannot be rested until opp next End Phase | B5-G5 |
| ST32-001 | Kin'emon | [On Play] cost: rest attribute Leader OR 1 DON!! (rest selector [leader, donCostArea]); draw 2, trash 1 | B5-G1 |
| ST32-005 | Roronoa Zoro | Rush: Character; [On Play] if leader attribute: rest opp Character cost<=2 | B5-G1 |
| ST32-003 | Dracule Mihawk | [Your Turn] timing "this Character becomes rested": draw 1, trash 1; [On Play] if leader attribute: play from hand (cost<=5, [Perona] or attribute) | B5-G1, B5-G17 |
| ST32-004 | Silvers Rayleigh | permanent: if leader attribute grant Rush: Character self; [On Play] rest up to 2 opp Characters cost<=2 | B5-G1 |

### ST-31 (block 5): 2 cards

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| ST31-002 | Jinbe | Blocker; [On Play] draw 1, play from hand (type, cost 1) | none |
| ST31-003 | Brook | permanent (opponent's turn): if donGiven(you)>=3 grant Blocker + power +3000 self | none |

### ST-30 (block 5): 13 cards

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| ST30-004 | Emporio.Ivankov | [On Play] cost reveal 2 Characters power 6000; draw 3, trash 2 | none |
| ST30-014 | Mr.3(Galdino) | [Activate: Main] cost restSelf; giveDon up to 2 rested each to up to 2 Characters (base power 6000) | B5-G25 |
| ST30-016 | Can You Still Fight, Luffy?! Of Course!! | [Counter] power battle; if [Ace] and [Luffy] Characters base power 6000 draw 1 | none |
| ST30-009 | LittleOars Jr. | replacement: Character base power 6000 removed by opp effect: trash this Character (move self) and draw 1 instead | none |
| ST30-006 | Jinbe | [On Play] cost trash 1 Character power 6000 from hand; draw 2 | none |
| ST30-002 | Inazuma | [On Play] lookAtTop 5 take 1 Character power 6000 rest bottom | none |
| ST30-003 | Edward.Newgate | permanent (your turn): power +1000 on Characters base power 6000 | none |
| ST30-007 | Portgas.D.Ace | [On Play] cost restDon 1: grant Rush self; [When Attacking] power -1000 on opp Character | none |
| ST30-008 | Marco | Blocker; [On K.O.] cost trash 1 Character power 6000: play self from trash rested | none |
| ST30-010 | Crocodile | Blocker; [On Play] skipRefresh on opp rested Character | none |
| ST30-011 | Buggy | replacement: Character base power 6000 removed by opp effect: restSelf instead; Blocker | none |
| ST30-015 | The Name of This Era Is "Whitebeard"!! | [Counter] if 2+ Characters base power 6000 power battle; [Trigger] K.O. power<=6000 | none |
| ST30-017 | And You Get Yourself in Big Trouble!! | [Main] lookAtTop 5 take 1 Character power 6000; [Trigger] activate [Main] | none |

### OP-16 (block 5, plus two block X cards: OP16-063, OP16-073): 102 cards

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| OP16-001 | Portgas.D.Ace | [Activate: Main] OPT grant Rush (name or typeIncludes, power>=8000) | none |
| OP16-079 | Yamato | auto: cardPlayed from TRASH ({Land of Wano} Character) -> grant Rush to THAT played Character | B5-G18 |
| OP16-022 | Monkey.D.Luffy | [Activate: Main] OPT if only Characters are type (none not type): setActive 2 DON!! | none |
| OP16-080 | Marshall.D.Teach | permanent (opponent's turn) cost +1 on all Characters; [On Opponent's Attack] OPT cost trash hasTrigger: change attack target | B5-G19 |
| OP16-041 | Buggy | [DON!! x1][Once Per Turn] when your {Impel Down} Character is removed from the field: play [Prisoner of Impel Down] from hand | B5-G15 |
| OP16-060 | Sengoku | [Activate: Main] cost return 8 ACTIVE DON!!; play up to 3 {Admiral} with different names from hand (pick distinctNames) | B5-G7 |
| OP16-021 | Moby Dick | Stage: [On Play] if leader type lookAtTop 3 take 1 rest bottom; [Activate: Main] cost trashSelf; giveDon rested | none |
| OP16-056 | Mr.3(Galdino) | [Activate: Main] cost trashSelf; draw 2; restrict cannotAttack opp Character cost<=9 until opp next End Phase | none |
| OP16-003 | Edward.Newgate | permanent (your turn): Leader gains Double Attack + power +2000; [On Play] cost reveal 2 Characters power 8000; power -6000 | none |
| OP16-014 | Marco | replacement: removed by opp effect: ko this Character instead; [On K.O.] cost trash Character power 8000: play self from trash | none |
| OP16-118 | Portgas.D.Ace | permanent: counter +2000 for Characters in hand power 8000; [On Play]/[On K.O.] lookAtTop 5 take 1 (name or typeIncludes) | none |
| OP16-017 | LittleOars Jr. | Blocker; permanent: if no Character (typeIncludes, cost>=8) power -4000 self | none |
| OP16-015 | Monkey.D.Luffy | permanent (hand): if leader name INCLUDES "Ace" and donOnField>=6 cost -2; [On Opponent's Attack] cost trash Character power 8000: setBasePower Leader + self 7000 | B5-G23 |
| OP16-042 | Prisoner of Impel Down | rules: any number of this card in deck | B5-G24 |
| OP16-011 | Vista | [On Play] cost reveal Character power 8000: draw 1; [DON!! x1][When Attacking] K.O. up to 2 base power<=2000 | none |
| OP16-108 | Shiryu | [On Play] cost trash 1: move type card cost<=6 from trash to top of Life face-up; [Trigger] draw 2 | none |
| OP16-055 | Mr.2.Bon.Kurei(Bentham) | [On Play] draw 1; [DON!! x1][When Attacking] setBasePower self = opp Leader power (select bind, refStat) | none |
| OP16-098 | Yamato | [On Play] draw 1, trash 1; [Activate: Main] cost trashSelf; play black [Yamato] cost 8 from trash | none |
| OP16-084 | Kouzuki Momonosuke | [Activate: Main] conditions self cost>=20; cost trashSelf; if donOnField>=9 play [Kouzuki Momonosuke] cost 9 from trash | none |
| OP16-087 | Shinobu | [On Play] cost trashSelf: if leader type draw 1, cost +20 thisTurn on [Kouzuki Momonosuke] | none |
| OP16-097 | Yamato | [On Play] move type Character cost<=6 trash to hand; play from hand cost<=2 | none |
| OP16-020 | If You're Coming with Me...Kiss Your Lives Goodbye!! | [Main] cost restDon 1 + reveal Character power 8000; draw 1; [Counter] cost trash 1; power battle | none |
| OP16-085 | Kouzuki Momonosuke | Blocker; [On Play] play type Character cost<=6 not named [Momonosuke] from trash | none |
| OP16-054 | Mr.1(Daz.Bonez) | permanent: [DON!! x1][Your Turn] if hand>=5 power +3000; [On Play] draw 1 | none |
| OP16-048 | Buggy | [On Play] if leader type draw 1, play [Prisoner of Impel Down] from hand; [On Opponent's Attack] OPT grant Blocker to [Prisoner] | none |
| OP16-051 | Mohji & Cabaji | [On Play] if hand<=5 draw 2 | none |
| OP16-082 | Kin'emon | permanent cost +3 self; [On Play] if leader type lookAtTop 5 take 1 (type) rest trash | none |
| OP16-096 | Yamato | Unblockable; [On K.O.] play [Yamato] cost<=6 from trash | none |
| OP16-045 | Crocodile | Blocker; [On Play] cost: return own Character cost>=2 to hand; play {Impel Down} cost<=2 from hand | B5-G2 |
| OP16-091 | Nami | [On Play] if leader type lookAtTop 4 take 1 (type, not named) rest trash | none |
| OP16-099 | I've Come Here... To Cut Those Chains!!! | [Main] cost restDon 6; MILL 5 from top of own deck; play {Land of Wano} cost<=6 from trash; [Counter] Leader power | B5-G6 |
| OP16-034 | Monkey.D.Luffy | permanent: [DON!! x1][Your Turn] power +1000 per Character with a different name; [On Play] lookAtTop 3 take 1 (type) | B5-G8 |
| OP16-092 | Nico Robin | [On Play] cost trash Character cost>=8; draw 2 | none |
| OP16-104 | Catarina Devon | [When Attacking] select opp Character, setBasePower self = its power (refStat); [Trigger] draw 1, play from trash (type, cost 1) | none |
| OP16-110 | Vasco Shot | [On K.O.] draw 1, rest opp Character cost<=6; [Trigger] activate [On K.O.] effect | B5-G3 |
| OP16-010 | Namule | [On Play] cost reveal Character power 8000; K.O. base power<=2000 | none |
| OP16-081 | Otama | [Activate: Main] cost restSelf; if Character cost>=8 power -2000 | none |
| OP16-005 | Thatch | permanent (hand): if Character (power>=8000, typeIncludes) cost -3; Blocker | none |
| OP16-038 | Let's Go!! To the Navy Headquarters.. | [Main] cost restDon 6; if 5 {Impel Down} Characters with different names: setActive Leader and all Characters; [Counter] Leader power | B5-G8 |
| OP16-088 | Shimotsuki Ushimaru | Blocker (keyword only) | none |
| OP16-109 | Doc Q | [On K.O.] if leader type draw 1, K.O. up to 2 cost<=1; [Trigger] activate [On K.O.] | B5-G3 |
| OP16-032 | Boa Hancock | Unblockable; [On Play] opp Character other than [Luffy] cannot be rested until opp next End Phase | B5-G5 |
| OP16-103 | Van Augur | [Opponent's Turn][On K.O.] if leader type draw 1, power -3000; [Trigger] activate [On K.O.] | B5-G3 |
| OP16-116 | Zehahahahaha! | [Main] if donOnField>=10 play [Marshall.D.Teach] from hand; opp lifeTop to hand; [Trigger] draw 2, trash 1 | none |
| OP16-058 | The Prisoners Are Rioting!! | [Main] if donOnField>=10 setBasePower 7000 all [Prisoner] thisTurn; [Counter] power on [Buggy] | none |
| OP16-068 | Trafalgar Law | [On Play] addDon 1 active; [When Attacking] if leader type power +3000 self | none |
| OP16-026 | Emporio.Ivankov | [On Play] lookAtTop 3 take 1 (type) rest bottom; play from hand cost<=2 | none |
| OP16-106 | Sanjuan.Wolf | [On K.O.] if leader type draw 1, setBasePower 7000 on Leader or Character; [Trigger] activate [On K.O.] | B5-G3 |
| OP16-095 | Monkey.D.Luffy | [On Play] grant Unblockable to black {Land of Wano} Character | none |
| OP16-094 | Portgas.D.Ace | [On K.O.] opponent trashes 2; [Activate: Main] OPT giveDon rested to {Land of Wano} Leader or Character | none |
| OP16-002 | Izo | [On Play] cost reveal Character power 8000; draw 1 | none |
| OP16-107 | Jesus Burgess | [On K.O.] opp lifeTop to hand; [Trigger] cost trash 1: play this card | none |
| OP16-039 | Gum-Gum Twin Jet Pistol | [Main] grant Double Attack to [Luffy] card; if leader type rest up to 2 opp cost<=3 (text typo "cost or 3"); [Trigger] rest opp Leader | none |
| OP16-115 | Black Vortex | [Main] if leader type: move hasTrigger card (not [Black Vortex]) from trash to hand; [Trigger] negate opp Leader or Character thisTurn | none |
| OP16-037 | Mr.3(Galdino) | [On Play] if leader type rest opp Character cost<=5 | none |
| OP16-044 | Emporio.Ivankov | Blocker (keyword only) | none |
| OP16-102 | Avalo Pizarro | [On K.O.] draw 1, play [Fullalead] from hand or trash; [Trigger] activate [On K.O.] | B5-G3 |
| OP16-111 | Boa Sandersonia | Blocker; [Trigger] if Life<=2 play this card | none |
| OP16-052 | Monkey.D.Luffy | [Activate: Main] OPT giveDon rested to Leader or Character | none |
| OP16-066 | Sengoku | [On Play] if leader type: addDon 2 rested, draw 2, trash 2 | none |
| OP16-076 | The Three Admirals!! | [Main] cost restDon 3; power +2000 up to 3 {Admiral}; [Counter] if {Admiral} exists power battle | none |
| OP16-043 | Usopp | Blocker; [On K.O.] move opp Character cost<=5 to hand | none |
| OP16-070 | Donquixote Rosinante | Blocker; [On Play] cost restDon 2: if leader type addDon 1 rested | none |
| OP16-074 | Magellan | [On Play] if leader type: OPPONENT returns 1 DON!! to DON!! deck; [On K.O.] opponent returns 4 | B5-G14 |
| OP16-075 | Monkey.D.Garp | [On Play] if leader type: addDon 1 active + 1 rested | none |
| OP16-090 | Tony Tony.Chopper | [On Play] draw 2, trash 2; K.O. cost<=1 | none |
| OP16-100 | Hallowed Glacier Slash | [Main] cost restDon 2; if an opp Character was K.O.'d this turn: setActive [Yamato] Leader; [Counter] Leader power | B5-G22 |
| OP16-030 | Trafalgar Law | [On Play] skipRefresh opp rested Character; [End of Your Turn] setActive green Characters cost<=5 | none |
| OP16-053 | Roronoa Zoro | [When Attacking] if hand<=6 draw 1 | none |
| OP16-069 | Donquixote Doflamingo | [On Play]/[When Attacking] addDon 1 active | none |
| OP16-072 | Hannyabal | [On Play] lookAtTop 5 take 1 (type) rest bottom | none |
| OP16-027 | Jinbe | permanent: [DON!! x1] power +2000 self | none |
| OP16-006 | Shanks | [On Play] cost restDon 2; K.O. power<=4000 | none |
| OP16-007 | Jozu | Blocker; [On Play] cost reveal Character power 8000; power -1000 | none |
| OP16-008 | Squard | [On Play] cost: trash own Character base power 10000; K.O. opp power<=8000 | B5-G2 |
| OP16-009 | Speed Jil | [On Play] cost trash Character power 8000: grant Rush + power +2000 until opp next End Phase | none |
| OP16-012 | Benn.Beckman | Blocker; [On Play] cost restDon 1: if leader type and donOnField>=10 play [Shanks] from hand | none |
| OP16-013 | McGuy | [On K.O.] K.O. base power<=8000 | none |
| OP16-018 | Rockstar | replacement (Once Per Turn): ko of {Red-Haired Pirates} Character: cost trash Character power>=6000 from hand instead | none |
| OP16-019 | Let's Show 'Em What We're Made Of!! | [Main] play up to 2 (typeIncludes, power 8000) from hand; [Trigger] Leader power thisTurn | none |
| OP16-024 | Inazuma | Blocker; auto: THIS Character K.O.'d by opponent's EFFECT: rest opp Character | B5-G16 |
| OP16-025 | Bunkov | [When Attacking] if [Antlerkov]: play from hand cost<=2 | none |
| OP16-029 | Antlerkov | [When Attacking] if [Bunkov]: play from hand cost<=2 | none |
| OP16-031 | Buggy | [On K.O.] play [Prisoner of Impel Down] from hand | none |
| OP16-033 | Morley | Unblockable; replacement: ko self: rest 2 of your cards instead | none |
| OP16-035 | Roronoa Zoro | [On Play] rest 1 opp card (incl. DON!!); may trash 1: giveDon 3 rested to Leader | none |
| OP16-036 | Mr.2.Bon.Kurei(Bentham) | [On Play] rest opp Character cost<=4; [When Attacking] setBasePower self = opp Leader power | none |
| OP16-040 | Gum-Gum Hammer Rifle | [Main] if [Luffy] and [Mr.3]: skipRefresh opp rested cost<=6; [Counter] Leader power | none |
| OP16-047 | Donquixote Doflamingo | [Activate: Main] cost restSelf; if opp hand>=8 opponent moves 2 hand cards to deck bottom | none |
| OP16-049 | Portgas.D.Ace | [Activate: Main] cost restSelf; draw 1 | none |
| OP16-050 | Miss Olive | Blocker; [On Play] cost: return own Character cost>=2 to hand; draw 2, trash 1 | B5-G2 |
| OP16-057 | Captain Buggy's Our Savior!! | [Counter] if 2+ [Prisoner] power battle; [Trigger] draw 2, trash 1 | none |
| OP16-059 | We'll Change This Mission from Sneaky to Flashy! | [Main] cost restDon 7; lookAtTop 5, PLAY up to 2 type Characters power<=6000 from the looked-at cards, rest bottom; [Counter] Leader power | B5-G26 |
| OP16-071 | Benevolent King of the Waves | [On Play] cost trash 1: addDon 1 rested; [On K.O.] addDon 1 rested | none |
| OP16-083 | Kouzuki Oden | Blocker; [On Play] cost trash Character cost>=8; draw 2 | none |
| OP16-089 | Dracule Mihawk | Rush: Character; [On Play] draw 2, trash 2; cost -4 on opp Character thisTurn | none |
| OP16-093 | Bartholomew Kuma | [On Play] draw 2, trash 2; giveDon rested | none |
| OP16-101 | Mahoroba | [Main] power +3000; if trash>=10 K.O. cost<=2; [Trigger] move [Yamato] trash to hand | none |
| OP16-105 | Gecko Moria | [Trigger] if Life<=1: play [Absalom], [Dr. Hogback], [Perona] (cost<=4) from trash (three play steps) | none |
| OP16-114 | Laffitte | [On K.O.] K.O. cost<=4; [Trigger] activate [On K.O.] | B5-G3 |
| OP16-073 | Borsalino | [On Play] addDon 1 active + 1 rested; [End of Your Turn] DON!! -2: setActive self, grant Blocker until opp next End Phase | none |
| OP16-063 | Kuzan | [On Play] addDon 2 rested; [Activate: Main] OPT DON!! -1: opp Character cannot activate [Blocker] thisTurn | B5-G4 |

### EB-04 (block X: EB04-061): 1 cards

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| EB04-061 | Monkey.D.Luffy | permanent (hand): if Life<=1 cost -1; [On Play] cost trash 1: Leader power +2000, grant Blocker self until opp next End Phase | none |

### OP-04 (block 1 legal exception): 1 cards

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| OP04-083 | Sabo | Blocker; [On Play] your Characters cannot be K.O.'d BY EFFECTS until start of your next turn; draw 2, trash 2 | B5-G10 |

### OP-03 (block 1 legal exception): 1 cards

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| OP03-122 | Sogeking | rules alsoNamed [Usopp]; [On Play] move any Character cost<=6 to hand; draw 2, trash 2 | none |

### OP-02 (block 1 legal exception): 1 cards

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| OP02-013 | Portgas.D.Ace | [On Play] power -3000 up to 2; if leader typeIncludes grant Rush self | none |

### OP-01 (block 1 legal exception): 1 cards

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| OP01-120 | Shanks | Rush; [When Attacking] opp cannot activate a [Blocker] Character with power<=2000 during this battle | B5-G4 |

## 3. Gap list

Each gap names the DSL construct, where it would go, the cards needing it and a rough size (S = a few lines in 2-3 files plus a planted test, M = a new runtime path or a change to a shared flow, L = new engine state or a new flow frame). Gaps are ordered by number of cards.

### B5-G1 `attribute` filter (9 cards, S)

Filter `{ attribute: Attribute }` ("Characters with the Wisdom attribute", "your Leader has the <Slash> attribute", "[Perona] or has the <Slash> attribute"). `Attribute` already exists (`cards/src/schema.ts`) and `CardDef.attributes` is already carried into the engine (`engine/src/defs.ts` line 56, `state.ts` line 36), but `Filter` in `cards/src/dsl.ts`, the filter list in `dsl-validate.ts` `filter()` and `matchesOf` in `engine/src/effects/eval.ts` have no such member. Also usable inside `leader:` conditions and `koed` filters. Cards: ST32-001, ST32-003, ST32-004, ST32-005, EB05-010, EB05-016, EB05-050, EB05-055, EB05-057. Prerequisite: the verified text of the four ST-32 cards lost the attribute name (Q1).

### B5-G2 costs that move, trash or K.O. one of your own field Characters (6 cards, M)

Cost shapes `trash` / `move` (to hand) / `ko` with `from: 'characters'` ("trash 1 of your Characters with 10000 base power", "return 1 of your Characters with a cost of 2 or more to the owner's hand", "K.O. 1 of your {Thriller Bark Pirates} Characters"). Today `cost()` in `dsl-validate.ts` rejects a `move` cost from anywhere but hand or trash (`zonesIn(['hand','trash'])`) and has no `ko` cost, while a `trash` cost is not zone-checked at all, so `{ trash: { from: 'characters', ... } }` validates and then `payCost` in `run.ts` calls plain `moveCard(..., 'trash')`, which skips `leaveField` (given DON!! do not return, no removal frame, no [On K.O.]/replacement consideration). The field case must route through `pushRemove`/`pushKo`/`leaveField` with `cause.kind: 'cost'` (as `trashSelf` already does), and the selected card choice must survive the extra frame. `payable` in `eval.ts` already counts a pool, so only payment and validation change. Cards: OP16-008 (trash), EB05-060 (trash), OP16-045 (return to hand), OP16-050 (return to hand), EB05-048 (K.O.), EB05-049 (K.O.).

### B5-G3 `activate` of the card's own [On K.O.] (6 cards, S)

Action `{ activate: { ability: 'onKO', of: 'self' } }` for "[Trigger] Activate this card's [On K.O.] effect". `dsl-validate.ts` accepts only `'main' | 'onPlay'` and `run.ts` `action()` looks for `x.when.includes('onPlay')`; extend both to `onKO`. Conditions such as [Opponent's Turn] are re-checked when the pushed effect starts (`runEffect`), which is the wanted behaviour for OP16-103. Cards: OP16-102, OP16-103, OP16-106, OP16-109, OP16-110, OP16-114.

### B5-G4 restriction `cannotActivateBlocker` on the blocking card (3 cards, M)

Restriction `cannotActivateBlocker` (target a card, e.g. "up to 1 of your opponent's Characters", "all of your opponent's Characters with a cost of 0", "a [Blocker] Character that has 2000 or less power"; durations `thisTurn` and `battle`). The existing `cannotActivateBlockerAgainstIt` (`derive.ts` `noBlocker`, `actions.ts` line 225) is the attacker-side lock and is a different thing. New: a `Derived` flag read in the block legality check in `actions.ts` (around line 218), a `ModKind` in `state.ts`, an entry in `RESTRICT_KIND` (`run.ts`) and the validator's restriction list and `IMPLEMENTED.restrictions`. Cards: OP16-063, EB05-048, OP01-120. For OP01-120 whether the filter is read at resolution or at block time is Q9.

### B5-G5 restriction `cannotBeRested` (2 cards, M)

Restriction `cannotBeRested` on an opponent's Character until the end of the opponent's next End Phase. `rules-digest.md` entry 57 (QA-GR) says such a card cannot attack, cannot activate [Blocker], cannot pay a "rest this Character" cost and cannot be rested by any effect, so the flag must be read in `ops/index.ts` `rest()`, attack legality and block legality in `actions.ts`, `payable` for `restSelf` and rest costs in `eval.ts`, and `selectRest` candidates in `run.ts`. Needs a `Derived` flag and `ModKind` like B5-G4. Cards: ST32-002, OP16-032.

### B5-G6 action `mill` (2 cards, S)

Action `{ mill: { player: 'you', n } }` as an effect ("trash 5 cards from the top of your deck", "trash 10 cards from the top of your deck"). The type already has it (`dsl.ts` `Action`) and `dsl-validate.ts` lists it, but `IMPLEMENTED.actions` omits it and `action()` in `run.ts` has no branch; the cost version exists in `payCost` and can be reused. Cards: OP16-099, EB05-031.

### B5-G7 cost `returnDon` restricted to active cost-area DON!! (2 cards, S)

"Return 8 (or 1) of your **active** DON!! cards to your DON!! deck". `{ returnDon: n }` exists as a cost (`run.ts` `returnDon`) but, like DON!! −N, it lets the player return rested and given DON!! too. Add a `state: 'active'` option that offers only the `costActive` class. Cards: OP16-060, EB05-040.

### B5-G8 `Num` count of distinct card names (2 cards, S)

`Num` `{ count: Selector, distinctNames: true }` ("+1000 power for each of your Characters with a different card name", "5 {Impel Down} Characters with different card names"). `Pick.distinctNames` exists only as a pick limit; `numOf` in `eval.ts` counts the pool. Cards: OP16-034, OP16-038.

### B5-G9 `ko` on a Stage (2 cards, S)

Action `ko` allowed on `stage` ("K.O. up to 1 of your opponent's Stages"). The validator restricts `ko` to `characters` (`zonesIn`) and `runKo` in `flow.ts` returns when the card is not in `characters`. A stage K.O. moves it to its owner's trash and runs the K.O. replacement and protection checks. Interim workaround: `move` Stage to trash (loses the K.O. versus trash distinction, so a "cannot be K.O.'d" Stage would be wrongly removed). Cards: OP17-018, OP17-116.

### B5-G10 K.O. protection scoped by cause (2 cards, S)

Restrictions `cannotBeKOdByEffects` and `cannotBeKOdInBattle`. The only K.O. restriction is `cannotBeKOd`, which `runKo` (`flow.ts` line 720) treats as blocking every K.O.; `rulings.md` lines 276 to 281 say the qualified forms are narrower. Split `Derived.cannotBeKOd` by `f.cause.kind` (`battle` or `effect`). Cards: OP04-083 (by effects; all your Characters, until the start of your next turn), EB05-059 (in battle; Characters with base power 4000 and a type, until the end of the opponent's next End Phase).

### B5-G11 cost `giveDon` (1 card, S)

Cost "give 1 active DON!! card to 1 of your Leader" (EB05-008): a `Cost` member `{ giveDon: { n, state: 'active', to: Selector } }`, using `giveDon` in `run.ts` and a `payable` branch. Card: EB05-008.

### B5-G12 cost `turnLifeFaceDown` (1 card, S)

"Turn 1 card from the top of your Life cards face-down" (EB05-011). `turnLifeFaceUp` exists in `payCost` and `payable`; this is the mirror (top card must be face-up). Card: EB05-011.

### B5-G13 cost alternatives `oneOf` (1 card, M)

A cost worded "A or B" ("trash 1 card from your hand or rest 1 of your DON!! cards", OP17-020): `Cost` `{ oneOf: Cost[][] }`; `payable` takes any alternative, `payCost` asks which, and costText describes it. A script-level workaround (a `may` step with a `chooseOne` over a `trashFromHand` or a `rest`) makes the activation legal when it should not be, and changes when the [Once Per Turn] is spent. Card: OP17-020.

### B5-G14 action `returnDon` for the opponent (1 card, M)

"Your opponent returns 1 (or 4) DON!! cards from their field to their DON!! deck" (OP16-074, two abilities). `returnDon` in `run.ts` always uses `f.controller`; it needs a `player` field, the owner picks the classes (`rulings.md` line 406, QA-OP16 OP16-074) and `donReturned` must fire for the opponent's watchers. Card: OP16-074.

### B5-G15 timing `removed` from the field (1 card, M)

Auto timing `{ event: 'removed', owner: P, filter: Filter }` ("when your {Impel Down} Character card is removed from the field", any cause: K.O., trash, return to hand or deck, effect or cost) with [DON!! x1] and [Once Per Turn]. Hook in `flow.ts` `runKo`/`runRemove` and the `leaveField` path of `ops/index.ts`; `koed` covers only K.O. Card: OP16-041.

### B5-G16 [On K.O.] qualified by cause (1 card, S)

"When this Character is K.O.'d by your opponent's effect" (OP16-024). The `koed` timing is fired only for cards still on the field (`fieldCards` in `runKo`), so a card cannot watch its own K.O. with it, and `onKO` carries no cause. Add an optional cause qualifier (`effect`, `opponentEffect`, `battle`) to the `onKO` firing in `runKo`, or let `koed` also scan the K.O.'d card. Card: OP16-024.

### B5-G17 timing `rested` (1 card, M)

Auto timing `{ event: 'rested', filter }` ("[Your Turn] When this Character becomes rested"). `rest()` in `ops/index.ts` has no hook; add `hooks.rested` like `hooks.lifeRemoved`, covering a rest by an attack, an effect or a cost. Card: ST32-003 (which also needs B5-G1).

### B5-G18 `cardPlayed` with origin zone and the event's subject (1 card, M)

"When a {Land of Wano} type Character card is played from your trash, that Character gains [Rush] during this turn." Needs (a) a `from: 'trash'` qualifier on `{ event: 'cardPlayed' }` (the `play` frame in `flow.ts` around line 400 knows the origin) and (b) a way for the effect to act on the played card (a selector zone or `ref` bound to the event's subject; `Selector.lki: 'subject'` exists in `dsl.ts` but the validator rejects it and nothing implements it). Design decision, shared with any other event-subject card. Card: OP16-079.

### B5-G19 action `redirectAttack` (1 card, L)

"Change the target of that attack to this Leader or to one of your {Blackbeard Pirates} Character cards" in [On Your Opponent's Attack] (OP16-080). Needs a new action that rewrites `s.battle.target` before the Block Step with a chosen new target (Leader or a filtered Character), the interaction with attack-target locks (`attackLock`) and with the "Leader battled" bookkeeping (`rulings.md` line 345 mentions OP12-020). Design decision. Card: OP16-080.

### B5-G20 replacement on `damage` (1 card, L)

Replacement event `{ damage }` ("If you would take damage, you may trash this Character instead", EB05-052). `ReplaceEvent` has only `ko` and `leaveField`; `collectReplacements` and `offerReplacement` in `flow.ts` serve only `ko` and `remove` frames. The damage frame (`runDamage`) needs an offer step, the payload (`trashSelf` as a cost) and the rule that the damage does not happen. Design decision. Card: EB05-052.

### B5-G21 `leaveField` replacement with no cause qualifier (1 card, M)

"If this Character would be removed from the field" with no "by your opponent's effect" (OP17-043, text unverified, see Q3). `ReplaceEvent.leaveField` requires `cause: 'opponentEffect'` and `collectReplacements` skips every other cause; a cause `'any'` would also match a battle K.O. and own effects, and must not apply twice with an overlapping `ko` replacement. Card: OP17-043.

### B5-G22 condition "an opponent's Character has been K.O.'d during this turn" (1 card, M)

The state keeps no per-turn K.O. record (`State` has `oncePerTurn` only). Add a per-turn counter by player (set in `runKo`, cleared at turn start) and a `Num` or `Condition` to read it (`{ koedThisTurn: P }`). Card: OP16-100.

### B5-G23 filter `nameIncludes` (1 card, S)

"If your Leader's card name includes "Ace"": `Filter` `{ nameIncludes: string }` (substring of the card name, CR 2-1-2), like `typeIncludes`. `name` is an exact match today. Card: OP16-015.

### B5-G24 rules clause `anyNumberInDeck` (1 card, M)

"Under the rules of this game, you may have any number of this card in your deck" (OP16-042). `validateScript` rejects the clause (`rules clause anyNumberInDeck is not implemented`); `deckIssues` in `engine/src/deck.ts` enforces `MAX_COPIES` with no per-card exception; the deck builder and the AI deck generator read the same rule. Card: OP16-042.

### B5-G25 `giveDon` to up to N chosen targets, up to M each (1 card, S)

"Give up to 2 of your Characters with 6000 base power up to 2 rested DON!! cards each" (ST30-014). `giveDon` with `each` forbids a `pick` on the selector, and without `each` the engine forces `exactly n` targets when more than one DON!! is available (`run.ts` `giveDon`). Needs `each` plus `pick: { upTo: 2 }`. Card: ST30-014.

### B5-G26 `lookAtTop` take `to: 'play'` (1 card, M)

"Look at 5 cards from the top of your deck; play up to 2 {Impel Down} type Character cards with 6000 power or less. Then, place the rest at the bottom" (OP16-059). `Take.to` is `hand` or `lifeTop` only; add `play` (push a `play` frame with `free: true` per card, as the `play` action does, with the batch rule for several cards). Card: OP16-059.

### Cross-reference for de-duplication

Constructs other auditors may also name: `attribute` filter (B5-G1), `cannotBeRested` and `cannotActivateBlocker` restrictions (B5-G5, B5-G4), `mill` action (B5-G6), cost on own Characters (B5-G2), `activate` of own [On K.O.] (B5-G3), K.O. scoped protection (B5-G10), `returnDon` with `player` (B5-G14), replacement `leaveField` cause (B5-G21), `rules.anyNumberInDeck` (B5-G24), `lookAtTop` take to play (B5-G26), `Num` distinct count (B5-G8).

## 4. Open questions

Readings that need an official ruling or a text check, each with the proposed reading. None is invented as a ruling.

- **Q1. Attribute names missing from verified text (ST32-001, ST32-003, ST32-004, ST32-005).** The text reads "rest your attribute Leader", "has the attribute", "if your Leader has the attribute": the attribute icon's name was dropped by the scrape (all five ST-32 cards are `Slash`, `cards/data/sets/ST-32.json`). Proposed: restore the name from the official card list as a `textFixes` entry (kind `cleanup`) before scripting; the likely value is `Slash`, to be confirmed against the card image or the official list.
- **Q2. EB-05 is unverified and some texts have visible defects.** All 55 EB-05 texts come from optcgapi only. Seen: EB05-001 "with 6000 power or more-1000 power" (missing space before the sign), EB05-057 "If your have 2 or less Life cards", OP16-039 "with a cost or 3 or less" (reads "of"), OP16-043 "tour opponent's", OP16-014 "this character". Proposed: verify EB-05 against the official list before scripting (the data-sources doc says it already lists EB-05).
- **Q3. OP17-043 Ganzui, "If this Character would be removed from the field, you may trash 2 cards from your hand instead."** The verified text has no "by your opponent's effect". Proposed: confirm against the official text; if it really is unqualified, apply it to battle K.O.s and own effects too (B5-G21); if the qualifier was dropped, it is a plain `leaveField` replacement with `cause: 'opponentEffect'` and needs no gap.
- **Q4. EB05-061 Nami, "removed from the field by your opponent".** The replacement text omits "effect". Proposed: read as "by your opponent's effect" (the same replacement as OP15-035, `leaveField` with `cause: 'opponentEffect'`), and confirm the printed text.
- **Q5. EB05-052 Gloriosa, "If you would take damage, you may trash this Character instead."** Proposed: the damage is not dealt at all (no Life card taken, no [Trigger]), for battle and effect damage alike, and Gloriosa must be on the field. Needs a Q&A check.
- **Q6. OP16-034 Luffy, "+1000 power for each of your Characters with a different card name."** Proposed: count the number of distinct names among your Characters, including this one (B5-G8); the other reading (other Characters whose name differs from this one) gives one less when no other copy exists, so a ruling is needed.
- **Q7. OP16-080 Teach, "Change the target of that attack to this Leader or to one of your {Blackbeard Pirates} type Character cards."** Open points: whether the attack is still a battle against a Character or a Leader for "when attacked" effects, whether the new target may be rested, and whether a card that cannot be attacked or `lockAttackTarget` still applies. Proposed: the new target must be a legal attack target (active Leader, or a rested Character), and the battle proceeds against it as if declared on it.
- **Q8. OP16-079 Yamato, "When a {Land of Wano} type Character card is played from your trash".** Proposed: it triggers for any play of such a Character from your own trash, by any effect, and "that Character" is the card just played.
- **Q9. OP01-120 Shanks, "cannot activate a [Blocker] Character that has 2000 or less power during this battle".** Proposed: the filter is read when a block is declared (current power), not at resolution, so a Blocker that is later pumped above 2000 can block and one pushed to 2000 cannot.
- **Q10. "Then" after an "if" that fails.** OP16-116 ("If you have 10 DON!! cards on your field, play up to 1 [Marshall.D.Teach] from your hand. Then, add up to 1 card from the top of your opponent's Life cards to the owner's hand."), OP17-034 (set a DON!! active, then Leader base power), OP17-103 (deck top to Life, then -3000), EB05-033 (draw and trash, then add DON!!), OP02-013 (power -3000, then Rush). Per m4b-runtime-audit §7 and effect-dsl §4.10: put the "Then" clause inside the `if`'s `then`, and record the reading in `rulings`. For OP16-116 the stronger reading is that the Life step does not need the condition; that one deserves a Q&A check.
- **Q11. OP17-117 Maser Saber [Trigger], "Your opponent may trash 3 cards from their hand. If they do not, K.O. up to 1 of your opponent's Characters with a cost of 6 or less."** Proposed: with fewer than 3 cards in hand the opponent cannot trash, so the K.O. happens; the opponent chooses before the K.O. target is picked. Expressible with `if` on the opponent's hand, a `chooseOne` with `chooser: 'opponent'` and a K.O. in the other branch.
- **Q12. OP17-099 Charlotte Linlin, mode 1 "Trash 1 card from your hand. Then, add up to 1 card from the top of your deck to the top of your Life cards."** Proposed: "your" is the Leader's controller (the opponent chooses which mode the controller suffers), mode 2 trashes from the opponent's hand with the controller choosing face-down (`blind`), as QA-OP17 OP17-099 already states for the selection.
- **Q13. OP17-057 Fullalead, "Up to 1 of your Leader with a type including "Rocks Pirates" or up to 1 of your Characters with a type including "Rocks Pirates"".** Proposed: one target in total, as the usual "Leader or Character" wording (a single `upTo: 1` selector over leader and characters).
- **Q14. EB05-010 Nico Robin Leader, "Characters with the "Wisdom" attribute and without [Blocker]" K.O.'d.** The `koed` event reads the K.O.'d card from the trash with printed values (m4b-runtime-audit §6, OPEN-QUESTIONS M4b-2), so a Character that had [Blocker] only from an effect would wrongly count as "without [Blocker]". Proposed: accept the printed-value reading until `lki` is implemented, and note it in the script's `rulings`.
- **Q15. OP04-083 Sabo, "None of your Characters can be K.O.'d by effects until the start of your next turn."** Proposed: it covers the Characters on the field when it resolves, not later arrivals (as for any resolved one-shot effect), and covers the opponent's whole turn (`rulings.md` line 227, QA-OP06 OP06-074).
- **Q16. K.O. or removal paid as a cost (EB05-048, EB05-049 "K.O. 1 of your Characters", OP16-008 "trash 1 of your Characters").** Proposed: a K.O. cost is a K.O. (its [On K.O.] activates, a K.O. replacement may apply) and a trash cost is not (CR 10-2-1-3, `rules-digest.md` entry 109).
- **Q17. OP16-041 Buggy Leader, "removed from the field".** Proposed: any move off the field counts (K.O., trash, return to hand or deck, by effect or cost, by either player), with the Character's printed type read as it left (the same last-known question as Q14).
- **Q18. OP16-022 Monkey.D.Luffy Leader, "If the only Characters on your field are {Impel Down} type Characters".** Proposed: true with no Characters (vacuous truth, `none` of the non-matching Characters), unless a Q&A says otherwise.
- **Q19. OP16-100 Hallowed Glacier Slash, "If your opponent's Character has been K.O.'d during this turn".** Proposed: any K.O. of an opponent's Character this turn, by battle or effect, by either player, including one that a replacement did not stop.
- **Q20. EB05-043 Perona, "[On K.O.] K.O. or rest up to 1 of your opponent's Characters with a cost of 6 or less."** Proposed: choose K.O. or rest first, then the target, written as a `chooseOne` (a Character can be picked only if it legally can be K.O.'d or rested).
- **Q21. OP16-001 Portgas.D.Ace Leader, "Up to 1 of your [Monkey.D.Luffy] Characters or up to 1 of your Characters with a type including "Whitebeard Pirates", with 8000 power or more, gains [Rush]".** Proposed: the power condition applies to both choices, one target in total.
