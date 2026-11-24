import type { CardScript } from '../../src/dsl.ts';

/** OP15-050 Bobby Funk. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_050: CardScript = {
  cardId: 'OP15-050',
  textHash: '10632916e8aadd',
  verified: {
    source: 'cards/overrides/OP15-050.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'kelly',
      label: 'If you have [Kelly Funk], this Character gains +3000 power',
      kind: 'permanent',
      conditions: [
        {
          exists: {
            from: 'characters',
            owner: 'you',
            filter: {
              name: 'Kelly Funk',
            },
          },
        },
      ],
      apply: [
        {
          power: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: 3000,
          },
        },
      ],
    },
  ],
};
