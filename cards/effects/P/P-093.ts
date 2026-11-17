import type { CardScript } from '../../src/dsl.ts';

/** P-093 Trafalgar Law. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const P_093: CardScript = {
  cardId: 'P-093',
  textHash: '155ffeccf91497',
  verified: {
    source: 'cards/overrides/P-093.json (card text in cards/data)',
    date: '2026-10-28',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        'If you have as few DON!! as your opponent or fewer, add up to 1 DON!! from your DON!! deck as rested',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            cmp: [
              {
                donOnField: 'you',
              },
              '<=',
              {
                donOnField: 'opponent',
              },
            ],
          },
          then: [
            {
              do: {
                addDon: [
                  {
                    n: 1,
                    state: 'rested',
                    upTo: true,
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
};
