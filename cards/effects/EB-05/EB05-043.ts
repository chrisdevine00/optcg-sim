import type { CardScript } from '../../src/dsl.ts';

/** EB05-043 Perona. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_043: CardScript = {
  cardId: 'EB05-043',
  textHash: '12bbd7f357a5ee',
  verified: {
    source: 'cards/overrides/EB05-043.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label: "K.O. or rest up to 1 of your opponent's Characters with a cost of 6 or less",
      kind: 'auto',
      when: ['onKO'],
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
                      cost: {
                        lte: 6,
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
                      cost: {
                        lte: 6,
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
            "K.O. up to 1 of your opponent's Characters with a cost of 6 or less",
            "Rest up to 1 of your opponent's Characters with a cost of 6 or less",
          ],
        },
      ],
    },
  ],
  rulings: [
    'M6b-Q23 (reading, no ruling): the mode (K.O. or rest) is chosen first, then the target',
  ],
};
