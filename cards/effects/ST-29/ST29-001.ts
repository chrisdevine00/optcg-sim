import type { CardScript } from '../../src/dsl.ts';

/** ST29-001 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST29_001: CardScript = {
  cardId: 'ST29-001',
  textHash: '08773d8161a7f8',
  verified: {
    source: 'cards/overrides/ST29-001.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'when-attacking',
      label: 'If you have 2 or less Life cards, draw 1 card and trash 1 card from your hand',
      kind: 'auto',
      when: ['whenAttacking'],
      conditions: [{ cmp: [{ life: 'you' }, '<=', 2] }],
      effect: [
        { do: { draw: 1 } },
        { do: { trashFromHand: { from: 'hand', owner: 'you', pick: { exactly: 1 } } } },
      ],
    },
  ],
  rulings: [
    'reading: the Life condition is checked when the ability triggers and again as it resolves; draw 1 and trash 1 are both mandatory',
  ],
};
