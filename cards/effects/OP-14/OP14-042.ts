import type { CardScript } from '../../src/dsl.ts';

/** OP14-042 Arlong. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_042: CardScript = {
  cardId: 'OP14-042',
  textHash: '15db9c6964f8e1',
  verified: {
    source: 'cards/overrides/OP14-042.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader has the {Fish-Man} type, look at 4; reveal up to 1 card with a cost of 2 or more and add it to your hand; the rest to the bottom in any order',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              type: 'Fish-Man',
            },
          },
          then: [
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
                        cost: {
                          gte: 2,
                        },
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
    },
  ],
};
