import type { CardScript } from '../../src/dsl.ts';

/** OP14-002 Urouge. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_002: CardScript = {
  cardId: 'OP14-002',
  textHash: '0fe713bcd2f8f2',
  verified: {
    source: 'cards/overrides/OP14-002.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'when-attacking',
      label:
        "If this has 5000 power or more, draw 1 and K.O. up to 1 of the opponent's Characters with 3000 base power or less",
      kind: 'auto',
      when: ['whenAttacking'],
      conditions: [
        {
          self: {
            power: {
              gte: 5000,
            },
          },
        },
      ],
      effect: [
        {
          do: {
            draw: 1,
          },
        },
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                basePower: {
                  lte: 3000,
                },
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "5000 power or more" is the CURRENT power (given DON!!, timed boosts count), checked when the ability triggers and again as it resolves; draw 1 and the K.O. are both mandatory ("and", not "then ... may"); the K.O. reads BASE power',
  ],
};
