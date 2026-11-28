import type { CardScript } from '../../src/dsl.ts';

/** OP18-094 Hee Hee Hee!! I Smell Adventure!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_094: CardScript = {
  cardId: 'OP18-094',
  textHash: '11ea1ea0010091',
  verified: {
    source: 'cards/overrides/OP18-094.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },

  abilities: [
    {
      id: 'main',
      label:
        'Look at 5 cards from the top of your deck; reveal up to 1 {Elbaph} type card and add it to your hand; place the rest at the bottom in any order',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [{ pick: { upTo: 1 }, filter: { type: 'Elbaph' }, reveal: true, to: 'hand' }],
              rest: 'bottomAnyOrder',
            },
          },
        },
      ],
    },
    { id: 'trigger', label: 'Draw 1 card', kind: 'trigger', effect: [{ do: { draw: 1 } }] },
  ],
};
