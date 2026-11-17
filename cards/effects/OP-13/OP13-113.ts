import type { CardScript } from '../../src/dsl.ts';

/** OP13-113 Lilith. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_113: CardScript = {
  cardId: 'OP13-113',
  textHash: '095a6466d6e81b',
  verified: {
    source: 'cards/overrides/OP13-113.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 4; reveal up to 1 card with a [Trigger] other than [Lilith] and add it to your hand',
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
                        hasTrigger: true,
                      },
                      {
                        not: {
                          name: 'Lilith',
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
    {
      id: 'trigger',
      label: "Activate this card's [On Play] effect",
      kind: 'trigger',
      effect: [
        {
          do: {
            activate: {
              ability: 'onPlay',
              of: 'self',
            },
          },
        },
      ],
    },
  ],
};
