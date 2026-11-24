import type { CardScript } from '../../src/dsl.ts';

/** EB03-048 Rebecca. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_048: CardScript = {
  cardId: 'EB03-048',
  textHash: '1dcbbf0f1f6b49',
  verified: {
    source: 'cards/overrides/EB03-048.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 5; reveal up to 1 {Dressrosa} Stage and add it to your hand; rest to the bottom; play up to 1 {Dressrosa} Stage with a cost of 1 from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                {
                  pick: { upTo: 1 },
                  filter: { all: [{ category: ['Stage'] }, { type: 'Dressrosa' }] },
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
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [{ category: ['Stage'] }, { type: 'Dressrosa' }, { cost: { eq: 1 } }],
                },
                pick: { upTo: 1 },
              },
            },
          },
        },
      ],
    },
  ],
};
