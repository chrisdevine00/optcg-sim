import type { CardScript } from '../../src/dsl.ts';

/** EB04-056 Pacifista. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_056: CardScript = {
  cardId: 'EB04-056',
  textHash: '07707f517f1ca2',
  verified: {
    source: 'cards/overrides/EB04-056.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'blocker',
      label: 'With [Jewelry Bonney] and 0 Life, gains [Blocker]',
      kind: 'permanent',
      conditions: [
        {
          exists: {
            from: ['leader', 'characters'],
            owner: 'you',
            filter: {
              name: 'Jewelry Bonney',
            },
          },
        },
        {
          cmp: [
            {
              life: 'you',
            },
            '=',
            0,
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
