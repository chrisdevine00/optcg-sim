import type { CardScript } from '../../src/dsl.ts';

/** OP18-110 Blueno. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_110: CardScript = {
  cardId: 'OP18-110',
  textHash: '19fc1f2f06f9b5',
  verified: {
    source: 'cards/overrides/OP18-110.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },

  abilities: [
    {
      id: 'on-play',
      label:
        'Look at 4 cards from the top of your deck; reveal up to 1 card with a type including "CP" other than [Blueno] and add it to your hand; place the rest at the bottom in any order',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            lookAtTop: {
              n: 4,
              take: [
                {
                  pick: { upTo: 1 },
                  filter: { all: [{ typeIncludes: 'CP' }, { not: { name: 'Blueno' } }] },
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
    {
      id: 'trigger',
      label: "Draw 1 card and K.O. up to 1 of your opponent's Characters with a cost of 2 or less",
      kind: 'trigger',
      effect: [
        { do: { draw: 1 } },
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: { cost: { lte: 2 } },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
};
