import type { CardScript } from '../../src/dsl.ts';

/** EB05-022 Octopako. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_022: CardScript = {
  cardId: 'EB05-022',
  textHash: '12339b1d928aad',
  verified: {
    source: 'cards/overrides/EB05-022.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-ko',
      label: 'Draw 2 cards',
      kind: 'auto',
      when: ['onKO'],
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
