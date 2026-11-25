import type { CardScript } from '../../src/dsl.ts';

/** OP09-048 Dracule Mihawk. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_048: CardScript = {
  cardId: 'OP09-048',
  textHash: '0ad374d95590e6',
  keywords: ['Blocker'],
  verified: {
    source: 'cards/overrides/OP09-048.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Draw 2 cards and trash 1 card from your hand',
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
                exactly: 1,
              },
            },
          },
        },
      ],
    },
  ],
  rulings: ['reading: the trash is taken after the draw, from the enlarged hand'],
};
