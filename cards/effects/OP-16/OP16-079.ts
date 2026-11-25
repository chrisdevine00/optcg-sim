import type { CardScript } from '../../src/dsl.ts';

/** OP16-079 Yamato. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_079: CardScript = {
  cardId: 'OP16-079',
  textHash: '11dc6e0d3df6ed',
  verified: {
    source: 'card text in cards/data (Limitless cross-check 2026-11-24); official OP16 Q&A',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'rush-from-trash',
      label:
        'When a {Land of Wano} type Character card is played from your trash, that Character gains [Rush] during this turn',
      kind: 'auto',
      when: [
        {
          event: 'cardPlayed',
          by: 'you',
          from: 'trash',
          filter: { all: [{ category: ['Character'] }, { type: 'Land of Wano' }] },
        },
      ],
      effect: [
        {
          do: {
            grant: {
              target: { from: 'characters', owner: 'you', lki: 'subject' },
              keyword: 'Rush',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'Reading (M6b-Q11, official OP16 Q&A for OP16-079): any play of a {Land of Wano} Character card from your own trash, by any effect, triggers it; "that Character" is the card just played (the event\'s subject, D9). The Rush is this Leader\'s grant, so a negated Character can still attack (official Q&A: it can)',
    'The reminder text "(This card can attack on the turn in which it is played.)" is [Rush]\'s own and is not an ability',
  ],
};
