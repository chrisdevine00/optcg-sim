import type { CardScript } from '../../src/dsl.ts';

/** OP10-096 There's No Longer Any Need for the Seven Warlords of the Sea!!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_096: CardScript = {
  cardId: 'OP10-096',
  textHash: '07b5a13ae4f73c',
  verified: {
    source: 'cards/overrides/OP10-096.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "K.O. up to 1 of your opponent's {The Seven Warlords of the Sea} Characters with a cost of 8 or less",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                all: [
                  {
                    type: 'The Seven Warlords of the Sea',
                  },
                  {
                    cost: {
                      lte: 8,
                    },
                  },
                ],
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
      label:
        "K.O. up to 1 of your opponent's {The Seven Warlords of the Sea} Characters with a cost of 4 or less",
      kind: 'trigger',
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                all: [
                  {
                    type: 'The Seven Warlords of the Sea',
                  },
                  {
                    cost: {
                      lte: 4,
                    },
                  },
                ],
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
  ],
};
