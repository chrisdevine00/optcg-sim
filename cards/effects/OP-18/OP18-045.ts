import type { CardScript } from '../../src/dsl.ts';

/** OP18-045 Mr.Prince. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_045: CardScript = {
  cardId: 'OP18-045',
  textHash: '0399113c3a45a2',
  verified: {
    source: 'cards/overrides/OP18-045.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  rules: [{ alsoNamed: ['Sanji'] }],
  abilities: [
    {
      id: 'boost',
      label: 'This Character gains +1000 power for every 5 Events in your trash',
      kind: 'permanent',
      apply: [
        {
          power: {
            target: { from: 'self', owner: 'you' },
            amount: {
              mul: [
                {
                  div: [
                    { count: { from: 'trash', owner: 'you', filter: { category: ['Event'] } } },
                    5,
                  ],
                },
                1000,
              ],
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading (as OP12-070): the boost steps by 1000 at 5, 10, 15 Events (floor of Events / 5); it counts only your own trash',
  ],
};
