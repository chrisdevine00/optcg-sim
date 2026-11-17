import type { CardScript } from '../../src/dsl.ts';

/** OP16-077 "Buddha" Sengoku. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_077: CardScript = {
  cardId: 'OP16-077',
  textHash: '043b11e0f8e665',
  verified: {
    source: 'cards/overrides/OP16-077.json (card text in cards/data)',
    date: '2026-10-28',
  },
  abilities: [
    {
      id: 'main',
      label:
        'Look at 5; reveal up to 2 {Navy} cards to your hand, the rest to the bottom; then trash 1 card from your hand',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          do: {
            lookAtTop: {
              n: 5,
              take: [
                {
                  pick: {
                    upTo: 2,
                  },
                  filter: {
                    type: 'Navy',
                  },
                  reveal: true,
                  to: 'hand',
                },
              ],
              rest: 'bottomAnyOrder',
            },
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
