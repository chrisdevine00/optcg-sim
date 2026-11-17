import type { CardScript } from '../../src/dsl.ts';

/** OP17-082 Sanji. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_082: CardScript = {
  cardId: 'OP17-082',
  textHash: '1b6bac84c95e15',
  verified: {
    source: 'cards/overrides/OP17-082.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'big-power',
      label: '+3000 power while a Character with a cost of 12 or more exists',
      kind: 'permanent',
      conditions: [
        {
          exists: {
            from: 'characters',
            owner: 'any',
            filter: {
              cost: {
                gte: 12,
              },
            },
          },
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
      label: 'Draw 2 cards and trash 2 cards from your hand',
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
      ],
    },
  ],
};
