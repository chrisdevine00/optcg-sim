import type { CardScript } from '../../src/dsl.ts';

/** OP11-028 Lord of the Coast. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP11_028: CardScript = {
  cardId: 'OP11-028',
  textHash: '04b0920ae6d0ad',
  verified: {
    source: 'cards/overrides/OP11-028.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Up to 1 of your opponent's rested Characters will not become active in your opponent's next Refresh Phase",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            skipRefresh: {
              from: 'characters',
              owner: 'opponent',
              filter: {
                state: 'rested',
              },
              pick: {
                upTo: 1,
              },
            },
          },
        },
      ],
    },
    {
      id: 'trigger',
      label: "K.O. up to 1 of your opponent's rested Characters with a cost of 3 or less",
      kind: 'trigger',
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
                      lte: 3,
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
