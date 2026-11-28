import type { CardScript } from '../../src/dsl.ts';

/** OP18-095 I'm Late, I'm Very Late!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_095: CardScript = {
  cardId: 'OP18-095',
  textHash: '1fa40c8977f894',
  verified: {
    source: 'cards/overrides/OP18-095.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },

  abilities: [
    {
      id: 'main',
      label:
        'If your Leader has the {Celestial Dragons} type, look at 5; reveal up to 1 [Sleeptids] or {Holy Knights of God} type card and add it to your hand; place the rest at the bottom in any order',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          if: { leader: { type: 'Celestial Dragons' } },
          then: [
            {
              do: {
                lookAtTop: {
                  n: 5,
                  take: [
                    {
                      pick: { upTo: 1 },
                      filter: { any: [{ name: 'Sleeptids' }, { type: 'Holy Knights of God' }] },
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
