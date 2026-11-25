import type { CardScript } from '../../src/dsl.ts';

/** PRB02-008 Marco. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const PRB02_008: CardScript = {
  cardId: 'PRB02-008',
  textHash: '1f9f871cba6b9a',
  verified: {
    source: 'cards/overrides/PRB02-008.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-ko',
      label: 'Draw 2 cards',
      kind: 'auto',
      when: ['onKO'],
      effect: [{ do: { draw: 2 } }],
    },
  ],
};
