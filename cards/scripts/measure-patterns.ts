/**
 * The Track E tagger's pattern tables, ported verbatim from the Python tagger (effect-dsl E-D10).
 * Generated from the Python source so no pattern was retyped; edit only to add a pattern.
 * Python's re.I is the i flag here; DURATION_SRC was case-sensitive in the original.
 */

export const ACTION_SRC: ReadonlyArray<readonly [string, string]> = [
  ['draw', String.raw`\bdraw (?:up to )?\d+ cards?\b|\bdraws? (?:up to )?\d+ cards?|\bdraw a card`],
  [
    'trashFromHand',
    String.raw`(?<!opponent )\btrash (?:up to )?\d+ (?:[^.:]*?)cards? from your hand|\btrash (?:up to )?\d+ [^.:]*?from your hand|\btrash this card from your hand|\btrash the (?:revealed |selected )?cards? from your hand|\btrash cards from your hand until`,
  ],
  [
    'opponentDiscards',
    String.raw`opponent trashes \d+ cards? from (?:their|his|her) hand|trash (?:up to )?\d+ cards? from your opponent's hand|opponent trashes cards`,
  ],
  [
    'mill',
    String.raw`\btrash (?:up to )?\d+ cards? from the top of (?:your|their|your opponent's) deck|\btrash the rest\b|\btrash the top \d+ cards?|\btrash them\b`,
  ],
  [
    'lookTop',
    String.raw`\blook at (?:up to )?\d+ cards? from the top of|\blook at the top \d+ cards?|\blook at all of your Life|\blook at \d+ cards? from the top|\blook at (?:up to )?\d+ of your opponent's Life|\blook at (?:the top|\d+) [^.]*?Life cards`,
  ],
  [
    'searchToHand',
    String.raw`\breveal up to (?:a total of )?\d+ [^.]*?(?:and )?add (?:it|them) to your hand|\badd up to \d+ (?:card|[^.]*?card)s? to your hand\b(?! from)|\breveal up to \d+ [^.]*?add`,
  ],
  [
    'deckBottomRest',
    String.raw`place the rest at the bottom of (?:the|your|their) deck|place (?:the rest|them) at the bottom|place the remaining cards? at the bottom`,
  ],
  [
    'reorderTopBottom',
    String.raw`place them at the top or bottom of|reorganize them|place (?:them|it|the cards?) at the top or bottom of the deck|place them at the top of (?:your|the) deck in any order|top or bottom of (?:your|the) deck in any order`,
  ],
  ['revealTop', String.raw`\breveal (?:up to )?\d+ cards? from the top of|\breveal the top card`],
  [
    'addFromTrash',
    String.raw`\badd (?:up to )?\d+ [^.]*?from your trash to your hand|\breturn (?:up to )?\d+ [^.]*?from your trash to your hand`,
  ],
  [
    'addFromDeckToHand',
    String.raw`\badd (?:up to )?\d+ [^.]*?from your deck to your hand|search your deck`,
  ],
  [
    'handToDeck',
    String.raw`place \d+ cards? from your hand at the (?:top|bottom)|return (?:up to )?\d+ cards? from your hand to (?:the|your) deck|place \d+ cards? from your hand on|from your hand at the bottom of your deck`,
  ],
  [
    'trashToDeck',
    String.raw`place (?:up to )?\d+ cards? from your trash at the bottom|return (?:up to )?\d+ [^.]*?from your trash to the bottom|from your trash at the bottom of your deck|shuffle [^.]*?from your trash into`,
  ],
  ['shuffleDeck', String.raw`\bshuffle your deck\b|shuffle (?:it|them) into`],
  [
    'ko',
    String.raw`\bK\.O\. (?:up to |all of |all |your )|\bK\.O\. it\b|\bK\.O\. (?:that|the selected|this)|\bK\.O\.'d by your effect|\bK\.O\. \d+ of`,
  ],
  [
    'bounceToHand',
    String.raw`\breturn (?:up to )?\d+ [^.]*?(?:Characters?|cards?|Stages?)[^.]*? to (?:the owner's|its owner's|their owner's|your|their) hand|return (?:it|this Character|the selected) to (?:the owner's|your) hand|return all [^.]*? to the owner's hand`,
  ],
  [
    'toDeckBottom',
    String.raw`\bplace (?:up to )?\d+ [^.]*?(?:Characters?|Stages?|cards?)[^.]*? at the bottom of (?:the owner's|its owner's|their owner's) deck|place (?:it|this Character|the selected[^.]*?) at the bottom of (?:the owner's|your) deck|at the bottom of the owner's deck`,
  ],
  [
    'trashFromField',
    String.raw`\btrash (?:up to )?\d+ of (?:your opponent's|your) (?:Characters|Stages|cards)|\btrash (?:this Character|this Stage|this card|that Character)\b(?! from your hand)|\btrash all (?:of )?(?:your opponent's )?Characters|\btrash (?:up to )?\d+ [^.]*?(?:Characters?|Stages?)\b(?! from your hand| cards? from)`,
  ],
  [
    'restTarget',
    String.raw`\brest up to (?:a total of )?\d+ of (?:your opponent's|their)|\brest (?:all of )?your opponent's|\brest all of your opponent's|\brest up to \d+ of your opponent's|\brest (?:the selected|that) Character|\brest up to (?:a total of )?\d+ [^.]*?opponent`,
  ],
  ['freeze', String.raw`will not become active|does not become active|do not become active`],
  [
    'setActive',
    String.raw`\bset (?:up to \d+ of )?(?:your |this |the |that |it |them )?[^.]*?\bas active\b|\bset (?:it|them|this Character|this Leader|your Leader) active`,
  ],
  [
    'restOwn',
    String.raw`\brest (?:up to \d+ of )?your (?:Leader|Characters?|cards?)\b|\brest this (?:Character|Leader|Stage|card)\b`,
  ],
  ['powerPlus', String.raw`gains? (?:an additional )?\+\d+ power|gets? \+\d+ power|\+\d+ power`],
  ['powerMinus', String.raw`-\d+ power|power is reduced`],
  [
    'powerPerCount',
    String.raw`\+\d+ power (?:for every|per)|power (?:for every|per)|For every [^,]*, (?:give|this)`,
  ],
  [
    'basePowerSet',
    String.raw`base power (?:becomes?|is) \d+|base power becomes?|power becomes 0|[Ss]et (?:the )?power to 0`,
  ],
  ['costPlus', String.raw`gains? \+\d+ cost|\+\d+ cost`],
  [
    'costMinus',
    String.raw`-\d+ cost|cost will be reduced|cost (?:is|will be) reduced|reduce the cost|costs? \d+ less`,
  ],
  [
    'counterValue',
    String.raw`has a \+\d+ Counter|have a \+\d+ Counter|gains? \+\d+ Counter|Counter (?:value )?(?:becomes|of)`,
  ],
  [
    'giveDon',
    String.raw`\bgive (?:up to )?(?:\d+|all of your|your) (?:rested |active )?DON!! cards?|\bgive [^.]*?up to \d+ (?:rested |active )?DON!! cards? each|\bDON!! cards? (?:to|given to) [^.]*?(?:Leader|Character)\b(?! cards? (?:on|in) your field)`,
  ],
  [
    'addDon',
    String.raw`\badd (?:up to )?\d+ (?:additional )?DON!! cards?|\badd up to \d+ additional DON!!|from your DON!! deck (?:and|to)|place (?:up to )?\d+ DON!! cards? from your DON!! deck`,
  ],
  [
    'returnDon',
    String.raw`\breturn (?:up to )?\d+ (?:of your )?DON!! cards?[^.]*?to (?:your|their|the owner's) DON!! deck|return DON!! cards from your field to your DON!! deck|returns? \d+ DON!! cards?|DON!! card on your field is returned`,
  ],
  [
    'restDon',
    String.raw`\brest (?:up to )?\d+ of (?:your|your opponent's) (?:active )?DON!!|\brest (?:up to )?(?:a total of )?\d+ of your opponent's [^.]*?DON!!|rest any number of your DON!!|(?<!You may )rest \d+ of your opponent's DON`,
  ],
  ['donMinusCost', String.raw`DON!! -\d+`],
  ['circledCost', String.raw`①\d`],
  [
    'restDonCost',
    String.raw`[Yy]ou may rest \d+ of your DON!!|you may rest \d+ of your DON!!|rest \d+ of your DON!! cards and`,
  ],
  [
    'donCountCheck',
    String.raw`DON!! cards? on (?:your|their|your opponent's) field|given DON!!|DON!! cards? given|active DON!! cards|rested DON!! cards? (?:on|in)`,
  ],
  [
    'playFromHand',
    String.raw`\bplay (?:up to )?(?:\d+|a total of \d+) [^.]*?from your hand|\bplay up to \d+ \[[^\]]+\][^.]*?from your hand`,
  ],
  ['playSelected', String.raw`\bplay (?:it|the revealed card|that card|them)\b(?! or)`],
  ['playFromTrash', String.raw`\bplay (?:up to )?\d+ [^.]*?from your trash|and play it\b`],
  [
    'playFromDeck',
    String.raw`\bplay (?:up to )?\d+ [^.]*?from (?:your deck|among them|the revealed cards)|play up to \d+ [^.]*?(?:revealed|from among)`,
  ],
  ['playThis', String.raw`\bplay this card\b|\bplay this Character\b`],
  ['playFromLife', String.raw`\bplay [^.]*?from (?:the top of )?your Life`],
  [
    'addLifeFromDeck',
    String.raw`add (?:up to )?\d+ cards? from the top of your deck to the top of your Life|add (?:up to )?\d+ [^.]*?to the top of your Life cards|add [^.]*? to your Life cards|to the top of your Life cards face-up|place [^.]*? (?:at|to) the top of your Life`,
  ],
  [
    'lifeToHand',
    String.raw`add (?:up to )?\d+ cards? from (?:the top (?:or bottom )?of )?your Life cards? to your hand|add \d+ cards? from the top or bottom of your Life|add your Life card`,
  ],
  [
    'oppLifeToHand',
    String.raw`(?:add|place) (?:up to )?\d+ cards? from the top of (?:your opponent's|their) Life cards? to (?:the owner's|their) hand`,
  ],
  [
    'trashLife',
    String.raw`trash (?:up to )?\d+ cards? from the top of (?:your|your opponent's|their) Life|trash cards from the top of your Life|trash (?:up to )?\d+ of your opponent's Life|trash (?:all )?(?:up to \d+ )?(?:of )?your (?:face-up )?Life cards`,
  ],
  [
    'lifeFaceUp',
    String.raw`turn (?:\d+|all) (?:cards? )?(?:from the top of )?(?:your|your opponent's)? ?Life cards? face-(?:up|down)|turn [^.]*? face-(?:up|down)`,
  ],
  ['damage', String.raw`deals? \d+ damage|\btakes? \d+ damage`],
  [
    'lifeCountCheck',
    String.raw`(?:you have|your opponent has|have|has) (?:\d+ or (?:less|more)|less|more|0|no) Life cards?|total of \d+ or less Life|number of (?:your )?Life cards|Life cards? (?:is|becomes)|your opponent's Life cards`,
  ],
  ['cannotBeKO', String.raw`cannot be K\.O\.'d`],
  [
    'cannotBeRemoved',
    String.raw`cannot be removed from the field|cannot be (?:returned|placed|trashed)`,
  ],
  ['cannotAttack', String.raw`cannot attack\b`],
  ['attackTargetLock', String.raw`cannot attack any card other than|must attack|can only attack`],
  ['blockerDisable', String.raw`cannot activate \[Blocker\]|cannot (?:be )?block`],
  ['cannotPlay', String.raw`cannot play\b|cannot be played`],
  ['cannotDraw', String.raw`cannot draw\b`],
  ['cannotActivate', String.raw`cannot activate (?!\[Blocker\])|cannot use`],
  ['cannotAddLife', String.raw`cannot add [^.]*?Life`],
  ['cannotRest', String.raw`cannot be rested|cannot rest`],
  [
    'gainKeyword',
    String.raw`gains? (?:\[|both \[)(?:Rush|Blocker|Double Attack|Banish|Rush: Character|Unblockable)\]|gains? Rush\b|gain \[(?:Rush|Blocker|Double Attack|Banish)`,
  ],
  ['loseKeyword', String.raw`loses? \[|loses? (?:its|all) effects|loses? \w+ \[`],
  [
    'negate',
    String.raw`\bnegate the effects? of|\bnegate (?:the|all|that|its)|effects are negated|is negated`,
  ],
  ['canAttackActive', String.raw`can (?:also )?attack (?:your opponent's )?active Characters`],
  ['extraAttack', String.raw`can attack (?:again|twice)`],
  ['modal', String.raw`choose one|Choose one|chooses one`],
  [
    'activateOther',
    String.raw`activate (?:this card's|that card's|the) \[(?:Main|On Play|Counter|Activate: Main|On K\.O\.)\] effect|activate this card's|activate [^.]*?\[(?:Main|On Play|Counter)\] effect`,
  ],
  [
    'revealFromHand',
    String.raw`\breveal (?:up to )?\d+ [^.]*?from your hand|reveal (?:your|this card in your) hand`,
  ],
  ['nameAlias', String.raw`also treat this card's name as|treat (?:this card's|its) name as`],
  ['typeAlias', String.raw`also (?:has|have|treat)[^.]*?type|is (?:also )?treated as`],
  ['donDeckSize', String.raw`DON!! deck consists of`],
  ['deckRule', String.raw`(?:your|a) deck (?:can|may) (?:include|contain)|in your deck`],
  ['copyStats', String.raw`same (?:power|cost|name) as`],
  ['swapPower', String.raw`swap`],
  [
    'delayed',
    String.raw`at the end of (?:this|the) turn|at the end of this battle|the next time\b|at the start of your next turn|at the end of your opponent's next turn`,
  ],
  [
    'attackRedirect',
    String.raw`change the attack target|becomes? the (?:new )?target of the attack|attack target`,
  ],
  ['endBattle', String.raw`end (?:the|this) battle`],
  ['preventLifeLoss', String.raw`would (?:take|lose) [^.]*?damage|would be dealt`],
  [
    'trashSelfCost',
    String.raw`[Yy]ou may trash this (?:Character|Stage|card)|^trash this (?:Character|Stage)`,
  ],
  ['placeToStage', String.raw`(?:play|place) [^.]*?Stage`],
  ['giveOpponentChoice', String.raw`[Yy]our opponent (?:may|chooses|selects)`],
  ['winLose', String.raw`\bwin the game\b|\blose the game\b|\bwins the game\b|\bloses the game\b`],
  ['searchGeneric', String.raw`\badd (?:up to )?\d+ [^.]*?to your hand\b`],
  ['restrictAttackAgainst', String.raw`cannot be attacked|cannot attack (?:your|this)`],
  ['activationWindow', String.raw`This effect can be activated (?:when|at|only)`],
  [
    'oppPlacesToDeck',
    String.raw`opponent (?:must )?places? (?:up to )?\d+ (?:cards?|Events?) from (?:their|your) (?:hand|trash)|they place \d+ cards? from their hand|opponent returns all cards in their hand`,
  ],
  ['oppReturnsOwn', String.raw`opponent returns \d+ of their`],
  ['oppLifeToHand', String.raw`opponent adds \d+ cards? from (?:the top of their Life|their Life)`],
  ['rushCharacterGrant', String.raw`can attack Characters on the turn in which`],
  [
    'placeToLife',
    String.raw`(?:Add|Place) up to \d+ [^.]*?(?:Life cards|Life area)(?: face-(?:up|down))?`,
  ],
  ['setPower', String.raw`Set the power of`],
  ['setCost', String.raw`Set the cost of`],
  ['extraTurn', String.raw`extra turn`],
  ['drawTo', String.raw`draw cards (?:so that|equal to)`],
  [
    'handSizeTrash',
    String.raw`trash cards from your hands? until|trash all cards from your hand|trash the same number of cards`,
  ],
  ['lifeReorder', String.raw`look at all (?:of )?your Life cards|place the rest back in your Life`],
  [
    'deckBottomRest',
    String.raw`place the (?:rest|revealed card) (?:at|a) the (?:top or )?bottom of your deck`,
  ],
  [
    'massToDeck',
    String.raw`Place all of your Characters|place all cards in your hand at the bottom`,
  ],
  ['trashAnyNumber', String.raw`trash any number of`],
  ['playedRested', String.raw`are played rested|play the other card rested`],
  ['selectTarget', String.raw`^Select (?:up to )?(?:\d+|your)`],
  ['cannotBeKO', String.raw`can be K\.O\.'d by`],
  ['addSelfToHand', String.raw`add this (?:card|Character card) to your hand`],
  ['activateEventFromHand', String.raw`activate up to \d+ [^.]*?Event from your hand`],
  ['giveDon', String.raw`give (?:this Character )?up to \d+ (?:of your opponent's )?rested DON!!`],
  ['rulesModifier', String.raw`under the rules of this game|according to the rules`],
  ['returnToHandMass', String.raw`return any number of Characters`],
  ['select', String.raw`\b[Ss]elect up to \d+|\bchoose up to \d+|\bchoose \d+|\bselect (?:1|one)`],
];
export const COND_SRC: ReadonlyArray<readonly [string, string]> = [
  [
    'ifLeaderType',
    String.raw`[Ii]f your Leader (?:has|is) (?:the )?[\"{\[]|your Leader's type includes|Leader with a type including|[Ii]f your Leader is \[|[Ii]f your Leader has the`,
  ],
  ['ifLeaderMulticolor', String.raw`Leader is multicolored`],
  [
    'ifLifeCount',
    String.raw`(?:you have|your opponent has) \d+ or (?:less|more) Life|you have 0 Life|total of \d+ or less Life|number of your Life cards is|Life cards becomes`,
  ],
  [
    'ifHandCount',
    String.raw`(?:you have|your opponent has) \d+ or (?:less|more) cards in (?:your|their) hand|cards in (?:your|their) hand`,
  ],
  [
    'ifDonCount',
    String.raw`(?:you have|there (?:are|is)) \d+ or (?:less|more) DON!! cards on|DON!! cards on your field is|number of DON!! cards on your field|\d+ or (?:less|more) (?:active |rested )?DON!! cards|any DON!! cards given|given DON!! cards`,
  ],
  [
    'ifCharacterExists',
    String.raw`[Ii]f (?:there is|you have) (?:a|an|\d+ or more|no other) [^,]*?Characters?|[Ii]f there is a Character`,
  ],
  ['ifTrashCount', String.raw`cards? in your trash|number of cards in your trash`],
  [
    'ifCompare',
    String.raw`less Characters than|more Characters than|equal to or less than the number`,
  ],
  ['ifThisPlayedThisTurn', String.raw`was played on this turn|played this turn`],
  ['ifTurnCount', String.raw`second turn or later|your first turn`],
  [
    'ifRested',
    String.raw`this Character is rested|if this (?:Character|Leader) is (?:rested|active)`,
  ],
  ['ifDo', String.raw`[Ii]f you do\b`],
  ['ifRevealed', String.raw`revealed card`],
];
export const DURATION_SRC: ReadonlyArray<readonly [string, string]> = [
  ['thisBattle', String.raw`during this battle`],
  ['thisTurn', String.raw`during this turn|until the end of (?:this|the) turn`],
  ['untilEndOfOppNextTurn', String.raw`until the end of your opponent's next (?:End Phase|turn)`],
  ['untilStartOfYourNextTurn', String.raw`until the start of your next turn`],
  ['nextRefresh', String.raw`next Refresh Phase`],
];
export const COST_SRC: ReadonlyArray<readonly [string, string]> = [
  ['cost:donMinus', String.raw`DON!! -\d+`],
  ['cost:restDon', String.raw`①\d|rest \d+ of your DON!!|rest (?:\d+ |any number )?of your DON!!`],
  [
    'cost:trashFromHand',
    String.raw`trash \d+ [^:,]*?from your hand|trash \d+ cards? (?:with|that)|trash \d+ [^:,]*?cards?(?!.*from the top)`,
  ],
  ['cost:restSelf', String.raw`rest this (?:Character|Stage|Leader|card)|and this Character`],
  ['cost:trashSelf', String.raw`trash this (?:Character|Stage|card)`],
  ['cost:revealFromHand', String.raw`reveal \d+ `],
  ['cost:lifeToHand', String.raw`add \d+ cards? from the top (?:or bottom )?of your Life`],
  ['cost:lifeFaceUp', String.raw`turn \d+ cards? from the top of your Life cards face-up`],
  ['cost:mill', String.raw`trash \d+ cards? from the top of your deck`],
  ['cost:restOwnCharacters', String.raw`rest \d+ of your Characters|rest \d+ of your cards`],
  [
    'cost:returnOwnCharacter',
    String.raw`return \d+ of your [^:]*?to (?:your|the owner's) hand|place \d+ of your Characters`,
  ],
  ['cost:trashOwnCharacter', String.raw`trash \d+ of your Characters|K\.O\. \d+ of your`],
  [
    'cost:trashFromTrash',
    String.raw`from your trash at the bottom|place \d+ cards? from your trash`,
  ],
  ['cost:giveDonToOpp', String.raw`give your opponent`],
  ['cost:returnDon', String.raw`return \d+ (?:of your )?DON!!`],
];
export const REMINDER_SRC: readonly string[] = [
  String.raw`\(After your opponent declares an attack[^)]*\)`,
  String.raw`\(You may return the specified number of DON!![^)]*\)`,
  String.raw`\(You may rest the specified number of DON!![^)]*\)?`,
  String.raw`\(This card can attack[^)]*\)`,
  String.raw`\(This card deals 2 damage\.?\)`,
  String.raw`\(When this card deals damage[^)]*\)`,
  String.raw`\(This card cannot be blocked\.?\)`,
  String.raw`\(Note:[^)]*\)`,
];
