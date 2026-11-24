import type { CardScript } from '../../src/dsl.ts';

/** OP12-102 Shirahoshi. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP12_102: CardScript = {
  cardId: 'OP12-102',
  textHash: '0e6ea156e01acd',
  verified: {
    source: 'cards/overrides/OP12-102.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'life-shield',
      label:
        "If your Character with base cost 6 or less would be removed from the field by your opponent's effect, you may turn 1 top Life card face-up instead",
      kind: 'replacement',
      optional: true,
      replaces: {
        leaveField: {
          from: 'characters',
          owner: 'you',
          filter: {
            baseCost: {
              lte: 6,
            },
          },
        },
        cause: 'opponentEffect',
      },
      instead: [
        {
          turnLifeFaceUp: 1,
        },
      ],
    },
    {
      id: 'neptunian-power',
      label:
        "[Opponent's Turn] With no other [Shirahoshi] of base cost 2, your Neptunian Characters gain +2000 power",
      kind: 'permanent',
      conditions: [
        {
          opponentsTurn: true,
        },
        {
          none: {
            from: 'characters',
            owner: 'you',
            filter: {
              all: [
                {
                  name: 'Shirahoshi',
                },
                {
                  baseCost: {
                    eq: 2,
                  },
                },
                {
                  isSelf: false,
                },
              ],
            },
          },
        },
      ],
      apply: [
        {
          power: {
            target: {
              from: 'characters',
              owner: 'you',
              filter: {
                type: 'Neptunian',
              },
            },
            amount: 2000,
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "your Character" includes this card; the replacement is offered only when the top Life card is face-down (turning a face-up card face-up is not an action, CR 1-3-2-1), so a face-up top Life card cannot pay for it',
  ],
};
