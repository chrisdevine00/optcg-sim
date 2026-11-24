import type { CardScript } from '../../src/dsl.ts';

/** OP16-090 Tony Tony.Chopper. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_090: CardScript = {
  cardId: 'OP16-090',
  textHash: '139c8b49f4a14e',
  verified: {
    source: 'cards/overrides/OP16-090.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: "Draw 2, trash 2; K.O. up to 1 of your opponent's Characters with a cost of 1 or less",
      kind: 'auto',
      when: ['onPlay'],
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
                exactly: 2,
              },
            },
          },
        },
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 1,
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
