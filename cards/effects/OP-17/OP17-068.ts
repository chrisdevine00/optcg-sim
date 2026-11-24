import type { CardScript } from '../../src/dsl.ts';

/** OP17-068 Sasaki. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_068: CardScript = {
  cardId: 'OP17-068',
  textHash: '0d4fcb621b9b00',
  verified: {
    source: 'cards/overrides/OP17-068.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'when-attacking',
      label:
        'Trash 2 cards from your hand: with an {Animal Kingdom Pirates} Leader, add up to 2 rested DON!!',
      kind: 'auto',
      when: ['whenAttacking'],
      cost: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 2 } } }],
      effect: [
        {
          if: { leader: { type: 'Animal Kingdom Pirates' } },
          then: [{ do: { addDon: [{ n: 2, state: 'rested', upTo: true }] } }],
        },
      ],
    },
  ],
  rulings: [
    'reading: the Leader type is an "if" in the effect, so the 2 cards are trashed even with another Leader type (the cost is before the colon)',
    'engine note E-Q11: "add up to 2 DON!!" always adds the full amount available (OPEN-QUESTIONS E-Q11)',
  ],
};
