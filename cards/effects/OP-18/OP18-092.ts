import type { CardScript } from '../../src/dsl.ts';

/** OP18-092 Roronoa Zoro. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_092: CardScript = {
  cardId: 'OP18-092',
  textHash: '12e6ef5af6eaea',
  verified: {
    source: 'cards/overrides/OP18-092.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },

  abilities: [
    {
      id: 'big-power',
      label: '+3000 power while a Character with a cost of 12 or more exists',
      kind: 'permanent',
      conditions: [{ exists: { from: 'characters', owner: 'any', filter: { cost: { gte: 12 } } } }],
      apply: [{ power: { target: { from: 'self', owner: 'you' }, amount: 3000 } }],
    },
    {
      id: 'rush',
      label: 'With 10 or more cards in your trash, gains [Rush]',
      kind: 'permanent',
      conditions: [{ cmp: [{ trash: 'you' }, '>=', 10] }],
      apply: [{ grant: { target: { from: 'self', owner: 'you' }, keyword: 'Rush' } }],
    },
  ],
};
