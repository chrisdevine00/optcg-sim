import type { CardScript } from '../../src/dsl.ts';

/** OP11-035 Fisher Tiger. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_035: CardScript = {
  cardId: 'OP11-035',
  textHash: '07571c8055ed0d',
  verified: {
    source: 'cards/overrides/OP11-035.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'ko-play',
      label:
        "When K.O.'d by your opponent's effect, you may rest 1 DON!!: play up to 1 {Fish-Man} or {Merfolk} Character with a cost of 4 or less from your hand",
      kind: 'auto',
      when: ['onKO'],
      conditions: [
        {
          koCause: 'opponentEffect',
        },
      ],
      effect: [
        {
          if: {
            cmp: [
              {
                donOnField: 'you',
                state: 'active',
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
                    rest: {
                      from: 'donCostArea',
                      owner: 'you',
                      pick: {
                        exactly: 1,
                      },
                    },
                  },
                },
              ],
              label: 'pay',
            },
            {
              ifDid: 'pay',
              then: [
                {
                  do: {
                    play: {
                      what: {
                        from: 'hand',
                        owner: 'you',
                        filter: {
                          all: [
                            {
                              category: ['Character'],
                            },
                            {
                              any: [
                                {
                                  type: 'Fish-Man',
                                },
                                {
                                  type: 'Merfolk',
                                },
                              ],
                            },
                            {
                              cost: {
                                lte: 4,
                              },
                            },
                          ],
                        },
                        pick: {
                          upTo: 1,
                        },
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
    {
      id: 'on-play',
      label: "Rest up to 1 of your opponent's Characters",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "K.O.\'d by your opponent\'s effect" excludes battle and your own effects; no colon, so a `may` step (rest 1 DON!!) with "If you do" for the play, offered only with an active DON!!',
  ],
};
