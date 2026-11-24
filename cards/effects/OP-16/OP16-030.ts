import type { CardScript } from '../../src/dsl.ts';

/** OP16-030 Trafalgar Law. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_030: CardScript = {
  cardId: 'OP16-030',
  textHash: '120f4b4c655415',
  verified: {
    source: 'cards/overrides/OP16-030.json (card text in cards/data)',
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
      id: 'end-of-turn',
      label: 'Set all of your green Characters with a cost of 5 or less as active',
      kind: 'auto',
      when: ['endOfYourTurn'],
      effect: [
        {
          do: {
            setActive: {
              from: 'characters',
              owner: 'you',
              filter: {
                all: [
                  {
                    color: 'Green',
                  },
                  {
                    cost: {
                      lte: 5,
                    },
                  },
                ],
              },
            },
          },
        },
      ],
    },
  ],
};
