import type { CardScript } from '../../src/dsl.ts';

/** OP15-013 Pincers. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_013: CardScript = {
  cardId: 'OP15-013',
  textHash: '0d0a7f70679bba',
  verified: {
    source: 'cards/overrides/OP15-013.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'cheaper',
      label: 'In hand: -2 cost if your Leader has 0 power or less',
      kind: 'permanent',
      zone: 'hand',
      conditions: [{ leader: { power: { lte: 0 } } }],
      apply: [{ cost: { target: { from: 'self', owner: 'you' }, amount: -2 } }],
    },
  ],
};
