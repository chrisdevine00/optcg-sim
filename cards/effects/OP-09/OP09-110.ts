import type { CardScript } from '../../src/dsl.ts';

/** OP09-110 Pierre. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_110: CardScript = {
  cardId: 'OP09-110',
  textHash: '08d657d84ea85a',
  verified: {
    source: 'cards/overrides/OP09-110.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      kind: 'auto',
      when: ['onPlay'],
      label: 'Draw 2 cards and trash 2 cards from your hand',
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
    {
      id: 'trigger',
      kind: 'trigger',
      label: 'Play this card',
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'self',
                owner: 'you',
              },
            },
          },
        },
      ],
    },
  ],
};
