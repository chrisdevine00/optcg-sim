import type { CardScript } from '../../src/dsl.ts';

/** OP10-004 Vergo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_004: CardScript = {
  cardId: 'OP10-004',
  textHash: '053db03a18c155',
  verified: {
    source: 'cards/overrides/OP10-004.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 5; reveal up to 1 {Punk Hazard} card other than [Vergo] and add it to your hand; the rest to the bottom in any order',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                {
                  pick: {
                    upTo: 1,
                  },
                  filter: {
                    all: [
                      {
                        type: 'Punk Hazard',
                      },
                      {
                        not: {
                          name: 'Vergo',
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
};
