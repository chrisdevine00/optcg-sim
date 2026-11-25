import type { CardScript } from '../../src/dsl.ts';

/** EB02-015 Jewelry Bonney. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_015: CardScript = {
  cardId: 'EB02-015',
  textHash: '19e7d1e3740f3c',
  verified: {
    source: 'cards/overrides/EB02-015.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Up to 1 rested opposing Character will not become active; set up to 1 DON!! active at the end of this turn',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            skipRefresh: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                state: 'rested',
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
        {
          delayed: {
            at: 'endOfThisTurn',
          },
          do: [
            {
              do: {
                setActive: {
                  from: 'donCostArea',
                  owner: 'you',
                  pick: {
                    upTo: 1,
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
    "reading: the skipped Character is chosen now and stays rested through the opponent's next Refresh Phase only; the second half is independent of the first (no If) and sets one rested DON!! active when this turn ends (the DON!! is chosen then)",
  ],
};
