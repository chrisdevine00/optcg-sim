import type { CardScript } from '../../src/dsl.ts';

/** OP11-108 Neptune. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_108: CardScript = {
  cardId: 'OP11-108',
  textHash: '18ea5a692d8df0',
  verified: {
    source: 'cards/overrides/OP11-108.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      kind: 'auto',
      when: ['onPlay'],
      label:
        'If your Leader is [Shirahoshi], you may turn 1 Life card face-down: draw 2 cards and trash 1 card from your hand',
      conditions: [
        {
          leader: {
            name: 'Shirahoshi',
          },
        },
      ],
      cost: [
        {
          turnLifeFaceDown: 1,
        },
      ],
      effect: [
        {
          do: {
            draw: 2,
          },
        },
        {
          do: {
            trashFromHand: {
              from: 'hand',
              owner: 'you',
              pick: {
                exactly: 1,
              },
            },
          },
        },
      ],
    },
  ],
};
