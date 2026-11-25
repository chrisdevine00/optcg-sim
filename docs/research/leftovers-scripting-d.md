# Leftovers scripting, group D: readings

Scripted after the gap branch ([m6b-wave8a.md](m6b-wave8a.md)): the three gap cards of [m6b-audit/leftovers.md](m6b-audit/leftovers.md). All three are verified (Limitless cross-check, 2026-11-24); the hashes are those of the verified text in `cards/data`.

## ST33-004 Borsalino

During the turn in which a card in your hand is trashed by an effect, give this card in your hand −3 cost. [Blocker]

- `permanent` with `zone: 'hand'`, condition `{ handTrashedThisTurn: 'you' }` (G69), `cost` −3 on this card. [Blocker] is the keyword of the data, not an ability.
- Reading (M6b-Q87): your own hand, an effect of either player, a cost included (M6b-Q31), earlier in the same turn (also before this card was drawn); the discount ends with the turn. A card that leaves the hand otherwise (played, returned to the deck) does not count.
- The reduced cost is the one paid to play it (6 to 3, floored at 0 by the cost layer); on the field the card costs its own 6.

## ST28-004 Kouzuki Momonosuke

[Your Turn] If you have 2 or less Life cards, your Leader gains +1000 power. [Activate: Main] [Once Per Turn] You may return 2 total of your currently given DON!! cards to your cost area rested: This Character gains [Rush] and +1000 power during this turn.

- First ability: `permanent`, `yourTurn` and `cmp [life you] <= 2`, Leader `power` +1000 (0 Life counts).
- Second: `activate`, `oncePerTurn`, cost `{ returnGivenDon: 2 }` (G70), `grant Rush` and `power` +1000 on this card for the turn.
- Reading (M6b-Q88): the 2 come from any of your Leader and Characters in any split (this Character's own given DON!! included); they go rested to the cost area and stay on the field, so nothing is returned to the DON!! deck. The +1000 does not replace the power the returned DON!! gave this Character.

## OP11-088 Shu

[Blocker] [Once Per Turn] This effect can be activated when your opponent's Character attacks. If that Character has the <Slash> attribute, this Character gains +5000 power during this battle.

- `auto` on `onOpponentAttack`, `oncePerTurn`, `optional` ("can be activated", W57-R5), `keywords: ['Blocker']`, ability condition `{ attackerIs: { category: ['Character'] } }`, effect `if { attackerIs: { attribute: 'Slash' } }` then `power` +5000 on this card `duration: 'battle'` (G71).
- Reading (M6b-Q89): a Leader's attack neither offers nor spends it; a non-Slash Character's attack, when used, spends the Once Per Turn and adds nothing (the colon-less "If" is an effect condition, DECISIONS 2026-11-24 B3A-R1); the player may decline the prompt and keep the use for a later attack; the attribute is the attacker's current one (a granted attribute counts, G59).
- Shu is also a Blocker, so the boosted 10000 power matters in the Block Step it is chosen for.
