import type { CardScript } from '../../src/dsl.ts';

/** OP18-087 Stansen. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_087: CardScript = {
  cardId: 'OP18-087',
  textHash: '19b3e031441bda',
  verified: {
    source: 'cards/overrides/OP18-087.json (official OP-18 card list, card text in cards/data)',
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
      id: 'power',
      label:
        'If you only have Characters with a cost of 12 or more, this Character gains +2000 power',
      kind: 'permanent',
      conditions: [
        {
          none: {
            from: 'characters',
            owner: 'you',
            filter: {
              cost: {
                lte: 11,
              },
            },
          },
        },
      ],
      apply: [
        {
          power: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: 2000,
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "This Character gains +12 cost" is a permanent cost modifier on the card itself, as in OP17-089 and OP17-092; it lowers nothing else and ends when the card leaves the field',
    'reading: "only have Characters with a cost of 12 or more" is "no Character of yours with a cost of 11 or less" (Stansen himself, at 15, is always there); the cost modifiers are applied before the power condition is read (as OP17-080)',
  ],
};
