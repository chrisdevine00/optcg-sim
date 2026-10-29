import type { CardScript } from '../../src/dsl.ts';

/** EB04-031 King. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_031: CardScript = {
  cardId: 'EB04-031',
  textHash: '0b7c46771a62f3',
  verified: {
    source: 'cards/overrides/EB04-031.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'ko-shield',
      label: 'Return 1 DON!! card from your field instead',
      kind: 'replacement',
      replaces: {
        ko: {
          from: 'characters',
          owner: 'you',
          filter: {
            isSelf: true,
          },
        },
      },
      optional: true,
      instead: [
        {
          returnDon: 1,
        },
      ],
    },
    {
      id: 'ramp',
      label: 'Add up to 1 active and up to 1 rested DON!!',
      kind: 'activate',
      when: 'activateMain',
      oncePerTurn: true,
      effect: [
        {
          if: {
            all: [
              {
                leader: {
                  type: 'Animal Kingdom Pirates',
                },
              },
              {
                none: {
                  from: 'characters',
                  owner: 'you',
                  filter: {
                    all: [
                      {
                        name: 'King',
                      },
                      {
                        isSelf: false,
                      },
                    ],
                  },
                },
              },
            ],
          },
          then: [
            {
              do: {
                addDon: [
                  {
                    n: 1,
                    state: 'active',
                    upTo: true,
                  },
                  {
                    n: 1,
                    state: 'rested',
                    upTo: true,
                  },
                ],
              },
            },
          ],
        },
      ],
    },
  ],
};
