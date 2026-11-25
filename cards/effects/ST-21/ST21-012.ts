import type { CardScript } from '../../src/dsl.ts';

/** ST21-012 Brook. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST21_012: CardScript = {
  cardId: 'ST21-012',
  textHash: '17fb9ad5fa1997',
  verified: {
    source: 'cards/overrides/ST21-012.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'when-attacking',
      label: 'Give up to 2 rested DON!! cards to your Leader or 1 of your Characters',
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          do: {
            giveDon: {
              n: 2,
              state: 'rested',
              to: { from: ['leader', 'characters'], owner: 'you', pick: { exactly: 1 } },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "up to 2" asks a count (most first); all the DON!! go to one card (the Leader or 1 Character), which may be Brook himself',
  ],
};
