import type { CardScript } from '../../src/dsl.ts';

/** EB02-022 Usopp. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_022: CardScript = {
  cardId: 'EB02-022',
  textHash: '0d1de280026761',
  verified: {
    source: 'cards/overrides/EB02-022.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If you have 2 or less Characters with 5000 power or more, play up to 1 Character with 6000 power or less and no base effect from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            cmp: [
              { count: { from: 'characters', owner: 'you', filter: { power: { gte: 5000 } } } },
              '<=',
              2,
            ],
          },
          then: [
            {
              do: {
                play: {
                  what: {
                    from: 'hand',
                    owner: 'you',
                    filter: {
                      all: [
                        { category: ['Character'] },
                        { power: { lte: 6000 } },
                        { hasBaseEffect: false },
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
    'reading: "Characters with 5000 power or more" is current power (a boost counts) and includes Usopp himself (5000), so with him and one other at 5000 or more the effect still works and a third stops it; the hand pick is "up to 1" and asked at max 0 whatever the hand holds',
  ],
};
