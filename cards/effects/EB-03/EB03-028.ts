import type { CardScript } from '../../src/dsl.ts';

/** EB03-028. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_028: CardScript = {
  cardId: 'EB03-028',
  textHash: '1365353f4efbe0',
  verified: {
    source: 'cards/overrides/EB03-028.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Trash 1 card from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
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
    {
      id: 'draw',
      label: 'You may trash this Character: if you have 4 or less cards in your hand, draw 2 cards',
      kind: 'activate',
      when: 'activateMain',
      cost: [
        {
          trashSelf: true,
        },
      ],
      effect: [
        {
          if: {
            cmp: [
              {
                hand: 'you',
              },
              '<=',
              4,
            ],
          },
          then: [
            {
              do: {
                draw: 2,
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: the hand count is checked as the effect resolves (after the cost); the [On Play] trash is mandatory',
  ],
};
