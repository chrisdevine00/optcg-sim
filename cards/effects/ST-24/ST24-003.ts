import type { CardScript } from '../../src/dsl.ts';

/** ST24-003 Basil Hawkins. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST24_003: CardScript = {
  cardId: 'ST24-003',
  textHash: '07d66a402b502b',
  verified: {
    source: 'cards/overrides/ST24-003.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'end-of-turn',
      label: '[End of Your Turn] Set up to 1 of your DON!! cards as active',
      kind: 'auto',
      when: ['endOfYourTurn'],
      effect: [{ do: { setActive: { from: 'donCostArea', owner: 'you', pick: { upTo: 1 } } } }],
    },
  ],
  rulings: [
    'reading (as EB02-015): "up to 1" is asked as a count (0 or 1) when you have a rested DON!! card; with none there is no prompt',
  ],
};
