import type { CardScript } from '../../src/dsl.ts';

/** OP10-099 EustassCaptainKid. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_099: CardScript = {
  cardId: 'OP10-099',
  textHash: '0c4b13fd739366',
  verified: {
    source: 'cards/overrides/OP10-099.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'end',
      label:
        'End of your turn, you may turn 1 Life face-up: set up to 1 "Supernovas" Character with a cost of 3 to 8 as active; it gains [Blocker] until the end of your opponent\'s next turn',
      kind: 'auto',
      when: ['endOfYourTurn'],
      cost: [
        {
          turnLifeFaceUp: 1,
        },
      ],
      effect: [
        {
          do: {
            select: {
              from: 'characters',
              owner: 'you',
              filter: {
                all: [
                  {
                    type: 'Supernovas',
                  },
                  {
                    cost: {
                      gte: 3,
                    },
                  },
                  {
                    cost: {
                      lte: 8,
                    },
                  },
                ],
              },
              pick: {
                upTo: 1,
              },
              bind: 'kid',
            },
          },
        },
        {
          do: {
            setActive: {
              from: 'characters',
              owner: 'you',
              filter: {
                ref: 'kid',
              },
            },
          },
        },
        {
          do: {
            grant: {
              target: {
                from: 'characters',
                owner: 'you',
                filter: {
                  ref: 'kid',
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
  rulings: [
    'reading: the chosen Character (active or rested) is set active and gains [Blocker] either way; "That Character" is the one picked',
  ],
};
