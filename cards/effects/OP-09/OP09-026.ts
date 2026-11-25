import type { CardScript } from '../../src/dsl.ts';

/** OP09-026 Sakazuki. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_026: CardScript = {
  cardId: 'OP09-026',
  textHash: '0e7c089a2e19c5',
  verified: {
    source: 'cards/overrides/OP09-026.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        "If you have 2 or more rested Characters, K.O. up to 1 of your opponent's Characters with a cost of 5 or less",
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
                ko: {
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
          ],
        },
      ],
    },
  ],
};
