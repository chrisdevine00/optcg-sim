import type { CardScript } from '../../src/dsl.ts';

/** OP09-044 Izo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_044: CardScript = {
  cardId: 'OP09-044',
  textHash: '0789fc3b2a8890',
  verified: {
    source: 'cards/overrides/OP09-044.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'when-attacking',
      label:
        'Look at 5; reveal up to 1 {Land of Wano} card or card with a type including "Whitebeard Pirates" and add it to your hand; the rest to the bottom in any order; trash 1 card from your hand',
      kind: 'auto',
      when: ['whenAttacking'],
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
                    any: [
                      {
                        type: 'Land of Wano',
                      },
                      {
                        typeIncludes: 'Whitebeard Pirates',
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
        {
          do: {
            trashFromHand: {
              from: 'hand',
              owner: 'you',
              pick: {
                exactly: 1,
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: {Land of Wano} is an exact type; "a type including Whitebeard Pirates" is a substring test (CR 2-4-3-1); the trash is unconditional and may take the card just added',
  ],
};
