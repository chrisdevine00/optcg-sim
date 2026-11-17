import type { CardScript } from '../../src/dsl.ts';

/** OP17-107 Charlotte Daifuku. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_107: CardScript = {
  cardId: 'OP17-107',
  textHash: '0f1a2c81d06f73',
  verified: {
    source: 'cards/overrides/OP17-107.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'trigger',
      label: 'Play this card',
      kind: 'trigger',
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'self',
                owner: 'you',
              },
            },
          },
        },
      ],
    },
  ],
};
