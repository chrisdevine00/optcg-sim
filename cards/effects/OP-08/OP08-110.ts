import type { CardScript } from '../../src/dsl.ts';

/** OP08-110 Wyper. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP08_110: CardScript = {
  cardId: 'OP08-110',
  textHash: '06b2771c819e11',
  verified: {
    source: 'cards/overrides/OP08-110.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 5, add up to 1 [Upper Yard] to your hand, rest to the bottom; play up to 1 [Upper Yard] from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                { pick: { upTo: 1 }, filter: { name: 'Upper Yard' }, reveal: true, to: 'hand' },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: { name: 'Upper Yard' },
                pick: { upTo: 1 },
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'The played [Upper Yard] may be the one just added or one already in hand ("from your hand")',
  ],
};
