import type { CardScript } from '../../src/dsl.ts';

/** OP10-005 Sanji. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_005: CardScript = {
  cardId: 'OP10-005',
  textHash: '0be2da01b6f234',
  verified: {
    source: 'cards/overrides/OP10-005.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'your-turn',
      label: 'Your Turn: +3000 power',
      kind: 'permanent',
      conditions: [
        {
          yourTurn: true,
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
      id: 'on-ko',
      label: 'Draw 1 card',
      kind: 'auto',
      when: ['onKO'],
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
