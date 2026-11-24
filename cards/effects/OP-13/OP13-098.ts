import type { CardScript } from '../../src/dsl.ts';

/** OP13-098 Never Existed... in the First Place.... Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_098: CardScript = {
  cardId: 'OP13-098',
  textHash: '054f120d4d0936',
  verified: {
    source: 'cards/overrides/OP13-098.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label: "Rest 1 DON!!: if your Leader is [Imu], K.O. up to 1 of opponent's Stages with cost 7",
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [
        {
          restDon: 1,
        },
      ],
      effect: [
        {
          if: {
            leader: {
              name: 'Imu',
            },
          },
          then: [
            {
              do: {
                ko: {
                  from: 'stage',
                  owner: 'opponent',
                  filter: {
                    cost: {
                      eq: 7,
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
      label:
        'If your Leader is [Imu], up to 1 Leader or Character gains +4000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          if: {
            leader: {
              name: 'Imu',
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
                  amount: 4000,
                  duration: 'battle',
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
