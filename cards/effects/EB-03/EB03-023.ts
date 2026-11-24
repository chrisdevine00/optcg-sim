import type { CardScript } from '../../src/dsl.ts';

/** EB03-023. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_023: CardScript = {
  cardId: 'EB03-023',
  textHash: '17eec0f71ca3ed',
  verified: {
    source: 'cards/overrides/EB03-023.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 5 cards from the top of your deck and place them at the top or bottom in any order',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [],
              rest: 'topOrBottomAnyOrder',
            },
          },
        },
      ],
    },
  ],
};
