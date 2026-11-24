import type { CardScript } from '../../src/dsl.ts';

/** OP13-039 Gum-Gum Snake Shot. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP13_039: CardScript = {
  cardId: 'OP13-039',
  textHash: '1e70ff1e67bade',
  verified: {
    source: 'cards/overrides/OP13-039.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'counter',
      label: "K.O. up to 1 of the opponent's rested Characters with a cost of 4 or less",
      kind: 'activate',
      when: 'counter',
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: { all: [{ state: 'rested' }, { cost: { lte: 4 } }] },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: "Activate this card's [Counter] effect",
      kind: 'trigger',
      effect: [{ do: { activate: { ability: 'counter', of: 'self' } } }],
    },
  ],
};
