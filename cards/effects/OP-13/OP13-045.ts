import type { CardScript } from '../../src/dsl.ts';

/** OP13-045 Haruta. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_045: CardScript = {
  cardId: 'OP13-045',
  textHash: '11815eed152b5a',
  verified: {
    source: 'cards/overrides/OP13-045.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'attack',
      label: 'If you have 4 or less cards in your hand, draw 1 card',
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [{ if: { cmp: [{ hand: 'you' }, '<=', 4] }, then: [{ do: { draw: 1 } }] }],
    },
  ],
};
