import type { CardScript } from '../../src/dsl.ts';

/** OP16-027 Jinbe. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_027: CardScript = {
  cardId: 'OP16-027',
  textHash: '19a09dbefab98d',
  verified: {
    source: 'cards/overrides/OP16-027.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'don-power',
      label: '[DON!! x1] This Character gains +2000 power',
      kind: 'permanent',
      conditions: [
        {
          donGiven: 1,
        },
      ],
      apply: [
        {
          power: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: 2000,
          },
        },
      ],
    },
  ],
};
