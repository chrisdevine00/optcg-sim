import type { CardScript } from '../../src/dsl.ts';

/** OP12-100 Sabo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_100: CardScript = {
  cardId: 'OP12-100',
  textHash: '033ffe1877af74',
  verified: {
    source: 'cards/overrides/OP12-100.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'low-life',
      label: 'With 3 or less Life, this Character gains [Blocker] and +3 cost',
      kind: 'permanent',
      conditions: [
        {
          cmp: [
            {
              life: 'you',
            },
            '<=',
            3,
          ],
        },
      ],
      apply: [
        {
          grant: {
            target: {
              from: 'self',
              owner: 'you',
            },
            keyword: 'Blocker',
          },
        },
        {
          cost: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: 3,
          },
        },
      ],
    },
    {
      id: 'on-play',
      label:
        'You may add 1 card from the top of your Life to your hand: draw 2 cards and trash 1 card from your hand',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          lifeToHand: {
            from: 'top',
            n: 1,
          },
        },
      ],
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
