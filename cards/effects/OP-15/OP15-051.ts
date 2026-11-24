import type { CardScript } from '../../src/dsl.ts';

/** OP15-051 Monkey.D.Luffy. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_051: CardScript = {
  cardId: 'OP15-051',
  textHash: '1fb51871d06dd9',
  verified: {
    source: 'cards/overrides/OP15-051.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'dressrosa',
      label:
        "[Opponent's Turn] If your Leader has the {Dressrosa} type, this Character gains +3000 power",
      kind: 'permanent',
      conditions: [
        {
          opponentsTurn: true,
        },
        {
          leader: {
            type: 'Dressrosa',
          },
        },
      ],
      apply: [
        {
          power: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: 3000,
          },
        },
      ],
    },
  ],
};
