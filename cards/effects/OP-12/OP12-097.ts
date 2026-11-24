import type { CardScript } from '../../src/dsl.ts';

/** OP12-097 Captains Assembled. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_097: CardScript = {
  cardId: 'OP12-097',
  textHash: '0bd326f02ea497',
  verified: {
    source: 'cards/overrides/OP12-097.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Look at 3; reveal up to 1 Revolutionary Army card other than [Captains Assembled], add it, trash the rest',
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
                        type: 'Revolutionary Army',
                      },
                      {
                        not: {
                          name: 'Captains Assembled',
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
