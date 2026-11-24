import type { CardScript } from '../../src/dsl.ts';

/** OP11-024 Aladine. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_024: CardScript = {
  cardId: 'OP11-024',
  textHash: '0afcd6ac4d7cc5',
  verified: {
    source: 'cards/overrides/OP11-024.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'ko-play',
      label:
        "When K.O.'d by your opponent's effect, you may trash 1 card from your hand and rest 1 DON!!: play up to 1 {Fish-Man} or {Merfolk} Character with a cost of 6 or less from your hand",
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
            all: [
              {
                cmp: [
                  {
                    hand: 'you',
                  },
                  '>=',
                  1,
                ],
              },
              {
                cmp: [
                  {
                    donOnField: 'you',
                    state: 'active',
                  },
                  '>=',
                  1,
                ],
              },
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
                                lte: 6,
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
  ],
  rulings: [
    'reading: "K.O.\'d by your opponent\'s effect" excludes battle and your own effects (`koCause`); there is no colon, so this is a `may` step (trash 1 from hand and rest 1 DON!!) with "If you do" for the play, not a cost; the `may` is offered only with a card in hand and an active DON!! (public counts, so the prompt never depends on which cards are held); the trashed card is gone before the play',
  ],
};
