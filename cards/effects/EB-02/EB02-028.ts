import type { CardScript } from '../../src/dsl.ts';

/** EB02-028 Portgas.D.Ace. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_028: CardScript = {
  cardId: 'EB02-028',
  textHash: '1b45b1cbaa5b63',
  verified: {
    source: 'cards/overrides/EB02-028.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader\'s type includes "Whitebeard Pirates": look at 5, add up to 1 Character with cost 2; rest to the bottom; play up to 1 Character with cost 2 from your hand rested',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              typeIncludes: 'Whitebeard Pirates',
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
                              eq: 2,
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
            {
              do: {
                play: {
                  what: {
                    from: 'hand',
                    owner: 'you',
                    filter: {
                      all: [
                        {
                          category: ['Character'],
                        },
                        {
                          cost: {
                            eq: 2,
                          },
                        },
                      ],
                    },
                    pick: {
                      upTo: 1,
                    },
                  },
                  rested: true,
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: "a cost of 2" is exactly 2; the play ("Then ... play up to 1 ... rested") is inside the type guard and may play the card just added or any other cost-2 Character in hand',
  ],
};
