import type { CardScript } from '../../src/dsl.ts';

/** OP14-062 Gladius. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_062: CardScript = {
  cardId: 'OP14-062',
  textHash: '1701e698695453',
  verified: {
    source: 'cards/overrides/OP14-062.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label:
        "DON!! -1: K.O. or rest up to 1 of your opponent's Characters with a base power of 6000 or less",
      kind: 'auto',
      when: ['onKO'],
      cost: [
        {
          donMinus: 1,
        },
      ],
      effect: [
        {
          chooseOne: [
            [
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
            [
              {
                do: {
                  rest: {
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
          ],
          labels: [
            "K.O. up to 1 of your opponent's Characters with a base power of 6000 or less",
            "Rest up to 1 of your opponent's Characters with a base power of 6000 or less",
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: "K.O. or rest" is a choose-one of the two actions, each with its own "up to 1" target (the mode is picked first, then the target); base power, inclusive at 6000',
  ],
};
