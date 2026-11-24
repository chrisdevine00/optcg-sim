# API gaps: ST-32 to ST-36 independent tests, group B

None of these stopped a test from being written. Each says what the public API leaves open and how the tests cope.

1. **"Cannot be rested" has no view flag** (ST32-002). `CardView` shows `cannotAttack` but nothing for "cannot be rested", so the tests observe the effect: the Character is missing from the legal attackers on the opponent turn, offers no `block`, and stays active when an opposing "rest up to 1" picks it.
2. **A "rest your Leader or 1 DON!!" cost is a `mode` choose** (ST32-001) with the option labels "rest 1 of your cards" and "rest 1 DON!!". `restVia` in `kit-stb5b.ts` picks by label; when only one way can pay the engine asks nothing and `restVia` does nothing.
3. **"Add up to 1 card from the top of your deck to your Life" is an `optional`** (ST36-001, ST36-002), not a `choose`; "use ...: add the top card of your deck to the top of your Life cards?". The tests answer it with `yes` / `no`.
4. **Several cards placed at a deck bottom from the field ask their owner an `order`** (ST33-003): the opponent gets an `order` decision for their own Characters. `legal()` lists `{ type: 'order', first }` with instance ids; the tests read the card with `g.card(first)`.
5. **A sole candidate for a pick is resolved by the engine** (the Leader for ST35-004 / 005 "give to your Leader" is still asked as a `choose` with min 0, but a hand cost with one card is asked). `mayPayHand` accepts both.
6. **[Once Per Turn] state is not readable.** ST34-001 is tested by counting DON!! after two returns in one turn (two Tamagos) and again on the next own turn.
7. **The opponent-turn half of "[Your Turn]" needs a DON!! return on the opponent turn** (ST34-001): only an Event [Counter] with DON!! -1 (OP07-076) can cause one, so the test plays it as a Counter and checks no count question appears.
8. **Own-turn [On K.O.] cannot be reached with this scenery** (ST33-002, ST34-001): an attacker is never K.O.ed by its own attack, and the repository's removal Events only hit the opponent's Characters, so [On K.O.] is tested on the opponent turn (battle K.O. and Gum-Gum Lightning).
9. **Scenario DON!! and deck counts.** A scenario needs `costArea` reduced to leave DON!! in the DON!! deck for the add and the DON!! −N tests (ST34-001, 002, 005).
10. **Order of two simultaneous own effects** (Tamago's K.O. then Katakuri's add, ST34-001) is not asked: the engine resolves Tamago first, then asks Katakuri's count. The tests do not assert the order, only that both resolve.
