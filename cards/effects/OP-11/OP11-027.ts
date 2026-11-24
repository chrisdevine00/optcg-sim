import type { CardScript } from '../../src/dsl.ts';

/** OP11-027 Bulge-Eyed Neptunian. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_027: CardScript = {
  cardId: 'OP11-027',
  textHash: '1d30cb37b85a45',
  verified: {
    source: 'cards/overrides/OP11-027.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'rush-char',
      label:
        'If your Leader is [Shirahoshi], this Character can attack Characters on the turn it is played',
      kind: 'permanent',
      conditions: [
        {
          leader: {
            name: 'Shirahoshi',
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
            keyword: 'Rush: Character',
          },
        },
      ],
    },
  ],
  rulings: ['reading: "If your Leader is [Shirahoshi]" is the exact Leader name'],
};
