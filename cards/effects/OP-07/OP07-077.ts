import type { CardScript } from '../../src/dsl.ts';

/** OP07-077 We're Going to Claim the One Piece!!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP07_077: CardScript = {
  cardId: 'OP07-077',
  textHash: '0497ae2083c580',
  verified: {
    source: 'cards/overrides/OP07-077.json (card text in cards/data)',
    date: '2026-10-28',
    note: 'types printed in square brackets ([Animal Kingdom Pirates]) are type references (effect-dsl §1.5)',
  },
  abilities: [
    {
      id: 'main',
      label: 'Look at 5; add up to 1 {Animal Kingdom Pirates} or {Big Mom Pirates} card',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          if: {
            leader: {
              any: [
                {
                  type: 'Animal Kingdom Pirates',
                },
                {
                  type: 'Big Mom Pirates',
                },
              ],
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
                        any: [
                          {
                            type: 'Animal Kingdom Pirates',
                          },
                          {
                            type: 'Big Mom Pirates',
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
};
