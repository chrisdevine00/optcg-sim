import type { CardScript } from '../../src/dsl.ts';

/** ST33-001 Koby. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST33_001: CardScript = {
  cardId: 'ST33-001',
  textHash: '068aaf0b6f9369',
  verified: {
    source: 'cards/overrides/ST33-001.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label: 'You may trash 1 card from your hand: draw 1 card',
      kind: 'auto',
      when: ['onPlay'],
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
      effect: [{ do: { draw: 1 } }],
    },
  ],
};
