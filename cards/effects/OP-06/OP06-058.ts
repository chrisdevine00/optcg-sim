import type { CardScript } from '../../src/dsl.ts';

/** OP06-058 Gravity Blade Raging Tiger. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP06_058: CardScript = {
  cardId: 'OP06-058',
  textHash: '114d6cec1bc234',
  verified: {
    source: 'cards/overrides/OP06-058.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'main',
      label: "Place up to 2 Characters with a cost of 6 or less at the bottom of the owner's deck",
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'any',
                filter: {
                  cost: {
                    lte: 6,
                  },
                },
                pick: {
                  upTo: 2,
                },
              },
              to: {
                zone: 'deck',
                position: 'bottom',
              },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: "Place up to 1 Character with a cost of 5 or less at the bottom of the owner's deck",
      kind: 'trigger',
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'characters',
                owner: 'any',
                filter: {
                  cost: {
                    lte: 5,
                  },
                },
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'deck',
                position: 'bottom',
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    "M4b-08 (QA-OP06): when two of one player's Characters are placed, their owner decides the order (an `order` decision), and the other player cannot learn it",
  ],
};
