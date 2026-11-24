import type { CardScript } from '../../src/dsl.ts';

/** OP15-018 Mohji. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_018: CardScript = {
  cardId: 'OP15-018',
  textHash: '14721ec46ff6dd',
  verified: {
    source: 'cards/overrides/OP15-018.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'when-attacking',
      label:
        "K.O. up to 1 of your opponent's Characters with 3000 power or less with a DON!! card given",
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: { all: [{ power: { lte: 3000 } }, { donGiven: { gte: 1 } }] },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "3000 power or less" is current power (printed power plus modifiers); on your turn the opponent\'s given DON!! add nothing to their Characters, so the base-plus-effects value is compared',
  ],
};
