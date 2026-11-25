import type { CardScript } from '../../src/dsl.ts';

/** OP12-021 Ipponmatsu. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_021: CardScript = {
  cardId: 'OP12-021',
  textHash: '1f24ddfc6cebdd',
  verified: {
    source: 'cards/overrides/OP12-021.json (card text in cards/data)',
    date: '2026-11-25',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'guard',
      label:
        "If your Leader has the <Slash> attribute and you have 6 or more rested DON!! cards, this Character cannot be rested by your opponent's effects",
      kind: 'permanent',
      conditions: [
        { leader: { attribute: 'Slash' } },
        { cmp: [{ donOnField: 'you', state: 'rested' }, '>=', 6] },
      ],
      apply: [
        {
          restrict: {
            target: { from: 'self', owner: 'you' },
            what: { cannotBeRested: { by: 'opponentEffect' } },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "6 or more rested DON!! cards" counts the rested DON!! of your cost area (given DON!! are neither active nor rested); 6 is in, 5 is out; <Slash> is your Leader\'s printed attribute; only your opponent\'s effects are stopped (your own effects, a rest cost, an attack and a block are not)',
  ],
};
