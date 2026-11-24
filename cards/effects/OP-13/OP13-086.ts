import type { CardScript } from '../../src/dsl.ts';

/** OP13-086 Saint Shalria. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_086: CardScript = {
  cardId: 'OP13-086',
  textHash: '1fc7feb926befa',
  verified: {
    source: 'cards/overrides/OP13-086.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 3; reveal up to 1 "Celestial Dragons" card other than [Saint Shalria] to hand; trash the rest and 1 card from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 3,
              take: [
                {
                  pick: {
                    upTo: 1,
                  },
                  filter: {
                    all: [
                      {
                        type: 'Celestial Dragons',
                      },
                      {
                        not: {
                          name: 'Saint Shalria',
                        },
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
    'reading: "Then, trash the rest and trash 1 card from your hand": the hand trash is mandatory and sequential (a card just taken is a candidate), not an "If you do"; the rest of the 3 go to the trash (not the bottom); the type is the exact {Celestial Dragons} type',
  ],
};
