import type { CardScript } from '../../src/dsl.ts';

/** OP13-096 The Five Elders Are at Your Service!!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_096: CardScript = {
  cardId: 'OP13-096',
  textHash: '0af57774614ea8',
  verified: {
    source: 'cards/overrides/OP13-096.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Look at 3, reveal up to 1 {Celestial Dragons} card other than this to hand, trash the rest',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            lookAtTop: {
              n: 3,
              take: [
                {
                  pick: {
                    upTo: 1,
                  },
                  filter: {
                    all: [
                      {
                        type: 'Celestial Dragons',
                      },
                      {
                        not: {
                          name: 'The Five Elders Are at Your Service!!!',
                        },
                      },
                    ],
                  },
                  reveal: true,
                  to: 'hand',
                },
              ],
              rest: 'trash',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: "Activate this card's [Main] effect",
      kind: 'trigger',
      effect: [
        {
          do: {
            activate: {
              ability: 'main',
              of: 'self',
            },
          },
        },
      ],
    },
  ],
};
