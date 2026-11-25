import type { CardScript } from '../../src/dsl.ts';

/** OP10-024 Edward.Newgate. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP10_024: CardScript = {
  cardId: 'OP10-024',
  textHash: '10e7fc38f101d2',
  verified: {
    source: 'cards/overrides/OP10-024.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "If you have 2 or more rested Characters, rest up to 1 of your opponent's Characters with a cost of 5 or less; then K.O. up to 1 of your opponent's rested Characters with a cost of 3 or less",
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          if: {
            cmp: [
              {
                count: {
                  from: 'characters',
                  owner: 'you',
                  filter: {
                    state: 'rested',
                  },
                },
              },
              '>=',
              2,
            ],
          },
          then: [
            {
              do: {
                rest: {
                  from: 'characters',
                  owner: 'opponent',
                  filter: {
                    cost: {
                      lte: 5,
                    },
                  },
                  pick: {
                    upTo: 1,
                  },
                },
              },
            },
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
    },
  ],
  rulings: [
    'reading: "Then" sits inside the condition (a failed If does not resolve it); the K.O. is chosen after the rest, so a Character just rested (cost 3 or less) can be K.O.\'d',
  ],
};
