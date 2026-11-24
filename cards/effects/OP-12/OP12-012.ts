import type { CardScript } from '../../src/dsl.ts';

/** OP12-012 Buggy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_012: CardScript = {
  cardId: 'OP12-012',
  textHash: '0c8e90d06cf2f8',
  verified: {
    source: 'cards/overrides/OP12-012.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Up to 1 other {Roger Pirates} Character gains [Blocker] until the end of your opponent's next End Phase",
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
                        name: 'Buggy',
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
              keyword: 'Blocker',
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: ['Read: "other than [Buggy]" excludes every card named [Buggy]'],
};
