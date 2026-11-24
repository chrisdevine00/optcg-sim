import type { CardScript } from '../../src/dsl.ts';

/** OP17-036 Withdraw Now and Allow Me to Save Face. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_036: CardScript = {
  cardId: 'OP17-036',
  textHash: '1994ea4be93004',
  verified: {
    source: 'cards/overrides/OP17-036.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "You may rest 6 of your DON!! cards: rest up to 1 of your opponent's Characters; then K.O. up to 2 of your opponent's rested Characters with a cost of 6 or less",
      kind: 'activate',
      when: 'main',
      costOptional: true,
      cost: [
        {
          restDon: 6,
        },
      ],
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              pick: {
                upTo: 1,
              },
            },
          },
        },
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                all: [
                  {
                    state: 'rested',
                  },
                  {
                    cost: {
                      lte: 6,
                    },
                  },
                ],
              },
              pick: {
                upTo: 2,
              },
            },
          },
        },
      ],
    },
    {
      id: 'counter',
      label: 'Up to 1 of your [Shanks] gains +4000 power during this battle',
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            power: {
              target: {
                from: ['leader', 'characters'],
                owner: 'you',
                filter: {
                  name: 'Shanks',
                },
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
  rulings: [
    'reading: "Then" is not "If you do": the K.O. step does not depend on a Character having been rested; a Character rested by the first step may be K.O.\'d by the second',
  ],
};
