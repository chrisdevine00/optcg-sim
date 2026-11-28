import type { CardScript } from '../../src/dsl.ts';

/** OP18-040 Diable Jambe Flambe Shot. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_040: CardScript = {
  cardId: 'OP18-040',
  textHash: '0ef9ecc6909f51',
  verified: {
    source: 'cards/overrides/OP18-040.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'main',
      label: "[Main] K.O. up to 1 of your opponent's rested Characters with a cost of 7 or less",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: { all: [{ state: 'rested' }, { cost: { lte: 7 } }] },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: "[Trigger] Rest up to 1 of your opponent's Characters with a cost of 7 or less",
      kind: 'trigger',
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: { cost: { lte: 7 } },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
};
