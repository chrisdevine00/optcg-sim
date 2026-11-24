import type { CardScript } from '../../src/dsl.ts';

/** OP03-044 Kaya. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP03_044: CardScript = {
  cardId: 'OP03-044',
  textHash: '055f815aaa5edf',
  verified: {
    source: 'cards/overrides/OP03-044.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Draw 2 cards and trash 2 cards from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        { do: { draw: 2 } },
        { do: { trashFromHand: { from: 'hand', owner: 'you', pick: { exactly: 2 } } } },
      ],
    },
  ],
};
