import type { CardScript } from '../../src/dsl.ts';

/** OP18-006 Koza. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_006: CardScript = {
  cardId: 'OP18-006',
  textHash: '1901286d381c66',
  verified: {
    source: 'cards/overrides/OP18-006.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'vivi',
      label: 'If you have [Nefeltari Vivi], gains [Rush] and +1000 power',
      kind: 'permanent',
      conditions: [
        {
          exists: {
            from: ['leader', 'characters'],
            owner: 'you',
            filter: {
              name: 'Nefeltari Vivi',
            },
          },
        },
      ],
      apply: [
        {
          grant: {
            target: {
              from: 'self',
              owner: 'you',
            },
            keyword: 'Rush',
          },
        },
        {
          power: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: 1000,
          },
        },
      ],
    },
  ],
  rulings: [
    'Q2 proposed reading (m6b-audit OP-18): "have [Nefeltari Vivi]" counts a Character or the Leader of that name on your field (OP18-020 is a Leader named [Nefeltari Vivi])',
  ],
};
