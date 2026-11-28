import type { CardScript } from '../../src/dsl.ts';

/** OP18-091 Brogy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_091: CardScript = {
  cardId: 'OP18-091',
  textHash: '1ba47cadf7073b',
  verified: {
    source: 'cards/overrides/OP18-091.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'cost-up',
      label: 'This Character gains +12 cost',
      kind: 'permanent',
      apply: [
        {
          cost: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: 12,
          },
        },
      ],
    },
    {
      id: 'when-attacking',
      label:
        'You may trash 1 card from your hand: add up to 1 of your Character cards with a cost of 2 or less from your trash to your hand',
      kind: 'auto',
      when: ['whenAttacking'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            move: {
              what: {
                from: 'trash',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      cost: {
                        lte: 2,
                      },
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
              to: {
                zone: 'hand',
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "This Character gains +12 cost" is a permanent cost modifier on the card itself, as in OP17-089 and OP17-092; it lowers nothing else and ends when the card leaves the field',
  ],
};
