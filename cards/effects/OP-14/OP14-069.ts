import type { CardScript } from '../../src/dsl.ts';

/** OP14-069 Donquixote Doflamingo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_069: CardScript = {
  cardId: 'OP14-069',
  textHash: '0cdc4e5231ce78',
  verified: {
    source: 'cards/overrides/OP14-069.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'DON!! -3: choose one',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          donMinus: 3,
        },
      ],
      effect: [
        {
          chooseOne: [
            [
              {
                if: {
                  leader: {
                    type: 'Donquixote Pirates',
                  },
                },
                then: [
                  {
                    do: {
                      ko: {
                        from: 'characters',
                        owner: 'opponent',
                        filter: {
                          cost: {
                            lte: 8,
                          },
                        },
                        pick: {
                          upTo: 1,
                        },
                      },
                    },
                  },
                ],
              },
            ],
            [
              {
                do: {
                  restrict: {
                    target: {
                      from: 'characters',
                      owner: 'opponent',
                      filter: {
                        cost: {
                          lte: 7,
                        },
                      },
                      pick: {
                        upTo: 3,
                      },
                    },
                    what: 'cannotBeRested',
                    duration: 'untilEndOfOpponentsNextTurn',
                  },
                },
              },
            ],
          ],
          labels: [
            "If your Leader has {Donquixote Pirates}, K.O. up to 1 of your opponent's Characters with a cost of 8 or less",
            "Up to 3 of your opponent's Characters with a cost of 7 or less cannot be rested until the end of your opponent's next End Phase",
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: "until the end of your opponent\'s next End Phase" is the engine duration untilEndOfOpponentsNextTurn (the end of the opponent\'s next turn)',
    'reading: the first mode may be chosen with a non-{Donquixote Pirates} Leader and then does nothing (E-Q6)',
  ],
};
