import type { CardScript } from '../../src/dsl.ts';

/** OP11-030 Shirahoshi. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_030: CardScript = {
  cardId: 'OP11-030',
  textHash: '04569996934f5e',
  verified: {
    source: 'cards/overrides/OP11-030.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'search',
      label:
        'You may rest 1 DON!! and this Character: look at 5; reveal up to 1 {Neptunian} or {Fish-Man Island} card and add it to your hand; the rest to the bottom in any order',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restDon: 1,
        },
        {
          restSelf: true,
        },
      ],
      effect: [
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
                    any: [
                      {
                        type: 'Neptunian',
                      },
                      {
                        type: 'Fish-Man Island',
                      },
                    ],
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
    'reading: any card type with the {Neptunian} or {Fish-Man Island} type may be taken (a Character, Event or Stage)',
  ],
};
