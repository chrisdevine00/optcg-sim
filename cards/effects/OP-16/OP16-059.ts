import type { CardScript } from '../../src/dsl.ts';

/** OP16-059 We'll Change This Mission from Sneaky to Flashy!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_059: CardScript = {
  cardId: 'OP16-059',
  textHash: '17337c445276ae',
  verified: {
    source: 'cards/overrides/OP16-059.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Rest 7 DON!!: look at 5; play up to 2 {Impel Down} Characters with 6000 power or less; rest to the bottom',
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [
        {
          restDon: 7,
        },
      ],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                {
                  pick: {
                    upTo: 2,
                  },
                  filter: {
                    all: [
                      {
                        category: ['Character'],
                      },
                      {
                        type: 'Impel Down',
                      },
                      {
                        power: {
                          lte: 6000,
                        },
                      },
                    ],
                  },
                  to: 'play',
                },
              ],
              rest: 'bottomAnyOrder',
            },
          },
        },
      ],
    },
    {
      id: 'counter',
      label: 'Your Leader gains +3000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: {
                from: 'leader',
                owner: 'you',
              },
              amount: 3000,
              duration: 'battle',
            },
          },
        },
      ],
    },
  ],
};
