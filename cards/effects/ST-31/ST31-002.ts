import type { CardScript } from '../../src/dsl.ts';

/** ST31-002 Jinbe. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST31_002: CardScript = {
  cardId: 'ST31-002',
  textHash: '0fd924488b599d',
  verified: {
    source: 'cards/overrides/ST31-002.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        'Draw 1 card and play up to 1 {Straw Hat Crew} type card with a cost of 1 from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            draw: 1,
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
                      type: 'Straw Hat Crew',
                    },
                    {
                      cost: {
                        eq: 1,
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
    'reading: "Draw 1 card and play" is a sequence; the drawn card is a candidate; no category filter is written because only a Character or Stage can be played',
  ],
};
