import type { CardScript } from '../../src/dsl.ts';

/** OP15-111 Mont Blanc Noland. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_111: CardScript = {
  cardId: 'OP15-111',
  textHash: '1f4de7b27d45aa',
  verified: {
    source: 'cards/overrides/OP15-111.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'when-attacking',
      label: '[DON!! x1] Up to 1 of your [Kalgara] cards gains [Rush] during this turn',
      kind: 'auto',
      when: ['whenAttacking'],
      conditions: [{ donGiven: 1 }],
      effect: [
        {
          do: {
            grant: {
              target: {
                from: 'characters',
                owner: 'you',
                filter: { name: 'Kalgara' },
                pick: { upTo: 1 },
              },
              keyword: 'Rush',
              duration: 'thisTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "[Kalgara] cards" is read as Characters on the field (a Leader or a card in hand gaining [Rush] has no effect)',
  ],
};
