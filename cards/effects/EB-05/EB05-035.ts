import type { CardScript } from '../../src/dsl.ts';

/** EB05-035 Speed. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_035: CardScript = {
  cardId: 'EB05-035',
  textHash: '01218da7a8894a',
  verified: {
    source: 'cards/overrides/EB05-035.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'DON!! -1: look at 5, add up to 2 {SMILE} cards; play up to 2 {SMILE} Characters power 5000 or less from hand',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          donMinus: 1,
        },
      ],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                {
                  pick: {
                    upTo: 2,
                  },
                  filter: {
                    type: 'SMILE',
                  },
                  reveal: true,
                  to: 'hand',
                },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      type: 'SMILE',
                    },
                    {
                      power: {
                        lte: 5000,
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 2,
                },
              },
            },
          },
        },
      ],
    },
  ],
};
