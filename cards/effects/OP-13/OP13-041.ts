import type { CardScript } from '../../src/dsl.ts';

/** OP13-041 Izo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_041: CardScript = {
  cardId: 'OP13-041',
  textHash: '07a2c546c50487',
  verified: {
    source: 'cards/overrides/OP13-041.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Draw 2 cards',
      kind: 'auto',
      when: ['onPlay'],
      effect: [{ do: { draw: 2 } }],
    },
  ],
};
