import type { CardScript } from '../../src/dsl.ts';

/** OP12-063 Vinsmoke Reiju. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_063: CardScript = {
  cardId: 'OP12-063',
  textHash: '1abcef50c6b2fa',
  verified: {
    source: 'cards/overrides/OP12-063.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'boost',
      label: 'With 4 or more Events in your trash, this Character gains +2000 power and +5 cost',
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
      apply: [
        { power: { target: { from: 'self', owner: 'you' }, amount: 2000 } },
        { cost: { target: { from: 'self', owner: 'you' }, amount: 5 } },
      ],
    },
  ],
};
