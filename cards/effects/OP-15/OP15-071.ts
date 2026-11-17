import type { CardScript } from '../../src/dsl.ts';

/** OP15-071 Holly. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_071: CardScript = {
  cardId: 'OP15-071',
  textHash: '0a374891c0cad8',
  verified: {
    source: 'cards/overrides/OP15-071.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'double',
      label: 'Your [Ohm] cards and this Character gain [Double Attack]',
      kind: 'permanent',
      apply: [
        {
          grant: {
            target: {
              from: 'characters',
              owner: 'you',
              filter: {
                any: [
                  {
                    name: 'Ohm',
                  },
                  {
                    isSelf: true,
                  },
                ],
              },
            },
            keyword: 'Double Attack',
          },
        },
      ],
    },
    {
      id: 'six-thousand',
      label: "[Opponent's Turn] Your [Ohm] cards' and this Character's base power become 6000",
      kind: 'permanent',
      conditions: [
        {
          opponentsTurn: true,
        },
      ],
      apply: [
        {
          setBasePower: {
            target: {
              from: 'characters',
              owner: 'you',
              filter: {
                any: [
                  {
                    name: 'Ohm',
                  },
                  {
                    isSelf: true,
                  },
                ],
              },
            },
            value: 6000,
          },
        },
      ],
    },
  ],
};
