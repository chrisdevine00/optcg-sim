import type { CardScript } from '../../src/dsl.ts';

/** OP11-070 Charlotte Pudding. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_070: CardScript = {
  cardId: 'OP11-070',
  textHash: '1857218fe6a502',
  verified: {
    source: 'cards/overrides/OP11-070.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 5; reveal up to 1 {Big Mom Pirates} card with cost 2 or more and add it to your hand; rest to the bottom',
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
                    upTo: 1,
                  },
                  filter: {
                    all: [
                      {
                        type: 'Big Mom Pirates',
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
    {
      id: 'look-opp',
      label: "DON!! -1, rest this Character: look at 1 card from the top of your opponent's deck",
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          donMinus: 1,
        },
        {
          restSelf: true,
        },
      ],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 1,
              player: 'opponent',
              take: [],
              rest: 'stay',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "DON!! -1, You may rest this Character:" is one cost of both parts (an Activate is the player\'s choice, so it is never half-paid); it cannot be activated when this Character is already rested',
  ],
};
