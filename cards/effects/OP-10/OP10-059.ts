import type { CardScript } from '../../src/dsl.ts';

/** OP10-059 Fo...llow...Me...and...I...Will...Gui...de...You. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_059: CardScript = {
  cardId: 'OP10-059',
  textHash: '0de6c72f26fc6a',
  verified: {
    source: 'cards/overrides/OP10-059.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Look at 5 cards from the top of your deck; reveal up to 1 {Dressrosa} Character card and add it to your hand, then place the rest at the bottom of your deck in any order',
      kind: 'activate',
      when: 'main',
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
                        category: ['Character'],
                      },
                      {
                        type: 'Dressrosa',
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
