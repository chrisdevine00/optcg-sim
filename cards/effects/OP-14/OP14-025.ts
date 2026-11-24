import type { CardScript } from '../../src/dsl.ts';

/** OP14-025 Kuro. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_025: CardScript = {
  cardId: 'OP14-025',
  textHash: '1d8feb1aab7d6c',
  verified: {
    source: 'cards/overrides/OP14-025.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader is [Kuro], play up to 1 {East Blue} Character with a cost of 6 or less from your hand',
      kind: 'auto',
      when: ['onPlay'],
      conditions: [
        {
          leader: {
            name: 'Kuro',
          },
        },
      ],
      effect: [
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
                      type: 'East Blue',
                    },
                    {
                      cost: {
                        lte: 6,
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "Leader is [Kuro]" is the exact name; the play is ungated on the hand (leak rule)',
  ],
};
