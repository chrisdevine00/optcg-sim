import type { CardScript } from '../../src/dsl.ts';

/** OP10-022 Trafalgar Law. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_022: CardScript = {
  cardId: 'OP10-022',
  textHash: '10b1f2f5270ba6',
  verified: {
    source: 'cards/overrides/OP10-022.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'activate',
      label:
        '[DON!! x1] [Once Per Turn] If the total cost of your Characters is 5 or more, you may return 1 of your Characters to the owner\'s hand: reveal 1 card from the top of your Life cards; if it is a "Supernovas" type Character with a cost of 5 or less, you may play it',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      conditions: [
        {
          donGiven: 1,
        },
        {
          cmp: [
            {
              totalCost: {
                from: 'characters',
                owner: 'you',
              },
            },
            '>=',
            5,
          ],
        },
      ],
      cost: [
        {
          move: {
            from: 'characters',
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
          to: {
            zone: 'hand',
          },
        },
      ],
      effect: [
        {
          do: {
            reveal: {
              from: 'lifeTop',
              n: 1,
              bind: 'revealed',
            },
          },
        },
        {
          if: {
            ref: 'revealed',
            matches: {
              all: [
                {
                  category: ['Character'],
                },
                {
                  type: 'Supernovas',
                },
                {
                  cost: {
                    lte: 5,
                  },
                },
              ],
            },
          },
          then: [
            {
              may: [
                {
                  do: {
                    play: {
                      what: {
                        from: 'lifeTop',
                        owner: 'you',
                        filter: {
                          ref: 'revealed',
                        },
                        pick: {
                          exactly: 1,
                        },
                      },
                    },
                  },
                },
              ],
              label: 'play',
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading (G67, M6b-Q84): "If the total cost of your Characters is 5 or more" is before the colon, so it is an activation condition read with current costs; [DON!! x1] is a condition too; the ability is not offered when either fails',
    'reading: "you may return 1 of your Characters to the owner\'s hand" is a plain cost with no `costOptional` (optional-cost check): activating is the choice (a removal by your own effect); the returned Character may be one that counted toward the total, and the total is not read again afterwards',
    'reading (G53): "Reveal 1 card from the top of your Life cards" shows it to both players; "If that card" has no colon, so it is an effect condition on the revealed card: a "Supernovas" type Character with a cost of 5 or less may be played; otherwise it stays on top of Life',
  ],
};
