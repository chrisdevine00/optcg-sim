import type { CardScript } from '../../src/dsl.ts';

/** OP14-108 Silvers Rayleigh. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_108: CardScript = {
  cardId: 'OP14-108',
  textHash: '1978a57ce1ffa2',
  verified: {
    source: 'cards/overrides/OP14-108.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If your Leader is multicolored and your opponent has 3 or less Life, K.O. up to 1 Character with 7000 base power or less',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            all: [
              {
                leader: {
                  multicolor: true,
                },
              },
              {
                cmp: [
                  {
                    life: 'opponent',
                  },
                  '<=',
                  3,
                ],
              },
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
                      lte: 7000,
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
    {
      id: 'trigger',
      label: "Activate this card's [On Play] effect",
      kind: 'trigger',
      effect: [
        {
          do: {
            activate: {
              ability: 'onPlay',
              of: 'self',
            },
          },
        },
      ],
    },
  ],
};
