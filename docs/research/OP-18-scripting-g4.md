# OP-18 scripting: readings, group g4

Overrides cite the official OP-18 series page (`?series=569118`, read by hand 2026-11-27, `verified: true`). Tests in `engine/test/cards/<ID>.test.ts`; set-ups in `helpers-op18-g4.ts` ({CP9} Leader OP03-076, {CP} and {Holy Knights of God} scenery).

### OP18-092 Roronoa Zoro
If there is a Character with a cost of 12 or more, this Character gains +3000 power. If you have 10 or more cards in your trash, this Character gains [Rush].
- Two `permanent`s: `exists` Character `owner any` cost >= 12 (as OP17-082, this card included, either side); `cmp trash you >= 10` grants Rush. Independent.

### OP18-093 Sleeptids
Under the rules of this game, you may have any number of this card in your deck. [Blocker]
- `rules anyNumberInDeck` (as OP16-042) plus `keywords: ['Blocker']`. The static `DECK_RULES` table in `engine/src/defs.ts` got the same entry (the builder reads it before scripts load; `deck-format.test.ts` keeps it equal to the script). A data entry, no engine logic.

### OP18-094 Hee Hee Hee!! I Smell Adventure!!
[Main] Look at 5 … reveal up to 1 {Elbaph} type card … [Trigger] Draw 1 card.
- `lookAtTop 5`, take `upTo 1` `type Elbaph`, revealed, rest to the bottom in any order (as OP18-038).

### OP18-095 I'm Late, I'm Very Late!!
[Main] If your Leader has the {Celestial Dragons} type, look at 5 … reveal up to 1 [Sleeptids] or {Holy Knights of God} type card … [Trigger] Activate this card's [Main] effect.
- `if leader type Celestial Dragons` around the same `lookAtTop`; filter `any [name Sleeptids, type Holy Knights of God]`; Trigger `activate main of self` (as OP15-097). The Leader condition is checked again when the [Main] runs from the Trigger.

### OP18-096 I'll Make the Call
[Main] You may rest 3 of your DON!! cards: Play up to 1 {Holy Knights of God} type Character card with a cost of 6 or less from your trash. [Counter] If you have 10 or more cards in your trash, up to 1 of your Leader or Characters gains +4000 power during this battle.
- Main: `costOptional` + `restDon 3` (the Event's own cost is paid first). Counter: `if trash >= 10`. The Event is already in the trash when its effect resolves (OP15-097 reading), so it counts itself: 9 other cards enable it.

### OP18-098, -104, -106, -111, -112 (bare keywords)
[Unblockable], [Banish], [Double Attack], [Rush], [Blocker] (each with its reminder text).
- `keywords` in the script, `abilities: []`, as OP16-044; the override carries the same `keywords` (`printedKeywords`).

### OP18-103 Jabra
[On K.O.] Add up to 1 card from the top of your deck to the top of your Life cards. Then, trash up to 1 card from the top of your opponent's Life cards. [Trigger] If your Leader's type includes "CP", draw 1 card and place up to 1 Character with a cost of 8 or less at the bottom of the owner's deck.
- `move deckTop -> life top` (OP12-107) then `move lifeTop opponent -> trash` (OP10-109); each "up to 1" is its own accept or decline, and the second does not depend on the first ("Then" only orders them).
- Trigger (shared by the CP cards): `if leader typeIncludes CP`, `draw 1` where named, then `move` a Character of either side (`owner any`, cost limit, `upTo 1`) to the deck bottom (OP17-046 shape). A single card per owner, so no ordering is asked. The Leader is read when the Trigger resolves.

### OP18-107 Nero / OP18-109 Fukurou
Nero: [Blocker] [Trigger] If your Leader's type includes "CP", place up to 1 Character with a cost of 5 or less at the bottom of the owner's deck. Fukurou: [Blocker] [Trigger] If your Leader's type includes "CP", K.O. or rest up to 1 of your opponent's Characters with a cost of 6 or less.
- Nero as above. Fukurou: `chooseOne` K.O. / rest (as OP14-062), the target picked inside the chosen branch.

### OP18-108 Funkfreed
[On Play] You may trash 1 card with a type including "CP" from your hand: Draw 2 cards. [Activate: Main] You may rest this Character: Up to 1 of your [Spandam] gains +1000 power during this turn.
- `trash` cost with filter `typeIncludes CP` (the card itself is not in the hand, so it never pays for itself); `restSelf` activate, target `leader` or `characters` named Spandam (a [Spandam] Leader counts too), no Once Per Turn (the rest cost limits it).

### OP18-110 Blueno
[On Play] Look at 4 … reveal up to 1 card with a type including "CP" other than [Blueno] … [Trigger] Draw 1 card and K.O. up to 1 of your opponent's Characters with a cost of 2 or less.
- `typeIncludes CP` and `not name Blueno` (so another copy is excluded). The Trigger has no Leader condition.

### OP18-113 Rob Lucci
[On Play]/[On K.O.] Trash up to 1 card from the top of your opponent's Life cards. [Trigger] CP: draw 1 and place up to 1 Character with a cost of 8 or less at the bottom.
- One `auto` with `when [onPlay, onKO]` (as OP14-111), not damage.

### OP18-114 Wanze
[On Play] Look at all of your Life cards and place them back in your Life area in any order. [Trigger] CP: place up to 1 Character with a cost of 5 or less at the bottom.
- `lookAtLife all anyOrder` as OP13-105 (same rulings).

### OP18-115 Ten Finger Pistol, OP18-116 Iron Body Empty Tree
115: [Main] K.O. up to 1 of your opponent's Characters with a cost of 5 or less. [Trigger] CP: draw 1 and place up to 1 Character with a cost of 7 or less at the bottom. 116: [Counter] You may trash 1 card from your hand: Up to 1 of your Leader or Characters gains +3000 power during this battle. [Trigger] CP: rest up to 1 of your opponent's Characters.
- The Main of 115 has no Leader condition. 116: `costOptional` + `trash 1 from hand` (the Event itself is not in the hand); the Trigger rests any opposing Character, no cost limit.

### OP18-119 Saint Shamrock
[On K.O.] You may trash 1 card from your hand: Play this Character card from your trash. [Activate: Main] [Once Per Turn] If this Character was played on this turn, play up to 1 {Holy Knights of God} type Character card with a cost of 6 or less from your trash.
- On K.O.: `trash` cost then `play` `isSelf` from the trash (as OP15-080). Activate: `exists` self `playedThisTurn` as an effect condition (OP15-008): on a later turn the activation does nothing and spends the Once Per Turn. The first Shamrock in the trash (cost 8) is never a candidate.

### Rulings needed
None new. Relies on the standing readings: the Event counts itself in the trash (OP15-097), and a bare "Character" in the CP placing text is either side (OP17-046).
