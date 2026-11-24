import type { CardScript } from '../../src/dsl.ts';

/** EB05-042 Shinobu. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_042: CardScript = {
  cardId: 'EB05-042',
  textHash: '055f815aaa5edf',
  verified: {
    source: 'cards/overrides/EB05-042.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Draw 2 and trash 2 cards from your hand',
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
