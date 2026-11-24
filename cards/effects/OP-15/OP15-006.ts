import type { CardScript } from '../../src/dsl.ts';

/** OP15-006 Cavendish. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_006: CardScript = {
  cardId: 'OP15-006',
  textHash: '07a4f4d25572ae',
  verified: {
    source: 'cards/overrides/OP15-006.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'events',
      label: 'With 4 or more Events in your trash, +2000 power',
      kind: 'permanent',
      conditions: [
        {
          cmp: [
            { count: { from: 'trash', owner: 'you', filter: { category: ['Event'] } } },
            '>=',
            4,
          ],
        },
      ],
      apply: [{ power: { target: { from: 'self', owner: 'you' }, amount: 2000 } }],
    },
  ],
};
