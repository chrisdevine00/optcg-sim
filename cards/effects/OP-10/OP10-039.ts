import type { CardScript } from '../../src/dsl.ts';

/** OP10-039 Gum-Gum Dragon Fire Pistol Twister Star. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_039: CardScript = {
  cardId: 'OP10-039',
  textHash: '172b24620157cc',
  verified: {
    source: 'cards/overrides/OP10-039.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'If your Leader has the {ODYSSEY} type, look at 5 cards from the top of your deck; reveal up to 2 {ODYSSEY} Character cards and add them to your hand, then place the rest at the bottom of your deck in any order',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          if: {
            leader: {
              type: 'ODYSSEY',
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
                        upTo: 2,
                      },
                      filter: {
                        all: [
                          {
                            category: ['Character'],
                          },
                          {
                            type: 'ODYSSEY',
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
      label: "Rest up to 1 of your opponent's Characters with a cost of 5 or less",
      kind: 'trigger',
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 5,
                },
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the Leader-type "If" has no colon, so it is an effect condition with the whole look inside it (the "Then, place the rest" is part of the look); with another Leader nothing is looked at',
  ],
};
