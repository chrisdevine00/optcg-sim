import type { CardScript } from '../../src/dsl.ts';

/** OP09-065 Sanji. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_065: CardScript = {
  cardId: 'OP09-065',
  textHash: '175adefc423fd4',
  verified: {
    source: 'cards/overrides/OP09-065.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "You may return 1 or more DON!! cards from your field to your DON!! deck: this Character gains [Rush] during this turn; then rest up to 1 of your opponent's Characters with a cost of 6 or less",
      kind: 'auto',
      when: ['onPlay'],
      cost: [{ returnDon: { atLeast: 1 } }],
      effect: [
        {
          do: {
            grant: {
              target: { from: 'self', owner: 'you' },
              keyword: 'Rush',
              duration: 'thisTurn',
            },
          },
        },
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: { cost: { lte: 6 } },
              pick: { upTo: 1 },
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: the cost 1 or more is a count choice then which DON!!; "Then" is not "if you do": Rush is granted first and the rest follows; "cost of 6 or less" never matches a Leader (Characters only)',
  ],
};
