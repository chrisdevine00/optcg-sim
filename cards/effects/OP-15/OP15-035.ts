import type { CardScript } from '../../src/dsl.ts';

/** OP15-035 Laboon. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_035: CardScript = {
  cardId: 'OP15-035',
  textHash: '0cb9a33ab6250a',
  verified: {
    source: 'cards/overrides/OP15-035.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'rest-shield',
      label: 'Rest 2 of your cards instead',
      kind: 'replacement',
      replaces: {
        leaveField: {
          from: 'characters',
          owner: 'you',
          filter: {
            basePower: {
              lte: 7000,
            },
          },
        },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [
        {
          rest: {
            from: ['leader', 'characters', 'stage', 'donCostArea'],
            owner: 'you',
            pick: {
              exactly: 2,
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "your cards" are the Leader, Characters, Stage and active cost-area DON!! (CR 1-3-2-1: only active cards can be rested); Laboon may rest itself',
  ],
};
