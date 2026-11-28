# OP-18 scripting: readings, group g3

Every card's text was compared with the official OP-18 series page (`?series=569118`, read by hand 2026-11-27, per the brief); overrides cite it (`verified: true`). About 5 author tests per card in `engine/test/cards/<ID>.test.ts`; constants in `helpers-op18-g3.ts`. Open questions with a proposed reading in `docs/research/m6b-audit/OP-18.md` §4 are followed and named in each script's `rulings`.

### OP18-060 Saint Gunko (Leader)
[Once Per Turn] When a Character is played from your trash, draw 2 cards and trash 1 card from your hand. [Activate: Main] [Once Per Turn] You may trash 1 card from your hand: If you have a Character with 8000 base power or more, add up to 1 DON!! card as active from your DON!! deck.
- `auto` `cardPlayed` by you from the trash, Character, OPT (audit Q18: any play from the trash, by any effect); `draw 2`, `trashFromHand 1` (plain steps). `activate` OPT, cost `trash 1`, effect-level `if exists` Character `basePower >= 8000` then `addDon active upTo 1` (colon-less "If" is an effect condition: cost and OPT are spent when it fails).

### OP18-079 Spandam (Leader)
[Activate: Main] You may rest 2 of your DON!! cards and this Leader and trash 1 card with a type including "CP" from your hand: Add up to 1 card from the top of your deck to the top of your Life cards.
- `activate` with cost `restDon 2`, `restSelf`, `trash 1 typeIncludes CP`; `move` deck top `upTo 1` to the top of Life (face-down). No Once Per Turn on the text (the rest cost limits it). The engine asks a yes/no for the deck card (hidden), then adds it.

### OP18-057 Atomic Dicer
[Main] You may rest 3 of your DON!! cards: Return up to 1 Character with a cost of 5 or less to the owner's hand. [Counter] Your Leader gains +3000 power during this battle.
- Event `main` with `restDon 3`, `costOptional`; any owner's Character, `upTo 1`, `move` to hand. `counter`: Leader +3000 `battle`.

### OP18-058 This Kingdom is Doomed. You Can't Save It!
[Main] You may return 1 of your Characters to the owner's hand: Place up to 1 Character with a cost of 4 or less at the bottom of the owner's deck. [Trigger] Activate this card's [Main] effect.
- `main` cost `move` your Character to hand (`costOptional`), effect `move` any Character cost <= 4 `upTo 1` to deck bottom; the returned Character is no longer a target. [Trigger] `activate main of self`. With one Character the cost picks it without a choice.

### OP18-059 I Pray For Your Success.
[Main] You may rest 1 of your DON!! cards and trash 1 card with a type including "Baroque Works" from your hand: Draw 2 cards. [Counter] You may trash 1 card from your hand: Up to 1 of your Leader or Characters gains +3000 power during this battle.
- Both costs optional (Event); the [Main] cost is `restDon 1` plus `trash 1 typeIncludes Baroque Works`. [Counter] as OP02-068.

### OP18-063 Kiwi & Mozu
[On Play] You may K.O. 1 of your Stages with a cost of 5 or less: Add up to 1 DON!! card as rested from your DON!! deck.
- `auto` `onPlay`, cost `ko` your Stage cost <= 5 (wave G2), effect `addDon rested upTo 1`.

### OP18-064 Saint Killingham (Purple)
[Your Turn] [On Play] DON!! −1: Up to 1 of your opponent's Characters with 7000 base power or less and up to 1 of your opponent's Characters with 5000 base power or less cannot attack until the end of your opponent's next End Phase. [On K.O.] DON!! −1: Play this Character card from your trash.
- Audit Q11: two `restrict cannotAttack`, the second excluding the first pick (`not ref`). **Ruling candidate:** a player who picks a 5000-or-less Character for the 7000 slot leaves no one for the second slot; the script asks the 7000 slot first and does not optimise for the player. `[Your Turn]` is an ability condition; the [On K.O.] replay does the [On Play] again if it is your turn (an optional DON!! −1).

### OP18-065 Saint Gunko (Character, block X)
[Blocker] [On Play] DON!! −1: Play up to 1 {Celestial Dragons} type Character card with 6000 power or less from your trash.
- `keywords: [Blocker]`; `auto onPlay` cost `donMinus 1`, `play` from the trash, Character, type Celestial Dragons, `power <= 6000`, `upTo 1`. Block X is data (override).

### OP18-067 Charlotte Smoothie
[On Play] You may trash 1 {Big Mom Pirates} type card from your hand: Draw 2 cards.
- cost `trash 1 type Big Mom Pirates` (any category), effect `draw 2`.

### OP18-068 Senor Pink
[Once Per Turn] If this Character would be K.O.'d, you may DON!! −1 instead. [On Play] DON!! −1: Up to 1 of your opponent's Characters with a cost of 7 or less cannot be rested until the end of your opponent's next End Phase.
- `replacement` OPT on `ko` of itself, any cause, `instead returnDon 1` (as OP12-070). [On Play] as OP18-027's second sentence with a cost <= 7 pick and a DON!! −1 cost.

### OP18-069 Sodomu & Gomora
If your {The Franky Family} type Character would be K.O.'d, you may DON!! −1 and rest this Character instead.
- Audit Q4: `replacement` on `ko` of your {The Franky Family} Characters (itself included), `instead [returnDon 1, restSelf]`; both halves are paid together, so a rested Sodomu & Gomora or no DON!! on the field means it is not offered. No Once Per Turn.

### OP18-071 Trebol
[Once Per Turn] If your {Donquixote Pirates} type Character would be removed from the field by your opponent's effect, you may DON!! −1 instead. [Opponent's Turn] If your Leader is {Sugar}, this Characters gains [Blocker] and +2000 power.
- `replacement` as OP14-061. Audit Q12: the printed "this Characters" is read as "this Character", and "{Sugar}" (braces, but no card has that type; OP10-003 is the Leader named Sugar) as a Leader named [Sugar]. **Needs a ruling** if Bandai means a type.

### OP18-080 Van Augur
[Your Turn] [Once Per Turn] When a card is trashed from your hand by your [Marshall.D.Teach] Leader's effect, if you have no other [Van Augur], draw 1 card. [On K.O.] Draw 1 Card.
- Audit Q6 (follows M6b-Q31, still open): `trashedFromHand` by you, `includeCosts`, `sourceFilter name Marshall.D.Teach`; the "if no other [Van Augur]" is an effect condition (spends the OPT when it fails). The tests plant a stand-in [Activate: Main] on OP09-081 (not scripted yet).

### OP18-081 Oars
If you have a [Gecko Moria] Character, this Character gains [Double Attack] and [Blocker]. [Trigger] Play up to 1 {Thriller Bark Pirates} type Character card with a cost of 4 or less from your trash rested.
- `permanent` with `exists` a Character named Gecko Moria on your field, two `grant`s; [Trigger] as OP14-089.

### OP18-082 Catarina Devon
[When Attacking] This Character's base power becomes the same as your opponent's Leader's power during this turn. [On K.O.] You may trash 1 card from your hand: If your Leader has the {Blackbeard Pirates} type, play this Character card from your trash rested.
- Audit Q13: `setBasePower` `thisTurn` with `statOf` the opponent Leader's current power, read once when the effect resolves. [On K.O.] cost `trash 1`, effect-level `if leader type Blackbeard Pirates` then play itself rested.

### OP18-083 Saint Killingham (Black)
[Your Turn] [On Play] Play up to 1 [Sleeptids] from your trash. [On K.O.] You may trash 2 cards from your hand: Play this Character card from your trash.
- `onPlay` with `yourTurn` condition, `play` name Sleeptids from the trash `upTo 1`; [On K.O.] cost `trash 2`, play itself. Its own [On Play] does not fire when it is replayed on the opponent's turn.

### OP18-084 Saint Gunko (Black Character)
[On Play] Look at 4 cards from the top of your deck; reveal up to 1 {Holy Knights of God} type card and add it to your hand. Then, trash the rest. [Activate: Main] You may rest 4 of your DON!! cards: Play up to 1 {Holy Knights of God} type Character card with a cost of 6 or less from your trash.
- `lookAtTop 4`, take `upTo 1` type Holy Knights of God, revealed, rest to the trash; `activate` with cost `restDon 4`, no Once Per Turn. With no match the pick is asked at max 0 (hidden-gate rule).

### OP18-085 Cerberus
[Activate: Main] You may return this Character to the owner's hand: Up to 1 of your [Saint Shamrock] Characters gains [Rush], [Banish] or [Unblockable] during this turn.
- Audit Q17: cost `move` self to hand; `chooseOne` of three grants, the Character picked inside the branch. Gated on a public fact (`exists` a Saint Shamrock Character) so the keyword choice is not asked when nothing could receive it.

### OP18-086 Goldberg, OP18-087 Stansen, OP18-089 Dorry, OP18-091 Brogy
This Character gains +12 cost. (plus:)
- 086 [On K.O.] K.O. up to 1 of your opponent's Characters with a cost of 4 or less (`ko upTo 1`). 087 If you only have Characters with a cost of 12 or more, +2000 power: `none` of your Characters with `cost <= 11` (read after the cost modifier, as OP17-080; Stansen is always on the field with cost 15). 089 [On Play] You may trash 1 card from your hand: Your opponent trashes 1 card from their hand (`chooser opponent`; empty hand: nothing, your cost is still paid). 091 [When Attacking] You may trash 1 card from your hand: Add up to 1 of your Character cards with a cost of 2 or less from your trash to your hand (the card trashed as the cost is itself a legal pick).
- `permanent` `cost +12` on `self` (field only; in hand the printed cost stays), as OP17-089 and OP17-092.

### OP18-088 Saint Sommers
[Your Turn] [On Play] If you have 6 or more DON!! cards on your field, K.O. up to 1 of your opponent's Characters with a base cost of 4 or less. [On K.O.] You may trash 2 cards from your hand: Play this Character card from your trash.
- Effect-level `if cmp donOnField >= 6` (cost area plus given DON!!, active or rested); `baseCost <= 4`. Played from hand (cost 6) the condition always holds, so the "fewer than 6" case only arises when it comes back from the trash.
