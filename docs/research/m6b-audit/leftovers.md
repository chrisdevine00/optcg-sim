# M6b leftovers: audit of the 73 cards still unscripted in blocks 3 to 5

Runbook `docs/runbooks/new-set.md` step b, run 2026-11-25 on `main` b8f934e (engine waves 1 to 7 and G68 built, ENGINE_VERSION 0.5.17). Method of `docs/research/m6b-runtime-audit.md`: each card's verified text (`cards/data/sets/<SET>.json` merged with `cards/overrides/<ID>.json`) was read against `cards/src/dsl.ts`, `IMPLEMENTED` and the validator in `cards/src/dsl-validate.ts`, the wave write-ups (`m6b-wave1.md` to `m6b-wave7.md`) and the scripts already on `main`. To test "every shape built" beyond reading, each card that looked expressible was **drafted as a scratch script** and run through `validateScript` (60 drafts, all structurally valid; the drafts were deleted and nothing under `cards/` or `engine/` changed). A draft proves the shapes exist and are accepted, not that the runtime plays them right: the planted wave tests do that, and the card's own tests will. Two drafts (OP11-088, ST28-004) are knowingly incomplete: they are the gap cards below.

## Result

| Class | Cards | Meaning |
| --- | --- | --- |
| **ready** | **48** | verified, every shape built, no design item. 3 in block 4, 45 in block 3, none in block 5 |
| **needs verification** | **11** | not verified; waits on the owner's official-list read (EB-05-V1, B4-V1/V2/V3/V4/V5/V7, B3-V1/V2/V3/V4). Every one is expressible once read |
| **design item** | **11** | D1 (3), D2 (4), D5 (1), D7 (1), D8 (1), D9 (1). None is built; none has a final decision (see the register below) |
| **missing gap** | **3** | shapes no wave built: G69 (ST33-004), G70 (ST28-004), G71 (OP11-088) |
| Total | **73** | block 5: 3, block 4: 14, block 3: 56 |

By block: block 5 = 1 verification (EB05-031) + 1 design (OP16-079) + 1 gap (ST33-004). Block 4 (14) = 3 ready + 5 verification + 6 design. Block 3 (56) = 45 ready + 5 verification + 4 design + 2 gaps.

**Why most of them were never scripted.** Three separate causes, none of them a held gap:

1. **The five starter decks ST-22, ST-23, ST-24, ST-25, ST-28 (31 cards: 11 + 5 + 5 + 5 + 5) had no cited block when the audit ran** (cited 2026-11-24, DECISIONS "Blocks cited for EB-05 and nine starter decks"), so the 1,175-card audit and its block 3 batches never saw them. STATUS says "never in the block 3 wave lists"; the audit tables confirm it (no ST22 to ST25 or ST28 row in `block3.md`). All of them are verified and need nothing new but ST28-004.
2. **Cards in the numbering gaps of the batch lists.** The block 3/4 group lists (`docs/research/OP-09-scripting-g1.md` to `OP-15-scripting-g3.md`) each name their cards and none names these; no group or skip note says "held". Every card here whose audit gap is `B3-G2`/`B4-G30` (G6, K.O. protection by cause) or `B3-G3`/`B4-G5` (G3, `attribute` filter) was left, in OP-09 to OP-12 and EB-03/OP-13: OP09-033, 045, 086, OP10-070, 104, OP11-006, 046, 088, OP12-021, 024, 027, 028, 034, EB03-018, OP13-025. Both gaps were built in wave 1 (2026-11-24, `m6b-wave1.md`), whose write-up lists no "cards now expressible" (it says "No real card was scripted"), and the later per-wave scripting batches (`wave3-scripting.md` onward) took only the cards named in waves 3 to 7. Same story for cards that waited on a later single gap and were named in a wave list but not taken: EB02-030 (D6, `m6b-wave4.md` "EB-02: EB02-030 (D6)"), OP09-086 and EB04-048 (G23, `m6b-wave3.md`), OP15-099 (G8/G68, `m6b-wave7.md`). This is an accounting miss, not a reason to hold the cards.
3. **Held on purpose:** unverified (11), design item (11), missing shape (3).

## Format and block check (ST-22 to ST-25 and ST-28)

`cards/format/standard.json` gives ST-22, ST-23, ST-24, ST-25 and ST-28 `block: 3, basis: "printed"` with the source "Block 3 shown on the Limitless card page for ST2x-001 (read 2026-11-24; M6b runbook step a). **No official page for this product was read.**" The file's `gaps` list adds that "every printing of a product is assumed to carry the product block". So the block is **cited to a third-party page (Limitless), one card per product, not to the official card list or an announcement**, which is the weaker end of ADR 0011 (a printed icon or an official page). It is plausible (these decks ship in the OP-09 to OP-12 window, Standard allows blocks 2 to 5, and the per-card data says `block: 3`, legality `legal`), and I did not read the official page either, so I cannot upgrade it: **the owner should confirm the block icon of ST-22/23/24/25/28 (and ST-33 and EB-05, same weak citation) on the official card list in the same sitting as the verification reads below.** If any of them turned out not to be block 3 the 31 cards would drop out of Standard, not change their scripts. ST-15 (official series page 569302), EB-02, EB-03, EB-04, OP-09 to OP-16 and PRB-02 have printed-icon citations from the official series pages.

## Card table

Weights are `coverage-report.json` backlog `weight`. "Built" cites the unified gap IDs of `m6b-runtime-audit.md` §2. Blocker, Double Attack and other printed keywords go in the script's `keywords` and the override already has them. Note on `costOptional`: only an Event's cost is wrapped in it (wave 7 scripting note); a character's activate cost is optional by being activated.

### Block 5 (3)

| Card | Name | Class | Shapes, gap or reason | Why not scripted before |
| --- | --- | --- | --- | --- |
| EB05-031 | Vinsmoke Reiju | needs verification: EB-05-V1 (cost 5 or 4) | [On Play] `donMinus` cost, effect `if` Leader type then `mill` 10 (G4); [Activate: Main] `trashSelf` cost, `if` opponent has a Character `basePower >= 8000`, `addDon` up to 4 active. All built; the cost does not change the script | Left out of the EB-05 batch on purpose (`docs/reviews/m6b-EB-05.md`: "EB05-031 and EB05-052 intentionally absent"); the official page was not reachable on 2026-11-24 |
| OP16-079 | Yamato (Leader, w19) | design item D9 | `cardPlayed` with `from: 'trash'` is built (G25); "that Character gains [Rush]" needs the event's subject; `Selector.lki: 'subject'` exists in `dsl.ts` and the validator says "lki is not implemented in the runtime yet". Open: M6b-Q11 (does it cover every play from the trash) | `m6b-wave3.md` Deferred: "D9, not built" |
| ST33-004 | Borsalino (w61) | **missing gap G69** | Hand-zone permanent `cost -3` on this card, "during the turn in which a card in your hand is trashed by an effect". Needs a per-turn history condition `{ handTrashedThisTurn }`; `koedThisTurn` and `eventsActivatedThisTurn` (G26) are the only histories and G22's `trashedFromHand` is a timing, not a condition. Rest of the card is a Blocker keyword | Left stats-only by `ST-block5-scripting-g2.md` ("not scriptable today; a script with the cost always applied or never applied would be wrong"); ST-33 was cited after the audit, so it is in no audit row |

### Block 4 (14)

| Card | Name | Class | Shapes, gap or reason | Why not scripted before |
| --- | --- | --- | --- | --- |
| EB03-018 | Tashigi (w8) | **ready** | [Opponent's Turn] permanent: `cannotBeKOd { cause: 'opponentEffect' }` (G6) and `grant Blocker`; [End of Your Turn] auto, cost `restDon 1` + `trash` 1 from hand, `setActive` self | Audit B4-G30 (G6, wave 1); absent from `EB-03-scripting-g1/g2` lists, no skip note |
| EB03-031 | Vinsmoke Reiju (w6) | design item D2 | [Your Turn] [On Play] `donMinus 1`, if Leader is [Sanji], "activate the [Main] effect of an Event with cost 7 or less **in your trash**" (the card stays). `Action.activate` takes `of: 'self'` only; the validator refuses a selector | D2, open (M6b-Q27/Q28); audit B4-G20 |
| EB03-034 | Charlotte Linlin (w4) | needs verification: B4-V5 (type {Big Mom Pirates} or {Rocks Pirates}) | [On Play] `draw`, `move` 1 hand card to deck top, `addDon` 1 active; [On K.O.] `donMinus 1`, `move` up to 1 from `deckTop` to Life top. All built (a draft validates). The type matters to other cards' filters, not to this script | `EB-03-scripting-g2.md`: "unverified, B4-V5, as briefed" |
| EB04-048 | Rob Lucci | needs verification: B4-V1 (cost "-2" or "+2" per 5 cards in the trash) | Permanent, Leader `typeIncludes CP`: `power` +1000 and `cost` -2 per `div(trash, 5)` (G23); [On Play] cost `trash` own Character (G1), `draw 1`. The sign is the only difference between readings | `EB-04-scripting-g1/g2.md`: "unverified (B4-V1), skipped" |
| OP13-003 | Gol.D.Roger (Leader) | design item D1 | "1 DON!! card placed during your DON!! Phase is given to your Leader": a DON!!-Phase redirect (rules layer); the second paragraph (`-2000` power while 9 or fewer DON!!) is easy. M6b-Q32 open | D1 stays stats-only (BACKLOG §3; DECISIONS "M6b-1 decisions") |
| OP13-025 | Koby | **ready** | Blocker keyword; [On Play] `if` Leader `type FILM` or `attribute Strike` (G3), `setActive` up to 1 DON!! | Audit B4-G5 (G3, wave 1); absent from the OP-13 group lists |
| OP13-079 | Imu (Leader, w8) | design item D1 | `rules: deckRestriction` (no Events cost 2+) is built (G12), but "at the start of the game, play up to 1 [Mary Geoise] Stage **from your deck**" is not: `startOfGame` timing exists, `play` from the whole deck does not. The [Activate: Main] trash-cost-then-draw is built (G1) | D1 stays stats-only; `OP-13-scripting-g3.md` "skipped as instructed" |
| OP13-084 | St. Shepherd Ju Peter (w32) | needs verification: B4-V2 (the second ability differs between sources) | Permanent `cannotBeRemovedByOpponentEffects` with trash `>= 7`; then either [On Play] `lookAtTop` 5 take `type Five Elders` (G31 family), or "[Your Turn] if 10+ trash, set base power of your {Five Elders} to 7000" (`setBasePower` permanent). Both built | `OP-13-scripting-g3.md`: "skipped, unverified, B4-V2" |
| OP14-094 | Mr.5(Gem) (w13) | needs verification: B4-V3 (attribute Strike or Special) | Blocker; [On Play] `if` any Character (either side) has `cost 0` or `cost >= 8` then `draw 2`, `trashFromHand` 1. Built. M6b-Q90 | `OP-14-scripting-g4.md`: "skipped as unverified, B4-V3" |
| OP14-103 | Gloriosa (w66) | needs verification: B4-V7 (printed name "Gloriosa" or "Gloriosa (Grandma Nyon)") | [On Play] cost `lifeToHand` top-or-bottom, `move` up to 1 hand card to Life top; [Trigger] play this card. Built (like EB05-052). The name question needs a validator decision (`validate.ts` rejects a trailing "(...)"), not a gap | `OP-14-scripting-g4.md`: "skipped, B4-V7" |
| OP15-014 | Bartolomeo | design item D2 | Replacement "K.O.'d: may trash 1 Event from your hand instead" is built (G11); [On Play] "activate up to 1 {Dressrosa} Event with base cost 3 or less **from your hand**" is D2 | D2, open (Q27/Q28) |
| OP15-022 | Brook (Leader, w1) | design item D1 | "You do not lose when your deck has 0 cards; you lose at the end of the turn": a rule flag (RL-26, QA-OP15 settle the meaning); `mill` 4 and the conditional `setActive` are built | D1 stays stats-only |
| OP15-046 | Sabo (w8) | design item D2 | Blocker; [On Play] `if` Leader `type Dressrosa`, "activate up to 1 {Dressrosa} Event from your hand" | D2, open |
| OP15-099 | Urouge | **ready** | [On Play] cost `trash` 1 {Supernovas} card, `grant Rush` self this turn; [Activate: Main] cost `turnLifeFaceDown 1` (G8; "from the top"), `giveDon` 1 rested to Leader or a Character | Audit B4-G13 (Life face state, G8 wave 1); `m6b-wave7.md` notes the measure now reads its cost as implemented, but no scripting group took it |

### Block 3 (56)

| Card | Name | Class | Shapes, gap or reason | Why not scripted before |
| --- | --- | --- | --- | --- |
| EB02-030 | And That's When Somebody Makes Fun of Their Friend's Dream!!!! (w161) | **ready** | [Counter] `addReplacement { replaces: { ko: your Characters, cause: 'battle' }, optional, instead: trash 1 hand, duration thisTurn }` (D6, wave 4 + G11); [Trigger] `draw 1`. M6b-Q54 (offered every time that turn) is the lead's reading. Heaviest card of the 73 | Held as D6 until wave 4 (2026-11-24); `m6b-wave4.md` lists it as expressible, no scripting batch took it |
| OP09-033 | Nico Robin | **ready** | [On Play] `if` count of your rested Characters `>= 2` then timed `restrict` `cannotBeKOd { cause: 'effect' }` on all your {ODYSSEY} or {Straw Hat Crew} Characters until the end of the opponent's next turn (G6) | B3-G2 (G6); not on an OP-09 group list |
| OP09-045 | Cabaji (w8) | **ready** | Permanent `cannotBeKOd { cause: 'battle' }` while you have a [Buggy] or [Mohji] Character (G6) | same |
| OP09-081 | Marshall.D.Teach (Leader, w14) | design item D5 | "Your [On Play] effects are negated" / the opponent's until their next turn: whole-side negation; `negate` is per card (G66 is a permanent per-card negate). Open: [Trigger] [On Play] and `activate onPlay` | D5 stays stats-only (BACKLOG §3) |
| OP09-086 | Jesus Burgess (w86) | **ready** | `cannotBeKOd { cause: 'opponentEffect' }` (G6); Leader `type Blackbeard Pirates` permanent `power` +1000 per `div(trash, 4)` (G23) | `m6b-wave3.md` names it under G23; the wave 3 batch (13 cards) did not take it |
| OP10-010 | Chadros.Higelyges | needs verification: B3-V1 (name "(Brownbeard)" suffix; the validator rejects it) | [When Attacking] `if` count of your Characters `power >= 6000` is `<= 1`, `power` +1000 self. Built | not verified (B3-V1) |
| OP10-064 | Clone Soldier | needs verification: B3-V2 (types) | Keyword-only (Blocker): needs the verified override with `keywords: ['Blocker']`, no script ability. Built | not verified (B3-V2) |
| OP10-070 | Trebol | **ready** | Blocker; [On Play] timed `cannotBeKOd { opponentEffect }` on all your Characters `basePower <= 1000` until the end of the opponent's next turn (G6) | B3-G2; not on an OP-10 group list |
| OP10-104 | Caribou | **ready** | `[DON!! x1]` (`donGiven 1`) and Leader `type Supernovas` and opponent Life `>= 3`: `cannotBeKOd { battle }` (G6) | B3-G2 |
| OP11-006 | Zephyr | **ready** | `[DON!! x1] [When Attacking]` `power -5000` on up to 1 opponent Character `attribute Special` (G3); the lost sign and `<Special>` are fixed in the override | B3-G3 (G3); not on an OP-11 group list |
| OP11-023 | Arlong | **ready** | Hand-zone permanent `cost -3` when Leader `type Fish-Man`, Life `<= 3`, opponent has 5+ rested cards (count of the opponent's rested field cards plus rested DON!!, the M6b-Q25 reading as `OP12-118` and `ST16-003`); [Trigger] `rest` up to 1 opponent Character `cost <= 4` | Audit held it for the lost sign (M6b-Q2, B3-Q1); the override fixed the sign on 2026-11-24, no group took it |
| OP11-031 | Jinbe | needs verification: B3-V3 (types) | [On Play] `if` Leader {Fish-Man} or {Merfolk} then `rest` up to 1 opponent Character `cost <= 5`; [Activate: Main] Once Per Turn `grant [Rush: Character]` to up to 1 of your {Fish-Man} or {Merfolk} Characters this turn. Built | not verified (B3-V3) |
| OP11-046 | Vinsmoke Yonji | **ready** | Blocker; permanent while `none` of your Characters lacks a type including "GERMA" (Yonji himself is GERMA, so never vacuous: M6b-Q21 does not apply): `cannotBeKOd { opponentEffect }` and `cannotBeRested { by: 'opponentEffect' }` (G6, G2) | B3-G2, B3-G13; not on a group list |
| OP11-088 | Shu | **missing gap G71** | Blocker; [Once Per Turn] "when your opponent's **Character** attacks. If **that Character** has <Slash>, +5000 power during this battle": needs a condition on the attacking card. No `Selector` or `Condition` names the attacker (`eval.ts` never reads the battle); the audit tagged it B3-G3 only, and an `exists` over the opponent's rested Slash Characters is not "that Character" | Audit row says B3-G3; the attacker reference was missed there |
| OP12-020 | Roronoa Zoro (Leader, w3) | design item D7 | "If this Leader battles your opponent's Character during this turn, set it as active": a watcher registered by an Activate (`delayed` has `endOfThisTurn` only). The `cannotAttackTarget` half is built (G47) | D7 stays stats-only (BACKLOG §3) |
| OP12-021 | Ipponmatsu | **ready** | Blocker; permanent when Leader `attribute Slash` (G3) and `donOnField` rested `>= 6`: `cannotBeRested { by: 'opponentEffect' }` (G2) | B3-G3, B3-G13 |
| OP12-024 | Gyukimaru | **ready** | Permanent `cannotBeKOd { opponentEffect }` while `self` is active (G6); [When Attacking] `if` `donGiven` (you, total) `>= 3`, `rest` up to 1 opponent Character `baseCost <= 6` | B3-G2 |
| OP12-027 | Koushirou | **ready** | Blocker; replacement `ko` of your other `attribute Slash` Characters `cost <= 5` (`isSelf: false`), `cause: 'opponentEffect'`, optional, payload `restSelf` (G11) | B3-G3, B3-G4; the sibling OP12-102 was scripted |
| OP12-028 | Kouzuki Hiyori (w12) | **ready** | [Activate: Main] cost `restDon 1` + `restSelf`; `if` Leader named [Roronoa Zoro]: `lookAtTop` 5, take up to 1 `attribute Slash` or green Event, rest to the bottom in any order (G3) | B3-G3 |
| OP12-034 | Perona (w107) | **ready** | [On Play] `if` Leader `attribute Slash`: the same `lookAtTop` | B3-G3 |
| OP12-041 | Sanji (Leader, w2) | design item D2 | [Activate: Main] `donMinus 1`: "activate a 'Straw Hat Crew' Event with base cost 3 or less from your hand"; the [When Attacking] DON!! add is built | D2, open |
| OP12-101 | Jewelry Bonney | **ready** | [Activate: Main] cost `restSelf`: your {Supernovas} Leader `power` +1000 until the end of the opponent's next turn; [Trigger] `if` Leader {Supernovas}, `play` this card. The [Trigger] text was added by the override (the data had none) | audit "none"; no group took it |
| PRB02-005 | Monkey.D.Luffy (w16) | design item D8 | "[Your Turn] [On Play] if Leader multicolored and the opponent has 7 or fewer DON!!, they rest 1 active DON!! at the start of their next Main Phase": `delayed` has one timing | D8, open (recommendation A, wave 8) |
| PRB02-017 | Boa Hancock (w7) | needs verification: B4-V4 / M6b-Q3 (timing header [Once Per Turn] vs [On Play]) | cost `trash` 1 card with `hasTrigger`; `restrict cannotAttack` on the opponent's rested Leader and on up to 1 opponent Character other than [Monkey.D.Luffy] until the end of the opponent's next turn; [Trigger] `ko` up to 1 `cost <= 4`. Built | `PRB-02-ST15-17-scripting.md`: "timing header missing, Q3" |
| ST15-005 | Portgas.D.Ace (w2) | needs verification: B3-V4 (counter none or 1000, plus the lost sign and layout) | Permanent `grant Rush` when Leader `typeIncludes Whitebeard Pirates`; [Once Per Turn] replacement `leaveField` by the opponent's effect (G14) with an effect payload `power +2000` this turn. Built | `PRB-02-ST15-17-scripting.md`: not on the list; B3-V4 |
| ST22-001 | Ace & Newgate (Leader) | **ready** | [Activate: Main] Once Per Turn, cost `reveal` 1 `typeIncludes Whitebeard Pirates` from hand (named); `draw 1`, then `move` the named card from hand to the deck top. No existing script reads a cost-named card in the effect; `run.ts` stores a selector's name for costs and effects alike and the validator accepts it, so the card's own test is the check | ST-22: no block when audited; Leader of the weighted Whitebeard decks (`m6b-ST-block5.md` drew from it) |
| ST22-002 | Izo (w17) | **ready** | [On Play] `lookAtTop` 5 take up to 1 `typeIncludes Whitebeard Pirates` not named [Izo], rest bottom; [On Your Opponent's Attack] cost `trashSelf`: `draw 1`, `move` 1 hand card to the deck bottom | ST-22 (no block when audited) |
| ST22-003 | Edward.Newgate | **ready** | Double Attack; [On Play] `reveal` deckTop 1, `if` it `typeIncludes Whitebeard Pirates` then `draw 2` | same |
| ST22-005 | Kouzuki Oden | **ready** | Replacement `leaveField` by the opponent's effect, payload `trash` 2 from hand (G14); [Activate: Main] Once Per Turn, cost `restDon 3` + `move` another own Character to hand (G1), `setActive` self | same |
| ST22-006 | Jozu | **ready** | [On Play] `reveal` deckTop, `if` Whitebeard: `draw 2`, `trashFromHand` 1 | same |
| ST22-007 | Squard | **ready** | [Activate: Main] Once Per Turn: `reveal` deckTop, `if` Whitebeard: `giveDon` 1 rested to Leader or a Character | same |
| ST22-011 | Whitey Bay | **ready** | [Your Turn] [On Play] cost `reveal` 2 `typeIncludes Whitebeard Pirates` from hand: up to 1 Leader `typeIncludes` same gains +2000 this turn. Verified from Limitless (cost clause dropped upstream; DECISIONS 2026-11-24 "Open decisions" settled it) | same |
| ST22-012 | Marco | **ready** | [Once Per Turn] replacement `ko` self by the opponent's effect, payload `trash` 1 hand (G11); [When Attacking] `reveal` deckTop, `if` Whitebeard: `power` +1000 until the end of the opponent's next turn | same |
| ST22-015 | I Am Whitebeard!! (w29) | **ready** | [Main] `if` Leader Whitebeard: `play` up to 1 [Edward.Newgate] from hand; then `may` `move` 1 of the top or bottom Life card to hand (G45), `ifDid` Leader +2000 until the end of the opponent's next turn | same |
| ST22-016 | Take That Back!! Take Back What You Said!! | **ready** | [Counter] `reveal` deckTop, `if` Whitebeard: up to 1 Leader or Character `power` +4000 this battle; [Trigger] `draw 1` | same |
| ST22-017 | Fire Fist | **ready** | [Main] cost `reveal` 2 Whitebeard cards from hand (`costOptional`): `draw 1`, then `move` up to 1 Character (either side) `cost <= 5` to its owner's deck bottom; [Trigger] `move` up to 1 Character `cost <= 3` to its owner's hand | same |
| ST23-001 | Uta (w129) | **ready** | Blocker; hand-zone permanent `cost -4` while you have a Character `power >= 10000` | ST-23 (no block when audited) |
| ST23-002 | Shanks | **ready** | Hand-zone `cost -3` while the opponent has a Character `basePower >= 8000`; [On Play] `if` Leader {Red-Haired Pirates} or named [Uta]: Leader +2000 until the end of the opponent's next End Phase | same |
| ST23-003 | Benn.Beckman | **ready** | [On Play] cost `trash` 1: `if` Leader {Red-Haired Pirates}, `ko` up to 1 opponent Character `basePower <= 4000` | same |
| ST23-004 | Monkey.D.Luffy | **ready** | [Activate: Main] cost `restDon 1` + `restSelf`: up to 1 opponent Character `power -1000` this turn | same |
| ST23-005 | Yasopp | **ready** | [Activate: Main] Once Per Turn: `giveDon` 1 rested to Leader or a Character | same |
| ST24-001 | Capone"Gang"Bege | **ready** | Blocker; [On Play] `if` you have 6+ rested cards (rested field cards plus rested DON!!, M6b-Q25 as OP12-118): `draw 1`, `trashFromHand` 1 | ST-24 (no block when audited) |
| ST24-002 | Kid & Killer (w77) | **ready** | [On Play] `lookAtTop` 5 take up to 1 {Supernovas}, rest bottom; [On Your Opponent's Attack] cost `trashSelf`: `setActive` up to 1 DON!! | same |
| ST24-003 | Basil Hawkins | **ready** | [End of Your Turn] `setActive` up to 1 DON!! | same |
| ST24-004 | Law & Bepo | **ready** | [On Play] `rest` up to 1 opponent Character and `skipRefresh` it (G48 family, `ref`); then `if` the opponent has 2+ rested Characters, Leader +2000 until the end of the opponent's next End Phase | same |
| ST24-005 | X.Drake | **ready** | [On Play] `if` Leader {Supernovas}: `rest` up to 1 opponent Character `cost <= 5`; `delayed endOfThisTurn` `setActive` 1 DON!! inside the same `if` ("Then" after a failed "If" does not resolve, M4b-5) | same |
| ST25-001 | Alvida (w147) | **ready** | Permanent `cost +1` while you have 2+ Characters `baseCost >= 5`; [On Play] `if` Leader named [Buggy]: `draw 3`, `trashFromHand` 2 | ST-25 (no block when audited) |
| ST25-002 | Cabaji (w164) | **ready** | Permanent (2+ Characters `baseCost >= 5`): `grant Blocker` and `cost +1`; [Opponent's Turn] `power` +5000 | same |
| ST25-003 | Crocodile & Mihawk (w169) | **ready** | [On Play] `draw 2`, `trashFromHand` 1, `play` up to 1 {Cross Guild} Character `cost <= 4` from hand; [Once Per Turn] replacement `leaveField` of your {Cross Guild} Characters by the opponent's effect, payload `trash` 1 hand (G14) | same |
| ST25-004 | Buggy (w59) | **ready** | [Activate: Main] cost `trash` 1 hand + `trashSelf`: `if` Leader named [Buggy], `play` up to 1 {Cross Guild} Character `cost <= 6` from hand | same |
| ST25-005 | Mohji (w168) | **ready** | Permanent (2+ Characters `baseCost >= 5`): `grant Blocker` and `cost +1`; [On K.O.] `if` Leader [Buggy] and hand `<= 3`: `draw 1` | same |
| ST28-001 | Ashura Doji | **ready** | [On Play] `if` Leader {Land of Wano} and the opponent has 3+ Life: `ko` up to 1 opponent Character `baseCost <= 5` | ST-28 (no block when audited) |
| ST28-002 | Izo | **ready** | `[DON!! x2]` `grant Blocker`; [On Play] your {Land of Wano} Leader `grant Banish` this turn | same |
| ST28-003 | Kin'emon | **ready** | [Trigger] `if` Leader {Land of Wano} and the opponent has 3 or fewer Life: `play` this card (no printed effect) | same |
| ST28-004 | Kouzuki Momonosuke | **missing gap G70** | [Your Turn] Leader +1000 while Life `<= 2` (built); [Activate: Main] Once Per Turn, cost "return 2 total of your currently given DON!! cards **to your cost area rested**": no cost form. `returnDon` sends DON!! to the DON!! deck, `moveDon` (G65) moves a given DON!! to another card; neither detaches to the cost area | ST-28 (no block when audited) |
| ST28-005 | Yamato | **ready** | `[DON!! x2] [Your Turn]` power +3000; [On Play] `lookAtTop` 5 take up to 1 {Land of Wano} card with `cost >= 2`, rest bottom | same |

## New gaps

The audit's unified list ends at G67 (and G68 was added by wave 7). Three new gaps, none touching a design item.

| ID | Gap | Size | Cards | Pool weight | Files |
| --- | --- | --- | --- | --- | --- |
| **G69** | Condition `{ handTrashedThisTurn: P }`: "a card in your hand was trashed by an effect during this turn", read by a hand-zone permanent | S | ST33-004 | 61 | `cards/src/dsl.ts` (`Condition`), `cards/src/dsl-validate.ts` (condition keys), `engine/src/history.ts` (add `handTrashed` to the per-turn `History`, `tracksHistory` scans for the new key), `engine/src/state.ts` (`History`), `engine/src/effects/run.ts` (`handTrashed()` records, next to `fireTrashedFromHand`), `engine/src/effects/eval.ts` (the condition, beside `koedThisTurn`). Planted test `engine/test/cards/m6b-leftovers/g69-hand-trashed-this-turn.test.ts`: reverted, the hand card costs 6. Check that the hand-zone cost permanent is re-derived after the trash (hand permanents sit in the last layer stage, DECISIONS 2026-11-24) |
| **G70** | Cost `returnGivenDon`: "return N total of your currently given DON!! cards to your cost area rested" (the DON!! stay on the field, detached, rested; N may come from several cards) | M | ST28-004 | 0 | `cards/src/dsl.ts` (`Cost`), `cards/src/dsl-validate.ts` (cost keys and `IMPLEMENTED`), `engine/src/effects/eval.ts` (`payable`: total given DON!! `>= N`), `engine/src/effects/run.ts` (`payCost`: choose the source cards and counts as G65 `moveDon` chooses its source; no `donReturned` event, the DON!! do not go to the DON!! deck), `cards/src/hidden.ts` (reads no hidden zone), the log text. Planted test `g70-return-given-don.test.ts` |
| **G71** | Condition on the attacking card in an `onOpponentAttack` ability: `{ attackerIs: Filter }` (ability-level for "when your opponent's Character attacks", effect-level `if` for "if that Character has <Slash>") | S | OP11-088 | 0 | `cards/src/dsl.ts` (`Condition`), `cards/src/dsl-validate.ts` (only in an `onOpponentAttack` ability, or inside its effect), `engine/src/effects/eval.ts` (match `s.battle.attacker` against the filter, current attributes), `cards/src/hidden.ts` (reads none). Planted test `g71-attacker-filter.test.ts` (a Leader attack does not trigger; a non-Slash Character attack spends the Once Per Turn and adds nothing) |

Sizes use the audit's scale (S: a few lines in two or three files plus a planted test; M: a new runtime path). G69 and G71 add no state a recorded game could differ by (G69 records history only when a card in the game reads it, as G26 does), so ENGINE_VERSION need not move for them; G70 is a new cost no script uses, so the same.

**What the three unblock:** ST33-004 (G69, weight 61), ST28-004 (G70), OP11-088 (G71): 3 cards, weight 61. The gaps are small enough for one short branch (the runbook's step c, at most 8 to 10 primitives).

## Design items: where each stands

D1 to D9 are in `m6b-runtime-audit.md` §3. DECISIONS "M6b-1 decisions" (2026-11-23) took the auditor's recommendation for each; DECISIONS "Open decisions at the end of the block 4 session" (2026-11-24) then lists D1, D2, D5, D7, D8 and D9 as "waiting on the lead ... None is decided". So the position is: D3, D4, D6 built; **no wave 8 exists**; the rest are planned or deferred as below and need the lead's go-ahead.

| Item | Cards (weight) | M6b-1 decision (2026-11-23) | State in the register (2026-11-24) | Size |
| --- | --- | --- | --- | --- |
| D1 rules-changing Leaders | OP13-003, OP13-079, OP15-022 (9) | stays stats-only; BACKLOG §3 | open | 3 x M |
| D2 activate an Event from hand or trash | EB03-031, OP15-014, OP15-046, OP12-041 (16) | wave 8, after rulings on M6b-Q27 and Q28 | open | M |
| D5 whole-side [On Play] negation | OP09-081 (14) | stays stats-only; BACKLOG §3 | open | L |
| D7 watcher registered by an Activate | OP12-020 (3) | stays stats-only; BACKLOG §3 | open | L |
| D8 delayed effect at the opponent's next Main Phase | PRB02-005 (16) | wave 8 (A: a `delayed` timing plus a hook) | open | M |
| D9 effect acting on the event's subject | OP16-079 (19) | wave 8 (A: `Ctx.subject` and `lki: 'subject'`), M6b-Q11 pending | open | M |

If the lead wants the cheap ones: D8 and D9 are M and generic (D9 reuses for any "that card" after a timing), D2 unblocks four cards and also half of OP15-014 and OP12-041 already expressible.

## Needs verification (11): what is unsettled

| Card | Question | Effect on the script |
| --- | --- | --- |
| EB05-031 | EB-05-V1: cost 5 (optcgapi) or 4 (Limitless) | none (the printed cost only) |
| EB03-034 | B4-V5: {Big Mom Pirates} or {Rocks Pirates} | none for the script; other cards' filters |
| EB04-048 | B4-V1: "-2 cost" or "+2 cost" per 5 trash cards | one sign |
| OP13-084 | B4-V2: [On Play] look at 5 (optcgapi) or a [Your Turn] base-power ability (Limitless) | two different second abilities, both expressible |
| OP14-094 | B4-V3: attribute Strike or Special | none for the script |
| OP14-103 | B4-V7: name "Gloriosa" or "Gloriosa (Grandma Nyon)" (the validator rejects a trailing parenthesis) | none; needs the validator rule decided |
| PRB02-017 | B4-V4 and M6b-Q3: [On Play] or [Once Per Turn] [Activate: Main] | the ability's timing |
| OP10-010 | B3-V1: name "Chadros.Higelyges" or "... (Brownbeard)" | none; the same validator rule |
| OP10-064 | B3-V2: types | keywords-only override |
| OP11-031 | B3-V3: types | none for the script |
| ST15-005 | B3-V4: counter none or 1000; also the lost sign | none for the script |

All eleven need only the owner's read of https://en.onepiece-cardgame.com/cardlist/ and a `cards/overrides/<ID>.json`; after it they are ready (no gap, no design item). The same sitting should confirm the block icons of ST-22, ST-23, ST-24, ST-25, ST-28, ST-33 and EB-05.

## Ready, grouped for scripting (48 cards, set order)

Runbook step d: Leaders first inside a set, then by weight. Heavy cards worth the first slots: ST25-003 (169), ST25-005 (168), ST25-002 (164), EB02-030 (161), ST25-001 (147), ST23-001 (129), OP12-034 (107), OP09-086 (86), ST24-002 (77).

**Group A, boosters and EB (18):** EB02-030, EB03-018, OP09-033, OP09-045, OP09-086, OP10-070, OP10-104, OP11-006, OP11-023, OP11-046, OP12-021, OP12-024, OP12-027, OP12-028, OP12-034, OP12-101, OP13-025, OP15-099.

**Group B, ST-22 and ST-23 (16):** ST22-001 (Leader first), ST22-002, ST22-003, ST22-005, ST22-006, ST22-007, ST22-011, ST22-012, ST22-015, ST22-016, ST22-017, ST23-001, ST23-002, ST23-003, ST23-004, ST23-005.

**Group C, ST-24, ST-25 and ST-28 (14):** ST24-001, ST24-002, ST24-003, ST24-004, ST24-005, ST25-001, ST25-002, ST25-003, ST25-004, ST25-005, ST28-001, ST28-002, ST28-003, ST28-005.

**After the verification reads (11, no gap):** EB05-031, EB03-034, EB04-048, OP13-084, OP14-094, OP14-103, OP10-010, OP10-064, OP11-031, PRB02-017, ST15-005. **After the small gap branch (3):** ST33-004 (G69), ST28-004 (G70), OP11-088 (G71). **Waiting on the lead (11):** the D-items above.

Hidden-gate and review notes for the scripters: ST22-001, 011 and 017 pay a hand-reveal cost whose pool is the hand (the optional-cost prompt must not reveal it: same pattern as OP12-013); ST22-003/006/007/012/016 reveal a deck top, which becomes public, so the `if` over it is not a gate; ST22-015 and OP15-099 read Life, but only through public face states and counts. New readings are in OPEN-QUESTIONS M6b-Q87 to Q90.
