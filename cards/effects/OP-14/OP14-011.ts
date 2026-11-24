import type { CardScript } from '../../src/dsl.ts';

/** OP14-011 Bartolomeo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_011: CardScript = {
  cardId: 'OP14-011',
  textHash: '1e28fa1474b110',
  verified: {
    source: 'cards/overrides/OP14-011.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'blocker',
      label: '[DON!! x2] gains [Blocker]',
      kind: 'permanent',
      conditions: [
        {
          donGiven: 2,
        },
      ],
      apply: [
        {
          grant: {
            target: {
              from: 'self',
              owner: 'you',
            },
            keyword: 'Blocker',
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: [DON!! x2] is 2 or more DON!! given to this card; [Blocker] is gained, not printed',
  ],
};
