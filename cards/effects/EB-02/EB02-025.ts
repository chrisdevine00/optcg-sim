import type { CardScript } from '../../src/dsl.ts';

/** EB02-025 Donquixote Rosinante. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_025: CardScript = {
  cardId: 'EB02-025',
  textHash: '1aabb88c0d5334',
  verified: {
    source: 'cards/overrides/EB02-025.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'play',
      label:
        'Rest 1 DON!! and this Character: if your Leader is [Donquixote Rosinante], look at 5, play up to 1 Character with cost 2 or less rested; rest to the bottom',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restDon: 1,
        },
        {
          restSelf: true,
        },
      ],
      effect: [
        {
          if: {
            leader: {
              name: 'Donquixote Rosinante',
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
                            category: ['Character'],
                          },
                          {
                            cost: {
                              lte: 2,
                            },
                          },
                        ],
                      },
                      to: 'play',
                      rested: true,
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
  ],
  rulings: [
    'reading: the Leader condition follows the cost colon, so it is an effect condition: the DON!! and this Character are rested and the look does not happen when the Leader is another card',
    'reading: the played Character is not revealed (the text says play)',
  ],
};
