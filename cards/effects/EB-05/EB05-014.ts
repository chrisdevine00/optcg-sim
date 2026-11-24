import type { CardScript } from '../../src/dsl.ts';

/** EB05-014 Shirahoshi. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_014: CardScript = {
  cardId: 'EB05-014',
  textHash: '09e8e11c7975f2',
  verified: {
    source: 'cards/overrides/EB05-014.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 5; reveal up to a total of 2 [Megalo] or {Neptunian} type cards and add them to your hand; trash the rest',
      kind: 'auto',
      when: ['onPlay'],
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
                    any: [
                      {
                        name: 'Megalo',
                      },
                      {
                        type: 'Neptunian',
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
      id: 'rush',
      label:
        'You may rest this Character: up to 1 of your {Neptunian} type Characters with 6000 power or less gains [Rush] during this turn',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restSelf: true,
        },
      ],
      effect: [
        {
          do: {
            grant: {
              target: {
                from: 'characters',
                owner: 'you',
                filter: {
                  all: [
                    {
                      type: 'Neptunian',
                    },
                    {
                      power: {
                        lte: 6000,
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
              keyword: 'Rush',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "[Megalo] or {Neptunian} type cards" is a card named Megalo or a card with the Neptunian type; "up to a total of 2" is one pick of up to 2',
  ],
};
