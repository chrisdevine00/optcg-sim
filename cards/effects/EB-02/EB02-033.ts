import type { CardScript } from '../../src/dsl.ts';

/** EB02-033 Klabautermann. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_033: CardScript = {
  cardId: 'EB02-033',
  textHash: '0479a9b23f33bc',
  verified: {
    source: 'cards/overrides/EB02-033.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'blocker',
      label: 'If you have [Merry Go] on your field, this Character gains [Blocker]',
      kind: 'permanent',
      conditions: [
        {
          exists: {
            from: 'stage',
            owner: 'you',
            filter: {
              name: 'Merry Go',
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
    'reading: [Merry Go] is a Stage (any of the cards of that name); a granted Blocker, not printed',
  ],
};
