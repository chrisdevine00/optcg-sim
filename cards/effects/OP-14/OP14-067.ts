import type { CardScript } from '../../src/dsl.ts';

/** OP14-067 Dellinger. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_067: CardScript = {
  cardId: 'OP14-067',
  textHash: '173a52774fcb30',
  verified: {
    source: 'cards/overrides/OP14-067.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label:
        'Add up to 1 DON!! rested; look at 5, reveal up to 1 {Donquixote Pirates} card to hand, the rest to the bottom in any order',
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            addDon: [
              {
                n: 1,
                state: 'rested',
                upTo: true,
              },
            ],
          },
        },
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                {
                  pick: {
                    upTo: 1,
                  },
                  filter: {
                    type: 'Donquixote Pirates',
                  },
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
    'reading: the DON!! add and the look are two sequential steps of one effect; the look happens even with an empty DON!! deck',
  ],
};
