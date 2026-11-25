import type { CardScript } from '../../src/dsl.ts';

/** OP10-008 Scotch. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_008: CardScript = {
  cardId: 'OP10-008',
  textHash: '0063d103ce2467',
  verified: {
    source: 'cards/overrides/OP10-008.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label: "If you don't have [Rock], play up to 1 [Rock] from your hand",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            none: {
              from: 'characters',
              owner: 'you',
              filter: {
                name: 'Rock',
              },
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
                          name: 'Rock',
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
  rulings: ['reading: "have [Rock]" means a [Rock] Character on your field'],
};
