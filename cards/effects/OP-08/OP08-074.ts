import type { CardScript } from '../../src/dsl.ts';

/** OP08-074 Black Maria. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP08_074: CardScript = {
  cardId: 'OP08-074',
  textHash: '0c67d9524b9519',
  verified: {
    source: 'cards/overrides/OP08-074.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'ramp',
      label:
        "Add up to 5 rested DON!!; at the end of this turn, return DON!! down to your opponent's count",
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      effect: [
        {
          if: {
            none: {
              from: 'characters',
              owner: 'you',
              filter: {
                all: [
                  {
                    name: 'Black Maria',
                  },
                  {
                    isSelf: false,
                  },
                ],
              },
            },
          },
          then: [
            {
              do: {
                addDon: [
                  {
                    n: 5,
                    state: 'rested',
                    upTo: true,
                  },
                ],
              },
            },
            {
              delayed: {
                at: 'endOfThisTurn',
              },
              do: [
                {
                  do: {
                    returnDon: {
                      n: 'toMatchOpponent',
                    },
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'QA-OP08 OP08-074: the end-of-turn return happens even if Black Maria has left; it counts as DON!! returned for other effects',
  ],
};
