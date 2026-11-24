import type { CardScript } from '../../src/dsl.ts';

/** OP15-091 Margarita. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_091: CardScript = {
  cardId: 'OP15-091',
  textHash: '16eeeff6f9c7dc',
  verified: {
    source: 'cards/overrides/OP15-091.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: "Place up to 1 card from your opponent's trash at the bottom of the owner's deck",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            move: {
              what: { from: 'trash', owner: 'opponent', pick: { upTo: 1 } },
              to: { zone: 'deck', position: 'bottom' },
            },
          },
        },
      ],
    },
  ],
};
