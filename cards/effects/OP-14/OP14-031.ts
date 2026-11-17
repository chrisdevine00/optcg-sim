import type { CardScript } from '../../src/dsl.ts';

/** OP14-031 Nami. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_031: CardScript = {
  cardId: 'OP14-031',
  textHash: '1afa6c50f275e9',
  verified: {
    source: 'cards/overrides/OP14-031.json (card text in cards/data)',
    date: '2026-11-16',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        'Rest up to 2 opposing Characters with cost 8 or less; then set up to 5 DON!! as active at the end of this turn',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 8,
                },
              },
              pick: {
                upTo: 2,
              },
            },
          },
        },
        {
          delayed: {
            at: 'endOfThisTurn',
          },
          do: [
            {
              do: {
                setActive: {
                  from: 'donCostArea',
                  owner: 'you',
                  pick: {
                    upTo: 5,
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'Read: the DON!! are set active at the end of this turn even if nothing was rested ("Then" is not an "if")',
  ],
};
