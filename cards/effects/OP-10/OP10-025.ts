import type { CardScript } from '../../src/dsl.ts';

/** OP10-025 Enel. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_025: CardScript = {
  cardId: 'OP10-025',
  textHash: '13b6e86a0eba10',
  verified: {
    source: 'cards/overrides/OP10-025.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'If you have 2 or more rested Characters, draw 3 cards and trash 2 cards from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            cmp: [
              {
                count: {
                  from: 'characters',
                  owner: 'you',
                  filter: {
                    state: 'rested',
                  },
                },
              },
              '>=',
              2,
            ],
          },
          then: [
            {
              do: {
                draw: 3,
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
    },
  ],
};
