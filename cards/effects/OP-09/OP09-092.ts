import type { CardScript } from '../../src/dsl.ts';

/** OP09-092 Marshall.D.Teach. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_092: CardScript = {
  cardId: 'OP09-092',
  textHash: '048fab486884bd',
  verified: {
    source: 'cards/overrides/OP09-092.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'activate',
      kind: 'activate',
      when: 'activateMain',
      label:
        'Rest this Character: if you have at least 3 fewer cards in hand than your opponent, draw 2 cards and trash 1 card from your hand',
      cost: [
        {
          restSelf: true,
        },
      ],
      effect: [
        {
          if: {
            cmp: [
              {
                sum: [
                  {
                    hand: 'opponent',
                  },
                  {
                    mul: [
                      {
                        hand: 'you',
                      },
                      -1,
                    ],
                  },
                ],
              },
              '>=',
              3,
            ],
          },
          then: [
            {
              do: {
                draw: 2,
              },
            },
            {
              do: {
                trashFromHand: {
                  from: 'hand',
                  owner: 'you',
                  pick: {
                    exactly: 1,
                  },
                },
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: "at least 3 less" is opponent hand minus your hand >= 3 (boundary: exactly 3 less works), read when the effect resolves, after the rest cost (this card is on the field, not in hand)',
  ],
};
