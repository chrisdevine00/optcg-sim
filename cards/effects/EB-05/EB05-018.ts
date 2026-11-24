import type { CardScript } from '../../src/dsl.ts';

/** EB05-018 Rebecca. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const EB05_018: CardScript = {
  cardId: 'EB05-018',
  textHash: '10295f2ab8716d',
  verified: {
    source: 'cards/overrides/EB05-018.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "Up to 1 of your opponent's rested Characters with a cost of 6 or less will not become active in your opponent's next Refresh Phase",
      kind: 'auto',
      when: ['onPlay'],
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
                      lte: 6,
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
    "DECISIONS 2026-11-16 G26: skipRefresh lasts through the opponent's next Refresh Phase only",
  ],
};
