import type { CardScript } from '../../src/dsl.ts';

/** OP15-056 Would You Let Me Eat the Flame-Flame Fruit?. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_056: CardScript = {
  cardId: 'OP15-056',
  textHash: '1c00dc6ed23db2',
  verified: {
    source: 'cards/overrides/OP15-056.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Draw 2 cards. Then your [Lucy] Leader gains [Double Attack] and +3000 power during this turn',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            draw: 2,
          },
        },
        {
          do: {
            grant: {
              target: {
                from: 'leader',
                owner: 'you',
                filter: {
                  name: 'Lucy',
                },
              },
              keyword: 'Double Attack',
              duration: 'thisTurn',
            },
          },
        },
        {
          do: {
            power: {
              target: {
                from: 'leader',
                owner: 'you',
                filter: {
                  name: 'Lucy',
                },
              },
              amount: 3000,
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Draw 2 cards',
      kind: 'trigger',
      effect: [
        {
          do: {
            draw: 2,
          },
        },
      ],
    },
  ],
};
