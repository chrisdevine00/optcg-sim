# ST-33 / ST-34 / ST-35 / ST-36 starters and block X / block 1 exceptions: scripting readings (group 2)

Method: docs/runbooks/new-set.md step d. 19 of 21 cards scripted; 2 left stats-only. ST-33, ST-35 and ST-36 are not in `m6b-audit/block5.md` (they got their block on 2026-11-24), so they were audited by hand against the DSL.

## Left unscripted

- **ST33-004 Borsalino** ("During the turn in which a card in your hand is trashed by an effect, give this card in your hand -3 cost."). Needs a per-turn history condition "a card in your hand was trashed by an effect this turn" (a hand-zone permanent reading a turn log). Nearest audit rows: **G22** (timing, cards trashed from hand by an effect, wave 3) and **G26** (per-turn history conditions, K.O.'d / Event activated this turn): neither names this exact shape, so it is a new `Condition` such as `{ trashedFromHandThisTurn: P, by: 'effect' }` plus the hook in `moveCard` hand to trash (same hook as G22). Whether a cost trash counts is M6b-Q31. Not scriptable today; a script with the cost always applied or never applied would be wrong.
- **ST36-005 Eustass"Captain"Kid.** Two missing shapes. (1) [On Your Opponent's Attack] "Change the target of the attack to your [Eustass"Captain"Kid] with 5000 base power or more": **D3 `redirectAttack`** (design item, wave 7). (2) Cost "turn 1 card from the top **or bottom** of your Life cards face-down" / "face-up": `turnLifeFaceDown` (G8, wave 1, merged) is the top card only; `turnLifeFaceUp` is `number` only; neither has a top-or-bottom choice. The activate half (give a rested DON!! to the Leader after turning a Life card face-up) would need the top-or-bottom variant, so the card stays whole and unscripted.

## Readings

- ST33-002 Sakazuki, [When Attacking]: "If your opponent has 6 or more cards in their hand" is read after the cost (the hand count is the opponent's, so paying the cost does not change it). The opponent chooses what to trash.
- ST33-003 Smoker: both cards go to the opponent's deck bottom; one owner, several cards, so the owner is asked the order (engine 0.5.8 field-case rule). "Up to 2" with one pick asks nothing.
- ST33-005 Monkey.D.Garp: "If your Leader has the {Navy} type" is an effect condition on a comma-less "If" after [On Play] (no colon), so it is a `conditions` entry on the auto (the ability does nothing otherwise, nothing is asked). "blue" is the `color: 'Blue'` filter (a multicolor card with Blue counts); "other than [Monkey.D.Garp]" excludes every card with that name, including a second copy in hand.
- ST34-005 / ST35-001: "base power 2000 or less" is `basePower`, so a Character at 0 power this turn but base 3000 is not a candidate (pinned in ST35-001 with Lindbergh).
- ST35-003 Karasu: the cost "trash 2 cards from the top of your deck" is `{ mill: 2 }`; it cannot be paid with 1 card in the deck (the engine does not offer the ability).
- ST35-004 Koala / ST35-005 Kuma: "This Character gains [Blocker] and +1 cost" is a field permanent. In hand the card keeps its printed cost (7 and 5), on the field it is 8. "Then, play" is not "If you do": the play step runs whether or not a rested DON!! card was given (not testable: paying the card's cost always leaves rested DON!! in the cost area). The play may come from hand or trash.
- ST36-002 Killer: "[Your Turn] [On Play]" is the On Play gated by `yourTurn`, so a copy played by its [Trigger] on the opponent's turn adds no Life. The [Trigger] "If your opponent has 3 or less Life cards, play this card" has a comma, so it is an effect condition: the Trigger can be activated and does nothing at 4 or more (the card then goes to the trash like any unused Trigger).
- ST36-003 Scratchmen Apoo [Trigger]: "Draw 1 card and your {Supernovas} type Leader's base power becomes 7000": the draw is unconditional; the base power applies only to a {Supernovas} Leader, this turn.
- EB04-061 Luffy: "If you have 1 or less Life cards" is `life <= 1` (0 counts) for the in-hand -1 cost. On Play "Then, this Character gains [Blocker]": both halves follow the paid cost; duration `untilEndOfOpponentsNextTurn` (as OP17-005).
- OP04-083 Sabo: Q15. `cannotBeKOd: { cause: 'effect' }` on all your Characters present when it resolves, until the start of your next turn; Characters played afterwards are not covered (pinned). Battle K.O. is unaffected (pinned).
- OP03-122 Sogeking: "Return up to 1 Character with a cost of 6 or less": either player's Character, Sogeking (cost 7) not eligible. "Then, draw 2 and trash 2" is unconditional.
- OP02-013 Ace: Q10, "Then, if your Leader's type includes ..." is its own condition (Rush is granted with no chosen target). `typeIncludes` on the Leader.
- OP01-120 Shanks: Q9. Approximation: the filter (a [Blocker] with 2000 or less power) is read when [When Attacking] resolves. A Blocker that is pumped above 2000 later in the same battle stays locked; one pumped down to 2000 after resolution is not locked. Nothing in the pool changes power between [When Attacking] and the Block Step on its own, so the approximation matters only in rare lines.

## Data note (not changed)

157 of the 367 Characters whose `effectText` names [Blocker] (e.g. OP02-012, OP03-010, OP03-015; not EB01-017) have `[Blocker]` in `effectText` but no `Blocker` in `keywords` in `cards/data` (no override yet), so the engine does not treat them as Blockers. Test constants here use cards whose `keywords` is set.
