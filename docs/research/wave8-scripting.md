# Wave 8 scripting: readings

Scripted after the wave 8 engine work ([m6b-wave8.md](m6b-wave8.md)): the six cards held for design items D2, D8 and D9. All six are `verified: true` (Limitless cross-check, 2026-11-24); the hashes are those of the verified text in `cards/data`. ~5 author tests each in `engine/test/cards/<ID>.test.ts` (raw `g.act`, `isLegal` for who may act); every Event the tests activate is a real card with a planted [Main] (the test cards' own text is not what is under test).

## OP12-041 Sanji (Leader)

[Activate: Main] [Once Per Turn] DON!! -1: Activate up to 1 "Straw Hat Crew" type Event with a base cost of 3 or less from your hand. [When Attacking] If the number of DON!! cards on your field is equal to or less than the number on your opponent's field, add up to 1 DON!! card from your DON!! deck and rest it.

- `activate`, `oncePerTurn`, cost `{ donMinus: 1 }`, effect `activate` of `{ from: 'hand', owner: 'you', filter: all [Event, type 'Straw Hat Crew', baseCost <= 3], pick upTo 1 }` (D2).
- The Event is trashed, its printed cost not paid, its written activation cost paid, only its [Main] (M6b-Q27, official OP12 Q&A, five rows); "When you activate an Event" sees it (M6b-Q28, same Q&A).
- [When Attacking]: effect-level `if` (`donOnField you <= donOnField opponent`, the field includes the cost area and given DON!!), then `addDon [{ n: 1, state: 'rested', upTo: true }]` (E-Q11: asks a count, "up to").

## OP15-014 Bartolomeo

If this Character would be K.O.'d, you may trash 1 Event from your hand instead. [On Play] Activate up to 1 {Dressrosa} type Event with a base cost of 3 or less from your hand.

- `replacement` on `ko` of this card (G11, no cause: battle and effect K.O.s), `optional`, instead `trash` of an Event from the hand. A hand with no Event cannot pay it and the offer is asked with accept unavailable (the hand is secret, ADR 0005).
- [On Play] `activate` of a {Dressrosa} Event with base cost 3 or less (D2); the printed cost is not paid (M6b-Q27).

## OP15-046 Sabo

[Blocker] [On Play] If your Leader has the {Dressrosa} type, activate up to 1 {Dressrosa} type Event from your hand.

- `keywords: ['Blocker']`; [On Play] effect-level `if { leader: { type: 'Dressrosa' } }`, then `activate` of a {Dressrosa} Event of any cost (D2). Official OP15 Q&A: the Event goes to the trash afterwards; no [Counter] in response.

## EB03-031 Vinsmoke Reiju

[Your Turn] [On Play] DON!! -1: If your Leader is [Sanji], activate the [Main] effect of up to 1 Event card with a cost of 7 or less in your trash.

- `auto` on `onPlay`, ability condition `yourTurn`, cost `{ donMinus: 1 }` (an auto with a cost is optional by construction), effect `if { leader: { name: 'Sanji' } }` then `activate` of `{ from: 'trash', owner: 'you', filter: all [Event, cost <= 7], pick upTo 1 }` (D2).
- The "If" after the cost colon is an effect condition (B3A-R1): with another Leader the DON!! -1 is paid for nothing. Only the [Main] runs and the card stays in the trash (M6b-Q27); no Event activation is recorded and watchers do not fire (M6b-Q28, official EB03 Q&A).

## PRB02-005 Monkey.D.Luffy

[Your Turn] [On Play] If your Leader is multicolored and your opponent has 7 or less DON!! cards on their field, your opponent rests 1 of their active DON!! cards at the start of their next Main Phase.

- `auto` on `onPlay`, ability condition `yourTurn`; effect `if` (`leader multicolor` and `donOnField opponent <= 7`) then `delayed { at: 'startOfOpponentsNextMainPhase' }` with `rest` of 1 DON!! of the opponent's cost area, `chooser: 'opponent'` (D8).
- Reading (M6b-Q91, official PRB02 Q&A): the conditions are read when played; with 8 or more at their Main Phase the opponent still rests one. The rest comes after that Main Phase's own start-of-phase effects. The opponent's prompt has one answer (the engine asks which DON!! class even when there is one; see "Notes for later" in the wave write-up).

## OP16-079 Yamato (Leader)

When a {Land of Wano} type Character card is played from your trash, that Character gains [Rush] during this turn.

- `auto` on `{ event: 'cardPlayed', by: 'you', from: 'trash', filter: Character and type 'Land of Wano' }` (G25), effect `grant` Rush `thisTurn` to `{ from: 'characters', owner: 'you', lki: 'subject' }` (D9).
- Reading (M6b-Q11): any play from your own trash by any effect; "that Character" is the card just played. The Rush is the Leader's grant: a negated Character still attacks (official OP16 Q&A).
