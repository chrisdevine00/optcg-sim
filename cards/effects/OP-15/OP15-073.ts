import type { CardScript } from '../../src/dsl.ts';

/** OP15-073 Yama. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP15_073: CardScript = {
  cardId: 'OP15-073',
  textHash: '0f19107c3de306',
  verified: {
    source: 'cards/overrides/OP15-073.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        'Play up to 1 [Heavenly Warriors] with a cost of 1 or up to 1 {Vassals} Character with a cost of 1 from your hand',
      kind: 'auto',
      when: ['onPlay'],
      effect: [
        {
          do: {
            play: {
              what: {
                from: 'hand',
                owner: 'you',
                filter: {
                  all: [
                    {
                      category: ['Character'],
                    },
                    {
                      cost: {
                        eq: 1,
                      },
                    },
                    {
                      any: [
                        {
                          name: 'Heavenly Warriors',
                        },
                        {
                          type: 'Vassals',
                        },
                      ],
                    },
                  ],
                },
                pick: {
                  upTo: 1,
                },
              },
            },
          },
        },
      ],
    },
  ],
};
