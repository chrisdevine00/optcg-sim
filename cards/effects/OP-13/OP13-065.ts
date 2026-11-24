import type { CardScript } from '../../src/dsl.ts';

/** OP13-065 Shanks. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_065: CardScript = {
  cardId: 'OP13-065',
  textHash: '10e0cbd452efd8',
  verified: {
    source: 'cards/overrides/OP13-065.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 5; reveal up to 1 {Roger Pirates} card other than [Shanks] to hand; the rest to the bottom in any order',
      kind: 'auto',
      when: ['onPlay'],
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
                    all: [
                      {
                        typeIncludes: 'Roger Pirates',
                      },
                      {
                        not: {
                          name: 'Shanks',
                        },
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
    'reading: "a type including Roger Pirates" is `typeIncludes` (a {Former Roger Pirates} card qualifies); any category; "other than [Shanks]" excludes every card named exactly Shanks (not [Shanks] variants with a longer name)',
  ],
};
