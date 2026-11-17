import type { CardScript } from '../../src/dsl.ts';

/** OP09-072 Franky. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_072: CardScript = {
  cardId: 'OP09-072',
  textHash: '0db220a3003afa',
  verified: {
    source: 'cards/overrides/OP09-072.json (card text in cards/data)',
    date: '2026-11-16',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label: 'DON!! -2, you may trash 1 card from your hand: draw 2',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          donMinus: 2,
        },
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
            draw: 2,
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "You may" covers the whole cost (an auto with a cost is optional): declining pays nothing',
  ],
};
