import type { CardScript } from '../../src/dsl.ts';

/** EB02-011 Arlong. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_011: CardScript = {
  cardId: 'EB02-011',
  textHash: '01cf52d3bec46d',
  verified: {
    source: 'cards/overrides/EB02-011.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "If your Leader has {Fish-Man} or {East Blue}: give up to 1 rested DON!! to your Leader; up to 1 of the opponent's Characters with cost 5 or less cannot be rested until the end of their next turn",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              any: [
                {
                  type: 'Fish-Man',
                },
                {
                  type: 'East Blue',
                },
              ],
            },
          },
          then: [
            {
              do: {
                giveDon: {
                  n: 1,
                  state: 'rested',
                  to: {
                    from: 'leader',
                    owner: 'you',
                  },
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
                      cost: {
                        lte: 5,
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
    'reading: "Then, up to 1 ..." is inside the Leader-type guard (M4b-5); "cannot be rested" is the full restriction (G2): no attack, no [Blocker], no rest by effects; "cost of 5 or less" is the current cost',
  ],
};
