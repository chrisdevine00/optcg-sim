import type { CardScript } from '../../src/dsl.ts';

/** OP09-115 Ice Block Partisan. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_115: CardScript = {
  cardId: 'OP09-115',
  textHash: '1acb308308e9e9',
  verified: {
    source: 'cards/overrides/OP09-115.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label:
        "[Main] K.O. up to 1 of your opponent's Characters with a cost of 3 or less and a [Trigger]",
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
                    cost: {
                      lte: 3,
                    },
                  },
                  {
                    hasTrigger: true,
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
      label: 'Draw 1 card',
      kind: 'trigger',
      effect: [
        {
          do: {
            draw: 1,
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "with a [Trigger]" is a card that has a [Trigger] effect in its text (hasTrigger)',
  ],
};
