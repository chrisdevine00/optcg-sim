import type { CardScript } from '../../src/dsl.ts';

/** OP10-044 Cub. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_044: CardScript = {
  cardId: 'OP10-044',
  textHash: '0ddfd00e6b1cce',
  verified: {
    source: 'cards/overrides/OP10-044.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "You may rest 1 of your {Dressrosa} Leader or Stage: return up to 1 of your opponent's Characters with a cost of 1 or less to the owner's hand",
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
                    lte: 1,
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
};
