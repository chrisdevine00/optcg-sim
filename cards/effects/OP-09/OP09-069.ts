import type { CardScript } from '../../src/dsl.ts';

/** OP09-069 Trafalgar Law. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_069: CardScript = {
  cardId: 'OP09-069',
  textHash: '11b50b1b3befd5',
  verified: {
    source: 'cards/overrides/OP09-069.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 4; reveal up to 1 {Straw Hat Crew} or {Heart Pirates} card with a cost of 2 or more and add it to your hand; the rest to the bottom in any order',
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
                    all: [
                      {
                        any: [
                          {
                            type: 'Straw Hat Crew',
                          },
                          {
                            type: 'Heart Pirates',
                          },
                        ],
                      },
                      {
                        cost: {
                          gte: 2,
                        },
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
  rulings: [
    'reading: "with a cost of 2 or more" qualifies both types, inclusive, any category (an Event of cost 2+ with the type counts)',
  ],
};
