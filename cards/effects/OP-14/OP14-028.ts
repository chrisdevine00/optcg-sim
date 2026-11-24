import type { CardScript } from '../../src/dsl.ts';

/** OP14-028 Johnny. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_028: CardScript = {
  cardId: 'OP14-028',
  textHash: '186248c4340d27',
  verified: {
    source: 'cards/overrides/OP14-028.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'rested',
      label:
        "Your turn, when this becomes rested: K.O. up to 1 of the opponent's rested Characters with a cost of 2 or less",
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
            ko: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                all: [
                  {
                    state: 'rested',
                  },
                  {
                    cost: {
                      lte: 2,
                    },
                  },
                ],
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
