import type { CardScript } from '../../src/dsl.ts';

/** OP14-106 Salome. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_106: CardScript = {
  cardId: 'OP14-106',
  textHash: '1bd13956a4001b',
  verified: {
    source: 'cards/overrides/OP14-106.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'trigger',
      label: 'Play this card',
      kind: 'trigger',
      effect: [{ do: { play: { what: { from: 'self', owner: 'you' } } } }],
    },
  ],
};
