import type { CardScript } from '../../src/dsl.ts';

/** OP16-035 Roronoa Zoro. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_035: CardScript = {
  cardId: 'OP16-035',
  textHash: '143d626e5656ba',
  verified: {
    source: 'cards/overrides/OP16-035.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Rest up to 1 of your opponent's cards; you may trash 1 card from your hand: give up to 3 rested DON!! to your Leader",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            rest: {
              from: ['leader', 'characters', 'stage', 'donCostArea'],
              owner: 'opponent',
              pick: {
                upTo: 1,
              },
            },
          },
        },
        {
          if: {
            cmp: [
              {
                hand: 'you',
              },
              '>=',
              1,
            ],
          },
          then: [
            {
              may: [
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
              label: 'trash',
            },
            {
              ifDid: 'trash',
              then: [
                {
                  do: {
                    giveDon: {
                      n: 3,
                      state: 'rested',
                      to: {
                        from: 'leader',
                        owner: 'you',
                      },
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
};
