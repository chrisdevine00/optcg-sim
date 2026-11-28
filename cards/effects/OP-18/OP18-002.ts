import type { CardScript } from '../../src/dsl.ts';

/** OP18-002 Igaram. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_002: CardScript = {
  cardId: 'OP18-002',
  textHash: '0b0e82ca39821e',
  verified: {
    source: 'cards/overrides/OP18-002.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'You may trash 1 {Alabasta} card from your hand: draw 2 cards',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          trash: {
            from: 'hand',
            owner: 'you',
            filter: {
              type: 'Alabasta',
            },
            pick: {
              exactly: 1,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            draw: 2,
          },
        },
      ],
    },
  ],
};
