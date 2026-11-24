# M6b-1 runtime audit: block 4 (unscripted cards)

Written 2026-11-23 by the block-4 auditor, following the method of `docs/research/m4b-runtime-audit.md` (sections 1, 3, 4). Inputs: the card text in `cards/data/sets/*.json` (every block-4 card in the backlog is `verified: false` in the data, the overrides carry no text patches for these cards), `cards/src/dsl.ts`, `cards/src/dsl-validate.ts` (`IMPLEMENTED` and the move/cost/zone rules), the runtime in `engine/src/effects/{run,eval,layers}.ts`, `engine/src/flow.ts`, `engine/src/ops/index.ts`, and the worked examples in `cards/effects/**`. The tagger's tags in `coverage-report.json` were used as a hint only. Nothing here changes `engine/`, `cards/` or tests.

## 1. Result

- **422 cards audited** (the `backlog` entries with block 4: 17 Leaders, 330 Characters, 68 Events, 7 Stages; OP-15 91, OP-14 99, OP-13 96, EB-04 51, EB-03 58, ST-29 15, and 12 older cards from OP-01..OP-04, ST-02, ST-06).
- **313 cards need nothing new** (every shape is already implemented). **109 cards need at least one gap** (41 distinct gaps, B4-G1 to B4-G41).
- **6 cards are unexpressible without a design decision**: OP13-079 Imu, OP13-003 Roger and OP15-022 Brook change the rules of the game itself (deck construction plus a start-of-game search, the DON!! Phase placement, the deck-out loss: B4-G25 to B4-G28), and OP15-014, OP15-046, EB03-031 "activate an Event" from hand or trash by an effect (B4-G20; the cost and the `eventActivated` question, Q7 and Q8). Every other gap has an obvious shape; the six above need an owner ruling or design first.
- Most of the pool is already covered: the unusual bulk is in a few families, namely **opponent's DON!! given to the opponent's cards** (OP15 East Blue/Krieg: G3, G4), **the `mill` action** (black Thriller Bark / Straw Hat: G1), **costs on the controller's own Characters** (G17), **cannot be rested** (G2), **"becomes rested" timings** (G7), and **K.O.-by-opponent-effect replacements** (G15). Every gap is sized S or M (a hook, a modifier kind, a cost kind or an action in one function plus validator and tests); none needs a new runtime layer, but the three rules-modifier cards (G25 to G28) and the Event-activation cards (G20) need an owner decision first.
- Top 10 gaps by card count: B4-G1 (13); B4-G17 (11); B4-G3 (10); B4-G4 (8); B4-G2 (7); B4-G7 (7); B4-G15 (6); B4-G6 (5); B4-G12 (4); B4-G20 (3).

## 2. Card table

"Shapes needed" is a short, tagger-assisted reading of the verified text; "none" in the Gap column means every shape it uses is implemented today (checked against the runtime, see section 3b for the nuances I verified). Within a set: Leaders first, then Characters, Events, Stages, each by card number.


### OP-15

| Card | Name | Shapes needed | Gap IDs |
| --- | --- | --- | --- |
| OP15-001 | Krieg | Activate Main, permanent; rest, power - needs: filter donGiven | B4-G4 |
| OP15-002 | Lucy | When Attacking, On Opp Attack, Activate Main; draw, power - needs: event-activated history | B4-G40 |
| OP15-022 | Brook | Activate Main; deck-top - needs: action mill; rules deck-out | B4-G1, B4-G27 |
| OP15-039 | Rebecca | Activate Main, permanent; play, return to hand, restriction - needs: cost on own Characters | B4-G17 |
| OP15-098 | Monkey.D.Luffy | replacement; Life move | none |
| OP15-003 | Alvida | Activate Main, replacement; giveDon - needs: give opponent's DON!! | B4-G3 |
| OP15-004 | Sea Cat | On Play; power | none |
| OP15-005 | Cabaji | When Attacking; power | none |
| OP15-006 | Cavendish | permanent; power | none |
| OP15-007 | Gin | On Play; play | none |
| OP15-008 | Krieg | [Rush], On Play, Activate Main; power, giveDon, keyword grant - needs: give opponent's DON!!; filter donGiven | B4-G3, B4-G4 |
| OP15-009 | Koby | replacement; power | none |
| OP15-010 | Nezumi | Activate Main; giveDon - needs: give opponent's DON!! | B4-G3 |
| OP15-011 | Pearl | [Blocker], On K.O., permanent; K.O., power, keyword grant | none |
| OP15-012 | Buggy | When Attacking, On K.O.; draw, giveDon - needs: give opponent's DON!! | B4-G3 |
| OP15-013 | Pincers | [Blocker]; cost mod | none |
| OP15-014 | Bartolomeo | On Play, replacement; trash from hand - needs: activate Event from hand/trash | B4-G20 |
| OP15-015 | Higuma | On Play; power, giveDon - needs: give opponent's DON!!; filter donGiven | B4-G3, B4-G4 |
| OP15-017 | Morgan | Activate Main; giveDon - needs: give opponent's DON!! | B4-G3 |
| OP15-018 | Mohji | When Attacking; K.O. - needs: filter donGiven | B4-G4 |
| OP15-023 | Arlong | On K.O., Activate Main; giveDon, skipRefresh - needs: give opponent's DON!! | B4-G3 |
| OP15-024 | Usopp | [Blocker], On K.O., permanent; rest, keyword grant - needs: cannotBeRested | B4-G2 |
| OP15-025 | Kuro | [Blocker], On Play; skipRefresh - needs: give opponent's DON!!; filter donGiven | B4-G3, B4-G4 |
| OP15-026 | Jango | On Play, Activate Main; lookAtTop, giveDon, deck-top - needs: give opponent's DON!! | B4-G3 |
| OP15-027 | Dracule Mihawk | On Play; rest - needs: filter donGiven | B4-G4 |
| OP15-028 | Meowban Brothers | On Play - needs: give opponent's DON!! | B4-G3 |
| OP15-029 | Bartholomew Kuma | On Play - needs: cannotBeRested | B4-G2 |
| OP15-031 | Purinpurin | On Play - needs: filter donGiven | B4-G4 |
| OP15-033 | Hody Jones | On Play; setActive, Life move | none |
| OP15-034 | Yorki | On Play; power | none |
| OP15-036 | Ryuma | On Play, When Attacking; K.O. | none |
| OP15-040 | Viola | On Play; lookAtTop, deck-top | none |
| OP15-041 | Orlumbus | [Rush], On K.O., Activate Main; draw, keyword grant - needs: cost on own Characters | B4-G17 |
| OP15-042 | Kyros | [Rush], On Play, On K.O.; trash from hand, keyword grant | none |
| OP15-043 | Kelly Funk | On Play; play | none |
| OP15-044 | Koala | [Blocker], On K.O.; lookAtTop, deck-top | none |
| OP15-045 | Sai | [Blocker], On Play; draw, trash from hand | none |
| OP15-046 | Sabo | [Blocker], On Play - needs: activate Event from hand/trash | B4-G20 |
| OP15-047 | Sanji | [Blocker], [Unblockable], On Play; keyword grant | none |
| OP15-048 | Chinjao | On Play, On K.O.; draw, trash from hand | none |
| OP15-050 | Bobby Funk | ; power | none |
| OP15-051 | Monkey.D.Luffy | permanent; power | none |
| OP15-052 | Leo | replacement - needs: cost on own Characters | B4-G17 |
| OP15-053 | Rebecca | [Blocker], On Play, permanent; lookAtTop, keyword grant, deck-top | none |
| OP15-059 | Amazon | On Opp Attack; power - needs: returnDon by opponent | B4-G38 |
| OP15-060 | Enel | [Blocker], Activate Main, permanent; trash from hand, power, DON!! -X, restriction, keyword grant | none |
| OP15-063 | Gedatsu | On Play, On K.O.; draw, K.O., DON!! -X | none |
| OP15-064 | Kotori | Activate Main; rest, DON!! -X | none |
| OP15-065 | Goro | On Play; deck-top | none |
| OP15-068 | Heavenly Warriors | [Blocker], permanent; keyword grant | none |
| OP15-070 | Fuza | [Unblockable], permanent; keyword grant | none |
| OP15-072 | Hotori | Activate Main; power, DON!! -X | none |
| OP15-073 | Yama | [Blocker], On Play; play | none |
| OP15-079 | Absalom | On K.O., Trigger - needs: activate own [On K.O.]/[Counter] | B4-G21 |
| OP15-080 | Oars | On K.O.; power | none |
| OP15-081 | Sanji | On Play; deck-top - needs: action mill | B4-G1 |
| OP15-082 | Charlotte Lola | On Play, On K.O.; deck-top - needs: action mill | B4-G1 |
| OP15-083 | Spoil | On Play, Activate Main; giveDon, deck-top - needs: action mill | B4-G1 |
| OP15-084 | Dr. Hogback | On Play, On K.O.; draw, deck-top - needs: action mill | B4-G1 |
| OP15-085 | Tony Tony.Chopper | On Play, Activate Main; deck-top - needs: action mill | B4-G1 |
| OP15-086 | Nami | [Rush], On Play; play, keyword grant | none |
| OP15-087 | Nico Robin | [Blocker], On Play, permanent; draw, trash from hand, keyword grant | none |
| OP15-090 | Perona | replacement; trash from hand | none |
| OP15-091 | Margarita | On Play | none |
| OP15-093 | The Risky Brothers | [Rush: Character], Activate Main; keyword grant - needs: attribute | B4-G5 |
| OP15-094 | Roronoa Zoro | [Blocker], replacement | none |
| OP15-099 | Urouge | [Rush], On Play, Activate Main; trash from hand, giveDon, Life move, keyword grant - needs: Life face state | B4-G13 |
| OP15-100 | Kamakiri | On Play; K.O., Life move | none |
| OP15-102 | Gan.Fall | On Play; rest, cost mod (sign missing in text: Q2) | none |
| OP15-103 | Genbo | Trigger; draw, play | none |
| OP15-104 | Conis | On Play, Trigger; draw, trash from hand | none |
| OP15-105 | Jewelry Bonney | replacement; Life move | none |
| OP15-106 | Octoballoon | Trigger; draw, play | none |
| OP15-109 | Nico Robin | On Play; play, Life move, deck-top | none |
| OP15-110 | Braham | On K.O.; Life move, deck-top | none |
| OP15-111 | Mont Blanc Noland | [Rush], When Attacking; keyword grant | none |
| OP15-019 | Barrier Bulls | Main, Trigger; draw, power | none |
| OP15-020 | Fire Fist | Main; trash from hand, K.O., power | none |
| OP15-021 | Just Watch Me, Ace!!! | Main, Counter; power, cost mod | none |
| OP15-037 | The Outcome Will Tell Us Who's Strong and Who's Weak | Main, Trigger; draw, lookAtTop, deck-top | none |
| OP15-038 | It's an Order! Do Not Defy Me!!! | Main, Counter; power, skipRefresh - needs: filter donGiven | B4-G4 |
| OP15-054 | And No One Else Can Have It! It's Our Memento of Him | Main; draw, trash from hand, play, return to hand | none |
| OP15-055 | Go Ahead and Use 'Em, Mr. Luffy!!! | [Blocker], Main; draw, keyword grant | none |
| OP15-056 | Would You Let Me Eat the Flame-Flame Fruit? | [Double Attack], Main, Trigger; draw, power, keyword grant | none |
| OP15-095 | Gum-Gum Storm | Main, Counter; power | none |
| OP15-096 | Swallow Bond en Avant | Main, Counter; trash from hand, power, deck-top - needs: action mill | B4-G1 |
| OP15-097 | I Find It Embarrassing as a Human Being | Main, Trigger; restriction | none |
| OP15-115 | Impact Dial | Main; K.O., Life move | none |
| OP15-116 | Gum-Gum Golden Rifle | Main, Counter; trash from hand, power, Life move, deck-top - needs: Life to trash | B4-G12 |
| OP15-117 | Heso!! | Main, Trigger; draw, giveDon | none |
| OP15-057 | Dressrosa Kingdom | On Play, On Opp Attack; draw, trash from hand, power | none |

### OP-14

| Card | Name | Shapes needed | Gap IDs |
| --- | --- | --- | --- |
| OP14-001 | Trafalgar Law | Activate Main - needs: swapBasePower | B4-G22 |
| OP14-040 | Jinbe | Activate Main; trash from hand, giveDon | none |
| OP14-060 | Donquixote Doflamingo | On Opp Attack; DON!! -X - needs: redirectAttack | B4-G23 |
| OP14-079 | Crocodile | Activate Main, permanent; cost mod, restriction, deck-top - needs: action mill; cost on own Characters | B4-G1, B4-G17 |
| OP14-080 | Gecko Moria | When Attacking, Activate Main; trash from hand, power, Life move, deck-top - needs: cost on own Characters | B4-G17 |
| OP14-002 | Urouge | When Attacking; draw, K.O. | none |
| OP14-003 | Capone"Gang"Bege | permanent; restriction - needs: scoped cannotBeKOd | B4-G30 |
| OP14-004 | Cavendish | [Rush], permanent; keyword grant | none |
| OP14-005 | Killer | Activate Main; giveDon | none |
| OP14-006 | Shachi & Penguin | When Attacking; power | none |
| OP14-009 | Trafalgar Law | [Rush], On Opp Attack; trash from hand - needs: swapBasePower | B4-G22 |
| OP14-010 | Basil Hawkins | On K.O.; lookAtTop, play, deck-top - needs: lookAtTop take to play | B4-G37 |
| OP14-011 | Bartolomeo | [Blocker], permanent; keyword grant | none |
| OP14-012 | Bepo | When Attacking; giveDon | none |
| OP14-013 | Monkey.D.Luffy | On Play, When Attacking; lookAtTop, power, deck-top | none |
| OP14-014 | Eustass"Captain"Kid | [Blocker], On Play; play | none |
| OP14-015 | Roronoa Zoro | [Rush], When Attacking; power | none |
| OP14-016 | X.Drake | When Attacking, replacement; power | none |
| OP14-021 | Issho | ; Life move, skipRefresh - needs: timing becameRested | B4-G7 |
| OP14-023 | Kikunojo | End of Your Turn; setActive | none |
| OP14-024 | Kin'emon | On Play, On K.O.; play, rest, restriction | none |
| OP14-025 | Kuro | On Play; play | none |
| OP14-026 | Kouzuki Oden | permanent; power | none |
| OP14-027 | Shanks | permanent; rest, power - needs: timing becameRested | B4-G7 |
| OP14-028 | Johnny | ; K.O. - needs: timing becameRested | B4-G7 |
| OP14-029 | Tashigi | Activate Main, replacement, permanent; power | none |
| OP14-032 | Humandrill | ; rest - needs: timing becameRested | B4-G7 |
| OP14-033 | Perona | On Play, On K.O.; play - needs: cannotBeRested | B4-G2 |
| OP14-034 | Monkey.D.Luffy | replacement, permanent; power - needs: replace ko by opp effect | B4-G15 |
| OP14-035 | Yosaku | ; skipRefresh - needs: timing becameRested | B4-G7 |
| OP14-042 | Arlong | On Play; deck-top | none |
| OP14-043 | Aladine | On Play, On K.O.; draw, play | none |
| OP14-044 | Edward.Newgate | [Blocker], On Play; draw, trash from hand, deck-top | none |
| OP14-045 | Kuroobi | [Rush], On K.O.; draw, keyword grant - needs: timing handTrashedByEffect | B4-G8 |
| OP14-046 | Koala | Activate Main; power | none |
| OP14-047 | Shirahoshi | [Blocker], On Play; draw, play | none |
| OP14-048 | Shiryu | On Play; return to hand | none |
| OP14-049 | Jinbe | [Rush], On Play; draw, return to hand, keyword grant - needs: timing handTrashedByEffect | B4-G8 |
| OP14-050 | Chew | On Play; draw | none |
| OP14-051 | Hatchan | On K.O.; draw | none |
| OP14-052 | Hannyabal | [Blocker], On Play; trash from hand, play | none |
| OP14-053 | Vista | [Blocker], permanent; power - needs: Num stat of selector | B4-G31 |
| OP14-054 | Fisher Tiger | On Play, End of Your Turn; draw | none |
| OP14-056 | Wadatsumi | permanent; restriction - needs: timing handTrashedByEffect | B4-G8 |
| OP14-061 | Vergo | When Attacking, replacement; power, DON!! -X | none |
| OP14-062 | Gladius | On K.O.; K.O., rest, DON!! -X | none |
| OP14-063 | Sugar | On Play, On K.O.; play, addDon | none |
| OP14-064 | Giolla | On K.O.; K.O., addDon | none |
| OP14-065 | Senor Pink | On K.O. - needs: returnDon by opponent | B4-G38 |
| OP14-067 | Dellinger | On K.O.; addDon, deck-top | none |
| OP14-068 | Trebol | keywords only | none |
| OP14-069 | Donquixote Doflamingo | On Play; K.O., DON!! -X - needs: cannotBeRested | B4-G2 |
| OP14-070 | Buffalo | [Blocker]; setActive - needs: timing becameRested | B4-G7 |
| OP14-071 | Pica | End of Your Turn | none |
| OP14-072 | Baby 5 | On Play, On K.O.; DON!! -X, addDon, Life move, deck-top | none |
| OP14-074 | Monet | On Play, On K.O.; draw, trash from hand | none |
| OP14-075 | Lao.G | On K.O.; power, addDon | none |
| OP14-081 | Spider Mice | On Play, On K.O.; K.O., deck-top - needs: action mill | B4-G1 |
| OP14-082 | Oinkchuck | On K.O.; cost mod | none |
| OP14-083 | Ms. Wednesday | Activate Main; power | none |
| OP14-084 | Ms. All Sunday | On Play; play | none |
| OP14-085 | Miss.Goldenweek(Marianne) | On K.O.; draw, trash from hand | none |
| OP14-086 | Miss Doublefinger(Zala) | permanent; cost mod | none |
| OP14-087 | Miss.Valentine(Mikita) | On Play; deck-top | none |
| OP14-088 | Miss.MerryChristmas(Drophy) | On K.O.; draw, K.O. - needs: ko Stage | B4-G39 |
| OP14-089 | Ryuma | On K.O., Trigger; draw, trash from hand, play | none |
| OP14-090 | Mr.1(Daz.Bonez) | On Play; rest | none |
| OP14-091 | Mr.2.Bon.Kurei | On K.O.; play | none |
| OP14-092 | Mr.3(Galdino) | replacement | none |
| OP14-093 | Mr.4(Babe) | [Blocker], On K.O. | none |
| OP14-094 | Mr.5(Gem) | [Blocker], On Play; draw, trash from hand | none |
| OP14-100 | Absalom | On K.O., Trigger; lookAtTop, play, deck-top | none |
| OP14-102 | Kumacy | Trigger; play | none |
| OP14-103 | Gloriosa | On Play, Trigger; play, Life move | none |
| OP14-106 | Salome | [Blocker], Trigger; play | none |
| OP14-109 | Victoria Cindry | [Blocker], Trigger; play | none |
| OP14-110 | Dr. Hogback | On K.O., Trigger; play | none |
| OP14-111 | Perona | On Play, On K.O., Trigger; play, restriction | none |
| OP14-113 | Marguerite | On Play, Trigger; lookAtTop, trash from hand, play, deck-top | none |
| OP14-115 | Rindo | On K.O., Trigger; play, Life move, deck-top - needs: action damage | B4-G11 |
| OP14-119 | Dracule Mihawk | On Opp Attack; trash from hand, power - needs: cannotBeRested; timing becameRested | B4-G2, B4-G7 |
| OP14-120 | Crocodile | On Play, On K.O.; draw, trash from hand, restriction | none |
| OP14-017 | Chambres | Main - needs: swapBasePower | B4-G22 |
| OP14-018 | Time for the Counterattack | Counter, Trigger; play, power | none |
| OP14-036 | Strive to Surpass me, Roronoa Zoro!!! | Counter, Trigger; rest, power | none |
| OP14-037 | For Fun | Main, Counter; K.O., power | none |
| OP14-038 | I Never Bother to Remember the Faces of Trash | Main, Counter; draw, rest, power | none |
| OP14-057 | Don't Worry!! I'm Here!! | Main, Trigger; draw, power | none |
| OP14-058 | Ocean Current Shoulder Throw | Main, Counter; draw, play, power, return to hand | none |
| OP14-059 | Please Take Me with You!! I Can Be of Great Help to You!! | Main, Trigger; draw, return to hand | none |
| OP14-076 | Ever White | Main, Counter; power | none |
| OP14-077 | Penta-Chromatic String | Counter; power | none |
| OP14-078 | Bullet String | Counter; power, DON!! -X | none |
| OP14-097 | Hurry Up and Make Me the Pirate King! | Main, Trigger; lookAtTop, deck-top | none |
| OP14-098 | Crescent Cutlass | Main, Counter; power, cost mod | none |
| OP14-099 | Disappointed? | Main, Trigger; lookAtTop, deck-top | none |
| OP14-116 | Salamander | Counter, Trigger; draw, play, power | none |
| OP14-117 | Brick Bat | Counter, Trigger; play, power | none |
| OP14-039 | Coffin Boat | On Play, End of Your Turn; draw, setActive | none |

### OP-13

| Card | Name | Shapes needed | Gap IDs |
| --- | --- | --- | --- |
| OP13-002 | Portgas.D.Ace | On Opp Attack; draw, trash from hand, power - needs: timing damageTaken | B4-G10 |
| OP13-003 | Gol.D.Roger | ; power - needs: rules DON Phase to Leader | B4-G28 |
| OP13-079 | Imu | Activate Main; draw, play - needs: cost on own Characters; play from deck; rules deckRestriction | B4-G17, B4-G25, B4-G26 |
| OP13-100 | Jewelry Bonney | ; giveDon | none |
| OP13-005 | Inazuma | On Play; giveDon | none |
| OP13-006 | Woop Slap | On Play; giveDon | none |
| OP13-007 | Ace & Sabo & Luffy | Activate Main; power - needs: cost giveDon | B4-G18 |
| OP13-008 | Emporio.Ivankov | replacement - needs: replace ko by opp effect | B4-G15 |
| OP13-009 | Curly.Dadan | [Double Attack], permanent; keyword grant | none |
| OP13-012 | Nefeltari Vivi | On Play; lookAtTop, deck-top | none |
| OP13-013 | Higuma | On Play; K.O. | none |
| OP13-014 | Portgas.D.Rouge | Trigger; power | none |
| OP13-015 | Makino | Activate Main; power | none |
| OP13-016 | Monkey.D.Garp | On Play; deck-top | none |
| OP13-017 | Monkey.D.Dragon | replacement; power | none |
| OP13-023 | Uta | On Play, On K.O.; play, restriction | none |
| OP13-024 | Gordon | On Play | none |
| OP13-025 | Koby | [Blocker], On Play; setActive - needs: attribute | B4-G5 |
| OP13-026 | Sunny-Kun | Activate Main; power | none |
| OP13-028 | Shanks | On Play; restriction | none |
| OP13-030 | Tony Tony.Chopper | On Play | none |
| OP13-031 | Trafalgar Law | [Blocker], On Play, permanent; play, return to hand, keyword grant - needs: cost on own Characters | B4-G17 |
| OP13-032 | Nico Robin | On Play - needs: cannotBeRested | B4-G2 |
| OP13-033 | Franky | On K.O.; rest | none |
| OP13-034 | Brook | On Play; setActive | none |
| OP13-035 | Bepo | End of Your Turn; setActive | none |
| OP13-041 | Izo | On Play; draw | none |
| OP13-042 | Edward.Newgate | [Blocker], On Play; draw, trash from hand, giveDon | none |
| OP13-043 | Otama | On Play; draw, trash from hand | none |
| OP13-044 | Curiel | When Attacking, On K.O.; draw, giveDon | none |
| OP13-045 | Haruta | When Attacking; draw | none |
| OP13-046 | Vista | [Double Attack], replacement - needs: replacement scope | B4-G16 |
| OP13-047 | Fossa | replacement - needs: replace ko by opp effect | B4-G15 |
| OP13-050 | Boa Sandersonia | On Play; play | none |
| OP13-051 | Boa Hancock | On K.O.; draw | none |
| OP13-052 | Boa Marigold | [Blocker], On Play; play | none |
| OP13-053 | Marshall.D.Teach | [Banish], When Attacking; draw, keyword grant - needs: cost on own Characters | B4-G17 |
| OP13-054 | Yamato | On Play; draw, giveDon | none |
| OP13-055 | Rakuyo | When Attacking; power | none |
| OP13-056 | LittleOars Jr. | When Attacking; draw | none |
| OP13-060 | Amatsuki Toki | replacement - needs: replace ko by opp effect | B4-G15 |
| OP13-061 | Inuarashi | On Play; K.O. | none |
| OP13-062 | Crocus | On Play, When Attacking; return to hand | none |
| OP13-063 | Kouzuki Oden | [Blocker], On Play | none |
| OP13-064 | Gol.D.Roger | On Play; power, DON!! -X - needs: permanent negate | B4-G29 |
| OP13-065 | Shanks | On Play; lookAtTop, deck-top | none |
| OP13-066 | Silvers Rayleigh | [Rush], On Play; rest | none |
| OP13-067 | Scopper Gaban | On Play; draw, trash from hand | none |
| OP13-068 | Douglas Bullet | On Play, permanent; power | none |
| OP13-069 | Tom | On Play; DON!! -X | none |
| OP13-071 | Nekomamushi | On Play; K.O. | none |
| OP13-072 | Buggy | On Play | none |
| OP13-074 | Hera | On Play; play | none |
| OP13-080 | St. Ethanbaron V. Nusjuro | [Rush], When Attacking, permanent; power, restriction, keyword grant | none |
| OP13-081 | Koala | Activate Main, permanent; cost mod, giveDon | none |
| OP13-082 | Five Elders | Activate Main; trash from hand, play | none |
| OP13-083 | St. Jaygarcia Saturn | On Play, permanent; lookAtTop, restriction, deck-top | none |
| OP13-084 | St. Shepherd Ju Peter | On Play, permanent; lookAtTop, restriction, deck-top | none |
| OP13-086 | Saint Shalria | On Play; lookAtTop, trash from hand, deck-top | none |
| OP13-087 | Saint Charlos | [Blocker], On Play; deck-top - needs: action mill | B4-G1 |
| OP13-089 | St. Topman Warcury | [Blocker], On K.O., permanent; draw, restriction, keyword grant | none |
| OP13-091 | St. Marcus Mars | [Blocker], On Play, permanent; trash from hand, K.O., restriction, keyword grant | none |
| OP13-092 | Saint Mjosgard | On Play; play | none |
| OP13-093 | Morgans | [Blocker], On Play; draw, trash from hand | none |
| OP13-094 | York | On Play; power | none |
| OP13-095 | Saint Rosward | On Play; trash from hand, K.O. | none |
| OP13-102 | Edison | Activate Main, Trigger; draw, rest | none |
| OP13-104 | Kouzuki Hiyori | [Blocker], On K.O.; trash from hand, Life move, deck-top | none |
| OP13-105 | Kouzuki Momonosuke | On Play; lookAtTop - needs: look at all Life | B4-G14 |
| OP13-106 | Conney | [Blocker], Trigger; play, keyword grant - needs: timing triggerActivated | B4-G9 |
| OP13-108 | Jewelry Bonney | [Rush], On Play, Trigger; rest, keyword grant | none |
| OP13-109 | Jewelry Bonney | Trigger, replacement; draw, trash from hand, Life move | none |
| OP13-110 | Stussy | [Blocker], On Play; play | none |
| OP13-112 | Vegapunk | [Blocker], permanent; keyword grant | none |
| OP13-114 | S-Snake | On Play, When Attacking, Trigger; trash from hand, play, power, Life move | none |
| OP13-119 | Portgas.D.Ace | [Rush], On Play, permanent; giveDon, return to hand, keyword grant - needs: opponent plays | B4-G24 |
| OP13-120 | Sabo | [Blocker], Activate Main; cost mod, giveDon | none |
| OP13-019 | But Ace Here Said You Deserved It!! | Main, Counter; K.O., power | none |
| OP13-020 | Meteor Fist | Main, Trigger; power | none |
| OP13-021 | Gum-Gum Gatling Gun | Main, Trigger; power, giveDon | none |
| OP13-038 | Gum-Gum Elephant Gun | Main, Trigger; rest, setActive | none |
| OP13-039 | Gum-Gum Snake Shot | Counter, Trigger; K.O. - needs: activate own [On K.O.]/[Counter] | B4-G21 |
| OP13-057 | If I Bowed Down to Power, What's the Point in Living? | [Blocker], Main, Counter; power | none |
| OP13-058 | Phoenix Pyreapple | Main, Counter; power | none |
| OP13-059 | Brilliant Punk | Main; return to hand - needs: cost on own Characters | B4-G17 |
| OP13-075 | Guess We'll Have Another Scrap. You Can Only Risk Death While You're Still Alive!! | Main, Counter; power | none |
| OP13-077 | Go All the Way to the Top!! | Main, Counter; K.O., power | none |
| OP13-096 | The Five Elders Are at Your Service!!! | Main, Trigger; lookAtTop, deck-top | none |
| OP13-097 | The World's Equilibrium Cannot Be Maintained Forever | Main, Counter; K.O., power | none |
| OP13-098 | Never Existed... in the First Place... | Main, Counter; K.O., power - needs: ko Stage | B4-G39 |
| OP13-115 | Paper Art Afterimage | Counter, Trigger; draw, power | none |
| OP13-116 | The One Who Is the Most Free Is the Pirate King!!! | Main, Trigger; lookAtTop, deck-top | none |
| OP13-117 | Gum-Gum Dawn Stamp | Main, Trigger; draw, K.O., Life move | none |
| OP13-022 | Windmill Village | Activate Main; power | none |
| OP13-078 | Oro Jackson | keywords only - needs: timing removed by opp effect | B4-G34 |
| OP13-099 | The Empty Throne | Activate Main, permanent; play, power | none |

### EB-04

| Card | Name | Shapes needed | Gap IDs |
| --- | --- | --- | --- |
| EB04-001 | Jewelry Bonney | Activate Main, permanent; power, Life move | none |
| EB04-003 | Smoker & Tashigi | [Rush] | none |
| EB04-004 | Zeff | When Attacking | none |
| EB04-005 | Trafalgar Law | permanent; restriction | none |
| EB04-006 | Moda | On Play; lookAtTop, deck-top | none |
| EB04-011 | Scaled Neptunian | [Rush: Character], On Play; draw | none |
| EB04-012 | Kikunojo | Activate Main; setActive | none |
| EB04-013 | Carrot | On Play | none |
| EB04-014 | Kouzuki Sukiyaki | [Blocker], Activate Main; giveDon | none |
| EB04-015 | Jinbe | [Blocker], On K.O.; play | none |
| EB04-016 | Bird Neptunian | When Attacking, Activate Main; rest, setActive - needs: cannotSetDonActive | B4-G35 |
| EB04-017 | Mystoms | On Play, permanent; play, cost mod | none |
| EB04-018 | Megalo | On Play; K.O. | none |
| EB04-021 | Igaram | On Play, Activate Main; draw, trash from hand, giveDon | none |
| EB04-022 | Issho | On Play, When Attacking; trash from hand, power | none |
| EB04-023 | Chaka & Pell | [Double Attack], On Play; draw, power - needs: cost power on Leader | B4-G19 |
| EB04-024 | Terracotta | [Unblockable], Activate Main; trash from hand, keyword grant | none |
| EB04-025 | Nefeltari Vivi | On Play; play | none |
| EB04-026 | Bluegrass | On Play, When Attacking; draw, trash from hand | none |
| EB04-027 | Boa Hancock | On Play, Trigger; draw, trash from hand, play | none |
| EB04-033 | Groggy Monsters | On Play; K.O., DON!! -X | none |
| EB04-034 | Charlotte Pudding | [Blocker], On Opp Attack; trash from hand, power | none |
| EB04-035 | Hitokiri Kamazo | [Blocker] | none |
| EB04-036 | Foxy | On Play, Activate Main; draw, trash from hand, rest, DON!! -X, addDon | none |
| EB04-037 | Porche | On Play; deck-top | none |
| EB04-039 | Eustass"Captain"Kid | On Play, Activate Main; play, addDon | none |
| EB04-042 | Alpha | On Play; cost mod, deck-top | none |
| EB04-043 | Kaku | On Play, replacement; deck-top - needs: action mill; replace ko by opp effect | B4-G1, B4-G15 |
| EB04-044 | Koby | replacement; draw - needs: replacement scope; timing koed (opp Characters) | B4-G16, B4-G33 |
| EB04-045 | Ginny | Activate Main; power | none |
| EB04-046 | Doll | [Blocker], permanent; cost mod | none |
| EB04-047 | Helmeppo | Activate Main; play | none |
| EB04-048 | Rob Lucci | On Play, permanent; draw, cost mod - needs: cost on own Characters; Num division | B4-G17, B4-G32 |
| EB04-051 | Emet | Trigger, permanent; play, power, restriction | none |
| EB04-052 | Sanji | When Attacking, On K.O.; play; select Leader + setBasePower via refStat (Q9) | none |
| EB04-053 | Sentomaru | [Blocker], On Block; draw | none |
| EB04-054 | Bartholomew Kuma | On Play, On K.O.; return to hand, Life move, deck-top | none |
| EB04-055 | Bartholomew Kuma | On K.O., Trigger; play | none |
| EB04-056 | Pacifista | [Blocker]; keyword grant | none |
| EB04-057 | Vegapunk | [Blocker], permanent; restriction, keyword grant | none |
| EB04-008 | Distorted Future | Main, Counter; power | none |
| EB04-009 | It's My Student's Farewell. I Want It to Be Proper. | Main, Counter; power - needs: cost giveDon | B4-G18 |
| EB04-019 | Eleclaw | Main, Counter; power, cost mod | none |
| EB04-020 | Shark Brick Fist | Counter, Trigger; rest, power | none |
| EB04-028 | Ice Time | Main; trash from hand, restriction | none |
| EB04-029 | I Heard the Sound...of a Lady's Teardrops Falling | Main, Counter; trash from hand, power, deck-top | none |
| EB04-041 | Stealth Black | Main, Trigger; draw, trash from hand, play | none |
| EB04-049 | Finger Pistol Yellow Lotus | Main, Trigger; K.O., deck-top | none |
| EB04-050 | I'll Whip You Into Shape. | Main, Counter; power - needs: grant canAttackActive | B4-G36 |
| EB04-060 | Gum-Gum Hawk Gatling | Main, Trigger; draw, trash from hand, power, Life move | none |
| EB04-010 | Lulucia Kingdom | On Play, permanent; power | none |

### EB-03

| Card | Name | Shapes needed | Gap IDs |
| --- | --- | --- | --- |
| EB03-001 | Nefeltari Vivi | [Rush], When Attacking, Activate Main, replacement; trash from hand, power, keyword grant - needs: base-effect filter | B4-G6 |
| EB03-003 | Uta | On Play; draw, play - needs: base-effect filter | B4-G6 |
| EB03-004 | Carina | [Blocker], permanent; power | none |
| EB03-005 | Sugar | On Play; play | none |
| EB03-006 | Nami | On Play, Activate Main; draw, power - needs: cost power on Leader | B4-G19 |
| EB03-007 | Baccarat | [Blocker], On K.O.; play - needs: base-effect filter | B4-G6 |
| EB03-008 | Hibari | On Play, When Attacking, Activate Main; power - needs: grant canAttackActive | B4-G36 |
| EB03-009 | Makino | Activate Main; power - needs: base-effect filter | B4-G6 |
| EB03-010 | Monet | [Blocker], On Play; lookAtTop, deck-top | none |
| EB03-012 | Otama | Activate Main; rest | none |
| EB03-013 | Carrot | Activate Main; play, K.O. | none |
| EB03-014 | Kuina | Activate Main; giveDon (text damaged: Q1) | none |
| EB03-015 | Camie | Activate Main; rest, giveDon | none |
| EB03-016 | Kouzuki Hiyori | On Play, Activate Main; draw, giveDon | none |
| EB03-017 | Jewelry Bonney | On Play; setActive - needs: cannotBeRested | B4-G2 |
| EB03-018 | Tashigi | [Blocker], End of Your Turn, permanent; trash from hand, setActive, restriction, keyword grant - needs: scoped cannotBeKOd | B4-G30 |
| EB03-019 | Wanda | [Blocker] | none |
| EB03-021 | Alvida | On Play; trash from hand | none |
| EB03-022 | Isuka | [Blocker], On Play | none |
| EB03-023 | Kaya | On Play; lookAtTop, deck-top | none |
| EB03-024 | Nefeltari Vivi | [Blocker], On Play; play, restriction | none |
| EB03-025 | Hina | On Play; trash from hand, return to hand | none |
| EB03-026 | Boa Hancock | On Play, Activate Main; giveDon - needs: cost on own Characters | B4-G17 |
| EB03-027 | Marguerite | On Play; return to hand | none |
| EB03-028 | Yu | On Play, Activate Main; draw | none |
| EB03-031 | Vinsmoke Reiju | On Play, Main; DON!! -X - needs: activate Event from hand/trash | B4-G20 |
| EB03-032 | Charlotte Flampe | On Play; power | none |
| EB03-033 | Charlotte Brulee | keywords only - needs: donReturned cause | B4-G41 |
| EB03-034 | Charlotte Linlin | On Play, On K.O.; draw, DON!! -X, Life move, deck-top | none |
| EB03-035 | Charlotte Pudding | [Blocker], On Play | none |
| EB03-036 | Baby 5 | On Play; K.O., DON!! -X | none |
| EB03-037 | Lim | On Play; power | none |
| EB03-039 | Ulti | On Play; draw, trash from hand, play - needs: base-effect filter | B4-G6 |
| EB03-041 | Kujyaku | On Play, permanent; draw, trash from hand, power | none |
| EB03-042 | Koala | On K.O., permanent; play, cost mod | none |
| EB03-043 | Stussy | [Blocker], On Play; K.O. | none |
| EB03-044 | Black Maria | [Blocker], On Play, permanent; lookAtTop, play, keyword grant, deck-top | none |
| EB03-045 | Perona | [Blocker], On Play; play, giveDon | none |
| EB03-046 | Miss Doublefinger(Zala) | On Play, On K.O.; draw, deck-top - needs: action mill | B4-G1 |
| EB03-047 | Miss.Valentine(Mikita) | On Play, On K.O.; draw, deck-top - needs: action mill | B4-G1 |
| EB03-048 | Rebecca | [Blocker], On Play; lookAtTop, play, deck-top | none |
| EB03-050 | Conis | [Double Attack], On Play; keyword grant | none |
| EB03-051 | Charlotte Smoothie | On Play; K.O. - needs: Life face state | B4-G13 |
| EB03-052 | Shirahoshi | Activate Main; power, Life move, deck-top | none |
| EB03-054 | Nico Robin | On Play, Trigger; trash from hand, play, Life move, deck-top - needs: Life to trash | B4-G12 |
| EB03-055 | Nico Robin | On Play, On K.O.; Life move, deck-top - needs: action damage; Life to trash | B4-G11, B4-G12 |
| EB03-056 | Belo Betty | On Play; K.O., Life move | none |
| EB03-057 | Yamato | On Play, On K.O.; giveDon - needs: Life to trash | B4-G12 |
| EB03-058 | Lilith | On Play, Trigger; draw, play | none |
| EB03-059 | S-Snake | On Play, Trigger; Life move, restriction | none |
| EB03-061 | Uta | Activate Main, End of Your Turn; rest | none |
| EB03-062 | Trafalgar Law | [Rush], Activate Main; trash from hand, play, Life move, deck-top | none |
| EB03-011 | But If We Ever See Each Other Again... Will You Call Me Your Shipmate?!! | Counter, Trigger; power | none |
| EB03-020 | There You Are, Sore Loser! | Counter; power | none |
| EB03-029 | Insolent Fool!! Stand Down!! | Main, Counter; play, power | none |
| EB03-038 | Thanks for the Treat. | Main, Counter; power | none |
| EB03-049 | I Knew You People Were Behind This. | Main, Counter; play, power | none |
| EB03-060 | Will You Be My Servant? | Main, Trigger; deck-top | none |

### ST-29

| Card | Name | Shapes needed | Gap IDs |
| --- | --- | --- | --- |
| ST29-001 | Monkey.D.Luffy | When Attacking; draw, trash from hand | none |
| ST29-002 | Usopp | On Play, When Attacking; rest | none |
| ST29-003 | Kaku | Trigger, permanent; K.O., power | none |
| ST29-004 | Sanji | On Play, Trigger; lookAtTop, trash from hand, play, deck-top | none |
| ST29-005 | Jinbe | Trigger; play | none |
| ST29-007 | Tony Tony.Chopper | On K.O., Trigger; power, Life move | none |
| ST29-008 | Nami | Trigger, replacement; play, Life move - needs: replace ko by opp effect | B4-G15 |
| ST29-009 | Nico Robin | [Blocker], Trigger; play | none |
| ST29-011 | Brook | [Blocker] | none |
| ST29-012 | Monkey.D.Luffy | Activate Main, Trigger; play, giveDon | none |
| ST29-013 | Rob Lucci | Trigger; K.O. | none |
| ST29-014 | Roronoa Zoro | [Rush: Character], Activate Main; draw, giveDon | none |
| ST29-015 | Raw Heat Strike | Counter; power | none |
| ST29-016 | Kizaru!! Compared to Two Years Ago We're a Hundred Times Stronger Now!! | [Unblockable], Main, Counter; power, keyword grant | none |
| ST29-017 | Iai Death Lion Song | Counter, Trigger; draw, trash from hand, K.O., power | none |

### Older sets (block 4 cards from OP-04, OP-03, OP-02, OP-01, ST-06, ST-02), newest first

| Card | Name | Shapes needed | Gap IDs |
| --- | --- | --- | --- |
| OP04-077 | Ideo | [Blocker] | none |
| OP04-096 | Corrida Coliseum | keywords only | none |
| Card | Name | Shapes needed | Gap IDs |
| --- | --- | --- | --- |
| OP03-008 | Buggy | On Play, permanent; lookAtTop, restriction, deck-top - needs: attribute; scoped cannotBeKOd | B4-G5, B4-G30 |
| OP03-044 | Kaya | On Play; draw, trash from hand | none |
| OP03-048 | Nojiko | On Play; return to hand | none |
| OP03-072 | Gum-Gum Jet Gatling | Counter, Trigger; trash from hand, power, addDon | none |
| OP03-097 | Six King Pistol | Counter, Trigger; draw, trash from hand, K.O., power | none |
| Card | Name | Shapes needed | Gap IDs |
| --- | --- | --- | --- |
| OP02-005 | Curly.Dadan | On Play; lookAtTop, deck-top | none |
| OP02-068 | Gum-Gum Rain | Counter, Trigger; trash from hand, power, return to hand | none |
| Card | Name | Shapes needed | Gap IDs |
| --- | --- | --- | --- |
| OP01-039 | Killer | [Blocker], On Block; draw | none |
| Card | Name | Shapes needed | Gap IDs |
| --- | --- | --- | --- |
| ST06-008 | Hina | On Play; cost mod | none |
| Card | Name | Shapes needed | Gap IDs |
| --- | --- | --- | --- |
| ST02-007 | Jewelry Bonney | Activate Main; lookAtTop, deck-top | none |

## 3. Gap list

Each gap names the DSL construct that is missing, where it would go, the cards that need it in this slice, and a rough size (S: under a day, one function plus tests; M: one to three days, a new modifier/hook plus validator and UI text; L: a new subsystem). Other auditors: dedupe on the construct names in bold.

### B4-G1: action mill

- **Gap.** Action `mill` (effect form: "Trash N cards from the top of your deck"). `Action.mill` is in `dsl.ts` and the validator's key list but not in `IMPLEMENTED.actions`; `run.ts` `action()` has no branch (only the cost form exists, `payCost` `mill`). Add a branch that moves the top N deck cards to the trash (reason `effect`, public), stopping at an empty deck, and add `mill` to `IMPLEMENTED.actions`. The two optional "You may trash N cards from the top of your deck:" cards (EB04-042, EB04-049) use the existing cost and are not counted.
- **Cards (13).** OP15-022, OP15-081, OP15-082, OP15-083, OP15-084, OP15-085, OP15-096, OP14-079, OP14-081, OP13-087, EB04-043, EB03-046, EB03-047
- **Size.** S

### B4-G2: cannotBeRested

- **Gap.** Restriction `cannotBeRested` (a Character "cannot be rested until the end of your opponent's next End Phase"; own Character "cannot be rested by your opponent's Leader and Character effects", OP15-024). Not in `Restriction` (dsl.ts), `IMPLEMENTED.restrictions`, `ModKind` (state.ts), `RESTRICT_KIND` (run.ts, layers.ts), and `rest()` in `ops/index.ts` / the `rest` action and `selectRest` in `run.ts` never consult a protection. Needs a modifier kind, durations `untilEndOfOpponentsNextTurn` and the permanent form (OP15-024, opponent's turn), and a cause check so that costs, the owner's own effects and rule rests (attacking, Blocker) are unaffected. Also consider `skipRefresh` interplay (a non-rested card). 
- **Cards (7).** OP15-024, OP15-029, OP14-033, OP14-069, OP14-119, OP13-032, EB03-017
- **Size.** M

### B4-G3: give opponent's DON!!

- **Gap.** Giving the OPPONENT'S DON!! to the opponent's Leader or Characters. `giveDon` (`run.ts` `giveDon`, `donField`) takes the DON!! from the controller's cost area only and the validator's `giveDon` has no donor. Needs `giveDon: { from: 'opponent', ... }` (rested cost-area DON!! of the opponent, or "from its owner's cost area" (active or rested, OP15-023 Arlong, OP15-025 Kuro, OP15-028 Meowban) given to the opponent's own Leader/Characters, with the chooser being the controller), and the cost form ("give 1 of your opponent's rested DON!! cards to 1 of your opponent's Characters", OP15-003, OP15-017, OP15-023): a `Cost` kind `giveDon` with an opponent donor, payable check in `eval.ts` `payable`. Given DON!! return to the owner's cost area at their Refresh as usual (CR 6-2-3), which `donField` already counts for the owner.
- **Cards (10).** OP15-003, OP15-008, OP15-010, OP15-012, OP15-015, OP15-017, OP15-023, OP15-025, OP15-026, OP15-028
- **Size.** M

### B4-G4: filter donGiven

- **Gap.** Filter on the number of DON!! given to a card, and a per-card count. (a) `Filter { donGiven: Cmp }` ("Characters with a DON!! card given", "that has 2 or more DON!! cards given") in `dsl.ts`, `dsl-validate.ts` `filter`, `eval.ts` `matchesOf` (`card.don`). (b) A per-target number for `power`/`cost` amounts and for comparisons against a bound card: OP15-008 "−1000 power for every DON!! card given to THAT Character" (each target a different amount) and OP15-031 "cost equal to the number of DON!! cards given to it" (`refStat` has `cost | power | basePower` only: add `donGiven`; and a `Num` evaluated per target such as `{ perTarget: 'donGiven' }`, `run.ts` `action` `power` loop calls `num` once for all targets).
- **Cards (8).** OP15-001, OP15-008, OP15-015, OP15-018, OP15-025, OP15-027, OP15-031, OP15-038
- **Size.** M

### B4-G5: attribute

- **Gap.** Attribute. `Filter { attribute: 'Slash' | 'Strike' | ... }` (`Def.attributes` already holds them, state.ts; `eval.ts` `matchesOf` has no branch) for OP13-025 (Leader has the Strike attribute) and OP03-008 (cannot be K.O.'d in battle by Slash attribute cards); and a timed `grant` of an attribute (OP15-093: "gains [Rush: Character] and the 'Slash' attribute during this turn"): a new `ModKind` read by `derive` (needs a `Derived.attributes`).
- **Cards (3).** OP15-093, OP13-025, OP03-008
- **Size.** S

### B4-G6: base-effect filter

- **Gap.** Filters on a card's base effects. `Filter { hasBaseEffect: false }` ("Character with no base effect": EB03-003, EB03-007, EB03-009, EB03-039; keyword-only and vanilla cards both count as none, see Q9) and `Filter { hasTiming: 'whenAttacking' }` ("without a [When Attacking] effect", EB03-001). `Def.abilities` (state.ts) holds the script, so `eval.ts` `matchesOf` can answer both, but a card with no script yet would read as having no effect: decide how an unscripted card behaves (it is a pool question, not just a filter).
- **Cards (5).** EB03-001, EB03-003, EB03-007, EB03-009, EB03-039
- **Size.** S

### B4-G7: timing becameRested

- **Gap.** Timing `becameRested` ("[Your Turn] When this Character becomes rested", optionally "by your opponent's Character's effect", OP14-070 Buffalo). Not in `AutoTiming`/`IMPLEMENTED.timings`. Hook in `ops/index.ts` `rest()` (or `run.ts` `rest`), after the card is rested, with the reason (`effect` / `cost` / `rule`) and the causing card's category and controller; `flow.ts` `fire` with a matcher on the subject (self). Rest by the attack declaration or by blocking counts as becoming rested; see Q10.
- **Cards (7).** OP14-021, OP14-027, OP14-028, OP14-032, OP14-035, OP14-070, OP14-119
- **Size.** M

### B4-G8: timing handTrashedByEffect

- **Gap.** Timing `trashedFromHand` ("When a card is trashed from your hand by an effect": OP14-045, OP14-049, OP14-056). A hook in `moveCard` from hand to trash when `reason === 'effect'` (not costs), in `ops/index.ts` (like `hooks.lifeRemoved`), firing the watchers on the owner's field. Whose effect (own, opponent's) counts: Q11.
- **Cards (3).** OP14-045, OP14-049, OP14-056
- **Size.** S

### B4-G9: timing triggerActivated

- **Gap.** Timing `triggerActivated` ("[Opponent's Turn] When a [Trigger] activates", OP13-106 Conney): fire from the damage-step trigger decision when a [Trigger] is activated (flow.ts damage frame), `by` either player.
- **Cards (1).** OP13-106
- **Size.** S

### B4-G10: timing damageTaken

- **Gap.** Timing `damageTaken` ("when you take damage", OP13-002 Ace, with `[DON!! x1] [Once Per Turn]` and a second timing `koed` in the same `when` list). Fire after damage processing ends, as rulings.md already requires for Ace (the draw queues after the Trigger resolves). `flow.ts` damage frame.
- **Cards (1).** OP13-002
- **Size.** S

### B4-G11: action damage

- **Gap.** Action `damage` ("you take 1 damage" OP14-115; "deal 1 damage to your opponent" EB03-055). `run.ts` `runInternal` already has an internal `damage` op (pushes a `damage` frame), but it is not in `Action`/`IMPLEMENTED.actions`; expose it as `{ damage: { player: P, n } }`. Damage from an effect takes the top Life card and can activate its [Trigger]; at 0 Life the player loses.
- **Cards (2).** OP14-115, EB03-055
- **Size.** S

### B4-G12: Life to trash

- **Gap.** Life to trash. A move of the top Life card to the trash, as an effect and as a cost: "trash 1 card from the top of your Life cards" (cost, EB03-054, EB03-055; effect, OP15-116) and "trash up to 1 card from the top of your opponent's Life cards" (EB03-057). `moveShape` (dsl-validate.ts) admits `lifeTop` only to hand; `run.ts` `move` handles `lifeTop` only to hand; `Cost` has no Life-to-trash (the `trashLifeUntil` action exists). Add `lifeTop → trash` (owner you/opponent; fires `lifeRemoved`; not damage, so no [Trigger]) and a cost kind `trashLife` (with `payable` check in `eval.ts`).
- **Cards (4).** OP15-116, EB03-054, EB03-055, EB03-057
- **Size.** S

### B4-G13: Life face state

- **Gap.** Life card face state. (a) Cost `turnLifeFaceDown` ("turn 1 card from the top of your Life cards face-down", OP15-099; `turnLifeFaceUp` exists, `run.ts` `turnFaceUp`); (b) action `turnLifeFaceDown` for all Life cards (EB03-051 "turn all of your Life cards face-down"); (c) condition "you have a face-up Life card" (`Condition`/`Num` on `card.faceUp`, EB03-051). Hidden-information handling: turning face-down must re-roll the card's projection key (`state.ts` `key`) so it is hidden again.
- **Cards (2).** OP15-099, EB03-051
- **Size.** M

### B4-G14: look at all Life

- **Gap.** Action `rearrangeLife` ("Look at all of your Life cards and place them back in your Life area in any order", OP13-105): a private look at the controller's whole Life area and an `order` decision (as `lookAtTop` rest ordering in `run.ts`), without changing face state. The `lookAtTop`/`order` machinery is reusable; the new part is the source zone (`lifeTop`, all) and the destination (Life).
- **Cards (1).** OP13-105
- **Size.** M

### B4-G15: replace ko by opp effect

- **Gap.** Replacement for a K.O. "by your opponent's effect" only. `ReplaceEvent` is `{ ko: Selector } | { leaveField: Selector; cause: 'opponentEffect' }`; `ko` has no cause (`flow.ts` `collectReplacements` offers it for battle K.O.s too, which would wrongly protect against battle). Add `{ ko: Selector; cause?: 'opponentEffect' }` and check `cause.kind === 'effect' && cause.by !== p` in `collectReplacements` for `ko`. (`leaveField` + `opponentEffect` also covers a K.O. by an opponent's effect but also bounce/trash, which these cards do not say.)
- **Cards (6).** OP14-034, OP13-008, OP13-047, OP13-060, EB04-043, ST29-008
- **Size.** S

### B4-G16: replacement scope

- **Gap.** Replacement scope variants. (a) `leaveField` with `cause: 'any'` (EB04-044 Koby: "this Character would be removed from the field", Navy Leader, Once Per Turn, discard 1 instead); (b) one replacement covering two events with ONE Once Per Turn (OP13-046 Vista: "would be K.O.'d or would be removed from the field by your opponent's effect"): two abilities would each get a use per turn, so `replaces` needs to accept a list. `ReplaceEvent` (dsl.ts), `flow.ts` `collectReplacements`.
- **Cards (2).** OP13-046, EB04-044
- **Size.** S

### B4-G17: cost on own Characters

- **Gap.** Costs on the controller's own Characters (and the same as a replacement payload). The cost vocabulary stops at hand and trash: validator `cost` -> `move` is `hand`/`trash` only, `payCost` `trash` moves with `moveCard`, which for a field card skips removal events and replacements. Needed: `Cost` kinds that act on `characters`: return to hand (OP15-039, OP13-031, OP13-059), place at the bottom of the deck (OP15-041, EB03-026, and as the replacement payload of OP15-052 Leo), trash (OP13-053, EB04-048, and OP13-079's alternative "1 of your Celestial Dragons Characters or 1 card from hand"), and K.O. (OP14-079, OP14-080: [On K.O.] of the paid Character must fire). Implement through `pushRemove`/`pushKo` with `cause.kind = 'cost'` (flow.ts), `payable` in `eval.ts` (pool count), `costIsSecret`. A cost K.O./trash is not an opponent's effect, so removal-proofing does not stop it.
- **Cards (11).** OP15-039, OP15-041, OP15-052, OP14-079, OP14-080, OP13-079, OP13-031, OP13-053, OP13-059, EB04-048, EB03-026
- **Size.** M

### B4-G18: cost giveDon

- **Gap.** Cost `giveDon` ("give 1 of your active DON!! cards to 1 of your Leader or Character cards": OP13-007 with `trashSelf`, EB04-009 to a named [Silvers Rayleigh]). `Cost` has no such kind; reuse `run.ts` `giveDon` for `state: 'active'` and add the payable check (an active DON!! and a legal target).
- **Cards (2).** OP13-007, EB04-009
- **Size.** S

### B4-G19: cost power on Leader

- **Gap.** Cost `power` on the controller's own active Leader ("give your active Leader −5000 power during this turn": EB04-023; EB03-006 reads "5000 power", sign: Q3). `Cost` has no power kind; needs a modifier added at cost time (target must be the active Leader) and a payable check; a negative amount is only legal while the Leader has the power (power can go below 0, so always payable).
- **Cards (2).** EB04-023, EB03-006
- **Size.** S

### B4-G20: activate Event from hand/trash

- **Gap.** Action `activate` of an EVENT card from the hand or the trash: "Activate up to 1 {Dressrosa} type Event with a base cost of 3 or less from your hand" (OP15-014, OP15-046) and "activate the [Main] effect of up to 1 Event card with a cost of 7 or less in your trash" (EB03-031). `Action.activate` is `{ ability: 'main' | 'onPlay'; of: 'self' }` only. Needs `of: Selector` (an Event in hand or trash), the activation procedure of CR 8-4 (the Event is trashed from hand, its [Main] runs; whether its cost is paid and whether it counts as "activating an Event" for `eventActivated` watchers: Q7, Q8). `run.ts` `activate`.
- **Cards (3).** OP15-014, OP15-046, EB03-031
- **Size.** M

### B4-G21: activate own [On K.O.]/[Counter]

- **Gap.** Action `activate` of the card's own [On K.O.] (OP15-079 Absalom: "[Trigger] Activate this card's [On K.O.] effect") and own [Counter] (OP13-039: "[Trigger] Activate this card's [Counter] effect"). `run.ts` `activate` supports `main` and `onPlay` only; add `onKO` and `counter` (a [Counter] resolved outside a battle: its "during this battle" modifiers have no battle, check `duration`).
- **Cards (2).** OP15-079, OP13-039
- **Size.** S

### B4-G22: swapBasePower

- **Gap.** Action `swapBasePower` ("Select 2 ... Characters. Swap the base power of the selected Characters with each other during this turn / during this battle": OP14-001 Leader, OP14-009, OP14-017). New action over two bound selections: two `basePower` modifiers whose values are read from each other's current base power at resolution time, with durations `thisTurn`/`battle`. `run.ts` `action`, `layers`/`derive` base-power stage; OP14-009 swaps the Leader with a Character during battle.
- **Cards (3).** OP14-001, OP14-009, OP14-017
- **Size.** M

### B4-G23: redirectAttack

- **Gap.** Action `redirectAttack` ("Change the attack target to the selected card", OP14-060 Doflamingo Leader, [On Your Opponent's Attack] DON!! −1). New battle-flow operation in `flow.ts` (battle frame): set `s.battle.target` to the chosen own Leader/Character (must be a legal attack target, rested/active rules as for the original), then re-run the attack-declaration steps without re-triggering [When Attacking]; `attackMatch` events (`onOpponentAttack`) fire again for the new target (Q12).
- **Cards (1).** OP14-060
- **Size.** M

### B4-G24: opponent plays

- **Gap.** Opponent plays a card from their hand (OP13-119: "your opponent plays up to 1 Character card with a cost of 4 or less from their hand"). `run.ts` `play` always pushes the `play` frame with `player: you`, and `select` with `chooser: 'opponent'` only changes who chooses. Needs `play: { player: 'opponent', what }` so the frame's `player`, `playBlocked`, area-full trash choice and the `cardPlayed` events use the opponent.
- **Cards (1).** OP13-119
- **Size.** S

### B4-G25: play from deck

- **Gap.** Play a card from the DECK (non-top search) at the start of the game: OP13-079 Imu "at the start of the game, play up to 1 [Mary Geoise] type Stage card from your deck". `play` zones are `hand | trash | self` (validator), and `zoneIds` in `eval.ts` knows only `deckTop`. Needs a `deck` (whole) source in `select`/`pool` (hidden pool: a secret decision, then a shuffle) and the `startOfGame` timing running `play` before the first turn (`flow.ts` setup `startOfGame`).
- **Cards (1).** OP13-079
- **Size.** M

### B4-G26: rules deckRestriction

- **Gap.** `rules` clause `deckRestriction` (OP13-079 "you cannot include Events with a cost of 2 or more in your deck"). `RulesClause` has it, `validateScript` rejects it; needs the deck builder/validator (`engine/src/deck.ts`, `cards/src/decklist.ts`/format) to apply a Filter against the Leader's rule, the app's deck builder to show it, and `Def` to carry it. Deck-construction, not game flow.
- **Cards (1).** OP13-079
- **Size.** M

### B4-G27: rules deck-out

- **Gap.** Rules modification for deck-out (OP15-022 Brook: "under the rules of this game, you do not lose when your deck has 0 cards. You lose at the end of the turn in which your deck becomes 0 cards"). Not in `RulesClause`. `engine/src/setup.ts`/`flow.ts` implement the default loss on drawing from an empty deck; needs a per-player flag replacing the immediate loss with a check at the End Phase of the turn the deck became 0, and `Def` plumbing (like `donDeckSize`).
- **Cards (1).** OP15-022
- **Size.** M

### B4-G28: rules DON Phase to Leader

- **Gap.** Rules modification of the DON!! Phase placement (OP13-003 Roger: "If you have any DON!! cards on your field, 1 DON!! card placed during your DON!! Phase is given to your Leader"). Not expressible: neither `rules` nor a replacement covers the DON!! Phase (`flow.ts` turn step `don`). Needs a continuous rule on the DON!! Phase placement: the second (or the one) placed DON!! card goes to the Leader as a given DON!! card (active/rested state per Q13), evaluated on placement, plus the `DonPlaced`/`DonGiven` events.
- **Cards (1).** OP13-003
- **Size.** M

### B4-G29: permanent negate

- **Gap.** Permanent `negate` ("Your Leader and all of your Characters that do not have a type including 'Roger Pirates' have their effects negated", OP13-064). `Continuous` has no `negate`; `layers.ts` has no negation stage (the `negate` action creates a `negate` modifier, which `derive.ts` `negated` honours). Add `{ negate: { target: Selector } }` as a stage that runs before every other stage (a negated source must stop producing its own permanents: `computePerms` already checks `deriveAt(...).negated` with `upto: 0`, so the negation stage must be stage 0 and cannot read later stages).
- **Cards (1).** OP13-064
- **Size.** M

### B4-G30: scoped cannotBeKOd

- **Gap.** Scoped `cannotBeKOd`. `cannotBeKOd` in `flow.ts` `runKo` blocks every cause. The cards: "cannot be K.O.'d by your opponent's effects" (EB03-018 Tashigi, on the opponent's turn); "cannot be K.O.'d by effects of your opponent's Characters with 5000 base power or less" (OP14-003 Bege; needs the source card of the effect in `Cause`); "cannot be K.O.'d in battle by 'Slash' attribute cards" (OP03-008 Buggy; needs the attacker's attributes, G5). Add restriction variants with a cause (`battle`/`effect`) and an optional source Filter, and carry `source` in `Cause` (state.ts `Cause`).
- **Cards (3).** OP14-003, EB03-018, OP03-008
- **Size.** M

### B4-G31: Num stat of selector

- **Gap.** `Num` for a stat of a selected card with no bind (a permanent cannot bind): OP14-053 Vista "base power becomes the same as your Leader's base power". `Num` has `refStat` (needs a bound name from an earlier selector in the same ability). Add `{ statOf: Selector, stat }` (first card of the selector) in `eval.ts` `numOf`. In an action (EB04-052 Sanji "same as your opponent's Leader") `select` + `refStat` already works.
- **Cards (1).** OP14-053
- **Size.** S

### B4-G32: Num division

- **Gap.** `Num` division / floor ("+1000 power and −2 cost for every 5 cards in your trash", EB04-048 Rob Lucci). `Num` has `mul` and `sum` only. Add `{ div: [Num, n] }` (floor) in `eval.ts`/`dsl-validate.ts` `num`; (or write it with `tiers` at 5/10/15/.../50 thresholds, ten entries, which works today but is ugly).
- **Cards (1).** EB04-048
- **Size.** S

### B4-G33: timing koed (opp Characters)

- **Gap.** Timing `koed` for the OPPONENT's Characters ("[Your Turn] [Once Per Turn] When one of your opponent's Characters is K.O.'d, draw 1", EB04-044). `flow.ts` `runKo` fires `koed` only for abilities controlled by the K.O.'d card's owner (`p === owner`). Add `owner: P` to the event (`{ event: 'koed', filter, owner? }`, dsl.ts and validator) and fire for both players.
- **Cards (1).** EB04-044
- **Size.** S

### B4-G34: timing removed by opp effect

- **Gap.** Timing for "removed from the field by your opponent's effect" of your Character (OP13-078 Oro Jackson: "[Once Per Turn] When your Character with a type including 'Roger Pirates' is removed from the field by your opponent's effect, add up to 1 DON!!"). K.O., bounce and trash by an opponent's effect all count; `flow.ts` `runKo`/`runRemove` fire nothing for non-K.O. removals. New event `{ event: 'removed', filter, cause: 'opponentEffect' }`.
- **Cards (1).** OP13-078
- **Size.** S

### B4-G35: cannotSetDonActive

- **Gap.** Restriction on a player: `cannotSetDonActive` "you cannot set DON!! cards as active using Character effects during this turn" (EB04-016). `Restriction` for players is `cannotDrawByOwnEffects | { cannotPlay }`; add a Leader-modifier kind and a check in `run.ts` `setActive` (DON!! branch) for effects whose source is a Character (the Leader's, Stage's and Event effects are not restricted).
- **Cards (1).** EB04-016
- **Size.** S

### B4-G36: grant canAttackActive

- **Gap.** Keyword-like grant "can also attack active Characters during this turn" (EB04-050, EB03-008: to a {SWORD} Leader or Character). `Keyword` is `Rush | Rush: Character | Double Attack | Banish | Blocker | Unblockable`; add a keyword/`ModKind` (`canAttackActive`) honoured by `actions.ts` legal attack targets (active Characters become legal targets).
- **Cards (2).** EB04-050, EB03-008
- **Size.** S

### B4-G37: lookAtTop take to play

- **Gap.** `lookAtTop` take destination `play` (OP14-010 Basil Hawkins: "look at 5; play up to 1 {Supernovas} Character card with 2000 power or less other than [Basil Hawkins]. Then, place the rest at the bottom"). `Take.to` is `hand | lifeTop`. Add `to: 'play'` pushing a free `play` frame (`run.ts` `lookAtTop`).
- **Cards (1).** OP14-010
- **Size.** S

### B4-G38: returnDon by opponent

- **Gap.** `returnDon` by the OPPONENT: "your opponent returns 1 DON!! card from their field to their DON!! deck" (OP14-065 Senor Pink [On K.O.]) and "your opponent may return 1 of their active DON!! cards ... If they do not, ..." (OP15-059 Amazon, `chooseOne` with `chooser: 'opponent'`, restricted to active cost-area DON!!). `Action.returnDon` is `{ n }` and `run.ts` `returnDon` is always the controller's (`f.controller`). Add `player: P` and a `from: 'active'` restriction; the opponent chooses the DON!! class; fires `donReturned` for the opponent.
- **Cards (2).** OP15-059, OP14-065
- **Size.** S

### B4-G39: ko Stage

- **Gap.** `ko` of a STAGE ("K.O. up to 1 of your opponent's Stages with a cost of 1 / 7", OP14-088, OP13-098). The validator limits `ko` to `characters` and `pushKo` requires a Character; `runRemove` already handles stages. Allow `stage` in `ko` and route a Stage K.O. through a K.O. event to the trash (check removal-proofing and `cannotBeKOd` on Stages).
- **Cards (2).** OP14-088, OP13-098
- **Size.** S

### B4-G40: event-activated history

- **Gap.** Per-turn history: "If you have activated an Event with a base cost of 3 or more during this turn" (OP15-002 Activate: Main). Needs a per-player per-turn log of activated Events (card, base cost) in `State` and a `Condition`/`Num` reading it (`eval.ts`), cleared at turn change; the `eventActivated` hook point (`flow.ts` `fireActor`) is where it is recorded.
- **Cards (1).** OP15-002
- **Size.** S

### B4-G41: donReturned cause

- **Gap.** `donReturned` with a cause: "When a DON!! card on your field is returned to your DON!! deck BY YOUR EFFECT" (EB03-033 Charlotte Brulee, opponent's turn). `AutoTiming` `donReturned` has only `owner`; `run.ts` `returnDon` fires it for costs and effects alike. Add `cause: 'effect'` (costs excluded) and the effect's controller.
- **Cards (1).** EB03-033
- **Size.** S

### 3b. Shapes I verified as already implemented (nuances that look like gaps but are not)

- `forEach` with a count of zero or below skips the body (`run.ts` `fe`): EB04-011 (draw a card per {Neptunian}, then `forEach` the same count trash 1) and OP14-054 Fisher Tiger (`forEach` over `sum: [{ hand: 'you' }, -5]`, trash 1 each iteration) need nothing new.
- `trashFromHand` with `pick: { any: true }` and a `bind`, then `power` with `amount` `{ mul: [{ refCount }, 1000] }` (OP15-002 Lucy): `pick any` is implemented, `refCount` reads the bound ids.
- `move` from `characters` with no `pick` moves every match to the trash with removal events (OP13-082 Five Elders "trash all of your Characters"), then `play` from the trash with `pick: { upTo: 5, distinctNames: true }`.
- `play` with `from: ['hand', 'trash']` (OP14-091, EB03-042, EB03-049, EB04-041, EB04-047): `pool` walks every zone; `rested: true` is implemented (OP14-089, OP14-100.., OP13-023, EB03-005).
- `rest` over `[donCostArea, characters]` with a Filter that applies to the Characters only (EB03-012 Otama, EB03-061 Uta: "DON!! cards or {Animal}/{SMILE} Characters with a cost of 3 or less"): `run.ts` `action` rest branch and `selectRest` split cards and DON!!.
- A replacement whose `instead` is an effect (power, `lifeTop` to hand, give power to the Leader): OP15-009, OP14-016, OP13-017, OP15-098, OP15-105 (`isEffect(instead)` in `flow.ts` `possible`); costs as payloads (`rest`, `trash`, `turnLifeFaceUp`, `returnDon`, `trashSelf`, `move` trash to the deck bottom): OP13-109, ST29-008, OP14-029, OP14-061, OP14-092, EB04-043, OP14-034.
- `select` of the opponent's Leader then `setBasePower` with `refStat` (EB04-052 Sanji "same as your opponent's Leader", wording Q9); `setBasePower` to a literal for "becomes 7000" with `untilEndOfOpponentsNextTurn` (EB04-004) and as a permanent on the opponent's turn (EB04-003, OP15-070).
- Permanent `grant` of `Rush: Character` with a condition (OP14-090, OP04-096), `restrict cannotAttack` with a `none`/`exists` condition (EB04-005, EB04-051, OP15-039), permanent `cost` on `from: 'self'` (OP13-081, EB03-042) and on a hand card (OP15-013, OP15-021, OP15-102 whose sign is Q2).
- `chooseOne` with an `if` inside a mode (OP14-069, OP15-054); `delayed` with `setActive`/`addDon`/`skipRefresh` (OP13-024, OP13-038, OP13-066, OP15-025).
- `restrict` on a player with `{ cannotPlay: Filter }` ("cannot play Character cards with a base cost of 5 or more", OP13-023, OP14-024, EB03-024, OP13-028; the filter has no zone scope, so "from your hand" in OP13-028 is read as all plays: Q14).
- `restrict` `cannotActivateBlockerAgainstIt` on the Leader with a `thisTurn` duration (OP13-057).
- Triggers: `cardPlayed` with `by: 'you'` and a `hasTrigger` filter (OP13-100), `onBlock` (EB04-053, OP01-039), `startOfYourTurn`/`endOfYourTurn`, `donReturned` with an owner (OP14-068, EB04-035), `koed` for the owner's own Characters with a `basePower` filter (the second timing of OP13-002 once G10 exists).
- `move` from `lifeTop` of the OPPONENT to the owner's hand (EB04-054, OP13-108): `run.ts` `move` takes `what.owner`; `move` from `trash` of the opponent to the bottom of the owner's deck (OP15-091). `lifeToHand` cost with `topOrBottom` (OP14-103, ST29-007, EB04-060).

## 4. Open questions

- **Q1. EB03-014 Kuina: "Give up to 2 rested DON!! cards to your attribute Leader."** The data text has lost a word (probably an attribute name in angle brackets that a tag-stripping step removed). Proposed reading: a Leader with the named attribute; confirm against the printed card before scripting. The card is blocked on the text, not on the runtime.
- **Q2. OP15-102 Gan.Fall: "give this card in your hand 3 cost."** The sign is missing in the data text (OP15-013 Pincers and OP15-021 in the same set read "−2 cost" and "−3 cost"). Proposed reading: −3 cost, a discount that applies while you have a {Sky Island} Character with 7000 power or more.
- **Q3. EB03-006 Nami: "[On Play] You may give your active Leader 5000 power during this turn: Draw 1 card."** A cost that adds power to your own Leader is not a cost (EB04-023 reads "−5000 power" for the same pattern). Proposed reading: −5000 (the sign was lost). Likewise OP14-016 X.Drake ("give your Leader 2000 power ... instead") and OP13-017 Dragon ("give this Character 2000 power ... instead") have no sign; proposed +2000, a buff offered in place of the removal, which is a legal replacement payload.
- **Q4. OP15-003 Alvida, OP15-010 Nezumi, OP15-012 Buggy, OP15-017 Morgan, OP15-026 Jango: "Give up to 1 rested DON!! card to its owner's Leader or 1 of their Characters."** The source of the DON!! card is not stated (Nezumi and Buggy have no cost clause). Proposed reading: a rested DON!! card in the OPPONENT's cost area goes to that opponent's Leader or Character (the only reading in which "its owner's" is needed). OP15-023 Arlong, OP15-025 Kuro and OP15-028 Meowban say "from its owner's / your opponent's cost area" without "rested": proposed any DON!! card there, active or rested, chosen by you.
- **Q5. OP15-023 Arlong [On K.O.] "Up to 2 of your opponent's rested cards will not become active"; OP14-024 Kin'emon "Rest up to 1 of your opponent's cards"; EB03-012/EB03-061.** Does "cards" include DON!! cards? OPEN-QUESTIONS M4b-1 (E-Q3, Laboon) reads cards as including DON!! for rest. For `skipRefresh` the engine only models field cards; proposed: field cards only for "will not become active" (DON!! cards in the cost area are not targeted), unless an official Q&A says otherwise.
- **Q6. OP15-073 Yama "Play up to 1 [Heavenly Warriors] with a cost of 1 or up to 1 {Vassals} type Character card with a cost of 1"; EB03-010 Monet "reveal up to 1 Character card with 1000 power or less or up to 1 Event card".** Is it one card in total (either kind) or up to one of each? Proposed reading: ONE card total, drawn from either description (the card names no "and", unlike OP14-084 which says "and up to 1" and EB03-049 which says "and up to 1"). Script as one selector with an `any` filter and `upTo: 1`.
- **Q7. OP15-014 Bartolomeo, OP15-046 Sabo: "Activate up to 1 {Dressrosa} type Event ... from your hand"; EB03-031 Reiju: "activate the [Main] effect of up to 1 Event card with a cost of 7 or less in your trash".** Is the Event's play cost paid when an effect activates it from hand, and where does the Event go? Proposed reading: an effect-activated Event is activated without paying its cost (as "play" by an effect is free), it goes to the trash, and only its [Main] effect resolves; for the trash version only the [Main] effect resolves and the card stays in the trash (the text says "the [Main] effect", not the card). Need confirmation; this is why these three are listed as needing a design decision.
- **Q8. The same three cards: do they count as "activating an Event"?** Proposed reading: card activation from hand does count for `eventActivated` watchers (CR 8-5-4: a [Trigger] activation does not), the trash version does not (the card is not activated, only its effect). Needs confirmation.
- **Q9. EB03-003 Uta, EB03-007 Baccarat, EB03-039 Ulti ("no base effect"); EB04-052 Sanji ("base power becomes the same as your opponent's Leader"); EB04-010 Lulucia ("Set the power of up to 1 of your opponent's Characters to 0").** "No base effect": does a Character whose only text is a keyword or a [Trigger] count? Proposed: a card whose printed text has no effect other than keywords (e.g. Blocker only) and reminder text counts as having no base effect; confirm with the tournament rules. "Same as your opponent's Leader": power or base power? Proposed: base power (as the effect changes a base power). "Set the power to 0": proposed `setBasePower` 0 for this turn (a base-power effect on the power layer, so later buffs still add); an official ruling on whether later +power applies would change this.
- **Q10. OP14-021, OP14-027, OP14-028, OP14-032, OP14-035, OP14-119, OP14-070: "When this Character becomes rested".** Does resting by attacking or by blocking count (six of the seven are [Your Turn], so a block is excluded for them; an attack or a cost is the main case)? Proposed: every transition from active to rested counts (attack declaration, cost payment, effect), except by the refresh phase (which only untaps). OP14-070 "becomes rested by your opponent's Character's effect": only effects of an opponent's Character card.
- **Q11. OP14-045, OP14-049, OP14-056: "When a card is trashed from your hand by an effect".** Own effect only, or any effect (opponent's discard, own costs)? Proposed: any effect of either player (trash as an effect: `trashFromHand`, `trash the rest` do not apply since they are not from hand), costs excluded (a cost is not an effect), and once per trashed card or once per effect? Proposed once per effect resolution that trashed at least one card. Needs a Q&A.
- **Q12. OP14-060 Doflamingo Leader: "Change the attack target to the selected card."** Does the redirect give the opponent a new Block Step, and does the attacker's [When Attacking] fire again? Proposed reading: the battle continues with the new target at the Block Step (a Blocker may still be declared; the attacker keeps its attack declaration and [When Attacking] does not fire again). Needs a Q&A.
- **Q13. OP13-003 Roger: "1 DON!! card placed during your DON!! Phase is given to your Leader".** Is the given DON!! card active or rested, and does the Leader still get the 2 DON!! card normal count (the first player's 1 placement on turn 1)? Proposed: the DON!! card is placed, then given (so it is attached as a given DON!! card, with the usual rested-until-Refresh state), and with one placement (turn 1 of the first player) one is given.
- **Q14. OP13-028 Shanks "you cannot play cards from your hand during this turn".** The `cannotPlay` filter has no zone scope; effects that play from the trash are still allowed by the text. Proposed: extend the restriction with `from: 'hand'` (a `cannotPlay: { filter, from }`); until then a `cannotPlay` with an all-category filter over-restricts.
- **Q15. OP13-066 Silvers Rayleigh: "add up to 1 DON!! card from your DON!! deck and set it as active at the end of this turn."** Is the DON!! card added now and set active at the end of the turn, or added and activated at the end of the turn? Proposed: the add happens at the end of the turn and it is placed active (delayed `addDon` active), as for the "set up to 2 of your DON!! cards as active at the end of this turn" cards (OP13-024, OP13-038), where the setting is delayed.
- **Q16. OP13-046 Vista and EB04-044 Koby: replacement scope.** Koby: "this Character would be removed from the field" with no "by your opponent's effect": proposed any cause, including a K.O. in battle (a K.O. removes the card from the field). Vista: shared Once Per Turn across both events (see G16).
- **Q17. Text typos in the data: OP14-119 "a cost or 9 or less", OP14-120 "a Character 1ith a cost of 0", EB04-025 "places 1 card from your hand at the bottom of their deck".** None changes the reading (a cost of 9 or less; with; their hand). All 422 cards are `verified: false`, so the verification pass should fix the text first, then each script's `textHash`.
