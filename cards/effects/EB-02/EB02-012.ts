import type { CardScript } from '../../src/dsl.ts';

/** EB02-012 Gaimon. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_012: CardScript = {
  cardId: 'EB02-012',
  textHash: '098a6a2e6da4b2',
  verified: {
    source: 'cards/overrides/EB02-012.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'blocker',
      label: 'If you have a [Sarfunkel], this Character gains [Blocker]',
      kind: 'permanent',
      conditions: [
        {
          exists: {
            from: 'characters',
            owner: 'you',
            filter: {
              name: 'Sarfunkel',
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
            keyword: 'Blocker',
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "a [Sarfunkel]" is a Sarfunkel Character on your field (Sarfunkel is a Character card); the Blocker is a granted keyword, not printed',
  ],
};
