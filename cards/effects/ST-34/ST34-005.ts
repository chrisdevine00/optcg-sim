import type { CardScript } from '../../src/dsl.ts';

/** ST34-005 Baron Tamago & Pekoms. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST34_005: CardScript = {
  cardId: 'ST34-005',
  textHash: '004770a1cc31f6',
  verified: {
    source: 'cards/overrides/ST34-005.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'when-attacking',
      label: "DON!! -1: K.O. up to 1 of your opponent's Characters with 2000 base power or less",
      kind: 'auto',
      when: ['whenAttacking'],
      cost: [{ donMinus: 1 }],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: { basePower: { lte: 2000 } },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
};
