import type { CardScript } from '../../src/dsl.ts';

/** OP12-095 Lindbergh. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_095: CardScript = {
  cardId: 'OP12-095',
  textHash: '08e2f34945d539',
  verified: {
    source: 'cards/overrides/OP12-095.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'cost-bonus',
      label: 'With a Revolutionary Army Leader, this Character gains +4 cost',
      kind: 'permanent',
      conditions: [
        {
          leader: {
            type: 'Revolutionary Army',
          },
        },
      ],
      apply: [
        {
          cost: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: 4,
          },
        },
      ],
    },
    {
      id: 'on-play',
      label: 'Draw 1 card and trash 1 card from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            draw: 1,
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
