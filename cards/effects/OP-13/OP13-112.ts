import type { CardScript } from '../../src/dsl.ts';

/** OP13-112 Vegapunk. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_112: CardScript = {
  cardId: 'OP13-112',
  textHash: '17ed18a5225c89',
  verified: {
    source: 'cards/overrides/OP13-112.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'blocker',
      label: 'With 2+ given DON!! in total, gains [Blocker]',
      kind: 'permanent',
      conditions: [
        {
          cmp: [
            {
              donGiven: 'you',
            },
            '>=',
            2,
          ],
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
};
