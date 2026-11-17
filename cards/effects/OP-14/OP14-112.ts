import type { CardScript } from '../../src/dsl.ts';

/** OP14-112 Boa Hancock. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_112: CardScript = {
  cardId: 'OP14-112',
  textHash: '0fc1145dee45e5',
  verified: {
    source: 'cards/overrides/OP14-112.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "If your Leader is a Warlord: add the top card of your deck to your Life, then add up to 1 card from the top of your opponent's Life to its owner's hand",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              type: 'The Seven Warlords of the Sea',
            },
          },
          then: [
            {
              do: {
                move: {
                  what: {
                    from: 'deckTop',
                    owner: 'you',
                    pick: {
                      upTo: 1,
                    },
                  },
                  to: {
                    zone: 'life',
                    position: 'top',
                  },
                },
              },
            },
            {
              do: {
                move: {
                  what: {
                    from: 'lifeTop',
                    owner: 'opponent',
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
        },
      ],
    },
    {
      id: 'trigger',
      label: 'Play up to 1 Character card with 6000 power or less and a [Trigger] from your hand',
      kind: 'trigger',
      effect: [
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
                      power: {
                        lte: 6000,
                      },
                    },
                    {
                      hasTrigger: true,
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
  rulings: [
    'Reading: "Then, add up to 1 card from the top of your opponent\'s Life" is gated by the Leader condition like the first clause (CR 4-10-1)',
    'QA-GR: moving a Life card to the hand is not damage, so no [Trigger]',
  ],
};
