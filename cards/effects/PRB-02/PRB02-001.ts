import type { CardScript } from '../../src/dsl.ts';

/** PRB02-001 Koby. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const PRB02_001: CardScript = {
  cardId: 'PRB02-001',
  textHash: '14bac20549e63a',
  verified: {
    source: 'cards/overrides/PRB02-001.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'opp-turn-power',
      label: 'Opponent\'s Turn: if your Leader has the "Navy" type, +1000 power',
      kind: 'permanent',
      conditions: [{ opponentsTurn: true }, { leader: { type: 'Navy' } }],
      apply: [{ power: { target: { from: 'self', owner: 'you' }, amount: 1000 } }],
    },
    {
      id: 'when-attacking',
      label:
        "K.O. up to 1 of your opponent's Characters with 3000 base power or less; then, with 6 or less cards in hand, draw 1",
      kind: 'auto',
      when: ['whenAttacking'],
      effect: [
        {
          do: {
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: { basePower: { lte: 3000 } },
              pick: { upTo: 1 },
            },
          },
        },
        {
          if: { cmp: [{ hand: 'you' }, '<=', 6] },
          then: [{ do: { draw: 1 } }],
        },
      ],
    },
  ],
  rulings: [
    'reading: "Then, if you have 6 or less cards in your hand" is its own condition (not "If you do"), so the draw does not depend on a K.O. happening; the hand is counted after the K.O.',
    'reading: "3000 base power or less" is the printed power (no DON!! or buffs)',
  ],
};
