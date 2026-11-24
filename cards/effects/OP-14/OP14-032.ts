import type { CardScript } from '../../src/dsl.ts';

/** OP14-032 Humandrill. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_032: CardScript = {
  cardId: 'OP14-032',
  textHash: '06f523c2230f9f',
  verified: {
    source: 'cards/overrides/OP14-032.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'rested',
      label:
        "Your turn, when this becomes rested: rest up to 1 of the opponent's Characters with a cost of 4 or less",
      kind: 'auto',
      when: [
        {
          event: 'rested',
          owner: 'you',
          filter: {
            isSelf: true,
          },
        },
      ],
      conditions: [
        {
          yourTurn: true,
        },
      ],
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                cost: {
                  lte: 4,
                },
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
  ],
};
