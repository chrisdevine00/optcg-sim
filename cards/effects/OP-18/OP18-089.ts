import type { CardScript } from '../../src/dsl.ts';

/** OP18-089 Dorry. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_089: CardScript = {
  cardId: 'OP18-089',
  textHash: '18a4ed9fa1cd7d',
  verified: {
    source: 'cards/overrides/OP18-089.json (official OP-18 card list, card text in cards/data)',
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
      id: 'on-play',
      label: 'You may trash 1 card from your hand: your opponent trashes 1 card from their hand',
      kind: 'auto',
      when: ['onPlay'],
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
            trashFromHand: {
              from: 'hand',
              owner: 'opponent',
              chooser: 'opponent',
              pick: {
                exactly: 1,
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
