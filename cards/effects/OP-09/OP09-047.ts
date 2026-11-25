import type { CardScript } from '../../src/dsl.ts';

/** OP09-047 Kouzuki Oden. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_047: CardScript = {
  cardId: 'OP09-047',
  textHash: '13ea7e62fbc5ce',
  keywords: ['Double Attack'],
  verified: {
    source: 'cards/overrides/OP09-047.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label: 'Draw 2 cards and trash 1 card from your hand',
      kind: 'auto',
      when: ['onKO'],
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
  rulings: ['reading: any K.O.; the trash is taken after the draw, from the enlarged hand'],
};
