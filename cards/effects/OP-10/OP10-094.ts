import type { CardScript } from '../../src/dsl.ts';

/** OP10-094 Ryuma. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_094: CardScript = {
  cardId: 'OP10-094',
  textHash: '10893c1743c129',
  verified: {
    source: 'cards/overrides/OP10-094.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'double-attack',
      label: '[DON!! x1] This Character gains [Double Attack]',
      kind: 'permanent',
      conditions: [
        {
          donGiven: 1,
        },
      ],
      apply: [
        {
          grant: {
            target: {
              from: 'self',
              owner: 'you',
            },
            keyword: 'Double Attack',
          },
        },
      ],
    },
  ],
};
