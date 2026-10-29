import type { CardScript } from '../../src/dsl.ts';

/** OP09-077 Gum-Gum Lightning. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_077: CardScript = {
  cardId: 'OP09-077',
  textHash: '00791aef28032e',
  verified: {
    source: 'cards/overrides/OP09-077.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'main',
      label: "K.O. up to 1 of your opponent's Characters with 6000 power or less",
      kind: 'activate',
      when: 'main',
      cost: [
        {
          donMinus: 2,
        },
      ],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                power: {
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
    },
    {
      id: 'trigger',
      label: 'Add up to 1 active DON!!',
      kind: 'trigger',
      effect: [
        {
          do: {
            addDon: [
              {
                n: 1,
                state: 'active',
                upTo: true,
              },
            ],
          },
        },
      ],
    },
  ],
};
