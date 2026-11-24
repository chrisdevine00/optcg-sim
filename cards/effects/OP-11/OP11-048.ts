import type { CardScript } from '../../src/dsl.ts';

/** OP11-048 Capone"Gang"Bege. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_048: CardScript = {
  cardId: 'OP11-048',
  textHash: '19222336d2412e',
  verified: {
    source: 'cards/overrides/OP11-048.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 4; reveal up to 1 {Firetank Pirates} or {Straw Hat Crew} card with cost 2 or more and add it to your hand; rest to the bottom',
      kind: 'auto',
      when: ['onPlay'],
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
                    all: [
                      {
                        any: [
                          {
                            type: 'Firetank Pirates',
                          },
                          {
                            type: 'Straw Hat Crew',
                          },
                        ],
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
      ],
    },
  ],
  rulings: [
    'reading: the card may be of any category (Character, Event or Stage); a card with no cost (a Leader) never matches "cost of 2 or more"',
  ],
};
