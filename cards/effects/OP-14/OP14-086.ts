import type { CardScript } from '../../src/dsl.ts';

/** OP14-086 Miss Doublefinger(Zala). Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_086: CardScript = {
  cardId: 'OP14-086',
  textHash: '00fc16e1ca9cae',
  verified: {
    source: 'cards/overrides/OP14-086.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'trash-bonus',
      label:
        'With 7 or more cards in your trash, this Character gains +1000 power and all your Baroque Works Characters gain +2 cost',
      kind: 'permanent',
      conditions: [
        {
          cmp: [
            {
              trash: 'you',
            },
            '>=',
            7,
          ],
        },
      ],
      apply: [
        {
          power: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: 1000,
          },
        },
        {
          cost: {
            target: {
              from: 'characters',
              owner: 'you',
              filter: {
                typeIncludes: 'Baroque Works',
              },
            },
            amount: 2,
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: Miss Doublefinger herself is a Baroque Works Character, so she gains the +2 cost as well',
  ],
};
