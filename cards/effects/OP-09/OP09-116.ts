import type { CardScript } from '../../src/dsl.ts';

/** OP09-116 Never Underestimate the Power of Miracles!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_116: CardScript = {
  cardId: 'OP09-116',
  textHash: '10e7452321e28b',
  verified: {
    source: 'cards/overrides/OP09-116.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label: '[Counter] Up to 1 of your Leader or Character cards gains +2000 power this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                pick: {
                  upTo: 1,
                },
              },
              amount: 2000,
              duration: 'battle',
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label:
        'Play up to 1 Revolutionary Army Character card with a cost of 4 or less from your hand',
      kind: 'trigger',
      effect: [
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
                      type: 'Revolutionary Army',
                    },
                    {
                      cost: {
                        lte: 4,
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
        },
      ],
    },
  ],
};
