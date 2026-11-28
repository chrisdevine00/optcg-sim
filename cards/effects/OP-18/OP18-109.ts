import type { CardScript } from '../../src/dsl.ts';

/** OP18-109 Fukurou. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_109: CardScript = {
  cardId: 'OP18-109',
  textHash: '12b71861ecb5bf',
  verified: {
    source: 'cards/overrides/OP18-109.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'trigger',
      label:
        'If your Leader\'s type includes "CP", K.O. or rest up to 1 of your opponent\'s Characters with a cost of 6 or less',
      kind: 'trigger',
      effect: [
        {
          if: { leader: { typeIncludes: 'CP' } },
          then: [
            {
              chooseOne: [
                [
                  {
                    do: {
                      ko: {
                        from: 'characters',
                        owner: 'opponent',
                        filter: { cost: { lte: 6 } },
                        pick: { upTo: 1 },
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
                        filter: { cost: { lte: 6 } },
                        pick: { upTo: 1 },
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
    },
  ],
};
