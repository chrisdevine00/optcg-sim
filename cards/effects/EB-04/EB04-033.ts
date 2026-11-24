import type { CardScript } from '../../src/dsl.ts';

/** EB04-033 Groggy Monsters. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_033: CardScript = {
  cardId: 'EB04-033',
  textHash: '1385c4e384dfb4',
  verified: {
    source: 'cards/overrides/EB04-033.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'DON!! -1: with 3 or more {Foxy Pirates} Characters, K.O. up to 1 opposing Character with 6000 base power or less',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          donMinus: 1,
        },
      ],
      effect: [
        {
          if: {
            cmp: [
              {
                count: {
                  from: 'characters',
                  owner: 'you',
                  filter: {
                    type: 'Foxy Pirates',
                  },
                },
              },
              '>=',
              3,
            ],
          },
          then: [
            {
              do: {
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    basePower: {
                      lte: 6000,
                    },
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
