import type { CardScript } from '../../src/dsl.ts';

/** OP09-050 Nami. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_050: CardScript = {
  cardId: 'OP09-050',
  textHash: '1b987390208f29',
  verified: {
    source: 'cards/overrides/OP09-050.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'when-attacking',
      label:
        'Look at 5; reveal up to 1 blue Event and add it to your hand; the rest to the bottom in any order',
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
                    all: [
                      {
                        category: ['Event'],
                      },
                      {
                        color: 'Blue',
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
  rulings: [
    'reading: "blue Event" is an Event whose colour includes Blue (a multicolour Event with blue counts)',
  ],
};
