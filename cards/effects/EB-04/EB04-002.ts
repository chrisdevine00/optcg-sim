import type { CardScript } from '../../src/dsl.ts';

/** EB04-002 Jewelry Bonney. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_002: CardScript = {
  cardId: 'EB04-002',
  textHash: '1fcbe712c7ad35',
  verified: {
    source: 'cards/overrides/EB04-002.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Look at 4; add up to 1 matching card to your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 4,
              take: [
                {
                  pick: {
                    upTo: 1,
                  },
                  filter: {
                    all: [
                      {
                        any: [
                          {
                            type: 'Egghead',
                          },
                          {
                            type: 'Straw Hat Crew',
                          },
                        ],
                      },
                      {
                        not: {
                          name: 'Jewelry Bonney',
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
  rulings: ['CR 8-4-4-2: a search may take nothing even with a match in the 4 cards'],
};
