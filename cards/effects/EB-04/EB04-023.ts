import type { CardScript } from '../../src/dsl.ts';

/** EB04-023 Chaka & Pell. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB04_023: CardScript = {
  cardId: 'EB04-023',
  textHash: '0689611efc3d4c',
  verified: {
    source: 'cards/overrides/EB04-023.json (card text in cards/data)',
    date: '2026-11-25',
  },
  keywords: ['Double Attack'],
  abilities: [
    {
      id: 'on-play',
      label: 'You may give your active Leader −5000 power during this turn: draw 2 cards',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          power: {
            target: {
              from: 'leader',
              owner: 'you',
              filter: {
                state: 'active',
              },
              pick: {
                exactly: 1,
              },
            },
            amount: -5000,
            duration: 'thisTurn',
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
    'reading (G62, M6b-Q79): the cost needs an active Leader; the cost is optional ("you may"), so declining it draws nothing',
  ],
};
