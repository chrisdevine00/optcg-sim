import type { CardScript } from '../../src/dsl.ts';

/** OP14-035 Yosaku. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP14_035: CardScript = {
  cardId: 'OP14-035',
  textHash: '10cee8616c5e8b',
  verified: {
    source: 'cards/overrides/OP14-035.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'rested',
      label:
        "Your Turn: when this Character becomes rested, up to 1 of your opponent's rested Characters with a cost of 4 or less will not become active in the next Refresh Phase",
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
            skipRefresh: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                all: [
                  {
                    state: 'rested',
                  },
                  {
                    cost: {
                      lte: 4,
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
  rulings: [
    'Reading (M6b-Q10): any active-to-rested change of this Character during your turn fires it: an attack declaration, a cost, an effect (not the Refresh Phase)',
  ],
};
