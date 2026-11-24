import type { CardScript } from '../../src/dsl.ts';

/** OP11-034 Hatchan. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_034: CardScript = {
  cardId: 'OP11-034',
  textHash: '1398599ff19173',
  verified: {
    source: 'cards/overrides/OP11-034.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'no-rest',
      label:
        "You may rest this Character: if your Leader has the {Fish-Man} or {Merfolk} type, up to 1 of your opponent's Characters with a cost of 3 or less cannot be rested until the end of your opponent's next turn",
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          restSelf: true,
        },
      ],
      effect: [
        {
          if: {
            leader: {
              any: [
                {
                  type: 'Fish-Man',
                },
                {
                  type: 'Merfolk',
                },
              ],
            },
          },
          then: [
            {
              do: {
                restrict: {
                  target: {
                    from: 'characters',
                    owner: 'opponent',
                    filter: {
                      cost: {
                        lte: 3,
                      },
                    },
                    pick: {
                      upTo: 1,
                    },
                  },
                  what: 'cannotBeRested',
                  duration: 'untilEndOfOpponentsNextTurn',
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: the Leader condition follows the colon (an effect condition, the rest cost is paid regardless); "cannot be rested" is the full restriction (G2): no attack, no [Blocker], no rest by effects',
  ],
};
