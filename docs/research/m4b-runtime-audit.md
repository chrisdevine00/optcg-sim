# M4b wave 1: runtime audit of the 143 unscripted meta cards

Written 2026-11-16 by the wave-1 runtime agent. Inputs: the verified text in `cards/data/sets/*.json` (with `cards/overrides/<ID>.json`), `cards/src/dsl.ts`, `cards/src/dsl-validate.ts` (`IMPLEMENTED`), the M4a runtime (`engine/src/effects/`, `engine/src/ops/`), effect-dsl.md §4, §5.1, §6 and Appendix A. Nothing here scripts a card: wave 2 does that, from `cards/effects/` only, and may not touch `engine/`.

## 1. Result

- **143 cards audited, 34 gaps found, 34 closed in the runtime.** Every one of the 143 cards can be written with the shapes that `IMPLEMENTED` now lists; none is left unexpressible. 67 cards needed nothing new (they use shapes M4a already ran), 76 need at least one new shape.
- The M4a runtime ran only the shapes the 37 Rocks and Kaido scripts use. Its biggest hole was the **permanent layer**: `derive` had no permanent power, cost, base power, keyword grant or restriction (only Counter values in hand and attack-target locks). That one gap (G1 to G6) covers 29 of the 143 cards. The rest are individual timings, costs and actions.
- Hard cards were drafted as scratch scripts to check the shape set: `docs/research/m4b-drafts/hard-cards.json` (31 drafts, validated by `cards/test/m4b-drafts.test.ts`). Wave 2 starts from them.
- Each new shape has a planted test (a minimal script on a vanilla card, not one of the 143) in `engine/test/cards/m4b/`; each was checked to fail with its implementation reverted (DECISIONS 2026-11-16, "M4b wave 1").

## 2. How the permanent layer works (the design that closes G1 to G6)

A `permanent` ability is never stored as a modifier. `derive` asks `engine/src/effects/layers.ts` for the modifiers every live permanent effect produces, in five stages, and merges them with the stored ones (CR 8-1-3-3, 4-9-2; rulings D-3):

| Stage | Layer | Reads |
| --- | --- | --- |
| 1 | cost | modifiers only |
| 2 | base power (`setBasePower`, highest wins) | stage 1 |
| 3 | power | stages 1 to 2 |
| 4 | keyword grants | stages 1 to 3 |
| 5 | restrictions (cannot be removed, cannot attack, [Blocker] lock) | stages 1 to 4 |

A condition, target filter or amount that a stage evaluates sees only the stages below it, so "if there is a Character with a cost of 12 or more, this Character gains +3000 power" sees the +12 cost effects, "base power becomes 8000 for a Character with 4000 base power" sees the printed 4000, and nothing can read itself (no fixed-point iteration is needed). A source whose effects are negated (CR 8-2) produces nothing. A game with no card that has such a permanent skips the layer entirely, so the 37 existing scripts run exactly as before.

## 3. Card by card

"Gap" lists the new shapes (section 4); "none" means every shape the card needs was already implemented.

### Robin (OP09-062), 16 cards

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| OP09-062 | Nico Robin | Banish; [When Attacking] cost trash (hasTrigger); addDon rested | none |
| EB04-058 | Borsalino | Blocker; [On Play] if life; deckTop to Life | none |
| OP09-078 | Gum-Gum Giant | [Counter] cost DON!! -2 + trash; if leader type; power battle; draw | none |
| OP12-112 | Baby 5 | [Trigger] if leader multicolored; draw | none |
| OP16-117 | Black Hole | [Main] cost trash; negate; [Trigger] trash to hand | none |
| OP16-119 | Marshall.D.Teach | [On Play] lookAtTop to Life; [Trigger] negate, K.O. | G20 |
| OP17-102 | Charlotte Oven | [On K.O.] play from trash; [Trigger] play this card | G31 |
| OP17-106 | Charlotte Smoothie | [Your Turn] [On Play] cost rest DON!!; deckTop to Life; opponent trashes | none |
| OP17-107 | Charlotte Daifuku | [Trigger] play this card | G31 |
| OP17-109 | Charlotte Pudding | [On Play] cost trash, draw 3; [Trigger] lookAtTop | none |
| OP17-110 | Charlotte Perospero | [Your Turn] [On Play] play from hand; grant Rush | none |
| OP17-111 | Charlotte Mont-d'or | [On Play] cost reveal 2; K.O. up to 2 | none |
| OP17-112 | Charlotte Linlin | permanent base power; [On Play] draw, choose one (deckTop to Life / opponent Life to hand) | G3, G18 |
| OP17-113 | Streusen | [On Play] lookAtTop | none |
| OP17-114 | Sweet 3 Generals | [Your Turn] [On Play] cost rest DON!!; draw, deckTop to Life, power | none |
| ST34-003 | Charlotte Brulee | [On Play] lookAtTop | none |

### Luffy & Ace (ST30-001), 25 cards

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| ST30-001 | Luffy & Ace | permanent power (count of base power; opponent's turn; named cards) | G1 |
| EB02-017 | Nami | [On Play] lookAtTop | none |
| EB04-002 | Jewelry Bonney | [On Play] lookAtTop | none |
| OP01-016 | Nami | [On Play] lookAtTop | none |
| OP04-016 | Bad Manners Kick Course | [Counter] cost trash; power battle; [Trigger] power | none |
| OP06-017 | Meteor-Strike of Love | [Main]/[Counter] cost Life to hand; power | G13 |
| OP11-012 | Franky | [Your Turn] [Once Per Turn] when the opponent activates an Event; power to all Characters | G9 |
| OP12-015 | Monkey.D.Luffy | permanent power (given DON!!); [On Play] cost reveal 2 Events; play; give rested DON!! | G1, G25 |
| OP12-018 | Color of the Supreme King Haki | [Counter] power battle; may rest DON!!, if you do power | none |
| OP12-037 | Demon Aura Nine Sword Style Asura Blades Drawn Dead Man's Game | [Main] cost rest DON!!; rest Characters or DON!!; [Counter] power | G29 |
| OP13-040 | I Know You're Strong... So I'll Go All Out from the Very Start!!! | [Main] cost rest DON!!; skip Refresh; [Counter] power | G26 |
| OP14-019 | I Have a Plan to Take Down One of the Four Emperors!! | [Main] lookAtTop; [Trigger] draw | none |
| OP15-032 | Brook | [On Play] rest up to 1 of the opponent's cards (cards include DON!!, as E-Q3 reads Laboon: OPEN-QUESTIONS M4b-1); [Activate: Main] cost trash self; set active | G29 |
| OP17-017 | Ga Ha Ha Ha!! | [Counter] power battle then power this turn | none |
| ST21-014 | Monkey.D.Luffy | Rush; [When Attacking] give rested DON!! | G25 |
| ST21-017 | Gum-Gum Mole Pistol | [Main] power, if power then K.O.; [Trigger] activate [Main] | none |
| ST30-012 | Monkey.D.Luffy | [On Play] cost rest DON!!, grant Rush; [When Attacking] rest a Blocker | none |
| ST31-001 | Sanji | [DON!! x2] grant Rush; [On Play] draw, play | G4 |
| ST31-005 | Thousand Sunny | [On Play] lookAtTop; [Activate: Main] cost rest self; give rested DON!! to named card | G25 |
| OP12-006 | Shakuyaku | [On Play] lookAtTop | none |
| OP13-037 | Roronoa Zoro | [On Play] if leader type, set DON!! active; [End of Your Turn] set self active | none |
| OP14-031 | Nami | Blocker; [On Play] rest, delayed set DON!! active | none |
| EB02-021 | Gum-Gum Giant Pistol | [Main] power, then selected card skips Refresh; [Trigger] rest | G26 |
| OP01-055 | You Can Be My Samurai!! | [Main] cost rest 2 Characters; draw 2 | G16 |
| OP12-038 | Two-Sword Style Rashomon | [Main] cost rest DON!!; K.O. rested Characters by base cost; [Counter] power | none |

### Sabo (OP13-004), 19 cards

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| OP13-004 | Sabo | two permanents: power -1000 by Life; [DON!! x1] power to Leader and Characters | G1 |
| EB04-007 | Roronoa Zoro | [On Play] power until end of opponent's next End Phase; [Activate: Main] Once Per Turn grant [Rush: Character] | none |
| OP15-088 | Pirates Docking Six | permanent +6 cost; [On Play] cost trash 3 from deck top; play from trash | G2, G15, G31 |
| OP17-080 | Usopp | permanent power if a cost 12+ Character exists; [On Play] lookAtTop, trash the rest | G1, G20 |
| OP17-081 | Gerd | permanent +12 cost if leader type; [On Play] cost trash; trash to hand | G2 |
| OP17-082 | Sanji | permanent power; [On Play] draw 2, trash 2 | G1 |
| OP17-083 | Jinbe | permanent grant Blocker and power | G1, G4 |
| OP17-084 | Tony Tony.Chopper | [On Play] if exists, grant Unblockable | none |
| OP17-086 | Nami | [On Play] cost trash {Elbaph}; draw 2 | none |
| OP17-087 | Nico Robin | permanent power; [On Play] if exists, power -3000 | G1 |
| OP17-089 | Jaguar.D.Saul | permanent +12 cost; [On Play] lookAtTop, trash the rest | G2, G20 |
| OP17-093 | Monkey.D.Luffy | permanent grant Rush; [On Play] draw, play from trash | G4, G31 |
| OP17-095 | Roronoa Zoro | permanent power; replacement leaveField, place 3 from trash at deck bottom | G1, G17 |
| OP17-096 | I'm Luffy!! The Man Who Will Be King of the Pirates!! | [Counter] if exists, power battle; [Trigger] trash to hand | none |
| OP17-119 | Loki | permanent +12 cost; opponent's turn power; [On Play] K.O. by total cost | G1, G2 |
| ST01-011 | Brook | [On Play] give up to 2 rested DON!! | G25 |
| OP14-096 | Ground Death | [Main] cost rest DON!!; negate; [Counter] if trash count, power | none |
| OP15-092 | Monkey.D.Luffy | tiers on trash count: base power + cost, Leader base power on opponent's turn, power | G1, G2, G3, G6 |
| OP17-098 | Gum-Gum Kong Gun | [Main] cost rest 6 DON!!; if exists K.O. up to 2; [Counter] power | none |

### R/G Luffy (OP13-001), 11 cards

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| OP13-001 | Monkey.D.Luffy | [DON!! x1] [On Your Opponent's Attack]: may rest any number of DON!!; power per DON!! rested | G29 |
| OP05-038 | Charlestone | [Counter] power; may trash, if you do set 3 DON!! active; [Trigger] rest | none |
| OP13-027 | Sanji | [On Play] set DON!! active; [End of Your Turn] if leader type | none |
| OP13-118 | Monkey.D.Luffy | Double Attack; [On Play] if multicolored set DON!! active; cannot play Characters | G28 |
| OP14-022 | Usopp | [End of Your Turn] if leader type set DON!! active | none |
| OP15-035 | Laboon | replacement leaveField by base power; instead rest 2 of your cards | G16 |
| OP17-022 | Shanks | Rush; [On Play] set DON!! active; rest all opponent Characters | none |
| ST21-003 | Sanji | [On Play] select; if it attacks the opponent cannot activate [Blocker] | G27 |
| ST31-004 | Monkey.D.Luffy | permanent grant Rush by given DON!!; [On Play] for every SHC card, power -1000 | G4, G22 |
| OP08-036 | Electrical Luna | [Main] skip Refresh for all rested Characters; [Trigger] rest | G26 |
| OP17-023 | Nami | replacement ko, rest this Character instead | none |

### Purple Enel (OP15-058), 17 cards

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| OP15-058 | Enel | rules DON!! deck 6; [Activate: Main] Once Per Turn: addDon, give rested DON!! | G7, G25 |
| OP05-077 | Gamma Knife | [Main] cost DON!! -1; power; [Trigger] addDon | none |
| OP10-067 | Senor Pink | [On Play] cost DON!! -1; trash to hand; set DON!! active | none |
| OP12-071 | Charlotte Pudding | [On Play] lookAtTop | none |
| OP13-076 | Divine Departure | [Main] cost rest 5 DON!!; if given DON!!, power; [Counter] cost trash; power | none |
| OP15-061 | Ohm | [On Play] cost DON!! -1; draw; [When Attacking] if DON!! count, power | none |
| OP15-066 | Satori | [On Play] cost DON!! -1; draw; [When Attacking] scry | none |
| OP15-067 | Shura | permanent grant Rush by DON!! count; [On Play] cost DON!! -1; draw | G4 |
| OP15-071 | Holly | permanent grant Double Attack; opponent's turn base power 6000 | G3, G4 |
| OP15-074 | Varie | [Main] cost DON!! -1; if Leader is Enel draw, +2 cost until end of opponent's next End Phase; [Counter] power | G23 |
| OP15-075 | El Thor | [Main] cost DON!! -1; power; K.O.; [Counter] power | none |
| OP15-076 | Lightning Beast Kiten | [Main] cost DON!! -1; draw; power; [Counter] power | none |
| OP15-077 | Lightning Dragon | [Main] cost DON!! -1; draw; skip Refresh for a rested Character | G26 |
| OP15-118 | Enel | permanent cannot be removed by opponent's effects + power by DON!! count; [On Play] cost DON!! -1; lookAtTop, trash | G1, G5 |
| ST10-010 | Trafalgar Law | Blocker; [On Play] cost DON!! -1; opponent trashes 2 | none |
| OP09-072 | Franky | Blocker; [On Play] cost DON!! -2 + trash; draw 2 | none |
| OP07-064 | Sanji | permanent cost -3 in hand by DON!! counts; Blocker | G2 |

### Black Luffy (OP17-079), 5 cards

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| OP17-079 | Monkey.D.Luffy | permanent: Characters with cost 12+ gain Blocker | G4 |
| OP17-090 | Franky | permanent power; [On Play] if exists K.O. | G1 |
| OP17-094 | Rodo | permanent +12 cost if leader type | G2 |
| ST14-017 | Thousand Sunny | Stage: permanent +1 cost for black SHC Characters; [On Play] draw | G2 |
| OP17-091 | Brook | permanent power; [On Play] if exists opponent trashes | G1 |

### Hancock (OP14-041), 16 cards

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| OP14-041 | Boa Hancock | [Opponent's Turn] when you play a Character draw; [DON!! x1] Once Per Turn when a filtered Character is K.O.'d, opponent Life to hand | G8, G12, G18 |
| OP06-058 | Gravity Blade Raging Tiger | [Main] place 2 Characters at deck bottom; [Trigger] place 1 | none |
| OP06-106 | Kouzuki Hiyori | [On Play] cost Life top or bottom to hand; hand card to top of Life | G13, G18 |
| OP06-115 | You're the One Who Should Disappear. | [Counter] cost trash; power; [Trigger] if 0 Life, may deckTop to Life, trash | none |
| OP07-057 | Perfume Femur | [Main] select, power, if it attacks no Blocker; [Trigger] draw | G27 |
| OP11-054 | Nami | Blocker; [On Play] if multicolored draw 3, place 2 at top or bottom | G33 |
| OP14-104 | Gecko Moria | [On Play] select from trash, play it or add it to Life face-up; [Trigger] play from trash | G18, G31 |
| OP14-105 | Gorgon Sisters | [Activate: Main] cost reveal 3; give each of Leader and Characters a rested DON!!; [Trigger] play self | G25, G31 |
| OP14-107 | Shakuyaku | [On Play] if opponent Life; draw 2, trash 2; [Trigger] play self | G31 |
| OP14-108 | Silvers Rayleigh | [On Play] if multicolored and opponent Life, K.O.; [Trigger] activate [On Play] | G30 |
| OP14-112 | Boa Hancock | [On Play] if type: deckTop to Life, opponent Life to hand; [Trigger] play from hand | G18 |
| OP14-114 | Ran | [Activate: Main] Once Per Turn give rested DON!!; [Trigger] play self | G25, G31 |
| OP14-118 | You'll Frighten Me... ♡ | [Counter] if Life, cannot attack; [Trigger] play from hand | none |
| OP15-113 | Roronoa Zoro | [On Play] cost trash; deckTop to Life | none |
| OP16-113 | Boa Marigold | permanent grant Blocker by Life; [Trigger] play self | G4, G31 |
| ST17-004 | Boa Hancock | Blocker; [On Play] scry 3; give rested DON!! | G25 |

### Rosinante (OP12-061), 13 cards

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| OP12-061 | Donquixote Rosinante | replacement ko, Life to hand instead (Once Per Turn); [Activate: Main] next Law play costs 2 less | G13, G24 |
| EB04-038 | Rosinante & Law | rules also named; Blocker; [On Play] if DON!! counts: draw, addDon | G7 |
| OP10-114 | X.Drake | [Activate: Main] cost rest self; if Life counts, rest | none |
| OP12-115 | I Love You!! | [Counter] power; if Life, trash to hand | none |
| OP16-064 | Koby | [On Play] lookAtTop | none |
| OP16-065 | Sakazuki | [On Play] cost DON!! -1; power until end of opponent's next End Phase; [Activate: Main] cost rest DON!!; addDon | none |
| OP16-067 | Tsuru | [On Play] lookAtTop; trash 1 | none |
| OP16-077 | "Buddha" Sengoku | [Main] lookAtTop take up to 2; trash 1 | G20 |
| OP16-078 | Marineford | Stage: [On Play] lookAtTop; [Activate: Main] cost DON!! -1 + rest self; draw, trash | none |
| P-088 | Trafalgar Law | [Trigger] if leader type and both Life totals; play self | G31 |
| P-093 | Trafalgar Law | Blocker; [On Play] if DON!! counts addDon rested | none |
| OP12-108 | Donquixote Rosinante | [On Play] lookAtTop for a named card | none |
| OP17-059 | Aramaki | Blocker; [On Play] cost DON!! -1; draw; K.O. up to 2 | none |

### Yellow Enel (OP05-098), 7 cards

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| OP05-098 | Enel | [Opponent's Turn] [Once Per Turn] when your Life becomes 0: deckTop to Life, trash | G11 |
| EB02-052 | Enel | permanent grant Rush by leader type; [When Attacking] cost trash; if Life, deckTop to Life; power | G4 |
| OP11-106 | Zeus | [On Play] cost Life top or bottom to hand; K.O. | G13 |
| OP13-113 | Lilith | [On Play] lookAtTop; [Trigger] activate [On Play] | G30 |
| EB01-056 | Charlotte Flampe | [On Play] cost Life top or bottom to hand; draw | G13 |
| EB01-059 | Kingdom Come | [Main] K.O., trash Life until 1; [Trigger] K.O. by both Life | G19 |
| EB04-059 | Black Rope Dragon Twister | [Main] cost turn Life face-up; if fewer Characters, K.O. two; [Trigger] draw 2, trash | G14 |

### Kalgara (OP08-098), 14 cards

| Card | Name | Shapes needed | Gap |
| --- | --- | --- | --- |
| OP08-098 | Kalgara | [DON!! x1] [When Attacking] play by DON!! count; if you do, own Life to hand | G18, G32 |
| EB03-053 | Nami | [On Play] give rested DON!!; opponent Life to hand; [On K.O.] cost turn Life face-up; play | G14, G18, G25 |
| OP05-117 | Upper Yard | Stage: [On Play] lookAtTop | none |
| OP08-109 | Mont Blanc Noland | [On Play] if leader type and Kalgara exists: deckTop to Life | none |
| OP08-110 | Wyper | [On Play] lookAtTop; play [Upper Yard] | none |
| OP08-115 | The Earth Will Not Lose! | [Counter] power; play [Upper Yard]; [Trigger] draw, trash | none |
| OP12-099 | Kalgara | [Your Turn] when a Life card is removed: draw; cannot draw by effects | G10, G28 |
| OP15-101 | Kalgara | [On Play] cost trash; lookAtTop take up to a total of 2 | G20 |
| OP15-108 | Nami | [On Play] lookAtTop | none |
| OP15-112 | Raki | Blocker; [On Play] play from hand | none |
| OP15-114 | Wyper | [On Play] cost turn Life face-up; power all; K.O. power <= 0; [Activate: Main] give rested DON!! | G14, G25 |
| OP15-119 | Monkey.D.Luffy | permanent grant Rush by DON!!; when opponent activates Event or Blocker: reveal top Life, power by its cost | G4, G9, G21 |
| OP05-114 | El Thor | [Counter] power, bound card gains more; [Trigger] K.O. by Life | none |
| OP05-115 | Two-Hundred Million Volts Amaru | [Main] power; if Life, rest; [Trigger] cost trash 2; deckTop to Life | none |

## 4. Gap list, deduplicated

| Gap | Shape | Cards | Closed by |
| --- | --- | --- | --- |
| G1 | Permanent `power` (conditional; self, a selector, "your Leader and all your Characters"; turn, [DON!! xN], count and cost conditions) | ST30-001, OP12-015, OP13-004, OP17-080, OP17-082, OP17-083, OP17-087, OP17-095, OP17-119, OP15-092, OP15-118, OP17-090, OP17-091 | `effects/layers.ts`, `derive.ts` stages |
| G2 | Permanent `cost` (field cards, and "this card in your hand") | OP15-088, OP17-081, OP17-089, OP17-119, OP15-092, OP07-064, OP17-094, ST14-017 | `layers.ts` (field and hand zone) |
| G3 | Permanent `setBasePower` | OP17-112, OP15-092, OP15-071 | `layers.ts` |
| G4 | Permanent keyword `grant` (Rush, Blocker, Double Attack; to self or a selector) | ST31-001, OP17-083, OP17-093, ST31-004, OP15-067, OP15-071, OP17-079, OP16-113, EB02-052, OP15-119 | `layers.ts` |
| G5 | Permanent `restrict` cannotBeRemovedByOpponentEffects | OP15-118 | `layers.ts`; `flow.ts` `runKo`/`runRemove` read `Derived.removalProof` |
| G6 | Permanent `tiers` (cumulative thresholds) | OP15-092 | `layers.ts` `flatten` |
| G7 | `rules` clauses in a script: `alsoNamed` (alias-aware name filters) and `donDeckSize` | OP15-058, EB04-038 | `defs.ts` `toDef` (`Def.alsoNamed`), `eval.ts` `matches`; validator accepts `rules` |
| G8 | Timing `cardPlayed` | OP14-041 | `flow.ts` `runPlay` |
| G9 | Timings `eventActivated` and `blockerActivated` | OP11-012, OP15-119 | `flow.ts` `fireActor`; `actions.ts` block |
| G10 | Timing `lifeRemoved` | OP12-099 | `ops` `hooks.lifeRemoved`, `flow.ts` |
| G11 | Timing `lifeBecameZero` | OP05-098 | same hook |
| G12 | Timing `koed` (filter on the K.O.'d card) | OP14-041 | `flow.ts` `runKo` |
| G13 | Cost `lifeToHand` (top, top or bottom), also as a replacement payload | OP06-017, OP06-106, OP12-061, OP11-106, EB01-056 | `run.ts` `lifeToHandCost`; `eval.ts` `payable` |
| G14 | Cost `turnLifeFaceUp` | EB04-059, EB03-053, OP15-114 | `run.ts` `turnFaceUp` |
| G15 | Cost `mill` | OP15-088 | `run.ts` `payCost` |
| G16 | Cost `rest` (a selector: "rest 2 of your Characters", "rest 2 of your cards" with DON!!) | OP01-055, OP15-035 | `run.ts` `selectRest` |
| G17 | Cost `move` ("place 3 cards from your trash at the bottom of your deck instead") | OP17-095 | `run.ts` `placeCards` |
| G18 | Life moves: the top Life card to a hand (own or opponent's), a hand card to the top of Life, a trash card to the top of Life face-up | OP17-112, OP14-041, OP06-106, OP14-104, OP14-112, OP08-098, EB03-053 | `run.ts` `move` |
| G19 | Action `trashLifeUntil` | EB01-059 | `run.ts` `action` |
| G20 | `lookAtTop`: `to: lifeTop`, `rest: trash`, more than one card taken | OP16-119, OP17-080, OP17-089, OP16-077, OP15-101 | `run.ts` `lookAtTop` |
| G21 | `reveal` from `lifeTop` | OP15-119 | `run.ts` `action` |
| G22 | Step `forEach` | ST31-004 | `compile.ts` `fe`/`feEnd`; `run.ts` |
| G23 | Action `cost` | OP15-074 | `run.ts` `action` |
| G24 | Action `playCost` (one-shot) | OP12-061 | `run.ts`; `eval.ts` `playCostOf`; `flow.ts` |
| G25 | Action `giveDon` (rested DON!! to a Leader or Character; `each`) | OP12-015, ST21-014, ST31-005, ST01-011, OP15-058, OP14-105, OP14-114, ST17-004, EB03-053, OP15-114 | `run.ts` `giveDon` |
| G26 | Action `skipRefresh` | OP13-040, EB02-021, OP08-036, OP15-077 | `run.ts`; `ops` `untapAll`; `flow.ts` Refresh |
| G27 | Restriction `cannotActivateBlockerAgainstIt` | ST21-003, OP07-057 | `derive.ts` `noBlocker`; `actions.ts` |
| G28 | Restrictions on a player: `cannotDrawByOwnEffects`, `cannotPlay` | OP13-118, OP12-099 | Leader modifiers; `eval.ts` `cannotDrawByEffect`, `playBlocked` |
| G29 | `rest` of DON!! and of cards mixed ("Characters or DON!! cards"), `pick: any`, and a DON!! count bound for `refCount` ("for every DON!! rested this way") | OP12-037, OP15-032, OP13-001 | `run.ts` `selectRest`; `Ctx.n` |
| G30 | Action `activate` of the card's own [On Play] | OP14-108, OP13-113 | `run.ts` `activate` |
| G31 | `play` from the trash and from `self` ([Trigger] "Play this card"), and `rested` | OP17-102, OP17-107, OP15-088, OP17-093, OP14-104, OP14-105, OP14-107, OP14-114, OP16-113, P-088 | `run.ts` `play`; validator zones |
| G32 | "If you do" after a plain action (a `label` on a `do` step) | OP08-098 | `compile.ts`, `run.ts` `acted` |
| G33 | `move` to the deck with `position: topOrBottom` | OP11-054 | `run.ts` `move` |
| G34 | Conditions on an [Activate: Main] are enforced | (no meta card; added while closing a neighbour) | `actions.ts` |

## 5. Shapes the 143 cards use that were already implemented

Timings onPlay, whenAttacking, onOpponentAttack, onKO, endOfYourTurn; costs donMinus, restDon, trash, reveal, restSelf, trashSelf; steps do, if, may, ifDid, chooseOne, delayed; actions draw, trashFromHand, lookAtTop (hand), move (hand/trash/field to hand/trash/deck, deck top to Life), play from hand, ko, rest (field), setActive (field, DON!!), power, setBasePower, addDon, grant, negate, restrict (cannotAttack), activate [Main], select; picks upTo, exactly, `totalCost`; the counter-in-hand and attack-lock permanents; replacements on `ko` and `leaveField`; every condition, number and filter form. They were run by the 37 scripts and their tests in M4a.

## 6. Shapes left unimplemented because no meta card needs them

`draw up to`, pick `groups` (EB04-059 is written with two `select`s and `not: { ref }`, see the draft: that is also the correct simultaneous choice), `lki` (OP14-041 reads the K.O.'d card as it is in the trash: printed values, see OPEN-QUESTIONS M4b-2), `lookAtTop` of the opponent's deck, `rest: topAnyOrder`, `rules.anyNumberInDeck` and `deckRestriction`, the `mill` action (the cost is implemented), `playCost` as a permanent, `cannotPlay` as a permanent, a `lifeTopOrBottom` selector outside the cost, moves of Life cards to the deck or trash other than `trashLifeUntil`, and cards placed at the deck bottom in a chosen order (see DECISIONS 2026-11-16: the order is the order picked). `validateScript` rejects each of them, so a script never silently does nothing.

## 7. Notes for wave 2

- **Optional costs.** Events worded "You may <cost>:" use `costOptional: true`; non-Event activations and autos do not (DECISIONS 2026-11-09, B-1). A cost that is only DON!! -X is always optional on an Event.
- **"Then" after an "if".** Per effect-dsl §4.10 a clause after a failed "if" is skipped: put "Then" clauses inside `then` when the CR reading requires it. Several cards are ambiguous (OP09-078 "...gains +4000 power during this battle. Then, draw 2 cards"; OP15-074; EB02-052). Record the reading in the script's `rulings`.
- **"If you do" after a plain action** (OP08-098): put `label` on the `do` step and `ifDid` after it; the label is recorded only when the action did something. After a "you may" step use `may` as before.
- **A choice of two or more targets simultaneously** (EB04-059): two `select`s, the second with `{ not: { ref } }`, then the K.O.s; see the draft.
- **Permanent conditions on the other turn.** A permanent's `conditions` are read on every derive: `opponentsTurn`, `yourTurn` and `donGiven` work as written.
- **DON!!-count conditions** use `donOnField` (cost area plus given), as the rules digest defines the field.
- **Triggers with "Play this card"** use `{ play: { what: { from: 'self', owner: 'you' } } }`, with the condition as an `if` step.
- **Draw restrictions** (OP12-099) stop only the player's own effect draws; the Draw Phase is not an effect.

