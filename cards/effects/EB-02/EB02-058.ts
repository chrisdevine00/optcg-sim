import type { CardScript } from '../../src/dsl.ts';

/** EB02-058 UUUUUS!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_058: CardScript = {
  cardId: 'EB02-058',
  textHash: '00e10c2b44d8ef',
  verified: {
    source: 'cards/overrides/EB02-058.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Look at 4; reveal up to 1 card with a cost of 4 or more and add it to your hand; the rest to the bottom in any order',
      kind: 'activate',
      when: 'main',
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
                    cost: {
                      gte: 4,
                    },
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
  rulings: [
    'Read: any card type with a cost of 4 or more may be taken (Character, Event or Stage; the printed cost); "up to 1" may take nothing even with a match (CR 8-4-4-2); the rest go to the bottom in an order the owner picks (a single card needs none)',
  ],
};
