import type { CardScript } from '../../src/dsl.ts';

/** OP09-084 Catarina Devon. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_084: CardScript = {
  cardId: 'OP09-084',
  textHash: '14c07120a4976f',
  verified: {
    source: 'cards/overrides/OP09-084.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      label:
        "With a {Blackbeard Pirates} Leader, this Character gains [Double Attack], [Banish] or [Blocker] until the end of your opponent's next turn",
      effect: [
        {
          if: {
            leader: {
              type: 'Blackbeard Pirates',
            },
          },
          then: [
            {
              chooseOne: [
                [
                  {
                    do: {
                      grant: {
                        target: {
                          from: 'self',
                          owner: 'you',
                        },
                        keyword: 'Double Attack',
                        duration: 'untilEndOfOpponentsNextTurn',
                      },
                    },
                  },
                ],
                [
                  {
                    do: {
                      grant: {
                        target: {
                          from: 'self',
                          owner: 'you',
                        },
                        keyword: 'Banish',
                        duration: 'untilEndOfOpponentsNextTurn',
                      },
                    },
                  },
                ],
                [
                  {
                    do: {
                      grant: {
                        target: {
                          from: 'self',
                          owner: 'you',
                        },
                        keyword: 'Blocker',
                        duration: 'untilEndOfOpponentsNextTurn',
                      },
                    },
                  },
                ],
              ],
              labels: ['Gains [Double Attack]', 'Gains [Banish]', 'Gains [Blocker]'],
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading (B3A-R1): no colon, so the Leader "If" is an effect condition: the ability can be activated and spends its [Once Per Turn] without a {Blackbeard Pirates} Leader, doing nothing',
    'reading: "until the end of your opponent\'s next turn" is the plain duration untilEndOfOpponentsNextTurn',
  ],
};
