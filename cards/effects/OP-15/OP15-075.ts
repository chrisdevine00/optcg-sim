import type { CardScript } from '../../src/dsl.ts';

/** OP15-075 El Thor. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_075: CardScript = {
  cardId: 'OP15-075',
  textHash: '00b1c86a69c66b',
  verified: {
    source: 'cards/overrides/OP15-075.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'main',
      label:
        'DON!! -1: with an [Enel] Leader, +1000 power to a Leader or Character, then K.O. a Character with 3000 power or less',
      kind: 'activate',
      when: 'main',
      cost: [
        {
          donMinus: 1,
        },
      ],
      effect: [
        {
          if: {
            leader: {
              name: 'Enel',
            },
          },
          then: [
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
                  amount: 1000,
                  duration: 'thisTurn',
                },
              },
            },
            {
              do: {
                ko: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    power: {
                      lte: 3000,
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
      id: 'counter',
      label: '[Counter] up to 1 of your [Enel] cards gains +2000 power during this battle',
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
                filter: {
                  name: 'Enel',
                },
              },
              amount: 2000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the K.O. after "Then" needs the [Enel] Leader (CR 4-10-1); the +1000 is applied before the power check of the K.O. target, which concerns the opponent\'s Characters only',
  ],
};
