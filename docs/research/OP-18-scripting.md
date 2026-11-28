# OP-18 scripting: readings

OP-18 entered from Limitless card pages (ADR 0015); every scripted card's text was compared with the official OP-18 series page (`?series=569118`, read by hand 2026-11-27) and its override cites that page (`verified: true`). Hashes are those of the verified text in `cards/data`. About 5 author tests per card in `engine/test/cards/<ID>.test.ts`; set-ups in `helpers-op18.ts` (unscripted Stages OP03-075, OP05-040, OP06-041, ST01-017 and vanilla {Straw Hat Crew} / {Water Seven} Characters as scenery).

## Slice 1: the Franky (OP18-021) and Luffy (EB02-010) decks

### OP18-021 Franky (Leader)
All Stage cards in your hand have a +3000 Counter. [Activate: Main] [Once Per Turn] DON!! −1: Play up to 1 Stage card with a cost of 5 or less from your hand.
- `permanent` `counter` on `{ from: 'hand', owner: 'you', filter: category Stage }`, value 3000; `activate` OPT `donMinus 1`, `play` Stage cost ≤ 5 from hand, `upTo 1`.
- Needs wave G1: CR 7-1-3-1-1 names Character cards (the only cards with a printed Counter, CR 2-10-2). The card's first line has no use unless a Stage with a Counter may be trashed in the Counter Step, so the engine treats it as a Character Counter (OPEN-QUESTIONS M6b-Q94; no official Q&A for OP-18 was read).

### OP18-026 Sanji
If your {Straw Hat Crew} type Character would be removed from the field by your opponent's effect, you may trash this Character instead.
- `replacement` `leaveField` (your Characters, type Straw Hat Crew, `cause: opponentEffect`), optional, instead `trashSelf`. Unlike OP15-094 there is no "other than this Character", so Sanji covers itself (a return to hand becomes a trash, the player's choice). No Once Per Turn.

### OP18-027 Zoro & Sogeking
[Opponent's Turn] The base power of your active [Monkey.D.Luffy] Leader with 3 or more DON!! cards given becomes 7000. [On Play] Set up to 2 of your DON!! cards as active. Then, up to 1 of your opponent's Characters with a cost of 6 or less cannot be rested until the end of your opponent's next End Phase.
- `permanent` with condition `opponentsTurn`, `setBasePower` 7000 on your Leader filtered `name Monkey.D.Luffy`, `state active`, `donGiven >= 3`. Read continuously: it stops as soon as the Leader is rested (for instance by attacking, which happens only on your turn) or loses DON!!.
- [On Play]: `setActive` cost-area DON!! `upTo 2`, then `restrict cannotBeRested` `untilEndOfOpponentsNextTurn` (as OP14-033).

### OP18-031 Nico Robin (block X)
[Opponent's Turn] If your Character would be removed from the field by your opponent's effect, you may rest this Character instead. [End of Your Turn] Set up to 1 of your {Water Seven} type cards and up to 1 of your DON!! cards as active.
- `replacement` with condition `opponentsTurn`, `leaveField` any Character of yours (Robin included), `cause opponentEffect`, instead `restSelf` (a rested Robin cannot pay, as OP10-032). No Once Per Turn.
- [End of Your Turn]: `setActive` a {Water Seven} Leader, Character or Stage `upTo 1`, then `setActive` cost-area DON!! `upTo 1`. An already active card may be chosen (it changes nothing), as elsewhere.

### OP18-034 Franky
[On Play] Play up to 1 {The Franky Family} or {Straw Hat Crew} type card with a cost of 5 or less from your hand. Then, if you have a Stage with a cost of 5 or more, rest up to 1 of your opponent's Characters with a cost of 6 or less.
- "card": a Character or a Stage (Events are never played, CR 2-7-3; the engine restricts a play to those). The Stage check is read after the play, so a cost 5 Stage just played counts. "Then" after an "up to" that chose nothing still resolves (the second sentence has its own "if").

### OP18-038 Shoot Down That Flag.
[Main] Look at 5 … reveal up to 1 [Sogeking] or {Straw Hat Crew} type card … [Trigger] Draw 1 card.
- `lookAtTop 5`, take `upTo 1` `any [name Sogeking, type Straw Hat Crew]`, revealed, rest to the bottom in any order. [Trigger] draw 1.

### OP18-061 Iceburg
[On Play] Look at 5 cards … reveal up to a total of 2 Stage cards or {Water Seven} type cards …
- One take of `upTo 2` over `any [category Stage, type Water Seven]` (as EB05-014, "a total of").

### OP18-066 Zambai
[Activate: Main] You may K.O. 1 of your Stages with a cost of 5 or less: This Character gains [Rush] during this turn.
- Needs wave G2 (a K.O. cost on your own Stage; the runtime already K.O.'d Stages, only the validator refused it). No Once Per Turn on the text.

### OP18-070 Tom
[On Play] DON!! −1, you may trash 1 card from your hand: Add up to 2 Stage cards from your trash to your hand.
- `auto` with cost `[donMinus 1, trash 1 from hand]` (optional by construction, CR 8-3-1-4), effect `move` Stage `upTo 2` trash to hand.

### OP18-072 The Franky Family
[Blocker] [Activate: Main] [Once Per Turn] You may K.O. 1 of your Stages with a cost of 5 or less: If this Character was played on this turn, give up to 1 of your opponent's Characters −3000 power during this turn.
- G2 cost; colon-less "If" is an effect condition: on a later turn the cost is paid, nothing happens, and the Once Per Turn is spent (STATUS process lessons).

### OP18-074 Can You Please Sail on the Ship I Made?!
[Counter] If you have a Stage with a cost of 5 or more, up to 1 of your Leader or Characters gains +4000 power during this battle. [Trigger] DON!! −1: Add up to 2 Stage cards from your trash to your hand.
- [Counter] `if exists` your Stage cost ≥ 5, then +4000 `battle`. [Trigger] with cost `donMinus 1`.

### OP18-075 Thousand Sunny, OP18-076 Shark Submerge 3, OP18-077 White Hobby Horse 1, OP18-078 Mini-Merry
Shared [On Play]: Draw 1 card, then add up to 1 DON!! card as rested from your DON!! deck (`draw 1`, `addDon rested upTo`, as EB05-036).
- 075: [Activate: Main] DON!! −2, you may rest this Stage: `setActive` a {Straw Hat Crew} Character with power ≤ 7000 (current power), `upTo 1`. No Once Per Turn (the rest cost limits it).
- 076: [On Your Opponent's Attack] You may rest this Stage: your Leader with 5000 power or less (current power when the effect resolves; no pick, it is your one Leader) and up to 2 of your Characters gain +1000 during this turn. The Characters have no power limit.
- 077: [Activate: Main] rest: up to 1 {Straw Hat Crew} Character gains [Rush: Character] during this turn.
- 078: [Activate: Main] rest: `giveDon n 1, rested, each, to upTo 4` of your Leader or Characters (as OP13-042's `each`). With fewer rested DON!! than chosen cards, as many as there are.

### OP18-118 Monkey.D.Luffy
[On Play] Set up to 3 of your DON!! cards as active. Then, up to 1 of your opponent's Characters cannot be rested until the end of your opponent's next End Phase. [End of Your Turn] Set up to 1 of your {Water Seven} type cards as active.
- As OP18-027 without the cost limit; [End of Your Turn] as OP18-031's first half.
