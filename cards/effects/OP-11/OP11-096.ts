import type { CardScript } from '../../src/dsl.ts';

/** OP11-096 Ripper. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_096: CardScript = {
  cardId: 'OP11-096',
  textHash: '025797f3ab073b',
  verified: {
    source: 'cards/overrides/OP11-096.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'blocker',
      label:
        'If you have a black "Navy" Character other than [Ripper], this Character gains [Blocker]',
      kind: 'permanent',
      conditions: [
        {
          exists: {
            from: 'characters',
            owner: 'you',
            filter: {
              all: [
                {
                  color: 'Black',
                },
                {
                  type: 'Navy',
                },
                {
                  not: {
                    name: 'Ripper',
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
  rulings: [
    'reading: "other than [Ripper]" is by name, so another copy of Ripper does not count and neither does this one',
  ],
};
