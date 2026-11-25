import type { CardScript } from '../../src/dsl.ts';

/** OP10-042 Usopp. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_042: CardScript = {
  cardId: 'OP10-042',
  textHash: '0f6413701fe7d2',
  verified: {
    source: 'cards/overrides/OP10-042.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'dressrosa-cost',
      label: 'Your "Dressrosa" Characters with a cost of 2 or more gain +1 cost',
      kind: 'permanent',
      apply: [
        {
          cost: {
            target: {
              from: 'characters',
              owner: 'you',
              filter: {
                all: [
                  {
                    type: 'Dressrosa',
                  },
                  {
                    cost: {
                      gte: 2,
                    },
                  },
                ],
              },
            },
            amount: 1,
          },
        },
      ],
    },
    {
      id: 'removed',
      label:
        "Opponent's turn, once per turn: when your \"Dressrosa\" Character is removed by your opponent's effect or K.O.'d, with 5 or less cards in hand, draw 1 card",
      kind: 'auto',
      when: [
        {
          event: 'removed',
          owner: 'you',
          filter: {
            all: [
              {
                category: ['Character'],
              },
              {
                type: 'Dressrosa',
              },
            ],
          },
          cause: 'opponentEffect',
        },
        {
          event: 'koed',
          filter: {
            type: 'Dressrosa',
          },
        },
      ],
      conditions: [
        {
          opponentsTurn: true,
        },
      ],
      oncePerTurn: true,
      effect: [
        {
          if: {
            cmp: [
              {
                hand: 'you',
              },
              '<=',
              5,
            ],
          },
          then: [
            {
              do: {
                draw: 1,
              },
            },
          ],
        },
      ],
    },
  ],
  rulings: [
    'reading: the +1 cost applies to a Character whose cost is 2 or more before this effect (the cost stage reads the earlier values), so a cost-1 Dressrosa Character stays at 1',
    "reading: \"removed by your opponent's effect or K.O.'d\" is two timings sharing one Once Per Turn: a removal by the opponent's effect (any move off the field) or a K.O. of any cause (a battle K.O. included); one event that is both is one activation",
    'reading: "If you have 5 or less cards in your hand" follows no colon: an effect condition checked when it resolves (Once Per Turn is spent either way)',
  ],
};
