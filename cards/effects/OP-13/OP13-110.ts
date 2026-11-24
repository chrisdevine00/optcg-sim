import type { CardScript } from '../../src/dsl.ts';

/** OP13-110 Stussy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_110: CardScript = {
  cardId: 'OP13-110',
  textHash: '19e8836dbac571',
  verified: {
    source: 'cards/overrides/OP13-110.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader has {Egghead}, play up to 1 Character with cost 5 or less and a [Trigger] from hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            leader: {
              type: 'Egghead',
            },
          },
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
                          cost: {
                            lte: 5,
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
    },
  ],
};
