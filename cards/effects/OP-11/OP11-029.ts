import type { CardScript } from '../../src/dsl.ts';

/** OP11-029 Charlotte Praline. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_029: CardScript = {
  cardId: 'OP11-029',
  textHash: '064695d4bdef05',
  verified: {
    source: 'cards/overrides/OP11-029.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label: "Rest up to 1 of your opponent's Characters with a cost of 1 or less",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            rest: {
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
