import type { CardScript } from '../../src/dsl.ts';

/** OP18-054 Mr.8 & Ms. Monday. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_054: CardScript = {
  cardId: 'OP18-054',
  textHash: '01973aef74c265',
  verified: {
    source: 'cards/overrides/OP18-054.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'boost',
      label: '[DON!! x1] This Character gains +1000 power',
      kind: 'permanent',
      conditions: [{ donGiven: 1 }],
      apply: [{ power: { target: { from: 'self', owner: 'you' }, amount: 1000 } }],
    },
    {
      id: 'shield',
      label:
        'Opponent\'s turn, once per turn: if your Character with a type including "Baroque Works" would be removed from the field by your opponent\'s effect, you may trash 1 card from your hand instead',
      kind: 'replacement',
      oncePerTurn: true,
      conditions: [{ opponentsTurn: true }],
      replaces: {
        leaveField: { from: 'characters', owner: 'you', filter: { typeIncludes: 'Baroque Works' } },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [{ trash: { from: 'hand', owner: 'you', pick: { exactly: 1 } } }],
    },
  ],
  rulings: [
    'reading (M6b audit Q4): the replacement covers Mr.8 himself (no "other than this Character"); the [DON!! x1] power line is separate and not a condition of it',
  ],
};
