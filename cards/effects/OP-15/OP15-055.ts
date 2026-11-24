import type { CardScript } from '../../src/dsl.ts';

/** OP15-055 Go Ahead and Use 'Em, Mr. Luffy!!!. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_055: CardScript = {
  cardId: 'OP15-055',
  textHash: '04bca57822fb0d',
  verified: {
    source: 'cards/overrides/OP15-055.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'main',
      label: 'Choose one',
      kind: 'activate',
      when: 'main',
      effect: [
        {
          chooseOne: [
            [
              {
                do: {
                  draw: 2,
                },
              },
            ],
            [
              {
                do: {
                  grant: {
                    target: {
                      from: 'characters',
                      owner: 'you',
                      filter: {
                        type: 'Dressrosa',
                      },
                      pick: {
                        upTo: 1,
                      },
                    },
                    keyword: 'Blocker',
                    duration: 'untilEndOfOpponentsNextTurn',
                  },
                },
              },
            ],
          ],
          labels: [
            'Draw 2 cards',
            "Up to 1 of your {Dressrosa} Characters gains [Blocker] until the end of your opponent's next End Phase",
          ],
        },
      ],
    },
  ],
};
