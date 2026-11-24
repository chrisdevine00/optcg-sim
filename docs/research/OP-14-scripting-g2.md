# OP-14 scripting, group 2 (OP14-035 to OP14-061)

Readings and ambiguities, one per card. Scripts: `cards/effects/OP-14/`; tests: `engine/test/cards/OP14-0xx.test.ts`; helpers: `engine/test/cards/helpers-op14g2.ts`. Open questions stay open (M6b-Q10, Q11, Q31, Q46).

Scripted (22): 035, 036, 037, 038, 039, 040, 042, 043, 044, 045, 046, 047, 048, 049, 050, 052, 054, 056, 057, 058, 059, 061.

Left unscripted (1):

- **OP14-051 Hatchan** "[DON!! x2] [On K.O.] Draw 1 card." Needs the **given DON!! count as last known at the K.O.** (a gap the audit missed: it listed the card as "none"). `donGiven: 2` on an `onKO` auto reads `s.cards[self].don` at resolution (`engine/src/effects/eval.ts` line 238), when the card is already in the trash and its given DON!! have gone back to the cost area (`leaveField` in `ops/index.ts` computes `lki.don` but `runKo` in `flow.ts` passes only `{ cause }` to `fire`). So the script with `conditions: [{ donGiven: 2 }]` validates and never fires. Failing case kept out of the repo (a Hatchan with `don: 2` K.O.'d by an opponent effect draws 0, expected 1): `scratchpad/op14g2-051-failing-case.test.ts`. Shape missing: a condition reading the K.O.'d card's last-known given DON!! (e.g. `{ donGiven: n }` resolved against the K.O. event's `lki.don` when the ability resolves from an `onKO`), next to G28's `koCause`. Any other `[DON!! xN]` with `[On K.O.]` has the same need.

Readings:

- **OP14-035 Yosaku** "[Your Turn] When this Character becomes rested": `rested` timing, `filter: { isSelf: true }`, `yourTurn` as an ability condition. Any active-to-rested change counts (attack, effect, cost), per the wave 3 reading of M6b-Q10. The target is "up to 1 rested Character with cost 4 or less", chosen on resolution (skipRefresh with a `pick`).
- **OP14-036 / 037 / 038 "rest N of your cards"**: the cost is `rest` over Leader, Characters, Stage and `donCostArea` (as EB05-019), `costOptional` on the Events. The [Trigger] of 036 is a trigger with a `rest` cost: the player chooses whether to activate the Trigger; the cost is then paid (no second decline), as OP17-076 and EB05-053.
- **OP14-037 For Fun**: "rested Characters with 7000 base power or less" uses `basePower`, `state: rested`.
- **OP14-038**: "Draw 1 card and rest up to 1" is two plain steps; the draw does not depend on the rest.
- **OP14-039 Coffin Boat**: "If your Leader is [Dracule Mihawk]" is an `if` step on the Leader's name, for both effects; "set up to 1 of your DON!! cards as active" is `setActive` over `donCostArea` with `upTo: 1`.
- **OP14-040 Jinbe (Leader)**: "[Activate: Main] You may trash 1 card from your hand:" is a cost without `costOptional` (not an Event); "give up to 2 rested DON!! cards to 1 of your ..." is `giveDon` n 2 rested to exactly 1 Leader or Character (the engine asks the count).
- **OP14-042 Arlong**: the "If your Leader has the {Fish-Man} type" is an `if` step wrapped around the whole look; "cost of 2 or more" is `cost: { gte: 2 }` on the looked-at cards. Rest to the bottom in any order.
- **OP14-044 Edward.Newgate**: RL-44 reveal: a hit draws 2 (the revealed card is the first drawn) then trashes 1 from hand; a miss leaves the card on top.
- **OP14-045 / 049 / 056 "When a card is trashed from your hand by an effect"**: `trashedFromHand`, `owner: 'you'`, no `by` (an effect of either player counts: M6b-Q11), no `includeCosts` (a trashed-as-cost card does not count: M6b-Q31). A card trashed from the opponent's hand does not count. Rush is granted until end of turn.
- **OP14-056 Wadatsumi**: "cannot attack" is a permanent `cannotAttack` on itself; the negation (`negate` self, this turn) removes it, so Wadatsumi can attack that turn (tested). Reading: the same negation also negates the trashed-from-hand ability itself, which is harmless.
- **OP14-046 Koala**: "[Activate: Main] You may trash this Character:" is `trashSelf` with no `costOptional`. The target is chosen after the cost, so Koala itself can never be the target.
- **OP14-048 Shiryu**: "Then, trash all cards from your hand" is not "if you do": it runs even when no Character was returned. `trashFromHand` with no `pick` is every card.
- **OP14-049 Jinbe**: "return up to 1 Character with a cost of 7 or less" is either player's Character, your own included (`owner: 'any'`); 058 and 059 likewise. "You may rest 2 of your DON!! cards" is `restDon: 2` as an auto cost.
- **OP14-054 Fisher Tiger**: "Trash cards from your hand until you have 5" is a `forEach` over `hand - 5` trashing 1 each time (the owner chooses each card); hand of 5 or fewer does nothing (the audit's note on `forEach` with a count of zero or below).
- **OP14-057**: "All of your {Fish-Man} or {Merfolk} type Leader and Character cards" is a power step with no `pick` (every match), this turn.
- **OP14-058**: "return up to 1 Character with 6000 base power" is `basePower: { eq: 6000 }`, either player's, and may be the Character just played; with no match nothing is asked (a public zone).
- **OP14-059**: "If your Leader is [Jinbe] and you have 2 or less cards in your hand" counts the hand after the Event has left it (the Event is being resolved). Both conditions are public, so no prompt leaks the hand.
- **OP14-061 Vergo**: the replacement is Once Per Turn and optional, `leaveField` of `{Donquixote Pirates}` Characters by the opponent's effect (Vergo included), the payload `returnDon: 1` (any DON!! on the field). Engine behaviour worth a review: two {Donquixote Pirates} Characters removed by one effect are a group, shielded by one acceptance and one returned DON!! (both stay); a second removal in the same turn is not offered. DON!! -1 on [When Attacking] is the usual optional DON!! cost; the -2000 is "up to 1".
