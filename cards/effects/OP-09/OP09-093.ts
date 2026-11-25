import type { CardScript } from '../../src/dsl.ts';

/** OP09-093 Marshall.D.Teach. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_093: CardScript = {
  cardId: 'OP09-093',
  textHash: '0defef28821cec',
  verified: {
    source: 'cards/overrides/OP09-093.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'activate',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      label:
        "With a {Blackbeard Pirates} Leader and if this Character was played this turn, negate up to 1 opposing Leader, then negate up to 1 opposing Character, which cannot attack until the end of your opponent's next turn",
      effect: [
        {
          if: {
            all: [
              {
                leader: {
                  type: 'Blackbeard Pirates',
                },
              },
              {
                self: {
                  playedThisTurn: true,
                },
              },
            ],
          },
          then: [
            {
              do: {
                negate: {
                  target: {
                    from: 'leader',
                    owner: 'opponent',
                    pick: {
                      upTo: 1,
                    },
                  },
                  duration: 'thisTurn',
                },
              },
            },
            {
              do: {
                negate: {
                  target: {
                    from: 'characters',
                    owner: 'opponent',
                    pick: {
                      upTo: 1,
                    },
                    bind: 'victim',
                  },
                  duration: 'thisTurn',
                },
              },
            },
            {
              do: {
                restrict: {
                  target: {
                    from: 'characters',
                    owner: 'opponent',
                    filter: {
                      ref: 'victim',
                    },
                  },
                  what: 'cannotAttack',
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
    'reading (B3A-R1): no colon, so the "If" is an effect condition and spends the [Once Per Turn] when it fails',
    'reading: "that Character" is the Character chosen for the negation (bound); the Leader negation and the Character negation are separate "up to 1" picks; if no Character is chosen nothing is restricted; the negation lasts this turn, the attack ban until the end of your opponent\'s next turn',
  ],
};
