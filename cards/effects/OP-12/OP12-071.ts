import type { CardScript } from '../../src/dsl.ts';

/** OP12-071 Charlotte Pudding. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_071: CardScript = {
  cardId: 'OP12-071',
  textHash: '16e2bf55aa8546',
  verified: {
    source: 'cards/overrides/OP12-071.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 4; reveal up to 1 [Sanji] or Event card to hand; rest to the bottom in any order',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 4,
              take: [
                {
                  pick: {
                    upTo: 1,
                  },
                  filter: {
                    any: [
                      {
                        name: 'Sanji',
                      },
                      {
                        category: ['Event'],
                      },
                    ],
                  },
                  reveal: true,
                  to: 'hand',
                },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
      ],
    },
  ],
};
