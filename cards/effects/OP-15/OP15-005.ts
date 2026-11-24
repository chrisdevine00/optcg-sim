import type { CardScript } from '../../src/dsl.ts';

/** OP15-005 Cabaji. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_005: CardScript = {
  cardId: 'OP15-005',
  textHash: '1a632813b27296',
  verified: {
    source: 'cards/overrides/OP15-005.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'when-attacking',
      label: 'If your opponent has any DON!! given, +2000 power',
      kind: 'auto',
      when: ['whenAttacking'],
      conditions: [{ cmp: [{ donGiven: 'opponent' }, '>=', 1] }],
      effect: [
        {
          do: {
            power: { target: { from: 'self', owner: 'you' }, amount: 2000, duration: 'thisTurn' },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "any DON!! cards given" counts DON!! given to any of the opponent\'s Leader and Characters',
  ],
};
