import type { CardScript } from '../../src/dsl.ts';

/** ST21-010 Nico Robin. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST21_010: CardScript = {
  cardId: 'ST21-010',
  textHash: '045362b2cb87e6',
  verified: {
    source: 'cards/overrides/ST21-010.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'when-attacking',
      label: "[DON!! x2] K.O. up to 1 of your opponent's Characters with 4000 power or less",
      kind: 'auto',
      when: ['whenAttacking'],
      conditions: [{ donGiven: 2 }],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: { power: { lte: 4000 } },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "4000 power or less" is the current power when the target is chosen (given DON!! add nothing on the opponent\'s Characters during your turn); [DON!! x2] needs 2 or more DON!! given to Robin',
  ],
};
