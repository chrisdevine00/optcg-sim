import type { CardScript } from '../../src/dsl.ts';

/** OP17-059 Aramaki. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_059: CardScript = {
  cardId: 'OP17-059',
  textHash: '12ff58479574fd',
  verified: {
    source: 'cards/overrides/OP17-059.json (card text in cards/data)',
    date: '2026-10-28',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        "DON!! -1: draw 1 and K.O. up to 2 of your opponent's Characters with a cost of 2 or less",
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          donMinus: 1,
        },
      ],
      effect: [
        {
          do: {
            draw: 1,
          },
        },
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 2,
                },
              },
              pick: {
                upTo: 2,
              },
            },
          },
        },
      ],
    },
  ],
};
