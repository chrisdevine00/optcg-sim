import type { CardScript } from '../../src/dsl.ts';

/** OP09-119 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_119: CardScript = {
  cardId: 'OP09-119',
  textHash: '17f45ffee28000',
  verified: {
    source: 'cards/overrides/OP09-119.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'You may return 1 or more DON!! cards from your field to your DON!! deck: draw 1 card and this Character gains [Rush] during this turn',
      kind: 'auto',
      when: ['onPlay'],
      cost: [{ returnDon: { atLeast: 1 } }],
      effect: [
        { do: { draw: 1 } },
        {
          do: {
            grant: {
              target: { from: 'self', owner: 'you' },
              keyword: 'Rush',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "Draw 1 card and this Character gains Rush" are two independent steps after the cost; declining the optional cost does neither',
  ],
};
