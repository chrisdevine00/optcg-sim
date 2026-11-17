import type { CardScript } from '../../src/dsl.ts';

/** OP17-112 Charlotte Linlin. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP17_112: CardScript = {
  cardId: 'OP17-112',
  textHash: '0157b95eced09f',
  verified: {
    source: 'cards/overrides/OP17-112.json (card text in cards/data)',
    date: '2026-11-16',
  },
  abilities: [
    {
      id: 'eight-thousand',
      label: 'Your Characters with a [Trigger] and 4000 base power have 8000 base power',
      kind: 'permanent',
      conditions: [
        {
          yourTurn: true,
        },
      ],
      apply: [
        {
          setBasePower: {
            target: {
              from: 'characters',
              owner: 'you',
              filter: {
                all: [
                  {
                    hasTrigger: true,
                  },
                  {
                    basePower: {
                      eq: 4000,
                    },
                  },
                ],
              },
            },
            value: 8000,
          },
        },
      ],
    },
    {
      id: 'on-play',
      label:
        "Draw 1, then choose: add 1 deck card to your Life, or add 1 of your opponent's Life to their hand",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            draw: 1,
          },
        },
        {
          chooseOne: [
            [
              {
                do: {
                  move: {
                    what: {
                      from: 'deckTop',
                      owner: 'you',
                      pick: {
                        upTo: 1,
                      },
                    },
                    to: {
                      zone: 'life',
                      position: 'top',
                    },
                  },
                },
              },
            ],
            [
              {
                do: {
                  move: {
                    what: {
                      from: 'lifeTop',
                      owner: 'opponent',
                      pick: {
                        upTo: 1,
                      },
                    },
                    to: {
                      zone: 'hand',
                    },
                  },
                },
              },
            ],
          ],
          labels: [
            'Add the top card of your deck to your Life',
            "Add the top of your opponent's Life to their hand",
          ],
          neutral: [
            "Charlotte Linlin's player adds the top card of their deck to their Life.",
            "Charlotte Linlin's player adds the top of the opponent's Life to their hand.",
          ],
        },
      ],
    },
  ],
};
