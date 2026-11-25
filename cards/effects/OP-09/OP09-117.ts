import type { CardScript } from '../../src/dsl.ts';

/** OP09-117 Dereshi!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_117: CardScript = {
  cardId: 'OP09-117',
  textHash: '09ec8f30c2f9a1',
  verified: {
    source: 'cards/overrides/OP09-117.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        '[Main] Look at 5; reveal up to 2 cards with a [Trigger] other than [Dereshi!] and add them to your hand; rest to the bottom',
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
                    upTo: 2,
                  },
                  filter: {
                    all: [
                      {
                        hasTrigger: true,
                      },
                      {
                        not: {
                          name: 'Dereshi!',
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
      label: 'Draw 1 card',
      kind: 'trigger',
      effect: [
        {
          do: {
            draw: 1,
          },
        },
      ],
    },
  ],
  rulings: ['reading: "with a [Trigger]" is any category of card that has a [Trigger] effect'],
};
