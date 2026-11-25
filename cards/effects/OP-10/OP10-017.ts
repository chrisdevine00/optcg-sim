import type { CardScript } from '../../src/dsl.ts';

/** OP10-017 Rock. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_017: CardScript = {
  cardId: 'OP10-017',
  textHash: '0809547d5dc05e',
  verified: {
    source: 'cards/overrides/OP10-017.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: "If you don't have [Scotch], play up to 1 [Scotch] from your hand",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            none: {
              from: 'characters',
              owner: 'you',
              filter: {
                name: 'Scotch',
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
                          name: 'Scotch',
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
  rulings: ['reading: "have [Scotch]" means a [Scotch] Character on your field'],
};
