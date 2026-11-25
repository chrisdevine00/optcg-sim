import type { CardScript } from '../../src/dsl.ts';

/** PRB02-014 Sabo. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const PRB02_014: CardScript = {
  cardId: 'PRB02-014',
  textHash: '1e4fee90afdc03',
  verified: {
    source: 'cards/overrides/PRB02-014.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'cheaper',
      label: 'In hand: with 15 or more cards in your trash, -3 cost',
      kind: 'permanent',
      zone: 'hand',
      conditions: [{ cmp: [{ trash: 'you' }, '>=', 15] }],
      apply: [{ cost: { target: { from: 'self', owner: 'you' }, amount: -3 } }],
    },
  ],
  rulings: [
    'reading: "give this card in your hand -3 cost" is a hand-zone continuous cost change; the trash count (15 exactly qualifies) is read when the card is played',
  ],
};
