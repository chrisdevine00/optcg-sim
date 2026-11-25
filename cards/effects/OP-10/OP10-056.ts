import type { CardScript } from '../../src/dsl.ts';

/** OP10-056 Mansherry. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_056: CardScript = {
  cardId: 'OP10-056',
  textHash: '1eeb14f36767e8',
  verified: {
    source: 'cards/overrides/OP10-056.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "You may rest 1 of your {Dressrosa} Leader or Stage and return 1 of your {Dressrosa} Characters with a cost of 4 or more to the hand: return up to 1 of your opponent's Characters with a cost of 4 or less to the hand",
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          rest: {
            from: ['leader', 'stage'],
            owner: 'you',
            filter: {
              type: 'Dressrosa',
            },
            pick: {
              exactly: 1,
            },
          },
        },
        {
          move: {
            from: 'characters',
            owner: 'you',
            filter: {
              all: [
                {
                  type: 'Dressrosa',
                },
                {
                  cost: {
                    gte: 4,
                  },
                },
              ],
            },
            pick: {
              exactly: 1,
            },
          },
          to: {
            zone: 'hand',
          },
        },
      ],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'opponent',
                filter: {
                  cost: {
                    lte: 4,
                  },
                },
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'hand',
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: both parts are one cost (paid together or not at all); Mansherry (cost 2) cannot return herself',
  ],
};
