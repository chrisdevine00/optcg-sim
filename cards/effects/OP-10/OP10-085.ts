import type { CardScript } from '../../src/dsl.ts';

/** OP10-085 Jesus Burgess. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_085: CardScript = {
  cardId: 'OP10-085',
  textHash: '1c17a89b3498ca',
  verified: {
    source: 'cards/overrides/OP10-085.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'rush',
      label: '[DON!! x1] With 8 or more cards in your trash, this Character gains [Rush]',
      kind: 'permanent',
      conditions: [
        {
          donGiven: 1,
        },
        {
          cmp: [
            {
              trash: 'you',
            },
            '>=',
            8,
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
            keyword: 'Rush',
          },
        },
      ],
    },
  ],
};
