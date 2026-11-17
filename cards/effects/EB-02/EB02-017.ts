import type { CardScript } from '../../src/dsl.ts';

/** EB02-017 Nami. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB02_017: CardScript = {
  cardId: 'EB02-017',
  textHash: '04948758c0745d',
  verified: {
    source: 'cards/overrides/EB02-017.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Look at 5; add up to 1 matching card to your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                {
                  pick: {
                    upTo: 1,
                  },
                  filter: {
                    all: [
                      {
                        type: 'Straw Hat Crew',
                      },
                      {
                        not: {
                          name: 'Nami',
                        },
                      },
                    ],
                  },
                  reveal: true,
                  to: 'hand',
                },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'Read: the quoted "Straw Hat Crew" type is the exact type {Straw Hat Crew} (effect-dsl 1.5)',
    'CR 8-4-4-2: a search may take nothing even with a match in the 5 cards',
  ],
};
