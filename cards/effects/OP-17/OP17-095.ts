import type { CardScript } from '../../src/dsl.ts';

/** OP17-095 Roronoa Zoro. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_095: CardScript = {
  cardId: 'OP17-095',
  textHash: '071a44ab92c686',
  verified: {
    source: 'cards/overrides/OP17-095.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'big-power',
      label: '+3000 power while a Character with a cost of 12 or more exists',
      kind: 'permanent',
      conditions: [
        {
          exists: {
            from: 'characters',
            owner: 'any',
            filter: {
              cost: {
                gte: 12,
              },
            },
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
    {
      id: 'trash-shield',
      label:
        "Place 3 cards from your trash at the bottom of your deck instead of a Character's removal by your opponent's effect",
      kind: 'replacement',
      replaces: {
        leaveField: {
          from: 'characters',
          owner: 'you',
        },
        cause: 'opponentEffect',
      },
      optional: true,
      instead: [
        {
          move: {
            from: 'trash',
            owner: 'you',
            pick: {
              exactly: 3,
            },
          },
          to: {
            zone: 'deck',
            position: 'bottom',
          },
        },
      ],
    },
  ],
  rulings: [
    'QA-OP17 OP17-021, OP17-023 via RL-31: one application may cover simultaneous removals; not tested here',
    'reading: "in any order" is the order picked (DECISIONS 2026-11-16, bottom placement)',
  ],
};
