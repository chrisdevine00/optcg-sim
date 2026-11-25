import type { CardScript } from '../../src/dsl.ts';

/** OP10-108 Scratchmen Apoo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_108: CardScript = {
  cardId: 'OP10-108',
  textHash: '1f85c0a2165fd4',
  verified: {
    source: 'cards/overrides/OP10-108.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'blocker',
      label:
        'If you have a yellow Supernovas Character other than [Scratchmen Apoo], this Character gains [Blocker]',
      kind: 'permanent',
      conditions: [
        {
          exists: {
            from: 'characters',
            owner: 'you',
            filter: {
              all: [
                {
                  color: 'Yellow',
                },
                {
                  type: 'Supernovas',
                },
                {
                  not: {
                    name: 'Scratchmen Apoo',
                  },
                },
              ],
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
};
