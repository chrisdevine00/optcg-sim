import type { CardScript } from '../../src/dsl.ts';

/** OP15-115 Impact Dial. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_115: CardScript = {
  cardId: 'OP15-115',
  textHash: '0bfbb18d621e4c',
  verified: {
    source: 'cards/overrides/OP15-115.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "K.O. up to 1 of your opponent's Characters with a cost of 4 or less; then add 1 card from the top of your Life cards to your hand",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: { cost: { lte: 4 } },
              pick: { upTo: 1 },
            },
          },
        },
        {
          do: {
            move: {
              what: { from: 'lifeTop', owner: 'you', pick: { exactly: 1 } },
              to: { zone: 'hand' },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: "K.O. up to 1 of your opponent's Characters with a cost of 4 or less",
      kind: 'trigger',
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: { cost: { lte: 4 } },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
};
