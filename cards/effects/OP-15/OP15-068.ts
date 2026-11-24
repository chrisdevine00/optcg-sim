import type { CardScript } from '../../src/dsl.ts';

/** OP15-068 Heavenly Warriors. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_068: CardScript = {
  cardId: 'OP15-068',
  textHash: '184541de20ca59',
  verified: {
    source: 'cards/overrides/OP15-068.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'blocker',
      label: 'With 6 or less DON!! on your field, this Character gains [Blocker]',
      kind: 'permanent',
      conditions: [
        {
          cmp: [
            {
              donOnField: 'you',
            },
            '<=',
            6,
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
