import type { CardScript } from '../../src/dsl.ts';

/** ST18-003 San-Gorou. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST18_003: CardScript = {
  cardId: 'ST18-003',
  textHash: '0ac5314d2bcdff',
  verified: {
    source: 'cards/overrides/ST18-003.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'when-attacking',
      label: 'If you have 8 or more DON!! cards on your field, draw 1 card',
      kind: 'auto',
      when: ['whenAttacking'],
      oncePerTurn: true,
      effect: [
        {
          if: { cmp: [{ donOnField: 'you' }, '>=', 8] },
          then: [{ do: { draw: 1 } }],
        },
      ],
    },
  ],
  rulings: [
    'reading: "If" has no colon, so it is an effect condition (B3A-R1): the ability triggers and spends Once Per Turn even with fewer than 8 DON!!, and nothing happens',
  ],
};
