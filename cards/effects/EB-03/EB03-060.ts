import type { CardScript } from '../../src/dsl.ts';

/** EB03-060 Will You Be My Servant?. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_060: CardScript = {
  cardId: 'EB03-060',
  textHash: '09013a77622ad1',
  verified: {
    source: 'cards/overrides/EB03-060.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        'If your Leader is [Nami], look at 4; reveal up to 1 card with a cost of 2 to 8 and add it to your hand; rest to the bottom',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          if: { leader: { name: 'Nami' } },
          then: [
            {
              do: {
                lookAtTop: {
                  n: 4,
                  take: [
                    {
                      pick: { upTo: 1 },
                      filter: { all: [{ cost: { gte: 2 } }, { cost: { lte: 8 } }] },
                      reveal: true,
                      to: 'hand',
                    },
                  ],
                  rest: 'bottomAnyOrder',
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: 'trigger',
      label: "Activate this card's [Main] effect",
      kind: 'trigger',
      effect: [{ do: { activate: { ability: 'main', of: 'self' } } }],
    },
  ],
};
