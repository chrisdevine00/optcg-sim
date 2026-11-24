import type { CardScript } from '../../src/dsl.ts';

/** OP11-060 Let's Crash This Wedding!!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_060: CardScript = {
  cardId: 'OP11-060',
  textHash: '1139d2443b3fbf',
  verified: {
    source: 'cards/overrides/OP11-060.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "With a multicolored Leader: look at 5; reveal up to 1 {Straw Hat Crew} card other than [Let's Crash This Wedding!!!] and add it to your hand; rest to the bottom",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          if: {
            leader: {
              multicolor: true,
            },
          },
          then: [
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
                            type: 'Straw Hat Crew',
                          },
                          {
                            not: {
                              name: "Let's Crash This Wedding!!!",
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
  rulings: [
    'reading: "Then, place the rest at the bottom" is inside the multicolored-Leader guard (M4b-5)',
  ],
};
