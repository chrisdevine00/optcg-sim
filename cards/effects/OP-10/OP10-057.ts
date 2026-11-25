import type { CardScript } from '../../src/dsl.ts';

/** OP10-057 Leo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_057: CardScript = {
  cardId: 'OP10-057',
  textHash: '17ee712d7d08bd',
  verified: {
    source: 'cards/overrides/OP10-057.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'You may rest your Leader or 1 of your Stage cards: if your Leader is [Usopp], look at 5; reveal up to 2 {Dressrosa} cards other than [Leo] and add them to your hand; rest to the bottom, and trash 1 card from your hand',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          rest: {
            from: ['leader', 'stage'],
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          if: {
            leader: {
              name: 'Usopp',
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
                            type: 'Dressrosa',
                          },
                          {
                            not: {
                              name: 'Leo',
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
    },
  ],
  rulings: [
    'reading: the cost is paid whether or not the Leader is [Usopp] (the "If" is after the colon); the trash of 1 card is inside the Leader guard ("Then" after a failed "If" does not resolve, M4b-5); any category of {Dressrosa} card may be taken',
  ],
};
