import type { CardScript } from '../../src/dsl.ts';

/** ST21-011 Franky. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const ST21_011: CardScript = {
  cardId: 'ST21-011',
  textHash: '1e605f891e7f0d',
  verified: {
    source: 'cards/overrides/ST21-011.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'opp-turn-power',
      label:
        "[DON!! x2] [Opponent's Turn] All of your {Straw Hat Crew} Characters with 4000 base power or less gain +1000 power",
      kind: 'permanent',
      conditions: [{ donGiven: 2 }, { opponentsTurn: true }],
      apply: [
        {
          power: {
            target: {
              from: 'characters',
              owner: 'you',
              filter: { all: [{ type: 'Straw Hat Crew' }, { basePower: { lte: 4000 } }] },
            },
            amount: 1000,
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "all of your Characters" includes Franky himself (4000 base); the 4000 is the printed base power (a Character buffed above 4000 still qualifies, one with a base of 5000 never does)',
  ],
};
