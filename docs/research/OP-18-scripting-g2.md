# OP-18 scripting: readings, group g2

Same method as `OP-18-scripting.md`: every card's text was compared with the official OP-18 series page (`?series=569118`, read by hand 2026-11-27) and its override cites that page (`verified: true`). Readings that follow the proposed reading of `m6b-audit/OP-18.md` section 4 say so. About 5 author tests per card in `engine/test/cards/<ID>.test.ts`; constants in `helpers-op18-g2.ts`. Every card in the group is scripted; none needs a new DSL shape.

### OP18-041 Ms. All Sunday (Leader)
When your Character with a type including "Baroque Works" and 3000 base power or more is K.O.'d, draw 1 card, and your opponent trashes 1 card from their hand.
- `koed` auto, filter Character, `typeIncludes` Baroque Works, `basePower >= 3000` (printed power; a buffed 1000 does not count, as OP13-002). The opponent chooses the trash (`chooser: opponent`). No Once Per Turn on the text, so each K.O. fires it.

### OP18-029 Tony Tony.Chopper
[Rush] [When Attacking] [Once Per Turn] Give up to 3 rested DON!! cards to your Leader and set this Character as active. Then, this Character will not become active in your next Refresh Phase.
- `giveDon` 3 rested to the Leader (the engine asks how many, up to 3), `setActive` self, `skipRefresh` self. Audit Q15 family: "Then" is not "If you do", so the Refresh skip applies even with no DON!! to give; it ends after your next Refresh Phase.

### OP18-030 Nami
[Opponent's Turn] If this Character is rested, give this Character -2000 power.
- `permanent` with `opponentsTurn` and `self state rested`: a continuous -2000 while both hold, not a one-time debuff.

### OP18-032 Buggy
[On Play]/[On K.O.] Up to 1 of your opponent's rested Characters with 8000 power or less will not become active in your opponent's next Refresh Phase.
- One ability, two timings, `skipRefresh` on a rested opponent Character with current `power <= 8000`.

### OP18-033 Banban
[Blocker] [End of Your Turn] You may trash this Character: Set up to 1 of your Characters as active.
- `endOfYourTurn` with cost `trashSelf` (optional by construction); Banban is already gone when the pick is made, so he is not a target. No Once Per Turn.

### OP18-036 Monkey.D.Luffy
[End of Your Turn] You may trash this Character: Draw 1 card and set your Leader as active.
- Cost `trashSelf`; `draw 1`, `setActive` your Leader.

### OP18-037 Yokozuna
[Blocker] [On K.O.] Rest up to 1 of your opponent's cards.
- Audit Q16, as OP14-024 (M6b-Q5): the opponent's Leader, Characters, Stage and active cost-area DON!!.

### OP18-039 Gum-Gum Giant Axe
[Counter] Up to 1 of your [Monkey.D.Luffy] gains +2000 power during this battle. Then, if your Leader is active, draw 1 card.
- "[Monkey.D.Luffy]" is read as a Leader or Character of yours named Monkey.D.Luffy (the card gives power, so a Leader or Character on the field). The draw has its own `if` (Leader `state active`), independent of whether a Luffy was picked. The Leader is read after the +2000, which does not change its state.

### OP18-040 Diable Jambe Flambe Shot
[Main] K.O. up to 1 of your opponent's rested Characters with a cost of 7 or less. [Trigger] Rest up to 1 of your opponent's Characters with a cost of 7 or less.
- `ko` rested, cost <= 7; [Trigger] `rest` cost <= 7.

### OP18-042 Hack
[On K.O.] Draw 1 card. [Activate: Main] [Once Per Turn] Give up to 1 rested DON!! card to 1 of your {Dressrosa} type Leader or Characters.
- As OP12-031: exactly 1 target card (Hack himself is {Dressrosa}), 1 rested DON!! ("up to": nothing moves with none).

### OP18-044 Mr.Beans & Miss.Katherina
[DON!! x1] +1000 power. [On Play] Draw 1 card and trash 1 card from your hand.
- `draw 1` then `trashFromHand` exactly 1 of your choice (the drawn card may be the one trashed), as ST32-003.

### OP18-045 Mr.Prince
Also treat this card's name as [Sanji] according to the rules. This Character gains +1000 power for every 5 Events in your trash.
- `rules.alsoNamed ['Sanji']`; the boost is OP12-070's (floor of Events / 5, your trash only).

### OP18-046 Mr.0 & Ms. All Sunday
[On Play] Draw 2 cards and give your Leader and all of your Characters up to 2 rested DON!! cards each. [On Your Opponent's Attack] You may trash 1 card from your hand: The base power of your Leader with a type including "Baroque Works" becomes 7000 during this turn.
- `giveDon n 2, rested, each` to the Leader and every Character (Mr.0 himself included, he is on the field when it resolves); the engine asks a count per target and, when the rested DON!! cannot cover all of them, which ones. [Opponent's Attack]: cost `trash 1`, `setBasePower 7000` `thisTurn` on a Leader whose type includes Baroque Works (nothing happens to another Leader, the cost is still paid).

### OP18-047 Mr.1(Daz.Bonez)
[On Play] Your Leader with the {Cross Guild} type or a type including "Baroque Works" gains [Unblockable] during this turn.
- `grant Unblockable thisTurn` on the Leader filtered `type Cross Guild` or `typeIncludes Baroque Works`.

### OP18-048 Mr.1 & Miss Doublefinger / OP18-052 Mr.5 & Miss.Valentine
[On Play] Play up to 1 Character card with a type including "Baroque Works" and a cost of 5 (048) or 3 (052) or less from your hand.
- `play` from hand, category Character, `typeIncludes Baroque Works`, cost limit, `upTo 1`. 048 has [Rush]; 052 has [DON!! x1] +1000.

### OP18-049 Mr.2.Bon.Kurei(Bentham)
[On Play] Look at 5 … reveal up to 1 card with a type including "Baroque Works", add it to your hand and place the rest at the bottom in any order. Then, give up to 1 rested DON!! card to your Leader or 1 of your Characters.
- `lookAtTop 5` take `upTo 1` `typeIncludes`, rest `bottomAnyOrder`; then `giveDon n 1 rested` to exactly 1 Leader or Character (as OP12-031). "Then" is not "If you do": the DON!! goes out whether or not a card was taken.

### OP18-050 Mr.3 & Miss.Goldenweek
[Blocker] [On Play] If your Leader's type includes "Baroque Works", up to 1 of your opponent's Characters with a cost of 7 or less cannot attack until the end of your opponent's next End Phase.
- `if leader typeIncludes`, then `restrict cannotAttack` `untilEndOfOpponentsNextTurn`.

### OP18-051 Mr.4 & Miss.MerryChristmas (audit Q11, proposed reading followed)
[DON!! x1] +1000 power. [On Play] You may rest 5 of your DON!! cards: Place up to 1 Character with a cost of 6 or less and up to 1 Character with a cost of 5 or less at the bottom of the owner's deck in any order of the owner's choosing.
- Cost `restDon 5`. Two `select`s (the second `not ref` the first) and ONE `move` over both to the bottom of the owners' decks, so when both belong to the same player the engine asks that player the order (the audit feared two moves; one move over the union avoids it). "Character" is either field's, Mr.4 himself included (he is a legal pick). **Ambiguity for a ruling:** the audit's open question is whether the two-Character pick is "up to 1 and up to 1" (each may be empty, as scripted) with the order chosen by each owner; no official Q&A was read.

### OP18-053 Mr.7 & Miss.Father'sDay
[On Play] Look at 3 cards from the top of your deck, reorganize them in any order and place them at the top or bottom of your deck.
- `lookAtTop 3`, rest `topOrBottomAnyOrder`, as OP17-050 (QA-OP17: all at the top or all at the bottom).

### OP18-054 Mr.8 & Ms. Monday (audit Q4, proposed reading followed)
[DON!! x1] +1000 power. [Opponent's Turn] [Once Per Turn] If your Character with a type including "Baroque Works" would be removed from the field by your opponent's effect, you may trash 1 card from your hand instead.
- `replacement` (`opponentsTurn`, Once Per Turn), `leaveField` of your Baroque Works Characters (Mr.8 included), `cause opponentEffect`, instead cost `trash 1`. With an empty hand it is offered but cannot be accepted (hidden-zone cost rule). One effect that removes two such Characters is one event and one replacement keeps both (the engine's reading of QA-OP15 OP15-069, `groupMates`); **a ruling should confirm this for a trash-a-card payment**, since two Characters are saved for one card.

### OP18-055 Mr.9 & Ms. Wednesday
[DON!! x1] +1000 power. [On Play] Return up to 1 of your opponent's Characters with a cost of 2 or less to the owner's hand.
- `move` to hand, opponent's Characters cost <= 2, `upTo 1`.

### OP18-056 Mr.13 & Ms.Friday
[DON!! x1] +1000 power. [On Play] You may place 1 of your Characters with a type including "Baroque Works" other than this Character at the bottom of your deck: Your opponent trashes 1 card from their hand.
- Cost `move` (exactly 1, `typeIncludes`, `isSelf false`) to the deck bottom (a single card, so no order); effect `trashFromHand` chosen by the opponent. Unpayable with no other Baroque Works Character.
