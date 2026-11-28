import type { CardScript } from '../../src/dsl.ts';

/** OP18-011 Nefeltari Vivi. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP18_011: CardScript = {
  cardId: 'OP18-011',
  textHash: '0abf5b026b1e8e',
  verified: {
    source: 'cards/overrides/OP18-011.json (official OP-18 card list, card text in cards/data)',
    date: '2026-11-27',
  },
  abilities: [
    {
      id: 'both-types',
      label: 'Your {Animal} and {Alabasta} Characters gain +1000 power',
      kind: 'permanent',
      apply: [
        {
          power: {
            target: {
              from: 'characters',
              owner: 'you',
              filter: {
                all: [
                  {
                    type: 'Animal',
                  },
                  {
                    type: 'Alabasta',
                  },
                ],
              },
            },
            amount: 1000,
          },
        },
      ],
    },
    {
      id: 'opp-turn',
      label: "[Opponent's Turn] gains [Blocker] and +6000 power",
      kind: 'permanent',
      conditions: [
        {
          opponentsTurn: true,
        },
      ],
      apply: [
        {
          grant: {
            target: {
              from: 'self',
              owner: 'you',
            },
            keyword: 'Blocker',
          },
        },
        {
          power: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: 6000,
          },
        },
      ],
    },
  ],
};
