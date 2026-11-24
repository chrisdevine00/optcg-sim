import type { CardScript } from '../../src/dsl.ts';

/** OP16-045 Crocodile. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP16_045: CardScript = {
  cardId: 'OP16-045',
  textHash: '0c01ccc44002da',
  verified: {
    source: 'cards/overrides/OP16-045.json (card text in cards/data)',
    date: '2026-11-24',
  },
  keywords: ['Blocker'],
  abilities: [
    {
      id: 'on-play',
      label:
        'You may return 1 of your Characters with a cost of 2 or more to the hand: play up to 1 {Impel Down} Character with a cost of 2 or less from your hand',
      kind: 'auto',
      when: ['onPlay'],
      cost: [
        {
          move: {
            from: 'characters',
            owner: 'you',
            filter: {
              cost: {
                gte: 2,
              },
            },
            pick: {
              exactly: 1,
            },
          },
          to: {
            zone: 'hand',
          },
        },
      ],
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
                      type: 'Impel Down',
                    },
                    {
                      cost: {
                        lte: 2,
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
        },
      ],
    },
  ],
};
