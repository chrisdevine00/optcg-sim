import type { CardScript } from '../../src/dsl.ts';

/** OP15-101 Kalgara. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_101: CardScript = {
  cardId: 'OP15-101',
  textHash: '0cea09553b4022',
  verified: {
    source: 'cards/overrides/OP15-101.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Trash 1 card from your hand: look at 5, add up to a total of 2 [Mont Blanc Noland] or {Shandian Warrior} cards to your hand, rest to the bottom',
      kind: 'auto',
      when: ['onPlay'],
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                {
                  pick: { upTo: 2 },
                  filter: { any: [{ name: 'Mont Blanc Noland' }, { type: 'Shandian Warrior' }] },
                  reveal: true,
                  to: 'hand',
                },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    '"Up to a total of 2" is one pick of at most 2 cards across both filters, not 2 of each',
  ],
};
