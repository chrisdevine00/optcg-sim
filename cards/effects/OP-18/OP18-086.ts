import type { CardScript } from '../../src/dsl.ts';

/** OP18-086 Goldberg. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_086: CardScript = {
  cardId: 'OP18-086',
  textHash: '0557414443c8bf',
  verified: {
    source: 'cards/overrides/OP18-086.json (official OP-18 card list, card text in cards/data)',
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
      id: 'on-ko',
      label: "K.O. up to 1 of your opponent's Characters with a cost of 4 or less",
      kind: 'auto',
      when: ['onKO'],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 4,
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
  ],
  rulings: [
    'reading: "This Character gains +12 cost" is a permanent cost modifier on the card itself, as in OP17-089 and OP17-092; it lowers nothing else and ends when the card leaves the field',
  ],
};
