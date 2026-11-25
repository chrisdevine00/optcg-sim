import type { CardScript } from '../../src/dsl.ts';

/** ST21-002 Usopp. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST21_002: CardScript = {
  cardId: 'ST21-002',
  textHash: '179d480451f0ff',
  verified: {
    source: 'cards/overrides/ST21-002.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'opp-turn-power',
      label: "[DON!! x2] [Opponent's Turn] This Character gains +2000 power",
      kind: 'permanent',
      conditions: [{ donGiven: 2 }, { opponentsTurn: true }],
      apply: [{ power: { target: { from: 'self', owner: 'you' }, amount: 2000 } }],
    },
  ],
};
