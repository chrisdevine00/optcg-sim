import type { CardScript } from '../../src/dsl.ts';

/** EB05-002 Doll. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_002: CardScript = {
  cardId: 'EB05-002',
  textHash: '132ab2bf9b38b6',
  verified: {
    source: 'cards/overrides/EB05-002.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 5; reveal up to 2 {Navy} cards with cost 2 or more to hand, the rest to the bottom; then trash 1 from your hand',
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
                    all: [
                      {
                        type: 'Navy',
                      },
                      {
                        cost: {
                          gte: 2,
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
  rulings: [
    'reading: "Then, trash 1 card from your hand" is not conditioned on having added a card (it is not "If you do"), so it always happens',
  ],
};
