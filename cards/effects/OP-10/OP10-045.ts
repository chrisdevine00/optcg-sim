import type { CardScript } from '../../src/dsl.ts';

/** OP10-045 Cavendish. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_045: CardScript = {
  cardId: 'OP10-045',
  textHash: '0b8d6a5fce0a06',
  verified: {
    source: 'cards/overrides/OP10-045.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'attack',
      label: 'Once per turn: draw 2 cards and trash 1 card from your hand',
      kind: 'auto',
      when: ['whenAttacking'],
      oncePerTurn: true,
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
