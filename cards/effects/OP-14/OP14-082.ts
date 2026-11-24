import type { CardScript } from '../../src/dsl.ts';

/** OP14-082 Oinkchuck. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_082: CardScript = {
  cardId: 'OP14-082',
  textHash: '0662dfb2ab725f',
  verified: {
    source: 'cards/overrides/OP14-082.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label:
        "All of your {Thriller Bark Pirates} Characters gain +4 cost until the end of your opponent's next End Phase",
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          if: { opponentsTurn: true },
          // K.O.'d on the opponent's turn: the next opponent End Phase is this turn's.
          then: [
            {
              do: {
                cost: {
                  target: {
                    from: 'characters',
                    owner: 'you',
                    filter: { type: 'Thriller Bark Pirates' },
                  },
                  amount: 4,
                  duration: 'thisTurn',
                },
              },
            },
          ],
          else: [
            {
              do: {
                cost: {
                  target: {
                    from: 'characters',
                    owner: 'you',
                    filter: { type: 'Thriller Bark Pirates' },
                  },
                  amount: 4,
                  duration: 'untilEndOfOpponentsNextTurn',
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label:
        'Play up to 1 {Thriller Bark Pirates} Character with a cost of 2 or less from your trash rested',
      kind: 'trigger',
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      type: 'Thriller Bark Pirates',
                    },
                    {
                      cost: {
                        lte: 2,
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
              rested: true,
            },
          },
        },
      ],
    },
  ],
  rulings: [
    "reading: 'until the end of your opponent's next End Phase' is split on whose turn it is: on the opponent's turn (a battle K.O., their effect) the next End Phase is that turn's, so the cost is given for this turn; on your own turn it is untilEndOfOpponentsNextTurn (the plain duration alone would last a whole extra turn in the first case); only Characters on the field when the effect resolves are affected (Oinkchuck itself is already gone)",
  ],
};
