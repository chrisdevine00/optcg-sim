import type { CardScript } from '../../src/dsl.ts';

/** OP12-017 Color of Observation Haki. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_017: CardScript = {
  cardId: 'OP12-017',
  textHash: '0a7b0a7ad5f9ed',
  verified: {
    source: 'cards/overrides/OP12-017.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'You may give 1 active DON!! to your [Silvers Rayleigh]: look at 4; add up to 1 red Event or Character with cost 3 or more',
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [
        {
          giveDon: {
            n: 1,
            state: 'active',
            to: {
              from: ['leader', 'characters'],
              owner: 'you',
              filter: {
                name: 'Silvers Rayleigh',
              },
              pick: {
                exactly: 1,
              },
            },
          },
        },
      ],
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
                    any: [
                      {
                        all: [
                          {
                            color: 'Red',
                          },
                          {
                            category: ['Event'],
                          },
                        ],
                      },
                      {
                        all: [
                          {
                            category: ['Character'],
                          },
                          {
                            cost: {
                              gte: 3,
                            },
                          },
                        ],
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
    'Read: "up to 1 red Event or up to 1 Character card ... and add it" is a single card of either kind (one take of up to 1)',
  ],
};
