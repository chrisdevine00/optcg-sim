import type { CardScript } from '../../src/dsl.ts';

/** OP18-030 Nami. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_030: CardScript = {
  cardId: 'OP18-030',
  textHash: '0c53f969ca0726',
  verified: {
    source: 'cards/overrides/OP18-030.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'rested-weaker',
      label: "[Opponent's Turn] If this Character is rested, give this Character -2000 power",
      kind: 'permanent',
      conditions: [{ opponentsTurn: true }, { self: { state: 'rested' } }],
      apply: [{ power: { target: { from: 'self', owner: 'you' }, amount: -2000 } }],
    },
  ],
  rulings: [
    "reading: continuous while the condition holds (not a one-time debuff): it applies as soon as Nami is rested on the opponent's turn and stops when she becomes active or the turn ends",
  ],
};
