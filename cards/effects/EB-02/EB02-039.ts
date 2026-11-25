import type { CardScript } from '../../src/dsl.ts';

/** EB02-039 GERMA 66. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_039: CardScript = {
  cardId: 'EB02-039',
  textHash: '08647d375d99c3',
  verified: {
    source: 'cards/overrides/EB02-039.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'main',
      label:
        'You may trash 1 {GERMA 66} Character with 4000 power or less from your hand: if you have as few DON!! as your opponent or fewer, play up to 1 Character with 5000 to 7000 power and the same name as the trashed card from your trash',
      kind: 'activate',
      when: 'main',
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            filter: {
              all: [{ category: ['Character'] }, { type: 'GERMA 66' }, { power: { lte: 4000 } }],
            },
            pick: { exactly: 1 },
            bind: 'trashed',
          },
        },
      ],
      costOptional: true,
      effect: [
        {
          if: { cmp: [{ donOnField: 'you' }, '<=', { donOnField: 'opponent' }] },
          then: [
            {
              do: {
                play: {
                  what: {
                    from: 'trash',
                    owner: 'you',
                    filter: {
                      all: [
                        { category: ['Character'] },
                        { power: { gte: 5000 } },
                        { power: { lte: 7000 } },
                        { sameNameAs: 'trashed' },
                      ],
                    },
                    pick: { upTo: 1 },
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: the type is the exact "GERMA 66" type element; the DON!! comparison counts the whole field (cost area plus given) at resolution, after the cost is paid; the cost is declinable (costOptional) and declining it plays nothing; the Character played shares the trashed card name, so it is another copy (or a same-named card) in the trash with 5000 to 7000 power, never the trashed card itself (at most 4000)',
  ],
};
