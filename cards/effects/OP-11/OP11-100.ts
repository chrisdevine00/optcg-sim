import type { CardScript } from '../../src/dsl.ts';

/** OP11-100 Otohime. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_100: CardScript = {
  cardId: 'OP11-100',
  textHash: '110b2bc5620056',
  verified: {
    source: 'cards/overrides/OP11-100.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      kind: 'auto',
      when: ['onPlay'],
      label: 'If your Leader is [Shirahoshi], you may turn 1 Life card face-down: draw 1 card',
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
            draw: 1,
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the Leader condition precedes the "you may ... :" cost, so it is checked before the cost is offered; the card turned is the top Life card and must be face-up',
  ],
};
