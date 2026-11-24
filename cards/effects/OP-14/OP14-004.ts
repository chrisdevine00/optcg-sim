import type { CardScript } from '../../src/dsl.ts';

/** OP14-004 Cavendish. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_004: CardScript = {
  cardId: 'OP14-004',
  textHash: '0c6587f4ed6236',
  verified: {
    source: 'cards/overrides/OP14-004.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'rush',
      label: 'With 5000 power or more, gains [Rush]',
      kind: 'permanent',
      conditions: [
        {
          self: {
            power: {
              gte: 5000,
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
      ],
    },
  ],
  rulings: [
    'reading: current power incl. given DON!!; [Rush] is gained, not printed (keywords stay empty)',
  ],
};
