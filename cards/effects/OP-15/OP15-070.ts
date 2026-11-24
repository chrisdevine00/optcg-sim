import type { CardScript } from '../../src/dsl.ts';

/** OP15-070 Fuza. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_070: CardScript = {
  cardId: 'OP15-070',
  textHash: '013f0fa2fe6451',
  verified: {
    source: 'cards/overrides/OP15-070.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'unblockable',
      label: 'All of your [Shura] cards and this Character gain [Unblockable]',
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
                    name: 'Shura',
                  },
                  {
                    isSelf: true,
                  },
                ],
              },
            },
            keyword: 'Unblockable',
          },
        },
      ],
    },
    {
      id: 'six-thousand',
      label:
        "[Opponent's Turn] All of your [Shura] cards' base power and this Character's base power become 6000",
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
                    name: 'Shura',
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
