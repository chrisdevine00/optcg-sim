import type { CardScript } from '../../src/dsl.ts';

/** OP16-054 Mr.1(Daz.Bonez). Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_054: CardScript = {
  cardId: 'OP16-054',
  textHash: '14c25ed8aa4933',
  verified: {
    source: 'cards/overrides/OP16-054.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'big-hand',
      label: '[DON!! x1] [Your Turn] If you have 5 or more cards in your hand, +3000 power',
      kind: 'permanent',
      conditions: [
        {
          yourTurn: true,
        },
        {
          donGiven: 1,
        },
        {
          cmp: [
            {
              hand: 'you',
            },
            '>=',
            5,
          ],
        },
      ],
      apply: [
        {
          power: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: 3000,
          },
        },
      ],
    },
    {
      id: 'on-play',
      label: 'Draw 1',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            draw: 1,
          },
        },
      ],
    },
  ],
};
