# M6b-1 runtime audit, block 3 unscripted cards

Written for PLAN §2a M6b-1 by the block-3 auditor. Method: `docs/research/m4b-runtime-audit.md` sections 1, 3 and 4. Inputs: verified-or-fetched text in `cards/data/sets/*.json` (merged with `cards/overrides/<ID>.json` where present: only OP12-016, OP12-017 and OP12-019 have one), `cards/src/dsl.ts`, `cards/src/dsl-validate.ts` (`IMPLEMENTED`), the runtime (`engine/src/effects/{run,eval,layers,compile}.ts`, `engine/src/flow.ts`, `engine/src/actions.ts`, `engine/src/ops/`), effect-dsl.md §4 and the 190 existing scripts under `cards/effects/**` as worked examples. Nothing in `engine/`, `cards/` or tests was modified.

## 1. Result

- **510 cards audited** (every `backlog` entry with block 3 in `coverage-report.json`: OP-12 84, OP-11 95, OP-10 106, OP-09 105, EB-02 52, PRB-02 18, PRB-01 1, ST-15 to ST-21, ST-26 and ST-27 together 49; 25 Leaders, 395 Characters, 80 Events, 10 Stages).
- **377 cards need nothing new** (374 outright, plus 3 whose text has a data question where the proposed reading needs nothing new: OP11-023, EB02-005, PRB02-017, see section 4). 9 of them are keyword-only (Blocker): they need a verified override with `keywords`, no script body.
- **133 cards need at least one gap** (26 %), across **55 gaps** (`B3-G1` to `B3-G55`). 30 of the gaps serve one card only.
- **4 cards are unexpressible without a design decision**: OP09-081, EB02-030, OP12-020, PRB02-005 (a battle-event watcher registered by an Activate; a whole-side timing negation; a replacement created by an Event; a delayed effect at the start of a phase). The other gap cards are expressible once their gap is built, no ruling needed beyond section 4.
- The dominant pattern: block 3 is mostly plain combinations of implemented shapes (lookAtTop, DON!! costs, K.O./rest/power with filters, `permanent` grants). The gaps are scattered: 12 gaps serve 5 or more cards each and 30 serve a single card. The biggest cluster is **mill as an effect** (13 cards), then **scoped K.O. protection** (10), the missing **attribute filter** (8) and **K.O. replacement causes** (7).

Notes on method and caveats:
- The set JSON `keywords` arrays are empty for unverified cards (22 of 2860 cards have any), so printed keywords are listed in the table text but would come from the verification override at scripting time (E-D7).
- "none" assumes the shape combination runs through `validateScript` today. Where a combination leans on a corner I read in the runtime rather than a worked script, it is flagged in the row (for example OP10-058 Rebecca uses `select` + `play` of a `ref` from hand with no hand `reveal` event, which is cosmetic).
- Several "none" rows rely on `move`/`play`/`rest` shapes from the M4b closed gaps (G13 to G33 of m4b-runtime-audit.md §4); they are not re-listed.

## 2. Card table

Set order, newest first, Leaders first within a set. "Shapes needed" is shorthand: DSL abilities in the card's own words; gap IDs refer to section 3.

### OP-12 (84 cards)

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| OP12-001 | Silvers Rayleigh | rules deckRestriction cost>=5; [Activate: Main] OPT cost reveal 2 Events; power | B3-G31 |
| OP12-020 | Roronoa Zoro | [DON!! x3] Activate OPT: if this Leader battles a Character this turn set active; then cannot attack Characters baseCost<=7 this turn | B3-G32, B3-G27 |
| OP12-040 | Kuzan | when a card is trashed from hand by a Navy card's effect, draw equal to number trashed | B3-G53 |
| OP12-041 | Sanji | Activate OPT DON!!-1: activate Event (type, base cost<=3) from hand; [When Attacking] if DON<=opp addDon rested | B3-G26 |
| OP12-081 | Koala | attack event (Leader vs Leader) if 2+ Characters cost>=8 draw; OPT when opp plays Character baseCost>=8 or plays a Character by a Character's effect: opp top Life to hand | B3-G45 |
| OP12-003 | Crocus | [On K.O.] cost reveal 2 Events; play red Character power<=3000 from hand | none |
| OP12-004 | Kouzuki Oden | Activate OPT cost reveal 2 Events; self power | none |
| OP12-007 | Shanks | [On Play] grant Rush to typeIncludes Character other than self | none |
| OP12-008 | Shanks | Blocker; [On Opp Attack] OPT cost trash; power -2000 | none |
| OP12-009 | Jinbe | [On Play] cost reveal 2; grant Rush self, power until end of opp next turn | none |
| OP12-012 | Buggy | [On Play] grant Blocker until end of opp next turn | none |
| OP12-013 | Hatchan | Activate cost restSelf+reveal 2; giveDon 2 rested | none |
| OP12-014 | Boa Hancock | [On Play] lookAtTop 5 (name or red Event); Activate trashSelf cost; giveDon 2 rested | none |
| OP12-021 | Ipponmatsu | conditional (Leader Slash attribute, 6+ rested DON) cannot be rested by opp effects; Blocker | B3-G3, B3-G13 |
| OP12-022 | Inuarashi | Activate restSelf: skipRefresh on opp rested Character cost<=5 | none |
| OP12-024 | Gyukimaru | permanent (while active) cannot be K.O.'d by opp effects; [When Attacking] if 3+ given DON rest opp Character | B3-G2 |
| OP12-026 | Kuina | Activate restSelf: rest opp Character; giveDon 3 rested to [Zoro] Leader | none |
| OP12-027 | Koushirou | replacement: other Slash Character cost<=5 would be K.O.'d by opp effect, may rest self instead; Blocker | B3-G3, B3-G4 |
| OP12-028 | Kouzuki Hiyori | Activate cost rest 1 DON + restSelf; if Leader Zoro lookAtTop 5 (Slash attribute or green Event) | B3-G3 |
| OP12-029 | Shimotsuki Kouzaburou | [On Play] rest opp Character; K.O. opp rested Character baseCost<=1 | none |
| OP12-030 | Dracule Mihawk | Blocker; [On Play] set 4 DON active; restrict you cannotPlay Character baseCost>=7 this turn | none |
| OP12-031 | Tashigi | [On Play] rest opp Character; giveDon 3 rested to [Zoro] Leader | none |
| OP12-033 | Helmeppo | Blocker; [On Block] rest opp Character cost<=5 | none |
| OP12-034 | Perona | [On Play] if Leader Slash: lookAtTop 5 (Slash attribute or green Event) | B3-G3 |
| OP12-036 | Roronoa Zoro | in hand cannot be played by effects; if Leader Slash: cannot be K.O.'d in battle by Slash attribute cards and +1000 power | B3-G3, B3-G36, B3-G2 |
| OP12-042 | Alvida | permanent cost +1 if 2+ Characters baseCost>=5; [On Play] place opp Character baseCost<=1 at deck bottom | none |
| OP12-043 | Kuzan | permanent cost +1 if hand>=5; [On Play] cost trash: opp Character cannot attack until end of opp next turn | none |
| OP12-044 | Sakazuki | [On Play] if Leader type draw 2; Activate OPT cost trash: giveDon 1 rested | none |
| OP12-046 | Zephyr(Navy) | [On Play] trash 2 from hand; Activate trashSelf: move Character cost<=5 to hand | none |
| OP12-047 | Sengoku | [On Play] cost trash: lookAtTop 5 take up to 2 Navy not self | none |
| OP12-048 | Donquixote Rosinante | [Opp Turn] replacement leaveField by opp effect (blue Navy Character): cost restSelf+trash instead | none |
| OP12-050 | Jaguar.D.Saul | Blocker (keyword only) | none |
| OP12-051 | Hina | Activate cost restSelf+trash: opp Character baseCost<=4 cannot activate [Blocker] this turn | B3-G14 |
| OP12-053 | Borsalino | OPT replacement leaveField: cost trash instead; [Opp Turn] if Leader Navy Blocker +1000 | none |
| OP12-054 | Marshall.D.Teach | [On Play] if Leader type: move Character cost<=1 other than self to hand | none |
| OP12-056 | Monkey.D.Garp | [On Play] cost trash: play Navy Character power<=8000 not self from hand | none |
| OP12-062 | Vinsmoke Sora | [On Play] if Leader Sanji and DON<=opp addDon rested; draw 1 | none |
| OP12-063 | Vinsmoke Reiju | permanent if 4+ Events in trash +2000 power +5 cost; Blocker | none |
| OP12-065 | Emporio.Ivankov | permanent Blocker if 4+ Events in trash; [On K.O.] trash Event to hand | none |
| OP12-066 | Carne | permanent Blocker if 4+ Events in trash | none |
| OP12-069 | Crocodile | [On Opp Attack] OPT DON!!-1: if Leader type includes Baroque Works power +2000 battle | none |
| OP12-070 | Sanji | power +1000 for every 5 Events in trash; replacement leaveField by opp effect: returnDon 1 instead | B3-G20 |
| OP12-072 | Zeff | [donReturned] if Leader Sanji grant Rush self | none |
| OP12-073 | Trafalgar Law | [On Play] if DON<=opp addDon active; power to [Rosinante] and Heart Pirates Characters until end of opp next turn | none |
| OP12-074 | Patty | [On Play] cost trash Event: if Leader Sanji addDon active | none |
| OP12-075 | Ms. All Sunday | [On Play] K.O. cost<=3; opponent may add DON from their deck and set active; [Trigger] cost DON!!-1: play this card | B3-G42 |
| OP12-084 | Emporio.Ivankov | Blocker; [On Play] if Leader type trash 3 from top of deck | B3-G1 |
| OP12-085 | Karasu | permanent cost +3 if Leader type; [When Attacking] if Leader type and opp hand>=5 opp trashes 1 | none |
| OP12-086 | Koala | [On Play] if Leader type lookAtTop 3 (type or Robin) rest trash | none |
| OP12-087 | Nico Robin | permanent (Leader Koala or Luffy) Blocker +3 cost; [On Play] cost trash: if opp hand>=5 opp trashes 2 | none |
| OP12-089 | Hack | permanent Blocker +4 cost if Leader type; [On K.O.] if Leader type K.O. baseCost<=4 | none |
| OP12-090 | Belo Betty | [When Attacking] cost mill 2: opp Character cost -2 | none |
| OP12-091 | Poker | Activate OPT cost move 3 trash to deck bottom: power to 2 SMILE | none |
| OP12-093 | Morley | permanent cost +4 if Leader type | none |
| OP12-094 | Monkey.D.Dragon | [On Play] cost move 3 RA from trash to deck bottom: if Leader type play Character cost<=6 from trash | none |
| OP12-095 | Lindbergh | permanent cost +4 if Leader type; [On Play] draw 1 trash 1 | none |
| OP12-100 | Sabo | permanent if life<=3 Blocker +3 cost; [On Play] cost lifeToHand: draw 2 trash 1 | none |
| OP12-101 | Jewelry Bonney | Activate restSelf: Supernovas Leader power until end of opp next turn | none |
| OP12-102 | Shirahoshi | replacement leaveField by opp effect (other Character baseCost<=6): turnLifeFaceUp instead; [Opp Turn] if no other [Shirahoshi] cost 2 Neptunian +2000 | none |
| OP12-104 | Sentomaru | [Trigger] K.O. cost<=4 | none |
| OP12-105 | Trafalgar Lammy | [Your Turn][On Play] power to a [Trafalgar Law] | none |
| OP12-106 | Trafalgar Law | Blocker (keyword only) | none |
| OP12-107 | Donquixote Doflamingo | permanent Rush if life<=2; [Opp Turn][On K.O.] deckTop to Life | none |
| OP12-109 | Pacifista | [Trigger] K.O. cost<=1 and add this card to hand | B3-G21 |
| OP12-113 | Roronoa Zoro | [On K.O.] if Leader type play Supernovas cost<=4 from hand rested; [Trigger] K.O. and add this card to hand | B3-G21 |
| OP12-118 | Jewelry Bonney | Blocker; [On Play] if 8+ rested cards (field + DON) draw 2 trash 1, set DON active | none |
| OP12-119 | Bartholomew Kuma | [On Play] cost trash: deckTop to Life; self cost +2 until end of opp next turn; [Opp Turn][On K.O.] deckTop to Life | none |
| OP12-016 | To Never Doubt--That Is Power! | [Main] cost give 2 active DON to [Rayleigh]: that Leader unblockable-by-opp-Blocker this turn; [Counter] power battle | B3-G16 |
| OP12-017 | Color of Observation Haki | [Main] cost give 1 active DON to [Rayleigh]: lookAtTop 4 (red Event or Character cost>=3) | B3-G16 |
| OP12-019 | Color of Arms Haki | [Main] cost give 1 active DON to [Rayleigh]: power; [Counter] power battle | B3-G16 |
| OP12-039 | Luffy Is the Man Who Will Become the King of Pirates!!! | [Main] set [Zoro] Leader active; [Trigger] power | none |
| OP12-057 | Ice Block Pheasant Peck | [Counter] power battle; trash 1; [Trigger] cost trash: draw | none |
| OP12-058 | I Will Make Whitebeard the King of the Pirates | [Main] if Leader type: reveal top, if matching Character may play it, then Rush; [Trigger] draw | B3-G46 |
| OP12-059 | Concasser | [Main] if Leader Sanji draw; [Counter] if 4+ Events in trash Leader power battle | none |
| OP12-060 | Boeuf Burst | [Main] if Leader multicolored chooseOne (move to hand / draw) | none |
| OP12-077 | The "Extinguishes All Sound Created by Your Influence" Technique | [Main] select [Law], power; if it attacks no Blocker (noBlocker); [Trigger] draw | none |
| OP12-078 | Brochette Blow | [Main] if DON<=opp draw; power -3000 | none |
| OP12-079 | Luffy Is the Man Who Will Be King of the Pirates!!! | [Main] if Leader Sanji lookAtTop 3 take 1 | none |
| OP12-096 | Ursa Shock | [Main] K.O. cost<=4 (<=6 if you have cost 8+ Character); [Trigger] draw 1, trash 1 from top of deck | B3-G1 |
| OP12-097 | Captains Assembled | [Main] lookAtTop 3 rest trash; [Trigger] activate [Main] | none |
| OP12-098 | Hair Removal Fist | [Counter] power battle, extra if cost8+ Character; [Trigger] draw 1, trash 1 from top of deck | B3-G1 |
| OP12-116 | We'll Ring the Bell Waiting for You!! | [Main] lookAtTop 5 take up to 2; [Trigger] draw | none |
| OP12-117 | Slam Gibson | [Main] cost rest 5 DON: if Leader type add Character cost<=9 (any owner) to top or bottom of owner's Life face-down; [Counter] Leader power | B3-G10 |
| OP12-080 | Baratie | Stage [Activate: Main] cost place this Stage at deck bottom: lookAtTop (Event); [Trigger] play this card | B3-G15 |

### OP-11 (95 cards)

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| OP11-001 | Koby | permanent grant Rush: Character to SWORD Characters; OPT replacement leaveField (Navy base power<=7000): cost move 3 trash to deck bottom | none |
| OP11-021 | Jinbe | [End of Your Turn] if hand<=6 setActive Fish-Man/Merfolk Character and a DON | none |
| OP11-022 | Shirahoshi | permanent cannot attack (self); Activate OPT cost rest DON + turnLifeFaceUp: play Neptunian/Megalo cost<=DON on field from hand | none |
| OP11-040 | Monkey.D.Luffy | [Start of Your Turn] if DON>=8 lookAtTop 5 rest topOrBottom | none |
| OP11-041 | Nami | [Your Turn] OPT lifeRemoved (any): if hand<=7 draw; [DON!! x1][On Opp Attack] OPT cost trash: self power | none |
| OP11-062 | Charlotte Katakuri | [When Attacking]/[On Opp Attack] OPT DON!!-1: look at 1 card from top of opponent's deck; self power battle | B3-G24 |
| OP11-002 | Ain | [On Play] power -1000 then K.O. opp Character power<=0 | none |
| OP11-004 | Kujyaku | [On Play] lookAtTop 5 (Navy not name); Activate trashSelf: power | none |
| OP11-005 | Smoker | Blocker; [DON!! x1] cannot be K.O.'d by effects of Characters without (Special) attribute | B3-G3, B3-G2 |
| OP11-006 | Zephyr | [DON!! x1][When Attacking] power -5000 to opp (Special) attribute Character | B3-G3 |
| OP11-007 | Tashigi | Activate restSelf: if Leader Navy power | none |
| OP11-008 | Doll | Blocker; [On Play] cost trash: if Leader Navy power -6000 | none |
| OP11-009 | Nico Robin | [DON!! x2][When Attacking] power -2000 until end of opp next turn | none |
| OP11-010 | Hibari | [On Play] power -2000; [When Attacking] self power; Navy Leader can also attack active Characters this turn | B3-G9 |
| OP11-013 | Prince Grus | [When Attacking] all opp Characters power<=2000 cannot activate [Blocker] this turn | B3-G14 |
| OP11-014 | Borsalino | Blocker; Activate restSelf: Navy Leader/Character can also attack active Characters | B3-G9 |
| OP11-016 | Roronoa Zoro | Activate OPT giveDon 1 rested | none |
| OP11-023 | Arlong | in-hand permanent cost (+3 as printed; likely -3, see OQ) if Leader type, life<=3, opp 5+ rested cards; [Trigger] rest | none (see Q1) |
| OP11-024 | Aladine | [On K.O.] only when K.O.'d by opp effect: cost trash+rest DON; play Fish-Man/Merfolk cost<=6 from hand | B3-G12 |
| OP11-025 | Ishilly | [On Opp Attack] OPT cost restDon+restSelf: power battle | none |
| OP11-027 | Bulge-Eyed Neptunian | permanent (Leader Shirahoshi) grant Rush: Character | none |
| OP11-028 | Lord of the Coast | [On Play] skipRefresh opp rested Character; [Trigger] K.O. rested cost<=3 | none |
| OP11-029 | Charlotte Praline | Blocker; [On Play] rest opp Character cost<=1 | none |
| OP11-030 | Shirahoshi | Activate cost rest DON+restSelf: lookAtTop 5 | none |
| OP11-031 | Jinbe | [On Play] if Leader type rest opp Character; Activate OPT grant Rush: Character | none |
| OP11-034 | Hatchan | Activate restSelf: if Leader type opp Character cost<=3 cannot be rested until end of opp next turn | B3-G13 |
| OP11-035 | Fisher Tiger | [On K.O.] only when K.O.'d by opp effect: cost rest DON: play Fish-Man/Merfolk cost<=4 from hand; [On Play] rest opp Character | B3-G12 |
| OP11-036 | Spotted Neptunian | [On Play] if Leader Shirahoshi lookAtTop 5 (type or name) | none |
| OP11-042 | Vito | [On Play] cost trash Firetank card: grant Rush self | none |
| OP11-043 | Vinsmoke Ichiji | Blocker; [On Opp Attack] OPT if only GERMA Characters: power battle; trash 2 from top of deck | B3-G1 |
| OP11-044 | Vinsmoke Judge | Activate OPT cost trash: power to all GERMA 66 | none |
| OP11-046 | Vinsmoke Yonji | Blocker; if only GERMA Characters cannot be K.O.'d or rested by opp effects | B3-G2, B3-G13 |
| OP11-047 | Vinsmoke Reiju | [On Play] if Leader type lookAtTop 5 (typeIncludes GERMA) rest trash | none |
| OP11-048 | Capone"Gang"Bege | [On Play] lookAtTop 4 (type any, cost>=2) | none |
| OP11-049 | Carrot | [On Play] lookAtTop 3 place top or bottom; [On Opp Attack] cost trashSelf: Leader power battle | none |
| OP11-050 | Gotti | [When Attacking] cost trash Firetank: chooseOne move to hand / deck bottom | none |
| OP11-051 | Sanji | [On K.O.] only by opp effect: look at 5, play Straw Hat Character cost<=5, rest bottom; [On Play] move base power<=5000 to hand | B3-G12, B3-G19 |
| OP11-056 | Brook | Blocker; [On Play] place baseCost 1 Character at deck bottom | none |
| OP11-057 | Pedro | permanent Blocker if hand<=4 | none |
| OP11-058 | Monkey.D.Luffy | Blocker; permanent cannot attack if hand>=5 | none |
| OP11-063 | Little Sadi | [On Play] cost DON!!-1: if Leader type rest opp Character cost<=3 | none |
| OP11-065 | Charlotte Anana | permanent Blocker if purple Big Mom Character other | none |
| OP11-066 | Charlotte Oven | Activate restSelf: choose a cost, reveal top of opponent's deck, if cost matches K.O. baseCost<=3; addDon rested | B3-G5 |
| OP11-067 | Charlotte Katakuri | Blocker; [End of Your Turn] setActive 2 Big Mom cost>=3; addDon rested | none |
| OP11-069 | Charlotte Brulee | [On Play] cost lifeToHand: if Leader type addDon active | none |
| OP11-070 | Charlotte Pudding | [On Play] lookAtTop 5; Activate cost DON!!-1 + restSelf: look at 1 card from top of opponent's deck | B3-G24 |
| OP11-071 | Charlotte Perospero | Activate OPT cost trash: choose a cost, reveal opp top; match: draw, addDon active | B3-G5 |
| OP11-072 | Charlotte Mont-d'or | Activate OPT cost DON!!-1+restSelf: opponent places 2 trash cards at deck bottom; own top Life to hand | none |
| OP11-073 | Charlotte Linlin | permanent Rush if Leader type; [On Opp Attack] OPT DON!!-5: choose cost reveal opp top, match: Leader power | B3-G5 |
| OP11-074 | Streusen | Activate OPT cost DON!!-1+restSelf: choose cost, reveal opp top, match: rest opp Character cost<=4 | B3-G5 |
| OP11-075 | Jaguar.D.Saul | [On Play] if Leader Robin and DON>=7 draw 2; [Trigger] activate [On Play] | none |
| OP11-076 | Hannyabal | Blocker; [On Play] if Leader type play Impel Down cost<=3 from hand | none |
| OP11-077 | Randolph | [Your Turn] OPT donReturned: Big Mom Character cost +2 until end of opp next turn | none |
| OP11-082 | Aramaki | Activate trashSelf: if Leader Navy Navy Character can also attack active Characters; trash 2 from top of deck | B3-G9, B3-G1 |
| OP11-083 | Caribou | Blocker; [On Play] trash 2 from hand | none |
| OP11-084 | Kuzan | [On Play] trash 3 from top of deck; [When Attacking] Navy Leader/Character can also attack active Characters | B3-G9, B3-G1 |
| OP11-085 | Kurozumi Orochi | [On Play] move SMILE cost<=5 trash to hand | none |
| OP11-086 | Coribou | [On Play] trash 1; Activate trashSelf: play [Caribou] cost<=4 from trash | none |
| OP11-088 | Shu | Blocker; OPT when opp Character attacks: if it has Slash attribute self power battle | B3-G3 |
| OP11-090 | Briscola | Blocker (keyword only) | none |
| OP11-091 | Berry Good | [On Play] opponent places 3 Events from their trash at deck bottom | none |
| OP11-092 | Helmeppo | [On Play] cost trash: draw; play SWORD cost<=8 from trash; at end of turn place it at deck bottom | B3-G33 |
| OP11-095 | Monkey.D.Garp | [On Play] cost move 3 Navy trash to deck bottom: giveDon 1 rested to Leader; if cost 9+ Character exists K.O. | none |
| OP11-096 | Ripper | permanent Blocker if black Navy Character other | none |
| OP11-100 | Otohime | [On Play] if Leader Shirahoshi cost turn top Life face-down: draw 1 | B3-G11 |
| OP11-101 | Capone"Gang"Bege | Blocker; OPT replacement leaveField by opp effect (other Supernovas Character): add it to top of Life face-down instead | B3-G10 |
| OP11-102 | Camie | [Your Turn] OPT when opp activates Event or [Trigger]: if opp life>=2 trash top Life of each player | B3-G54, B3-G8 |
| OP11-103 | Long-Jaw Neptunian | Activate if Leader Shirahoshi cost restSelf + turn Life face-down: K.O. cost<=3 | B3-G11 |
| OP11-104 | Shirley | Blocker; [On Play] cost turn Life face-down: lookAtTop 3 rest topOrBottom | B3-G11 |
| OP11-107 | Topknot Neptunian | Blocker; Activate OPT if Leader Shirahoshi cost turn Life face-down: delayed set self active at end of turn | B3-G11 |
| OP11-108 | Neptune | [On Play] if Leader Shirahoshi cost turn Life face-down: draw 2 trash 1 | B3-G11 |
| OP11-109 | Pappag | [On Play] if you have [Camie] draw 2 trash 2 | none |
| OP11-110 | Fukaboshi | replacement ko self: cost rest [Fish-Man Island] or [Shirahoshi] Leader instead; [On Play] cost lifeToHand topOrBottom: K.O. cost<=1 | none |
| OP11-112 | Megalo | Blocker; [Opp Turn] if Leader Shirahoshi +4000 | none |
| OP11-118 | Monkey.D.Luffy | Rush; [When Attacking] cost trash: move Character cost<=4 to hand; giveDon 1 rested | none |
| OP11-119 | Koby | [On Play] a Character can also attack active Characters; [When Attacking] cost move 2 trash to deck bottom: power until end of opp next turn | B3-G9 |
| OP11-018 | Honesty Impact | [Main] power -4000, K.O. power<=6000; [Trigger] K.O. | none |
| OP11-019 | Glorp Web!! | [Counter] power battle; if opp has power>=6000 Character, power this turn; [Trigger] power | none |
| OP11-020 | X Calibur | [Main] power -2000 up to 2; Navy power; [Trigger] K.O. power<=4000 | none |
| OP11-037 | Ancient Weapon Poseidon | [Main] lookAtTop 4 (type Character); [Trigger] draw | none |
| OP11-038 | Gum-Gum Elephant Gatling | [Main] cost restDon 1: rest opp Character cost<=5; [Counter] Leader power | none |
| OP11-039 | Vagabond Drill | [Counter] power battle; rest opp Character; [Trigger] rest | none |
| OP11-059 | Gum-Gum King Cobra | [Counter] power battle, extra if hand<=4; [Trigger] move Character cost<=2 to hand | none |
| OP11-060 | Let's Crash This Wedding!!! | [Main] if Leader multicolored lookAtTop 5; [Trigger] activate [Main] | none |
| OP11-061 | Gum-Gum Jet Culverin | [Main] place opp Character baseCost<=4 at deck bottom; [Trigger] place Character cost<=1 | none |
| OP11-079 | When Two Men Are Fighting the Last Thing I Need Is Some Half-Hearted Assistance!!!! | [Counter] choose a cost, reveal opp top: match power battle; [Trigger] draw | B3-G5 |
| OP11-080 | Gear Two | [Main] cost restDon 2: if Leader colors include blue addDon rested; [Counter] Leader power | none |
| OP11-081 | Cognac Mama-Mash | [Main] choose cost, reveal opp top: match K.O. baseCost<=8; [Trigger] addDon active | B3-G5 |
| OP11-097 | After All These Years I'm Losing My Edge!!! | [Counter] power battle; if trash>=10 add black Character cost<=3 from trash | none |
| OP11-098 | Blue Hole | [Main] cost mill 3: K.O. cost<=2; [Trigger] power | none |
| OP11-099 | I'm Gonna Be a Navy Officer!!! | [Main] lookAtTop 3 rest trash; [Trigger] activate [Main] | none |
| OP11-114 | Gum-Gum Fire-Fist Pistol Red Hawk | [Main] cost restDon 3: if total Life >=5 K.O. baseCost<=5; [Counter] Leader power | none |
| OP11-115 | You're Just Not My Type! | [Counter] if Leader Shirahoshi power battle; [Trigger] K.O. | none |
| OP11-116 | Merman Combat Ultramarine | [Main] add Character cost<=6 (any owner) to top or bottom of owner's Life face-up; [Trigger] same on opp Character cost<=4 | B3-G10 |
| OP11-117 | Fish-Man Island | Stage [Activate: Main] OPT if Leader Shirahoshi cost turnLifeFaceUp: power to Neptunian/Fish-Man/Merfolk | none |

### OP-10 (106 cards)

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| OP10-001 | Smoker | [Opp Turn] power to Navy/Punk Hazard Characters; Activate OPT if Character power>=7000 set 2 DON active | none |
| OP10-002 | Caesar Clown | [DON!! x2][When Attacking] cost return own Punk Hazard Character cost>=2 to hand: K.O. power<=4000 | B3-G7 |
| OP10-003 | Sugar | [End of Your Turn] if Donquixote Character power>=6000 set DON active; [Opp Turn] OPT eventActivated by you: addDon active | none |
| OP10-022 | Trafalgar Law | [DON!! x1] Activate OPT if total cost of your Characters >=5, cost return own Character to hand: reveal top Life card, if Supernovas Character cost<=5 may play it | B3-G41, B3-G7, B3-G47 |
| OP10-042 | Usopp | permanent cost +1 to Dressrosa Characters cost>=2; [Opp Turn] OPT when your Dressrosa Character is removed by opp effect or K.O.'d: if hand<=5 draw | B3-G17 |
| OP10-099 | Eustass"Captain"Kid | [End of Your Turn] cost turnLifeFaceUp: setActive Supernovas cost 3-8; grant Blocker until end of opp next turn | none |
| OP10-004 | Vergo | [On Play] lookAtTop 5 (type not name) | none |
| OP10-005 | Sanji | [Your Turn] +3000; [On K.O.] draw | none |
| OP10-006 | Caesar Clown | [On Play] lookAtTop reveal [Smiley]; rest bottom; play [Smiley] from hand | none |
| OP10-007 | Ceaser Soldier | [On Play] play Punk Hazard cost<=2 from hand | none |
| OP10-008 | Scotch | Blocker; [On Play] if no [Rock] play [Rock] from hand | none |
| OP10-009 | Smiley | [On Play] if Leader type power -3000 | none |
| OP10-010 | Chadros.Higelyges | [When Attacking] if <=1 Characters power>=6000 self power | none |
| OP10-011 | Tony Tony.Chopper | Blocker; [Opp Turn] +2000 | none |
| OP10-012 | Dragon Number Thirteen | Blocker (keyword only) | none |
| OP10-015 | Mocha | [On Play] power -1000 | none |
| OP10-016 | Monet | Activate restSelf: giveDon 2 rested; power -1000 | none |
| OP10-017 | Rock | [On Play] if no [Scotch] play [Scotch] from hand | none |
| OP10-023 | Issho | [On Play] if Leader Navy rest up to 2 opp Characters cost<=5 | none |
| OP10-024 | Edward.Newgate | [On Play] if 2+ rested Characters rest opp Character; K.O. rested cost<=3 | none |
| OP10-025 | Enel | [On Play] if 2+ rested Characters draw 3 trash 2 | none |
| OP10-026 | Kin'emon | Activate cost place this Character + 1 [Kin'emon] (power 0) from trash at deck bottom: play [Kin'emon] cost 6 from hand | B3-G15 |
| OP10-027 | Kin'emon | Activate cost place this Character + 1 [Kin'emon] (power 1000) from trash at deck bottom: play [Kin'emon] cost 6 from hand | B3-G15 |
| OP10-028 | Kouzuki Momonosuke | Activate cost restDon 2 + trashSelf: lookAtTop 5 take up to 2 | none |
| OP10-029 | Dracule Mihawk | [On Play] if 2+ rested Characters set rested ODYSSEY cost<=5 active | none |
| OP10-030 | Smoker | Banish; Activate: set 1 DON active; you cannot set DON!! active by Character effects this turn | B3-G49 |
| OP10-032 | Tashigi | replacement leaveField by opp effect (other green Character): restSelf instead | none |
| OP10-033 | Nami | [On Play] if 2+ rested ODYSSEY Characters: opp rested DON!! will not become active in next Refresh | B3-G51 |
| OP10-034 | Franky | OPT replacement: would be K.O.'d in battle, top Life to hand instead | B3-G4 |
| OP10-035 | Brook | [On K.O.] rest opp Leader or Character cost<=5 | none |
| OP10-036 | Perona | [Your Turn] OPT when a Character is rested by your effect: set DON active | B3-G25 |
| OP10-037 | Lim | OPT replacement leaveField by opp effect: rest 1 ODYSSEY Character instead; [End of Your Turn] setActive ODYSSEY | none |
| OP10-038 | Roronoa Zoro | [Opp Turn] if 2+ rested Characters +2000 | none |
| OP10-043 | Moocy | [On Play] cost rest Dressrosa Leader/Stage: grant Banish to [Luffy] | none |
| OP10-044 | Cub | [On Play] cost rest Dressrosa Leader/Stage: move opp Character cost<=1 to hand | none |
| OP10-045 | Cavendish | [When Attacking] OPT draw 2 trash 1 | none |
| OP10-046 | Kyros | [On Play] move Character cost<=5 to hand | none |
| OP10-047 | Koala | [When Attacking] cost return own RA Character cost>=3 to hand: self power | B3-G7 |
| OP10-048 | Sai | [On Play] cost rest Dressrosa Leader/Stage: move opp Character to hand | none |
| OP10-049 | Sabo | replacement leaveField by opp effect (other Character baseCost<=7): return this Character to hand instead | none |
| OP10-051 | Hack | [DON!! x1][When Attacking] lookAtTop 3 (type, Character) | none |
| OP10-052 | Bartolomeo | Blocker; [On Play] place Character cost<=1 at deck bottom | none |
| OP10-053 | Bian | permanent Blocker if Tontattas Character other | none |
| OP10-055 | Marco | Blocker; [On K.O.] move opp Character cost<=4 to hand | none |
| OP10-056 | Mansherry | [On Play] cost rest Dressrosa Leader/Stage + return own Dressrosa Character cost>=4 to hand: move opp Character to hand | B3-G7 |
| OP10-057 | Leo | [On Play] cost rest Leader or Stage: if Leader Usopp lookAtTop 5 take up to 2; trash 1 | none |
| OP10-058 | Rebecca | [On Play] if Character cost>=8 draw; reveal up to 2 Dressrosa Characters from hand, play 1, play other rested if cost<=4 | none |
| OP10-062 | Violet | Blocker; [On K.O.] cost DON!!-1: if Leader type trash Event to hand | none |
| OP10-063 | Vinsmoke Sanji | [On Play] if Leader type includes GERMA lookAtTop 5 | none |
| OP10-064 | Clone Soldier | Blocker (keyword only) | none |
| OP10-065 | Sugar | Activate cost restDon+restSelf: lookAtTop 5 | none |
| OP10-066 | Giolla | [On Opp Attack] OPT cost restDon 2: rest opp Character | none |
| OP10-069 | Fighting Fish | [DON!! x1][When Attacking] DON!!-1: K.O. cost<=1 | none |
| OP10-070 | Trebol | Blocker; [On Play] all Characters base power<=1000 cannot be K.O.'d by opp effects until end of opp next turn | B3-G2 |
| OP10-071 | Donquixote Doflamingo | [On Play] DON!!-1: play Donquixote Character cost<=5; [On Opp Attack] OPT cost restDon: addDon active | none |
| OP10-072 | Donquixote Rosinante | [On Play] cost trash Event: draw 2; [End of Your Turn] if DON>=7 set 2 DON active | none |
| OP10-074 | Pica | OPT replacement: K.O.'d by opp effect, rest 2 active DON instead | B3-G4 |
| OP10-075 | Foxy | Activate trashSelf: if DON<=opp draw | none |
| OP10-076 | Baby 5 | [On Play] cost trash: if Leader type addDon active | none |
| OP10-077 | Bellamy | Blocker; [On Block] cost restDon 2: addDon active | none |
| OP10-081 | Usopp | [On Play] cost rest Dressrosa Leader/Stage: K.O. cost<=2; trash 2 from top of deck | B3-G1 |
| OP10-082 | Kuzan | permanent cannot be removed by opp effects; Activate trashSelf: draw; play Blackbeard cost<=5 from trash | none |
| OP10-083 | Kouzuki Momonosuke | Activate cost restSelf + rest Dressrosa Leader/Stage: opp Character -2 cost | none |
| OP10-085 | Jesus Burgess | [DON!! x1] if trash>=8 Rush | none |
| OP10-086 | Shiryu | [Opp Turn] +2000; Activate OPT if Leader type and played this turn: K.O. baseCost<=3 | none |
| OP10-087 | Tony Tony.Chopper | Activate cost restSelf + rest Dressrosa Leader/Stage: if opp hand>=5 opp trashes 1; trash 2 from top of deck | B3-G1 |
| OP10-088 | Nami | Activate cost restSelf + rest Dressrosa Leader/Stage: draw 1; trash 2 from top of deck | B3-G1 |
| OP10-090 | Franky | Blocker; [On K.O.] play Dressrosa cost<=3 from trash rested | none |
| OP10-091 | Brook | Activate cost restSelf + rest Dressrosa Leader/Stage: K.O. cost<=1; trash 2 from top of deck | B3-G1 |
| OP10-092 | Perona | Activate OPT cost move 2 Thriller Bark cards trash to deck bottom: power to other Character | none |
| OP10-093 | Saint Homing | Activate trashSelf: black Character +3 cost until end of opp next turn | none |
| OP10-094 | Ryuma | [DON!! x1] gains Double Attack | none |
| OP10-095 | Roronoa Zoro | [On Play] cost rest Dressrosa Leader/Stage: K.O. cost<=4; trash 2 from top of deck | B3-G1 |
| OP10-100 | Inazuma | [DON!! x1][When Attacking] rest opp Character cost<=total Life; [Trigger] if Leader type and total Life<=5 play this card | none |
| OP10-102 | Emporio.Ivankov | Activate OPT: power to 3 RA Characters; top Life to hand | none |
| OP10-103 | Capone"Gang"Bege | [On Play] cost lifeToHand topOrBottom: add Supernovas Character from hand to top of Life face-up | none |
| OP10-104 | Caribou | [DON!! x1] if Leader Supernovas and opp Life>=3 cannot be K.O.'d in battle | B3-G2 |
| OP10-106 | Killer | [On K.O.] if Leader type lookAtTop 3 | none |
| OP10-107 | Jewelry Bonney | Blocker; [On Play] cost lifeToHand topOrBottom: add Supernovas Character cost 5 from hand to top of Life face-up | none |
| OP10-108 | Scratchmen Apoo | permanent Blocker if yellow Supernovas Character other | none |
| OP10-109 | Basil Hawkins | [On K.O.] trash up to 1 from top of opp's Life; [Trigger] draw 2 trash 1 | B3-G8 |
| OP10-110 | Heat & Wire | [On Play] rest opp Character cost<=opp Life; [Trigger] if life<=2 play this card | none |
| OP10-111 | Monkey.D.Luffy | [On Play] lookAtTop 5 (type not name) | none |
| OP10-112 | Eustass"Captain"Kid | [On Play] cost restSelf: trash up to 1 from top of opp's Life; [End of Your Turn] if opp Life<=2 draw, trash | B3-G8 |
| OP10-113 | Roronoa Zoro | permanent Rush if Life < opp Life; [Trigger] cost trash: if Leader type play this card | none |
| OP10-118 | Monkey.D.Luffy | Once per turn cannot be K.O.'d by opp effects; [When Attacking] cost move 3 trash to deck bottom: if opp hand>=5 opp trashes 1 | B3-G4 |
| OP10-119 | Trafalgar Law | [On Play] move Supernovas Character from hand to top of Life face-down; giveDon 1 rested to Supernovas Leader | none |
| OP10-018 | Ten-Layer Igloo | [Counter] power battle; power -2000; [Trigger] power | none |
| OP10-019 | Divine Departure | [Main] cost restDon 5: K.O. power<=8000; [Counter] Leader power | none |
| OP10-020 | Gum-Gum UFO | [Main] power -4000; if life<=2 power; [Trigger] K.O. | none |
| OP10-039 | Gum-Gum Dragon Fire Pistol Twister Star | [Main] if Leader type lookAtTop 5 take 2; [Trigger] rest | none |
| OP10-040 | The Weak Do Not Have the Right to Choose How They Die | [Main]/[Counter] K.O. rested cost<=7 | none |
| OP10-041 | Radio Knife | [Main] rest; K.O. rested; [Trigger] rest | none |
| OP10-059 | Fo...llow...Me...and...I...Will...Gui...de...You | [Main] lookAtTop 5; [Trigger] activate [Main] | none |
| OP10-060 | Barrier-Barrier Pistol | [Main] place opp Character power<=6000 at deck bottom; [Trigger] activate [Main] | none |
| OP10-061 | Special Long-Range Attack!! Bagworm | [Main] draw; move opp Character cost<=2 to hand; [Trigger] move Character to hand | none |
| OP10-078 | I Do Not Forgive Those Who Laugh at My Family!!! | [Main]/[Counter] lookAtTop 3 | none |
| OP10-079 | God Thread | [Main] K.O.; addDon active; [Trigger] addDon active | none |
| OP10-080 | Little Black Bears | [Counter] power battle; if DON>=7 and hand<=5 draw; [Trigger] addDon active | none |
| OP10-096 | There's No Longer Any Need for the Seven Warlords of the Sea!!! | [Main] K.O. Seven Warlords cost<=8; [Trigger] cost<=4 | none |
| OP10-097 | Gum-Gum Rhino Schneider | [Main] power; if trash>=10 grant Banish; [Trigger] draw 2 trash 1 | none |
| OP10-098 | Liberation | [Main] if Characters at least 2 fewer than opp: K.O. two; [Trigger] negate Leader and Character | none |
| OP10-115 | Let's Meet Again in the New World | [Counter] power battle; if 0 Life draw; [Trigger] K.O. cost<=opp Life | none |
| OP10-116 | Damned Punk | [Main] look at up to 1 of your or opp's top Life, place top or bottom; K.O.; [Trigger] draw trash | B3-G18 |
| OP10-117 | ROOM | [Counter] if Life<=1 power battle; setActive Character; [Trigger] draw | none |
| OP10-021 | Punk Hazard | Stage Activate restSelf: if Leader [Caesar] giveDon 1 rested | none |

### OP-09 (105 cards)

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| OP09-001 | Shanks | [On Opp Attack] OPT power -1000 | none |
| OP09-022 | Lim | permanent your Characters are played rested; Activate OPT cost restDon 3: addDon rested; play ODYSSEY cost<=5 from hand | B3-G43 |
| OP09-042 | Buggy | Activate cost restDon 5 + trash: play Cross Guild from hand | none |
| OP09-061 | Monkey.D.Luffy | [DON!! x1] all Characters +1 cost; [Your Turn] OPT when 2+ DON returned to DON deck: addDon active and addDon rested | B3-G22 |
| OP09-081 | Marshall.D.Teach | permanent your [On Play] effects are negated; Activate cost trash: opp [On Play] effects negated until end of opp next turn | B3-G40 |
| OP09-002 | Uta | [On Play] lookAtTop 5 | none |
| OP09-003 | Shachi & Penguin | [When Attacking] power -2000 | none |
| OP09-004 | Shanks | Rush; permanent all opp Characters -1000 power | none |
| OP09-005 | Silvers Rayleigh | Blocker; [On Play] if opp has 2+ Characters basePower>=5000 draw 2 trash 1 | none |
| OP09-007 | Heat | Blocker; [On Play] Leader power<=4000 power | none |
| OP09-008 | Building Snake | Activate cost place this Character at deck bottom: power -3000 | B3-G15 |
| OP09-009 | Benn.Beckman | [On Play] move opp Character power<=6000 to trash | none |
| OP09-010 | Bonk Punch | [On Play] play [Monster] from hand; [DON!! x1][When Attacking] power | none |
| OP09-011 | Hongo | Activate restSelf: if Leader type power -2000 | none |
| OP09-012 | Monster | replacement ko by an effect (other [Bonk Punch]): trash this Character instead | B3-G4 |
| OP09-013 | Yasopp | [On Play] Leader power until end of opp next turn; [DON!! x1][When Attacking] power -1000 | none |
| OP09-014 | Limejuice | [On Play] opp cannot activate up to 1 [Blocker] Character power<=4000 this turn | B3-G14 |
| OP09-015 | Lucky.Roux | Blocker; [On K.O.] if Leader type K.O. basePower<=6000 | none |
| OP09-017 | Wire | [DON!! x1] if Leader power>=7000 and Kid Pirates grant Rush | none |
| OP09-023 | Adio | [On Play] if Leader type set 3 DON active; [On Opp Attack] OPT cost restDon: power battle | none |
| OP09-024 | Usopp | [On Play] if 2+ rested Characters draw 2 trash 2 | none |
| OP09-025 | Crocodile | if Leader ODYSSEY cannot be K.O.'d in battle by Leaders | B3-G2 |
| OP09-026 | Sakazuki | [On Play] if 2+ rested Characters K.O. cost<=5 | none |
| OP09-027 | Sabo | [When Attacking] OPT if 3+ rested Characters draw | none |
| OP09-028 | Sanji | [On K.O.] cost lifeToHand topOrBottom: play ODYSSEY/Straw Hat cost<=4 from trash rested | none |
| OP09-029 | Tony Tony.Chopper | [End of Your Turn] setActive ODYSSEY cost<=4 | none |
| OP09-030 | Trafalgar Law | [On Play] cost return own Character to hand: play ODYSSEY cost<=3 not self from hand | B3-G7 |
| OP09-031 | Donquixote Doflamingo | Blocker; [End of Your Turn] if 2+ rested Characters set self active | none |
| OP09-032 | Donquixote Rosinante | Blocker; [On Opp Attack] OPT set self active | none |
| OP09-033 | Nico Robin | [On Play] if 2+ rested Characters ODYSSEY/Straw Hat Characters cannot be K.O.'d by effects until end of opp next turn | B3-G2 |
| OP09-034 | Perona | [On Play] lookAtTop 5 (name or type); trash 1 | none |
| OP09-035 | Portgas.D.Ace | [On Play] if 2+ rested Characters rest opp Character cost<=5 | none |
| OP09-036 | Monkey.D.Luffy | [On Play] if 2+ rested Characters rest opp DON!! or Character cost<=6 | none |
| OP09-037 | Lim | [On Play] lookAtTop 5; [End of Your Turn] if 3+ rested Characters set self active | none |
| OP09-043 | Alvida | [On K.O.] if Leader type play Character cost<=5 from hand | none |
| OP09-044 | Izo | [When Attacking] lookAtTop 5 (type or typeIncludes); trash 1 | none |
| OP09-045 | Cabaji | if you have [Buggy] or [Mohji] cannot be K.O.'d in battle | B3-G2 |
| OP09-046 | Crocodile | [On Play] play Cross Guild or Baroque Works Character cost<=5 from hand | none |
| OP09-047 | Kouzuki Oden | Double Attack; [On K.O.] draw 2 trash 1 | none |
| OP09-048 | Dracule Mihawk | Blocker; [On Play] draw 2 trash 1 | none |
| OP09-050 | Nami | [When Attacking] lookAtTop 5 (blue Event) | none |
| OP09-051 | Buggy | [On Play] place opp Character at deck bottom; if not 5 Characters cost>=5 place this at deck bottom | none |
| OP09-052 | Marco | [Opp Turn] cost trash: when K.O.'d by opp effect play this card from trash rested | B3-G12 |
| OP09-053 | Mohji | [On Play] lookAtTop reveal [Richie]; play [Richie] from hand | none |
| OP09-054 | Richie | Blocker (keyword only) | none |
| OP09-056 | Mr.3(Galdino) | [On Play] lookAtTop 4 | none |
| OP09-064 | Killer | [On Play] DON!!-1: setActive Kid Pirates Leader | none |
| OP09-065 | Sanji | [On Play] cost return 1 or more DON to DON deck: grant Rush self; rest opp Character cost<=6 | B3-G6 |
| OP09-066 | Jean Bart | [On Play] if opp DON > yours K.O. cost<=3 | none |
| OP09-068 | Tony Tony.Chopper | [End of Your Turn] cost return 1 or more DON: set self active; grant Blocker until end of opp next turn | B3-G6 |
| OP09-069 | Trafalgar Law | [On Play] lookAtTop 4 (type, cost>=2) | none |
| OP09-070 | Nami | [On Play] cost return 1 or more DON: giveDon 2 rested | B3-G6 |
| OP09-071 | Nico Robin | Blocker (keyword only) | none |
| OP09-073 | Brook | [When Attacking] cost return 1 or more DON: power -2000 to up to 2 opp Characters | B3-G6 |
| OP09-074 | Bepo | [Your Turn] OPT donReturned: power this turn | none |
| OP09-075 | Eustass"Captain"Kid | [On Play] cost lifeToHand: if Leader type addDon active | none |
| OP09-076 | Roronoa Zoro | [On Play] cost return 1 or more DON: addDon active | B3-G6 |
| OP09-083 | Van Augur | Activate restSelf: if Leader type opp Character -3 cost; [On K.O.] draw | none |
| OP09-084 | Catarina Devon | Activate OPT if Leader type: chooseOne grant Double Attack / Banish / Blocker to self until end of opp next turn | none |
| OP09-085 | Gecko Moria | [On Play] play Thriller Bark Character cost<=2 from trash rested | none |
| OP09-086 | Jesus Burgess | cannot be K.O.'d by opp effects; if Leader type +1000 power for every 4 cards in trash | B3-G2, B3-G20 |
| OP09-087 | Charlotte Pudding | [On Play] if opp hand>=5 opp trashes 1 | none |
| OP09-088 | Shiryu | [DON!! x1][When Attacking] cost trash 2: draw 2 | none |
| OP09-089 | Stronger | Activate cost trash 1 + trashSelf: if Leader type draw; opp Character -2 cost | none |
| OP09-090 | Doc Q | Activate restSelf: if Leader type K.O. cost<=1; [On K.O.] draw | none |
| OP09-091 | Vasco Shot | Blocker (keyword only) | none |
| OP09-092 | Marshall.D.Teach | Activate restSelf: if hand >=3 fewer than opp: draw 2 trash 1 | none |
| OP09-093 | Marshall.D.Teach | Blocker; Activate OPT if Leader type and played this turn: negate opp Leader; negate opp Character and it cannot attack until end of opp next turn | none |
| OP09-095 | Laffitte | Activate cost restDon+restSelf: lookAtTop 5 | none |
| OP09-100 | Karasu | Blocker; [Trigger] if Leader type and total Life<=5 play this card | none |
| OP09-101 | Kuzan | [On Play] cost place opp Character cost<=3 at top or bottom of opp's Life face-up: opp trashes 1 | B3-G10 |
| OP09-102 | Professor Clover | [On Play] if Leader Robin lookAtTop 3 (hasTrigger); [Trigger] activate [On Play] | none |
| OP09-103 | Koala | Blocker; [On Play] cost lifeToHand topOrBottom: play RA cost<=4 from hand; if you do draw | none |
| OP09-104 | Sabo | [On Play] add RA Character from hand to top of Life face-up; if Life>=2 add 1 card from top or bottom of Life to hand (action form); [Trigger] if multicolored draw 2 | B3-G37 |
| OP09-105 | Sanji | [Trigger] if Leader type deckTop to Life; trash 2 from hand | none |
| OP09-106 | Nico Olvia | [On Play] Robin Leader power; [Trigger] if Leader Robin draw 3 trash 2 | none |
| OP09-107 | Nico Robin | [On Play] if opp Life>=3 trash up to 1 from top of opp's Life; [Trigger] play yellow Character cost<=3 from hand | B3-G8 |
| OP09-108 | Bartholomew Kuma | [Trigger] if Leader type and total Life<=5 play this card | none |
| OP09-109 | Jaguar.D.Saul | Blocker; [Trigger] if Leader Robin play this card | none |
| OP09-110 | Pierre | [On Play] draw 2 trash 2; [Trigger] play this card | none |
| OP09-111 | Brook | [Trigger] if Leader type and opp hand>=6 opp trashes 2 | none |
| OP09-112 | Belo Betty | [On Play] if life<=2 draw; [Trigger] if Leader type and total Life<=5 play this card | none |
| OP09-114 | Lindbergh | [On Play] if total Life<=5 K.O. power<=2000; [Trigger] if total Life<=5 play this card | none |
| OP09-118 | Gol.D.Roger | Rush; when opp activates [Blocker], if either player has 0 Life you win the game | B3-G55 |
| OP09-119 | Monkey.D.Luffy | [On Play] cost return 1 or more DON: draw; grant Rush self | B3-G6 |
| OP09-018 | Get Out of Here! | [Main] K.O. up to 2 opp Characters with total power <=4000 | B3-G44 |
| OP09-019 | Nobody Hurts a Friend of Mine!!!! | [Main] if Leader type power -3000; if opp has power>=5000 Character draw; [Trigger] draw | none |
| OP09-020 | Come On!! We'll Fight You!! | [Main] lookAtTop 5; [Trigger] draw | none |
| OP09-039 | Gum-Gum Cuatro Jet Cross Shock Bazooka | [Counter] if Leader type and 2+ rested Characters power this turn; [Trigger] K.O. rested cost<=4 | none |
| OP09-040 | Thunder Lance Flip Caliber Phoenix Shot | [Main] if 2+ rested Characters K.O.; [Trigger] rest | none |
| OP09-041 | Soul Franky Swing Arm Boxing Solid | [Counter] power battle; if Leader type and 2+ rested Characters set 2 Characters active; [Trigger] rest | none |
| OP09-057 | Cross Guild | [Main] lookAtTop 4; [Trigger] activate [Main] | none |
| OP09-058 | Special Muggy Ball | [Main] opponent chooses own Character cost<=6 and returns it to hand; [Trigger] move Character to hand | none |
| OP09-059 | Murder at the Steam Bath | [Counter] power battle; trash up to 2 from hand; trash same number from top of deck; [Trigger] draw | B3-G1 |
| OP09-079 | Gum-Gum Jump Rope | [Main] DON!!-2: rest; draw; [Trigger] addDon active | none |
| OP09-096 | My Era...Begins!! | [Main] lookAtTop 3 rest trash; [Trigger] activate [Main] | none |
| OP09-097 | Black Vortex | [Counter] negate and power; [Trigger] negate | none |
| OP09-098 | Black Hole | [Main] if Leader type negate; if cost<=4 K.O. it; [Trigger] negate | none |
| OP09-115 | Ice Block Partisan | [Main] K.O. cost<=3 with [Trigger]; [Trigger] draw | none |
| OP09-116 | Never Underestimate the Power of Miracles!! | [Counter] power battle; [Trigger] play RA cost<=4 from hand | none |
| OP09-117 | Dereshi! | [Main] lookAtTop 5 take up to 2 hasTrigger; [Trigger] draw | none |
| OP09-021 | Red Force | Stage Activate restSelf: if Leader type power -1000 | none |
| OP09-060 | Emptee Bluffs Island | Stage Activate cost move 2 hand cards to deck bottom + restSelf: if Leader type draw 2 | none |
| OP09-080 | Thousand Sunny | Stage [Opp Turn] cost restSelf: when your Straw Hat Character is removed from field by opp effect addDon rested | B3-G17 |
| OP09-099 | Fullalead | Stage Activate cost trash 1 + restSelf: lookAtTop 3 | none |

### EB-02 (52 cards)

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| EB02-010 | Monkey.D.Luffy | Activate OPT DON!!-2: if only Straw Hat Characters set 2 DON active; Leader power until end of opp next turn | none |
| EB02-002 | Sabo | Activate restSelf: power to other RA Character | none |
| EB02-003 | Tony Tony.Chopper | [DON!! x2][Opp Turn] +2000; [On Play] if Leader type giveDon 1 rested | none |
| EB02-005 | Fake Straw Hat Crew | [Your Turn] +2000; [Opp Turn] "Give this Character 2000 power" (sign missing) | none (see Q2) |
| EB02-006 | Yamato | Activate OPT if Leader type or Ace: giveDon rested to Leader; grant Rush self | none |
| EB02-011 | Arlong | [On Play] if Leader type giveDon rested to Leader; opp Character cost<=5 cannot be rested until end of opp next turn | B3-G13 |
| EB02-012 | Gaimon | permanent Blocker if you have [Sarfunkel] | none |
| EB02-013 | Carrot | [On Play] if DON>=3 lookAtTop 7 reveal [Zou]; play [Zou] from hand | none |
| EB02-014 | Sarfunkel | [On Play] play [Gaimon] from hand | none |
| EB02-015 | Jewelry Bonney | [On Play] skipRefresh opp rested Character; delayed set DON active at end of turn | none |
| EB02-016 | Chopperman | rules alsoNamed [Tony Tony.Chopper]; [On Play] play Animal cost<=3 from hand | none |
| EB02-018 | Buggy | [On Play] if no other [Buggy] Leader gains Double Attack; [Trigger] rest | none |
| EB02-019 | Roronoa Zoro | permanent grant Rush: Character if opp has 2+ Characters; [On Play] if Leader type rest | none |
| EB02-022 | Usopp | [On Play] if <=2 Characters power>=5000 play Character power<=6000 with no base effect from hand | B3-G23 |
| EB02-023 | Crocodile | [Your Turn] OPT when opp's Character is returned to hand by your effect: look at 3 place top or bottom | B3-G17 |
| EB02-024 | Sogeking | rules alsoNamed [Usopp]; [On Play] draw 2; place 2 hand cards at deck bottom; move Character cost<=1 to hand | none |
| EB02-025 | Donquixote Rosinante | Activate cost restDon+restSelf: if Leader Rosinante look at 5, play Character cost<=2 rested, rest bottom | B3-G19 |
| EB02-026 | Nefeltari Vivi | [On Play] if Leader multicolored and hand<=5 draw 2 | none |
| EB02-027 | Vista | [On Play] place opp Character power<=1000 at deck bottom | none |
| EB02-028 | Portgas.D.Ace | [On Play] if Leader type lookAtTop 5 (Character cost 2); play Character cost 2 from hand rested | none |
| EB02-032 | Iceburg | [On Play] if DON>=3 lookAtTop 7 reveal [Galley-La]; play from hand | none |
| EB02-033 | Klabautermann | permanent Blocker if [Merry Go] on field | none |
| EB02-035 | Sanji & Pudding | [Your Turn] OPT when 2+ DON returned: addDon active; [On Play] if DON<=opp draw | B3-G22 |
| EB02-036 | Nico Robin | Blocker; [On K.O.] DON!!-1: lookAtTop 3 | none |
| EB02-037 | Franky | [On Play]/[When Attacking] if Leader type and DON<=opp addDon rested | none |
| EB02-038 | Magellan | [On Play] play Impel Down cost<=2 from hand | none |
| EB02-044 | Sengoku | Blocker; [On Play] play black Navy cost<=4 from trash rested | none |
| EB02-045 | Trafalgar Law | Blocker; [On Play] cost move 2 trash to deck bottom: chooseOne draw / opp trashes | none |
| EB02-046 | Hildon | [On Play] trash 2 from top of deck; opp Character -1 cost | B3-G1 |
| EB02-047 | Blueno | Activate cost trash 1 + trashSelf: play CP Character cost<=5 from trash | none |
| EB02-048 | Brook | [On Play] move [Laboon] trash to hand; [On K.O.] play [Laboon] cost<=4 from hand | none |
| EB02-049 | Monkey.D.Garp | [On Play] giveDon 2 rested to Leader; Activate restSelf: if Leader Garp K.O. | none |
| EB02-053 | Myskina Olga | [On Play]/[On K.O.] look at up to 1 of your or opp's top Life, place top or bottom | B3-G18 |
| EB02-054 | Sanji | Blocker; [On Play] if life<=2 draw 2 trash 1 | none |
| EB02-055 | Jinbe | [Trigger] if Leader type and life<=2 play this card | none |
| EB02-056 | Vegapunk | Blocker; [On Play] look at 5, play Scientist cost<=5 not self, rest bottom; if opp <=2 Characters trash 1; [Trigger] draw | B3-G19 |
| EB02-057 | Mad Treasure | [When Attacking] cost lifeToHand topOrBottom: add opp Character cost<=3 to top or bottom of opp's Life face-up | B3-G10 |
| EB02-061 | Monkey.D.Luffy | permanent Rush if multicolored and opp DON>=5; [When Attacking] OPT cost return 2 active DON: set self active; top Life to hand | B3-G29 |
| EB02-007 | Cloven Rose Blizzard | [Main] power up to 3 Leader/Characters; K.O. power<=3000; [Trigger] K.O. | none |
| EB02-008 | The Peak | [Main] lookAtTop 4 (cost>=4); [Trigger] activate [Main] | none |
| EB02-020 | We Are! | [Main] lookAtTop 4 (cost>=4); [Trigger] activate [Main] | none |
| EB02-030 | And That's When Somebody Makes Fun of Their Friend's Dream!!!! | [Counter] if any Character would be K.O.'d in battle this turn, may trash 1 from hand instead; [Trigger] draw | B3-G52, B3-G4 |
| EB02-031 | Hope | [Main] lookAtTop 4 (cost>=4); [Trigger] activate [Main] | none |
| EB02-039 | GERMA 66 | [Main] cost trash GERMA 66 Character power<=4000: if DON<=opp play Character power 5000-7000 with same name as trashed card from trash | B3-G35 |
| EB02-040 | BRAND NEW WORLD | [Main] lookAtTop 4 (cost>=4); [Trigger] activate [Main] | none |
| EB02-050 | Kokoro no Chizu | [Main] lookAtTop 4 (cost>=4); [Trigger] activate [Main] | none |
| EB02-051 | Three-Pace Hum Soul Notch Slash | [Main] chooseOne K.O. cost<=2 / cost -4 | none |
| EB02-058 | UUUUUS! | [Main] lookAtTop 4 (cost>=4); [Trigger] activate [Main] | none |
| EB02-059 | Without Your Help I Can't Become the King of the Pirates!!!! | [Counter] power battle; if life<=1 play yellow Straw Hat or [Sanji] cost<=5 from hand | none |
| EB02-009 | Thousand Sunny | Stage Activate restSelf: move a given DON!! from one card to a Straw Hat Character | B3-G39 |
| EB02-041 | Merry Go | Stage [On Play] if Leader type draw; Activate restSelf: if DON<=opp Straw Hat Character +2 cost until end of opp next turn | none |
| EB02-060 | Merry Go | Stage Activate cost restSelf + turnLifeFaceUp: Straw Hat Character power until end of opp next turn | none |

### PRB-02 (18 cards)

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| PRB02-001 | Koby | [Opp Turn] if Leader Navy +1000; [When Attacking] K.O. basePower<=3000; if hand<=6 draw | none |
| PRB02-002 | Trafalgar Law | OPT replacement leaveField by opp effect: this Character power -2000 instead; [When Attacking] power -2000 | none |
| PRB02-003 | Lucky.Roux | Blocker; [On Play] cost trash Character power>=6000 from hand: draw 2 | none |
| PRB02-004 | Jewelry Bonney | Blocker; [On Opp Attack] OPT set DON active | none |
| PRB02-005 | Monkey.D.Luffy | [Your Turn][On Play] if multicolored and opp DON<=7: opponent rests 1 active DON at start of their next Main Phase | B3-G34 |
| PRB02-006 | Roronoa Zoro | [Opp Turn] replacement: if this Character would be rested by opp Character's effect rest another Character instead; Blocker | B3-G48 |
| PRB02-007 | Jinbe | [On Play] lookAtTop 5 | none |
| PRB02-008 | Marco | Blocker; [On K.O.] draw 2 | none |
| PRB02-009 | Mr.3(Galdino) | Blocker; when this Character is rested by opp's effect: may trash this Character and draw 2 | B3-G25 |
| PRB02-010 | Charlotte Pudding | [On Play] DON!!-2: if Leader type and opp DON>=6 draw 2; play Big Mom Character power 6000-8000 from hand | none |
| PRB02-011 | Donquixote Doflamingo | Blocker; [On Play] if multicolored addDon rested | none |
| PRB02-012 | Nami | [On Play] lookAtTop 5; [Trigger] play this card | none |
| PRB02-013 | Gecko Moria | [On Play] if Leader type play Character cost<=4 from trash rested; giveDon 1 rested | none |
| PRB02-014 | Sabo | Blocker; in-hand permanent cost -3 if trash>=15 | none |
| PRB02-015 | Shiryu | permanent Blocker +4 cost if Leader type; [On K.O.] if Leader type K.O. baseCost<=4 | none |
| PRB02-016 | Otama | Activate cost restSelf + lifeToHand topOrBottom: Leader/Character power; [Trigger] rest | none |
| PRB02-017 | Boa Hancock | OPT cost trash card with [Trigger]: opp rested Leader or a Character other than [Luffy] cannot attack until end of opp next turn (timing header missing, see OQ); [Trigger] K.O. | none (see Q3) |
| PRB02-018 | Portgas.D.Ace | [On Play] if you have a face-up Life card play [Sabo]/[Ace]/[Luffy] cost 2 from hand or trash | B3-G28 |

### PRB-01 (1 cards)

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| PRB01-001 | Sanji | Activate OPT: Character without an [On Play] effect and cost<=8 gains Rush | B3-G23 |

### ST-21 (10 cards)

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| ST21-001 | Monkey.D.Luffy | [DON!! x1] Activate OPT giveDon 2 rested to a Character | none |
| ST21-002 | Usopp | [DON!! x2][Opp Turn] +2000 | none |
| ST21-004 | Jewelry Bonney | [DON!! x2][On K.O.] draw | none |
| ST21-007 | Sentomaru | Blocker (keyword only) | none |
| ST21-009 | Nami | Activate OPT giveDon 2 rested to Straw Hat Leader/Character | none |
| ST21-010 | Nico Robin | [DON!! x2][When Attacking] K.O. power<=4000 | none |
| ST21-011 | Franky | [DON!! x2][Opp Turn] Straw Hat Characters base power<=4000 +1000 | none |
| ST21-012 | Brook | [When Attacking] giveDon 2 rested | none |
| ST21-015 | Roronoa Zoro | [DON!! x2] Rush; [On K.O.] play red Character power<=6000 not self from hand | none |
| ST21-016 | Gum-Gum Dawn Whip | [Main] power; opp Character power<=4000 cannot activate [Blocker]; [Trigger] K.O. | B3-G14 |

### ST-20 (5 cards)

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| ST20-001 | Charlotte Katakuri | Blocker; Activate OPT cost turnLifeFaceUp: giveDon 1 rested | none |
| ST20-002 | Charlotte Cracker | OPT replacement: K.O.'d by an effect, trash top Life card instead; [Trigger] cost trash: play this card | B3-G4, B3-G8 |
| ST20-003 | Charlotte Brulee | [Trigger] look at up to 1 of your or opp's top Life, place top or bottom; add this card to hand | B3-G18, B3-G21 |
| ST20-004 | Charlotte Pudding | [On Play] cost lifeToHand: setActive Big Mom Character cost<=3; [Trigger] rest | none |
| ST20-005 | Charlotte Linlin | [On Play] cost trash: opponent chooses: trash 2 from hand or trash 1 from top of own Life | B3-G8 |

### ST-19 (5 cards)

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| ST19-001 | Smoker | [On Play] cost trash black Navy: up to 2 opp Characters cost<=4 cannot attack until end of opp next turn | none |
| ST19-002 | Sengoku | [On Play] cost trash 2 black Navy: if Leader type draw 3 | none |
| ST19-003 | Tashigi | [On Play] if Leader Smoker opp Character -4 cost; Activate OPT if played this turn: move opp Character cost 0 to trash | none |
| ST19-004 | Hina | [DON!! x1][Opp Turn] +4 cost; Activate OPT cost move 1 trash to deck bottom: giveDon 1 rested | none |
| ST19-005 | Monkey.D.Garp | Blocker; Activate OPT cost move 1 trash to deck bottom: opp Character -1 cost | none |

### ST-18 (5 cards)

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| ST18-001 | Uso-Hachi | [On Play] if DON>=8 rest opp Character cost<=5 | none |
| ST18-002 | O-Nami | Blocker; [On Play] if DON>=8 trash 1 and draw 2 | none |
| ST18-003 | San-Gorou | [When Attacking] OPT if DON>=8 draw | none |
| ST18-004 | Zoro-Juurou | [On Play] lookAtTop 5 (purple Straw Hat) | none |
| ST18-005 | Luffy-Tarou | [On Play] DON!!-1: play purple Straw Hat Character cost<=5 from hand | none |

### ST-17 (4 cards)

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| ST17-001 | Crocodile | [On Play] reveal top card: if Seven Warlords type draw 2, place 1 hand card on top of deck | none |
| ST17-002 | Trafalgar Law | [On Play] cost return own Character to hand: if Leader type move Character cost<=4 to hand | B3-G7 |
| ST17-003 | Buggy | [On Play] look at 3 cards and place them on top in any order | B3-G38 |
| ST17-005 | Marshall.D.Teach | Activate OPT cost move 1 hand card to deck top: giveDon 2 rested | none |

### ST-16 (5 cards)

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| ST16-001 | Uta | Blocker; Activate OPT cost trash FILM: giveDon 1 rested | none |
| ST16-002 | Gordon | Blocker; [On Opp Attack] may trash any number of Music cards from hand: Leader or Character +1000 per card trashed | B3-G30 |
| ST16-003 | Charlotte Katakuri | permanent +2000 if Leader FILM and 6+ rested cards | none |
| ST16-004 | Shanks | [On Play] K.O. opp rested Character | none |
| ST16-005 | Monkey.D.Luffy | permanent +1000 if you have rested [Uta] | none |

### ST-15 (5 cards)

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| ST15-001 | Atmos | [When Attacking] if Leader Newgate you cannot add Life cards to hand using your own effects this turn | B3-G50 |
| ST15-002 | Edward.Newgate | [On Play] giveDon 1 rested; Activate restSelf: K.O. power<=5000 | none |
| ST15-003 | Kingdew | Blocker; [Opp Turn] when this Character is K.O.'d by an effect: Leader power this turn | B3-G12 |
| ST15-004 | Thatch | [On Play] if Leader type power -2000; top Life to hand | none |
| ST15-005 | Portgas.D.Ace | permanent Rush if Leader type; OPT replacement leaveField by opp effect: power +2000 this turn instead | none |

### ST-26 (5 cards)

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| ST26-001 | Soba Mask | in-hand permanent cost -5 if you have [San-Gorou] or [Sanji] base power>=7000; [On Play] return all [San-Gorou] and [Sanji] Characters to hand | none |
| ST26-002 | Tony Tony.Chopper | Blocker; [On Play] DON!!-2: rest opp DON!! or Character cost<=1 | none |
| ST26-003 | Nico Robin | [On Play] DON!!-2: addDon active | none |
| ST26-004 | General Franky | [On Play] DON!!-2: power -2000 up to 2 opp Characters | none |
| ST26-005 | Monkey.D.Luffy | [On Play]/[When Attacking] DON!!-2: if multicolored and opp DON>=5 Straw Hat Leader base power 7000 until end of opp next turn | none |

### ST-27 (5 cards)

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| ST27-001 | Avalo Pizarro | Activate OPT cost rest [Fullalead]: if Leader type self +4000; [On K.O.] draw | none |
| ST27-002 | Catarina Devon | Activate trashSelf: if Leader type opp Character -1 cost; [On K.O.] draw | none |
| ST27-003 | Kuzan | Blocker; [On K.O.] play Blackbeard Character cost<=5 from trash rested | none |
| ST27-004 | Sanjuan.Wolf | permanent Blocker + cost +1 per 4 cards in trash if Leader type; [On Play] trash 1 | B3-G20 |
| ST27-005 | Marshall.D.Teach | Activate restSelf: K.O. Character cost<=3 (any owner); [On K.O.] move black card from trash to hand | none |

## 3. Gap list

IDs are ordered by the number of block-3 cards that need the gap. Sizes: S = under about 4 hours including a planted test, M = a day, L = several days or an API/UI change.

### B3-G1: Action `mill` (trash cards from the top of a deck as an effect, not a cost)

- **Size:** S.   **Cards (13):** EB02-046, OP09-059, OP10-081, OP10-087, OP10-088, OP10-091, OP10-095, OP11-043, OP11-082, OP11-084, OP12-084, OP12-096, OP12-098.
- `mill` is in the `Action` type (`dsl.ts`: `{ mill: { player, n } }`) but absent from `IMPLEMENTED.actions`, so `validateScript` rejects it, and `run.ts` `action()` has no branch (only the cost `{ mill: n }` runs, in `payCost`). Needed: a `mill` branch in `run.ts` `action()` that moves the top n cards of `player`'s deck to trash face-up (`moveCard(..., 'trash', { reason: 'effect' })`), clamped to the deck size (no anomaly), plus validator acceptance. `n` must be a `Num` (OP09-059 mills "the same number as you trashed from hand", via `refCount` of a bound `trashFromHand`); the current type is `number`. Also needed for the trigger-side "draw 1 and trash 1 from the top of your deck" cards. Deck-out interplay: milling an empty or near-empty deck must not lose the game by itself (no draw).

### B3-G2: Scoped `cannotBeKOd`: by opponent effects / by effects / in battle, with an optional source filter, permanent or timed, one variant once per turn

- **Size:** M.   **Cards (10):** OP09-025, OP09-033, OP09-045, OP09-086, OP10-070, OP10-104, OP11-005, OP11-046, OP12-024, OP12-036.
- `Restriction.cannotBeKOd` maps to `ModKind cannotBeKOd` and `flow.ts` `runKo` blocks every K.O. whatever the cause (`dv.cannotBeKOd`); `cannotBeRemovedByOpponentEffects` blocks removal and K.O. by opponent effects only. Neither expresses: (a) "cannot be K.O.'d by your opponent's effects" (not bounce/removal: OP12-024, OP09-086, OP10-070 timed, OP10-118 once per turn); (b) "by effects" of either player, timed (OP09-033); (c) "by effects of Characters without the (Special) attribute" (OP11-005, needs the effect source's card, so also B3-G3); (d) "cannot be K.O.'d in battle" unconditional (OP10-104, OP09-045) or "in battle by (Slash) attribute cards" (OP12-036) or "by Leaders" (OP09-025), which needs the battle attacker's filter. Proposed shape: `restrict: { what: { cannotBeKOd: { cause: 'opponentEffect' | 'effect' | 'battle', by?: Filter } } }` in `dsl.ts`/`dsl-validate.ts` `restriction()`, a `ModKind` per scope plus a `filter` on the modifier (as `cannotPlay` already does), `derive.ts` stage 5 and `layers.ts` `RESTRICT_KIND`, and `flow.ts` `runKo` reading the cause (`f.cause`) and, for battle, the attacker (the battle frame). OP10-118's "once per turn" is a shield consumed on first prevented K.O.: either an `oncePerTurn` flag on the permanent or modelled as a mandatory replacement (see B3-G4). OP11-046 additionally needs B3-G13.

### B3-G3: Filter `attribute` ((Slash), (Special), (Strike), ...), also usable in `leader`/`self` conditions

- **Size:** S.   **Cards (8):** OP11-005, OP11-006, OP11-088, OP12-021, OP12-027, OP12-028, OP12-034, OP12-036.
- `Filter` has no attribute test although `defs.ts` carries `attributes` (`card.attributes`) and `schema.ts` has `Attribute`. Add `{ attribute: Attribute }` to `dsl.ts` `Filter`, `dsl-validate.ts` `filter()`, and a branch in `eval.ts` `matchesOf` (`def.attributes.includes`). Used in `leader` conditions ("If your Leader has the (Slash) attribute"), selector filters (opponent's (Special) Characters), `lookAtTop` take filters, and the "by effects of Characters without (Special)" source filter of OP11-005.

### B3-G4: Replacement `ko` with a cause (by opponent effect / by an effect / in battle), plus a mandatory empty-payload form

- **Size:** S.   **Cards (7):** EB02-030, OP09-012, OP10-034, OP10-074, OP10-118, OP12-027, ST20-002.
- `ReplaceEvent` is `{ ko: Selector } | { leaveField: Selector; cause: 'opponentEffect' }`: a `ko` replacement has no cause, so it fires on every K.O. (`flow.ts` `collectReplacements`, `event === 'ko'`). Needed: `{ ko: Selector; cause?: 'opponentEffect' | 'effect' | 'battle' }` in `dsl.ts`, `dsl-validate.ts` (`replaces` branch only accepts `cause` for `leaveField`) and `collectReplacements` filtering on `Cause` (`kind`, `by`). Cards: K.O.'d by opp effect (OP12-027 for another Character, OP10-074), by an effect of either player (OP09-012 for another Character, ST20-002), in battle (OP10-034; EB02-030 as a timed variant, see B3-G52). OP10-118 ("once per turn cannot be K.O.'d by your opponent's effects") can be this with `optional: false`, `oncePerTurn` and an empty `instead`; the validator's `isEffect([])` is false so it would be read as an empty cost list: confirm the runtime treats that as "prevented" or add an explicit `instead: 'prevent'`.

### B3-G5: "Choose a cost" + reveal the top card of the OPPONENT's deck and compare

- **Size:** L.   **Cards (6):** OP11-066, OP11-071, OP11-073, OP11-074, OP11-079, OP11-081.
- Needs three things the runtime lacks: (1) a decision to choose a number 0..10 (new `Decision` kind or an `options` choice list, `state.ts`, `api.ts`; UI), (2) `reveal` of the opponent's deck top (`dsl.ts` `reveal: { from: 'deckTop' }` has no `player`; `run.ts` `action` reads `d.ro(you).deck[0]` and the validator allows only `n: 1`), with the revealed card staying on top and visible to both, (3) a Num/Condition reading the chosen number (e.g. `{ chosen: Name }`, then `cmp [{ refStat: 'revealed', stat: 'cost' }, '=', { chosen }]`). The match result gates K.O./power/draw/rest/addDon. Hidden-information care: the chosen number is public, the revealed card becomes public (`markKnown`), no info leaks about unrevealed cards. 6 cards, the biggest single new shape in this slice.

### B3-G6: Cost `returnDon` with a variable count ("return 1 or more DON!! cards from your field to your DON!! deck")

- **Size:** M.   **Cards (6):** OP09-065, OP09-068, OP09-070, OP09-073, OP09-076, OP09-119.
- `Cost.donMinus` and `returnDon` take a fixed integer; `returnDon` in `run.ts` asks which classes to return for a fixed n. Needed: `{ returnDon: { atLeast: 1 } }` (or `'oneOrMore'`): the player chooses n >= 1 (a number decision, cap = DON!! on field), `payable` = at least 1 DON!! on field, and the chosen n bound for later steps if the effect scales (none of the 6 cards scales on n; they only need n >= 1). Fires `donReturned` once. Also affects the optional-cost prompt text (`costText`). Cards: OP09-065, OP09-068, OP09-070, OP09-073, OP09-076, OP09-119.

### B3-G7: Cost `move` from the field: return your own Character to hand as a cost

- **Size:** M.   **Cards (6):** OP09-030, OP10-002, OP10-022, OP10-047, OP10-056, ST17-002.
- `dsl-validate.ts` `cost()` allows a `move` cost only from `hand`/`trash` (`zonesIn(..., ['hand','trash'])`), and `run.ts` `payCost` `move` calls `placeCards` for hand/trash cards only. Needed: cost `{ move: { from: 'characters'|'field', owner: you, filter, pick exactly 1 }, to: { zone: 'hand' } }` routed through `pushRemove` (a removal with `cause.kind = 'cost'`; replacement hooks and [On K.O.]-free), `payable()` in `eval.ts` (the `move` branch counts `pool`, which works for field zones), and the interaction that the returned Character may also be the card paying (OP09-030 Law may return itself). Cards: OP10-002, OP10-022, OP10-047, OP10-056, OP09-030, ST17-002. OP10-056 combines it with a Leader/Stage `rest` cost (already supported).

### B3-G8: Life -> trash moves: top Life card of either player trashed by an effect (and by a replacement payload)

- **Size:** M.   **Cards (6):** OP09-107, OP10-109, OP10-112, OP11-102, ST20-002, ST20-005.
- `move` from `lifeTop` is implemented only to the owner's hand (`dsl-validate.ts` `moveShape`, `run.ts` `move`); the only Life-to-trash shape is `trashLifeUntil`. Needed: `move { what: { from: 'lifeTop', owner: you|opponent|any, pick exactly/upTo 1 }, to: { zone: 'trash' } }` (not damage: no [Trigger], emits the `lifeRemoved` hook like `moveCard(..., from 'life')` already does, `ops/index.ts` line ~160), and the same as a replacement `instead` effect (ST20-002). OP11-102 trashes the top Life card of both players in one step. ST20-005 lets the opponent choose between this and trashing 2 cards from hand (`chooseOne` with `chooser: 'opponent'` already exists). Check that a Life card trashed this way that carries a [Trigger] does not activate it.

### B3-G9: Grant "can also attack active Characters" (this turn)

- **Size:** M.   **Cards (5):** OP11-010, OP11-014, OP11-082, OP11-084, OP11-119.
- No keyword or grant lets a Leader/Character attack active (untapped) Characters; `actions.ts` attack legality only allows rested Characters as targets and `Keyword` has no such entry (`dsl.ts`/`validate.ts` `KEYWORDS`). Needed: a granted capability (a new `Keyword` such as `'Attack Active'` or a `ModKind`/`derive.ts` flag `canAttackActive`) set by `grant` (duration `thisTurn`) on a Leader or Character, honoured in `actions.ts` target enumeration (line ~431) and in the battle legality check. Cards: OP11-010 (Navy Leader), OP11-014, OP11-082, OP11-084 (Leader or Character), OP11-119 (any Character). Note the effect says "also": rested-only attacks stay legal.

### B3-G10: Move a Character from the field to a Life area (top or bottom, face-up or face-down, either owner), also as a cost and as a replacement payload

- **Size:** M.   **Cards (5):** EB02-057, OP09-101, OP11-101, OP11-116, OP12-117.
- `moveShape` rejects any move into Life from `characters`/`stage` (`'only a hand or trash card moves into Life'`) and `run.ts` `move` returns `unsupported` for it. Needed: `move { what: { from: 'characters', owner, filter, pick }, to: { zone: 'life', position: 'top'|'bottom'|'topOrBottom', faceUp } }`: a removal (`pushRemove`-like frame so replacements apply, and a Character leaving the field fires nothing of its own), the card enters the OWNER's Life (so an opponent's Character goes to the opponent's Life), the top-or-bottom choice (cf. `topOrBottom` handling for decks in `move`), face-up/face-down. Variants: effect (OP12-117 Main, OP11-116, EB02-057 when attacking after a lifeToHand cost), as a COST of the effect (OP09-101: the Character is moved before the colon), and as a replacement `instead` effect that moves the replaced card rather than the source (OP11-101: needs a way to refer to "the replaced card" in `instead`, e.g. a `{ ref }` bound by the replacement frame).

### B3-G11: Cost `turnLifeFaceDown` (turn the top Life card face-down)

- **Size:** S.   **Cards (5):** OP11-100, OP11-103, OP11-104, OP11-107, OP11-108.
- `Cost.turnLifeFaceUp` exists (`run.ts` `turnFaceUp`); the opposite does not. Add `{ turnLifeFaceDown: number }` to `dsl.ts`, `IMPLEMENTED.costs`, `dsl-validate.ts` `cost()`, `eval.ts` `payable` (the top N Life cards must exist and be face-up, mirror of the face-up check) and `run.ts` `payCost` (a `turnFaceDown` helper). The cost makes the effect conditional on having a face-up top card, as intended by the Shirahoshi/Neptunian archetype (face-up Life cards come from `turnLifeFaceUp` costs). Cards: OP11-100, OP11-103, OP11-104, OP11-107, OP11-108.

### B3-G12: `[On K.O.]` conditioned on the K.O. cause (by an opponent's effect / by an effect)

- **Size:** S.   **Cards (5):** OP09-052, OP11-024, OP11-035, OP11-051, ST15-003.
- `onKO` autos fire from `flow.ts` `runKo` for any K.O.; the Cause (`f.cause`) is not visible to the script (`holdsOf` has no cause condition and `Ctx` has no cause). Needed: a Condition such as `{ koCause: 'opponentEffect' | 'effect' }` (or a field on the `onKO` timing), set into `Ctx` by `fire` for the ability that resolves from the trash, evaluated in `eval.ts` `holdsOf`. Cards: OP11-024, OP11-035, OP11-051 (opponent's effect), OP09-052 (opponent's effect, play itself from trash rested, with a hand-trash cost), ST15-003 ("by an effect").

### B3-G13: Restriction `cannotBeRested` (by the opponent's effects), permanent or timed

- **Size:** M.   **Cards (4):** EB02-011, OP11-034, OP11-046, OP12-021.
- There is no way to stop a card being rested by an effect. Add `Restriction 'cannotBeRestedByOpponentEffects'`, a `ModKind`, `derive.ts` flag and a check in `ops` `rest(d, id, 'effect')` / `run.ts` action `rest` (rest by an opponent's effect must be skipped for a protected card; rest as a cost or by attacking stays legal). Permanent form with conditions (OP12-021 Leader attribute + 6 rested DON!!, OP11-046 only-GERMA Characters), timed form (OP11-034, EB02-011: "until the end of your opponent's next turn" on a selected opponent Character). Also covers the "cannot be K.O.'d or rested" half of OP11-046 (the K.O. half is B3-G2).

### B3-G14: Restriction "cannot activate [Blocker]" on specific opponent Characters (this turn)

- **Size:** S.   **Cards (4):** OP09-014, OP11-013, OP12-051, ST21-016.
- The existing `cannotActivateBlockerAgainstIt` is on the attacker (`derive.noBlocker`, `actions.ts` line ~225). These cards bar the BLOCKERS: "up to 1 of your opponent's Characters with a base cost of 4 or less cannot activate [Blocker] during this turn" (OP12-051), "all of your opponent's Characters with 2000 power or less" (OP11-013), "up to 1 [Blocker] Character with 4000 power or less" (OP09-014), "with 4000 power or less" (ST21-016). Add `Restriction 'cannotActivateBlocker'`, a `ModKind`/`derive` flag `cannotBlock`, and a check in the block-legality enumeration in `actions.ts`. Targets are selected when the effect resolves (a snapshot, not re-evaluated).

### B3-G15: Cost `move` of this Character/Stage (and cards from trash) to the bottom of the deck

- **Size:** S.   **Cards (4):** OP09-008, OP10-026, OP10-027, OP12-080.
- `cost.move` allows only `hand`/`trash` sources (`dsl-validate.ts` line ~531); `Cost.trashSelf` exists but there is no "place this card at the bottom of the owner's deck" cost. Add `{ placeSelf: { zone: 'deck', position: 'bottom' } }` (or allow `from: 'self'` in a cost `move`), routed through `leaveField(d, id, 'deck', cause cost, { position: 'bottom' })` (as `trashSelf` does for trash) and `payable`. OP10-026/027 pay it together with `1 [Kin'emon] from your trash` (a second `move` cost that already works), "in any order". Cards: OP12-080 (Stage), OP10-026, OP10-027, OP09-008.

### B3-G16: Cost: give N active DON!! cards to a named Leader/Character

- **Size:** M.   **Cards (3):** OP12-016, OP12-017, OP12-019.
- "You may give 2 active DON!! cards to 1 of your [Silvers Rayleigh]: ..." is a cost, not an effect. `Cost` has no `giveDon`; the action `giveDon` (`run.ts` `giveDon`) gives RESTED DON!! from the cost area. Needed: `Cost { giveDon: { n, state: 'active', to: Selector } }` in `dsl.ts`, `dsl-validate.ts`, `eval.ts` `payable` (N active DON!! in the cost area plus a legal target) and `run.ts` `payCost` (reuse the giveDon mover taking active DON!!, attaching them, so they count for [DON!! xN] and are returned at refresh as usual). The third card's effect "when the card given these DON!! attacks" is `restrict cannotActivateBlockerAgainstIt` on the Leader this turn (works). Cards: OP12-016, OP12-017, OP12-019.

### B3-G17: Timing `event: leftField` (a card leaves the field: owner, cause, destination, filter)

- **Size:** M.   **Cards (3):** EB02-023, OP09-080, OP10-042.
- Only `koed` is a removal timing (`flow.ts` `runKo`, K.O. only, no cause). Needed: `{ event: 'leftField'; owner: P; filter?: Filter; cause?: 'opponentEffect' | 'yourEffect' | 'effect'; to?: 'hand' | 'deck' | 'trash' }` fired from `flow.ts` `runRemove`/`leaveField` after the card has left (last-known filter, cf. `koed`'s read of the card as it now is). Cards: OP10-042 (your Dressrosa Character removed by opp effect or K.O.'d; the K.O. half can use `koed` but one ability with two timings is cleaner), OP09-080 (Stage, "your Straw Hat Character removed by opp effect", optional restSelf cost), EB02-023 (opponent's Character returned to hand by YOUR effect: owner opponent, cause yourEffect, to hand).

### B3-G18: Look at the top Life card (own or opponent's) and place it on top or bottom of that Life area

- **Size:** M.   **Cards (3):** EB02-053, OP10-116, ST20-003.
- No action looks at Life cards: `lookAtTop` works on the deck only, and `reveal` from `lifeTop` reveals publicly. Needed: an action (e.g. `lookAtLife: { owner: you|opponent|chooser, n: 1, place: 'topOrBottom' }`), the player picks which player's Life (a choice), sees the card privately (`markKnown`, `CardsLooked`-like event with `owner` and zone life), then chooses top or bottom (reuse the top/bottom decision of `move`). The Life card keeps its face state. Cards: OP10-116 (then a K.O.), EB02-053 (On Play and On K.O., one ability with two timings), ST20-003 (Trigger, then B3-G21).

### B3-G19: `lookAtTop` take `to: 'play'` (play a looked-at card, optionally rested)

- **Size:** M.   **Cards (3):** EB02-025, EB02-056, OP11-051.
- `Take.to` is `'hand' | 'lifeTop'` only (`dsl.ts`, `dsl-validate.ts` `lookAtTop`, `run.ts` `lookAtTop`). "Look at 5 cards from the top of your deck and play up to 1 [type] Character card with a cost of 5 or less" needs `to: 'play'` (+ `rested?`), implemented as a `play` frame (`Frame { f: 'play', free: true }`) for a card taken out of the looked set; the remaining cards then go to the bottom in any order as usual. Cards: OP11-051 (also needs B3-G12), EB02-025 (rested), EB02-056 (Vegapunk, then a conditional trash from hand).

### B3-G20: `Num` division / "for every N" (floor)

- **Size:** S.   **Cards (3):** OP09-086, OP12-070, ST27-004.
- `Num` has `mul: [Num, int]` only. "+1000 power for every 5 Events in your trash" / "for every 4 cards in your trash" / "+1 cost for every 4" need `floor(count / N)`. Add `{ div: [Num, int] }` (integer floor) to `dsl.ts` `Num`, `dsl-validate.ts` `num()` and `eval.ts` `numOf`; compose as `mul: [{ div: [{ trash: 'you' }, 4] }, 1000]`. Cards: OP12-070 (Events in trash, so `count` of a trash selector), OP09-086, ST27-004 (cost, so it feeds the permanent cost stage).

### B3-G21: [Trigger] "add this card to your hand" (move from `self` to hand)

- **Size:** S.   **Cards (3):** OP12-109, OP12-113, ST20-003.
- `moveShape` supports `move` from `self` nowhere (`'moving from self is not implemented'`); the [Trigger] card is in zone `resolving` and `flow.ts` `runTrigger` trashes it afterwards unless the effect moved it (CR 10-1-5-3). Add `from: 'self'` to `IMPLEMENTED` move sources with destination `hand` for a card in `resolving` (`run.ts` `move`: `moveCard(d, f.card, 'hand')`), so `runTrigger`'s "unless moved" check already works. Cards: OP12-109, OP12-113 (both after a K.O.), ST20-003 (after a Life look).

### B3-G22: `donReturned` timing with a minimum count returned at once ("2 or more DON!! returned")

- **Size:** S.   **Cards (2):** EB02-035, OP09-061.
- `donReturned` fires once per return (`run.ts` `returnDon` end, `fireEvent`) but the script cannot read how many were returned in that event (the `DonReturned` event has `count`). Add `min?: number` to the `{ event: 'donReturned' }` timing (`dsl.ts`, `dsl-validate.ts` `timing()`, filter in the `fireEvent` predicate). Cards: OP09-061 (Leader: addDon active + additional rested), EB02-035. (OP09-074, OP11-077, OP12-072 need no count and are expressible now.)

### B3-G23: Filter on a card's printed effects ("without an [On Play] effect", "no base effect")

- **Size:** S.   **Cards (2):** EB02-022, PRB01-001.
- `Filter` cannot test a card's printed abilities. Add `{ hasAbility: 'onPlay' | 'any' | ..., has: boolean }` (or `noBaseEffect: true`) evaluated from the card definition's `abilities` (`defs.ts`; note keyword lines are not effects) in `eval.ts` `matchesOf`. Cards: PRB01-001 (Character without an [On Play] effect, cost <= 8, gains Rush), EB02-022 (power <= 6000 and no base effect, played from hand).

### B3-G24: `lookAtTop` of the opponent's deck with nothing taken (card stays on top)

- **Size:** M.   **Cards (2):** OP11-062, OP11-070.
- `validateScript` rejects `lookAtTop.player !== 'you'` and `rest: 'topAnyOrder'` (the card must stay where it is). "Look at 1 card from the top of your opponent's deck" is information only: the controller sees it (`markKnown` for the controller, `CardsLooked` with `owner` = opponent already exists in `lookAtTop`), nothing moves. Add `player: 'opponent'` plus an explicit no-op `rest` (e.g. `'stay'`) in `dsl.ts`/`dsl-validate.ts`/`run.ts`. Cards: OP11-062, OP11-070. (The opponent's deck is hidden, so the AI/determinizer must treat the card as known to the looker, `determinize.ts`.)

### B3-G25: Timing `event: rested` (a Character is rested by an effect: whose effect, which card)

- **Size:** M.   **Cards (2):** OP10-036, PRB02-009.
- No timing watches a card becoming rested. Needed: `{ event: 'rested'; owner: P; by: 'yourEffect' | 'opponentEffect'; filter? }` fired from `ops` `rest(d, id, 'effect')` with the acting player. Cards: OP10-036 ("a Character is rested by your effect", Once Per Turn, set a DON!! active), PRB02-009 ("this Character is rested by your opponent's effect", may trash itself and draw 2).

### B3-G26: Action: activate an Event card from hand (its [Main] effect) without paying its cost

- **Size:** M.   **Cards (1):** OP12-041.
- `play` is limited to Characters/Stages (`run.ts` restrict: `cat === 'Character' || 'Stage'`) and `activate` works on `self` only. Needed: `activateEvent: { what: Selector(from hand, filter) }`: reveal the Event, trash it, run its [Main] effect with the activating player as controller (the `flow.ts` `runPlay` Event branch with `free: true`: no printed cost; `EventActivated` fires `eventActivated`). The effect of the activated Event must still be able to pay its own optional costs. Card: OP12-041 (Sanji Leader, DON!! -1 Activate: Main).

### B3-G27: Timed restriction on the targets a card may attack ("cannot attack your opponent's Characters with a base cost of 7 or less")

- **Size:** S.   **Cards (1):** OP12-020.
- `lockAttackTarget` is a permanent for the defender's side (`eval.ts` `attackLock`). A timed, attacker-side, filter-based restriction does not exist: `restrict.what` has only `cannotAttack` (all attacks). Add `Restriction { cannotAttackTarget: Filter }`, a `ModKind` with `filter` (like `cannotPlay`), read in `actions.ts` attack legality (line ~311). Card: OP12-020 (second half).

### B3-G28: Condition: you have a face-up Life card (Life card face state)

- **Size:** S.   **Cards (1):** PRB02-018.
- No `Num`/`Selector` reads a Life card's face state (`zoneIds` returns `[]` for `lifeTop`; `Selector.from: 'lifeTop'` is accepted only as a `move` source). Add `{ lifeFaceUp: P }` as a `Num` (count of face-up Life cards) in `dsl.ts`, `dsl-validate.ts`, `eval.ts` `numOf` (`card.faceUp`). Card: PRB02-018.

### B3-G29: Cost: return N ACTIVE DON!! cards to the DON!! deck

- **Size:** S.   **Cards (1):** EB02-061.
- `returnDon`'s class choice (`run.ts` `returnDon`) offers `costActive`, `costRested` and `given`; the cost cannot require active DON!! cards only ("return 2 of your active DON!! cards"). Add `{ returnDon: { n, state: 'active' } }` limiting `classes` to `costActive` (and `payable`). Card: EB02-061.

### B3-G30: Variable-count cost "trash any number of [type] cards from your hand" feeding a scaled effect

- **Size:** M.   **Cards (1):** ST16-002.
- Cost selectors must be `exactly` (`dsl-validate.ts` `pick()` `inCost`), and a cost selector's selection cannot be bound for a later `refCount` (`{ refCount }` reads `c.b`/`c.n`). Needed: allow `pick: { any: true }` in a `trash` cost (zero allowed: then no power) and bind the number (as `Ctx.n` is used for "DON!! rested this way", G29) so `power amount: { mul: [{ refCount: n }, 1000] }` works. Card: ST16-002.

### B3-G31: `rules.deckRestriction` (deck-building restriction from a Leader)

- **Size:** S.   **Cards (1):** OP12-001.
- `RulesClause.deckRestriction: Filter` is in the types but rejected by `validateScript` (`'rules clause ... not implemented'`) and not read by `deck.ts` validation. Needed: `cards/src/validate`/`engine/src/deck.ts` to evaluate the filter over the main deck ("cannot include cards with a cost of 5 or more"), plus the browser deck builder showing why a card is illegal. Card: OP12-001.

### B3-G32: One-shot trigger registered by an ability: "if this Leader battles your opponent's Character during this turn, set it as active"

- **Size:** L.   **Cards (1):** OP12-020.
- `delayed` supports only `at: 'endOfThisTurn'` (`compile.ts`, `run.ts` `delay`, `state.delayed`). OP12-020's Activate: Main registers a watcher for the rest of the turn: when this Leader battles an opponent Character, set it active (and, separately, B3-G27). Needs a `delayed` with an event key (`{ at: { event: 'battle', ... }, once: true }`) kept in `state.delayed` and fired from the battle frames in `flow.ts`/`actions.ts`. A design decision: how battle events enter the delayed list and whether it lasts one battle or the turn. Card: OP12-020.

### B3-G33: `delayed` steps that remember bound cards ("place the Character played by this effect at the bottom of the deck at the end of this turn")

- **Size:** M.   **Cards (1):** OP11-092.
- `delayed` stores `{ turn, card, ability, start, controller }` (`run.ts` `delay`) but not the frame's bindings (`f.b`), so a later step cannot refer to a card chosen earlier; `select.bind` works only inside one frame. Needed: copy `f.b` (and the instance ids) into the delayed record and restore them in the end-of-turn replay, then `move characters -> deck bottom` with `{ ref }` runs (a removal, replacements apply). Card: OP11-092 (needs also that `play` binds what it played).

### B3-G34: `delayed` at the start of the opponent's next Main Phase (and an effect acting on the opponent's DON!!)

- **Size:** M.   **Cards (1):** PRB02-005.
- `delayed` is `endOfThisTurn` only. PRB02-005: "your opponent rests 1 of their active DON!! cards at the start of their next Main Phase". Needs `delayed: { at: 'startOfOpponentsNextMainPhase' }` with the replay hook where `flow.ts` enters the Main Phase (not `startOfYourTurn`, which fires earlier), and the body `rest` on the opponent's cost-area DON!! with the opponent as chooser (DON!! are interchangeable, so no choice is needed). Card: PRB02-005.

### B3-G35: Filter: same card name as a bound/trashed card

- **Size:** S.   **Cards (1):** EB02-039.
- `{ name }` takes a literal. EB02-039 plays "a Character card with the same card name as the trashed card" (the cost-trashed card). Add `{ sameNameAs: Name }` reading a bound selection's card name (the cost `trash` selector must be able to `bind`; today `c.inCost` selectors cannot be referenced afterwards: check `compile.ts`/`bind` on cost selectors). Card: EB02-039.

### B3-G36: Restriction on a card in hand: "cannot be played by effects"

- **Size:** S.   **Cards (1):** OP12-036.
- `playBlocked` (`eval.ts`) reads only Leader modifiers (`cannotPlay` filters). A hand permanent "This card in your hand cannot be played by effects" needs a per-card hand restriction: `permanent zone: 'hand'` with `restrict { target: self, what: 'cannotBePlayedByEffects' }`, checked where `run.ts` `play` builds its candidate list (`restrict: (id) => ...playBlocked`) but not for the normal play from hand (rule play is allowed). Card: OP12-036.

### B3-G37: Action `move` from `lifeTopOrBottom` to hand (the cost form exists, the action form does not)

- **Size:** S.   **Cards (1):** OP09-104.
- `Cost.lifeToHand` supports `from: 'topOrBottom'` (`run.ts` `lifeToHandCost`), but the action `move` supports `lifeTop` only; `lifeTopOrBottom` is not in `IMPLEMENTED.zones`. Add `lifeTopOrBottom` as a move source to hand (the owner chooses top or bottom). Card: OP09-104 ("if you have 2 or more Life cards, add 1 card from the top or bottom of your Life cards to your hand", unconditional on the cost form because it is a plain effect after a Then).

### B3-G38: `lookAtTop` rest `topAnyOrder` (put all the looked-at cards back on top in any order)

- **Size:** S.   **Cards (1):** ST17-003.
- `rest: 'topAnyOrder'` is in the type but rejected by the validator (`enumOf ... ['bottomAnyOrder','topOrBottomAnyOrder','trash']`). `run.ts` `lookAtTop` already has the top-order loop used by `topOrBottomAnyOrder` (`tmp.top === true`): accept `topAnyOrder` as that with top fixed (skip the top/bottom question). Card: ST17-003 (look at 3, place them on top in any order, nothing taken). Note: OP11-049 and OP11-040 use `topOrBottomAnyOrder`, which exists.

### B3-G39: Move a given DON!! card from one card to another

- **Size:** M.   **Cards (1):** EB02-009.
- `giveDon` takes rested DON!! from the cost area. EB02-009: "Give up to 1 of your currently given DON!! cards to 1 of your Straw Hat Crew Characters": take 1 DON!! attached to any Leader/Character (zone `donGiven`, not in `IMPLEMENTED.zones`) and attach it to another card (no state change, it stays given: no rested/active DON!! count change). Add `Action moveDon { from: donGiven selector, to: Selector }` in `run.ts` using the `d.card(id).don` counters. Card: EB02-009.

### B3-G40: Negate all [On Play] effects: permanent for your side, and timed for the opponent's side

- **Size:** L.   **Cards (1):** OP09-081.
- `negate` works per card (modifier `negate`, CR 8-2). OP09-081 negates a TIMING class for a whole side: "Your [On Play] effects are negated" (permanent) and "Your opponent's [On Play] effects are negated until the end of your opponent's next turn". Needs a rule in `flow.ts` `fire` for `'onPlay'`: skip abilities of a side when a player-level flag holds (from a permanent on the Leader and from a timed modifier on the opponent's Leader like `cannotDraw`). Design decision: whether [Trigger] [On Play] activations and [On Play] triggered by `activate onPlay` are included. Card: OP09-081.

### B3-G41: `Num` total cost of a selector ("if the total cost of your Characters is 5 or more")

- **Size:** S.   **Cards (1):** OP10-022.
- `Num` offers `count` only; `Pick.totalCost` exists for selection limits but not as a reading. Add `{ totalCost: Selector }` (sum of derived costs) in `dsl.ts`, `dsl-validate.ts` and `eval.ts` `numOf`. Card: OP10-022 (Law Leader, with B3-G7 and B3-G47).

### B3-G42: `addDon` for the opponent, as the opponent's optional choice

- **Size:** S.   **Cards (1):** OP12-075.
- `addDon` (`run.ts`) always acts for the controller (`const ps = d.pl(you)`) and `{ draw }` is the only action with a `player`. "Your opponent may add 1 DON!! card from their DON!! deck and set it as active" needs `addDon: { player: 'opponent', ... }` plus an opponent-side `may` (the `may` step asks the controller; `chooseOne` has `chooser`, `may` does not). Card: OP12-075.

### B3-G43: Permanent: all Characters you play enter rested

- **Size:** M.   **Cards (1):** OP09-022.
- `play.rested` is per action. OP09-022 is a continuous "Your Character cards are played rested" (applies to every play, hand or effect). Add `Continuous { playRested: { filter? } }` read in `flow.ts` `runPlay` `place` (`w.rested = true`) from a player-level derive, plus the validator. Card: OP09-022 (its Activate: Main then plays an ODYSSEY Character, which therefore enters rested).

### B3-G44: `Pick.totalPower` ("up to 2 Characters with a total power of 4000 or less")

- **Size:** S.   **Cards (1):** OP09-018.
- `Pick.upTo` has `totalCost?: Cmp` only. Add `totalPower?: Cmp` (derived power, sum over the chosen cards) in `dsl.ts`, `dsl-validate.ts` `pick()` and the selection logic in `run.ts` `select` that enforces `totalCost`. Card: OP09-018.

### B3-G45: `cardPlayed` timing filtered by cause ("plays a Character using a Character's effect")

- **Size:** S.   **Cards (1):** OP12-081.
- `flow.ts` `runPlay` fires `cardPlayed` with only `by` and a filter on the played card; it does not know whether the card was played by an effect and by what kind of card. Add `via?: 'effect' | 'characterEffect' | 'rule'` to `{ event: 'cardPlayed' }` (`dsl.ts`, `dsl-validate.ts`, predicate in `runPlay` using the play frame's origin, which needs a new `Frame` field set by `run.ts` `play`). Card: OP12-081 (Koala Leader: base cost >= 8 OR played by a Character's effect).

### B3-G46: `play` the revealed top card of the deck (without taking it into hand)

- **Size:** M.   **Cards (1):** OP12-058.
- OP12-058: "reveal 1 card from the top of your deck. If that card is a [type] Character with cost <= 9, you may play that card. If you do, that Character gains [Rush] this turn." `reveal` (deckTop, n = 1) binds the card, but `play.what` accepts only `hand`/`trash`/`self` zones (`dsl-validate.ts` `play`). Add `deckTop` (the revealed, bound card) as a `play` source in `run.ts` `play`/`select` (moving it from the deck to the field via a free play), and the `ifDid` that follows a plain optional play. Card: OP12-058. Shares the `play`-from-deck plumbing with B3-G19.

### B3-G47: `play` the revealed top Life card

- **Size:** M.   **Cards (1):** OP10-022.
- OP10-022: "Reveal 1 card from the top of your Life cards. If that card is a [type] Character with cost <= 5, you may play that card." `reveal` from `lifeTop` is implemented (OP15-119) but `play.what` cannot name it (zones hand/trash/self only); a played Life card must leave Life without `lifeRemoved` damage rules (the `lifeRemoved` hook should still fire: a card was removed from Life). Add the revealed bound card (`from: 'lifeTop'` with `ref`) as a `play` source in `run.ts`. Card: OP10-022.

### B3-G48: Replacement for a card being rested by an opponent's Character effect

- **Size:** M.   **Cards (1):** PRB02-006.
- `ReplaceEvent` has `ko` and `leaveField` only. PRB02-006: "If this Character would be rested by your opponent's Character's effect, you may rest 1 of your other Characters instead" needs `{ rest: Selector; cause: 'opponentCharacterEffect' }` in `dsl.ts`/`dsl-validate.ts`, an offer point in `ops` `rest(d, id, 'effect')` (a new `Frame` like `ko`/`remove`, or inline offer), and `collectReplacements` for the event `rest`; B3-G13 shares the same hook in `rest`. Card: PRB02-006.

### B3-G49: Player restriction: cannot set DON!! active by Character effects (this turn)

- **Size:** S.   **Cards (1):** OP10-030.
- `restrict` on a player supports only `cannotDrawByOwnEffects` and `cannotPlay` (`dsl-validate.ts`, `run.ts`: leader-held modifiers `cannotDraw`/`cannotPlay`). Add `Restriction { cannotSetDonActive: { by: 'characterEffects' } }` as another leader-held modifier and check it in `run.ts` `setActive` (DON!! branch) when the source card is a Character (`f.cardId` category). Card: OP10-030 (Smoker; note the same ability first sets 1 DON!! active, which is allowed).

### B3-G50: Player restriction: cannot add Life cards to hand using your own effects (this turn)

- **Size:** S.   **Cards (1):** ST15-001.
- A third player-level restriction next to `cannotDrawByOwnEffects`: `Restriction 'cannotAddLifeToHandByOwnEffects'` stored as a leader modifier (like `cannotDraw`, `eval.ts` `leaderMods`) and checked in `run.ts` `move` (`lifeTop` -> hand, the `lifeToHand` cost, and `internal lifeToHand` effects) when the acting player is its owner. Does it include costs ("add 1 Life card to your hand" paid as a cost)? See Q5. Card: ST15-001.

### B3-G51: `skipRefresh` for an opponent's rested DON!! card

- **Size:** S.   **Cards (1):** OP10-033.
- `skipRefresh` targets cards (`run.ts` adds a `skipRefresh` modifier on an instance). DON!! cards are not instances. Add `skipRefresh` with `from: 'donCostArea'`: a player-level counter (e.g. `Draft.skipDon[player]`) consumed in the Refresh Phase untap (`ops` `untapAll`/`flow.ts` Refresh) so N of that player's rested DON!! stay rested. Card: OP10-033.

### B3-G52: A replacement effect created by an Event for the rest of the turn

- **Size:** L.   **Cards (1):** EB02-030.
- EB02-030's [Counter] says "If any of your Characters would be K.O.'d in battle during this turn, you may trash 1 card from your hand instead": the Event creates a replacement that lives until end of turn and may apply many times. `Ability.replacement` is a printed ability on a card in play; there is no way to register a replacement from an effect (`state.mods` hold modifiers only, `collectReplacements` reads defs). Needs a new action `addReplacement { replaces, optional, instead, duration }`, a `Modifier` kind carrying a replacement payload, and `collectReplacements` reading it (uses B3-G4 for `battle`). Design decision: Once-per-turn / how many times it may apply (the text allows each K.O.). Card: EB02-030.

### B3-G53: Timing: cards trashed from hand by an effect of a filtered card (with the count)

- **Size:** M.   **Cards (1):** OP12-040.
- No timing watches trashing from hand. Needed: `{ event: 'trashedFromHand'; owner: P; sourceFilter: Filter }` firing once per effect resolution with `n` = number of cards trashed (for "draw cards equal to the number trashed": a `Num` such as `{ eventCount }`). Hook in `run.ts` `trashFromHand` / cost trash by effect, and the source card's filter ({Navy} type). Card: OP12-040 (Leader). Does not include discards by cost? Proposed reading: text says "by your Navy type card's effect", so effect costs paid for a Navy card's own ability count (see Q4).

### B3-G54: Timing `triggerActivated` (the opponent activates a [Trigger])

- **Size:** S.   **Cards (1):** OP11-102.
- `eventActivated` and `blockerActivated` exist (`flow.ts` `fireActor`); there is no timing for a [Trigger] activation (`flow.ts` `answerTrigger`). Add `{ event: 'triggerActivated'; by: P }` fired in `answerTrigger` when the Life card is activated (not when added to hand). Card: OP11-102 (Camie, "activates an Event or [Trigger]": one ability with two timings; also B3-G8).

### B3-G55: Action `winGame` ("you win the game")

- **Size:** M.   **Cards (1):** OP09-118.
- No action ends the game. Add `{ winGame: true }`, calling the engine's game-over path (`flow.ts` defeat/victory handling, CR 9-2) for the controller, evaluated mid-effect. Timing `blockerActivated` by the opponent and the condition "either you or your opponent has 0 Life cards" (`cmp` on `life`) already exist. Card: OP09-118 (Gol.D.Roger). Check that a simultaneous-loss reading does not interfere (the opponent could have 0 Life and be at 0 already).

### Gap summary

| Gap | Construct | Cards | Size |
| --- | --- | --- | --- |
| B3-G1 | Action `mill` (trash cards from the top of a deck as an effect, not a cost) | 13 | S |
| B3-G2 | Scoped `cannotBeKOd`: by opponent effects / by effects / in battle, with an optional source filter, permanent or timed, one variant once per turn | 10 | M |
| B3-G3 | Filter `attribute` ((Slash), (Special), (Strike), ...), also usable in `leader`/`self` conditions | 8 | S |
| B3-G4 | Replacement `ko` with a cause (by opponent effect / by an effect / in battle), plus a mandatory empty-payload form | 7 | S |
| B3-G5 | "Choose a cost" + reveal the top card of the OPPONENT's deck and compare | 6 | L |
| B3-G6 | Cost `returnDon` with a variable count ("return 1 or more DON!! cards from your field to your DON!! deck") | 6 | M |
| B3-G7 | Cost `move` from the field: return your own Character to hand as a cost | 6 | M |
| B3-G8 | Life -> trash moves: top Life card of either player trashed by an effect (and by a replacement payload) | 6 | M |
| B3-G9 | Grant "can also attack active Characters" (this turn) | 5 | M |
| B3-G10 | Move a Character from the field to a Life area (top or bottom, face-up or face-down, either owner), also as a cost and as a replacement payload | 5 | M |
| B3-G11 | Cost `turnLifeFaceDown` (turn the top Life card face-down) | 5 | S |
| B3-G12 | `[On K.O.]` conditioned on the K.O. cause (by an opponent's effect / by an effect) | 5 | S |
| B3-G13 | Restriction `cannotBeRested` (by the opponent's effects), permanent or timed | 4 | M |
| B3-G14 | Restriction "cannot activate [Blocker]" on specific opponent Characters (this turn) | 4 | S |
| B3-G15 | Cost `move` of this Character/Stage (and cards from trash) to the bottom of the deck | 4 | S |
| B3-G16 | Cost: give N active DON!! cards to a named Leader/Character | 3 | M |
| B3-G17 | Timing `event: leftField` (a card leaves the field: owner, cause, destination, filter) | 3 | M |
| B3-G18 | Look at the top Life card (own or opponent's) and place it on top or bottom of that Life area | 3 | M |
| B3-G19 | `lookAtTop` take `to: 'play'` (play a looked-at card, optionally rested) | 3 | M |
| B3-G20 | `Num` division / "for every N" (floor) | 3 | S |
| B3-G21 | [Trigger] "add this card to your hand" (move from `self` to hand) | 3 | S |
| B3-G22 | `donReturned` timing with a minimum count returned at once ("2 or more DON!! returned") | 2 | S |
| B3-G23 | Filter on a card's printed effects ("without an [On Play] effect", "no base effect") | 2 | S |
| B3-G24 | `lookAtTop` of the opponent's deck with nothing taken (card stays on top) | 2 | M |
| B3-G25 | Timing `event: rested` (a Character is rested by an effect: whose effect, which card) | 2 | M |
| B3-G26 | Action: activate an Event card from hand (its [Main] effect) without paying its cost | 1 | M |
| B3-G27 | Timed restriction on the targets a card may attack ("cannot attack your opponent's Characters with a base cost of 7 or less") | 1 | S |
| B3-G28 | Condition: you have a face-up Life card (Life card face state) | 1 | S |
| B3-G29 | Cost: return N ACTIVE DON!! cards to the DON!! deck | 1 | S |
| B3-G30 | Variable-count cost "trash any number of [type] cards from your hand" feeding a scaled effect | 1 | M |
| B3-G31 | `rules.deckRestriction` (deck-building restriction from a Leader) | 1 | S |
| B3-G32 | One-shot trigger registered by an ability: "if this Leader battles your opponent's Character during this turn, set it as active" | 1 | L |
| B3-G33 | `delayed` steps that remember bound cards ("place the Character played by this effect at the bottom of the deck at the end of this turn") | 1 | M |
| B3-G34 | `delayed` at the start of the opponent's next Main Phase (and an effect acting on the opponent's DON!!) | 1 | M |
| B3-G35 | Filter: same card name as a bound/trashed card | 1 | S |
| B3-G36 | Restriction on a card in hand: "cannot be played by effects" | 1 | S |
| B3-G37 | Action `move` from `lifeTopOrBottom` to hand (the cost form exists, the action form does not) | 1 | S |
| B3-G38 | `lookAtTop` rest `topAnyOrder` (put all the looked-at cards back on top in any order) | 1 | S |
| B3-G39 | Move a given DON!! card from one card to another | 1 | M |
| B3-G40 | Negate all [On Play] effects: permanent for your side, and timed for the opponent's side | 1 | L |
| B3-G41 | `Num` total cost of a selector ("if the total cost of your Characters is 5 or more") | 1 | S |
| B3-G42 | `addDon` for the opponent, as the opponent's optional choice | 1 | S |
| B3-G43 | Permanent: all Characters you play enter rested | 1 | M |
| B3-G44 | `Pick.totalPower` ("up to 2 Characters with a total power of 4000 or less") | 1 | S |
| B3-G45 | `cardPlayed` timing filtered by cause ("plays a Character using a Character's effect") | 1 | S |
| B3-G46 | `play` the revealed top card of the deck (without taking it into hand) | 1 | M |
| B3-G47 | `play` the revealed top Life card | 1 | M |
| B3-G48 | Replacement for a card being rested by an opponent's Character effect | 1 | M |
| B3-G49 | Player restriction: cannot set DON!! active by Character effects (this turn) | 1 | S |
| B3-G50 | Player restriction: cannot add Life cards to hand using your own effects (this turn) | 1 | S |
| B3-G51 | `skipRefresh` for an opponent's rested DON!! card | 1 | S |
| B3-G52 | A replacement effect created by an Event for the rest of the turn | 1 | L |
| B3-G53 | Timing: cards trashed from hand by an effect of a filtered card (with the count) | 1 | M |
| B3-G54 | Timing `triggerActivated` (the opponent activates a [Trigger]) | 1 | S |
| B3-G55 | Action `winGame` ("you win the game") | 1 | M |

## 4. Open questions

Card readings that need an official ruling or a data check. Each gives the card text as held in the data and the reading proposed for scripting; none is an invented ruling.

- **Q1. OP11-023 Arlong, sign missing.** Text: "...give this card in your hand 3 cost." ST26-001 and PRB02-014 print the same effect as "give this card in your hand −5 cost" / "−3 cost". Proposed reading: a lost minus sign (data defect, `textFixes` kind `sign`), so the permanent is a hand-zone cost of −3. Verify against a second source before scripting; if it is a defect, add an override.
- **Q2. EB02-005 Fake Straw Hat Crew, sign missing.** Text: "[Your Turn] This Character gains +2000 power. [Opponent's Turn] Give this Character 2000 power." Every other power change on the card pool is printed signed. Proposed reading: a lost sign, most likely −2000 (a downside on the opponent's turn, the "Fake" drawback), but it could be +2000. Do not script until the printed card is checked.
- **Q3. PRB02-017 Boa Hancock, no timing header.** Text: "[Once Per Turn] You may trash 1 card with a [Trigger] from your hand: Your opponent's rested Leader or up to 1 of your opponent's Characters other than [Monkey.D.Luffy] cannot attack until the end of your opponent's next End Phase." There is no [On Play], [Activate: Main] or [When Attacking]. Proposed reading: a lost header, most likely [Activate: Main] (an Once Per Turn with a trash cost is the Activate: Main pattern); confirm with the printed card.
- **Q4. OP12-040 Kuzan (Leader), "trashed from your hand by your Navy type card's effect".** Does a trash paid as the COST of a Navy card's ability count as "by the effect" (many Navy cards trash 1 as a cost, for example OP12-043, OP12-044, OP12-047)? Proposed reading: only trashes performed by the effect resolution count (costs are not effects, CR 8-3), and the count is the number of cards trashed by that one effect ("draw cards equal to the number of cards trashed").
- **Q5. ST15-001 Atmos, "you cannot add Life cards to your hand using your own effects".** Does the restriction also stop a Life card added as a COST ("You may add 1 card from the top of your Life cards to your hand:")? Proposed reading: effects only, costs excluded, consistently with Q4 and with the existing `cannotDrawByOwnEffects` ruling (OP12-099, the Draw Phase is not an effect).
- **Q6. The "Choose a cost" family (OP11-066, 071, 073, 074, 079, 081).** Texts: "Choose a cost and reveal 1 card from the top of your opponent's deck. If the revealed card has the chosen cost, ..." Proposed reading: the controller names any integer cost from 0 to 10 before the reveal; the revealed card stays on top of the opponent's deck (the text moves nothing) and is public afterwards; a card with no cost (none in a deck, Leaders excluded) cannot match; an empty deck reveals nothing and the condition fails.
- **Q7. OP10-118 Monkey.D.Luffy, "Once per turn, this Character cannot be K.O.'d by your opponent's effects."** Proposed reading: the first K.O. by an opponent's effect each turn is prevented (the protection is spent when it prevents), a second one in the same turn happens; it is not "the first attempt is blocked and all later ones too". Needs confirmation because the DSL has no precedent for once-per-turn protection (it is closest to a mandatory once-per-turn replacement).
- **Q8. OP12-096 Ursa Shock, "you may select your opponent's Character with a cost of 6 or less instead".** Proposed reading: with a cost-8-or-more Character the player may pick any opponent Character with cost 6 or less (a superset of cost 4 or less), so scripting `if` (condition) then K.O. cost <= 6, else K.O. cost <= 4 is equivalent to the choice.
- **Q9. OP11-092 Helmeppo, "place the 1 Character played by this effect at the bottom of the owner's deck at the end of this turn".** If the Character was already removed (K.O.'d, bounced) before the end of the turn, proposed reading: nothing happens; if it is still on the field it is placed at the bottom of its owner's deck as an effect (replacements such as OP10-082 do not apply: it is the owner's own effect).
- **Q10. OP09-101 Kuzan, a cost that moves an opponent's Character.** "Place 1 of your opponent's Characters with a cost of 3 or less at the top or bottom of your opponent's Life cards face-up: Your opponent trashes 1 card from their hand." Proposed reading: the effect is a cost (colon) the controller may decline; if the opponent has no matching Character it cannot be paid and the effect does not activate. The player chooses top or bottom.
- **Q11. OP10-022 Law (Leader), "Reveal 1 card from the top of your Life cards ... you may play that card."** If the revealed card is a Character and played, the Life count drops by one and it leaves Life as a play, not damage (no [Trigger] timing). Proposed reading: the card is played from Life face-up and the `lifeRemoved` timing fires (OP11-041 would see it); if not played it stays in Life, face state unchanged except that it was revealed.
