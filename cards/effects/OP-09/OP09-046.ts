import type { CardScript } from '../../src/dsl.ts';

/** OP09-046 Crocodile. Scripted from the verified text in cards/data (effect-dsl.md E-D1). */
export const OP09_046: CardScript = {
  cardId: 'OP09-046',
  textHash: '14256ae3392714',
  verified: {
    source: 'cards/overrides/OP09-046.json (card text in cards/data)',
    date: '2026-11-24',
  },
  abilities: [
    {
      id: 'on-play',
      label:
        'Play up to 1 {Cross Guild} Character or Character with a type including "Baroque Works" with a cost of 5 or less from your hand',
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
                      any: [
                        {
                          type: 'Cross Guild',
                        },
                        {
                          typeIncludes: 'Baroque Works',
                        },
                      ],
                    },
                    {
                      cost: {
                        lte: 5,
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
  rulings: [
    'reading: "cost of 5 or less" qualifies both type options, inclusive; Characters only; the played card comes in active',
  ],
};
