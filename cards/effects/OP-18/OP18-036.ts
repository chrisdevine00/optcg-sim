import type { CardScript } from '../../src/dsl.ts';

/** OP18-036 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_036: CardScript = {
  cardId: 'OP18-036',
  textHash: '076a5a98fa3e1b',
  verified: {
    source: 'cards/overrides/OP18-036.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'end',
      label: 'You may trash this Character: draw 1 card and set your Leader as active',
      kind: 'auto',
      when: ['endOfYourTurn'],
      cost: [{ trashSelf: true }],
      effect: [{ do: { draw: 1 } }, { do: { setActive: { from: 'leader', owner: 'you' } } }],
    },
  ],
};
