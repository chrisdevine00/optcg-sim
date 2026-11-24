import type { CardScript } from '../../src/dsl.ts';

/** OP13-093 Morgans. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_093: CardScript = {
  cardId: 'OP13-093',
  textHash: '1a7aa882b5ea38',
  verified: {
    source: 'cards/overrides/OP13-093.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label: 'Draw 2 cards and trash 2 cards from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            draw: 2,
          },
        },
        {
          do: {
            trashFromHand: {
              from: 'hand',
              owner: 'you',
              pick: {
                exactly: 2,
              },
            },
          },
        },
      ],
    },
  ],
};
