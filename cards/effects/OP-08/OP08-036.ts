import type { CardScript } from '../../src/dsl.ts';

/** OP08-036 Electrical Luna. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP08_036: CardScript = {
  cardId: 'OP08-036',
  textHash: '1e77ede8459df5',
  verified: {
    source: 'cards/overrides/OP08-036.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'main',
      label:
        "Opponent's rested Characters with a cost of 7 or less will not become active in their next Refresh Phase",
      kind: 'activate',
      when: 'main',
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
                      lte: 7,
                    },
                  },
                ],
              },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: "Rest up to 1 of your opponent's Characters",
      kind: 'trigger',
      effect: [
        {
          do: {
            rest: {
              from: 'characters',
              owner: 'opponent',
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
