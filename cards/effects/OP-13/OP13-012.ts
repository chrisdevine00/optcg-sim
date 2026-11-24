import type { CardScript } from '../../src/dsl.ts';

/** OP13-012 Nefeltari Vivi. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_012: CardScript = {
  cardId: 'OP13-012',
  textHash: '1e4d69f24aa21a',
  verified: {
    source: 'cards/overrides/OP13-012.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 4; reveal up to 1 Alabasta or Straw Hat Crew card with cost 2+ and add it to your hand',
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
                            type: 'Alabasta',
                          },
                          {
                            type: 'Straw Hat Crew',
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
};
