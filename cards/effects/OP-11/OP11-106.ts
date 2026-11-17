import type { CardScript } from '../../src/dsl.ts';

/** OP11-106 Zeus. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_106: CardScript = {
  cardId: 'OP11-106',
  textHash: '0098030e0c9879',
  verified: {
    source: 'cards/overrides/OP11-106.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Add 1 Life card to your hand: K.O. up to 1 opponent Character with a cost of 5 or less',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          lifeToHand: {
            from: 'topOrBottom',
            n: 1,
          },
        },
      ],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 5,
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
};
