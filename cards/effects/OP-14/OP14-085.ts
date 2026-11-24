import type { CardScript } from '../../src/dsl.ts';

/** OP14-085 Miss.Goldenweek(Marianne). Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_085: CardScript = {
  cardId: 'OP14-085',
  textHash: '122e4c2e3058fe',
  verified: {
    source: 'cards/overrides/OP14-085.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label: 'Draw 2 cards and trash 2 cards from your hand',
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
                exactly: 2,
              },
            },
          },
        },
      ],
    },
  ],
};
