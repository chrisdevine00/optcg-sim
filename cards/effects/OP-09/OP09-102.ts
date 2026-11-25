import type { CardScript } from '../../src/dsl.ts';

/** OP09-102 Professor Clover. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_102: CardScript = {
  cardId: 'OP09-102',
  textHash: '055247075d2960',
  verified: {
    source: 'cards/overrides/OP09-102.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      kind: 'auto',
      when: ['onPlay'],
      label:
        'If your Leader is [Nico Robin], look at 3 cards from the top of your deck; reveal up to 1 card with a [Trigger] and add it to your hand, then place the rest at the bottom in any order',
      effect: [
        {
          if: {
            leader: {
              name: 'Nico Robin',
            },
          },
          then: [
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
                        hasTrigger: true,
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
    {
      id: 'trigger',
      kind: 'trigger',
      label: "Activate this card's [On Play] effect",
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
  rulings: [
    'reading: "Then, place the rest" is inside the Leader guard (M4b-5); the [Trigger] re-checks the Leader',
  ],
};
