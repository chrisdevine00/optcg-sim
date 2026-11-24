import type { CardScript } from '../../src/dsl.ts';

/** ST36-004 Bartolomeo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST36_004: CardScript = {
  cardId: 'ST36-004',
  textHash: '0d836847bec537',
  verified: {
    source: 'cards/overrides/ST36-004.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'You may trash 1 {Supernovas} card from your hand: draw 2 cards',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            filter: { type: 'Supernovas' },
            pick: { exactly: 1 },
          },
        },
      ],
      effect: [{ do: { draw: 2 } }],
    },
  ],
};
