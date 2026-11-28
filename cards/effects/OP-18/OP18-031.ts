import type { CardScript } from '../../src/dsl.ts';

/** OP18-031 Nico Robin. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_031: CardScript = {
  cardId: 'OP18-031',
  textHash: '0b6ba4432cf70e',
  verified: {
    source: 'cards/overrides/OP18-031.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'cover',
      label:
        "Opponent's turn: if your Character would be removed from the field by your opponent's effect, you may rest this Character instead",
      kind: 'replacement',
      conditions: [{ opponentsTurn: true }],
      replaces: {
        leaveField: { from: 'characters', owner: 'you' },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [{ restSelf: true }],
    },
    {
      id: 'end',
      label:
        'Set up to 1 of your {Water Seven} type cards and up to 1 of your DON!! cards as active',
      kind: 'auto',
      when: ['endOfYourTurn'],
      effect: [
        {
          do: {
            setActive: {
              from: ['leader', 'characters', 'stage'],
              owner: 'you',
              filter: { type: 'Water Seven' },
              pick: { upTo: 1 },
            },
          },
        },
        { do: { setActive: { from: 'donCostArea', owner: 'you', pick: { upTo: 1 } } } },
      ],
    },
  ],
  rulings: [
    'reading: "your Character" includes this Character (it may rest itself instead of leaving); a rested Robin cannot pay (as OP10-032); no Once Per Turn',
  ],
};
