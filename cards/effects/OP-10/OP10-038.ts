import type { CardScript } from '../../src/dsl.ts';

/** OP10-038 Roronoa Zoro. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_038: CardScript = {
  cardId: 'OP10-038',
  textHash: '1fa7be2799938e',
  verified: {
    source: 'cards/overrides/OP10-038.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'boost',
      label: "Opponent's turn: with 2 or more rested Characters, this Character gains +2000 power",
      kind: 'permanent',
      conditions: [
        {
          opponentsTurn: true,
        },
        {
          cmp: [
            {
              count: {
                from: 'characters',
                owner: 'you',
                filter: {
                  state: 'rested',
                },
              },
            },
            '>=',
            2,
          ],
        },
      ],
      apply: [
        {
          power: {
            target: {
              from: 'self',
              owner: 'you',
            },
            amount: 2000,
          },
        },
      ],
    },
  ],
  rulings: ['reading: "2 or more rested Characters" counts this Character too, when it is rested'],
};
