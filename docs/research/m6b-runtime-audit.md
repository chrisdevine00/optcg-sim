# M6b-1 runtime audit: Standard pool (consolidated)

Deliverable of PLAN §2a M6b-1, written 2026-11-23. It merges the three per-slice audits, which stay as they are and are the per-card evidence: [block5.md](m6b-audit/block5.md) (block 5, block X, the block 1 exceptions and EB-05; gap IDs `B5-G*`), [block4.md](m6b-audit/block4.md) (`B4-G*`) and [block3.md](m6b-audit/block3.md) (`B3-G*`). Method: `docs/research/m4b-runtime-audit.md` sections 1, 3 and 4. Merges were checked against `cards/src/dsl.ts`, `cards/src/dsl-validate.ts`, `engine/src/effects/{run,eval}.ts`, `engine/src/flow.ts` and `engine/src/ops/index.ts`; where two auditors named the same construct under different words, the unified gap says which source IDs it merges. Nothing in `engine/` or `cards/` was changed, and no card was scripted.

How to read the numbers. **Pool weight** is the sum of `weight` from `cards/data/coverage-report.json` `backlog` over the gap's cards (weights come from `play-frequency.json`, leaders by deck count). EB-05 cards are not in the backlog, so they count 0. A card that needs two gaps counts fully in both, so weights of different gaps overlap and must not be added across gaps; the wave table (section 4) counts each card once. **Size**: S = a few lines in two or three files plus a planted test; M = a new runtime path, hook or modifier kind; L = new engine state, a new decision kind, or a new flow frame. Decision items (`D1` to `D9`) are listed in section 3 and are not counted as gaps until the lead decides.

## 1. Result

- **Cards audited: 1,175** (1,120 `backlog` entries, which is every in-scope unscripted card while block 2 is held, plus 55 EB-05 cards; OP-18 is not imported yet, see the note at the end of section 4). Block 5 slice 243 (block 5: 180, block X: 4, block 1 exceptions: 4, EB-05: 55), block 4 slice 422, block 3 slice 510.
- **Need nothing new: 883** (75.1 %): 193 + 313 + 377. These need a script, not a primitive. At least 15 of them are keyword-only cards that need only a verified override with `keywords` (section 6).
- **Need at least one gap: 292** (24.9 %): 50 + 109 + 133. Their pool weight is 3818 of 16904 (22.6 %), so the gap cards are the lighter part of the pool by weight but 25 % by count.
- **Need a design decision: 13 by the auditors' count** (3 + 6 + 4: OP16-080, EB05-052, OP16-079; OP13-079, OP13-003, OP15-022, OP15-014, OP15-046, EB03-031; OP09-081, EB02-030, OP12-020, PRB02-005). Merging the slices adds two cards that another auditor had sized as ordinary gaps but that are the same decision as a listed card: OP14-060 (redirect, same as OP16-080) and OP12-041 (activate an Event from hand, same as OP15-014). **15 cards** are therefore held for the nine decisions D1 to D9 in section 3 (pool weight 256 in total, EB02-030 alone is 161).

| Slice | Audited | Need nothing | Need >= 1 gap | Design decision (auditors) | Source gaps | Pool weight of slice | Of which gap cards |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [block5.md](m6b-audit/block5.md) | 243 | 193 | 50 | 3 | 26 | 7439 | 1528 |
| [block4.md](m6b-audit/block4.md) | 422 | 313 | 109 | 6 | 41 | 4724 | 1365 |
| [block3.md](m6b-audit/block3.md) | 510 | 377 | 133 | 4 | 55 | 4741 | 925 |
| **Total** | **1175** | **883** | **292** | **13** (15 after merging) | **122** | **16904** | **3818** |

- **122 source gaps merge into 67 implementation gaps (G1 to G67) plus 9 decision items (D1 to D9).** 36 unified gaps merge two or more source IDs (11 merge all three auditors; the `mill` action is B5-G6 = B4-G1 = B3-G1), and the other 31 come from one auditor. 20 of the 67 serve a single card; they are the tail of waves 5 to 7.
- **The weight is concentrated.** The seven heaviest gaps by pool weight are G1 Cost on your own field Characters: trash, return to hand, bottom of deck, K.O. (534), G2 Restriction `cannotBeRested` (424), G3 Filter `attribute` (328), G4 Action `mill` (effect form) (203), G11 Replacement `ko` with a cause (165), G12 `rules` clauses `anyNumberInDeck` and `deckRestriction` (153), G13 Filter `nameIncludes` (152). Wave 1 alone makes 106 more cards expressible and covers every gap that EB-05 needs except Gloriosa (decision D4).
- **Two corrections to what the auditors wrote** (details in section 5): a `trash` cost on `from: 'characters'` does pass validation, but `payCost` does not skip the return of given DON!! (`moveCard` returns them itself); and OP16-022's vacuous-truth proposal contradicts the closest official ruling (section 7).

## 2. Unified gap list

Ordered by wave (the order in which M6b-2 should build them) and, inside a wave, by pool weight. Detail blocks follow the table. 'Wave' is defined in section 4; 'Depends on' lists real code dependencies or shared plumbing that should land together. Card IDs starting `EB05-` are the first scripting batch.

| ID | Gap | Size | Cards | Pool weight | Wave | Depends on | Merges |
| --- | --- | --- | --- | --- | --- | --- | --- |
| G1 | Cost on your own field Characters: trash, return to hand, bottom of deck, K.O. | M | 23 | 534 | 1 | none | B5-G2, B4-G17, B3-G7 |
| G2 | Restriction `cannotBeRested` | M | 13 | 424 | 1 | none | B5-G5, B4-G2, B3-G13 |
| G3 | Filter `attribute` | S | 19 | 328 | 1 | none | B5-G1, B4-G5 (filter half), B3-G3 |
| G4 | Action `mill` (effect form) | S | 28 | 203 | 1 | none | B5-G6, B4-G1, B3-G1 |
| G5 | Action `activate` of the card's own [On K.O.] or [Counter] | S | 8 | 140 | 1 | none | B5-G3, B4-G21 |
| G6 | K.O. protection scoped by cause | M | 10 | 140 | 1 | none | B5-G10, B4-G30 (cause forms), B3-G2 (cause forms) |
| G7 | Cost `giveDon` (active DON!! to a Leader or Character) | S | 6 | 129 | 1 | none | B5-G11, B4-G18, B3-G16 |
| G8 | Cost `turnLifeFaceDown` | S | 7 | 74 | 1 | none | B5-G12, B4-G13 (cost half), B3-G11 |
| G9 | Cost `returnDon` restricted to active cost-area DON!! | S | 3 | 11 | 1 | none | B5-G7, B3-G29 |
| G10 | Restriction `cannotActivateBlocker` on the blocking card | M | 7 | 4 | 1 | none | B5-G4, B3-G14 |
| G11 | Replacement `ko` with a cause | S | 13 | 165 | 2 | none | B4-G15, B3-G4 |
| G12 | `rules` clauses `anyNumberInDeck` and `deckRestriction` | M | 2 | 153 | 2 | none | B5-G24, B3-G31 (B4-G26 is the same clause, but its card OP13-079 is held for decision D1) |
| G13 | Filter `nameIncludes` | S | 1 | 152 | 2 | none | B5-G23 |
| G14 | Replacement scope: `leaveField` with any cause; one replacement covering two events | M | 3 | 119 | 2 | G11 | B5-G21, B4-G16 |
| G15 | `Num` count of distinct card names | S | 2 | 95 | 2 | none | B5-G8 |
| G16 | `giveDon` to up to N chosen targets, up to M each | S | 1 | 57 | 2 | none | B5-G25 |
| G17 | `lookAtTop` take `to: 'play'` | M | 5 | 50 | 2 | none | B5-G26, B4-G37, B3-G19 |
| G18 | Action `ko` on a Stage | S | 4 | 47 | 2 | none | B5-G9, B4-G39 |
| G19 | Cost alternatives `oneOf` | M | 1 | 31 | 2 | none | B5-G13 |
| G20 | Give the opponent's DON!! to the opponent's cards | M | 10 | 115 | 3 | none | B4-G3 |
| G21 | Player restriction `cannotSetDonActive` by Character effects | S | 2 | 105 | 3 | none | B4-G35, B3-G49 |
| G22 | Timing: cards trashed from hand by an effect | M | 4 | 94 | 3 | none | B4-G8, B3-G53 |
| G23 | `Num` division (floor) | S | 4 | 94 | 3 | none | B4-G32, B3-G20 |
| G24 | Timing `rested` / `becameRested` | M | 10 | 30 | 3 | G2 | B5-G17, B4-G7, B3-G25 |
| G25 | `cardPlayed` timing qualifiers: origin zone and `via` | M | 2 | 24 | 3 | none | B5-G18 (part a), B3-G45 |
| G26 | Per-turn history conditions (K.O.'d this turn, Event activated this turn) | M | 2 | 5 | 3 | none | B5-G22, B4-G40 |
| G27 | Action `returnDon` for the opponent | M | 3 | 3 | 3 | G9 | B5-G14, B4-G38 |
| G28 | `[On K.O.]` qualified by the K.O. cause | S | 6 | 2 | 3 | none | B5-G16, B3-G12 |
| G29 | Timing `removed` / `leftField` (a card leaves the field) | M | 5 | 2 | 3 | none | B5-G15, B4-G34, B3-G17 |
| G30 | Life to trash: top Life card as an effect, a cost or a replacement payload | M | 10 | 85 | 4 | none | B4-G12, B3-G8 |
| G31 | `lookAtTop`: opponent's deck look-only, and `topAnyOrder` | M | 3 | 81 | 4 | none | B3-G24, B3-G38 |
| G32 | Grant: can also attack active Characters | M | 7 | 77 | 4 | none | B4-G36, B3-G9 |
| G33 | Action `swapBasePower` | M | 3 | 61 | 4 | none | B4-G22 |
| G34 | Filter `donGiven` and per-target `Num` | M | 8 | 52 | 4 | G20 | B4-G4 |
| G35 | Action `winGame` | M | 1 | 51 | 4 | none | B3-G55 |
| G36 | Action `damage` | S | 2 | 46 | 4 | none | B4-G11 |
| G37 | Replacement for being rested | M | 1 | 46 | 4 | G2 | B3-G48 |
| G38 | Timing `koed` for the opponent's Characters | S | 1 | 40 | 4 | none | B4-G33 |
| G39 | `delayed` steps that remember bound cards | M | 1 | 38 | 5 | none | B3-G33 |
| G40 | `donReturned` qualifiers: minimum count at once, cause | S | 3 | 21 | 5 | none | B3-G22, B4-G41 |
| G41 | Life face-state: turn all face-down, face-up Life condition | M | 2 | 19 | 5 | G8 | B4-G13 (b, c), B3-G28 |
| G42 | Cost `returnDon` with a variable count | M | 6 | 16 | 5 | G9 | B3-G6 |
| G43 | Timing `damageTaken` | S | 1 | 10 | 5 | none | B4-G10 |
| G44 | 'Choose a cost' plus reveal the opponent's deck top and compare | L | 6 | 9 | 5 | none | B3-G5 |
| G45 | Action `move` from `lifeTopOrBottom` to hand | S | 1 | 8 | 5 | none | B3-G37 |
| G46 | K.O. protection with a source filter (attacker or effect source) | M | 5 | 4 | 5 | G6, G3 | B4-G30 (source forms), B3-G2 (source forms) |
| G47 | Timed restriction `cannotAttackTarget: Filter` | S | 1 | 3 | 5 | none | B3-G27 |
| G48 | `skipRefresh` for an opponent's rested DON!! | S | 1 | 2 | 5 | none | B3-G51 |
| G49 | Filter on printed effects ('no base effect', 'without a [When Attacking] effect') | S | 7 | 1 | 6 | none | B4-G6, B3-G23 |
| G50 | Permanent: Characters you play enter rested | M | 1 | 1 | 6 | none | B3-G43 |
| G51 | Effects performed by the opponent: `play`, `addDon` | S | 2 | 0 | 6 | none | B4-G24, B3-G42 |
| G52 | Cost: place this Character or Stage at the bottom of the deck | S | 4 | 0 | 6 | G1 | B3-G15 |
| G53 | `play` the revealed top card of the deck or Life | M | 2 | 0 | 6 | G17 | B3-G46, B3-G47 |
| G54 | Filter `sameNameAs` a bound card | S | 1 | 0 | 6 | none | B3-G35 |
| G55 | `Pick.totalPower` | S | 1 | 0 | 6 | none | B3-G44 |
| G56 | Timing `triggerActivated` | S | 2 | 0 | 6 | none | B4-G9, B3-G54 |
| G57 | [Trigger] 'add this card to your hand' | S | 3 | 0 | 6 | none | B3-G21 |
| G58 | Variable-count 'trash any number from your hand' cost feeding a scaled effect | M | 1 | 0 | 6 | none | B3-G30 |
| G59 | Timed grant of an attribute | S | 1 | 0 | 7 | G3 | B4-G5 (grant half) |
| G60 | Player restriction: cannot add Life to hand by your own effects | S | 1 | 0 | 7 | none | B3-G50 |
| G61 | Move a Character from the field into a Life area | M | 5 | 0 | 7 | G1 | B3-G10 |
| G62 | Cost `power` on your Leader | S | 2 | 0 | 7 | none | B4-G19 |
| G63 | Hand-zone restriction: 'cannot be played by effects' | S | 1 | 0 | 7 | none | B3-G36 |
| G64 | Look at Life cards and re-place them (top or bottom, or all in any order) | M | 4 | 0 | 7 | none | B4-G14, B3-G18 |
| G65 | Move a given DON!! card from one card to another | M | 1 | 0 | 7 | none | B3-G39 |
| G66 | Permanent `negate` stage | M | 1 | 0 | 7 | none | B4-G29 |
| G67 | `Num` stat of a selector (statOf, totalCost) | S | 2 | 0 | 7 | none | B4-G31, B3-G41 |

### G1 Cost on your own field Characters: trash, return to hand, bottom of deck, K.O.

- **Size** M; **wave** 1; **pool weight** 534; **23 cards** (EB-05: 3).
- **Merges** B5-G2, B4-G17, B3-G7.
- **Depends on** none.
- **Cards** EB03-026, EB04-048, EB05-048, EB05-049, EB05-060, OP09-030, OP10-002, OP10-022, OP10-047, OP10-056, OP13-031, OP13-053, OP13-059, OP13-079, OP14-079, OP14-080, OP15-039, OP15-041, OP15-052, OP16-008, OP16-045, OP16-050, ST17-002.
- **Where** `dsl-validate.ts` `cost()` (the `move` cost accepts only `hand`/`trash` through `zonesIn`; there is no `ko` cost; `trash` is not zone-checked), `run.ts` `payCost` (route the field case through `pushRemove`/`pushKo` with `cause.kind: 'cost'`, as `trashSelf` already uses `leaveField`), `eval.ts` `payable`, `costIsSecret`, `costText`; `flow.ts` `pushRemove`/`pushKo`.
- **What** Cost shapes that act on one of your Characters before the colon: `trash` ('trash 1 of your Characters with 10000 base power'), `move` to hand ('return 1 of your Characters with a cost of 2 or more to your hand'), `move` to the deck bottom (OP15-041, EB03-026, and as the replacement payload of OP15-052), and `ko` ('K.O. 1 of your {Thriller Bark Pirates} Characters'; its [On K.O.] must fire). The selected card must survive the extra frame the removal pushes. Ruling to respect: RL-16 says a Character with 'cannot be K.O.'d by effects' cannot pay a K.O. cost (the cost is part of the effect), so the K.O. cost must be a K.O. with an effect-kind cause for the protection check, and RL-15 says a trash cost is not a K.O. The returned Character may be the paying card itself (OP09-030). `payable` already counts a pool, so only validation and payment change. See also section 5 for the present trash-cost behaviour.

### G2 Restriction `cannotBeRested`

- **Size** M; **wave** 1; **pool weight** 424; **13 cards**.
- **Merges** B5-G5, B4-G2, B3-G13.
- **Depends on** none.
- **Cards** EB02-011, EB03-017, OP11-034, OP11-046, OP12-021, OP13-032, OP14-033, OP14-069, OP14-119, OP15-024, OP15-029, OP16-032, ST32-002.
- **Where** `dsl.ts` Restriction, `dsl-validate.ts` restriction list and `IMPLEMENTED.restrictions`, `state.ts` `ModKind`, `run.ts` `RESTRICT_KIND`, `layers.ts`, `derive.ts` flag; reads in `ops/index.ts` `rest()`, `actions.ts` attack and block legality, `eval.ts` `payable` (restSelf and rest costs), `run.ts` `selectRest` and the `rest` action.
- **What** A Character 'cannot be rested' until the end of the opponent's next End Phase (timed, ST32-002, OP16-032, OP11-034, EB02-011), by the opponent's effects only (permanent with conditions: OP15-024, OP12-021, OP11-046), or unconditionally. rules-digest 57 (QA-GR) fixes the semantics of the unqualified form: it cannot attack, cannot activate [Blocker], cannot pay a 'rest this Character' cost and cannot be rested by any effect. The 'by your opponent's effects' form (OP15-024 'Leader and Character effects', B3 'opponent effects') must leave costs, the owner's own effects and rule rests (attacking, blocking) alone, so the check needs the cause of the rest. Check the `skipRefresh` interplay.

### G3 Filter `attribute`

- **Size** S; **wave** 1; **pool weight** 328; **19 cards** (EB-05: 5).
- **Merges** B5-G1, B4-G5 (filter half), B3-G3.
- **Depends on** none.
- **Cards** EB05-010, EB05-016, EB05-050, EB05-055, EB05-057, OP03-008, OP11-005, OP11-006, OP11-088, OP12-021, OP12-027, OP12-028, OP12-034, OP12-036, OP13-025, ST32-001, ST32-003, ST32-004, ST32-005.
- **Where** `cards/src/dsl.ts` Filter, `dsl-validate.ts` `filter()`, `engine/src/effects/eval.ts` `matchesOf` (`def.attributes`); also usable in `leader:`/`self` conditions, `koed` filters and `lookAtTop` take filters.
- **What** `{ attribute: Attribute }` ('Characters with the Wisdom attribute', 'your Leader has the <Slash> attribute', '[Perona] or has the <Slash> attribute'). `Attribute` is in `cards/src/schema.ts` and `CardDef.attributes` already reaches the engine (`defs.ts`, `state.ts`); only the filter member and its test are missing. Prerequisite for ST32-001/003/004/005: the attribute name was lost in the verified text (section 6).

### G4 Action `mill` (effect form)

- **Size** S; **wave** 1; **pool weight** 203; **28 cards** (EB-05: 1).
- **Merges** B5-G6, B4-G1, B3-G1.
- **Depends on** none.
- **Cards** EB02-046, EB03-046, EB03-047, EB04-043, EB05-031, OP09-059, OP10-081, OP10-087, OP10-088, OP10-091, OP10-095, OP11-043, OP11-082, OP11-084, OP12-084, OP12-096, OP12-098, OP13-087, OP14-079, OP14-081, OP15-022, OP15-081, OP15-082, OP15-083, OP15-084, OP15-085, OP15-096, OP16-099.
- **Where** `dsl-validate.ts` `IMPLEMENTED.actions`, `engine/src/effects/run.ts` `action()` (new branch; the cost form already exists in `payCost`).
- **What** `{ mill: { player, n } }` as an effect: move the top n cards of the deck to the trash face-up (`moveCard(..., 'trash', { reason: 'effect' })`), clamped to the deck size (the cost form raises an anomaly when the deck is shorter, an effect must not). `n` must be a `Num` (OP09-059 mills as many as it trashed, via `refCount`); today the type is a plain number. `Action.mill` is already in `dsl.ts` and the validator key list, only `IMPLEMENTED.actions` and the runtime branch are missing, so `validateScript` rejects it with a clear error. Milling must never lose the game by itself (deck-out is checked on draw, RL-26).

### G5 Action `activate` of the card's own [On K.O.] or [Counter]

- **Size** S; **wave** 1; **pool weight** 140; **8 cards**.
- **Merges** B5-G3, B4-G21.
- **Depends on** none.
- **Cards** OP13-039, OP15-079, OP16-102, OP16-103, OP16-106, OP16-109, OP16-110, OP16-114.
- **Where** `dsl.ts` `Action.activate` (`ability: 'main' | 'onPlay'`), `dsl-validate.ts`, `run.ts` `action()` (looks for `x.when.includes('onPlay')`).
- **What** `{ activate: { ability: 'onKO' | 'counter', of: 'self' } }` for '[Trigger] Activate this card's [On K.O.] effect' (OP16-102/103/106/109/110/114, OP15-079) and '... [Counter] effect' (OP13-039; a [Counter] resolved outside a battle has no battle, so its 'during this battle' modifiers need a duration check). Conditions such as [Opponent's Turn] are rechecked when the pushed effect starts, which is wanted for OP16-103. rules-digest 105: the activated effect's own activation cost must still be paid.

### G6 K.O. protection scoped by cause

- **Size** M; **wave** 1; **pool weight** 140; **10 cards** (EB-05: 1).
- **Merges** B5-G10, B4-G30 (cause forms), B3-G2 (cause forms).
- **Depends on** none.
- **Cards** EB03-018, EB05-059, OP04-083, OP09-033, OP09-045, OP09-086, OP10-070, OP10-104, OP11-046, OP12-024.
- **Where** `dsl.ts`/`dsl-validate.ts` `restriction()`, `state.ts` `ModKind`, `derive.ts` stage 5 and `layers.ts` `RESTRICT_KIND`, `flow.ts` `runKo` line 720 (`dv.cannotBeKOd` blocks every cause).
- **What** `cannotBeKOd` with `cause: 'opponentEffect' | 'effect' | 'battle'`, permanent or timed ('by your opponent's effects', 'by effects', 'in battle'). `runKo` must read `f.cause`. The ruling is explicit: RL-14 says 'by effects' does not stop a battle K.O., 'in battle' does not stop effects, and 'by your opponent's effects' does not stop your own. A K.O. paid as a cost counts as an effect for the 'by effects' form (RL-16). Cards: OP04-083 (by effects, all your Characters, until the start of your next turn), EB05-059 (in battle, base power 4000 and a type), EB03-018, OP09-033, OP09-045, OP09-086, OP10-070, OP10-104, OP11-046, OP12-024. The once-per-turn variant (OP10-118) is in G11 (K.O. replacement by cause).

### G7 Cost `giveDon` (active DON!! to a Leader or Character)

- **Size** S; **wave** 1; **pool weight** 129; **6 cards** (EB-05: 1).
- **Merges** B5-G11, B4-G18, B3-G16.
- **Depends on** none.
- **Cards** EB04-009, EB05-008, OP12-016, OP12-017, OP12-019, OP13-007.
- **Where** `dsl.ts` Cost, `IMPLEMENTED.costs`, `dsl-validate.ts` `cost()`, `eval.ts` `payable`, `run.ts` `payCost` (reuse the `giveDon` mover with active DON!!).
- **What** `{ giveDon: { n, state: 'active', to: Selector } }` ('give 1 active DON!! card to your Leader', 'give 2 active DON!! cards to 1 of your [Silvers Rayleigh]', with `trashSelf` in OP13-007). Payable needs n active DON!! in the cost area and a legal target. The given DON!! count for [DON!! xN] and return at Refresh as usual.

### G8 Cost `turnLifeFaceDown`

- **Size** S; **wave** 1; **pool weight** 74; **7 cards** (EB-05: 1).
- **Merges** B5-G12, B4-G13 (cost half), B3-G11.
- **Depends on** none.
- **Cards** EB05-011, OP11-100, OP11-103, OP11-104, OP11-107, OP11-108, OP15-099.
- **Where** `dsl.ts` Cost, `IMPLEMENTED.costs`, `dsl-validate.ts` `cost()`, `eval.ts` `payable` (top card must be face-up), `run.ts` `payCost` (mirror of `turnFaceUp`).
- **What** `{ turnLifeFaceDown: n }`: turn the top n Life cards face-down. Mirror of `turnLifeFaceUp`; payable only when the top n Life cards exist and are face-up. Re-roll the card's projection key so it is hidden again (`state.ts` `key`; B4).

### G9 Cost `returnDon` restricted to active cost-area DON!!

- **Size** S; **wave** 1; **pool weight** 11; **3 cards** (EB-05: 1).
- **Merges** B5-G7, B3-G29.
- **Depends on** none.
- **Cards** EB02-061, EB05-040, OP16-060.
- **Where** `dsl.ts` Cost, `dsl-validate.ts`, `run.ts` `returnDon` (class choice offers `costActive`, `costRested`, `given`), `eval.ts` `payable`.
- **What** `{ returnDon: { n, state: 'active' } }` ('return 8 / 2 / 1 of your active DON!! cards to your DON!! deck'): offer only the `costActive` class and count only active DON!! in `payable`. Same function as the variable-count form (G42) and the opponent form (G27).

### G10 Restriction `cannotActivateBlocker` on the blocking card

- **Size** M; **wave** 1; **pool weight** 4; **7 cards** (EB-05: 1).
- **Merges** B5-G4, B3-G14.
- **Depends on** none.
- **Cards** EB05-048, OP01-120, OP09-014, OP11-013, OP12-051, OP16-063, ST21-016.
- **Where** `state.ts` `ModKind`, `derive.ts` flag, `run.ts` `RESTRICT_KIND`, `actions.ts` block legality (around line 218), validator restriction list and `IMPLEMENTED.restrictions`.
- **What** Bars specific opponent Characters from activating [Blocker] ('up to 1 of your opponent's Characters', 'all of your opponent's Characters with a cost of 0', 'a [Blocker] Character with 2000 or less power'; durations `thisTurn` and `battle`). Different from the existing attacker-side `cannotActivateBlockerAgainstIt` (`derive.ts` `noBlocker`, `actions.ts` line 225). Targets selected at resolution are a snapshot (B3), except OP01-120 where the power filter is read at block time (question M6b-Q12).

### G11 Replacement `ko` with a cause

- **Size** S; **wave** 2; **pool weight** 165; **13 cards**.
- **Merges** B4-G15, B3-G4.
- **Depends on** none.
- **Cards** EB02-030, EB04-043, OP09-012, OP10-034, OP10-074, OP10-118, OP12-027, OP13-008, OP13-047, OP13-060, OP14-034, ST20-002, ST29-008.
- **Where** `dsl.ts` `ReplaceEvent` (`ko` has no cause), `dsl-validate.ts` `replaces` branch (accepts `cause` only for `leaveField`), `flow.ts` `collectReplacements` (`event === 'ko'` offers it for battle K.O.s too).
- **What** `{ ko: Selector; cause?: 'opponentEffect' | 'effect' | 'battle' }`, filtered against `Cause` (`kind`, `by`). Cards: by opponent's effect (OP12-027, OP10-074, OP14-034, OP13-008, OP13-047, OP13-060, EB04-043, ST29-008), by an effect of either player (OP09-012, ST20-002), in battle (OP10-034, EB02-030 timed). OP10-118 ('once per turn, cannot be K.O.'d by your opponent's effects') is a mandatory once-per-turn replacement with an empty payload: an empty `instead` is read by `possible()` as an empty cost list, and `payable(c, [])` is true (`eval.ts`), so it probably works as 'prevented' but has no precedent: pin it with a planted test or add an explicit `instead: 'prevent'` (question M6b-Q36).

### G12 `rules` clauses `anyNumberInDeck` and `deckRestriction`

- **Size** M; **wave** 2; **pool weight** 153; **2 cards**.
- **Merges** B5-G24, B3-G31 (B4-G26 is the same clause, but its card OP13-079 is held for decision D1).
- **Depends on** none.
- **Cards** OP12-001, OP16-042.
- **Where** `dsl-validate.ts` rules-clause rejection ('rules clause ... is not implemented'), `engine/src/deck.ts` `deckIssues` (`MAX_COPIES`, no per-card exception), `cards/src/decklist.ts`/format, the browser deck builder and the AI deck generator.
- **What** `anyNumberInDeck` (OP16-042 Prisoner of Impel Down: 'you may have any number of this card in your deck') lifts the 4-copy cap for that card. `deckRestriction: Filter` (OP12-001 'cannot include cards with a cost of 5 or more') is evaluated over the main deck from the Leader's rule. Deck-construction, not game flow; the deck builder must show why a card is illegal. Both clauses are in `RulesClause` types already.

### G13 Filter `nameIncludes`

- **Size** S; **wave** 2; **pool weight** 152; **1 card**.
- **Merges** B5-G23.
- **Depends on** none.
- **Cards** OP16-015.
- **Where** `dsl.ts` Filter, `dsl-validate.ts` `filter()`, `eval.ts` `matchesOf`.
- **What** `{ nameIncludes: string }`: substring of the card name (CR 2-1-2), like `typeIncludes`. `name` is an exact match today. OP16-015 ('your Leader's card name includes "Ace"').

### G14 Replacement scope: `leaveField` with any cause; one replacement covering two events

- **Size** M; **wave** 2; **pool weight** 119; **3 cards**.
- **Merges** B5-G21, B4-G16.
- **Depends on** G11.
- **Cards** EB04-044, OP13-046, OP17-043.
- **Where** `dsl.ts` `ReplaceEvent`, `dsl-validate.ts` `replaces` branch, `flow.ts` `collectReplacements` (line 824 skips every cause but an opponent's effect for `leaveField`), `offerReplacement`.
- **What** (a) `leaveField` with `cause: 'any'` ('if this Character would be removed from the field', OP17-043 Ganzui, EB04-044 Koby): also matches a battle K.O. and own effects, and must not apply twice together with an overlapping `ko` replacement (CR 8-1-3-4-3). (b) `replaces` as a list so ONE Once Per Turn covers two events (OP13-046 Vista: 'would be K.O.'d or removed by your opponent's effect'). Text of OP17-043 is unverified (question M6b-Q5).

### G15 `Num` count of distinct card names

- **Size** S; **wave** 2; **pool weight** 95; **2 cards**.
- **Merges** B5-G8.
- **Depends on** none.
- **Cards** OP16-034, OP16-038.
- **Where** `dsl.ts` Num, `dsl-validate.ts` `num()`, `eval.ts` `numOf`.
- **What** `{ count: Selector, distinctNames: true }` ('+1000 power for each of your Characters with a different card name', '5 {Impel Down} Characters with different card names'). `Pick.distinctNames` exists only as a pick limit. Reading in question M6b-Q9.

### G16 `giveDon` to up to N chosen targets, up to M each

- **Size** S; **wave** 2; **pool weight** 57; **1 card**.
- **Merges** B5-G25.
- **Depends on** none.
- **Cards** ST30-014.
- **Where** `run.ts` `giveDon` (with `each` the selector may not carry a `pick`; without it the engine forces exactly n targets when more than one DON!! is available), `dsl-validate.ts`.
- **What** 'Give up to 2 of your Characters with 6000 base power up to 2 rested DON!! each' (ST30-014): allow `each` together with `pick: { upTo: 2 }`. Shares code with the opponent-DON!! gap (G20).

### G17 `lookAtTop` take `to: 'play'`

- **Size** M; **wave** 2; **pool weight** 50; **5 cards**.
- **Merges** B5-G26, B4-G37, B3-G19.
- **Depends on** none.
- **Cards** EB02-025, EB02-056, OP11-051, OP14-010, OP16-059.
- **Where** `dsl.ts` `Take.to` (`hand | lifeTop`), `dsl-validate.ts` `lookAtTop`, `run.ts` `lookAtTop` (push a `play` frame with `free: true` per taken card, with the batch rule for several cards).
- **What** `to: 'play'` (optionally `rested`): 'look at 5 cards from the top of your deck and play up to 2 {Impel Down} Characters with 6000 power or less; place the rest at the bottom'. The rest then go to the bottom in any order as usual. Shares the play-from-deck plumbing with G53.

### G18 Action `ko` on a Stage

- **Size** S; **wave** 2; **pool weight** 47; **4 cards**.
- **Merges** B5-G9, B4-G39.
- **Depends on** none.
- **Cards** OP13-098, OP14-088, OP17-018, OP17-116.
- **Where** `dsl-validate.ts` `zonesIn(['characters'])` for `ko`, `flow.ts` `pushKo`/`runKo` (returns when the card is not in `characters`; `runRemove` already handles stages).
- **What** Allow `stage` in `ko` ('K.O. up to 1 of your opponent's Stages with a cost of 7 or less'). A Stage K.O. goes to the owner's trash through the K.O. event, with the replacement and `cannotBeKOd` checks. Interim workaround, `move` to the trash, loses the K.O. versus trash distinction and would wrongly remove a 'cannot be K.O.'d' Stage.

### G19 Cost alternatives `oneOf`

- **Size** M; **wave** 2; **pool weight** 31; **1 card**.
- **Merges** B5-G13.
- **Depends on** none.
- **Cards** OP17-020.
- **Where** `dsl.ts` Cost, `dsl-validate.ts`, `eval.ts` `payable` (any alternative), `run.ts` `payCost` (asks which), `costText`.
- **What** `{ oneOf: Cost[][] }` for a cost worded 'A or B' (OP17-020: 'trash 1 card from your hand or rest 1 of your DON!! cards'). A script-level `may` plus `chooseOne` makes the activation legal when it should not be and changes when the Once Per Turn is spent.

### G20 Give the opponent's DON!! to the opponent's cards

- **Size** M; **wave** 3; **pool weight** 115; **10 cards**.
- **Merges** B4-G3.
- **Depends on** none.
- **Cards** OP15-003, OP15-008, OP15-010, OP15-012, OP15-015, OP15-017, OP15-023, OP15-025, OP15-026, OP15-028.
- **Where** `run.ts` `giveDon` / `donField` (donor is always the controller's cost area), `dsl-validate.ts` `giveDon` (no donor), `eval.ts` `payable` for the cost form.
- **What** `giveDon: { from: 'opponent', ... }`: rested DON!! from the opponent's cost area ('give up to 1 rested DON!! card to its owner's Leader or Character'), or active or rested from 'its owner's cost area' (OP15-023, OP15-025, OP15-028), chosen by the controller, and the cost form ('give 1 of your opponent's rested DON!! cards to 1 of your opponent's Characters', OP15-003/017/023). Given DON!! return to their owner at Refresh (CR 6-2-3). Source of the DON!! is question M6b-Q24.

### G21 Player restriction `cannotSetDonActive` by Character effects

- **Size** S; **wave** 3; **pool weight** 105; **2 cards**.
- **Merges** B4-G35, B3-G49.
- **Depends on** none.
- **Cards** EB04-016, OP10-030.
- **Where** `dsl.ts` player `Restriction` (`cannotDrawByOwnEffects | { cannotPlay }`), Leader-held modifier like `cannotDraw`, `run.ts` `setActive` (DON!! branch; source card must be a Character).
- **What** 'You cannot set DON!! cards as active using Character effects during this turn' (EB04-016, OP10-030). Leader, Stage and Event effects stay allowed; the same ability's own earlier set is allowed (OP10-030).

### G22 Timing: cards trashed from hand by an effect

- **Size** M; **wave** 3; **pool weight** 94; **4 cards**.
- **Merges** B4-G8, B3-G53.
- **Depends on** none.
- **Cards** OP12-040, OP14-045, OP14-049, OP14-056.
- **Where** `dsl.ts` `AutoTiming`, `ops/index.ts` (hook in `moveCard` from hand to trash when `reason === 'effect'`, like `hooks.lifeRemoved`), `run.ts` `trashFromHand`.
- **What** `{ event: 'trashedFromHand', owner: P, sourceFilter?: Filter }` firing once per effect resolution with the count n (OP12-040 'draw cards equal to the number trashed', OP14-045/049/056). Whether a cost trash counts and whose effect counts: question M6b-Q31.

### G23 `Num` division (floor)

- **Size** S; **wave** 3; **pool weight** 94; **4 cards**.
- **Merges** B4-G32, B3-G20.
- **Depends on** none.
- **Cards** EB04-048, OP09-086, OP12-070, ST27-004.
- **Where** `dsl.ts` Num, `dsl-validate.ts` `num()`, `eval.ts` `numOf`.
- **What** `{ div: [Num, int] }` integer floor ('+1000 power for every 5 cards in your trash', '+1 cost for every 4', OP12-070 counts Events in the trash). Works today only as a ten-entry `tiers` table.

### G24 Timing `rested` / `becameRested`

- **Size** M; **wave** 3; **pool weight** 30; **10 cards**.
- **Merges** B5-G17, B4-G7, B3-G25.
- **Depends on** G2.
- **Cards** OP10-036, OP14-021, OP14-027, OP14-028, OP14-032, OP14-035, OP14-070, OP14-119, PRB02-009, ST32-003.
- **Where** `dsl.ts` `AutoTiming`, `IMPLEMENTED.timings`, `ops/index.ts` `rest()` (add `hooks.rested` like `hooks.lifeRemoved`, with the reason `effect | cost | rule` and the acting card's category and controller), `flow.ts` `fire` with a subject matcher.
- **What** '[Your Turn] When this Character becomes rested' (ST32-003, OP14-021/027/028/032/035/119), 'by your opponent's Character's effect' (OP14-070), 'a Character is rested by your effect' (OP10-036), 'rested by your opponent's effect' (PRB02-009). Needs the cause and actor at the hook, so build with G2 (same hook in `rest()`). Whether an attack declaration or a block counts is question M6b-Q30.

### G25 `cardPlayed` timing qualifiers: origin zone and `via`

- **Size** M; **wave** 3; **pool weight** 24; **2 cards**.
- **Merges** B5-G18 (part a), B3-G45.
- **Depends on** none.
- **Cards** OP12-081, OP16-079.
- **Where** `dsl.ts` `{ event: 'cardPlayed' }`, `dsl-validate.ts`, `flow.ts` `runPlay` (around line 400; the play frame knows the origin; needs a new Frame field set by `run.ts` `play`).
- **What** `from: 'trash'` (OP16-079 'a {Land of Wano} Character card is played from your trash') and `via: 'effect' | 'characterEffect' | 'rule'` (OP12-081 'plays a Character using a Character's effect'). OP16-079 additionally needs the event's subject (decision D9).

### G26 Per-turn history conditions (K.O.'d this turn, Event activated this turn)

- **Size** M; **wave** 3; **pool weight** 5; **2 cards**.
- **Merges** B5-G22, B4-G40.
- **Depends on** none.
- **Cards** OP15-002, OP16-100.
- **Where** `state.ts` `State` (only `oncePerTurn` exists), `flow.ts` `runKo` and `fireActor` (record), turn change (clear), `eval.ts` `holdsOf`/`numOf`, `dsl.ts`.
- **What** A per-turn, per-player log: `{ koedThisTurn: P }` (OP16-100: 'an opponent's Character has been K.O.'d during this turn', any cause, either player doing it) and `{ eventsActivatedThisTurn: P, baseCost?: Cmp }` (OP15-002: 'activated an Event with a base cost of 3 or more'). Cleared at turn start.

### G27 Action `returnDon` for the opponent

- **Size** M; **wave** 3; **pool weight** 3; **3 cards**.
- **Merges** B5-G14, B4-G38.
- **Depends on** G9.
- **Cards** OP14-065, OP15-059, OP16-074.
- **Where** `run.ts` `returnDon` (always `f.controller`), `dsl.ts` `Action.returnDon` (`{ n }`), `dsl-validate.ts`.
- **What** `{ returnDon: { n, player: 'opponent', from?: 'active' } }` ('your opponent returns 1 (or 4) DON!! cards from their field to their DON!! deck', OP16-074, OP14-065; 'may return 1 of their active DON!! cards, if not ...' OP15-059 with `chooseOne` chooser opponent). The owner chooses the DON!! classes (rulings.md, QA-OP16 OP16-074) and `donReturned` must fire for the opponent's watchers.

### G28 `[On K.O.]` qualified by the K.O. cause

- **Size** S; **wave** 3; **pool weight** 2; **6 cards**.
- **Merges** B5-G16, B3-G12.
- **Depends on** none.
- **Cards** OP09-052, OP11-024, OP11-035, OP11-051, OP16-024, ST15-003.
- **Where** `flow.ts` `runKo` (`koed` is fired only for cards still on the field; `onKO` carries no cause), `eval.ts` `holdsOf` / `Ctx`, `dsl-validate.ts`.
- **What** 'When this Character is K.O.'d by your opponent's effect' (OP16-024, OP11-024, OP11-035, OP11-051, OP09-052) or 'by an effect' (ST15-003): a condition `{ koCause: 'opponentEffect' | 'effect' }` (or a qualifier on the `onKO` timing) set into the effect context when the ability resolves from the trash.

### G29 Timing `removed` / `leftField` (a card leaves the field)

- **Size** M; **wave** 3; **pool weight** 2; **5 cards**.
- **Merges** B5-G15, B4-G34, B3-G17.
- **Depends on** none.
- **Cards** EB02-023, OP09-080, OP10-042, OP13-078, OP16-041.
- **Where** `dsl.ts` `AutoTiming`, `dsl-validate.ts` `timing()`, `flow.ts` `runKo`/`runRemove`, `ops/index.ts` `leaveField` (fire after the card has left, with the last-known filter).
- **What** `{ event: 'removed' | 'leftField', owner: P, filter?: Filter, cause?: 'opponentEffect' | 'yourEffect' | 'effect', to?: 'hand' | 'deck' | 'trash' }`: any move off the field (K.O., trash, return to hand or deck; effect or cost) of a Character or Stage. Only `koed` exists today. Cards: OP16-041 (any cause, [DON!! x1], Once Per Turn), OP13-078 (opponent's effect), OP10-042, OP09-080, EB02-023 (opponent's Character returned to hand by your effect). Last-known type: question M6b-Q20. The own-cost removals of G1 must fire it too.

### G30 Life to trash: top Life card as an effect, a cost or a replacement payload

- **Size** M; **wave** 4; **pool weight** 85; **10 cards**.
- **Merges** B4-G12, B3-G8.
- **Depends on** none.
- **Cards** EB03-054, EB03-055, EB03-057, OP09-107, OP10-109, OP10-112, OP11-102, OP15-116, ST20-002, ST20-005.
- **Where** `dsl-validate.ts` `moveShape` (`lifeTop` admitted only to hand), `run.ts` `move`, `dsl.ts` Cost (`trashLifeUntil` is the only Life-to-trash action), `eval.ts` `payable`.
- **What** `move { what: { from: 'lifeTop', owner: you | opponent | any }, to: { zone: 'trash' } }` and a cost `trashLife`: 'trash 1 card from the top of your Life cards' (EB03-054, EB03-055), 'of your opponent's' (EB03-057, OP10-109/112), both players in one step (OP11-102), as a replacement `instead` (ST20-002). Not damage: no [Trigger] (rules-digest 104), emits the `lifeRemoved` hook like `moveCard(..., from 'life')` already does.

### G31 `lookAtTop`: opponent's deck look-only, and `topAnyOrder`

- **Size** M; **wave** 4; **pool weight** 81; **3 cards**.
- **Merges** B3-G24, B3-G38.
- **Depends on** none.
- **Cards** OP11-062, OP11-070, ST17-003.
- **Where** `dsl-validate.ts` (rejects `lookAtTop.player !== 'you'` and `rest: 'topAnyOrder'`), `run.ts` `lookAtTop` (top-order loop of `topOrBottomAnyOrder` with top fixed), `determinize.ts` (the looked card is known to the looker).
- **What** `player: 'opponent'` with an explicit no-op rest (`'stay'`) for 'look at 1 card from the top of your opponent's deck' (OP11-062, OP11-070), and `rest: 'topAnyOrder'` ('look at 3, put them back on top in any order', ST17-003).

### G32 Grant: can also attack active Characters

- **Size** M; **wave** 4; **pool weight** 77; **7 cards**.
- **Merges** B4-G36, B3-G9.
- **Depends on** none.
- **Cards** EB03-008, EB04-050, OP11-010, OP11-014, OP11-082, OP11-084, OP11-119.
- **Where** `dsl.ts`/`dsl-validate.ts` `KEYWORDS` or a `ModKind`, `derive.ts` flag `canAttackActive`, `actions.ts` target enumeration (line ~431) and battle legality.
- **What** A `thisTurn` grant on a Leader or Character (OP11-010, OP11-014, OP11-082, OP11-084, OP11-119, EB03-008, EB04-050). 'Also': rested-only attacks stay legal. RL-17: it does not let a Character attack on the turn it was played, and other attack restrictions still apply.

### G33 Action `swapBasePower`

- **Size** M; **wave** 4; **pool weight** 61; **3 cards**.
- **Merges** B4-G22.
- **Depends on** none.
- **Cards** OP14-001, OP14-009, OP14-017.
- **Where** `dsl.ts` Action, `run.ts` `action`, `layers.ts`/`derive.ts` base-power stage.
- **What** 'Select 2 Characters. Swap their base power during this turn / this battle' (OP14-001 Leader, OP14-009, OP14-017): two `basePower` modifiers whose values are read from each other's base power at resolution; OP14-009 swaps the Leader with a Character during battle.

### G34 Filter `donGiven` and per-target `Num`

- **Size** M; **wave** 4; **pool weight** 52; **8 cards**.
- **Merges** B4-G4.
- **Depends on** G20.
- **Cards** OP15-001, OP15-008, OP15-015, OP15-018, OP15-025, OP15-027, OP15-031, OP15-038.
- **Where** `dsl.ts` Filter and Num, `dsl-validate.ts` `filter`, `eval.ts` `matchesOf` (`card.don`), `refStat` (`cost | power | basePower` only: add `donGiven`), `run.ts` `action` `power` loop (calls `num` once for all targets).
- **What** `{ donGiven: Cmp }` ('Characters with a DON!! card given', 'that has 2 or more DON!! cards given') and a per-target amount (OP15-008 '-1000 power for every DON!! given to THAT Character'; OP15-031 'cost equal to the number of DON!! given to it').

### G35 Action `winGame`

- **Size** M; **wave** 4; **pool weight** 51; **1 card**.
- **Merges** B3-G55.
- **Depends on** none.
- **Cards** OP09-118.
- **Where** `dsl.ts` Action, `run.ts` `action`, `flow.ts` defeat and victory handling (CR 9-2).
- **What** `{ winGame: true }` ends the game for the controller mid-effect (OP09-118 Roger). Check the simultaneous-loss reading (RL-27) when the opponent is also at 0.

### G36 Action `damage`

- **Size** S; **wave** 4; **pool weight** 46; **2 cards**.
- **Merges** B4-G11.
- **Depends on** none.
- **Cards** EB03-055, OP14-115.
- **Where** `dsl.ts` `Action`, `dsl-validate.ts` `IMPLEMENTED.actions`, `run.ts` `runInternal` (an internal `damage` op that pushes a `damage` frame already exists).
- **What** `{ damage: { player: P, n } }` ('you take 1 damage', OP14-115; 'deal 1 damage to your opponent', EB03-055). Takes the top Life card, can activate its [Trigger], defeats at 0 Life (RL-22).

### G37 Replacement for being rested

- **Size** M; **wave** 4; **pool weight** 46; **1 card**.
- **Merges** B3-G48.
- **Depends on** G2.
- **Cards** PRB02-006.
- **Where** `dsl.ts` `ReplaceEvent`, `ops/index.ts` `rest(d, id, 'effect')` (offer point, a new Frame like `ko`/`remove` or an inline offer), `flow.ts` `collectReplacements`.
- **What** `{ rest: Selector; cause: 'opponentCharacterEffect' }` (PRB02-006: 'if this Character would be rested by your opponent's Character's effect, you may rest 1 of your other Characters instead'). Shares the hook in `rest()` with G2 and G24.

### G38 Timing `koed` for the opponent's Characters

- **Size** S; **wave** 4; **pool weight** 40; **1 card**.
- **Merges** B4-G33.
- **Depends on** none.
- **Cards** EB04-044.
- **Where** `flow.ts` `runKo` (fires `koed` only for abilities where `p === owner`), `dsl.ts`/`dsl-validate.ts` event shape.
- **What** `{ event: 'koed', filter, owner?: P }`, fired for both players ('[Your Turn][Once Per Turn] When one of your opponent's Characters is K.O.'d, draw 1', EB04-044).

### G39 `delayed` steps that remember bound cards

- **Size** M; **wave** 5; **pool weight** 38; **1 card**.
- **Merges** B3-G33.
- **Depends on** none.
- **Cards** OP11-092.
- **Where** `run.ts` `delay` (stores `{ turn, card, ability, start, controller }` but not `f.b`), `compile.ts`, `state.delayed`; `play` must bind what it played.
- **What** Copy the frame bindings into the delayed record and restore them at the end-of-turn replay, so 'place the Character played by this effect at the bottom of the deck at the end of this turn' can use a `ref` (OP11-092). If the Character already left, nothing happens (question M6b-Q38).

### G40 `donReturned` qualifiers: minimum count at once, cause

- **Size** S; **wave** 5; **pool weight** 21; **3 cards**.
- **Merges** B3-G22, B4-G41.
- **Depends on** none.
- **Cards** EB02-035, EB03-033, OP09-061.
- **Where** `dsl.ts` `{ event: 'donReturned' }` (only `owner`), `dsl-validate.ts` `timing()`, `run.ts` `returnDon` (the `DonReturned` event already has `count`; fire with the cause).
- **What** `min?: number` ('2 or more DON!! returned', OP09-061, EB02-035) and `cause: 'effect'` excluding costs ('returned to your DON!! deck BY YOUR EFFECT', EB03-033).

### G41 Life face-state: turn all face-down, face-up Life condition

- **Size** M; **wave** 5; **pool weight** 19; **2 cards**.
- **Merges** B4-G13 (b, c), B3-G28.
- **Depends on** G8.
- **Cards** EB03-051, PRB02-018.
- **Where** `dsl.ts` Action and Num/Condition, `eval.ts` `numOf` (`card.faceUp`; `zoneIds` returns `[]` for `lifeTop`), `run.ts`, `state.ts` `key`.
- **What** Action 'turn all of your Life cards face-down' and `{ lifeFaceUp: P }` as a count (EB03-051, PRB02-018). Turning down must re-roll the projection key.

### G42 Cost `returnDon` with a variable count

- **Size** M; **wave** 5; **pool weight** 16; **6 cards**.
- **Merges** B3-G6.
- **Depends on** G9.
- **Cards** OP09-065, OP09-068, OP09-070, OP09-073, OP09-076, OP09-119.
- **Where** `dsl.ts` Cost, `run.ts` `returnDon`, `eval.ts` `payable`, `costText`, the API (a number decision).
- **What** `{ returnDon: { atLeast: 1 } }`: 'return 1 or more DON!! cards from your field to your DON!! deck' (OP09-065/068/070/073/076/119). The player chooses n >= 1; none of the six scales on n. Fires `donReturned` once.

### G43 Timing `damageTaken`

- **Size** S; **wave** 5; **pool weight** 10; **1 card**.
- **Merges** B4-G10.
- **Depends on** none.
- **Cards** OP13-002.
- **Where** `flow.ts` damage frame (fire after damage processing ends), `dsl.ts` `AutoTiming`.
- **What** 'When you take damage' (OP13-002, with [DON!! x1][Once Per Turn] and a second timing `koed` in the same `when` list). The draw queues after the [Trigger] resolves (rules-digest 106).

### G44 'Choose a cost' plus reveal the opponent's deck top and compare

- **Size** L; **wave** 5; **pool weight** 9; **6 cards**.
- **Merges** B3-G5.
- **Depends on** none.
- **Cards** OP11-066, OP11-071, OP11-073, OP11-074, OP11-079, OP11-081.
- **Where** `state.ts`/`api.ts` and the UI (a number decision 0..10), `dsl.ts` `reveal` (no `player`; the runtime reads `d.ro(you).deck[0]` and the validator allows only `n: 1`), `run.ts`, `eval.ts` (a `{ chosen }` Num).
- **What** Six cards (OP11-066, 071, 073, 074, 079, 081): the controller names a cost, the opponent's top card is revealed and stays on top, and a match gates K.O., power, draw, rest or addDon. Needs a new decision kind, a reveal of the opponent's deck and a Num reading the choice. The chosen number is public and the revealed card becomes public (`markKnown`). The biggest single shape in the slice, 9 pool weight in total, so schedule it last of the S/M/L tail unless the owner values the cards.

### G45 Action `move` from `lifeTopOrBottom` to hand

- **Size** S; **wave** 5; **pool weight** 8; **1 card**.
- **Merges** B3-G37.
- **Depends on** none.
- **Cards** OP09-104.
- **Where** `dsl-validate.ts` `IMPLEMENTED.zones`, `run.ts` `move` (the cost form `lifeToHandCost` supports `topOrBottom`).
- **What** Allow `lifeTopOrBottom` as a move source to hand; the owner chooses top or bottom (OP09-104).

### G46 K.O. protection with a source filter (attacker or effect source)

- **Size** M; **wave** 5; **pool weight** 4; **5 cards**.
- **Merges** B4-G30 (source forms), B3-G2 (source forms).
- **Depends on** G6, G3.
- **Cards** OP03-008, OP09-025, OP11-005, OP12-036, OP14-003.
- **Where** `state.ts` `Cause` (carry the source card), `flow.ts` `runKo` (the attacker comes from the battle frame), `dsl.ts` restriction `by?: Filter`.
- **What** 'Cannot be K.O.'d in battle by <Slash> attribute cards' (OP03-008, OP12-036), 'by Leaders' (OP09-025), 'by effects of Characters without the <Special> attribute' (OP11-005), 'by effects of your opponent's Characters with 5000 base power or less' (OP14-003). RL-14: an all-attributes Leader cannot K.O. a card protected from <Slash> attackers.

### G47 Timed restriction `cannotAttackTarget: Filter`

- **Size** S; **wave** 5; **pool weight** 3; **1 card**.
- **Merges** B3-G27.
- **Depends on** none.
- **Cards** OP12-020.
- **Where** `dsl.ts` Restriction (`cannotAttack` is all attacks), `ModKind` with `filter` (like `cannotPlay`), `actions.ts` attack legality (line ~311); `lockAttackTarget`/`attackLock` in `eval.ts` is the defender-side permanent.
- **What** 'Cannot attack your opponent's Characters with a base cost of 7 or less' this turn (OP12-020, second half; the first half is decision D7).

### G48 `skipRefresh` for an opponent's rested DON!!

- **Size** S; **wave** 5; **pool weight** 2; **1 card**.
- **Merges** B3-G51.
- **Depends on** none.
- **Cards** OP10-033.
- **Where** `run.ts` `skipRefresh` (works on instances), `ops` `untapAll`/`flow.ts` Refresh, `state` (a per-player counter of DON!! that stay rested).
- **What** OP10-033: N of the opponent's rested DON!! stay rested at their next Refresh. Whether it applies to field cards only is question M6b-Q25.

### G49 Filter on printed effects ('no base effect', 'without a [When Attacking] effect')

- **Size** S; **wave** 6; **pool weight** 1; **7 cards**.
- **Merges** B4-G6, B3-G23.
- **Depends on** none.
- **Cards** EB02-022, EB03-001, EB03-003, EB03-007, EB03-009, EB03-039, PRB01-001.
- **Where** `dsl.ts` Filter (`hasBaseEffect`, `hasTiming`), `eval.ts` `matchesOf` from `Def.abilities` (an unscripted card would read as having none: decide the pool rule), `dsl-validate.ts`.
- **What** `{ hasBaseEffect: false }` (EB03-003/007/009/039, EB02-022) and `{ hasTiming: 'onPlay' | 'whenAttacking' }` (PRB01-001, EB03-001). Keyword-only cards count as no effect (question M6b-Q29). An unscripted card's `abilities` is empty, so it would wrongly read as 'no effect'; the filter must read the printed text or the card must be marked scripted.

### G50 Permanent: Characters you play enter rested

- **Size** M; **wave** 6; **pool weight** 1; **1 card**.
- **Merges** B3-G43.
- **Depends on** none.
- **Cards** OP09-022.
- **Where** `dsl.ts` Continuous `playRested`, `flow.ts` `runPlay` `place` (`w.rested = true`), a player-level derive.
- **What** OP09-022: every Character you play (hand or effect) enters rested.

### G51 Effects performed by the opponent: `play`, `addDon`

- **Size** S; **wave** 6; **pool weight** 0; **2 cards**.
- **Merges** B4-G24, B3-G42.
- **Depends on** none.
- **Cards** OP12-075, OP13-119.
- **Where** `run.ts` `play` (frame `player` is always `you`) and `addDon` (`d.pl(you)`), `dsl.ts`, a `may` with `chooser`.
- **What** `play: { player: 'opponent' }` ('your opponent plays up to 1 Character with a cost of 4 or less from their hand', OP13-119) and `addDon: { player: 'opponent' }` as the opponent's optional choice (OP12-075).

### G52 Cost: place this Character or Stage at the bottom of the deck

- **Size** S; **wave** 6; **pool weight** 0; **4 cards**.
- **Merges** B3-G15.
- **Depends on** G1.
- **Cards** OP09-008, OP10-026, OP10-027, OP12-080.
- **Where** `dsl-validate.ts` `cost.move` (hand/trash only), `run.ts` `payCost` via `leaveField(d, id, 'deck', cause cost, { position: 'bottom' })`, `eval.ts` `payable`.
- **What** `{ placeSelf: { zone: 'deck', position: 'bottom' } }` or `from: 'self'` in a cost `move` (OP12-080 Stage, OP10-026, OP10-027, OP09-008).

### G53 `play` the revealed top card of the deck or Life

- **Size** M; **wave** 6; **pool weight** 0; **2 cards**.
- **Merges** B3-G46, B3-G47.
- **Depends on** G17.
- **Cards** OP10-022, OP12-058.
- **Where** `dsl-validate.ts` `play` (zones hand/trash/self only), `run.ts` `play`/`select`.
- **What** `play` a bound revealed card from `deckTop` (OP12-058) or `lifeTop` (OP10-022); a played Life card leaves Life without damage rules but `lifeRemoved` must still fire (question M6b-Q40).

### G54 Filter `sameNameAs` a bound card

- **Size** S; **wave** 6; **pool weight** 0; **1 card**.
- **Merges** B3-G35.
- **Depends on** none.
- **Cards** EB02-039.
- **Where** `dsl.ts` Filter, `eval.ts`, `compile.ts` (cost selectors are not bindable today).
- **What** EB02-039 plays a Character with the same name as the card trashed as a cost; the cost `trash` selector must be able to `bind`.

### G55 `Pick.totalPower`

- **Size** S; **wave** 6; **pool weight** 0; **1 card**.
- **Merges** B3-G44.
- **Depends on** none.
- **Cards** OP09-018.
- **Where** `dsl.ts` `Pick.upTo.totalCost` analogue, `dsl-validate.ts` `pick()`, `run.ts` `select`.
- **What** 'Up to 2 Characters with a total power of 4000 or less' (OP09-018).

### G56 Timing `triggerActivated`

- **Size** S; **wave** 6; **pool weight** 0; **2 cards**.
- **Merges** B4-G9, B3-G54.
- **Depends on** none.
- **Cards** OP11-102, OP13-106.
- **Where** `flow.ts` `answerTrigger`/damage frame, `dsl.ts` `AutoTiming` (`eventActivated` and `blockerActivated` exist).
- **What** `{ event: 'triggerActivated', by: P }` fired when a Life card's [Trigger] is activated, not when it is only added to hand (OP13-106, OP11-102).

### G57 [Trigger] 'add this card to your hand'

- **Size** S; **wave** 6; **pool weight** 0; **3 cards**.
- **Merges** B3-G21.
- **Depends on** none.
- **Cards** OP12-109, OP12-113, ST20-003.
- **Where** `dsl-validate.ts` `moveShape` ('moving from self is not implemented'), `run.ts` `move` (`moveCard(d, f.card, 'hand')` for a card in `resolving`), `flow.ts` `runTrigger` (already skips the trash when the effect moved it, CR 10-1-5-3).
- **What** `move` from `self` to hand (OP12-109, OP12-113, ST20-003).

### G58 Variable-count 'trash any number from your hand' cost feeding a scaled effect

- **Size** M; **wave** 6; **pool weight** 0; **1 card**.
- **Merges** B3-G30.
- **Depends on** none.
- **Cards** ST16-002.
- **Where** `dsl-validate.ts` `pick()` (`inCost` requires `exactly`), `compile.ts`/`bind` on cost selectors, `Ctx.n`.
- **What** Allow `pick: { any: true }` in a `trash` cost and bind the count for `refCount` (ST16-002).

### G59 Timed grant of an attribute

- **Size** S; **wave** 7; **pool weight** 0; **1 card**.
- **Merges** B4-G5 (grant half).
- **Depends on** G3.
- **Cards** OP15-093.
- **Where** `state.ts` `ModKind`, `derive.ts` `Derived.attributes`.
- **What** OP15-093 'gains [Rush: Character] and the <Slash> attribute during this turn'.

### G60 Player restriction: cannot add Life to hand by your own effects

- **Size** S; **wave** 7; **pool weight** 0; **1 card**.
- **Merges** B3-G50.
- **Depends on** none.
- **Cards** ST15-001.
- **Where** `dsl.ts` player Restriction, Leader modifier like `cannotDraw`, `run.ts` `move` (`lifeTop` to hand, `lifeToHand` cost, internal `lifeToHand`).
- **What** ST15-001. Cost included or not: question M6b-Q31.

### G61 Move a Character from the field into a Life area

- **Size** M; **wave** 7; **pool weight** 0; **5 cards**.
- **Merges** B3-G10.
- **Depends on** G1.
- **Cards** EB02-057, OP09-101, OP11-101, OP11-116, OP12-117.
- **Where** `dsl-validate.ts` `moveShape` ('only a hand or trash card moves into Life'), `run.ts` `move` (`unsupported`), `flow.ts` `pushRemove`.
- **What** `move` from `characters` to `life` top, bottom or topOrBottom, face-up or face-down, the OWNER's Life (an opponent's Character goes to the opponent's Life), as an effect, as a cost (OP09-101) and as a replacement payload (OP11-101, needs a ref to the replaced card). Cards: EB02-057, OP09-101, OP11-101, OP11-116, OP12-117.

### G62 Cost `power` on your Leader

- **Size** S; **wave** 7; **pool weight** 0; **2 cards**.
- **Merges** B4-G19.
- **Depends on** none.
- **Cards** EB03-006, EB04-023.
- **Where** `dsl.ts` Cost, `eval.ts` `payable`, `run.ts` `payCost` (a modifier at cost time on the active Leader).
- **What** 'Give your active Leader -5000 power during this turn' as a cost (EB04-023, EB03-006). Signs in question M6b-Q2.

### G63 Hand-zone restriction: 'cannot be played by effects'

- **Size** S; **wave** 7; **pool weight** 0; **1 card**.
- **Merges** B3-G36.
- **Depends on** none.
- **Cards** OP12-036.
- **Where** `eval.ts` `playBlocked` (reads only Leader modifiers), `run.ts` `play` candidate list.
- **What** OP12-036: 'this card in your hand cannot be played by effects'; a normal play from hand stays legal.

### G64 Look at Life cards and re-place them (top or bottom, or all in any order)

- **Size** M; **wave** 7; **pool weight** 0; **4 cards**.
- **Merges** B4-G14, B3-G18.
- **Depends on** none.
- **Cards** EB02-053, OP10-116, OP13-105, ST20-003.
- **Where** `dsl.ts` Action (`lookAtLife` / `rearrangeLife`), `run.ts` (reuse the `lookAtTop` `order` machinery and the top/bottom decision of `move`), `markKnown`.
- **What** Private look at the top Life card of either player then place it top or bottom of that Life (OP10-116, EB02-053, ST20-003) or at the whole Life area in any order (OP13-105). rules-digest 107 and 108: the card returns to its owner's Life, keeps its face state.

### G65 Move a given DON!! card from one card to another

- **Size** M; **wave** 7; **pool weight** 0; **1 card**.
- **Merges** B3-G39.
- **Depends on** none.
- **Cards** EB02-009.
- **Where** `run.ts` new action over `d.card(id).don` counters, `dsl-validate.ts` zone `donGiven`.
- **What** EB02-009: take 1 DON!! given to any Leader or Character and attach it to another card (no state change).

### G66 Permanent `negate` stage

- **Size** M; **wave** 7; **pool weight** 0; **1 card**.
- **Merges** B4-G29.
- **Depends on** none.
- **Cards** OP13-064.
- **Where** `dsl.ts` `Continuous`, `layers.ts` (a negation stage 0 that runs before every other stage; `computePerms` already checks `deriveAt(...).negated` with `upto: 0`), `derive.ts`.
- **What** OP13-064: 'your Leader and all of your Characters that do not have a type including Roger Pirates have their effects negated'. A negated source must stop producing its own permanents.

### G67 `Num` stat of a selector (statOf, totalCost)

- **Size** S; **wave** 7; **pool weight** 0; **2 cards**.
- **Merges** B4-G31, B3-G41.
- **Depends on** none.
- **Cards** OP10-022, OP14-053.
- **Where** `dsl.ts`/`dsl-validate.ts` `num()`, `eval.ts` `numOf`.
- **What** `{ statOf: Selector, stat }` for a permanent that cannot bind (OP14-053 'same as your Leader's base power') and `{ totalCost: Selector }` (OP10-022).

## 3. Design decisions needed (for the lead to decide)

**Decided 2026-11-23 (DECISIONS "M6b-1 decisions"):** the recommendation below is taken for each item. D4 in wave 2, D6 in wave 4, D3 in wave 7 behind an official Q&A check, D2, D8 and D9 in wave 8 after their rulings; D1, D5 and D7 stay stats-only for now and are listed in `docs/BACKLOG.md`.

These are the cards the auditors called unexpressible, or whose primitive changes a rule of the game, plus one the merge surfaced. None blocks waves 1 to 3 except D4 (EB05-052, in the first batch). Each has options and a recommendation; **every item is marked for the lead to decide.** Cards under a decision are excluded from the 'expressible' counts in section 4 until its wave.

### D1 Rules-changing Leaders

- **Cards** OP13-079 Imu, OP13-003 Roger, OP15-022 Brook (weight 9 together). **Source IDs** B4-G25 to B4-G28.
- **What is missing** Imu: deck-building restriction (no Events with cost 2 or more) plus 'at the start of the game, play a [Mary Geoise] Stage from your deck' (needs a whole-deck pool and a `startOfGame` play before the opening draw; RL-30 settles the order). Roger: one DON!! placed in the DON!! Phase is given to the Leader. Brook: 'you do not lose at 0 cards in deck, you lose at the end of the turn' (RL-26 and QA-OP15 already settle the semantics, including that cards added back do not save the player), also needs `mill` (G4).
- **Option A** Three named per-card engine primitives (a `deckRestriction` clause, a `startOfGame` play from deck, a deck-out delay flag, a DON!!-Phase redirect), each in the DSL as a `rules` clause. About 3 M-sized pieces for 3 cards.
- **Option B** A small 'leader rule flags' layer in `Def` (like `donDeckSize`): typed flags read by `setup.ts`/`flow.ts`, set from the script's `rules`. Same work as A with less DSL surface.
- **Option C** Defer: keep the three cards stats-only with the unscripted badge until after wave 8, since their combined weight is 9.
- **Recommendation** C now, B later. The three cards carry almost no play weight. The only part that is cheap and shared is `deckRestriction`, which G12 builds for OP12-001 anyway; so OP13-079's deck rule will exist and only its start-of-game search remains. If the owner wants all three, take B in wave 8. *Lead to decide.*

### D2 Activate an Event from hand or trash by an effect

- **Cards** OP15-014, OP15-046, EB03-031, OP12-041 (weight 16). **Source IDs** B4-G20, B3-G26.
- **What is missing** 'Activate up to 1 {Dressrosa} Event with a base cost of 3 or less from your hand', and EB03-031 'activate the [Main] effect of an Event with cost 7 or less in your trash'. `Action.activate` is `{ ability, of: 'self' }` only.
- **Option A** `activate` with `of: Selector` over hand or trash. From hand: reveal, trash the Event, run its [Main] without paying the printed cost but paying the activation cost written on the card (rules-digest 105 is the precedent: a [Trigger] activation still pays DON!! -2). From trash: run the [Main] only, the card stays. `eventActivated` fires for the hand version (see M6b-Q28).
- **Option B** Defer; cards stay stats-only.
- **Recommendation** A, in wave 8, after an official reading of M6b-Q27 and M6b-Q28. Four cards, weight 16, M size: low priority. *Lead to decide.*

### D3 `redirectAttack`

- **Cards** OP16-080 Teach, OP14-060 Doflamingo Leader (weight 18). **Source IDs** B5-G19, B4-G23.
- **What is missing** 'Change the target of that attack to the selected card' in [On Your Opponent's Attack]. Needs a new action that rewrites `s.battle.target` before the Block Step.
- **Option A** New action in the battle frame (`flow.ts`): set the new target (a legal attack target as RL-17 defines it: the Leader, or a rested Character), keep the attacker's declaration, do not refire [When Attacking], offer a fresh Block Step, and refire `onOpponentAttack` watchers for the new target. RL-19 (QA-OP12 OP12-020) already says an attack redirected to a Leader counts as a Leader battle.
- **Option B** Restrict to 'redirect to your own Leader or a legal Character' only (that is all both cards do).
- **Option C** Defer.
- **Recommendation** B (which is A restricted to what the two cards need), built in wave 7 behind a Q&A check of M6b-Q10. Both are Leaders, so weight grows if either becomes meta; revisit with the weekly `meta:update`. *Lead to decide.*

### D4 Replacement on taking damage

- **Cards** EB05-052 Gloriosa (EB-05, first batch). **Source IDs** B5-G20.
- **What is missing** 'If you would take damage, you may trash this Character instead.' `ReplaceEvent` has `ko` and `leaveField` only and `collectReplacements`/`offerReplacement` serve only `ko`/`remove` frames; `runDamage` has no offer step.
- **Option A** Add `{ damage }` to `ReplaceEvent`, an offer step in the damage frame before the Life card moves, payload `trashSelf`; if applied, no Life card is taken and no [Trigger] (rules-digest 103; M6b-Q8). L-sized: a new frame interaction.
- **Option B** Script Gloriosa's [Trigger] only and leave the replacement out. Violates the 'fully scripted' bar of PLAN §2.
- **Option C** Defer the card to the backlog with a reason in `standard.json` `gaps`.
- **Recommendation** A, wave 2, because EB-05 is the first batch and one unscripted card of 55 stalls the set's close-out. The same offer machinery is reused by D6. If the lead wants to cap wave 2, C costs one card. *Lead to decide.*

### D5 Whole-side [On Play] negation

- **Cards** OP09-081 (weight 14). **Source IDs** B3-G40.
- **What is missing** 'Your [On Play] effects are negated' (permanent) and 'your opponent's [On Play] effects are negated until the end of your opponent's next turn'. Negation today is per card.
- **Option A** A player-level flag read in `flow.ts` `fire` for `'onPlay'` (from a permanent on the Leader, and a timed modifier on the opponent's Leader like `cannotDraw`). Open: whether a [Trigger] [On Play] activation and `activate onPlay` count.
- **Option B** Defer until an official ruling covers the open points.
- **Recommendation** B. One card, weight 14, L size, with two ruling points unanswered. Schedule A in wave 8 only if a ruling appears. *Lead to decide.*

### D6 Replacement created by an Event for the rest of the turn

- **Cards** EB02-030 (weight 161). **Source IDs** B3-G52.
- **What is missing** 'If any of your Characters would be K.O.'d in battle during this turn, you may trash 1 card from your hand instead' ([Counter]). A replacement is a printed ability today; `state.mods` holds modifiers only and `collectReplacements` reads definitions.
- **Option A** New action `addReplacement { replaces, optional, instead, duration }`, a `Modifier` kind carrying the payload, and `collectReplacements` reading `state.mods`; needs the `battle` cause of G11. It may apply to every K.O. that turn (no Once Per Turn in the text).
- **Option B** Approximate with a timed `cannotBeKOdInBattle`: wrong (the player may decline, and pays a card).
- **Option C** Defer.
- **Recommendation** A, wave 4 (after G11 and D4's offer machinery). The card is the heaviest of the decision items (weight 161), so it is worth an L. *Lead to decide.*

### D7 Watcher registered by an Activate effect

- **Cards** OP12-020 Roronoa Zoro Leader (weight 3). **Source IDs** B3-G32.
- **What is missing** '[Activate: Main] ... if this Leader battles your opponent's Character during this turn, set it as active.' `delayed` supports only `at: 'endOfThisTurn'`.
- **Option A** `delayed` with an event key (`{ at: { event: 'battle', ... }, once: true }`) in `state.delayed`, fired from the battle frames.
- **Option B** Defer.
- **Recommendation** B. Weight 3, L size. The other half of the card is G47 (cannotAttackTarget), which is cheap and lands in wave 5 regardless. *Lead to decide.*

### D8 Delayed effect at the start of the opponent's next Main Phase

- **Cards** PRB02-005 (weight 16). **Source IDs** B3-G34.
- **What is missing** 'Your opponent rests 1 of their active DON!! at the start of their next Main Phase.' `delayed` has one timing.
- **Option A** Add `at: 'startOfOpponentsNextMainPhase'` with a replay hook where `flow.ts` enters the Main Phase (not `startOfYourTurn`, which fires earlier), body `rest` on the opponent's cost-area DON!!. M, and the same plumbing as G39.
- **Option B** Defer.
- **Recommendation** A in wave 8: the delay machinery exists, the cost is one timing and one hook, and the plumbing is warm from G39. *Lead to decide.*

### D9 Effect acting on the event's subject

- **Cards** OP16-079 Yamato Leader (weight 19). **Source IDs** B5-G18 (part b).
- **What is missing** 'When a {Land of Wano} Character is played from your trash, that Character gains [Rush].' `Selector.lki: 'subject'` exists in `dsl.ts` but the validator rejects it and nothing implements it.
- **Option A** Set a `Ctx.subject` in `fire` for `cardPlayed` (the played card) and accept `Selector.lki: 'subject'` (or `from: 'subject'`) in the validator and `eval.ts`. Needs G25 for the `from: 'trash'` qualifier.
- **Option B** Defer.
- **Recommendation** A, wave 8 (M). It is generic: any later 'that card' auto effect reuses it. *Lead to decide.*

Smaller decisions already folded into gaps (listed so they are not lost): the 'A or B' cost of OP17-020 has a clean DSL answer (`oneOf`, G19); the once-per-turn K.O. shield of OP10-118 is a mandatory once-per-turn replacement (G11, M6b-Q36); the `lookAtTop` opponent look-only and `topAnyOrder` forms (G31) are plain extensions.

## 4. Waves for M6b-2

Rules used. Eight to ten items per wave, ordered so the first scripting batch is unblocked first: EB-05 (wave 1 covers every EB-05 gap except Gloriosa, which is D4 in wave 2), then OP-18 (not imported; see the note below), then block 5 (waves 1 to 3 cover every block 5 gap except the held decisions), then the heaviest remaining pool weight. Dependencies and shared plumbing are respected: replacement work together (G11, G14, D4, D6), the `rest()` hook together (G2 then G24 and G37), the DON!! donor work together (G20, G16, G34). Each primitive gets a planted test that fails when its implementation is reverted, and `ENGINE_VERSION` is bumped once at the end of each wave.

'Expressible' means every gap a card needs is built and the card is not under a pending decision. Share of cards is over the 1,175 audited; share of weight is over 16904 (EB-05 has no weight). Baseline before any wave: 883 cards (75.1 %), weight 13086 (77.4 %).

| Wave | Items | New cards expressible | Their weight | Cumulative cards | Cumulative share of cards | Cumulative share of weight | EB-05 expressible (of 55) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 (today) | none | 883 | 13086 | 883 | 75.1 % | 77.4 % | 41 |
| 1 | 10 | 106 | 1828 | 989 | 84.2 % | 88.2 % | 54 |
| 2 | 10 | 29 | 668 | 1018 | 86.6 % | 92.2 % | 55 |
| 3 | 10 | 44 | 420 | 1062 | 90.4 % | 94.7 % | 55 |
| 4 | 10 | 35 | 678 | 1097 | 93.4 % | 98.7 % | 55 |
| 5 | 10 | 25 | 127 | 1122 | 95.5 % | 99.4 % | 55 |
| 6 | 10 | 22 | 2 | 1144 | 97.4 % | 99.4 % | 55 |
| 7 | 10 | 20 | 18 | 1164 | 99.1 % | 99.5 % | 55 |
| 8 | 6 | 11 | 77 | 1175 | 100.0 % | 100.0 % | 55 |

### Wave 1 (EB-05, block 5 core)

- 10 items: G1 Cost on your own field Characters: trash, return to hand, bottom of deck, K.O.; G2 Restriction `cannotBeRested`; G3 Filter `attribute`; G4 Action `mill` (effect form); G5 Action `activate` of the card's own [On K.O.] or [Counter]; G6 K.O. protection scoped by cause; G7 Cost `giveDon` (active DON!! to a Leader or Character); G8 Cost `turnLifeFaceDown`; G9 Cost `returnDon` restricted to active cost-area DON!!; G10 Restriction `cannotActivateBlocker` on the blocking card.
- Unblocks 106 cards (weight 1828); cumulative 989 of 1175 (84.2 %), weight share 88.2 %.
- Why first: it contains every gap EB05-008, 010, 011, 016, 031, 040, 048, 049, 050, 055, 057, 059 and 060 need, plus the costs and filters of block 5 (ST32 cards through the `attribute` filter, OP16/OP17 cards through the own-Character cost). G2 (`cannotBeRested`, ST32-002 and OP16-032 in block 5, weight 424) and G5 (the six OP16 [Trigger] cards) are in wave 1 on weight and block 5 grounds, not because EB-05 needs them. After wave 1, 54 of 55 EB-05 cards are expressible; the one left is EB05-052 (D4).

### Wave 2 (rest of block 5, replacement family, D4)

- 10 items: G11 Replacement `ko` with a cause; G12 `rules` clauses `anyNumberInDeck` and `deckRestriction`; G13 Filter `nameIncludes`; G14 Replacement scope: `leaveField` with any cause; one replacement covering two events; G15 `Num` count of distinct card names; G16 `giveDon` to up to N chosen targets, up to M each; G17 `lookAtTop` take `to: 'play'`; G18 Action `ko` on a Stage; G19 Cost alternatives `oneOf`; D4 (decision) Replacement on taking damage.
- Unblocks 29 cards (weight 668); cumulative 1018 of 1175 (86.6 %), weight share 92.2 %.
- Closes every remaining block 5 gap except the timings of wave 3, the `cardPlayed` qualifiers (OP16-079 is also D9) and OP16-080 (D3).

### Wave 3 (block 5 timings, DON!! donor and hand-trash family)

- 10 items: G20 Give the opponent's DON!! to the opponent's cards; G21 Player restriction `cannotSetDonActive` by Character effects; G22 Timing: cards trashed from hand by an effect; G23 `Num` division (floor); G24 Timing `rested` / `becameRested`; G25 `cardPlayed` timing qualifiers: origin zone and `via`; G26 Per-turn history conditions (K.O.'d this turn, Event activated this turn); G27 Action `returnDon` for the opponent; G28 `[On K.O.]` qualified by the K.O. cause; G29 Timing `removed` / `leftField` (a card leaves the field).
- Unblocks 44 cards (weight 420); cumulative 1062 of 1175 (90.4 %), weight share 94.7 %.
- Closes block 5 (OP16-041, OP16-024, OP16-100, OP16-074, ST32-003) except the two cards under decisions (OP16-079 needs D9, OP16-080 needs D3).

### Wave 4

- 10 items: G30 Life to trash: top Life card as an effect, a cost or a replacement payload; G31 `lookAtTop`: opponent's deck look-only, and `topAnyOrder`; G32 Grant: can also attack active Characters; G33 Action `swapBasePower`; G34 Filter `donGiven` and per-target `Num`; G35 Action `winGame`; G36 Action `damage`; G37 Replacement for being rested; G38 Timing `koed` for the opponent's Characters; D6 (decision) Replacement created by an Event for the rest of the turn.
- Unblocks 35 cards (weight 678); cumulative 1097 of 1175 (93.4 %), weight share 98.7 %.

### Wave 5

- 10 items: G39 `delayed` steps that remember bound cards; G40 `donReturned` qualifiers: minimum count at once, cause; G41 Life face-state: turn all face-down, face-up Life condition; G42 Cost `returnDon` with a variable count; G43 Timing `damageTaken`; G44 'Choose a cost' plus reveal the opponent's deck top and compare; G45 Action `move` from `lifeTopOrBottom` to hand; G46 K.O. protection with a source filter (attacker or effect source); G47 Timed restriction `cannotAttackTarget: Filter`; G48 `skipRefresh` for an opponent's rested DON!!.
- Unblocks 25 cards (weight 127); cumulative 1122 of 1175 (95.5 %), weight share 99.4 %.

### Wave 6

- 10 items: G49 Filter on printed effects ('no base effect', 'without a [When Attacking] effect'); G50 Permanent: Characters you play enter rested; G51 Effects performed by the opponent: `play`, `addDon`; G52 Cost: place this Character or Stage at the bottom of the deck; G53 `play` the revealed top card of the deck or Life; G54 Filter `sameNameAs` a bound card; G55 `Pick.totalPower`; G56 Timing `triggerActivated`; G57 [Trigger] 'add this card to your hand'; G58 Variable-count 'trash any number from your hand' cost feeding a scaled effect.
- Unblocks 22 cards (weight 2); cumulative 1144 of 1175 (97.4 %), weight share 99.4 %.

### Wave 7

- 10 items: G59 Timed grant of an attribute; G60 Player restriction: cannot add Life to hand by your own effects; G61 Move a Character from the field into a Life area; G62 Cost `power` on your Leader; G63 Hand-zone restriction: 'cannot be played by effects'; G64 Look at Life cards and re-place them (top or bottom, or all in any order); G65 Move a given DON!! card from one card to another; G66 Permanent `negate` stage; G67 `Num` stat of a selector (statOf, totalCost); D3 (decision) `redirectAttack`.
- Unblocks 20 cards (weight 18); cumulative 1164 of 1175 (99.1 %), weight share 99.5 %.

### Wave 8 (conditional on the lead's decisions)

- 6 items: D2 (decision) Activate an Event from hand or trash by an effect; D5 (decision) Whole-side [On Play] negation; D7 (decision) Watcher registered by an Activate effect; D8 (decision) Delayed effect at the start of the opponent's next Main Phase; D9 (decision) Effect acting on the event's subject; D1 (decision) Rules-changing Leaders.
- Unblocks 11 cards (weight 77); cumulative 1175 of 1175 (100.0 %), weight share 100.0 %.
- Only after the lead accepts D1, D2, D5, D7, D8 and D9; D3, D4 and D6 sit in waves 7, 2 and 4. Drop any item the lead defers: the plan loses only the listed cards.

Placement: all 67 gaps and the 9 decisions are placed; wave 7 has 9 gaps plus D3, and wave 8 is entirely decision-dependent. With the tail waves 5 to 7 carrying weight 127, 2 and 18 they are the first to cut if M6b-2 runs over its 120 h: waves 1 to 4 reach 93.4 % of cards and 98.7 % of weight.

**OP-18.** It is not imported (STATUS: pending upstream), so no auditor saw it. After the stats-only import, run this audit's method on its cards (about 100 to 180 cards): most new constructs will already be in G1 to G67, and any delta should be added to wave 1 or 2 so that the first batch is not blocked. The same applies to the up to 100 cards whose legality is not yet cited.

## 5. Engine defects found by the audit (bugs today, not missing features)

I checked every code claim the auditors made that read like a defect. Only one holds in part; the others are missing features or latent traps.

### 5.1 A `trash` cost with `from: 'characters'` (block5.md B5-G2): confirmed in part, no current script uses it

- **Validation.** Confirmed by running `validateScript` on OP01-055 with its cost replaced: `{ trash: { from: 'characters', owner: 'you', pick: { exactly: 1 } } }` returns no error. The `trash` branch of `cost()` in `cards/src/dsl-validate.ts` (lines 501 to 512) only calls `selector()` and checks for a `pick`; it does not call `zonesIn` as the `rest` and `move` branches do. By contrast a `move` cost from `characters` is rejected (`a cost moves cards from a hand or trash only`) and there is no `ko` cost at all, so the field cases are blocked for those two and open only for `trash`.
- **Runtime.** `payCost` in `engine/src/effects/run.ts` (line 468) selects the cards and calls plain `moveCard(d, id, 'trash', { revealed: true, extra: { reason: 'cost' } })`. **The auditor's claim that given DON!! are not returned is wrong:** `moveCard` itself (`engine/src/ops/index.ts` lines 96 to 116) detects `FIELD.has(from)`, returns the card's given DON!! to the cost area rested (`DonReturned`), drops its modifiers, rekeys it and records a last-known snapshot. And `leaveField` is only `moveCard` with a `cause` argument (lines 180 to 190). What the plain call really skips: (a) `opts.cause`, so the `CardMoved` event carries no `cause` and the last-known snapshot says `{ kind: 'rule', by: owner }` instead of `{ kind: 'cost' }`; (b) no `pushRemove`/`pushKo` frame, so no removal event can be observed by a future `removed`/`leftField` timing (G29) and no replacement or removal-proofing check is possible (for a trash cost nothing needs it today, since RL-15 says a trash cost is not a K.O. and an own-cost removal is not an opponent's effect; but it becomes wrong the day a 'removed from the field' watcher or a removal replacement can see costs); (c) `costIsSecret` (eval.ts line 327) treats every `trash` cost as paid from hidden cards, which is wrong for a face-up field card.
- **Does any script use it?** No. I grepped all 181 scripts under `cards/effects` (a regex over every `trash:` block for `characters`, `stage` or `field` in the next 220 characters, plus every `cost: [ ... ]` array for `trash`/`move` from a field zone): zero hits. The only `from: 'characters'` costs are `rest` costs (OP01-055).
- **Severity and fix.** Low today (no script, output differs only in the event's cause and the secrecy flag), but it is a trap for the first scripter of OP16-008 or EB05-060: the validator accepts it. G1 fixes both: route the field case through `pushRemove`/`pushKo` with `cause.kind: 'cost'` and make `cost()` zone-check `trash`. Until G1 lands, add the zone check alone (one line) if anyone scripts before wave 1.

### 5.2 Latent traps (not bugs today, because no current script depends on them)

- **`ko` replacement ignores the cause.** `collectReplacements` (`engine/src/flow.ts` lines 819 to 822) offers a `ko` replacement for every K.O., battle included. The four current scripts that use `replaces: { ko }` (OP12-061, EB04-030, EB04-031, OP17-023) are all worded without a qualifier, so they are right. A scripter who writes `ko` for 'K.O.'d by your opponent's effect' (13 cards, G11) would silently protect against battle. G11 removes the trap; until then the validator should reject any new `ko` replacement whose card text contains 'effect'.
- **`cannotBeKOd` blocks every cause** (`runKo`, flow.ts line 720). Correct for the unqualified wording (RL-14). A scripter mapping 'cannot be K.O.'d by effects' to it over-protects (15 cards across G6 and G46). Same remedy: add the qualified forms, and until then reject scripts whose text says 'by effects' or 'in battle'.
- **`hasBaseEffect` would misread unscripted cards** (G49): `Def.abilities` is empty for any unscripted card, so a filter written on it treats every unscripted card as 'no base effect'. Not a defect now (the filter does not exist), but design it on the printed text.
- **`mill` cost versus effect.** The cost form raises an anomaly when the deck is shorter than n (`payCost` line 509); the effect form (G4) must clamp instead, as the auditors note. `payable` already refuses the cost, so the anomaly is unreachable for costs.
- **The block 4 audit's claim that `ko` on a Stage 'returns when the card is not in `characters`'** is true (`runKo` line 714) and silent, but unreachable: the validator rejects it (G18).

I did not re-audit the 'none' rows (block4.md section 3b lists the nuances the block 4 auditor verified); I checked only the code claims above, which are the ones that could be bugs.

## 6. Card-data problems found by the audit

All 1,120 backlog cards and all 55 EB-05 cards are `verified: false` in `cards/data/sets/*.json`. The route for every item is the same: fix it at scripting time with a verification override in `cards/overrides/<ID>.json` (a `textFixes` entry, kind `cleanup` or `sign`, plus `keywords` where needed), compare against the official card list or a card image, and only then set the script's `textHash` (PROMPT.md M1; E-Q8 and E-D7). Nothing below is a guess to be scripted as is.

| Card(s) | Defect | Proposed fix | Question |
| --- | --- | --- | --- |
| ST32-001, ST32-003, ST32-004, ST32-005 (ST32-002 is unaffected) | Attribute icon name dropped: 'rest your attribute Leader', 'has the attribute', 'if your Leader has the attribute'. All five ST-32 cards are <Slash> in the set JSON. | Restore `Slash` through `textFixes` (cleanup); confirm against the official list. Prerequisite of G3 for these cards. | M6b-Q1 |
| EB03-014 Kuina | Same defect: 'give up to 2 rested DON!! cards to your attribute Leader'. | Restore the attribute name from the official text. | M6b-Q1 |
| OP15-102 Gan.Fall | Sign missing: 'give this card in your hand 3 cost'. | `sign` fix to -3 (siblings OP15-013 and OP15-021 read -2 and -3). | M6b-Q2 |
| OP11-023 Arlong | Sign missing: 'give this card in your hand 3 cost' (ST26-001 and PRB02-014 print -5 and -3). | `sign` fix to -3 after a second source. | M6b-Q2 |
| EB03-006 Nami | 'You may give your active Leader 5000 power ...: draw 1' reads as a buff cost. | `sign` fix to -5000 (EB04-023 reads -5000). | M6b-Q2 |
| OP14-016 X.Drake, OP13-017 Dragon | Replacement payloads 'give your Leader / this Character 2000 power instead' have no sign. | Proposed +2000; confirm. | M6b-Q2 |
| EB02-005 Fake Straw Hat Crew | '[Opponent's Turn] Give this Character 2000 power': sign missing; most likely -2000. | Check the printed card before scripting; do not script on the proposed reading. | M6b-Q2 |
| PRB02-017 Boa Hancock | No timing header on the [Once Per Turn] trash-cost effect. | Probably [Activate: Main]; confirm and restore the header. | M6b-Q3 |
| OP17-043 Ganzui, EB05-061 Nami, EB04-044 Koby | Qualifier possibly dropped: 'would be removed from the field' / 'removed from the field by your opponent' (no 'effect'). | Compare with the official text; these decide G14 versus a plain `leaveField` replacement. | M6b-Q5 |
| EB05-001, EB05-057, OP16-039, OP16-043, OP16-014 | Scrape typos: 'more-1000 power' (missing space), 'If your have 2 or less Life', 'a cost or 3 or less' (of), 'tour opponent's', 'this character'. | `textFixes` cleanup; the whole EB-05 set (55 cards, optcgapi only) needs verification before scripting. | M6b-Q4 |
| OP14-119, OP14-120, EB04-025 | 'a cost or 9 or less', 'a Character 1ith a cost of 0', 'places 1 card from your hand at the bottom of their deck' (their hand). | `textFixes` cleanup; readings do not change. | M6b-Q4 |
| Keyword-only cards: OP12-050, OP12-106, OP11-090, OP10-012, OP10-064, OP09-054, OP09-071, OP09-091, ST21-007, OP16-044, OP16-088, EB04-035, EB03-019, ST29-011, OP04-077 | The set JSON `keywords` arrays are empty for unverified cards (22 of 2,860 cards have any), so a bare [Blocker] card has no keyword at runtime. | Verified override with `keywords: ['Blocker']`, no script body. The list is the keyword-only cards the auditors tagged; block 4's table has more [Blocker]/[Rush] cards that also carry effects and are not listed here. | n/a |
| OP16-039 and similar cards with rewritten text | The audit's `none` rows rely on the verified text; every card of the slice is unverified. | Verify in the wave that scripts it; the M6b-4 review checks it. | n/a |

## 7. Open questions

One list for all three audits, numbered M6b-Q1 to M6b-Q40. 'Answer on file' marks questions that `docs/research/rulings.md` (RL), `docs/research/rules-digest.md` (RD) or `docs/OPEN-QUESTIONS.md` already settle or bear on; where an answer exists and differs from the auditor's proposed reading, the difference is stated. Proposed readings are the auditors', not rulings.

| ID | Card(s) | Question | Proposed reading | Source | Answer on file |
| --- | --- | --- | --- | --- | --- |
| M6b-Q1 | ST32-001/003/004/005, EB03-014 | Attribute name dropped from the verified text. | Slash for ST-32; Kuina probably Slash too. Restore from the official list (section 6). | B5-Q1, B4-Q1 | No (data defect) |
| M6b-Q2 | OP15-102, OP11-023, EB03-006, OP14-016, OP13-017, EB02-005 | Signs lost on power and cost values. | -3, -3, -5000, +2000, +2000; EB02-005 most likely -2000 but unconfirmed. | B4-Q2, B4-Q3, B3-Q1, B3-Q2 | Route only: OPEN-QUESTIONS E-Q8 says check each by hand at M1 verification |
| M6b-Q3 | PRB02-017 | No timing header on the effect. | Lost [Activate: Main]. | B3-Q3 | No |
| M6b-Q4 | EB05-001, EB05-057, OP16-039, OP16-043, OP16-014, OP14-119, OP14-120, EB04-025 | Scrape typos; EB-05 is optcgapi-only and unverified. | Fix as cleanups; verify EB-05 against the official list before scripting. | B5-Q2, B4-Q17 | No (data) |
| M6b-Q5 | OP17-043, EB04-044 | 'Would be removed from the field' with no 'by your opponent's effect': does it cover a battle K.O. and your own effects? | If the text is really unqualified, yes: any cause (G14). If the qualifier was dropped it is a plain `leaveField` with `opponentEffect`. | B5-Q3, B4-Q16 (a) | Partly: RL-33 and RL-11 cover only the base-power part of OP17-043 (QA-OP17); scope not covered |
| M6b-Q6 | OP13-046 | One replacement covering 'K.O.'d' and 'removed by your opponent's effect': one Once Per Turn use shared across both? | Yes, one shared use (`replaces` as a list). | B4-Q16 (b) | Partly: RL-31 allows one application to cover several simultaneous events; shared Once Per Turn not covered |
| M6b-Q7 | EB05-061 | Replacement text says 'removed from the field by your opponent' (no 'effect'). | Read as 'by your opponent's effect', as OP15-035; confirm the printed text. | B5-Q4 | No |
| M6b-Q8 | EB05-052 | 'If you would take damage, you may trash this Character instead': is the damage not dealt at all? | Not dealt at all: no Life card, no [Trigger], for battle and effect damage, and Gloriosa must be on the field. | B5-Q5 | Partly: RD 103 (a replacement that stops the Life card going to hand stops the [Trigger]) and RL-22 support it; no Q&A on the card |
| M6b-Q9 | OP16-034 | '+1000 for each of your Characters with a different card name': count distinct names including this card, or other Characters whose name differs from this one? | Distinct names among your Characters including itself. | B5-Q6 | No |
| M6b-Q10 | OP16-080, OP14-060 | After the target is changed: Block Step again? [When Attacking] refired? Is the new target a Leader or Character battle? May the new target be rested, or must it be a legal attack target? Does `lockAttackTarget` still apply? | Battle continues at the Block Step against the new legal target; [When Attacking] does not refire; `onOpponentAttack` refires for the new target. | B5-Q7, B4-Q12 | Partly: RL-19 (QA-OP12 OP12-020) says an attack redirected to a Leader counts as a Leader battle; RL-17 gives legal targets |
| M6b-Q11 | OP16-079 | 'When a {Land of Wano} Character is played from your trash': any play by any effect, 'that Character' is the card just played? | Yes to both. | B5-Q8 | No |
| M6b-Q12 | OP01-120 | 'Cannot activate a [Blocker] Character with power 2000 or less during this battle': read when a block is declared or at resolution? | At block time (current power). | B5-Q9 | No |
| M6b-Q13 | OP16-116, OP17-034, OP17-103, EB05-033, OP02-013 | 'Then' after an 'if' that fails: is the Then clause gated? | Put the 'Then' inside the `if`. The auditor also floated a stronger reading for OP16-116 (the Life step does not need the condition). | B5-Q10 | **Answered:** OPEN-QUESTIONS M4b-5 (closed 2026-11-16, official Q&As) and RD 122 (CR 4-10-1, 8-3-3): a 'Then' after a failed 'If' does not resolve. So OP16-116's Life step is gated; the stronger reading is wrong |
| M6b-Q14 | OP17-117 | Trigger: opponent may trash 3, else K.O.: what if they have fewer than 3 cards? | They cannot trash, so the K.O. happens; the opponent chooses before the target is picked. | B5-Q11 | Partly: RD 120 (a cost that cannot be paid cannot be paid at all) is for costs, not this 'may' |
| M6b-Q15 | OP17-099 | Mode 1 and 2 wording: whose hand, who picks? | 'Your' is the Leader's controller; mode 2 trashes from the opponent's hand, blind, chosen by the controller. | B5-Q12 | Partly: OPEN-QUESTIONS E-Q5 and QA-OP17 OP17-099 settle who chooses in the blind trash |
| M6b-Q16 | OP17-057, OP16-001 | 'Up to 1 of your Leader ... or up to 1 of your Characters ...' (and OP16-001's power condition): one target in total, and does the power condition apply to both choices? | One target in total over Leader and Characters; the condition applies to both. | B5-Q13, B5-Q21 | No (wording convention) |
| M6b-Q17 | EB05-010 | 'Characters with the Wisdom attribute and without [Blocker]' K.O.'d: printed values or last-known? | Printed values until `lki` exists; note it in the script's `rulings`. | B5-Q14 | **Answered:** OPEN-QUESTIONS M4b-2 accepts the printed-value reading for a card read from the trash |
| M6b-Q18 | OP04-083 | Does 'none of your Characters can be K.O.'d by effects until the start of your next turn' cover Characters that arrive later? | Only those on the field when it resolves; it covers the opponent's whole turn. | B5-Q15 | Partly: RL-10 (QA-OP06 OP06-074) settles the duration; later arrivals not covered |
| M6b-Q19 | EB05-048, EB05-049, OP16-008 | K.O. or trash of your own Character as a cost: is a K.O. cost a K.O.? | A K.O. cost is a K.O. ([On K.O.] fires, replacements apply); a trash cost is not. | B5-Q16 | **Answered:** RL-15 and RD 109 (trash is not a K.O.); RL-16 (a Character that cannot be K.O.'d by effects cannot pay a K.O. cost, QA-OP05 OP05-087) |
| M6b-Q20 | OP16-041 | 'Removed from the field': any move off the field by either player, with the type read as it left? | Yes, any move; printed type until `lki` exists. | B5-Q17 | No (last-known part same as M4b-2) |
| M6b-Q21 | OP16-022 | 'If the only Characters on your field are {Impel Down} Characters' with no Characters: true? | Auditor: vacuously true. | B5-Q18 | **Answered by analogy, opposite:** OPEN-QUESTIONS E-Q4 (QA-OP17 OP17-118): 'only Characters without a Counter' is false with 0 Characters. Script OP16-022 as false at 0 Characters unless the wording differs |
| M6b-Q22 | OP16-100 | 'An opponent's Character has been K.O.'d this turn': any cause, either player's doing, replaced K.O.s excluded? | Any K.O. of an opponent's Character this turn; a K.O. that a replacement stopped does not count. | B5-Q19 | No (the auditor's text says 'including one that a replacement did not stop', which is ambiguous; ask) |
| M6b-Q23 | EB05-043 | 'K.O. or rest up to 1' target choice order. | Choose K.O. or rest first, then the target (a `chooseOne`). | B5-Q20 | No |
| M6b-Q24 | OP15-003, OP15-010, OP15-012, OP15-017, OP15-026, OP15-023, OP15-025, OP15-028 | Whose DON!! is given, and which state? | A rested DON!! from the opponent's cost area to the opponent's Leader or Character; Arlong/Kuro/Meowban: any DON!! there, active or rested, chosen by the controller. | B4-Q4 | No |
| M6b-Q25 | OP15-023, OP14-024, EB03-012, EB03-061, OP10-033 | Does 'cards' include DON!!? For 'will not become active' too? | Rest: yes (as E-Q3); skip-refresh: field cards only. | B4-Q5 | Partly: OPEN-QUESTIONS M4b-1 and E-Q3 (rest includes DON!!); skip-refresh not covered |
| M6b-Q26 | OP15-073, EB03-010 | 'One card or the other' versus 'up to one of each'. | One card in total from either description. | B4-Q6 | No |
| M6b-Q27 | OP15-014, OP15-046, EB03-031, OP12-041 | Event activated by an effect: cost paid, where does the Event go? | No play cost, goes to the trash; from the trash only the [Main] runs and the card stays; the card's own activation cost is still paid. | B4-Q7 | Partly: RD 105 (a [Trigger] 'activate [Main]' still pays the [Main]'s own DON!! -2, QA-GR) and RD 123 (activation procedure) |
| M6b-Q28 | same four cards | Does it count as 'activating an Event' for `eventActivated` watchers? | The hand version does, the trash version does not. | B4-Q8 | Partly: RD 105 only |
| M6b-Q29 | EB03-003, EB03-007, EB03-009, EB03-039, EB04-052, EB04-010 | 'No base effect': does a keyword-only card count? 'Same as your opponent's Leader': power or base power? 'Set power to 0': base or final? | Keyword-only counts as none; base power; `setBasePower` 0 for the turn. | B4-Q9 | No |
| M6b-Q30 | OP14-021, OP14-027, OP14-028, OP14-032, OP14-035, OP14-119, OP14-070 | Does resting by attacking or blocking count as 'becomes rested'? Cost payment? | Every active-to-rested transition except Refresh; OP14-070 only by an opponent's Character effect. | B4-Q10 | No |
| M6b-Q31 | OP14-045, OP14-049, OP14-056, OP12-040, ST15-001 | Does a cost count as 'by an effect' for 'trashed from hand by an effect' and 'cannot add Life using your own effects'? | Auditors: costs are not effects, count once per effect resolution. | B4-Q11, B3-Q4, B3-Q5 | Conflicts: RD 112 (CR 8-1-1, an effect is the instruction together with its cost) and RL-16 (a K.O. cost is stopped by 'cannot be K.O.'d by effects') both treat the cost as part of the effect. Ask before scripting; the existing `cannotDrawByOwnEffects` ruling (OP12-099) excludes only the Draw Phase |
| M6b-Q32 | OP13-003 | DON!! Phase redirect: active or rested, and the first player's one placement? | Placed then given (rested until Refresh); with one placement, that one is given. | B4-Q13 | Partly: RL-23 (QA-OP13) says with no DON!! on the field the DON!! go to the cost area |
| M6b-Q33 | OP13-028 | 'You cannot play cards from your hand': `cannotPlay` has no zone scope. | Add `from: 'hand'` to the restriction. | B4-Q14 | No (an engine point; no ruling needed) |
| M6b-Q34 | OP13-066 | 'Add 1 DON!! and set it as active at the end of this turn': when is it added? | The add happens at the end of the turn, placed active (delayed `addDon` active). | B4-Q15 | No |
| M6b-Q35 | OP11-066, OP11-071, OP11-073, OP11-074, OP11-079, OP11-081 | 'Choose a cost and reveal the top card of the opponent's deck': range, what stays public, empty deck. | 0 to 10; the revealed card stays on top and public; a Leader-less deck never matches; empty deck fails. | B3-Q6 | No |
| M6b-Q36 | OP10-118 | 'Once per turn, cannot be K.O.'d by your opponent's effects': first K.O. prevented, later ones happen? | Yes, the protection is spent when it prevents. | B3-Q7 | No |
| M6b-Q37 | OP12-096 | 'You may select ... cost 6 or less instead.' | Equivalent to `if` then cost <= 6 else cost <= 4. | B3-Q8 | No |
| M6b-Q38 | OP11-092 | Played Character already gone at end of turn. | Nothing happens; otherwise bottom of its owner's deck as an effect. | B3-Q9 | No |
| M6b-Q39 | OP09-101 | A cost that moves an opponent's Character into their Life. | Controller's optional cost; unpayable without a matching Character; the player chooses top or bottom. | B3-Q10 | No |
| M6b-Q40 | OP10-022 | Revealed Life card played: Life leaves as a play, not damage; `lifeRemoved` fires? | Played face-up from Life; `lifeRemoved` fires; unplayed stays in Life. | B3-Q11 | Partly: RD 104 (Life movement outside damage never activates [Trigger]) and RD 107 |

Status count: **answered on file 4** (M6b-Q13, M6b-Q17, M6b-Q19, M6b-Q21; M6b-Q21 is answered by analogy and contradicts the auditor's reading); **partly answered, or in conflict with a ruling on file 14** (M6b-Q2, M6b-Q5, M6b-Q6, M6b-Q8, M6b-Q10, M6b-Q14, M6b-Q15, M6b-Q18, M6b-Q25, M6b-Q27, M6b-Q28, M6b-Q31, M6b-Q32, M6b-Q40; M6b-Q31 is the one where the auditors' reading conflicts with RD 112 and RL-16); **open 22**, of which M6b-Q1, M6b-Q3, M6b-Q4 are data defects settled at verification, not rulings.
