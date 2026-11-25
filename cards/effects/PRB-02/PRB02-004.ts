import type { CardScript } from '../../src/dsl.ts';

/** PRB02-004 Jewelry Bonney. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const PRB02_004: CardScript = {
  cardId: 'PRB02-004',
  textHash: '094b21810100ca',
  verified: {
    source: 'cards/overrides/PRB02-004.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'opp-attack',
      label: 'Once per turn: set up to 1 of your DON!! cards as active',
      kind: 'auto',
      when: ['onOpponentAttack'],
      oncePerTurn: true,
      effect: [
        {
          do: {
            setActive: { from: 'donCostArea', owner: 'you', pick: { upTo: 1 } },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: no cost and no "may" (an "up to 1" pick): with a rested DON!! the engine asks a count (None or 1) as for every "set up to N DON!! as active" (OP14-R2)',
  ],
};
