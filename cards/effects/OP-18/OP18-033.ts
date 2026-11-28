import type { CardScript } from '../../src/dsl.ts';

/** OP18-033 Banban. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_033: CardScript = {
  cardId: 'OP18-033',
  textHash: '06976f95cf2c47',
  verified: {
    source: 'cards/overrides/OP18-033.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'end',
      label: 'You may trash this Character: set up to 1 of your Characters as active',
      kind: 'auto',
      when: ['endOfYourTurn'],
      cost: [{ trashSelf: true }],
      effect: [{ do: { setActive: { from: 'characters', owner: 'you', pick: { upTo: 1 } } } }],
    },
  ],
  rulings: [
    'reading: the cost trashes Banban first, so the set-active picks among the other Characters; no Once Per Turn',
  ],
};
