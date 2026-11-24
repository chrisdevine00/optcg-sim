import type { CardScript } from '../../src/dsl.ts';

/** OP14-021 Issho. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_021: CardScript = {
  cardId: 'OP14-021',
  textHash: '06e6788f22c5d2',
  verified: {
    source: 'cards/overrides/OP14-021.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'rested',
      label:
        "Your turn, when this becomes rested: you may add 1 Life card to your hand; if you do, up to 1 of the opponent's rested Characters or Stages will not become active",
      kind: 'auto',
      when: [
        {
          event: 'rested',
          owner: 'you',
          filter: {
            isSelf: true,
          },
        },
      ],
      conditions: [
        {
          yourTurn: true,
        },
      ],
      effect: [
        {
          if: {
            cmp: [
              {
                life: 'you',
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
                    move: {
                      what: {
                        from: 'lifeTop',
                        owner: 'you',
                        pick: {
                          exactly: 1,
                        },
                      },
                      to: {
                        zone: 'hand',
                      },
                    },
                  },
                },
              ],
              label: 'life',
            },
            {
              ifDid: 'life',
              then: [
                {
                  do: {
                    skipRefresh: {
                      from: ['characters', 'stage'],
                      owner: 'opponent',
                      filter: {
                        state: 'rested',
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
        },
      ],
    },
  ],
  rulings: [
    "reading (M6b-Q10, Q30): every active-to-rested change of this Character on your turn counts (attack, cost, effect); the Life card goes to the hand with no [Trigger]; with 0 Life the ability does nothing (gated on the public Life count). The skipped card is a rested opposing Character or Stage (DON!! not targeted, M6b audit Q5), for the opponent's next Refresh Phase only",
  ],
};
