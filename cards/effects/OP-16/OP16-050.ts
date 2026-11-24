import type { CardScript } from '../../src/dsl.ts';

/** OP16-050 Miss Olive. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_050: CardScript = {
  cardId: 'OP16-050',
  textHash: '14521ab6df957a',
  verified: {
    source: 'cards/overrides/OP16-050.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        'You may return 1 of your Characters with a cost of 2 or more to the hand: draw 2 and trash 1 card from your hand',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          move: {
            from: 'characters',
            owner: 'you',
            filter: {
              cost: {
                gte: 2,
              },
            },
            pick: {
              exactly: 1,
            },
          },
          to: {
            zone: 'hand',
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
