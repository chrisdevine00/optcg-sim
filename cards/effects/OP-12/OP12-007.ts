import type { CardScript } from '../../src/dsl.ts';

/** OP12-007 Shanks. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_007: CardScript = {
  cardId: 'OP12-007',
  textHash: '13b7323b645e83',
  verified: {
    source: 'cards/overrides/OP12-007.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Up to 1 other {Roger Pirates} Character gains [Rush]',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            grant: {
              target: {
                from: 'characters',
                owner: 'you',
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
                pick: {
                  upTo: 1,
                },
              },
              keyword: 'Rush',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'Read: "other than [Shanks]" excludes every card named [Shanks] (a second copy too), not only this card',
  ],
};
