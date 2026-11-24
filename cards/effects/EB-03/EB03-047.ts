import type { CardScript } from '../../src/dsl.ts';

/** EB03-047 Miss.Valentine(Mikita). Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB03_047: CardScript = {
  cardId: 'EB03-047',
  textHash: '1ecba0c761d313',
  verified: {
    source: 'cards/overrides/EB03-047.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label: 'Trash 3 cards from the top of your deck',
      kind: 'auto',
      when: ['onPlay'],
      effect: [{ do: { mill: { player: 'you', n: 3 } } }],
    },
    {
      id: 'on-ko',
      label: 'Draw 1 card',
      kind: 'auto',
      when: ['onKO'],
      effect: [{ do: { draw: 1 } }],
    },
  ],
};
