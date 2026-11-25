import type { CardScript } from '../../src/dsl.ts';

/** OP09-068 Tony Tony.Chopper. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_068: CardScript = {
  cardId: 'OP09-068',
  textHash: '0077b8b0e41f31',
  verified: {
    source: 'cards/overrides/OP09-068.json (card text in cards/data)',
    date: '2026-11-25',
  },
  abilities: [
    {
      id: 'end',
      label:
        "You may return 1 or more DON!! cards from your field to your DON!! deck: set this Character as active; then it gains [Blocker] until the end of your opponent's next turn",
      kind: 'auto',
      when: ['endOfYourTurn'],
      cost: [{ returnDon: { atLeast: 1 } }],
      effect: [
        { do: { setActive: { from: 'self', owner: 'you' } } },
        {
          do: {
            grant: {
              target: { from: 'self', owner: 'you' },
              keyword: 'Blocker',
              duration: 'untilEndOfOpponentsNextTurn',
            },
          },
        },
      ],
    },
  ],
  rulings: [
    'reading: "Then" is not "if you do"; the Blocker lasts until the end of the opponent\'s next turn whether or not the set-active changed anything',
  ],
};
