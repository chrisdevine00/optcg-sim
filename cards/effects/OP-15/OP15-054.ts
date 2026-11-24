import type { CardScript } from '../../src/dsl.ts';

/** OP15-054 And No One Else Can Have It! It's Our Memento of Him. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_054: CardScript = {
  cardId: 'OP15-054',
  textHash: '11e95500826fd9',
  verified: {
    source: 'cards/overrides/OP15-054.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label: 'If your Leader is [Lucy], choose one',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          if: {
            leader: {
              name: 'Lucy',
            },
          },
          then: [
            {
              chooseOne: [
                [
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
                                type: 'Dressrosa',
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
                [
                  {
                    do: {
                      move: {
                        what: {
                          from: 'stage',
                          owner: 'any',
                          pick: {
                            upTo: 1,
                          },
                        },
                        to: {
                          zone: 'hand',
                        },
                      },
                    },
                  },
                ],
              ],
              labels: [
                'Draw 2 cards and trash 1 card from your hand, then play up to 1 {Dressrosa} Character with a cost of 4 or less from your hand',
                "Return up to 1 Stage to the owner's hand",
              ],
            },
          ],
        },
      ],
    },
  ],
};
