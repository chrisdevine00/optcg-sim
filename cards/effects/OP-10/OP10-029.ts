import type { CardScript } from '../../src/dsl.ts';

/** OP10-029 Dracule Mihawk. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_029: CardScript = {
  cardId: 'OP10-029',
  textHash: '059f5a23515f65',
  verified: {
    source: 'cards/overrides/OP10-029.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If you have 2 or more rested Characters, set up to 1 of your rested "ODYSSEY" Characters with a cost of 5 or less as active',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            cmp: [
              {
                count: {
                  from: 'characters',
                  owner: 'you',
                  filter: {
                    state: 'rested',
                  },
                },
              },
              '>=',
              2,
            ],
          },
          then: [
            {
              do: {
                setActive: {
                  from: 'characters',
                  owner: 'you',
                  filter: {
                    all: [
                      {
                        type: 'ODYSSEY',
                      },
                      {
                        state: 'rested',
                      },
                      {
                        cost: {
                          lte: 5,
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
          ],
        },
      ],
    },
  ],
};
